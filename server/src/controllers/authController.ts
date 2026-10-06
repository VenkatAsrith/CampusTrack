import { Response, Request, NextFunction } from 'express';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { signToken } from '../utils/jwt';
import { loginSchema, studentRegisterSchema } from '../validators/authValidators';
import { AuthenticatedRequest } from '../types/express';
import { AuditLog } from '../models/AuditLog';
import { parseRollNumber } from '../utils/rollNumberParser';

// Helper to log audit actions
const logAction = async (userId: string | undefined, userName: string, action: string, entity: string, entityId?: any) => {
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

// Check & Parse Roll Number (zero latency verification + duplicate detection)
export const checkAndParseRoll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { rollNumber } = req.params;
  const upperRoll = (rollNumber || '').trim().toUpperCase();
  const parsed = parseRollNumber(upperRoll);

  const existing = await User.findOne({ rollNumber: upperRoll });

  res.status(200).json({
    status: 'success',
    data: {
      exists: Boolean(existing),
      parsed,
    },
  });
});

// Register Student Profile (primarily used internally or for new registrations)
export const registerStudent = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const parsed = studentRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.errors[0].message, 400));
  }

  const {
    rollNumber,
    fullName,
    email,
    password,
    phone,
    branch,
    section,
    batch,
    cgpa,
    semester,
    careerInterest,
    gender,
    dob,
    motherName,
    motherMobile,
    fatherGuardianName,
    fatherGuardianMobile,
    academicQualification,
    sscPercentage,
    intermediatePercentage,
    diplomaPercentage,
    numberOfBacklogs,
    entryType,
    resolutionMode,
  } = parsed.data;

  const normalizedRoll = rollNumber.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  // Check if roll number or email already exists
  const existingUser = await User.findOne({
    $or: [{ rollNumber: normalizedRoll }, { email: normalizedEmail }],
  });

  if (existingUser) {
    return next(new AppError('An account already exists with this roll number or email. Sign in instead.', 400));
  }

  // Parse roll number intelligence
  const rollIntel = parseRollNumber(normalizedRoll);
  const resolvedBranch = branch ? branch.trim() : rollIntel.branch;
  const resolvedBatch = batch ? batch.trim() : rollIntel.batch;
  const resolvedEntryType = entryType || rollIntel.entryType;
  const resolvedGraduationYear = rollIntel.graduationYear;
  const resolvedResolutionMode = resolutionMode || rollIntel.resolutionMode;

  // Create User
  const newUser = await User.create({
    rollNumber: normalizedRoll,
    email: normalizedEmail,
    password,
    role: 'student',
  });

  // Calculate base profile completion
  let initialCompletion = 35; // Core identity & basic credentials completed
  if (sscPercentage && (intermediatePercentage || diplomaPercentage)) initialCompletion += 15;
  if (motherName || fatherGuardianName) initialCompletion += 10;

  // Create associated Student profile
  const newStudent = await Student.create({
    user: newUser._id,
    rollNumber: normalizedRoll,
    normalizedRollNumber: normalizedRoll,
    fullName: fullName.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    studentMobile: phone.trim(),
    branch: resolvedBranch,
    branchCode: rollIntel.branchCode,
    section: section || '',
    batch: resolvedBatch,
    entryType: resolvedEntryType,
    graduationYear: resolvedGraduationYear,
    resolutionMode: resolvedResolutionMode,
    admissionYear: rollIntel.admissionYear,
    cgpa: cgpa || 0,
    numberOfBacklogs: numberOfBacklogs || 0,
    year: parsed.data.year || Math.min(Math.max(Math.ceil((semester || 1) / 2), 1), 4),
    semester: semester || 1,
    careerInterest: careerInterest || 'Software Engineering',
    gender: gender || '',
    dob: dob ? new Date(dob) : undefined,
    motherName: motherName || '',
    motherMobile: motherMobile || '',
    fatherGuardianName: fatherGuardianName || '',
    fatherGuardianMobile: fatherGuardianMobile || '',
    academicQualification: academicQualification || 'Intermediate',
    sscPercentage: sscPercentage || 0,
    intermediatePercentage: intermediatePercentage || 0,
    diplomaPercentage: diplomaPercentage || 0,
    profileCompletion: initialCompletion,
  });

  // Log action
  await logAction(newUser._id.toString(), fullName, 'Student Registered', 'Student', newStudent._id);

  // Generate JWT token
  const token = signToken(newUser._id.toString(), newUser.role);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: {
        id: newUser._id,
        rollNumber: newUser.rollNumber,
        email: newUser.email,
        role: newUser.role,
      },
      student: newStudent,
    },
  });
});

// Login controller (supports Student rollNumber and Admin email login)
export const login = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(parsed.error.errors[0].message, 400));
  }

  const { identifier, rollNumber, email, password } = parsed.data;
  const rawInput = (identifier || rollNumber || email || '').trim();
  const isEmail = rawInput.includes('@');

  let user;
  if (isEmail) {
    // TPO / Admin Login by Email
    user = await User.findOne({ email: rawInput.toLowerCase() }).select('+password');
    if (!user) {
      return next(new AppError("User doesn't exist. Please check your official email.", 404));
    }
  } else {
    // Student Login by Roll Number (case-insensitive via uppercase)
    const upperRoll = rawInput.toUpperCase();
    user = await User.findOne({ rollNumber: upperRoll }).select('+password');
    if (!user) {
      return next(new AppError("User doesn't exist. Please check your roll number.", 404));
    }
  }

  if (!user || !(await (user as any).comparePassword(password))) {
    return next(new AppError('Incorrect password. Please verify your password and try again.', 401));
  }

  // Fetch student profile if the role is student
  let student = null;
  let displayName = 'Admin';
  if (user.role === 'student') {
    student = await Student.findOne({ user: user._id });
    displayName = student ? student.fullName : 'Student';
  }

  // Log login audit log
  await logAction(user._id.toString(), displayName, 'User Logged In', 'User', user._id);

  // Generate JWT
  const token = signToken(user._id.toString(), user.role);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        rollNumber: user.rollNumber,
        email: user.email,
        role: user.role,
      },
      student,
    },
  });
});

// Get currently logged-in user profile
export const getMe = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Not authenticated.', 401));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User no longer exists.', 404));
  }

  let student = null;
  if (user.role === 'student') {
    student = await Student.findOne({ user: user._id });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        rollNumber: user.rollNumber,
        email: user.email,
        role: user.role,
      },
      student,
    },
  });
});
