import { Response, NextFunction } from 'express';
import { Student } from '../models/Student';
import { CodingProfile } from '../models/CodingProfile';
import { Project } from '../models/Project';
import { Internship } from '../models/Internship';
import { Certification } from '../models/Certification';
import { NPTELRecord } from '../models/NPTELRecord';
import { Hackathon } from '../models/Hackathon';
import { Achievement } from '../models/Achievement';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';
import { updateProfileCompletion } from '../utils/profileCompletion';
import { calculateCGPAFromSemesters } from '../utils/cgpaCalculator';
import { AuditLog } from '../models/AuditLog';

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

// Get current student profile
export const getMyProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'student') {
    return next(new AppError('Unauthorized: Only students can access this route.', 403));
  }

  const student = await Student.findOne({ user: req.user.id });
  if (!student) {
    return next(new AppError('Student profile not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: student,
  });
});

// Update student profile details (Roll Number, Email remain locked)
export const updateMyProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'student') {
    return next(new AppError('Unauthorized: Only students can modify their profile.', 403));
  }

  const student = await Student.findOne({ user: req.user.id });
  if (!student) {
    return next(new AppError('Student profile not found.', 404));
  }

  const {
    fullName,
    phone,
    studentMobile,
    studentId,
    gender,
    dob,
    branch,
    year,
    semester,
    motherName,
    motherMobile,
    fatherGuardianName,
    fatherGuardianMobile,
    address,
    academicQualification,
    sscPercentage,
    intermediatePercentage,
    diplomaPercentage,
    semesterResults,
    numberOfBacklogs,
    profilePhoto,
    careerInterest,
    github,
    linkedin,
    portfolio,
    resumeLink,
  } = req.body;

  // Basic Information
  if (fullName !== undefined) student.fullName = fullName;
  if (phone !== undefined) student.phone = phone;
  if (studentMobile !== undefined) student.studentMobile = studentMobile;
  if (!student.phone && student.studentMobile) student.phone = student.studentMobile;
  if (studentId !== undefined) student.studentId = studentId;
  if (gender !== undefined) student.gender = gender;
  if (dob !== undefined) student.dob = dob ? new Date(dob) : undefined;
  if (branch !== undefined) student.branch = branch;
  if (year !== undefined) student.year = Number(year);
  if (semester !== undefined) student.semester = Number(semester);

  // Parent / Guardian Information
  if (motherName !== undefined) student.motherName = motherName;
  if (motherMobile !== undefined) student.motherMobile = motherMobile;
  if (fatherGuardianName !== undefined) student.fatherGuardianName = fatherGuardianName;
  if (fatherGuardianMobile !== undefined) student.fatherGuardianMobile = fatherGuardianMobile;

  // Address
  if (address && typeof address === 'object') {
    student.address = {
      doorNo: address.doorNo !== undefined ? address.doorNo : (student.address?.doorNo || ''),
      street: address.street !== undefined ? address.street : (student.address?.street || ''),
      city: address.city !== undefined ? address.city : (student.address?.city || ''),
      district: address.district !== undefined ? address.district : (student.address?.district || ''),
      state: address.state !== undefined ? address.state : (student.address?.state || ''),
      pincode: address.pincode !== undefined ? address.pincode : (student.address?.pincode || ''),
    };
  }

  // Academic Information
  if (academicQualification !== undefined) student.academicQualification = academicQualification;
  if (sscPercentage !== undefined) student.sscPercentage = Number(sscPercentage);
  if (intermediatePercentage !== undefined) student.intermediatePercentage = Number(intermediatePercentage);
  if (diplomaPercentage !== undefined) student.diplomaPercentage = Number(diplomaPercentage);
  if (numberOfBacklogs !== undefined) student.numberOfBacklogs = Math.max(0, Number(numberOfBacklogs));

  // Dynamic Semester Results & Automatic CGPA Calculation
  if (Array.isArray(semesterResults)) {
    // Only accept semesters up to current semester, with valid percentage
    student.semesterResults = semesterResults
      .filter((s: any) => Number(s.semester) >= 1 && Number(s.semester) <= 8)
      .map((s: any) => ({
        semester: Number(s.semester),
        percentage: Number(s.percentage),
      })) as any;

    // Auto-calculate Overall CGPA on server side
    student.cgpa = calculateCGPAFromSemesters(student.semesterResults);
  }

  // Photo & Career Interest
  if (profilePhoto !== undefined) student.profilePhoto = profilePhoto;
  if (careerInterest !== undefined) student.careerInterest = careerInterest;

  // Social / Professional Links
  if (github !== undefined) student.github = github;
  if (linkedin !== undefined) student.linkedin = linkedin;
  if (portfolio !== undefined) student.portfolio = portfolio;
  if (resumeLink !== undefined) student.resumeLink = resumeLink;

  await student.save();

  // Recalculate profile completion
  const newCompletion = await updateProfileCompletion(student._id.toString());

  // Log action
  await logAction(req.user.id, student.fullName, 'Student Updated Profile & Academics', 'Student', student._id);

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully. CGPA and completion scores recalculated.',
    data: student,
  });
});

// Get comprehensive student dashboard summary (metrics, completion breakdown, notifications)
export const getDashboardSummary = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'student') {
    return next(new AppError('Unauthorized: Only students can access this route.', 403));
  }

  const student = await Student.findOne({ user: req.user.id });
  if (!student) {
    return next(new AppError('Student profile not found.', 404));
  }

  const studentId = student._id.toString();

  // 1. Fetch counts
  const codingCount = await CodingProfile.countDocuments({ student: studentId });
  const projectCount = await Project.countDocuments({ student: studentId });
  const internshipCount = await Internship.countDocuments({ student: studentId });
  const certCount = await Certification.countDocuments({ student: studentId });
  const nptelCount = await NPTELRecord.countDocuments({ student: studentId });
  const hackCount = await Hackathon.countDocuments({ student: studentId });
  const achCount = await Achievement.countDocuments({ student: studentId });

  // 2. Fetch completion breakdown
  const { calculateProfileCompletion } = require('../utils/profileCompletion');
  const completionInfo = await calculateProfileCompletion(studentId);

  // 3. Gather alerts (Pending or Rejected items)
  const alerts: any[] = [];

  // Project alerts
  const badProjects = await Project.find({ student: studentId, 'verification.status': { $in: ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'] } });
  badProjects.forEach((p: any) => {
    alerts.push({
      id: p._id,
      module: 'Projects',
      name: p.projectName,
      status: p.verification.status,
      reason: p.verification.rejectionReason,
      updatedAt: p.updatedAt,
    });
  });

  // Internship alerts
  const badInterns = await Internship.find({ student: studentId, 'verification.status': { $in: ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'] } });
  badInterns.forEach((i: any) => {
    alerts.push({
      id: i._id,
      module: 'Internships',
      name: `${i.company} (${i.role})`,
      status: i.verification.status,
      reason: i.verification.rejectionReason,
      updatedAt: i.updatedAt,
    });
  });

  // Certification alerts
  const badCerts = await Certification.find({ student: studentId, 'verification.status': { $in: ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'] } });
  badCerts.forEach((c: any) => {
    alerts.push({
      id: c._id,
      module: 'Certifications',
      name: c.certificationName,
      status: c.verification.status,
      reason: c.verification.rejectionReason,
      updatedAt: c.updatedAt,
    });
  });

  // NPTEL alerts
  const badNptel = await NPTELRecord.find({ student: studentId, 'verification.status': { $in: ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'] } });
  badNptel.forEach((n: any) => {
    alerts.push({
      id: n._id,
      module: 'NPTEL Courses',
      name: n.courseName,
      status: n.verification.status,
      reason: n.verification.rejectionReason,
      updatedAt: n.updatedAt,
    });
  });

  // Hackathon alerts
  const badHacks = await Hackathon.find({ student: studentId, 'verification.status': { $in: ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'] } });
  badHacks.forEach((h: any) => {
    alerts.push({
      id: h._id,
      module: 'Hackathons',
      name: h.hackathonName,
      status: h.verification.status,
      reason: h.verification.rejectionReason,
      updatedAt: h.updatedAt,
    });
  });

  // Achievement alerts
  const badAchs = await Achievement.find({ student: studentId, 'verification.status': { $in: ['SUBMITTED', 'UNDER_REVIEW', 'REJECTED'] } });
  badAchs.forEach((a: any) => {
    alerts.push({
      id: a._id,
      module: 'Achievements',
      name: a.achievementTitle,
      status: a.verification.status,
      reason: a.verification.rejectionReason,
      updatedAt: a.updatedAt,
    });
  });

  res.status(200).json({
    status: 'success',
    data: {
      student,
      metrics: {
        codingProfiles: codingCount,
        projects: projectCount,
        internships: internshipCount,
        certifications: certCount,
        nptel: nptelCount,
        hackathons: hackCount,
        achievements: achCount,
      },
      completion: completionInfo,
      alerts: alerts.sort((a, b) => b.updatedAt - a.updatedAt),
    },
  });
});
