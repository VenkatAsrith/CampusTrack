import path from 'path';

export type DocumentType = 
  | 'profile_photo' 
  | 'resume' 
  | 'certificate' 
  | 'offer_letter' 
  | 'proof_document' 
  | 'other';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  category: DocumentType;
  maxSizeBytes: number;
}

// Dangerous executable extensions blocklist
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.js', '.mjs', '.cjs',
  '.vbs', '.msi', '.bin', '.jar', '.apk', '.com', '.scr', '.ps1',
  '.pif', '.application', '.gadget', '.hta', '.cpl', '.msc'
]);

interface RuleConfig {
  maxSize: number; // in bytes
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  label: string;
}

const DOCUMENT_RULES: Record<DocumentType, RuleConfig> = {
  profile_photo: {
    maxSize: 1 * 1024 * 1024, // 1 MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    label: 'Profile Photo (max 1 MB; JPG, PNG, WEBP)'
  },
  resume: {
    maxSize: 3 * 1024 * 1024, // 3 MB
    allowedExtensions: ['.pdf'],
    allowedMimeTypes: ['application/pdf'],
    label: 'Resume (max 3 MB; PDF format only)'
  },
  certificate: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    label: 'Certificate (max 5 MB; PDF, JPG, PNG, WEBP)'
  },
  offer_letter: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'],
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    label: 'Offer Letter (max 5 MB; PDF, Images, Word Docs)'
  },
  proof_document: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'],
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    label: 'Proof Document (max 5 MB; PDF, Images, Word Docs)'
  },
  other: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'],
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    label: 'Document (max 5 MB; PDF, Images, Word Docs)'
  },
};

/**
 * Validates uploaded file against server security policies and category constraints.
 */
export const validateUploadedFile = (
  file: Express.Multer.File | undefined,
  requestedType?: string
): FileValidationResult => {
  if (!file) {
    return {
      valid: false,
      error: 'No file provided or file payload is empty.',
      category: 'other',
      maxSizeBytes: 5 * 1024 * 1024,
    };
  }

  // Normalize document type
  const normalizedType = (requestedType || 'other').toLowerCase().trim() as DocumentType;
  const category: DocumentType = DOCUMENT_RULES[normalizedType] ? normalizedType : 'other';
  const rules = DOCUMENT_RULES[category];

  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Immediate dangerous executable check
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Security violation: Executable files (${ext}) are strictly forbidden.`,
      category,
      maxSizeBytes: rules.maxSize,
    };
  }

  // 2. Extension check
  if (!rules.allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension "${ext}". Allowed for ${category}: ${rules.allowedExtensions.join(', ')}.`,
      category,
      maxSizeBytes: rules.maxSize,
    };
  }

  // 3. MIME type check
  const mime = file.mimetype.toLowerCase();
  if (!rules.allowedMimeTypes.includes(mime)) {
    return {
      valid: false,
      error: `Invalid MIME type "${file.mimetype}". Allowed: ${rules.allowedMimeTypes.join(', ')}.`,
      category,
      maxSizeBytes: rules.maxSize,
    };
  }

  // 4. File size check
  if (file.size > rules.maxSize) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const limitInMB = (rules.maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeInMB} MB) exceeds maximum permitted limit of ${limitInMB} MB for ${rules.label}.`,
      category,
      maxSizeBytes: rules.maxSize,
    };
  }

  return {
    valid: true,
    category,
    maxSizeBytes: rules.maxSize,
  };
};

/**
 * Sanitizes original filenames for safe storage and presentation.
 */
export const sanitizeFilename = (rawName: string): string => {
  const ext = path.extname(rawName).toLowerCase();
  const base = path.basename(rawName, ext);
  const cleanBase = base
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100);
  return `${cleanBase || 'document'}${ext}`;
};
