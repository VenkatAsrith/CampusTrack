import { Response, NextFunction } from 'express';
import { Hackathon } from '../models/Hackathon';
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

export const getHackathons = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let query: any = {};

  if (req.user?.role === 'admin') {
    if (req.query.studentId) query.student = req.query.studentId;
    if (req.query.status) query['verification.status'] = req.query.status;
  } else {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return next(new AppError('Student profile not found.', 404));
    query.student = student._id;
  }

  const records = await Hackathon.find(query).populate('certificate').populate({
    path: 'student',
    select: 'fullName rollNumber branch'
  });

  res.status(200).json({
    status: 'success',
    results: records.length,
    data: records,
  });
});

export const createHackathon = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const {
    hackathonName,
    organizer,
    date,
    teamName,
    studentRole,
    projectName,
    position,
    projectLink,
    certificate,
  } = req.body;

  if (!certificate) {
    return next(new AppError('Certificate file attachment is required.', 400));
  }

  const record = await Hackathon.create({
    student: student._id,
    hackathonName,
    organizer,
    date,
    teamName,
    studentRole,
    projectName,
    position,
    projectLink,
    certificate,
    verification: {
      status: 'DRAFT',
    },
  });

  await updateProfileCompletion(student._id.toString());
  await logAction(req.user!.id, student.fullName, 'Student Created Hackathon Draft', 'Hackathon', record._id);

  res.status(201).json({
    status: 'success',
    data: record,
  });
});

export const updateHackathon = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Hackathon.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Hackathon record not found or access denied.', 404));

  const status = record.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot modify record while it is ${status}.`, 400));
  }

  const {
    hackathonName,
    organizer,
    date,
    teamName,
    studentRole,
    projectName,
    position,
    projectLink,
    certificate,
  } = req.body;

  if (hackathonName !== undefined) record.hackathonName = hackathonName;
  if (organizer !== undefined) record.organizer = organizer;
  if (date !== undefined) record.date = date;
  if (teamName !== undefined) record.teamName = teamName;
  if (studentRole !== undefined) record.studentRole = studentRole;
  if (projectName !== undefined) record.projectName = projectName;
  if (position !== undefined) record.position = position;
  if (projectLink !== undefined) record.projectLink = projectLink;
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

export const submitHackathon = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Hackathon.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Hackathon record not found or access denied.', 404));

  if (record.verification.status !== 'DRAFT' && record.verification.status !== 'REJECTED') {
    return next(new AppError('Record is already submitted or verified.', 400));
  }

  record.verification.status = 'SUBMITTED';
  record.verification.rejectionReason = '';
  await record.save();

  await logAction(req.user!.id, student.fullName, 'Student Submitted Hackathon', 'Hackathon', record._id);

  res.status(200).json({
    status: 'success',
    message: 'Hackathon record submitted for verification.',
    data: record,
  });
});

export const deleteHackathon = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Hackathon.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Hackathon record not found or access denied.', 404));

  const status = record.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot delete record while it is ${status}.`, 400));
  }

  await Hackathon.findByIdAndDelete(req.params.id);
  await updateProfileCompletion(student._id.toString());
  await logAction(req.user!.id, student.fullName, 'Student Deleted Hackathon', 'Hackathon', req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
