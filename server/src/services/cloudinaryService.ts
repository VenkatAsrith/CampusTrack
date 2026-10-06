import crypto from 'crypto';
import { UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { DocumentType } from '../utils/fileValidation';
import { AppError } from '../utils/errors';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  url: string;
  resourceType: 'image' | 'raw' | 'auto';
  format: string;
  bytes: number;
  folder: string;
  fileHash: string;
}

/**
 * Computes SHA-256 hash of a file buffer for duplicate detection.
 */
export const computeFileHash = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Returns structured, predictable Cloudinary folder based on document category and owner ID.
 */
export const getCloudinaryFolder = (
  category: DocumentType,
  ownerIdentifier: string = 'general'
): string => {
  const safeId = ownerIdentifier.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  let subfolder = 'documents';
  switch (category) {
    case 'profile_photo':
      subfolder = 'profile';
      break;
    case 'resume':
      subfolder = 'resumes';
      break;
    case 'certificate':
      subfolder = 'certificates';
      break;
    case 'offer_letter':
    case 'proof_document':
    case 'other':
    default:
      subfolder = 'documents';
      break;
  }

  return `campustrack/students/${safeId}/${subfolder}`;
};

/**
 * Uploads a file buffer directly to Cloudinary with category-specific optimizations.
 */
export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  category: DocumentType,
  ownerIdentifier: string = 'general',
  originalFilename: string
): Promise<CloudinaryUploadResult> => {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      500
    );
  }

  const folder = getCloudinaryFolder(category, ownerIdentifier);
  const fileHash = computeFileHash(buffer);
  
  // Safe cryptographically random unique public_id
  const uniqueId = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const publicId = `${folder}/${uniqueId}`;

  // Tailor Cloudinary upload options per document category
  const uploadOptions: UploadApiOptions = {
    folder,
    public_id: uniqueId,
    overwrite: true,
  };

  if (category === 'profile_photo') {
    // 1. Profile photos: optimized dimensions (800x800 limit), auto quality, auto format
    uploadOptions.resource_type = 'image';
    uploadOptions.transformation = [
      {
        width: 800,
        height: 800,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto',
      },
    ];
  } else if (category === 'resume') {
    // 2. Resumes: store as raw binary to preserve 100% PDF text, searchability, fonts, and vector layout
    uploadOptions.resource_type = 'raw';
  } else if (category === 'certificate') {
    // 3. Certificates: if image, preserve high readability (1920x1920 limit); if PDF, store as raw
    const isImage = originalFilename.match(/\.(jpg|jpeg|png|webp)$/i);
    if (isImage) {
      uploadOptions.resource_type = 'image';
      uploadOptions.transformation = [
        {
          width: 1920,
          height: 1920,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      ];
    } else {
      uploadOptions.resource_type = 'raw';
    }
  } else {
    // 4. Supporting documents: images get high-res optimization; PDFs / Docs stored as raw
    const isImage = originalFilename.match(/\.(jpg|jpeg|png|webp)$/i);
    if (isImage) {
      uploadOptions.resource_type = 'image';
      uploadOptions.transformation = [
        {
          width: 1920,
          height: 1920,
          crop: 'limit',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ];
    } else {
      uploadOptions.resource_type = 'raw';
    }
  }

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(
            new AppError(
              `Cloudinary upload failed: ${error?.message || 'Unknown error'}`,
              502
            )
          );
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          url: result.url,
          resourceType: (result.resource_type as any) || 'auto',
          format: result.format || originalFilename.split('.').pop() || '',
          bytes: result.bytes,
          folder,
          fileHash,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Securely destroys an asset on Cloudinary.
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'raw' | 'auto' = 'image'
): Promise<boolean> => {
  if (!isCloudinaryConfigured() || !publicId) {
    return false;
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === 'raw' ? 'raw' : 'image',
      invalidate: true,
    });
    return res.result === 'ok' || res.result === 'not found';
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, error);
    return false;
  }
};

/**
 * Generates a temporary signed access URL for private documents.
 * Valid for 30 minutes. Never exposes the API secret to clients.
 */
export const generateSignedDocumentUrl = (
  publicId: string,
  resourceType: 'image' | 'raw' | 'auto' = 'raw',
  format?: string,
  expiresInSeconds: number = 1800 // 30 minutes
): string => {
  if (!isCloudinaryConfigured()) {
    return '';
  }

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  if (resourceType === 'raw') {
    // Private download url for raw assets (e.g. PDFs, docs)
    return cloudinary.utils.private_download_url(publicId, format || '', {
      resource_type: 'raw',
      expires_at: expiresAt,
    });
  }

  // Signed delivery url for images
  return cloudinary.url(publicId, {
    resource_type: 'image',
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  });
};

/**
 * Retrieves Cloudinary account usage stats if API credentials allow.
 */
export const getCloudinaryUsageStats = async (): Promise<any> => {
  if (!isCloudinaryConfigured()) {
    return null;
  }

  try {
    const usage = await cloudinary.api.usage();
    return {
      plan: usage.plan,
      storageUsedBytes: usage.storage?.usage || 0,
      storageLimitBytes: usage.storage?.limit || 0,
      storagePercent: usage.storage?.used_percent || 0,
      bandwidthUsedBytes: usage.bandwidth?.usage || 0,
      bandwidthLimitBytes: usage.bandwidth?.limit || 0,
      transformationsUsed: usage.transformations?.usage || 0,
      creditsUsed: usage.credits?.usage || 0,
    };
  } catch (err: any) {
    // If restricted API key, return graceful null
    return null;
  }
};
