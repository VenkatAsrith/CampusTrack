import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { signToken } from '../utils/jwt';
import { loginSchema, studentRegisterSchema } from '../validators/authValidators';
import { AuthenticatedRequest } from '../types/express';
import { AuditLog } from '../models/AuditLog';

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
  } = parsed.data;

  // Check if roll number or email already exists
  const existingUser = await User.findOne({
    $or: [{ rollNumber }, { email }],
  });

  if (existingUser) {
    return next(new AppError('Student with this Roll Number or Email already exists.', 400));
  }

  // Create User
  const newUser = await User.create({
    rollNumber,
    email,
    password,
    role: 'student',
  });

  // Create associated Student profile
  const newStudent = await Student.create({
    user: newUser._id,
    rollNumber,
    fullName,
    email,
    phone,
    branch,
    section,
    batch,
    cgpa,
    year: parsed.data.year || Math.min(Math.max(Math.ceil(semester / 2), 1), 4),
    semester,
    careerInterest,
    profileCompletion: 20, // 20% weight for Basic Profile setup
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
