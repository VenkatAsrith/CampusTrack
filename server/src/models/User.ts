import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple nulls/undefined for Admins
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      required: [true, 'Role is required'],
      default: 'student',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (passwordEntered: string): Promise<boolean> {
  return bcrypt.compare(passwordEntered, this.password);
};

export const User = mongoose.model('User', userSchema);
