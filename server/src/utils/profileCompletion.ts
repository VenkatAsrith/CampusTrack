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

  // 1. Basic Profile (20%) - Check if basic text info is filled
  const hasBasic = student.fullName && student.email && student.phone && student.branch && student.section && student.batch;
  if (hasBasic) {
    percentage += 20;
  } else {
    missing.push('Complete basic profile information (Name, Email, Phone, Branch, Section, Batch)');
  }

  // 2. Academic (15%) - CGPA and Semester filled
  const hasAcademic = student.cgpa !== undefined && student.semester !== undefined;
  if (hasAcademic) {
    percentage += 15;
  } else {
    missing.push('Provide academic details (CGPA, Semester)');
  }

  // 3. Career Links (5%) - GitHub, LinkedIn or Portfolio
  const hasCareerLinks = !!(student.github || student.linkedin || student.portfolio);
  if (hasCareerLinks) {
    percentage += 5;
  } else {
    missing.push('Add at least one professional link (GitHub, LinkedIn, or Portfolio)');
  }

  // 4. Coding Profiles (10%) - Has at least one coding profile
  const codingCount = await CodingProfile.countDocuments({ student: studentId });
  if (codingCount > 0) {
    percentage += 10;
  } else {
    missing.push('Add at least one coding platform profile (LeetCode, HackerRank, etc.)');
  }

  // 5. Projects (15%) - Has at least one project
  const projectCount = await Project.countDocuments({ student: studentId });
  if (projectCount > 0) {
    percentage += 15;
  } else {
    missing.push('Add at least one project to showcase your technical skills');
  }

  // 6. Internships (10%) - Has at least one internship
  const internshipCount = await Internship.countDocuments({ student: studentId });
  if (internshipCount > 0) {
    percentage += 10;
  } else {
    missing.push('Add at least one internship record');
  }

  // 7. Certifications (10%) - Has at least one certification
  const certificationCount = await Certification.countDocuments({ student: studentId });
  if (certificationCount > 0) {
    percentage += 10;
  } else {
    missing.push('Add at least one industry certification');
  }

  // 8. NPTEL (5%) - Has at least one NPTEL record
  const nptelCount = await NPTELRecord.countDocuments({ student: studentId });
  if (nptelCount > 0) {
    percentage += 5;
  } else {
    missing.push('Add at least one NPTEL certification');
  }

  // 9. Hackathons (5%) - Has at least one hackathon
  const hackathonCount = await Hackathon.countDocuments({ student: studentId });
  if (hackathonCount > 0) {
    percentage += 5;
  } else {
    missing.push('Add at least one hackathon participation record');
  }

  // 10. Achievements (5%) - Has at least one achievement
  const achievementCount = await Achievement.countDocuments({ student: studentId });
  if (achievementCount > 0) {
    percentage += 5;
  } else {
    missing.push('Add at least one extracurricular or academic achievement');
  }

  return { percentage, missing };
};

// Update profile completion for a student in database
export const updateProfileCompletion = async (studentId: string): Promise<number> => {
  const { percentage } = await calculateProfileCompletion(studentId);
  await Student.findByIdAndUpdate(studentId, { profileCompletion: percentage });
  return percentage;
};
