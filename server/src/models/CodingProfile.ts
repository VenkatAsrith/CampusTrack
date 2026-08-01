import mongoose from 'mongoose';

const codingProfileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['LeetCode', 'CodeChef', 'HackerRank', 'GeeksforGeeks', 'Codeforces', 'Other'],
      required: [true, 'Platform is required'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    profileUrl: {
      type: String,
      required: [true, 'Profile URL is required'],
      trim: true,
    },
    currentRating: {
      type: Number,
      default: 0,
    },
    highestRating: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 0,
    },
    problemsSolved: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate platforms for same student
codingProfileSchema.index({ student: 1, platform: 1 }, { unique: true });

export const CodingProfile = mongoose.model('CodingProfile', codingProfileSchema);
