import mongoose from 'mongoose';

export const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
      default: 'DRAFT',
      required: true,
      index: true, // Index for easy filtering in admin queries
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  { _id: false }
);
