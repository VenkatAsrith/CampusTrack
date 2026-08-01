export interface User {
  id: string;
  rollNumber?: string;
  email: string;
  role: 'student' | 'admin';
}

export interface Student {
  _id: string;
  user: string;
  rollNumber: string;
  fullName: string;
  email: string;
  phone: string;
  branch: string;
  section: string;
  batch: string;
  cgpa: number;
  semester: number;
  profilePhoto?: string;
  careerInterest: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  resumeLink?: string;
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
}

export interface Verification {
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Document {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface CodingProfile {
  _id: string;
  student: string;
  platform: 'LeetCode' | 'CodeChef' | 'HackerRank' | 'GeeksforGeeks' | 'Codeforces' | 'Other';
  username: string;
  profileUrl: string;
  currentRating: number;
  highestRating: number;
  rank: number;
  problemsSolved: number;
  createdAt: string;
}

export interface Project {
  _id: string;
  student: any; // populated or string ID
  projectName: string;
  description: string;
  technologies: string[];
  category: 'Web Development' | 'Data Science' | 'Machine Learning' | 'AI' | 'Data Engineering' | 'Mobile' | 'Cloud' | 'Other';
  githubUrl?: string;
  liveDemoUrl?: string;
  studentRole: string;
  projectType: 'Academic' | 'Personal' | 'Minor Project' | 'Major Project' | 'Hackathon';
  startDate: string;
  endDate?: string;
  proofDocument?: Document;
  verification: Verification;
  createdAt: string;
}

export interface Internship {
  _id: string;
  student: any;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  internshipType: 'On-site' | 'Remote' | 'Hybrid';
  description: string;
  technologies: string[];
  certificate?: Document;
  offerLetter?: Document;
  verification: Verification;
  createdAt: string;
}

export interface Certification {
  _id: string;
  student: any;
  certificationName: string;
  issuingOrganization: string;
  category: 'Programming' | 'Cloud' | 'Data' | 'AI/ML' | 'Database' | 'Cybersecurity' | 'DevOps' | 'Other';
  issueDate: string;
  credentialId?: string;
  credentialUrl?: string;
  certificateFile?: Document;
  verification: Verification;
  createdAt: string;
}

export interface NPTELRecord {
  _id: string;
  student: any;
  courseName: string;
  courseId: string;
  score: number;
  certificationType: 'Participation' | 'Elite' | 'Elite + Silver' | 'Elite + Gold';
  eliteStatus: boolean;
  rank?: number;
  examDate: string;
  certificate?: Document;
  verification: Verification;
  createdAt: string;
}

export interface Hackathon {
  _id: string;
  student: any;
  hackathonName: string;
  organizer: string;
  date: string;
  teamName?: string;
  studentRole: string;
  projectName?: string;
  position: 'Participant' | 'Finalist' | 'Top 100' | 'Top 50' | 'Top 10' | 'Winner' | 'Runner-up';
  projectLink?: string;
  certificate?: Document;
  verification: Verification;
  createdAt: string;
}

export interface Achievement {
  _id: string;
  student: any;
  achievementTitle: string;
  category: 'Academic' | 'Sports' | 'Cultural' | 'Leadership' | 'Competition' | 'Other';
  level: 'College' | 'University' | 'District' | 'State' | 'National' | 'International';
  date: string;
  description: string;
  proofDocument?: Document;
  verification: Verification;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  user?: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  createdAt: string;
}
