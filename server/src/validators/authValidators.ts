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
  branch: z.string().min(2, 'Branch is required').trim(),
  section: z.string().optional().default(''),
  batch: z.string().min(4, 'Batch/Year is required').trim(),
  cgpa: z.number().min(0).max(10).default(0),
  year: z.number().min(1).max(4).optional(),
  semester: z.number().min(1).max(8).default(1),
  careerInterest: z.string().min(2, 'Career interest is required').trim(),
});
