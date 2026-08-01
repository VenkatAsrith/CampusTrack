import mongoose from 'mongoose';
import { verificationSchema } from './Verification';

const nptelRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    courseId: {
      type: String,
      required: [true, 'Course ID is required'],
      trim: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: 0,
      max: 100,
    },
    certificationType: {
      type: String,
      enum: ['Participation', 'Elite', 'Elite + Silver', 'Elite + Gold'],
      required: [true, 'Certification type is required'],
    },
    eliteStatus: {
      type: Boolean,
      default: false,
    },
    rank: {
      type: Number,
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    certificate: {
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

export const NPTELRecord = mongoose.model('NPTELRecord', nptelRecordSchema);
