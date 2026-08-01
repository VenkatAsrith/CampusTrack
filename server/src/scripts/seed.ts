import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { CodingProfile } from '../models/CodingProfile';
import { Project } from '../models/Project';
import { Internship } from '../models/Internship';
import { Certification } from '../models/Certification';
import { NPTELRecord } from '../models/NPTELRecord';
import { Hackathon } from '../models/Hackathon';
import { Achievement } from '../models/Achievement';
import { Document } from '../models/Document';
import { updateProfileCompletion } from '../utils/profileCompletion';

// List of realistic names for generating 72 students
const firstNames = [
  'Aarav', 'Ananya', 'Abhishek', 'Aditi', 'Amit', 'Amrita', 'Arjun', 'Divya', 'Gaurav', 'Harini',
  'Ishaan', 'Kavya', 'Karan', 'Meera', 'Manish', 'Neha', 'Nikhil', 'Pooja', 'Pranav', 'Priya',
  'Rahul', 'Riya', 'Rohan', 'Shruti', 'Sanjay', 'Sneha', 'Siddharth', 'Swati', 'Varun', 'Reethu',
  'Vijay', 'Tejas', 'Sai', 'Kiran', 'Nithin', 'Pavan', 'Harsha', 'Sushma', 'Sandeep', 'Deepika',
  'Akhil', 'Sravani', 'Prasad', 'Latha', 'Rao', 'Reddy', 'Choudhary', 'Sharma', 'Verma', 'Gupta'
];

const lastNames = [
  'Kumar', 'Sharma', 'Reddy', 'Patel', 'Singh', 'Gupta', 'Verma', 'Joshi', 'Nair', 'Iyer',
  'Rao', 'Choudhary', 'Das', 'Sen', 'Chatterjee', 'Banerjee', 'Mishra', 'Pandey', 'Saxena', 'Mehta',
  'Prasad', 'Murthy', 'Deshmukh', 'Kulkarni', 'Bhat', 'Shetty', 'Pillai', 'Menon', 'Gowda', 'Naidu'
];

const branches = ['Computer Science & Engineering'];
const sections = ['A', 'B', 'C'];
const careerInterests = [
  'Full Stack Development', 'Data Science', 'Machine Learning', 'AI Engineer',
  'Cloud Architecture', 'Cybersecurity', 'Mobile App Development', 'Data Engineering'
];

const platforms = ['LeetCode', 'CodeChef', 'HackerRank', 'GeeksforGeeks', 'Codeforces'];

export const seedData = async () => {
  try {
    console.log('🧹 Cleaning existing collections...');
    await User.deleteMany({});
    await Student.deleteMany({});
    await CodingProfile.deleteMany({});
    await Project.deleteMany({});
    await Internship.deleteMany({});
    await Certification.deleteMany({});
    await NPTELRecord.deleteMany({});
    await Hackathon.deleteMany({});
    await Achievement.deleteMany({});
    await Document.deleteMany({});

    console.log('🔑 Creating Admin account...');
    // Create Admin
    const adminUser = await User.create({
      email: 'admin@college.edu',
      password: 'admin123', // Will be hashed by userSchema pre-save hook
      role: 'admin',
    });
    console.log(`✅ Admin created: admin@college.edu / admin123`);

    // Create a mock proof document representing uploaded certificates
    const mockDocument = await Document.create({
      filename: 'proof-mock-template.pdf',
      originalName: 'certificate_proof.pdf',
      mimeType: 'application/pdf',
      size: 154200,
      filePath: 'uploads/proof-mock-template.pdf',
      uploadedBy: adminUser._id,
    });

    console.log('👥 Generating 72 CSE student records...');
    const studentsList = [];

    for (let i = 1; i <= 72; i++) {
      const rollNumber = `CSE${String(i).padStart(3, '0')}`;
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${fName} ${lName}`;
      const email = `${rollNumber.toLowerCase()}@college.edu`;
      const phone = `${Math.floor(Math.random() * 3 + 7)}${Math.floor(100000000 + Math.random() * 900000000)}`;
      const branch = branches[0];
      const section = sections[(i - 1) % sections.length];
      const batch = '2023-2027';
      const cgpa = Number((6.5 + Math.random() * 3.3).toFixed(2));
      const semester = 6;
      const careerInterest = careerInterests[Math.floor(Math.random() * careerInterests.length)];

      const user = await User.create({
        rollNumber,
        email,
        password: 'demo123',
        role: 'student',
      });

      const student = await Student.create({
        user: user._id,
        rollNumber,
        fullName,
        email,
        phone,
        branch,
        section,
        batch,
        cgpa,
        semester,
        careerInterest,
        github: Math.random() > 0.3 ? `https://github.com/${rollNumber.toLowerCase()}` : '',
        linkedin: Math.random() > 0.3 ? `https://linkedin.com/in/${rollNumber.toLowerCase()}` : '',
        portfolio: Math.random() > 0.7 ? `https://${rollNumber.toLowerCase()}.dev` : '',
        resumeLink: Math.random() > 0.5 ? `https://drive.google.com/resume-${rollNumber.toLowerCase()}.pdf` : '',
      });

      studentsList.push(student);
    }

    console.log('📊 Injecting sub-module achievements for students...');
    
    // Status types for distribution
    const statuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'] as const;
    const rejectReasons = [
      'The uploaded certificate is blurry and unreadable.',
      'Dates do not match the organization details in the description.',
      'Please attach the official score sheet rather than the course landing page.',
      'GitHub repository is private. Please make it public or upload code proof.'
    ];

    for (const student of studentsList) {
      const studentId = student._id;

      // 1. Coding Profiles (1-2 per student)
      const platCount = Math.floor(Math.random() * 2) + 1; // 1 or 2
      const shuffledPlats = [...platforms].sort(() => 0.5 - Math.random());
      for (let p = 0; p < platCount; p++) {
        await CodingProfile.create({
          student: studentId,
          platform: shuffledPlats[p],
          username: `${student.rollNumber.toLowerCase()}_code`,
          profileUrl: `https://${shuffledPlats[p].toLowerCase()}.com/${student.rollNumber.toLowerCase()}`,
          currentRating: Math.floor(1200 + Math.random() * 1000),
          highestRating: Math.floor(1400 + Math.random() * 1000),
          rank: Math.floor(100 + Math.random() * 50000),
          problemsSolved: Math.floor(50 + Math.random() * 450),
        });
      }

      // 2. Projects (1-2 per student)
      const projCount = Math.floor(Math.random() * 2) + 1;
      for (let pr = 1; pr <= projCount; pr++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isRejected = status === 'REJECTED';
        const isVerified = status === 'VERIFIED';

        await Project.create({
          student: studentId,
          projectName: `${student.careerInterest} System v${pr}`,
          description: `A responsive web application project building a prototype for CSE. Supports full search indexing and dashboard views.`,
          technologies: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Tailwind CSS'],
          category: ['Web Development', 'AI', 'Machine Learning', 'Cloud'][Math.floor(Math.random() * 4)],
          githubUrl: `https://github.com/${student.rollNumber.toLowerCase()}/project-${pr}`,
          liveDemoUrl: Math.random() > 0.5 ? `https://demo-project-${student.rollNumber.toLowerCase()}.netlify.app` : '',
          studentRole: ['Frontend Developer', 'Backend Developer', 'Team Lead', 'UI Designer'][Math.floor(Math.random() * 4)],
          projectType: ['Academic', 'Personal', 'Minor Project', 'Major Project'][Math.floor(Math.random() * 4)],
          startDate: new Date('2025-01-10'),
          endDate: new Date('2025-04-15'),
          proofDocument: mockDocument._id,
          verification: {
            status,
            rejectionReason: isRejected ? rejectReasons[Math.floor(Math.random() * rejectReasons.length)] : '',
            verifiedBy: isVerified || isRejected ? adminUser._id : undefined,
            verifiedAt: isVerified || isRejected ? new Date() : undefined,
          }
        });
      }

      // 3. Internships (0-1 per student)
      if (Math.random() > 0.4) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isRejected = status === 'REJECTED';
        const isVerified = status === 'VERIFIED';

        await Internship.create({
          student: studentId,
          company: ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Internshala Startup'][Math.floor(Math.random() * 8)],
          role: ['Software Engineering Intern', 'Web Developer Trainee', 'Data Analyst Intern', 'Cloud Support Intern'][Math.floor(Math.random() * 4)],
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-07-31'),
          internshipType: ['On-site', 'Remote', 'Hybrid'][Math.floor(Math.random() * 3)],
          description: 'Worked on resolving tickets, adding UI micro-interactions, optimizing database query pipelines, and collaborating with cross-functional development sprints.',
          technologies: ['Node.js', 'Express', 'MySQL', 'Docker'],
          certificate: mockDocument._id,
          offerLetter: mockDocument._id,
          verification: {
            status,
            rejectionReason: isRejected ? rejectReasons[Math.floor(Math.random() * rejectReasons.length)] : '',
            verifiedBy: isVerified || isRejected ? adminUser._id : undefined,
            verifiedAt: isVerified || isRejected ? new Date() : undefined,
          }
        });
      }

      // 4. Certifications (0-2 per student)
      const certCount = Math.floor(Math.random() * 3);
      const certNames = [
        { name: 'AWS Certified Cloud Practitioner', org: 'Amazon Web Services', cat: 'Cloud' },
        { name: 'Google Cloud Associate Cloud Engineer', org: 'Google Cloud Platform', cat: 'Cloud' },
        { name: 'TensorFlow Developer Certificate', org: 'DeepLearning.AI', cat: 'AI/ML' },
        { name: 'Meta Front-End Developer Certificate', org: 'Meta Professional', cat: 'Programming' },
        { name: 'Oracle Certified Java Professional', org: 'Oracle Corporation', cat: 'Programming' }
      ];

      for (let c = 0; c < certCount; c++) {
        const cert = certNames[Math.floor(Math.random() * certNames.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isRejected = status === 'REJECTED';
        const isVerified = status === 'VERIFIED';

        await Certification.create({
          student: studentId,
          certificationName: cert.name,
          issuingOrganization: cert.org,
          category: cert.cat,
          issueDate: new Date('2024-11-15'),
          credentialId: `AWS-PRAC-${Math.floor(100000 + Math.random() * 900000)}`,
          credentialUrl: `https://aws.verify.com/cert/12345`,
          certificateFile: mockDocument._id,
          verification: {
            status,
            rejectionReason: isRejected ? rejectReasons[Math.floor(Math.random() * rejectReasons.length)] : '',
            verifiedBy: isVerified || isRejected ? adminUser._id : undefined,
            verifiedAt: isVerified || isRejected ? new Date() : undefined,
          }
        });
      }

      // 5. NPTEL (0-1 per student)
      if (Math.random() > 0.5) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isRejected = status === 'REJECTED';
        const isVerified = status === 'VERIFIED';
        const score = Math.floor(55 + Math.random() * 41); // 55 to 95
        const certTypes = ['Participation', 'Elite', 'Elite + Silver', 'Elite + Gold'];
        const certType = score >= 90 ? 'Elite + Gold' : score >= 75 ? 'Elite + Silver' : score >= 60 ? 'Elite' : 'Participation';

        await NPTELRecord.create({
          student: studentId,
          courseName: ['Database Management Systems', 'Software Engineering', 'Data Structures & Algorithms', 'Introduction to Machine Learning'][Math.floor(Math.random() * 4)],
          courseId: `noc24-cs${Math.floor(10 + Math.random() * 90)}`,
          score,
          certificationType: certType,
          eliteStatus: score >= 60,
          rank: Math.random() > 0.8 ? Math.floor(1 + Math.random() * 50) : undefined,
          examDate: new Date('2024-10-20'),
          certificate: mockDocument._id,
          verification: {
            status,
            rejectionReason: isRejected ? rejectReasons[Math.floor(Math.random() * rejectReasons.length)] : '',
            verifiedBy: isVerified || isRejected ? adminUser._id : undefined,
            verifiedAt: isVerified || isRejected ? new Date() : undefined,
          }
        });
      }

      // 6. Hackathons (0-1 per student)
      if (Math.random() > 0.6) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isRejected = status === 'REJECTED';
        const isVerified = status === 'VERIFIED';

        await Hackathon.create({
          student: studentId,
          hackathonName: ['Smart India Hackathon', 'Google Hash Code', 'Microsoft Imagine Cup', 'CodeRed Hackathon'][Math.floor(Math.random() * 4)],
          organizer: ['MHRD Govt of India', 'Google Developers', 'Microsoft Research', 'College CSE Dept'][Math.floor(Math.random() * 4)],
          date: new Date('2024-12-05'),
          teamName: 'Bytes & Bugs',
          studentRole: ['Team Lead & Full Stack', 'ML Specialist', 'UI Developer'][Math.floor(Math.random() * 3)],
          projectName: 'EduTrack AI Assistant',
          position: ['Participant', 'Finalist', 'Winner', 'Runner-up'][Math.floor(Math.random() * 4)],
          projectLink: 'https://github.com/cse/hackathon-edutrack',
          certificate: mockDocument._id,
          verification: {
            status,
            rejectionReason: isRejected ? rejectReasons[Math.floor(Math.random() * rejectReasons.length)] : '',
            verifiedBy: isVerified || isRejected ? adminUser._id : undefined,
            verifiedAt: isVerified || isRejected ? new Date() : undefined,
          }
        });
      }

      // 7. Achievements (0-1 per student)
      if (Math.random() > 0.7) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isRejected = status === 'REJECTED';
        const isVerified = status === 'VERIFIED';

        await Achievement.create({
          student: studentId,
          achievementTitle: ['First Place in Coding Competition', 'District level Volleyball Runner-up', 'Best Student Volunteer Award', 'Published Paper in IEEE Student Conference'][Math.floor(Math.random() * 4)],
          category: ['Academic', 'Sports', 'Cultural', 'Leadership', 'Competition'][Math.floor(Math.random() * 5)],
          level: ['College', 'University', 'District', 'State', 'National', 'International'][Math.floor(Math.random() * 6)],
          date: new Date('2024-09-12'),
          description: 'Achieved outstanding rank and represented the class in the official tournament/panel. Awarded certificate and memento.',
          proofDocument: mockDocument._id,
          verification: {
            status,
            rejectionReason: isRejected ? rejectReasons[Math.floor(Math.random() * rejectReasons.length)] : '',
            verifiedBy: isVerified || isRejected ? adminUser._id : undefined,
            verifiedAt: isVerified || isRejected ? new Date() : undefined,
          }
        });
      }

      // Update student profile completion
      await updateProfileCompletion(studentId.toString());
    }

    console.log('🌟 Seeding Completed successfully!');
    console.log(`💡 Loaded 1 Admin and 72 Student profiles with full modules verification data.`);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
  }
};
