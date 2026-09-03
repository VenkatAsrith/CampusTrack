import mongoose from 'mongoose';

const semesterResultSchema = new mongoose.Schema(
  {
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    doorNo: { type: String, trim: true, default: '' },
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pincode: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    studentId: {
      type: String,
      trim: true,
      default: '',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    studentMobile: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      trim: true,
      default: '',
    },
    dob: {
      type: Date,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
      index: true,
    },
    section: {
      type: String,
      trim: true,
      default: '',
    },
    batch: {
      type: String,
      required: [true, 'Batch is required'],
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 4,
      default: 1,
      index: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
      default: 1,
      index: true,
    },
    motherName: {
      type: String,
      trim: true,
      default: '',
    },
    motherMobile: {
      type: String,
      trim: true,
      default: '',
    },
    fatherGuardianName: {
      type: String,
      trim: true,
      default: '',
    },
    fatherGuardianMobile: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: addressSchema,
      default: () => ({}),
    },
    academicQualification: {
      type: String,
      enum: ['Intermediate', 'Diploma', ''],
      default: 'Intermediate',
    },
    sscPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    intermediatePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    diplomaPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    semesterResults: {
      type: [semesterResultSchema],
      default: [],
    },
    numberOfBacklogs: {
      type: Number,
      min: 0,
      default: 0,
      index: true,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
      index: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    careerInterest: {
      type: String,
      required: [true, 'Career Interest is required'],
      trim: true,
    },
    github: {
      type: String,
      trim: true,
      default: '',
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
    portfolio: {
      type: String,
      trim: true,
      default: '',
    },
    resumeLink: {
      type: String,
      trim: true,
      default: '',
    },
    placementStatus: {
      type: String,
      enum: ['Not Placed', 'Placed', 'Opted Out', 'Higher Studies'],
      default: 'Not Placed',
      index: true,
    },
    placementCompany: {
      type: String,
      trim: true,
      default: '',
    },
    placementPackage: {
      type: Number,
      default: 0,
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    academicStatus: {
      type: String,
      enum: ['Active', 'Detained', 'Graduated', 'Discontinued'],
      default: 'Active',
      index: true,
    },
    admissionYear: {
      type: Number,
      default: function (this: any) {
        if (this.batch) {
          const match = this.batch.match(/\d{4}/);
          if (match) return parseInt(match[0], 10);
        }
        return new Date().getFullYear();
      },
    },
    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: Ensure studentId is set to _id and year is strictly derived from semester
studentSchema.pre('save', function (next) {
  if (!this.studentId && this._id) {
    this.studentId = this._id.toString();
  }
  if (this.semester) {
    this.year = Math.min(Math.max(Math.ceil(this.semester / 2), 1), 4);
  }
  next();
});

// Virtual alias: overallCGPA <-> cgpa
studentSchema.virtual('overallCGPA')
  .get(function () {
    return this.cgpa;
  })
  .set(function (val: number) {
    this.cgpa = val;
  });

// Virtual: semesterCode (e.g. 5 -> '3-1')
studentSchema.virtual('semesterCode').get(function () {
  const map: Record<number, string> = {
    1: '1-1', 2: '1-2', 3: '2-1', 4: '2-2',
    5: '3-1', 6: '3-2', 7: '4-1', 8: '4-2',
  };
  return map[this.semester] || `${this.semester}`;
});

// Indexes for high performance TPO queries (Strictly Branch -> Year -> Roll Number)
studentSchema.index({ branch: 1, year: 1, rollNumber: 1 });
studentSchema.index({ branch: 1, year: 1, cgpa: -1 });
studentSchema.index({ year: 1, semester: 1 });
studentSchema.index({ placementStatus: 1, year: 1 });

export const Student = mongoose.model('Student', studentSchema);

