import { z } from 'zod';

export const loginSchema = z.object({
  // Roll number or Email can be accepted
  rollNumber: z.string().trim().toUpperCase().optional(),
  email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
}).refine(data => data.rollNumber || data.email, {
  message: "Either Roll Number (for student) or Email (for admin) must be provided",
  path: ["rollNumber"],
});

export const studentRegisterSchema = z.object({
  rollNumber: z.string().min(3, 'Roll number must be at least 3 characters').trim().toUpperCase(),
  fullName: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').trim(),
  branch: z.string().min(2, 'Branch is required').trim(),
  section: z.string().min(1, 'Section is required').trim(),
  batch: z.string().min(4, 'Batch/Year is required').trim(),
  cgpa: z.number().min(0).max(10).default(0),
  semester: z.number().min(1).max(8).default(1),
  careerInterest: z.string().min(2, 'Career interest is required').trim(),
});
