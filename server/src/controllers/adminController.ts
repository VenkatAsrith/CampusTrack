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
import { Announcement } from '../models/Announcement';
import { AuditLog } from '../models/AuditLog';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';
import {
  codeToSemester,
  semesterToCode,
  getYearFromSemester,
  isValidPromotion,
  VALID_BRANCHES,
  BRANCH_NAME_MAP,
} from '../utils/semesterHelper';

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
    select: 'fullName rollNumber',
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
  const actionText = status === 'VERIFIED' ? 'TPO Approved Record' : status === 'REJECTED' ? 'TPO Rejected Record' : 'TPO Set Record Under Review';
  await logAction(req.user!.id, 'TPO', `${actionText} (${moduleName} - ${studentName})`, moduleName, record._id);

  res.status(200).json({
    status: 'success',
    message: `Record successfully set to ${status}.`,
    data: record,
  });
});

// 2. Student Directory list with search, filter, sorting, pagination (Section completely removed!)
export const getStudents = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const {
    search,
    branch,
    year,
    semester,
    batch,
    minCgpa,
    maxCgpa,
    backlogs,
    minCompletion,
    maxCompletion,
    sortBy,
    sortOrder = 'asc',
    page = '1',
    limit = '10',
  } = req.query;

  const query: any = {};

  // Search filter (rollNumber, fullName, email, mobile)
  if (search) {
    query.$or = [
      { rollNumber: { $regex: search, $options: 'i' } },
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentMobile: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  // Academic filters
  if (branch) query.branch = branch;
  if (year) query.year = Number(year);
  if (semester) query.semester = Number(semester);
  if (batch) query.batch = batch;

  // Backlogs filter
  if (backlogs !== undefined && backlogs !== '') {
    query.numberOfBacklogs = Number(backlogs);
  }

  // CGPA range
  if (minCgpa || maxCgpa) {
    query.cgpa = {};
    if (minCgpa) query.cgpa.$gte = Number(minCgpa);
    if (maxCgpa) query.cgpa.$lte = Number(maxCgpa);
  }

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

  // Deterministic sorting: Branch -> Year -> Name / Roll Number
  const sort: any = {};
  if (sortBy) {
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.branch = 1;
    sort.year = 1;
    sort.rollNumber = 1;
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

// 3. Get Student Profile View for TPO (Fetches student info + all related tables)
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

// 4. TPO Dashboard Metrics Summary
export const getDashboardStats = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const totalStudents = await Student.countDocuments();
  const completedProfiles = await Student.countDocuments({ profileCompletion: { $gte: 80 } });
  const pendingProfiles = totalStudents - completedProfiles;

  // Backlogs & Eligibility Metrics
  const zeroBacklogsStudents = await Student.countDocuments({ numberOfBacklogs: 0 });
  const withBacklogsStudents = await Student.countDocuments({ numberOfBacklogs: { $gt: 0 } });
  const placementEligibleStudents = await Student.countDocuments({ cgpa: { $gte: 7.0 }, numberOfBacklogs: 0 });

  // Average CGPA
  const cgpaAgg = await Student.aggregate([
    { $group: { _id: null, avgCgpa: { $avg: '$cgpa' } } },
  ]);
  const averageCgpa = cgpaAgg.length > 0 ? Number(cgpaAgg[0].avgCgpa.toFixed(2)) : 0;

  // Count pending verification across modules
  const modules = [Project, Internship, Certification, NPTELRecord, Hackathon, Achievement];
  let awaitingVerification = 0;
  let verifiedCount = 0;
  let rejectedCount = 0;

  for (const Model of modules) {
    awaitingVerification += await Model.countDocuments({ 'verification.status': 'SUBMITTED' });
    verifiedCount += await Model.countDocuments({ 'verification.status': 'VERIFIED' });
    rejectedCount += await Model.countDocuments({ 'verification.status': 'REJECTED' });
  }

  // Announcements & Drives
  const activeAnnouncementsCount = await Announcement.countDocuments({ isPublished: true });
  const now = new Date();
  const upcomingDrivesCount = await Announcement.countDocuments({
    isPublished: true,
    isPlacementDrive: true,
    $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }],
  });

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
      rejectedRecords: rejectedCount,
      zeroBacklogsStudents,
      withBacklogsStudents,
      placementEligibleStudents,
      averageCgpa,
      activeAnnouncementsCount,
      upcomingDrivesCount,
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

  // B. Branch Distribution
  const branchDistribution = await Student.aggregate([
    {
      $group: {
        _id: '$branch',
        count: { $sum: 1 },
        avgCgpa: { $avg: '$cgpa' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // C. Year Distribution
  const yearDistribution = await Student.aggregate([
    {
      $group: {
        _id: '$year',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // D. Coding Platforms Participation
  const codingPlatforms = await CodingProfile.aggregate([
    {
      $group: {
        _id: '$platform',
        count: { $sum: 1 },
      },
    },
  ]);

  // E. Certification Categories
  const certCategories = await Certification.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);

  // F. Internship Participation
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
      cgpaDistribution: cgpaDistribution.map((item) => ({
        range:
          item._id === 10.01
            ? '9.0 - 10.0'
            : item._id === 9.0
            ? '8.0 - 9.0'
            : item._id === 8.0
            ? '7.0 - 8.0'
            : item._id === 7.0
            ? '6.0 - 7.0'
            : 'Below 6.0',
        count: item.count,
      })),
      branchDistribution: branchDistribution.map((b) => ({
        branch: b._id || 'Unknown',
        count: b.count,
        avgCgpa: Number((b.avgCgpa || 0).toFixed(2)),
      })),
      yearDistribution: yearDistribution.map((y) => ({
        year: `Year ${y._id || 1}`,
        count: y.count,
      })),
      codingPlatforms: codingPlatforms.map((item) => ({
        platform: item._id,
        count: item.count,
      })),
      certCategories: certCategories.map((item) => ({
        category: item._id,
        count: item.count,
      })),
      internshipStatus: internshipStatus.map((item) => ({
        status: item._id,
        count: item.count,
      })),
    },
  });
});

// 6. Get Audit Logs List
export const getAuditLogs = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
  res.status(200).json({
    status: 'success',
    data: logs,
  });
});

// 7. Get Year-Wise Dashboard Metrics (Part 9)
export const getYearStats = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const yearNum = parseInt(req.query.year as string, 10) || 4;

  const totalStudents = await Student.countDocuments({ year: yearNum });
  const verifiedStudents = await Student.countDocuments({ year: yearNum, verificationStatus: 'Verified' });
  const pendingVerification = await Student.countDocuments({ year: yearNum, verificationStatus: 'Pending' });
  
  // Placement Eligibility: CGPA >= 6.5 and Backlogs == 0
  const placementEligible = await Student.countDocuments({
    year: yearNum,
    cgpa: { $gte: 6.5 },
    numberOfBacklogs: 0,
  });

  const placedStudents = await Student.countDocuments({ year: yearNum, placementStatus: 'Placed' });
  const notPlacedStudents = await Student.countDocuments({
    year: yearNum,
    placementStatus: { $in: ['Not Placed', '', null] },
  });

  // Branch breakdown within this year
  const branchCounts = await Student.aggregate([
    { $match: { year: yearNum } },
    { $group: { _id: '$branch', count: { $sum: 1 }, avgCgpa: { $avg: '$cgpa' } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      year: yearNum,
      yearLabel: `${yearNum}${yearNum === 1 ? 'st' : yearNum === 2 ? 'nd' : yearNum === 3 ? 'rd' : 'th'} Year`,
      totalStudents,
      verifiedStudents,
      pendingVerification,
      placementEligible,
      placedStudents,
      notPlacedStudents,
      branchBreakdown: branchCounts.map((b) => ({
        branch: b._id,
        count: b.count,
        avgCgpa: Number((b.avgCgpa || 0).toFixed(2)),
      })),
    },
  });
});

// 8. Get Academic Hierarchy Tree: Year -> Branch -> Student Count (Parts 2 & 3)
export const getAcademicHierarchy = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const aggregation = await Student.aggregate([
    {
      $group: {
        _id: { year: '$year', branch: '$branch' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.branch': 1 } },
  ]);

  const tree: Record<number, { year: number; label: string; branches: { branch: string; count: number }[] }> = {
    1: { year: 1, label: '1st Year', branches: [] },
    2: { year: 2, label: '2nd Year', branches: [] },
    3: { year: 3, label: '3rd Year', branches: [] },
    4: { year: 4, label: '4th Year', branches: [] },
  };

  // Populate known branches
  [1, 2, 3, 4].forEach((y) => {
    VALID_BRANCHES.forEach((b) => {
      tree[y].branches.push({ branch: b, count: 0 });
    });
  });

  // Overlay actual counts
  aggregation.forEach((item) => {
    const y = item._id.year;
    const b = item._id.branch;
    if (tree[y]) {
      const branchEntry = tree[y].branches.find((entry) => entry.branch === b);
      if (branchEntry) {
        branchEntry.count = item.count;
      } else {
        tree[y].branches.push({ branch: b, count: item.count });
      }
    }
  });

  res.status(200).json({
    status: 'success',
    data: Object.values(tree),
  });
});

// 9. Bulk Semester Promotion with Safety Checks & Year Transitions (Parts 5, 6, 7)
export const promoteSemester = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { fromSemester, toSemester, branches, dryRun = false } = req.body;

  if (fromSemester === undefined || toSemester === undefined) {
    return next(new AppError('Both fromSemester and toSemester are required.', 400));
  }

  const fromSemNum = codeToSemester(fromSemester);
  const toSemNum = codeToSemester(toSemester);

  if (!isValidPromotion(fromSemNum, toSemNum)) {
    return next(
      new AppError(
        `Invalid semester promotion: Cannot promote from ${semesterToCode(fromSemNum)} to ${semesterToCode(toSemNum)}. Promotion must advance exactly 1 semester sequentially.`,
        400
      )
    );
  }

  const fromYear = getYearFromSemester(fromSemNum);
  const toYear = getYearFromSemester(toSemNum);
  const isYearTransition = toYear > fromYear;

  // Build target query
  const query: any = { semester: fromSemNum };
  if (Array.isArray(branches) && branches.length > 0) {
    query.branch = { $in: branches };
  }

  const matchingStudents = await Student.find(query).select('_id rollNumber fullName branch year semester').lean();
  const affectedCount = matchingStudents.length;
  const affectedBranches = Array.from(new Set(matchingStudents.map((s) => s.branch)));

  // If dryRun mode (Preview Phase before confirmation)
  if (dryRun) {
    return res.status(200).json({
      status: 'success',
      dryRun: true,
      data: {
        affectedCount,
        branches: affectedBranches,
        fromSemester: fromSemNum,
        fromSemesterCode: semesterToCode(fromSemNum),
        toSemester: toSemNum,
        toSemesterCode: semesterToCode(toSemNum),
        fromYear,
        toYear,
        isYearTransition,
      },
    });
  }

  // Execution Phase (After TPO Confirmation)
  if (affectedCount === 0) {
    return res.status(200).json({
      status: 'success',
      message: `No students found in semester ${semesterToCode(fromSemNum)} matching the selected criteria.`,
      updatedCount: 0,
      failedRecords: [],
    });
  }

  // Perform atomic bulk write update
  const studentIds = matchingStudents.map((s) => s._id);
  const updateResult = await Student.updateMany(
    { _id: { $in: studentIds } },
    {
      $set: {
        semester: toSemNum,
        year: toYear,
      },
    }
  );

  // Audit Logging
  await logAction(
    req.user!.id,
    'TPO Admin',
    `Promoted ${updateResult.modifiedCount} students from ${semesterToCode(fromSemNum)} to ${semesterToCode(toSemNum)}${isYearTransition ? ` (Year ${fromYear} -> ${toYear})` : ''}`,
    'SemesterPromotion',
    null
  );

  res.status(200).json({
    status: 'success',
    message: `Successfully promoted ${updateResult.modifiedCount} students from ${semesterToCode(fromSemNum)} to ${semesterToCode(toSemNum)}.`,
    data: {
      affectedCount,
      updatedCount: updateResult.modifiedCount,
      fromSemesterCode: semesterToCode(fromSemNum),
      toSemesterCode: semesterToCode(toSemNum),
      fromYear,
      toYear,
      isYearTransition,
      branches: affectedBranches,
      failedRecords: [],
    },
  });
});

// 10. TPO Secure Student Password Change (Part 16 & 17)
export const changeStudentPassword = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return next(new AppError('Both new password and confirm password are required.', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError('New password and confirm password do not match.', 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError('Password must be at least 6 characters long.', 400));
  }

  // Find student by MongoDB _id or rollNumber
  let student = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    student = await Student.findById(id);
  }
  if (!student) {
    student = await Student.findOne({ rollNumber: id.toUpperCase().trim() });
  }
  if (!student) {
    return next(new AppError('Student not found.', 404));
  }

  // Find associated User account
  const user = await User.findById(student.user);
  if (!user) {
    return next(new AppError('Associated user account not found.', 404));
  }

  // Update password - User pre-save hook will automatically hash using bcrypt (salt 10)
  user.password = newPassword;
  await user.save();

  // Secure Audit Logging (NEVER log plaintext passwords!)
  await logAction(
    req.user!.id,
    'TPO Admin',
    `TPO securely updated password for student ${student.rollNumber}`,
    'StudentSecurity',
    student._id
  );

  res.status(200).json({
    status: 'success',
    message: `Password for student ${student.rollNumber} (${student.fullName}) has been updated successfully.`,
  });
});

// 11. Get Academic Batches Summary (Part 8, 9, 10, 13)
export const getBatchesSummary = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const batches = await Student.aggregate([
    {
      $group: {
        _id: '$batch',
        admissionYear: { $first: '$admissionYear' },
        totalStudents: { $sum: 1 },
        activeStudents: {
          $sum: { $cond: [{ $eq: ['$academicStatus', 'Active'] }, 1, 0] },
        },
        graduatedStudents: {
          $sum: { $cond: [{ $eq: ['$academicStatus', 'Graduated'] }, 1, 0] },
        },
        detainedStudents: {
          $sum: { $cond: [{ $eq: ['$academicStatus', 'Detained'] }, 1, 0] },
        },
        avgYear: { $avg: '$year' },
        maxSemester: { $max: '$semester' },
        placedCount: {
          $sum: { $cond: [{ $eq: ['$placementStatus', 'Placed'] }, 1, 0] },
        },
        notPlacedCount: {
          $sum: { $cond: [{ $eq: ['$placementStatus', 'Not Placed'] }, 1, 0] },
        },
        verifiedCount: {
          $sum: { $cond: [{ $eq: ['$verificationStatus', 'Verified'] }, 1, 0] },
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$verificationStatus', 'Pending'] }, 1, 0] },
        },
        branches: { $addToSet: '$branch' },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  const formatted = batches.map((b) => {
    const isGraduated = b.graduatedStudents > 0 && b.graduatedStudents >= b.activeStudents;
    const isFinalSemester = b.maxSemester === 8;
    let status = 'Active';
    if (isGraduated) {
      status = 'Graduated';
    } else if (isFinalSemester) {
      status = 'Final Semester';
    }

    return {
      batch: b._id || 'Unknown',
      admissionYear: b.admissionYear || parseInt((b._id || '').substring(0, 4), 10) || new Date().getFullYear(),
      totalStudents: b.totalStudents,
      activeStudents: b.activeStudents,
      graduatedStudents: b.graduatedStudents,
      currentYear: Math.round(b.avgYear || 1),
      currentSemester: semesterToCode(b.maxSemester || 1),
      status,
      placementStats: {
        placed: b.placedCount,
        notPlaced: b.notPlacedCount,
        placementRate: b.totalStudents > 0 ? Math.round((b.placedCount / b.totalStudents) * 100) : 0,
      },
      verificationStats: {
        verified: b.verifiedCount,
        pending: b.pendingCount,
      },
      branches: b.branches.sort(),
    };
  });

  res.status(200).json({
    status: 'success',
    data: formatted,
  });
});

// 12. Graduate Batch (Part 9 & 10)
export const graduateBatch = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { batch } = req.params;
  if (!batch) {
    return next(new AppError('Batch identifier is required.', 400));
  }

  const updateResult = await Student.updateMany(
    { batch: batch.trim(), academicStatus: { $ne: 'Graduated' } },
    { $set: { academicStatus: 'Graduated' } }
  );

  await logAction(
    req.user!.id,
    'TPO Admin',
    `TPO marked batch ${batch} as Graduated (${updateResult.modifiedCount} students)`,
    'BatchManagement',
    null
  );

  res.status(200).json({
    status: 'success',
    message: `Batch ${batch} successfully marked as Graduated. ${updateResult.modifiedCount} student records updated. Historical cohort preserved.`,
    modifiedCount: updateResult.modifiedCount,
  });
});


