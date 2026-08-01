import mongoose from 'mongoose';
import { verificationSchema } from './Verification';

const projectSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    technologies: {
      type: [String],
      required: [true, 'Technologies are required'],
      default: [],
    },
    category: {
      type: String,
      enum: ['Web Development', 'Data Science', 'Machine Learning', 'AI', 'Data Engineering', 'Mobile', 'Cloud', 'Other'],
      required: [true, 'Category is required'],
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    liveDemoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    studentRole: {
      type: String,
      required: [true, 'Student role is required'],
      trim: true,
    },
    projectType: {
      type: String,
      enum: ['Academic', 'Personal', 'Minor Project', 'Major Project', 'Hackathon'],
      required: [true, 'Project type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    proofDocument: {
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

export const Project = mongoose.model('Project', projectSchema);
