import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import { Announcement } from '../models/Announcement';
import { Student } from '../models/Student';
import { Application } from '../models/Application';
import { AuditLog } from '../models/AuditLog';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';
import { normalizeBranch } from '../config/branchConfig';

// Helper to log audit actions
const logAction = async (userId: string, userName: string, action: string, entity: string, entityId: any) => {
  try {
    await AuditLog.create({
      user: userId,
      userName,
      action,
      entity,
      entityId,
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

// In-Memory Announcement Cache for 2,000+ Concurrent Placement Rush Optimization
interface CacheEntry {
  data: any;
  timestamp: number;
}
const announcementCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 1000; // 20 seconds TTL

export const invalidateAnnouncementsCache = () => {
  announcementCache.clear();
};

// 1. Get Public Announcements (for students & general view)
export const getPublicAnnouncements = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const { type, isPlacementDrive, search } = req.query;

  const cacheKey = `public_${type || 'all'}_${isPlacementDrive || 'false'}_${search || ''}`;

  // Serve from cache if available and fresh
  const cached = announcementCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', 'public, max-age=15');
    return res.status(200).json(cached.data);
  }

  const now = new Date();
  const query: any = {
    isPublished: true,
    // Only show active and upcoming announcements to students (not expired ones, unless explicitly requested)
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: now } },
    ],
  };

  if (type) {
    query.type = type;
  }

  if (isPlacementDrive === 'true') {
    query.isPlacementDrive = true;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
    ];
  }

  const announcements = await Announcement.find(query)
    .sort({ startDate: -1, createdAt: -1 })
    .populate('createdBy', 'email role');

  // Separate active vs upcoming vs placement drives
  const active: any[] = [];
  const upcoming: any[] = [];
  const placementDrives: any[] = [];

  announcements.forEach((item) => {
    const status = (item as any).status;
    if (item.isPlacementDrive || item.type === 'Placement' || item.type === 'Drive') {
      placementDrives.push(item);
    }
    if (status === 'UPCOMING') {
      upcoming.push(item);
    } else {
      active.push(item);
    }
  });

  const responsePayload = {
    status: 'success',
    total: announcements.length,
    data: {
      all: announcements,
      active,
      upcoming,
      placementDrives,
    },
  };

  // Cache response for 20 seconds
  announcementCache.set(cacheKey, {
    data: responsePayload,
    timestamp: Date.now(),
  });

  res.setHeader('X-Cache', 'MISS');
  res.setHeader('Cache-Control', 'public, max-age=15');
  res.status(200).json(responsePayload);
});

// 2. Get Single Announcement by ID
export const getAnnouncementById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'email role');
  if (!announcement) {
    return next(new AppError('Announcement not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: announcement,
  });
});

// 3. Get All Announcements for TPO (including draft, published, and expired)
export const getTpoAnnouncements = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { status, type, search, page = '1', limit = '10' } = req.query;

  const query: any = {};

  if (type) {
    query.type = type;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const announcements = await Announcement.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('createdBy', 'email role');

  const total = await Announcement.countDocuments(query);

  res.status(200).json({
    status: 'success',
    page: pageNum,
    limit: limitNum,
    total,
    pages: Math.ceil(total / limitNum),
    data: announcements,
  });
});

// 4. Create Announcement (TPO only)
export const createAnnouncement = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const {
    title,
    description,
    links,
    imageUrl,
    attachments,
    type,
    isPlacementDrive,
    companyName,
    jobRole,
    driveDate,
    startDate,
    endDate,
    eligibility,
    isPublished = true,
  } = req.body;

  if (!title || !description) {
    return next(new AppError('Title and description are required.', 400));
  }

  const announcement = await Announcement.create({
    title,
    description,
    links: Array.isArray(links) ? links : [],
    imageUrl: imageUrl || '',
    attachments: Array.isArray(attachments) ? attachments : [],
    type: type || 'General',
    isPlacementDrive: Boolean(isPlacementDrive || type === 'Placement' || type === 'Drive'),
    companyName: companyName || '',
    jobRole: jobRole || '',
    driveDate: driveDate ? new Date(driveDate) : undefined,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : undefined,
    eligibility: eligibility || {},
    isPublished: isPublished !== false,
    createdBy: req.user!.id,
  });

  await logAction(
    req.user!.id,
    'TPO',
    `TPO Created Announcement: "${announcement.title}"`,
    'Announcement',
    announcement._id
  );

  invalidateAnnouncementsCache();

  res.status(201).json({
    status: 'success',
    message: 'Announcement created successfully.',
    data: announcement,
  });
});

// 5. Update Announcement (TPO only)
export const updateAnnouncement = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return next(new AppError('Announcement not found.', 404));
  }

  const {
    title,
    description,
    links,
    imageUrl,
    attachments,
    type,
    isPlacementDrive,
    companyName,
    jobRole,
    driveDate,
    startDate,
    endDate,
    eligibility,
    isPublished,
  } = req.body;

  if (title !== undefined) announcement.title = title;
  if (description !== undefined) announcement.description = description;
  if (links !== undefined) announcement.links = links;
  if (imageUrl !== undefined) announcement.imageUrl = imageUrl;
  if (attachments !== undefined) announcement.attachments = attachments;
  if (type !== undefined) {
    announcement.type = type;
    if (type === 'Placement' || type === 'Drive') {
      announcement.isPlacementDrive = true;
    }
  }
  if (isPlacementDrive !== undefined) announcement.isPlacementDrive = isPlacementDrive;
  if (companyName !== undefined) announcement.companyName = companyName;
  if (jobRole !== undefined) announcement.jobRole = jobRole;
  if (driveDate !== undefined) announcement.driveDate = driveDate ? new Date(driveDate) : undefined;
  if (startDate !== undefined) announcement.startDate = startDate ? new Date(startDate) : announcement.startDate;
  if (endDate !== undefined) announcement.endDate = endDate ? new Date(endDate) : undefined;
  if (eligibility !== undefined) announcement.eligibility = eligibility;
  if (isPublished !== undefined) announcement.isPublished = isPublished;

  await announcement.save();

  await logAction(
    req.user!.id,
    'TPO',
    `TPO Updated Announcement: "${announcement.title}"`,
    'Announcement',
    announcement._id
  );

  invalidateAnnouncementsCache();

  res.status(200).json({
    status: 'success',
    message: 'Announcement updated successfully.',
    data: announcement,
  });
});

// 6. Delete Announcement (TPO only)
export const deleteAnnouncement = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return next(new AppError('Announcement not found.', 404));
  }

  await Announcement.findByIdAndDelete(req.params.id);

  await logAction(
    req.user!.id,
    'TPO',
    `TPO Deleted Announcement: "${announcement.title}"`,
    'Announcement',
    announcement._id
  );

  invalidateAnnouncementsCache();

  res.status(200).json({
    status: 'success',
    message: 'Announcement deleted successfully.',
  });
});

// 7. Toggle Publish / Unpublish (TPO only)
export const togglePublishAnnouncement = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return next(new AppError('Announcement not found.', 404));
  }

  announcement.isPublished = !announcement.isPublished;
  await announcement.save();

  await logAction(
    req.user!.id,
    'TPO',
    `TPO ${announcement.isPublished ? 'Published' : 'Unpublished'} Announcement: "${announcement.title}"`,
    'Announcement',
    announcement._id
  );

  invalidateAnnouncementsCache();

  res.status(200).json({
    status: 'success',
    message: `Announcement ${announcement.isPublished ? 'published' : 'unpublished'} successfully.`,
    data: announcement,
  });
});

// 8. Update Deadline (TPO only)
export const updateDeadline = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { deadline } = req.body;
  if (!deadline) {
    return next(new AppError('Please provide a valid deadline date/time.', 400));
  }

  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return next(new AppError('Announcement not found.', 404));
  }

  announcement.endDate = new Date(deadline);
  await announcement.save();

  await logAction(
    req.user!.id,
    'TPO',
    `TPO Updated Deadline for Announcement: "${announcement.title}" to ${announcement.endDate.toISOString()}`,
    'Announcement',
    announcement._id
  );

  invalidateAnnouncementsCache();

  res.status(200).json({
    status: 'success',
    message: 'Announcement deadline updated successfully.',
    data: announcement,
  });
});

// 9. Apply to Placement Drive (Student with Auto-Prefill & Duplicate Prevention)
export const applyToPlacementDrive = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const driveId = req.params.id;

  const announcement = await Announcement.findById(driveId);
  if (!announcement) {
    return next(new AppError('Placement drive notice not found.', 404));
  }

  if (!announcement.isPublished) {
    return next(new AppError('This placement drive is not currently open for applications.', 400));
  }

  const now = new Date();
  if (announcement.endDate && now > new Date(announcement.endDate)) {
    return next(new AppError('Application deadline for this drive has passed.', 400));
  }

  // Find Student Profile
  const student = await Student.findOne({ user: req.user!.id });
  if (!student) {
    return next(new AppError('Student profile record not found. Please complete profile setup.', 404));
  }

  // DUPLICATE APPLICATION CHECK
  const existingApp = await Application.findOne({ driveId, studentId: student._id });
  if (existingApp) {
    return next(
      new AppError(
        `You have already applied for this placement drive on ${new Date(existingApp.submittedAt).toLocaleDateString()}. Status: ${existingApp.status}`,
        400
      )
    );
  }

  // AUTOMATED ELIGIBILITY CHECK
  const elig = announcement.eligibility;
  if (elig) {
    if (elig.minCGPA && (student.cgpa || 0) < elig.minCGPA) {
      return next(
        new AppError(
          `Ineligible: Minimum CGPA required is ${elig.minCGPA}. Your recorded CGPA is ${(student.cgpa || 0).toFixed(2)}.`,
          403
        )
      );
    }

    if (elig.maxBacklogs !== undefined && elig.maxBacklogs !== null && (student.numberOfBacklogs ?? 0) > elig.maxBacklogs) {
      return next(
        new AppError(
          `Ineligible: Maximum backlogs allowed is ${elig.maxBacklogs}. You have ${student.numberOfBacklogs} active backlogs.`,
          403
        )
      );
    }

    if (elig.eligibleBranches && elig.eligibleBranches.length > 0) {
      const studentBranchNorm = normalizeBranch(student.branch);
      const isBranchAllowed = elig.eligibleBranches.some(
        (b) => normalizeBranch(b) === studentBranchNorm
      );
      if (!isBranchAllowed) {
        return next(
          new AppError(
            `Ineligible: This drive is open only for ${elig.eligibleBranches.join(', ')}. Your branch is ${student.branch}.`,
            403
          )
        );
      }
    }

    if (elig.eligibleBatches && elig.eligibleBatches.length > 0) {
      if (!elig.eligibleBatches.includes(student.batch)) {
        return next(
          new AppError(
            `Ineligible: This drive is for batches ${elig.eligibleBatches.join(', ')}. Your batch is ${student.batch}.`,
            403
          )
        );
      }
    }

    if (elig.eligibleYears && elig.eligibleYears.length > 0) {
      if (!elig.eligibleYears.includes(student.year)) {
        return next(
          new AppError(
            `Ineligible: This drive is for ${elig.eligibleYears.map((y) => `Year ${y}`).join(', ')}. Your current year is Year ${student.year}.`,
            403
          )
        );
      }
    }
  }

  // Auto-Prefill System Fields
  const systemData = {
    rollNumber: student.rollNumber,
    name: student.fullName,
    branch: student.branch,
    batch: student.batch,
    entryType: student.entryType || 'REGULAR',
    email: student.email,
    phone: student.studentMobile || student.phone,
    cgpa: student.cgpa || 0,
    backlogs: student.numberOfBacklogs || 0,
    resumeLink: student.resumeLink || '',
  };

  const responses = req.body.responses || {};

  // Create Application
  const application = await Application.create({
    driveId: announcement._id,
    studentId: student._id,
    systemData,
    responses,
    status: 'SUBMITTED',
    submittedAt: new Date(),
  });

  await logAction(
    req.user!.id,
    student.fullName,
    `Student applied for placement drive: "${announcement.companyName || announcement.title}"`,
    'Application',
    application._id
  );

  res.status(201).json({
    status: 'success',
    message: 'Application submitted successfully! Your details have been recorded.',
    data: application,
  });
});

// 10. Get My Application for a Drive (Student view)
export const getMyApplication = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const driveId = req.params.id;
  const student = await Student.findOne({ user: req.user!.id });
  if (!student) {
    return next(new AppError('Student record not found.', 404));
  }

  const application = await Application.findOne({ driveId, studentId: student._id });

  res.status(200).json({
    status: 'success',
    data: application || null,
  });
});

// 11. Get Applications for Drive (TPO view with filters & KPI breakdown)
export const getDriveApplications = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const driveId = req.params.id;
  const { branch, batch, minCgpa, maxBacklogs, status, search } = req.query;

  const query: any = { driveId };

  if (branch) {
    query['systemData.branch'] = branch;
  }
  if (batch) {
    query['systemData.batch'] = batch;
  }
  if (status) {
    query.status = status;
  }
  if (minCgpa) {
    query['systemData.cgpa'] = { $gte: parseFloat(minCgpa as string) };
  }
  if (maxBacklogs !== undefined && maxBacklogs !== '') {
    query['systemData.backlogs'] = { $lte: parseInt(maxBacklogs as string, 10) };
  }
  if (search) {
    query.$or = [
      { 'systemData.name': { $regex: search, $options: 'i' } },
      { 'systemData.rollNumber': { $regex: search, $options: 'i' } },
      { 'systemData.email': { $regex: search, $options: 'i' } },
    ];
  }

  const applications = await Application.find(query)
    .sort({ 'systemData.branch': 1, 'systemData.batch': 1, 'systemData.rollNumber': 1 });

  // Compute status metrics for the drive
  const allForDrive = await Application.find({ driveId });
  const metrics = {
    total: allForDrive.length,
    submitted: allForDrive.filter((a) => a.status === 'SUBMITTED').length,
    shortlisted: allForDrive.filter((a) => a.status === 'SHORTLISTED').length,
    rejected: allForDrive.filter((a) => a.status === 'REJECTED').length,
    selected: allForDrive.filter((a) => a.status === 'SELECTED').length,
  };

  res.status(200).json({
    status: 'success',
    total: applications.length,
    metrics,
    data: applications,
  });
});

// 12. Update Application Status (TPO: shortlist, reject, select)
export const updateApplicationStatus = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id: driveId, appId } = req.params;
  const { status } = req.body;

  if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN'].includes(status)) {
    return next(new AppError('Invalid application status value.', 400));
  }

  const app = await Application.findOne({ _id: appId, driveId });
  if (!app) {
    return next(new AppError('Application record not found.', 404));
  }

  app.status = status;
  await app.save();

  await logAction(
    req.user!.id,
    'TPO',
    `TPO updated application status to ${status} for student ${app.systemData.name} (${app.systemData.rollNumber})`,
    'Application',
    app._id
  );

  res.status(200).json({
    status: 'success',
    message: `Application status updated to ${status}.`,
    data: app,
  });
});

// 13. Bulk Update Status (e.g. Shortlist All Eligible)
export const bulkUpdateApplicationStatus = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const driveId = req.params.id;
  const { applicationIds, status } = req.body;

  if (!status || !Array.isArray(applicationIds)) {
    return next(new AppError('Application IDs array and target status are required.', 400));
  }

  const result = await Application.updateMany(
    { _id: { $in: applicationIds }, driveId },
    { $set: { status } }
  );

  await logAction(
    req.user!.id,
    'TPO',
    `TPO bulk updated ${result.modifiedCount} applications to ${status} for drive ID ${driveId}`,
    'Application',
    driveId
  );

  res.status(200).json({
    status: 'success',
    message: `Updated status to ${status} for ${result.modifiedCount} candidates.`,
    modifiedCount: result.modifiedCount,
  });
});

// 14. Deterministic Excel Export for Placement Drive (Sorted Branch -> Batch -> Roll Number with Custom Form Columns)
export const exportDriveApplicationsExcel = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const driveId = req.params.id;
  const announcement = await Announcement.findById(driveId);
  if (!announcement) {
    return next(new AppError('Placement drive not found.', 404));
  }

  const applications = await Application.find({ driveId })
    .sort({ 'systemData.branch': 1, 'systemData.batch': 1, 'systemData.rollNumber': 1 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CampusTrack Institutional Placement OS';
  workbook.created = new Date();

  const company = announcement.companyName || announcement.title || 'Drive';
  const sheetName = company.substring(0, 30).replace(/[*?:/\\\[\]]/g, '');
  const worksheet = workbook.addWorksheet(sheetName || 'Applications');

  // Header Title Banner
  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `JNTUH UCES — ${announcement.companyName || announcement.title} — Verified Candidate Applications`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF151B3B' },
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Build Column Definitions: Standard System Fields + Custom Form Fields
  const customFields = announcement.applicationForm?.fields || [];

  const columns: any[] = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Roll Number', key: 'rollNumber', width: 16 },
    { header: 'Student Name', key: 'name', width: 25 },
    { header: 'Branch', key: 'branch', width: 14 },
    { header: 'Batch', key: 'batch', width: 14 },
    { header: 'Entry Type', key: 'entryType', width: 14 },
    { header: 'Email Address', key: 'email', width: 28 },
    { header: 'Mobile Phone', key: 'phone', width: 16 },
    { header: 'CGPA', key: 'cgpa', width: 10 },
    { header: 'Backlogs', key: 'backlogs', width: 10 },
    { header: 'Application Status', key: 'status', width: 18 },
    { header: 'Applied At', key: 'appliedAt', width: 18 },
  ];

  // Append Dynamic Columns for Custom Form Questions
  customFields.forEach((cf: any) => {
    columns.push({
      header: cf.label,
      key: `custom_${cf.id}`,
      width: Math.max(cf.label.length + 4, 20),
    });
  });

  worksheet.getRow(2).values = columns.map((c) => c.header);
  worksheet.columns = columns;

  // Style Header Row (Row 2)
  const headerRow = worksheet.getRow(2);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B50DF' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Populate Data Rows
  applications.forEach((app, idx) => {
    const rowData: any = {
      sno: idx + 1,
      rollNumber: app.systemData.rollNumber,
      name: app.systemData.name,
      branch: app.systemData.branch,
      batch: app.systemData.batch,
      entryType: app.systemData.entryType,
      email: app.systemData.email,
      phone: app.systemData.phone,
      cgpa: app.systemData.cgpa ? app.systemData.cgpa.toFixed(2) : '0.00',
      backlogs: app.systemData.backlogs ?? 0,
      status: app.status,
      appliedAt: new Date(app.submittedAt).toLocaleDateString(),
    };

    customFields.forEach((cf: any) => {
      const respVal = app.responses?.[cf.id];
      rowData[`custom_${cf.id}`] = Array.isArray(respVal) ? respVal.join(', ') : respVal || 'N/A';
    });

    const row = worksheet.addRow(rowData);
    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E9F2' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E9F2' } },
        left: { style: 'thin', color: { argb: 'FFE5E9F2' } },
        right: { style: 'thin', color: { argb: 'FFE5E9F2' } },
      };
      if (colNum === 1 || colNum === 9 || colNum === 10 || colNum === 11) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { vertical: 'middle' };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const safeFilename = `${company.replace(/[^a-zA-Z0-9]/g, '_')}_Applicants_${Date.now()}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.send(buffer);
});
