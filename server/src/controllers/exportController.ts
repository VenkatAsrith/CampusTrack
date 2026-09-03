import { Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import { Student } from '../models/Student';
import { CodingProfile } from '../models/CodingProfile';
import { Project } from '../models/Project';
import { Internship } from '../models/Internship';
import { Certification } from '../models/Certification';
import { NPTELRecord } from '../models/NPTELRecord';
import { Hackathon } from '../models/Hackathon';
import { Achievement } from '../models/Achievement';
import { AuditLog } from '../models/AuditLog';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';

// Helper to style worksheet header row with CampusTrack brand palette
const styleHeader = (worksheet: ExcelJS.Worksheet) => {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Calibri', family: 2, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B50DF' }, // CampusTrack Royal Blue #3B50DF
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 28;

  // Freeze top header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Auto-fit column widths
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    if (column.header) {
      maxLength = String(column.header).length;
    }
    column.eachCell!({ includeEmpty: false }, (cell) => {
      const cellVal = cell.value ? String(cell.value) : '';
      if (cellVal.length > maxLength) {
        maxLength = cellVal.length;
      }
    });
    column.width = Math.max(maxLength + 4, 14);
  });
};

// Available Column Definitions for Custom Export Builder
export const AVAILABLE_COLUMNS: { key: string; label: string; group: string }[] = [
  // Personal
  { key: 'rollNumber', label: 'Roll Number', group: 'Personal' },
  { key: 'fullName', label: 'Student Name', group: 'Personal' },
  { key: 'email', label: 'Email', group: 'Personal' },
  { key: 'studentMobile', label: 'Student Mobile', group: 'Personal' },
  { key: 'studentId', label: 'Student ID', group: 'Personal' },
  { key: 'gender', label: 'Gender', group: 'Personal' },
  { key: 'branch', label: 'Branch', group: 'Personal' },
  { key: 'year', label: 'Year', group: 'Personal' },
  { key: 'semester', label: 'Semester', group: 'Personal' },
  { key: 'batch', label: 'Batch', group: 'Personal' },
  // Parent
  { key: 'motherName', label: "Mother's Name", group: 'Parent / Guardian' },
  { key: 'motherMobile', label: "Mother's Mobile", group: 'Parent / Guardian' },
  { key: 'fatherGuardianName', label: "Father's / Guardian Name", group: 'Parent / Guardian' },
  { key: 'fatherGuardianMobile', label: "Father's / Guardian Mobile", group: 'Parent / Guardian' },
  // Address
  { key: 'doorNo', label: 'Door / House No', group: 'Address' },
  { key: 'street', label: 'Street / Area', group: 'Address' },
  { key: 'city', label: 'Village / City', group: 'Address' },
  { key: 'district', label: 'District', group: 'Address' },
  { key: 'state', label: 'State', group: 'Address' },
  { key: 'pincode', label: 'PIN Code', group: 'Address' },
  // Academics
  { key: 'sscPercentage', label: 'SSC %', group: 'Academic' },
  { key: 'academicQualification', label: 'Pre-Univ Qualification', group: 'Academic' },
  { key: 'intermediatePercentage', label: 'Intermediate %', group: 'Academic' },
  { key: 'diplomaPercentage', label: 'Diploma %', group: 'Academic' },
  { key: 'sem1', label: 'Semester 1 %', group: 'Academic' },
  { key: 'sem2', label: 'Semester 2 %', group: 'Academic' },
  { key: 'sem3', label: 'Semester 3 %', group: 'Academic' },
  { key: 'sem4', label: 'Semester 4 %', group: 'Academic' },
  { key: 'sem5', label: 'Semester 5 %', group: 'Academic' },
  { key: 'sem6', label: 'Semester 6 %', group: 'Academic' },
  { key: 'sem7', label: 'Semester 7 %', group: 'Academic' },
  { key: 'sem8', label: 'Semester 8 %', group: 'Academic' },
  { key: 'cgpa', label: 'Overall CGPA', group: 'Academic' },
  { key: 'numberOfBacklogs', label: 'Number of Backlogs', group: 'Academic' },
  { key: 'profileCompletion', label: 'Profile Completion %', group: 'Academic' },
  // Professional & Portfolio
  { key: 'github', label: 'GitHub URL', group: 'Portfolio' },
  { key: 'linkedin', label: 'LinkedIn URL', group: 'Portfolio' },
  { key: 'resumeLink', label: 'Resume Link', group: 'Portfolio' },
  { key: 'careerInterest', label: 'Career Interest', group: 'Portfolio' },
  { key: 'projectCount', label: 'Projects Count', group: 'Portfolio' },
  { key: 'internshipCount', label: 'Internships Count', group: 'Portfolio' },
  { key: 'certCount', label: 'Certifications Count', group: 'Portfolio' },
  { key: 'nptelCount', label: 'NPTEL Records Count', group: 'Portfolio' },
  { key: 'hackathonCount', label: 'Hackathons Count', group: 'Portfolio' },
  { key: 'codingStats', label: 'Coding Platforms', group: 'Portfolio' },
];

// Helper to build student query based on request parameters
const buildStudentQuery = (params: any) => {
  const query: any = {};
  if (params.branch) query.branch = params.branch;
  if (params.year) query.year = Number(params.year);
  if (params.semester) query.semester = Number(params.semester);
  if (params.batch) query.batch = params.batch;
  if (params.backlogs !== undefined && params.backlogs !== '') {
    query.numberOfBacklogs = Number(params.backlogs);
  }
  if (params.minCgpa || params.maxCgpa) {
    query.cgpa = {};
    if (params.minCgpa) query.cgpa.$gte = Number(params.minCgpa);
    if (params.maxCgpa) query.cgpa.$lte = Number(params.maxCgpa);
  }
  if (params.search) {
    query.$or = [
      { rollNumber: { $regex: params.search, $options: 'i' } },
      { fullName: { $regex: params.search, $options: 'i' } },
      { email: { $regex: params.search, $options: 'i' } },
      { studentMobile: { $regex: params.search, $options: 'i' } },
      { phone: { $regex: params.search, $options: 'i' } },
    ];
  }
  return query;
};

// Main Excel Export Handler (Supports All, Filtered, and Custom Columns)
export const exportExcelData = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CampusTrack Placement System';
  workbook.lastModifiedBy = 'TPO Office';
  workbook.created = new Date();

  const queryParams = req.method === 'POST' ? req.body : req.query;
  const { customColumns, isCustom } = queryParams;

  const filterQuery = buildStudentQuery(queryParams);

  // Deterministic sorting: Branch -> Year -> Roll Number (NO Section!)
  const students = await Student.find(filterQuery).sort({
    branch: 1,
    year: 1,
    rollNumber: 1,
  });

  // Fast mapping for submodules (projects, internships, certs, coding)
  const studentIds = students.map((s) => s._id);

  const [projects, internships, certs, nptels, hackathons, codingProfiles] = await Promise.all([
    Project.find({ student: { $in: studentIds } }),
    Internship.find({ student: { $in: studentIds } }),
    Certification.find({ student: { $in: studentIds } }),
    NPTELRecord.find({ student: { $in: studentIds } }),
    Hackathon.find({ student: { $in: studentIds } }),
    CodingProfile.find({ student: { $in: studentIds } }),
  ]);

  // Aggregate counts per student
  const countMap: Record<
    string,
    {
      projects: number;
      internships: number;
      certs: number;
      nptels: number;
      hackathons: number;
      codingSummary: string[];
    }
  > = {};

  students.forEach((s) => {
    countMap[s._id.toString()] = {
      projects: 0,
      internships: 0,
      certs: 0,
      nptels: 0,
      hackathons: 0,
      codingSummary: [],
    };
  });

  projects.forEach((p) => {
    const id = p.student.toString();
    if (countMap[id]) countMap[id].projects += 1;
  });
  internships.forEach((i) => {
    const id = i.student.toString();
    if (countMap[id]) countMap[id].internships += 1;
  });
  certs.forEach((c) => {
    const id = c.student.toString();
    if (countMap[id]) countMap[id].certs += 1;
  });
  nptels.forEach((n) => {
    const id = n.student.toString();
    if (countMap[id]) countMap[id].nptels += 1;
  });
  hackathons.forEach((h) => {
    const id = h.student.toString();
    if (countMap[id]) countMap[id].hackathons += 1;
  });
  codingProfiles.forEach((c) => {
    const id = c.student.toString();
    if (countMap[id]) {
      countMap[id].codingSummary.push(`${c.platform}: ${c.problemsSolved} solved (Rating ${c.currentRating})`);
    }
  });

  // Helper to extract a value for a specific column key from a student document
  const getCellValue = (student: any, key: string): any => {
    const stats = countMap[student._id.toString()] || {
      projects: 0,
      internships: 0,
      certs: 0,
      nptels: 0,
      hackathons: 0,
      codingSummary: [],
    };

    switch (key) {
      case 'rollNumber':
        return student.rollNumber;
      case 'fullName':
        return student.fullName;
      case 'email':
        return student.email;
      case 'studentMobile':
        return student.studentMobile || student.phone || 'N/A';
      case 'studentId':
        return student.studentId || 'N/A';
      case 'gender':
        return student.gender || 'N/A';
      case 'branch':
        return student.branch;
      case 'year':
        return `Year ${student.year || 1}`;
      case 'semester':
        return `Sem ${student.semester || 1}`;
      case 'batch':
        return student.batch;
      case 'motherName':
        return student.motherName || 'N/A';
      case 'motherMobile':
        return student.motherMobile || 'N/A';
      case 'fatherGuardianName':
        return student.fatherGuardianName || 'N/A';
      case 'fatherGuardianMobile':
        return student.fatherGuardianMobile || 'N/A';
      case 'doorNo':
        return student.address?.doorNo || '';
      case 'street':
        return student.address?.street || '';
      case 'city':
        return student.address?.city || '';
      case 'district':
        return student.address?.district || '';
      case 'state':
        return student.address?.state || '';
      case 'pincode':
        return student.address?.pincode || '';
      case 'sscPercentage':
        return student.sscPercentage ? `${student.sscPercentage}%` : 'N/A';
      case 'academicQualification':
        return student.academicQualification || 'Intermediate';
      case 'intermediatePercentage':
        return student.intermediatePercentage ? `${student.intermediatePercentage}%` : 'N/A';
      case 'diplomaPercentage':
        return student.diplomaPercentage ? `${student.diplomaPercentage}%` : 'N/A';
      case 'sem1':
      case 'sem2':
      case 'sem3':
      case 'sem4':
      case 'sem5':
      case 'sem6':
      case 'sem7':
      case 'sem8': {
        const semNum = parseInt(key.replace('sem', ''), 10);
        const match = (student.semesterResults || []).find((s: any) => s.semester === semNum);
        return match ? `${match.percentage}%` : '-';
      }
      case 'cgpa':
        return student.cgpa || 0;
      case 'numberOfBacklogs':
        return student.numberOfBacklogs || 0;
      case 'profileCompletion':
        return `${student.profileCompletion || 0}%`;
      case 'github':
        return student.github || '';
      case 'linkedin':
        return student.linkedin || '';
      case 'resumeLink':
        return student.resumeLink || '';
      case 'careerInterest':
        return student.careerInterest || '';
      case 'projectCount':
        return stats.projects;
      case 'internshipCount':
        return stats.internships;
      case 'certCount':
        return stats.certs;
      case 'nptelCount':
        return stats.nptels;
      case 'hackathonCount':
        return stats.hackathons;
      case 'codingStats':
        return stats.codingSummary.join('; ') || 'None';
      default:
        return '';
    }
  };

  // Check if Custom Export is requested with specific selected columns
  if (isCustom && Array.isArray(customColumns) && customColumns.length > 0) {
    const sheet = workbook.addWorksheet('Custom Student Report');
    const selectedDefs = AVAILABLE_COLUMNS.filter((col) => customColumns.includes(col.key));

    sheet.columns = selectedDefs.map((col) => ({
      header: col.label,
      key: col.key,
    }));

    students.forEach((s) => {
      const rowData: any = {};
      selectedDefs.forEach((col) => {
        rowData[col.key] = getCellValue(s, col.key);
      });
      sheet.addRow(rowData);
    });

    styleHeader(sheet);
  } else {
    // Complete Comprehensive Student Workbook (Option 1: Complete Sheet)
    // 1. Primary Sheet: Complete Student Details
    const sheetStudents = workbook.addWorksheet('Students');
    sheetStudents.columns = [
      { header: 'Branch', key: 'branch' },
      { header: 'Year', key: 'year' },
      { header: 'Roll Number', key: 'rollNumber' },
      { header: 'Full Name', key: 'fullName' },
      { header: 'Student Mobile', key: 'studentMobile' },
      { header: 'Email', key: 'email' },
      { header: 'Current Sem', key: 'semester' },
      { header: 'CGPA', key: 'cgpa' },
      { header: 'Backlogs', key: 'numberOfBacklogs' },
      { header: 'SSC %', key: 'sscPercentage' },
      { header: 'Qualification', key: 'academicQualification' },
      { header: 'Inter/Diploma %', key: 'preUnivPercentage' },
      { header: 'Sem 1 %', key: 'sem1' },
      { header: 'Sem 2 %', key: 'sem2' },
      { header: 'Sem 3 %', key: 'sem3' },
      { header: 'Sem 4 %', key: 'sem4' },
      { header: 'Sem 5 %', key: 'sem5' },
      { header: 'Sem 6 %', key: 'sem6' },
      { header: 'Sem 7 %', key: 'sem7' },
      { header: 'Sem 8 %', key: 'sem8' },
      { header: "Mother's Name", key: 'motherName' },
      { header: "Mother's Mobile", key: 'motherMobile' },
      { header: "Father's/Guardian Name", key: 'fatherGuardianName' },
      { header: "Father's/Guardian Mobile", key: 'fatherGuardianMobile' },
      { header: 'Permanent Address', key: 'address' },
      { header: 'GitHub', key: 'github' },
      { header: 'LinkedIn', key: 'linkedin' },
      { header: 'Resume Link', key: 'resumeLink' },
      { header: 'Projects Count', key: 'projects' },
      { header: 'Internships Count', key: 'internships' },
      { header: 'Certifications Count', key: 'certs' },
      { header: 'NPTEL Count', key: 'nptels' },
      { header: 'Hackathons Count', key: 'hackathons' },
      { header: 'Coding Profiles', key: 'codingStats' },
    ];

    students.forEach((s) => {
      const stats = countMap[s._id.toString()];
      const preUnivPct =
        s.academicQualification === 'Diploma'
          ? s.diplomaPercentage
            ? `${s.diplomaPercentage}%`
            : 'N/A'
          : s.intermediatePercentage
          ? `${s.intermediatePercentage}%`
          : 'N/A';

      const semMap: any = {};
      [1, 2, 3, 4, 5, 6, 7, 8].forEach((num) => {
        const found = (s.semesterResults || []).find((sr: any) => sr.semester === num);
        semMap[`sem${num}`] = found ? `${found.percentage}%` : '-';
      });

      const fullAddress = [
        s.address?.doorNo,
        s.address?.street,
        s.address?.city,
        s.address?.district,
        s.address?.state,
        s.address?.pincode,
      ]
        .filter(Boolean)
        .join(', ');

      sheetStudents.addRow({
        branch: s.branch,
        year: `Year ${s.year || 1}`,
        rollNumber: s.rollNumber,
        fullName: s.fullName,
        studentMobile: s.studentMobile || s.phone || 'N/A',
        email: s.email,
        semester: s.semester,
        cgpa: s.cgpa || 0,
        numberOfBacklogs: s.numberOfBacklogs || 0,
        sscPercentage: s.sscPercentage ? `${s.sscPercentage}%` : 'N/A',
        academicQualification: s.academicQualification || 'Intermediate',
        preUnivPercentage: preUnivPct,
        ...semMap,
        motherName: s.motherName || 'N/A',
        motherMobile: s.motherMobile || 'N/A',
        fatherGuardianName: s.fatherGuardianName || 'N/A',
        fatherGuardianMobile: s.fatherGuardianMobile || 'N/A',
        address: fullAddress || 'N/A',
        github: s.github || '',
        linkedin: s.linkedin || '',
        resumeLink: s.resumeLink || '',
        projects: stats.projects,
        internships: stats.internships,
        certs: stats.certs,
        nptels: stats.nptels,
        hackathons: stats.hackathons,
        codingStats: stats.codingSummary.join('; ') || 'None',
      });
    });

    styleHeader(sheetStudents);
  }

  // Determine descriptive filename according to Part 22 & 29:
  // e.g. 4th_Year_CSE_4-1_2023-2027.xlsx, 4th_Year_CSE.xlsx, Batch_2023-2027_Students.xlsx
  const semCodeMap: Record<number, string> = { 1: '1-1', 2: '1-2', 3: '2-1', 4: '2-2', 5: '3-1', 6: '3-2', 7: '4-1', 8: '4-2' };
  const filterYear = req.query.year || (req.body && req.body.year);
  const filterBranch = req.query.branch || (req.body && req.body.branch);
  const filterSemester = req.query.semester || (req.body && req.body.semester);
  const filterBatch = req.query.batch || (req.body && req.body.batch);

  let exportFilename = 'CampusTrack_Export';
  if (filterYear) {
    const yNum = parseInt(filterYear as string, 10);
    const yStr = `${yNum}${yNum === 1 ? 'st' : yNum === 2 ? 'nd' : yNum === 3 ? 'rd' : 'th'}_Year`;
    const bStr = filterBranch ? `_${String(filterBranch).replace(/\s+/g, '_')}` : '';
    const sStr = filterSemester ? `_${semCodeMap[parseInt(filterSemester as string, 10)] || filterSemester}` : '';
    const batchStr = filterBatch ? `_${String(filterBatch).replace(/\s+/g, '_')}` : '';
    exportFilename = `${yStr}${bStr || (!sStr && !batchStr ? '_All' : '')}${sStr}${batchStr}`;
  } else if (filterBatch) {
    exportFilename = `Batch_${String(filterBatch).replace(/\s+/g, '_')}_Students`;
  } else if (filterBranch) {
    exportFilename = `${String(filterBranch).replace(/\s+/g, '_')}_Students`;
  }

  // Response headers for downloading Excel file
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${exportFilename}.xlsx`
  );

  // Audit Logging
  try {
    await AuditLog.create({
      user: req.user!.id,
      userName: 'TPO',
      action: `TPO Exported Excel Report (${students.length} students)`,
      entity: 'ExcelReport',
    });
  } catch (err) {
    console.error('Failed logging excel export audit:', err);
  }

  // Stream workbook
  await workbook.xlsx.write(res);
  res.end();
});

// Endpoint to fetch available column definitions for TPO Custom Export UI
export const getExportColumns = (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: AVAILABLE_COLUMNS,
  });
};
