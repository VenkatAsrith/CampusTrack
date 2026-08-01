import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Project } from '../models/Project';
import { Internship } from '../models/Internship';
import { Certification } from '../models/Certification';
import { NPTELRecord } from '../models/NPTELRecord';
import { Hackathon } from '../models/Hackathon';
import { Achievement } from '../models/Achievement';
import { CodingProfile } from '../models/CodingProfile';
import { AuditLog } from '../models/AuditLog';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';

// Helper to map module param to Mongoose model
const getModelByModule = (moduleName: string): mongoose.Model<any> | null => {
  switch (moduleName.toLowerCase()) {
    case 'projects':
      return Project;
    case 'internships':
      return Internship;
    case 'certifications':
      return Certification;
    case 'nptel':
      return NPTELRecord;
    case 'hackathons':
      return Hackathon;
    case 'achievements':
      return Achievement;
    default:
      return null;
  }
};

// Helper to log audit actions
const logAction = async (userId: string, userName: string, action: string, entity: string, entityId: any) => {
  try {
    await AuditLog.create({ user: userId, userName, action, entity, entityId });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

// 1. Verify/Reject Student Records
export const verifyRecord = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { module: moduleName, id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!['VERIFIED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
    return next(new AppError('Invalid status value. Must be VERIFIED, REJECTED, or UNDER_REVIEW.', 400));
  }

  if (status === 'REJECTED' && !rejectionReason) {
    return next(new AppError('Rejection reason comment is required when rejecting a record.', 400));
  }

  const Model = getModelByModule(moduleName);
  if (!Model) {
    return next(new AppError(`Invalid module name: ${moduleName}`, 400));
  }

  const record = await Model.findById(id).populate({
    path: 'student',
    select: 'fullName rollNumber'
  });

  if (!record) {
    return next(new AppError('Record not found.', 404));
  }

  // Update verification details
  record.verification.status = status;
  record.verification.rejectionReason = status === 'REJECTED' ? rejectionReason : '';
  record.verification.verifiedBy = req.user!.id;
  record.verification.verifiedAt = new Date();

  await record.save();

  // Audit Logging
  const studentName = record.student?.fullName || 'Student';
  const actionText = status === 'VERIFIED' ? 'Admin Approved Record' : status === 'REJECTED' ? 'Admin Rejected Record' : 'Admin Set Record Under Review';
  await logAction(req.user!.id, 'Admin', `${actionText} (${moduleName})`, moduleName, record._id);

  res.status(200).json({
    status: 'success',
    message: `Record successfully set to ${status}.`,
    data: record,
  });
});

// 2. Student Directory list with search, filter, sorting, pagination
export const getStudents = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { search, branch, batch, minCompletion, maxCompletion, sortBy, sortOrder = 'asc', page = '1', limit = '10' } = req.query;

  const query: any = {};

  // Search filter (rollNumber, fullName, email)
  if (search) {
    query.$or = [
      { rollNumber: { $regex: search, $options: 'i' } },
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Exact filters
  if (branch) query.branch = branch;
  if (batch) query.batch = batch;

  // Profile completion range
  if (minCompletion || maxCompletion) {
    query.profileCompletion = {};
    if (minCompletion) query.profileCompletion.$gte = Number(minCompletion);
    if (maxCompletion) query.profileCompletion.$lte = Number(maxCompletion);
  }

  // Pagination
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sort: any = {};
  if (sortBy) {
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.rollNumber = 1; // Default sort by Roll Number
  }

  const students = await Student.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Student.countDocuments(query);

  res.status(200).json({
    status: 'success',
    page: pageNum,
    limit: limitNum,
    total,
    pages: Math.ceil(total / limitNum),
    data: students,
  });
});

// 3. Get Student Profile View for Admin (Fetches student info + all related tables)
export const getStudentProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return next(new AppError('Student profile not found.', 404));
  }

  const studentId = student._id;

  // Fetch all related sub-module records
  const codingProfiles = await CodingProfile.find({ student: studentId });
  const projects = await Project.find({ student: studentId }).populate('proofDocument');
  const internships = await Internship.find({ student: studentId }).populate('certificate').populate('offerLetter');
  const certifications = await Certification.find({ student: studentId }).populate('certificateFile');
  const nptel = await NPTELRecord.find({ student: studentId }).populate('certificate');
  const hackathons = await Hackathon.find({ student: studentId }).populate('certificate');
  const achievements = await Achievement.find({ student: studentId }).populate('proofDocument');

  res.status(200).json({
    status: 'success',
    data: {
      student,
      codingProfiles,
      projects,
      internships,
      certifications,
      nptel,
      hackathons,
      achievements,
    },
  });
});

// 4. Admin Dashboard Metrics Summary
export const getDashboardStats = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const totalStudents = await Student.countDocuments();
  const completedProfiles = await Student.countDocuments({ profileCompletion: { $gte: 80 } });
  const pendingProfiles = totalStudents - completedProfiles;

  // Count pending verification across modules
  const modules = [Project, Internship, Certification, NPTELRecord, Hackathon, Achievement];
  let awaitingVerification = 0;
  let verifiedCount = 0;

  for (const Model of modules) {
    awaitingVerification += await Model.countDocuments({ 'verification.status': 'SUBMITTED' });
    verifiedCount += await Model.countDocuments({ 'verification.status': 'VERIFIED' });
  }

  // Module counts
  const totalProjects = await Project.countDocuments();
  const totalInternships = await Internship.countDocuments();
  const totalCertifications = await Certification.countDocuments();
  const totalHackathons = await Hackathon.countDocuments();

  res.status(200).json({
    status: 'success',
    data: {
      totalStudents,
      completedProfiles,
      pendingProfiles,
      awaitingVerification,
      verifiedRecords: verifiedCount,
      totalProjects,
      totalInternships,
      totalCertifications,
      totalHackathons,
    },
  });
});

// 5. Analytics Aggregations for Charts
export const getAnalytics = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // A. CGPA Distribution
  const cgpaDistribution = await Student.aggregate([
    {
      $bucket: {
        groupBy: '$cgpa',
        boundaries: [0, 6.0, 7.0, 8.0, 9.0, 10.01],
        default: 'Other',
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ]);

  // B. Coding Platforms Participation
  const codingPlatforms = await CodingProfile.aggregate([
    {
      $group: {
        _id: '$platform',
        count: { $sum: 1 },
      },
    },
  ]);

  // C. Certification Categories
  const certCategories = await Certification.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);

  // D. Internship Participation (Verified vs Submitted vs Draft)
  const internshipStatus = await Internship.aggregate([
    {
      $group: {
        _id: '$verification.status',
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      cgpaDistribution: cgpaDistribution.map(item => ({
        range: item._id === 10.01 ? '9.0 - 10.0' :
               item._id === 9.0 ? '8.0 - 9.0' :
               item._id === 8.0 ? '7.0 - 8.0' :
               item._id === 7.0 ? '6.0 - 7.0' : 'Below 6.0',
        count: item.count,
      })),
      codingPlatforms: codingPlatforms.map(item => ({
        platform: item._id,
        count: item.count,
      })),
      certCategories: certCategories.map(item => ({
        category: item._id,
        count: item.count,
      })),
      internshipStatus: internshipStatus.map(item => ({
        status: item._id,
        count: item.count,
      })),
    },
  });
});

// 6. Get Audit Logs List
export const getAuditLogs = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50);
  res.status(200).json({
    status: 'success',
    data: logs,
  });
});
