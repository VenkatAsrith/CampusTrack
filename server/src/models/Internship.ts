import mongoose from 'mongoose';
import { verificationSchema } from './Verification';

const internshipSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    internshipType: {
      type: String,
      enum: ['On-site', 'Remote', 'Hybrid'],
      required: [true, 'Internship type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
    certificate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    offerLetter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    verification: {
      type: verificationSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

export const Internship = mongoose.model('Internship', internshipSchema);
