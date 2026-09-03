import { Student } from '../models/Student';
import { CodingProfile } from '../models/CodingProfile';
import { Project } from '../models/Project';
import { Internship } from '../models/Internship';
import { Certification } from '../models/Certification';
import { NPTELRecord } from '../models/NPTELRecord';
import { Hackathon } from '../models/Hackathon';
import { Achievement } from '../models/Achievement';

export const calculateProfileCompletion = async (studentId: string): Promise<{ percentage: number; missing: string[] }> => {
  const student = await Student.findById(studentId);
  if (!student) {
    return { percentage: 0, missing: [] };
  }

  let percentage = 0;
  const missing: string[] = [];

  // 1. Basic Profile (15%) - Name, Email, Phone/Mobile, Branch, Batch, Year, Semester (NO section required)
  const hasBasic = !!(student.fullName && student.email && (student.studentMobile || student.phone) && student.branch && student.batch && student.year && student.semester);
  if (hasBasic) {
    percentage += 15;
  } else {
    missing.push('Complete basic profile information (Name, Email, Mobile, Branch, Batch, Year, Semester)');
  }

  // 2. Parent / Guardian Info (5%)
  const hasParent = !!((student.motherName && student.motherMobile) || (student.fatherGuardianName && student.fatherGuardianMobile));
  if (hasParent) {
    percentage += 5;
  } else {
    missing.push('Add parent or guardian contact details');
  }

  // 3. Address Info (5%)
  const hasAddress = !!(student.address && (student.address.city || student.address.district) && student.address.state);
  if (hasAddress) {
    percentage += 5;
  } else {
    missing.push('Provide permanent address details');
  }

  // 4. Academic Details (15%) - SSC, Inter/Diploma, and Semester results
  const hasSchool = (student.sscPercentage || 0) > 0;
  const hasPreUniv = (student.intermediatePercentage || 0) > 0 || (student.diplomaPercentage || 0) > 0;
  const hasSemesters = Array.isArray(student.semesterResults) && student.semesterResults.length > 0;
  
  if (hasSchool && hasPreUniv && (student.semester <= 1 || hasSemesters)) {
    percentage += 15;
  } else {
    missing.push('Complete academic information (SSC, Intermediate/Diploma %, Semester results)');
  }

  // 5. Career Links (5%) - GitHub, LinkedIn, Portfolio or Resume
  const hasCareerLinks = !!(student.github || student.linkedin || student.portfolio || student.resumeLink);
  if (hasCareerLinks) {
    percentage += 5;
  } else {
    missing.push('Add at least one professional link (GitHub, LinkedIn, Portfolio, or Resume)');
  }

  // 6. Coding Profiles (10%)
  const codingCount = await CodingProfile.countDocuments({ student: studentId });
  if (codingCount > 0) {
    percentage += 10;
  } else {
    missing.push('Add at least one competitive coding profile (LeetCode, CodeChef, etc.)');
  }

  // 7. Projects (15%)
  const projectCount = await Project.countDocuments({ student: studentId });
  if (projectCount > 0) {
    percentage += 15;
  } else {
    missing.push('Add at least one project to showcase your technical skills');
  }

  // 8. Internships (10%)
  const internshipCount = await Internship.countDocuments({ student: studentId });
  if (internshipCount > 0) {
    percentage += 10;
  } else {
    missing.push('Add at least one internship record');
  }

  // 9. Certifications (10%)
  const certificationCount = await Certification.countDocuments({ student: studentId });
  if (certificationCount > 0) {
    percentage += 10;
  } else {
    missing.push('Add at least one industry certification');
  }

  // 10. NPTEL (5%)
  const nptelCount = await NPTELRecord.countDocuments({ student: studentId });
  if (nptelCount > 0) {
    percentage += 5;
  } else {
    missing.push('Add at least one NPTEL certification');
  }

  // 11. Hackathons / Achievements (5%)
  const hackathonCount = await Hackathon.countDocuments({ student: studentId });
  const achievementCount = await Achievement.countDocuments({ student: studentId });
  if (hackathonCount > 0 || achievementCount > 0) {
    percentage += 5;
  } else {
    missing.push('Add at least one hackathon or achievement record');
  }

  return { percentage: Math.min(100, percentage), missing };
};

// Update profile completion for a student in database
export const updateProfileCompletion = async (studentId: string): Promise<number> => {
  const { percentage } = await calculateProfileCompletion(studentId);
  await Student.findByIdAndUpdate(studentId, { profileCompletion: percentage });
  return percentage;
};
