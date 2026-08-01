import mongoose from 'mongoose';
import { verificationSchema } from './Verification';

const certificationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    certificationName: {
      type: String,
      required: [true, 'Certification name is required'],
      trim: true,
    },
    issuingOrganization: {
      type: String,
      required: [true, 'Issuing organization is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Programming', 'Cloud', 'Data', 'AI/ML', 'Database', 'Cybersecurity', 'DevOps', 'Other'],
      required: [true, 'Category is required'],
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },
    credentialId: {
      type: String,
      trim: true,
      default: '',
    },
    credentialUrl: {
      type: String,
      trim: true,
      default: '',
    },
    certificateFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Certificate file is required'],
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

export const Certification = mongoose.model('Certification', certificationSchema);
