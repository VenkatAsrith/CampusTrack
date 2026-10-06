import mongoose from 'mongoose';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'REJECTED'
  | 'SELECTED'
  | 'WITHDRAWN';

const systemDataSchema = new mongoose.Schema(
  {
    rollNumber: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    batch: { type: String, required: true, trim: true },
    entryType: { type: String, default: 'REGULAR', trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    cgpa: { type: Number, default: 0 },
    backlogs: { type: Number, default: 0 },
    resumeLink: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    systemData: {
      type: systemDataSchema,
      required: true,
    },
    responses: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN'],
      default: 'SUBMITTED',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// DUPLICATE APPLICATION PREVENTION: Strict compound unique constraint
applicationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });

// High-speed indices for TPO filtering & shortlisting
applicationSchema.index({ driveId: 1, status: 1 });
applicationSchema.index({ driveId: 1, 'systemData.branch': 1, 'systemData.batch': 1 });

export const Application = mongoose.model('Application', applicationSchema);
