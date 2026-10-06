import { validateUploadedFile, sanitizeFilename } from '../utils/fileValidation';
import { getCloudinaryFolder, computeFileHash, generateSignedDocumentUrl } from '../services/cloudinaryService';

console.log('====================================================');
console.log(' CampusTrack Cloudinary Storage Validation Suite');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

const assert = (condition: boolean, testName: string, detail?: string) => {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}: ${detail || 'Assertion failed'}`);
    failed++;
  }
};

// --- TEST SUITE 1: Filename Sanitization ---
console.log('\n--- 1. Filename Sanitization Tests ---');
const cleanName1 = sanitizeFilename('my resume (final) [2026]!.pdf');
assert(cleanName1.endsWith('.pdf'), 'Preserves valid extension', cleanName1);
assert(!cleanName1.includes('!'), 'Strips special characters', cleanName1);
assert(cleanName1 === 'my_resume_final_2026_.pdf', 'Replaces invalid characters with underscores', cleanName1);

// --- TEST SUITE 2: Security & Executable Blocking ---
console.log('\n--- 2. Executable Security Blocklist Tests ---');
const fakeExeFile: Express.Multer.File = {
  fieldname: 'file',
  originalname: 'malicious.exe',
  encoding: '7bit',
  mimetype: 'application/x-msdownload',
  size: 1024,
  buffer: Buffer.from('MZ...'),
  stream: null as any,
  destination: '',
  filename: 'malicious.exe',
  path: '',
};

const exeResult = validateUploadedFile(fakeExeFile, 'proof_document');
assert(!exeResult.valid, 'Blocks .exe executables');
assert(Boolean(exeResult.error?.includes('Security violation')), 'Returns security violation message', exeResult.error);

const fakeShFile: Express.Multer.File = { ...fakeExeFile, originalname: 'exploit.sh', mimetype: 'application/x-sh' };
const shResult = validateUploadedFile(fakeShFile, 'other');
assert(!shResult.valid, 'Blocks .sh shell scripts');

const fakeJsFile: Express.Multer.File = { ...fakeExeFile, originalname: 'payload.js', mimetype: 'application/javascript' };
const jsResult = validateUploadedFile(fakeJsFile, 'certificate');
assert(!jsResult.valid, 'Blocks .js scripts');

// --- TEST SUITE 3: Profile Photo Rules ---
console.log('\n--- 3. Profile Photo Validation Tests ---');
const validPhoto: Express.Multer.File = {
  fieldname: 'file',
  originalname: 'headshot.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 500 * 1024, // 500 KB
  buffer: Buffer.alloc(500 * 1024),
  stream: null as any,
  destination: '',
  filename: 'headshot.jpg',
  path: '',
};
const photoResult = validateUploadedFile(validPhoto, 'profile_photo');
assert(photoResult.valid, 'Accepts valid 500KB JPEG profile photo');

const oversizedPhoto: Express.Multer.File = { ...validPhoto, size: 1.5 * 1024 * 1024 }; // 1.5 MB (> 1 MB limit)
const overPhotoResult = validateUploadedFile(oversizedPhoto, 'profile_photo');
assert(!overPhotoResult.valid, 'Rejects oversized profile photo (>1MB)');
assert(Boolean(overPhotoResult.error?.includes('exceeds maximum permitted limit')), 'Reports size limit error', overPhotoResult.error);

// --- TEST SUITE 4: Resume PDF Rules ---
console.log('\n--- 4. Resume PDF Validation Tests ---');
const validResume: Express.Multer.File = {
  fieldname: 'file',
  originalname: 'Student_Resume_2026.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 1.8 * 1024 * 1024, // 1.8 MB
  buffer: Buffer.alloc(1.8 * 1024 * 1024),
  stream: null as any,
  destination: '',
  filename: 'Student_Resume_2026.pdf',
  path: '',
};
const resumeResult = validateUploadedFile(validResume, 'resume');
assert(resumeResult.valid, 'Accepts valid 1.8MB PDF resume');

const imgAsResume: Express.Multer.File = {
  ...validResume,
  originalname: 'resume_photo.jpg',
  mimetype: 'image/jpeg'
};
const imgResumeResult = validateUploadedFile(imgAsResume, 'resume');
assert(!imgResumeResult.valid, 'Rejects image uploaded as resume (PDF strictly required)');

const oversizedResume: Express.Multer.File = { ...validResume, size: 4.2 * 1024 * 1024 }; // 4.2 MB (> 3 MB limit)
const overResumeResult = validateUploadedFile(oversizedResume, 'resume');
assert(!overResumeResult.valid, 'Rejects oversized resume (>3MB)');

// --- TEST SUITE 5: Certificate Rules ---
console.log('\n--- 5. Certificate Validation Tests ---');
const validCertPdf: Express.Multer.File = {
  fieldname: 'file',
  originalname: 'AWS_Solutions_Architect.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 2.1 * 1024 * 1024,
  buffer: Buffer.alloc(2.1 * 1024 * 1024),
  stream: null as any,
  destination: '',
  filename: 'AWS_Solutions_Architect.pdf',
  path: '',
};
assert(validateUploadedFile(validCertPdf, 'certificate').valid, 'Accepts valid PDF certificate');

const validCertImg: Express.Multer.File = {
  ...validCertPdf,
  originalname: 'NPTEL_Elite_Gold.png',
  mimetype: 'image/png'
};
assert(validateUploadedFile(validCertImg, 'certificate').valid, 'Accepts valid PNG certificate');

const oversizedCert: Express.Multer.File = { ...validCertPdf, size: 6.5 * 1024 * 1024 }; // > 5 MB
assert(!validateUploadedFile(oversizedCert, 'certificate').valid, 'Rejects oversized certificate (>5MB)');

// --- TEST SUITE 6: SHA-256 Hashing & Deduplication ---
console.log('\n--- 6. SHA-256 Deduplication Checksum Tests ---');
const buf1 = Buffer.from('CampusTrack Institutional Document Content 2026');
const buf2 = Buffer.from('CampusTrack Institutional Document Content 2026');
const buf3 = Buffer.from('Different document content');

const hash1 = computeFileHash(buf1);
const hash2 = computeFileHash(buf2);
const hash3 = computeFileHash(buf3);

assert(hash1 === hash2, 'Identical buffers generate identical SHA-256 hash');
assert(hash1 !== hash3, 'Different buffers generate distinct SHA-256 hash');
assert(hash1.length === 64, 'SHA-256 hash produces standard 64-character hex string');

// --- TEST SUITE 7: Predictable Cloudinary Folder Structure ---
console.log('\n--- 7. Predictable Folder Hierarchy Tests ---');
const folderProfile = getCloudinaryFolder('profile_photo', '21BD1A0501');
assert(folderProfile === 'campustrack/students/21BD1A0501/profile', 'Profile photo folder path correct', folderProfile);

const folderResume = getCloudinaryFolder('resume', '21BD1A0501');
assert(folderResume === 'campustrack/students/21BD1A0501/resumes', 'Resume folder path correct', folderResume);

const folderCerts = getCloudinaryFolder('certificate', '21BD1A0501');
assert(folderCerts === 'campustrack/students/21BD1A0501/certificates', 'Certificate folder path correct', folderCerts);

const folderDocs = getCloudinaryFolder('proof_document', '21BD1A0501');
assert(folderDocs === 'campustrack/students/21BD1A0501/documents', 'Proof document folder path correct', folderDocs);

console.log('\n====================================================');
console.log(` Summary: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
