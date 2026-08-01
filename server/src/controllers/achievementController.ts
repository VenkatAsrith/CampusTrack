import { Response, NextFunction } from 'express';
import { Achievement } from '../models/Achievement';
import { Student } from '../models/Student';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';
import { updateProfileCompletion } from '../utils/profileCompletion';
import { AuditLog } from '../models/AuditLog';

const logAction = async (userId: string, userName: string, action: string, entity: string, entityId: any) => {
  try {
    await AuditLog.create({ user: userId, userName, action, entity, entityId });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

export const getAchievements = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let query: any = {};

  if (req.user?.role === 'admin') {
    if (req.query.studentId) query.student = req.query.studentId;
    if (req.query.status) query['verification.status'] = req.query.status;
  } else {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return next(new AppError('Student profile not found.', 404));
    query.student = student._id;
  }

  const records = await Achievement.find(query).populate('proofDocument').populate({
    path: 'student',
    select: 'fullName rollNumber branch'
  });

  res.status(200).json({
    status: 'success',
    results: records.length,
    data: records,
  });
});

export const createAchievement = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const {
    achievementTitle,
    category,
    level,
    date,
    description,
    proofDocument,
  } = req.body;

  if (!proofDocument) {
    return next(new AppError('Proof document file attachment is required.', 400));
  }

  const record = await Achievement.create({
    student: student._id,
    achievementTitle,
    category,
    level,
    date,
    description,
    proofDocument,
    verification: {
      status: 'DRAFT',
    },
  });

  await updateProfileCompletion(student._id.toString());
  await logAction(req.user!.id, student.fullName, 'Student Created Achievement Draft', 'Achievement', record._id);

  res.status(201).json({
    status: 'success',
    data: record,
  });
});

export const updateAchievement = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Achievement.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Achievement record not found or access denied.', 404));

  const status = record.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot modify record while it is ${status}.`, 400));
  }

  const {
    achievementTitle,
    category,
    level,
    date,
    description,
    proofDocument,
  } = req.body;

  if (achievementTitle !== undefined) record.achievementTitle = achievementTitle;
  if (category !== undefined) record.category = category;
  if (level !== undefined) record.level = level;
  if (date !== undefined) record.date = date;
  if (description !== undefined) record.description = description;
  if (proofDocument !== undefined) record.proofDocument = proofDocument;

  if (status === 'REJECTED') {
    record.verification.status = 'DRAFT';
    record.verification.rejectionReason = '';
  }

  await record.save();

  res.status(200).json({
    status: 'success',
    data: record,
  });
});

export const submitAchievement = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Achievement.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Achievement record not found or access denied.', 404));

  if (record.verification.status !== 'DRAFT' && record.verification.status !== 'REJECTED') {
    return next(new AppError('Record is already submitted or verified.', 400));
  }

  record.verification.status = 'SUBMITTED';
  record.verification.rejectionReason = '';
  await record.save();

  await logAction(req.user!.id, student.fullName, 'Student Submitted Achievement', 'Achievement', record._id);

  res.status(200).json({
    status: 'success',
    message: 'Achievement record submitted for verification.',
    data: record,
  });
});

export const deleteAchievement = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Achievement.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Achievement record not found or access denied.', 404));

  const status = record.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot delete record while it is ${status}.`, 400));
  }

  await Achievement.findByIdAndDelete(req.params.id);
  await updateProfileCompletion(student._id.toString());
  await logAction(req.user!.id, student.fullName, 'Student Deleted Achievement', 'Achievement', req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
