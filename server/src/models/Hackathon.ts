import mongoose from 'mongoose';
import { verificationSchema } from './Verification';

const hackathonSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    hackathonName: {
      type: String,
      required: [true, 'Hackathon name is required'],
      trim: true,
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    teamName: {
      type: String,
      trim: true,
      default: '',
    },
    studentRole: {
      type: String,
      required: [true, 'Student role is required'],
      trim: true,
    },
    projectName: {
      type: String,
      trim: true,
      default: '',
    },
    position: {
      type: String,
      enum: ['Participant', 'Finalist', 'Top 100', 'Top 50', 'Top 10', 'Winner', 'Runner-up'],
      required: [true, 'Position is required'],
    },
    projectLink: {
      type: String,
      trim: true,
      default: '',
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

export const Hackathon = mongoose.model('Hackathon', hackathonSchema);
