import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Link' },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const formFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'TEXT',
        'LONG_TEXT',
        'EMAIL',
        'PHONE',
        'NUMBER',
        'DATE',
        'DROPDOWN',
        'RADIO',
        'CHECKBOX',
        'FILE_UPLOAD',
        'URL',
        'YES_NO',
        'MULTI_SELECT',
      ],
      default: 'TEXT',
    },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
    placeholder: { type: String, default: '' },
    helpText: { type: String, default: '' },
  },
  { _id: false }
);

const applicationFormSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    fields: { type: [formFieldSchema], default: [] },
  },
  { _id: false }
);

const eligibilitySchema = new mongoose.Schema(
  {
    minCGPA: { type: Number, min: 0, max: 10, default: 0 },
    maxBacklogs: { type: Number, min: 0, default: 0 },
    eligibleBranches: { type: [String], default: [] },
    eligibleBatches: { type: [String], default: [] },
    eligibleYears: { type: [Number], default: [] },
    eligibleEntryTypes: { type: [String], default: [] },
  },
  { _id: false }
);

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Announcement description is required'],
      trim: true,
    },
    links: {
      type: [linkSchema],
      default: [],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    type: {
      type: String,
      enum: ['General', 'Academic', 'Placement', 'Internship', 'Drive', 'Event', 'Important'],
      default: 'General',
      index: true,
    },
    isPlacementDrive: {
      type: Boolean,
      default: false,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    jobRole: {
      type: String,
      trim: true,
      default: '',
    },
    compensation: {
      type: String,
      trim: true,
      default: '', // e.g. "₹12 LPA" or "₹40,000 / month"
    },
    location: {
      type: String,
      trim: true,
      default: '', // e.g. "Hyderabad / Bengaluru"
    },
    driveDate: {
      type: Date,
    },
    startDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endDate: {
      type: Date, // Deadline date
      index: true,
    },
    eligibility: {
      type: eligibilitySchema,
      default: () => ({}),
    },
    applicationForm: {
      type: applicationFormSchema,
      default: () => ({ enabled: true, fields: [] }),
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for dynamic status: UPCOMING, ACTIVE, EXPIRED
announcementSchema.virtual('status').get(function () {
  const now = new Date();
  if (this.startDate && new Date(this.startDate) > now) {
    return 'UPCOMING';
  }
  if (this.endDate && new Date(this.endDate) < now) {
    return 'EXPIRED';
  }
  return 'ACTIVE';
});

announcementSchema.index({ startDate: -1, endDate: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
