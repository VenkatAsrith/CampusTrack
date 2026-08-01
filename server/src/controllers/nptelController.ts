import { Response, NextFunction } from 'express';
import { NPTELRecord } from '../models/NPTELRecord';
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

export const getNPTELRecords = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let query: any = {};

  if (req.user?.role === 'admin') {
    if (req.query.studentId) query.student = req.query.studentId;
    if (req.query.status) query['verification.status'] = req.query.status;
  } else {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return next(new AppError('Student profile not found.', 404));
    query.student = student._id;
  }

  const records = await NPTELRecord.find(query).populate('certificate').populate({
    path: 'student',
    select: 'fullName rollNumber branch'
  });

  res.status(200).json({
    status: 'success',
    results: records.length,
    data: records,
  });
});

export const createNPTELRecord = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const {
    courseName,
    courseId,
    score,
    certificationType,
    eliteStatus,
    rank,
    examDate,
    certificate,
  } = req.body;

  if (!certificate) {
    return next(new AppError('Certificate file attachment is required.', 400));
  }

  const record = await NPTELRecord.create({
    student: student._id,
    courseName,
    courseId,
    score: Number(score),
    certificationType,
    eliteStatus: eliteStatus === 'true' || eliteStatus === true,
    rank: rank ? Number(rank) : undefined,
    examDate,
    certificate,
    verification: {
      status: 'DRAFT',
    },
  });

  await updateProfileCompletion(student._id.toString());
  await logAction(req.user!.id, student.fullName, 'Student Created NPTEL Draft', 'NPTELRecord', record._id);

  res.status(201).json({
    status: 'success',
    data: record,
  });
});

export const updateNPTELRecord = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await NPTELRecord.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('NPTEL record not found or access denied.', 404));

  const status = record.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot modify record while it is ${status}.`, 400));
  }

  const {
    courseName,
    courseId,
    score,
    certificationType,
    eliteStatus,
    rank,
    examDate,
    certificate,
  } = req.body;

  if (courseName !== undefined) record.courseName = courseName;
  if (courseId !== undefined) record.courseId = courseId;
  if (score !== undefined) record.score = Number(score);
  if (certificationType !== undefined) record.certificationType = certificationType;
  if (eliteStatus !== undefined) record.eliteStatus = eliteStatus === 'true' || eliteStatus === true;
  if (rank !== undefined) record.rank = rank ? Number(rank) : undefined;
  if (examDate !== undefined) record.examDate = examDate;
  if (certificate !== undefined) record.certificate = certificate;

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

export const submitNPTELRecord = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await NPTELRecord.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('NPTEL record not found or access denied.', 404));

  if (record.verification.status !== 'DRAFT' && record.verification.status !== 'REJECTED') {
    return next(new AppError('Record is already submitted or verified.', 400));
  }

  record.verification.status = 'SUBMITTED';
  record.verification.rejectionReason = '';
  await record.save();

  await logAction(req.user!.id, student.fullName, 'Student Submitted NPTEL', 'NPTELRecord', record._id);

  res.status(200).json({
    status: 'success',
    message: 'NPTEL record submitted for verification.',
    data: record,
  });
});

export const deleteNPTELRecord = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await NPTELRecord.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('NPTEL record not found or access denied.', 404));

  const status = record.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot delete record while it is ${status}.`, 400));
  }

  await NPTELRecord.findByIdAndDelete(req.params.id);
  await updateProfileCompletion(student._id.toString());
  await logAction(req.user!.id, student.fullName, 'Student Deleted NPTEL', 'NPTELRecord', req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
