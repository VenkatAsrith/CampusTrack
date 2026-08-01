import { Response, NextFunction } from 'express';
import { CodingProfile } from '../models/CodingProfile';
import { Student } from '../models/Student';
import { AppError } from '../utils/errors';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';
import { updateProfileCompletion } from '../utils/profileCompletion';

// Get all coding profiles for logged-in student (or for admin with studentId query parameter)
export const getCodingProfiles = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let studentId = '';

  if (req.user?.role === 'admin') {
    studentId = req.query.studentId as string;
    if (!studentId) {
      return next(new AppError('Student ID is required for admin query.', 400));
    }
  } else {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return next(new AppError('Student profile not found.', 404));
    studentId = student._id.toString();
  }

  const profiles = await CodingProfile.find({ student: studentId });

  res.status(200).json({
    status: 'success',
    results: profiles.length,
    data: profiles,
  });
});

// Create coding profile (Student only)
export const createCodingProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const { platform, username, profileUrl, currentRating, highestRating, rank, problemsSolved } = req.body;

  // Check if platform profile already exists for student
  const existing = await CodingProfile.findOne({ student: student._id, platform });
  if (existing) {
    return next(new AppError(`You have already added a profile for ${platform}.`, 400));
  }

  const profile = await CodingProfile.create({
    student: student._id,
    platform,
    username,
    profileUrl,
    currentRating: currentRating ? Number(currentRating) : 0,
    highestRating: highestRating ? Number(highestRating) : 0,
    rank: rank ? Number(rank) : 0,
    problemsSolved: problemsSolved ? Number(problemsSolved) : 0,
  });

  // Update profile completion
  await updateProfileCompletion(student._id.toString());

  res.status(201).json({
    status: 'success',
    data: profile,
  });
});

// Update coding profile (Student only, isolation enforced by filtering on student ID)
export const updateCodingProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const { username, profileUrl, currentRating, highestRating, rank, problemsSolved } = req.body;

  const profile = await CodingProfile.findOneAndUpdate(
    { _id: req.params.id, student: student._id },
    {
      username,
      profileUrl,
      currentRating: currentRating !== undefined ? Number(currentRating) : undefined,
      highestRating: highestRating !== undefined ? Number(highestRating) : undefined,
      rank: rank !== undefined ? Number(rank) : undefined,
      problemsSolved: problemsSolved !== undefined ? Number(problemsSolved) : undefined,
    },
    { new: true, runValidators: true }
  );

  if (!profile) {
    return next(new AppError('Coding profile not found or access denied.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: profile,
  });
});

// Delete coding profile (Student only, isolation enforced)
export const deleteCodingProfile = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ user: req.user?.id });
  if (!student) return next(new AppError('Student profile not found.', 404));

  const profile = await CodingProfile.findOneAndDelete({ _id: req.params.id, student: student._id });

  if (!profile) {
    return next(new AppError('Coding profile not found or access denied.', 404));
  }

  // Update profile completion
  await updateProfileCompletion(student._id.toString());

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
