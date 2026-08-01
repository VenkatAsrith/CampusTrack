import { Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import { Student } from '../models/Student';
import { CodingProfile } from '../models/CodingProfile';
import { Project } from '../models/Project';
import { Internship } from '../models/Internship';
import { Certification } from '../models/Certification';
import { NPTELRecord } from '../models/NPTELRecord';
import { Hackathon } from '../models/Hackathon';
import { Achievement } from '../models/Achievement';
import { AuditLog } from '../models/AuditLog';
import { catchAsync } from '../middlewares/error';
import { AuthenticatedRequest } from '../types/express';

// Helper to apply formatting to headers in Excel JS
const styleHeader = (worksheet: ExcelJS.Worksheet) => {
  // Style header row (Row 1)
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Calibri', family: 2, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Dark slate-800
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  headerRow.height = 25;

  // Freeze top row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Auto-fit column widths based on cell content length
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell!({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? String(cell.value).length : 0;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.max(maxLength + 4, 12);
  });
};

// Export Excel workbook containing all achievements databases
export const exportExcelData = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CampusTrack System';
  workbook.lastModifiedBy = 'CampusTrack Admin';
  workbook.created = new Date();

  // Create a fast map for matching student IDs to names & roll numbers
  const students = await Student.find().sort({ rollNumber: 1 });
  const studentMap: Record<string, { rollNumber: string; name: string }> = {};
  
  students.forEach(s => {
    studentMap[s._id.toString()] = {
      rollNumber: s.rollNumber,
      name: s.fullName,
    };
  });

  // SHEET 1: Students
  const sheetStudents = workbook.addWorksheet('Students');
  sheetStudents.columns = [
    { header: 'Roll Number', key: 'rollNumber' },
    { header: 'Full Name', key: 'fullName' },
    { header: 'Email', key: 'email' },
    { header: 'Branch', key: 'branch' },
    { header: 'Section', key: 'section' },
    { header: 'Batch', key: 'batch' },
    { header: 'CGPA', key: 'cgpa' },
    { header: 'Profile Completion %', key: 'profileCompletion' },
  ];
  students.forEach(s => {
    sheetStudents.addRow({
      rollNumber: s.rollNumber,
      fullName: s.fullName,
      email: s.email,
      branch: s.branch,
      section: s.section,
      batch: s.batch,
      cgpa: s.cgpa,
      profileCompletion: `${s.profileCompletion}%`,
    });
  });
  styleHeader(sheetStudents);

  // SHEET 2: Coding Profiles
  const sheetCoding = workbook.addWorksheet('Coding Profiles');
  sheetCoding.columns = [
    { header: 'Roll Number', key: 'rollNumber' },
    { header: 'Student Name', key: 'studentName' },
    { header: 'Platform', key: 'platform' },
    { header: 'Username', key: 'username' },
    { header: 'Profile URL', key: 'profileUrl' },
    { header: 'Rating', key: 'rating' },
    { header: 'Highest Rating', key: 'highestRating' },
    { header: 'Global Rank', key: 'rank' },
    { header: 'Problems Solved', key: 'problemsSolved' },
  ];
  const codingRecords = await CodingProfile.find();
  codingRecords.forEach(c => {
    const info = studentMap[c.student.toString()] || { rollNumber: 'N/A', name: 'Unknown' };
    sheetCoding.addRow({
      rollNumber: info.rollNumber,
      studentName: info.name,
      platform: c.platform,
      username: c.username,
      profileUrl: c.profileUrl,
      rating: c.currentRating || 0,
      highestRating: c.highestRating || 0,
      rank: c.rank || 0,
      problemsSolved: c.problemsSolved || 0,
    });
  });
  styleHeader(sheetCoding);

  // SHEET 3: Projects
  const sheetProjects = workbook.addWorksheet('Projects');
  sheetProjects.columns = [
    { header: 'Roll Number', key: 'rollNumber' },
    { header: 'Student Name', key: 'studentName' },
    { header: 'Project Name', key: 'projectName' },
    { header: 'Category', key: 'category' },
    { header: 'Technologies Used', key: 'technologies' },
    { header: 'GitHub Link', key: 'githubUrl' },
    { header: 'Live Demo Link', key: 'liveDemoUrl' },
    { header: 'Project Type', key: 'projectType' },
    { header: 'Verification Status', key: 'status' },
  ];
  const projectRecords = await Project.find();
  projectRecords.forEach(p => {
    const info = studentMap[p.student.toString()] || { rollNumber: 'N/A', name: 'Unknown' };
    sheetProjects.addRow({
      rollNumber: info.rollNumber,
      studentName: info.name,
      projectName: p.projectName,
      category: p.category,
      technologies: p.technologies.join(', '),
      githubUrl: p.githubUrl || '',
      liveDemoUrl: p.liveDemoUrl || '',
      projectType: p.projectType,
      status: p.verification.status,
    });
  });
  styleHeader(sheetProjects);

  // SHEET 4: Internships
  const sheetInternships = workbook.addWorksheet('Internships');
  sheetInternships.columns = [
    { header: 'Roll Number', key: 'rollNumber' },
    { header: 'Student Name', key: 'studentName' },
    { header: 'Company Name', key: 'company' },
    { header: 'Role', key: 'role' },
    { header: 'Internship Type', key: 'type' },
    { header: 'Start Date', key: 'startDate' },
    { header: 'End Date', key: 'endDate' },
    { header: 'Verification Status', key: 'status' },
  ];
  const internshipRecords = await Internship.find();
  internshipRecords.forEach(i => {
    const info = studentMap[i.student.toString()] || { rollNumber: 'N/A', name: 'Unknown' };
    sheetInternships.addRow({
      rollNumber: info.rollNumber,
      studentName: info.name,
      company: i.company,
      role: i.role,
      type: i.internshipType,
      startDate: i.startDate.toISOString().split('T')[0],
      endDate: i.endDate.toISOString().split('T')[0],
      status: i.verification.status,
    });
  });
  styleHeader(sheetInternships);

  // SHEET 5: Certifications
  const sheetCerts = workbook.addWorksheet('Certifications');
  sheetCerts.columns = [
    { header: 'Roll Number', key: 'rollNumber' },
    { header: 'Student Name', key: 'studentName' },
    { header: 'Certification Name', key: 'certName' },
    { header: 'Organization', key: 'org' },
    { header: 'Category', key: 'category' },
    { header: 'Issue Date', key: 'issueDate' },
    { header: 'Credential ID', key: 'credId' },
    { header: 'Verification Status', key: 'status' },
  ];
  const certRecords = await Certification.find();
  certRecords.forEach(c => {
    const info = studentMap[c.student.toString()] || { rollNumber: 'N/A', name: 'Unknown' };
    sheetCerts.addRow({
      rollNumber: info.rollNumber,
      studentName: info.name,
      certName: c.certificationName,
      org: c.issuingOrganization,
      category: c.category,
      issueDate: c.issueDate.toISOString().split('T')[0],
      credId: c.credentialId || '',
      status: c.verification.status,
    });
  });
  styleHeader(sheetCerts);

  // SHEET 6: NPTEL
  const sheetNPTEL = workbook.addWorksheet('NPTEL');
  sheetNPTEL.columns = [
    { header: 'Roll Number', key: 'rollNumber' },
    { header: 'Student Name', key: 'studentName' },
    { header: 'Course Name', key: 'courseName' },
    { header: 'Course ID', key: 'courseId' },
    { header: 'Score', key: 'score' },
    { header: 'Certification Type', key: 'type' },
    { header: 'Elite Status', key: 'elite' },
    { header: 'Rank', key: 'rank' },
    { header: 'Verification Status', key: 'status' },
  ];
  const nptelRecords = await NPTELRecord.find();
  nptelRecords.forEach(n => {
    const info = studentMap[n.student.toString()] || { rollNumber: 'N/A', name: 'Unknown' };
    sheetNPTEL.addRow({
      rollNumber: info.rollNumber,
      studentName: info.name,
      courseName: n.courseName,
      courseId: n.courseId,
      score: n.score,
      type: n.certificationType,
      elite: n.eliteStatus ? 'Yes' : 'No',
      rank: n.rank || '',
      status: n.verification.status,
    });
  });
  styleHeader(sheetNPTEL);

  // SHEET 7: Hackathons
  const sheetHackathons = workbook.addWorksheet('Hackathons');
  sheetHackathons.columns = [
    { header: 'Roll Number', key: 'rollNumber' },
    { header: 'Student Name', key: 'studentName' },
    { header: 'Hackathon Name', key: 'hackathonName' },
    { header: 'Organizer', key: 'organizer' },
    { header: 'Team Name', key: 'teamName' },
    { header: 'Role', key: 'role' },
    { header: 'Position', key: 'position' },
    { header: 'Date', key: 'date' },
    { header: 'Verification Status', key: 'status' },
  ];
  const hackRecords = await Hackathon.find();
  hackRecords.forEach(h => {
    const info = studentMap[h.student.toString()] || { rollNumber: 'N/A', name: 'Unknown' };
    sheetHackathons.addRow({
      rollNumber: info.rollNumber,
      studentName: info.name,
      hackathonName: h.hackathonName,
      organizer: h.organizer,
      teamName: h.teamName || '',
      role: h.studentRole,
      position: h.position,
      date: h.date.toISOString().split('T')[0],
      status: h.verification.status,
    });
  });
  styleHeader(sheetHackathons);

  // SHEET 8: Achievements
  const sheetAchievements = workbook.addWorksheet('Achievements');
  sheetAchievements.columns = [
    { header: 'Roll Number', key: 'rollNumber' },
    { header: 'Student Name', key: 'studentName' },
    { header: 'Achievement Title', key: 'title' },
    { header: 'Category', key: 'category' },
    { header: 'Level', key: 'level' },
    { header: 'Date', key: 'date' },
    { header: 'Verification Status', key: 'status' },
  ];
  const achRecords = await Achievement.find();
  achRecords.forEach(a => {
    const info = studentMap[a.student.toString()] || { rollNumber: 'N/A', name: 'Unknown' };
    sheetAchievements.addRow({
      rollNumber: info.rollNumber,
      studentName: info.name,
      title: a.achievementTitle,
      category: a.category,
      level: a.level,
      date: a.date.toISOString().split('T')[0],
      status: a.verification.status,
    });
  });
  styleHeader(sheetAchievements);

  // Set response headers for downloading excel file
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=CampusTrack_Report_${new Date().toISOString().split('T')[0]}.xlsx`
  );

  // Audit Logging
  try {
    await AuditLog.create({
      user: req.user!.id,
      userName: 'Admin',
      action: 'Admin Exported Excel Report',
      entity: 'ExcelReport',
    });
  } catch (err) {
    console.error('Failed logging excel export audit:', err);
  }

  // Write to response stream
  await workbook.xlsx.write(res);
  res.end();
});
