import { Response, NextFunction } from 'express';
import { Certification } from '../models/Certification';
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

export const getCertifications = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let query: any = {};

  if (req.user?.role === 'admin') {
    if (req.query.studentId) query.student = req.query.studentId;
    if (req.query.status) query['verification.status'] = req.query.status;
  } else {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return next(new AppError('Student profile not found.', 404));
    query.student = student._id;
  }

  const records = await Certification.find(query).populate('certificateFile').populate({
    path: 'student',
    select: 'fullName rollNumber branch'
  });

  res.status(200).json({
    status: 'success',
    results: records.length,
    data: records,
  });
});

export const createCertification = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const {
    certificationName,
    issuingOrganization,
    category,
    issueDate,
    credentialId,
    credentialUrl,
    certificateFile,
  } = req.body;

  if (!certificateFile) {
    return next(new AppError('Certificate file attachment is required.', 400));
  }

  const record = await Certification.create({
    student: student._id,
    certificationName,
    issuingOrganization,
    category,
    issueDate,
    credentialId,
    credentialUrl,
    certificateFile,
    verification: {
      status: 'DRAFT',
    },
  });

  await updateProfileCompletion(student._id.toString());
  await logAction(req.user!.id, student.fullName, 'Student Added Certification Draft', 'Certification', record._id);

  res.status(201).json({
    status: 'success',
    data: record,
  });
});

export const updateCertification = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Certification.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Certification not found or access denied.', 404));

  const status = record.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot modify record while it is ${status}.`, 400));
  }

  const {
    certificationName,
    issuingOrganization,
    category,
    issueDate,
    credentialId,
    credentialUrl,
    certificateFile,
  } = req.body;

  if (certificationName !== undefined) record.certificationName = certificationName;
  if (issuingOrganization !== undefined) record.issuingOrganization = issuingOrganization;
  if (category !== undefined) record.category = category;
  if (issueDate !== undefined) record.issueDate = issueDate;
  if (credentialId !== undefined) record.credentialId = credentialId;
  if (credentialUrl !== undefined) record.credentialUrl = credentialUrl;
  if (certificateFile !== undefined) record.certificateFile = certificateFile;

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

export const submitCertification = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Certification.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Certification not found or access denied.', 404));

  if (record.verification.status !== 'DRAFT' && record.verification.status !== 'REJECTED') {
    return next(new AppError('Record is already submitted or verified.', 400));
  }

  record.verification.status = 'SUBMITTED';
  record.verification.rejectionReason = '';
  await record.save();

  await logAction(req.user!.id, student.fullName, 'Student Submitted Certification', 'Certification', record._id);

  res.status(200).json({
    status: 'success',
    message: 'Certification submitted for verification.',
    data: record,
  });
});

export const deleteCertification = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const record = await Certification.findOne({ _id: req.params.id, student: student._id });
  if (!record) return next(new AppError('Certification not found or access denied.', 404));

  const status = record.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot delete record while it is ${status}.`, 400));
  }

  await Certification.findByIdAndDelete(req.params.id);
  await updateProfileCompletion(student._id.toString());
  await logAction(req.user!.id, student.fullName, 'Student Deleted Certification', 'Certification', req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
