import { Response, NextFunction } from 'express';
import { Project } from '../models/Project';
import { Student } from '../models/Student';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';
import { updateProfileCompletion } from '../utils/profileCompletion';
import { AuditLog } from '../models/AuditLog';

// Helper to log actions
const logAction = async (userId: string, userName: string, action: string, entity: string, entityId: any) => {
  try {
    await AuditLog.create({ user: userId, userName, action, entity, entityId });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

// Get projects (Student gets own; Admin gets by studentId or all pending)
export const getProjects = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let query: any = {};

  if (req.user?.role === 'admin') {
    if (req.query.studentId) {
      query.student = req.query.studentId;
    }
    if (req.query.status) {
      query['verification.status'] = req.query.status;
    }
  } else {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return next(new AppError('Student profile not found.', 404));
    query.student = student._id;
  }

  const projects = await Project.find(query).populate('proofDocument').populate({
    path: 'student',
    select: 'fullName rollNumber branch'
  });

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: projects,
  });
});

// Create project (Student only, defaults to DRAFT)
export const createProject = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const {
    projectName,
    description,
    technologies,
    category,
    githubUrl,
    liveDemoUrl,
    studentRole,
    projectType,
    startDate,
    endDate,
    proofDocument,
  } = req.body;

  const project = await Project.create({
    student: student._id,
    projectName,
    description,
    technologies: Array.isArray(technologies) ? technologies : [technologies],
    category,
    githubUrl,
    liveDemoUrl,
    studentRole,
    projectType,
    startDate,
    endDate,
    proofDocument,
    verification: {
      status: 'DRAFT',
    },
  });

  // Update profile completion
  await updateProfileCompletion(student._id.toString());

  // Log action
  await logAction(req.user!.id, student.fullName, 'Student Created Project Draft', 'Project', project._id);

  res.status(201).json({
    status: 'success',
    data: project,
  });
});

// Update project (Student only, enforces isolation & checks status)
export const updateProject = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  // Find project
  const project = await Project.findOne({ _id: req.params.id, student: student._id });
  if (!project) {
    return next(new AppError('Project not found or access denied.', 404));
  }

  // Can only update if in DRAFT or REJECTED status
  const status = project.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot modify record while it is ${status}.`, 400));
  }

  const {
    projectName,
    description,
    technologies,
    category,
    githubUrl,
    liveDemoUrl,
    studentRole,
    projectType,
    startDate,
    endDate,
    proofDocument,
  } = req.body;

  if (projectName !== undefined) project.projectName = projectName;
  if (description !== undefined) project.description = description;
  if (technologies !== undefined) project.technologies = Array.isArray(technologies) ? technologies : [technologies];
  if (category !== undefined) project.category = category;
  if (githubUrl !== undefined) project.githubUrl = githubUrl;
  if (liveDemoUrl !== undefined) project.liveDemoUrl = liveDemoUrl;
  if (studentRole !== undefined) project.studentRole = studentRole;
  if (projectType !== undefined) project.projectType = projectType;
  if (startDate !== undefined) project.startDate = startDate;
  if (endDate !== undefined) project.endDate = endDate;
  if (proofDocument !== undefined) project.proofDocument = proofDocument;

  // Re-draft status on update if it was rejected
  if (status === 'REJECTED') {
    project.verification.status = 'DRAFT';
    project.verification.rejectionReason = '';
  }

  await project.save();

  res.status(200).json({
    status: 'success',
    data: project,
  });
});

// Submit project for verification
export const submitProject = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const project = await Project.findOne({ _id: req.params.id, student: student._id });
  if (!project) {
    return next(new AppError('Project not found or access denied.', 404));
  }

  if (project.verification.status !== 'DRAFT' && project.verification.status !== 'REJECTED') {
    return next(new AppError('Project is already submitted or verified.', 400));
  }

  project.verification.status = 'SUBMITTED';
  project.verification.rejectionReason = '';
  await project.save();

  // Log action
  await logAction(req.user!.id, student.fullName, 'Student Submitted Project', 'Project', project._id);

  res.status(200).json({
    status: 'success',
    message: 'Project submitted for verification.',
    data: project,
  });
});

// Delete project (Student only, checks status)
export const deleteProject = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const project = await Project.findOne({ _id: req.params.id, student: student._id });
  if (!project) {
    return next(new AppError('Project not found or access denied.', 404));
  }

  const status = project.verification.status;
  if (status !== 'DRAFT' && status !== 'REJECTED') {
    return next(new AppError(`Cannot delete record while it is ${status}.`, 400));
  }

  await Project.findByIdAndDelete(req.params.id);

  // Update profile completion
  await updateProfileCompletion(student._id.toString());

  // Log action
  await logAction(req.user!.id, student.fullName, 'Student Deleted Project', 'Project', req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
