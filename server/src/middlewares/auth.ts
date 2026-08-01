import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { AppError } from '../utils/errors';
import { catchAsync } from './error';
import { AuthenticatedRequest } from '../types/express';

// Protect middleware to ensure user is logged in
export const protect = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token = '';

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // Verify token
  let decoded: any;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Grant access and store user details in req.user
  req.user = {
    id: currentUser._id.toString(),
    role: currentUser.role as 'student' | 'admin',
    rollNumber: currentUser.rollNumber || undefined,
    email: currentUser.email,
  };

  next();
});

// Restrict access to specific roles
export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You are not authorized to perform this action.', 403));
    }
    next();
  };
};
