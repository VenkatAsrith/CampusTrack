import mongoose from 'mongoose';

export interface IDocument extends mongoose.Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  originalSize?: number;
  optimizedSize?: number;
  filePath?: string;
  uploadedBy: mongoose.Types.ObjectId;
  student?: mongoose.Types.ObjectId;
  documentType: 'profile_photo' | 'resume' | 'certificate' | 'offer_letter' | 'proof_document' | 'other';
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  cloudinarySecureUrl?: string;
  cloudinaryResourceType?: 'image' | 'raw' | 'auto';
  cloudinaryFormat?: string;
  folder?: string;
  fileHash?: string;
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    originalSize: {
      type: Number,
    },
    optimizedSize: {
      type: Number,
    },
    // Optional for Cloudinary-backed assets, retained for local fallback / backward compatibility
    filePath: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true,
    },
    documentType: {
      type: String,
      enum: ['profile_photo', 'resume', 'certificate', 'offer_letter', 'proof_document', 'other'],
      default: 'proof_document',
      index: true,
    },
    cloudinaryPublicId: {
      type: String,
      index: true,
    },
    cloudinaryUrl: {
      type: String,
      default: '',
    },
    cloudinarySecureUrl: {
      type: String,
      default: '',
    },
    cloudinaryResourceType: {
      type: String,
      enum: ['image', 'raw', 'auto'],
      default: 'auto',
    },
    cloudinaryFormat: {
      type: String,
      default: '',
    },
    folder: {
      type: String,
      default: '',
    },
    fileHash: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient duplicate lookups per owner
documentSchema.index({ uploadedBy: 1, fileHash: 1, status: 1 });

export const Document = mongoose.model<IDocument>('Document', documentSchema);
