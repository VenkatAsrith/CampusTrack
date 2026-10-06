import { z } from 'zod';

export const loginSchema = z.object({
  // Single unified identifier or specific rollNumber/email
  identifier: z.string().trim().optional(),
  rollNumber: z.string().trim().toUpperCase().optional(),
  email: z.string().trim().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(data => data.identifier || data.rollNumber || data.email, {
  message: "Please enter your Roll Number or Email address",
  path: ["identifier"],
});

export const studentRegisterSchema = z.object({
  rollNumber: z.string().min(3, 'Roll number must be at least 3 characters').trim().toUpperCase(),
  fullName: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').trim(),
  branch: z.string().optional(),
  section: z.string().optional().default(''),
  batch: z.string().optional(),
  cgpa: z.number().min(0).max(10).optional().default(0),
  year: z.number().min(1).max(4).optional(),
  semester: z.number().min(1).max(8).optional().default(1),
  careerInterest: z.string().optional().default('Software Engineering'),
  gender: z.string().optional().default(''),
  dob: z.string().optional(),
  motherName: z.string().optional().default(''),
  motherMobile: z.string().optional().default(''),
  fatherGuardianName: z.string().optional().default(''),
  fatherGuardianMobile: z.string().optional().default(''),
  academicQualification: z.enum(['Intermediate', 'Diploma', '']).optional().default('Intermediate'),
  sscPercentage: z.number().min(0).max(100).optional().default(0),
  intermediatePercentage: z.number().min(0).max(100).optional().default(0),
  diplomaPercentage: z.number().min(0).max(100).optional().default(0),
  numberOfBacklogs: z.number().min(0).optional().default(0),
  entryType: z.enum(['REGULAR', 'LATERAL_ENTRY', 'TRANSFER', 'SPECIAL_ENTRY']).optional(),
  resolutionMode: z.enum(['AUTOMATIC', 'ASSISTED', 'MANUAL']).optional(),
});
