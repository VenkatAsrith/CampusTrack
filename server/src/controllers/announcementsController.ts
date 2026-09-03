import { Request, Response, NextFunction } from 'express';
import { Announcement } from '../models/Announcement';
import { AuditLog } from '../models/AuditLog';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';

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

// 1. Get Public Announcements (for students & general view)
export const getPublicAnnouncements = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { type, isPlacementDrive, search } = req.query;

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

  res.status(200).json({
    status: 'success',
    total: announcements.length,
    data: {
      all: announcements,
      active,
      upcoming,
      placementDrives,
    },
  });
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

  res.status(200).json({
    status: 'success',
    message: 'Announcement deadline updated successfully.',
    data: announcement,
  });
});
