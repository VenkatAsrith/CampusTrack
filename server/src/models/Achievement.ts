import mongoose from 'mongoose';
import { verificationSchema } from './Verification';

const achievementSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    achievementTitle: {
      type: String,
      required: [true, 'Achievement title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Academic', 'Sports', 'Cultural', 'Leadership', 'Competition', 'Other'],
      required: [true, 'Category is required'],
    },
    level: {
      type: String,
      enum: ['College', 'University', 'District', 'State', 'National', 'International'],
      required: [true, 'Level is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    proofDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Proof document is required'],
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

export const Achievement = mongoose.model('Achievement', achievementSchema);
