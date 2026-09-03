import { Request, Response, NextFunction } from 'express';
import { Student } from '../models/Student';
import { AuditLog } from '../models/AuditLog';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { config } from '../config';
import { calculateCGPAFromSemesters } from '../utils/cgpaCalculator';

import { verifyToken } from '../utils/jwt';

// Verification helper for sync authentication
export const verifySyncAuth = async (req: Request): Promise<boolean> => {
  const secretHeader = req.headers['x-sync-secret'] || req.headers['sync-secret'];
  const querySecret = req.query.syncSecret as string;
  const providedSecret = (secretHeader || querySecret || '').toString().trim();

  if (providedSecret && providedSecret === config.GOOGLE_SHEETS_SYNC_SECRET) {
    return true;
  }

  // Also permit authenticated admin / TPO JWT (for clicks from the TPO web UI)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded: any = verifyToken(token);
      if (decoded && (decoded.role === 'admin' || decoded.role === 'tpo')) {
        return true;
      }
    } catch {
      // invalid token
    }
  }

  const user = (req as any).user;
  if (user && user.role === 'admin') {
    return true;
  }

  return false;
};

// Formats student address into single clean string
const formatAddressString = (addressObj?: any): string => {
  if (!addressObj) return '';
  if (typeof addressObj === 'string') return addressObj;
  const parts = [
    addressObj.doorNo,
    addressObj.street,
    addressObj.city,
    addressObj.district,
    addressObj.state,
    addressObj.pincode,
  ].filter(Boolean);
  return parts.join(', ');
};

// Parses flat address string back into structured address object
const parseAddressString = (addrStr?: string) => {
  if (!addrStr || typeof addrStr !== 'string') {
    return { doorNo: '', street: '', city: '', district: '', state: '', pincode: '' };
  }
  const parts = addrStr.split(',').map((p) => p.trim());
  return {
    doorNo: parts[0] || '',
    street: parts[1] || '',
    city: parts[2] || '',
    district: parts[3] || '',
    state: parts[4] || '',
    pincode: parts[5] || '',
  };
};

import { semesterToCode } from '../utils/semesterHelper';

/**
 * 1. GET /api/v1/sync/google-sheets/students
 * Export students from MongoDB to Google Sheets (Master Schema with studentId Primary Key & Pagination)
 */
export const getStudentsForGoogleSheets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!(await verifySyncAuth(req))) {
    return next(new AppError('Unauthorized: Invalid or missing Google Sheets synchronization secret.', 401));
  }

  const { page, limit, all } = req.query;
  const isFetchAll = all === 'true' || all === '1' || (!page && !limit);

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 500;
  const skip = (pageNum - 1) * limitNum;

  const total = await Student.countDocuments({});

  let query = Student.find({}).sort({
    year: 1,
    branch: 1,
    rollNumber: 1,
  });

  if (!isFetchAll) {
    query = query.skip(skip).limit(limitNum);
  }

  const students = await query.lean();

  const formattedStudents = students.map((s: any) => {
    // Ensure CGPA is calculated deterministically
    const calculatedCGPA = calculateCGPAFromSemesters(s.semesterResults);
    const overallCGPA = calculatedCGPA > 0 ? calculatedCGPA : (Number(s.cgpa) || 0);

    // Admission Year derived from batch (e.g. "2022-2026" -> 2022) or year
    let admYear = s.admissionYear;
    if (!admYear && s.batch) {
      const match = s.batch.match(/\d{4}/);
      if (match) admYear = parseInt(match[0], 10);
    }
    if (!admYear) {
      admYear = new Date().getFullYear() - (Number(s.year) || 1) + 1;
    }

    // 30 MASTER FIELDS (Strictly Column 1: studentId as immutable sync key)
    return {
      studentId: s._id.toString(),
      rollNumber: s.rollNumber || '',
      name: s.fullName || '',
      email: s.email || '',
      phone: s.studentMobile || s.phone || '',
      gender: s.gender || '',
      branch: s.branch || '',
      year: Number(s.year) || 1,
      semester: semesterToCode(Number(s.semester) || 1),
      section: s.section || '',
      admissionYear: admYear,
      cgpa: overallCGPA,
      backlogs: Number(s.numberOfBacklogs) || 0,
      parentName: s.fatherGuardianName || s.motherName || '',
      parentPhone: s.fatherGuardianMobile || s.motherMobile || '',
      address: formatAddressString(s.address),
      city: s.address?.city || '',
      state: s.address?.state || '',
      pincode: s.address?.pincode || '',
      placementStatus: s.placementStatus || 'Not Placed',
      placementCompany: s.placementCompany || '',
      placementPackage: s.placementPackage || 0,
      verificationStatus: s.verificationStatus || 'Pending',
      profileCompletion: Number(s.profileCompletion) || 0,
      academicStatus: s.academicStatus || 'Active',
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : '',
      updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : '',
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'SYNCED',
      syncError: '',
    };
  });

  // Log audit action
  try {
    await AuditLog.create({
      userName: 'Google Sheets Integration',
      action: `MongoDB → Google Sheets Sync (${formattedStudents.length} records)`,
      entity: 'Student',
      ipAddress: req.ip || '',
    });
  } catch (err) {
    console.error('Failed to write audit log for sync export:', err);
  }

  res.status(200).json({
    success: true,
    page: isFetchAll ? 1 : pageNum,
    limit: isFetchAll ? total : limitNum,
    total,
    totalPages: isFetchAll ? 1 : Math.ceil(total / limitNum),
    count: formattedStudents.length,
    spreadsheetId: config.GOOGLE_SHEETS_SPREADSHEET_ID,
    syncedAt: new Date().toISOString(),
    students: formattedStudents,
  });
});

/**
 * 2. POST /api/v1/sync/google-sheets/import
 * Import / Sync edited student records from Google Sheets back into MongoDB
 */
export const importStudentsFromGoogleSheets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!(await verifySyncAuth(req))) {
    return next(new AppError('Unauthorized: Invalid or missing Google Sheets synchronization secret.', 401));
  }

  const rawPayload = req.body.students || req.body;
  if (!Array.isArray(rawPayload)) {
    return next(new AppError('Invalid request body. Expected an array of student records.', 400));
  }

  const summary = {
    processed: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    rejected: 0,
    errors: [] as string[],
  };

  for (const row of rawPayload) {
    summary.processed++;

    // Key identifier: Roll Number
    const rawRoll = (row.rollNumber || row['Roll Number'] || '').toString().trim().toUpperCase();
    if (!rawRoll) {
      summary.rejected++;
      summary.errors.push(`Row ${summary.processed}: Missing Roll Number`);
      continue;
    }

    try {
      const student = await Student.findOne({ rollNumber: rawRoll });
      if (!student) {
        summary.rejected++;
        summary.errors.push(`Roll Number "${rawRoll}": Student not found in database. Student creation must occur via Registration.`);
        continue;
      }

      let isChanged = false;

      // Safe field mappings (Never overwrite passwords, IDs, role, verification records)
      const newMobile = (row.studentMobile || row['Student Mobile'] || row.phone || '').toString().trim();
      if (newMobile && newMobile !== student.studentMobile) {
        student.studentMobile = newMobile;
        student.phone = newMobile;
        isChanged = true;
      }

      const newMotherName = (row.motherName || row['Mother Name'] || '').toString().trim();
      if (newMotherName && newMotherName !== student.motherName) {
        student.motherName = newMotherName;
        isChanged = true;
      }

      const newMotherMobile = (row.motherMobile || row['Mother Mobile'] || '').toString().trim();
      if (newMotherMobile && newMotherMobile !== student.motherMobile) {
        student.motherMobile = newMotherMobile;
        isChanged = true;
      }

      const newFatherName = (row.fatherGuardianName || row['Father/Guardian Name'] || '').toString().trim();
      if (newFatherName && newFatherName !== student.fatherGuardianName) {
        student.fatherGuardianName = newFatherName;
        isChanged = true;
      }

      const newFatherMobile = (row.fatherGuardianMobile || row['Father/Guardian Mobile'] || '').toString().trim();
      if (newFatherMobile && newFatherMobile !== student.fatherGuardianMobile) {
        student.fatherGuardianMobile = newFatherMobile;
        isChanged = true;
      }

      const rawAddress = row.address || row['Address'];
      if (rawAddress) {
        const parsedAddr = parseAddressString(rawAddress);
        student.address = parsedAddr as any;
        isChanged = true;
      }

      // Academics: SSC & Inter percentages
      const newSSC = parseFloat(row.sscPercentage || row['SSC Percentage']);
      if (!isNaN(newSSC) && newSSC >= 0 && newSSC <= 100 && newSSC !== student.sscPercentage) {
        student.sscPercentage = newSSC;
        isChanged = true;
      }

      const newInter = parseFloat(row.intermediatePercentage || row['Intermediate/Diploma Percentage']);
      if (!isNaN(newInter) && newInter >= 0 && newInter <= 100) {
        if (student.academicQualification === 'Diploma') {
          if (newInter !== student.diplomaPercentage) {
            student.diplomaPercentage = newInter;
            isChanged = true;
          }
        } else {
          if (newInter !== student.intermediatePercentage) {
            student.intermediatePercentage = newInter;
            isChanged = true;
          }
        }
      }

      // Backlogs
      const newBacklogs = parseInt(row.numberOfBacklogs || row['Number of Backlogs']);
      if (!isNaN(newBacklogs) && newBacklogs >= 0 && newBacklogs !== student.numberOfBacklogs) {
        student.numberOfBacklogs = newBacklogs;
        isChanged = true;
      }

      // Year & Semester
      const newYear = parseInt(row.year || row['Year']);
      if (!isNaN(newYear) && newYear >= 1 && newYear <= 4 && newYear !== student.year) {
        student.year = newYear;
        isChanged = true;
      }

      const newSem = parseInt(row.semester || row['Semester']);
      if (!isNaN(newSem) && newSem >= 1 && newSem <= 8 && newSem !== student.semester) {
        student.semester = newSem;
        isChanged = true;
      }

      // Semester Results 1 to 8
      const semKeys = [
        { sem: 1, key: 'semester1Percentage', alt: 'Semester 1 Percentage' },
        { sem: 2, key: 'semester2Percentage', alt: 'Semester 2 Percentage' },
        { sem: 3, key: 'semester3Percentage', alt: 'Semester 3 Percentage' },
        { sem: 4, key: 'semester4Percentage', alt: 'Semester 4 Percentage' },
        { sem: 5, key: 'semester5Percentage', alt: 'Semester 5 Percentage' },
        { sem: 6, key: 'semester6Percentage', alt: 'Semester 6 Percentage' },
        { sem: 7, key: 'semester7Percentage', alt: 'Semester 7 Percentage' },
        { sem: 8, key: 'semester8Percentage', alt: 'Semester 8 Percentage' },
      ];

      const currentResults: { semester: number; percentage: number }[] = Array.isArray(student.semesterResults)
        ? student.semesterResults.map((r: any) => ({ semester: Number(r.semester), percentage: Number(r.percentage) }))
        : [];
      let semResultsChanged = false;

      for (const item of semKeys) {
        const val = parseFloat(row[item.key] ?? row[item.alt]);
        if (!isNaN(val) && val >= 0 && val <= 100) {
          const existingIdx = currentResults.findIndex((r) => r.semester === item.sem);
          if (existingIdx >= 0) {
            if (currentResults[existingIdx].percentage !== val) {
              currentResults[existingIdx].percentage = val;
              semResultsChanged = true;
            }
          } else if (val > 0) {
            currentResults.push({ semester: item.sem, percentage: val });
            semResultsChanged = true;
          }
        }
      }

      if (semResultsChanged) {
        (student as any).semesterResults = currentResults;
        isChanged = true;
      }

      // Always automatically recalculate CGPA from semester results (Rule 15)
      const recalculatedCGPA = calculateCGPAFromSemesters(student.semesterResults);
      if (recalculatedCGPA > 0 && recalculatedCGPA !== student.cgpa) {
        student.cgpa = recalculatedCGPA;
        isChanged = true;
      }

      if (isChanged) {
        await student.save();
        summary.updated++;
      } else {
        summary.unchanged++;
      }
    } catch (err: any) {
      summary.rejected++;
      summary.errors.push(`Roll Number "${rawRoll}": ${err.message || 'Update failed'}`);
    }
  }

  // Audit Log Entry
  try {
    await AuditLog.create({
      userName: 'Google Sheets Integration',
      action: 'Google Sheets → MongoDB Sync',
      entity: 'Student',
      ipAddress: req.ip || '',
    });
  } catch (err) {
    console.error('Failed to log Google Sheets import audit:', err);
  }

  res.status(200).json({
    success: true,
    processed: summary.processed,
    created: summary.created,
    updated: summary.updated,
    unchanged: summary.unchanged,
    rejected: summary.rejected,
    errors: summary.errors,
    syncedAt: new Date().toISOString(),
  });
});

/**
 * 3. GET /api/v1/sync/status
 * Get sync metadata & configuration status for TPO Panel
 */
export const getSyncStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const lastSync = await AuditLog.findOne({
    action: { $in: ['MongoDB → Google Sheets Sync', 'Google Sheets → MongoDB Sync'] },
  }).sort({ createdAt: -1 });

  const totalStudents = await Student.countDocuments();

  res.status(200).json({
    success: true,
    spreadsheetId: config.GOOGLE_SHEETS_SPREADSHEET_ID,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${config.GOOGLE_SHEETS_SPREADSHEET_ID}/edit`,
    lastSyncTimestamp: lastSync ? lastSync.createdAt : null,
    lastSyncAction: lastSync ? lastSync.action : 'Never',
    totalStudentsInMongoDB: totalStudents,
    syncSecretConfigured: Boolean(config.GOOGLE_SHEETS_SYNC_SECRET),
  });
});

/**
 * 4. POST /api/v1/sync/google-sheets/validate
 * Validates Google Sheet row count and IDs against MongoDB Atlas records (Part 17)
 */
export const validateGoogleSheetsSync = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!(await verifySyncAuth(req))) {
    return next(new AppError('Unauthorized: Invalid or missing Google Sheets synchronization secret.', 401));
  }

  const { sheetStudentIds = [] } = req.body;
  if (!Array.isArray(sheetStudentIds)) {
    return next(new AppError('Invalid payload. Expected array of sheetStudentIds.', 400));
  }

  const dbStudents = await Student.find({}).select('_id rollNumber fullName').lean();
  const dbIdSet = new Set(dbStudents.map((s) => s._id.toString()));
  const sheetIdSet = new Set(sheetStudentIds.map((id) => id.toString().trim()).filter(Boolean));

  let matchingCount = 0;
  const missingInSheet: any[] = [];
  const extraInSheet: string[] = [];

  // Check which DB records are missing in sheet
  dbStudents.forEach((s) => {
    const sId = s._id.toString();
    if (sheetIdSet.has(sId)) {
      matchingCount++;
    } else {
      missingInSheet.push({
        studentId: sId,
        rollNumber: s.rollNumber,
        name: s.fullName,
      });
    }
  });

  // Check which Sheet records are not in DB
  sheetIdSet.forEach((sId) => {
    if (!dbIdSet.has(sId)) {
      extraInSheet.push(sId);
    }
  });

  const totalDbRecords = dbStudents.length;
  const totalSheetRecords = sheetIdSet.size;
  const syncHealth = totalDbRecords > 0 ? Math.round((matchingCount / totalDbRecords) * 100) : 100;
  const isHealthy = syncHealth === 100 && missingInSheet.length === 0;

  res.status(200).json({
    success: true,
    status: isHealthy ? 'SYNC SUCCESS' : 'PARTIAL SYNC',
    syncHealth: `${syncHealth}%`,
    totalSourceRecords: totalDbRecords,
    totalSheetRecords,
    matchingIds: matchingCount,
    missingInSheetCount: missingInSheet.length,
    missingInSheet: missingInSheet.slice(0, 50),
    extraInSheetCount: extraInSheet.length,
    extraInSheet: extraInSheet.slice(0, 50),
    validatedAt: new Date().toISOString(),
  });
});

