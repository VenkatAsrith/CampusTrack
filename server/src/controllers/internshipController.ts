import { Response, NextFunction } from 'express';
import { Internship } from '../models/Internship';
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

export const getInternships = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let query: any = {};

  if (req.user?.role === 'admin') {
    if (req.query.studentId) query.student = req.query.studentId;
    if (req.query.status) query['verification.status'] = req.query.status;
  } else {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return next(new AppError('Student profile not found.', 404));
    query.student = student._id;
  }

  const records = await Internship.find(query).populate('certificate').populate('offerLetter').populate({
    path: 'student',
    select: 'fullName rollNumber branch'
  });

  res.status(200).json({
    status: 'success',
    results: records.length,
    data: records,
  });
});

export const createInternship = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const {
    company,
    role,
    startDate,
    endDate,
    internshipType,
    description,
    technologies,
    certificate,
    offerLetter,
  } = req.body;

  const record = await Internship.create({
    student: student._id,
    company,
    role,
    startDate,
    endDate,
    internshipType,
    description,
    technologies: Array.isArray(technologies) ? technologies : (technologies ? [technologies] : []),
    certificate,
    offerLetter,
    verification: {
      status: 'DRAFT',
    },
  });

  await updateProfileCompletion(student._id.toString());
  await logAction(req.user!.id, student.fullName, 'Student Created Internship Draft', 'Internship', record._id);

  res.status(201).json({
    status: 'success',
    data: record,
  });
});

export const updateInternship = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Internship.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Internship not found or access denied.', 404));

  const status = record.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot modify record while it is ${status}.`, 400));
  }

  const {
    company,
    role,
    startDate,
    endDate,
    internshipType,
    description,
    technologies,
    certificate,
    offerLetter,
  } = req.body;

  if (company !== undefined) record.company = company;
  if (role !== undefined) record.role = role;
  if (startDate !== undefined) record.startDate = startDate;
  if (endDate !== undefined) record.endDate = endDate;
  if (internshipType !== undefined) record.internshipType = internshipType;
  if (description !== undefined) record.description = description;
  if (technologies !== undefined) record.technologies = Array.isArray(technologies) ? technologies : [technologies];
  if (certificate !== undefined) record.certificate = certificate;
  if (offerLetter !== undefined) record.offerLetter = offerLetter;

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

export const submitInternship = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Internship.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Internship not found or access denied.', 404));

  if (record.verification.status !== 'DRAFT' && record.verification.status !== 'REJECTED') {
    return next(new AppError('Record is already submitted or verified.', 400));
  }

  record.verification.status = 'SUBMITTED';
  record.verification.rejectionReason = '';
  await record.save();

  await logAction(req.user!.id, student.fullName, 'Student Submitted Internship', 'Internship', record._id);

  res.status(200).json({
    status: 'success',
    message: 'Internship submitted for verification.',
    data: record,
  });
});

export const deleteInternship = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Internship.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Internship not found or access denied.', 404));

  const status = record.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot delete record while it is ${status}.`, 400));
  }

  await Internship.findByIdAndDelete(req.params.id);
  await updateProfileCompletion(student._id.toString());
  await logAction(req.user!.id, student.fullName, 'Student Deleted Internship', 'Internship', req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
