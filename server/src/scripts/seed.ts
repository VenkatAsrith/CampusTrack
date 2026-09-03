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
import { Announcement } from '../models/Announcement';
import { updateProfileCompletion } from '../utils/profileCompletion';
import { calculateCGPAFromSemesters } from '../utils/cgpaCalculator';

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

const motherFirstNames = ['Lakshmi', 'Saraswathi', 'Radha', 'Padma', 'Sunita', 'Usha', 'Geeta', 'Sita', 'Anita', 'Bhavani'];
const fatherFirstNames = ['Ramesh', 'Suresh', 'Narayana', 'Venkatesh', 'Subba Rao', 'Krishna', 'Srinivas', 'Satyanarayana', 'Mohan', 'Rajesh'];

const branches = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Information Technology',
  'Artificial Intelligence & Machine Learning',
];

const branchCodes: Record<string, string> = {
  'Computer Science & Engineering': 'CSE',
  'Electronics & Communication Engineering': 'ECE',
  'Electrical & Electronics Engineering': 'EEE',
  'Information Technology': 'IT',
  'Artificial Intelligence & Machine Learning': 'AIML',
};

const cities = [
  { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', pincode: '500081' },
  { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560001' },
  { city: 'Vijayawada', district: 'Krishna', state: 'Andhra Pradesh', pincode: '520001' },
  { city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '530002' },
  { city: 'Warangal', district: 'Hanamkonda', state: 'Telangana', pincode: '506001' },
  { city: 'Guntur', district: 'Guntur', state: 'Andhra Pradesh', pincode: '522002' },
  { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
];

const careerInterests = [
  'Full Stack Development', 'Data Science', 'Machine Learning', 'AI Engineer',
  'Cloud Architecture', 'Cybersecurity', 'Mobile App Development', 'Data Engineering', 'Embedded Systems'
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
    await Announcement.deleteMany({});

    console.log('🔑 Creating TPO (Admin) account...');
    const adminUser = await User.create({
      email: 'admin@college.edu',
      password: 'admin123',
      role: 'admin',
    });
    console.log(`✅ TPO created: admin@college.edu / admin123`);

    // Create a mock proof document
    const mockDocument = await Document.create({
      filename: 'proof-mock-template.pdf',
      originalName: 'certificate_proof.pdf',
      mimeType: 'application/pdf',
      size: 154200,
      filePath: 'uploads/proof-mock-template.pdf',
      uploadedBy: adminUser._id,
    });

    const studentsList = [];

    console.log('🌟 Creating flagship Demo Student account (DEMO2026 / demo123)...');
    const demoUser = await User.create({
      rollNumber: 'DEMO2026',
      email: 'demo.student@college.edu',
      password: 'demo123',
      role: 'student',
    });

    const demoSemesterResults = [
      { semester: 1, percentage: 92.5 },
      { semester: 2, percentage: 94.0 },
      { semester: 3, percentage: 93.5 },
      { semester: 4, percentage: 95.0 },
      { semester: 5, percentage: 96.0 },
      { semester: 6, percentage: 94.5 },
      { semester: 7, percentage: 95.5 },
    ];
    const demoCgpa = calculateCGPAFromSemesters(demoSemesterResults);

    const demoStudent = await Student.create({
      user: demoUser._id,
      rollNumber: 'DEMO2026',
      fullName: 'Aarav Sharma (Demo Student)',
      studentId: 'STU-DEMO-2026',
      email: 'demo.student@college.edu',
      phone: '9876543210',
      studentMobile: '9876543210',
      gender: 'Male',
      dob: new Date('2003-05-15'),
      branch: 'Computer Science & Engineering',
      batch: '2022-2026',
      year: 4,
      semester: 7,
      motherName: 'Sunita Sharma',
      motherMobile: '9876543211',
      fatherGuardianName: 'Rajesh Sharma',
      fatherGuardianMobile: '9876543212',
      address: {
        doorNo: 'Plot 42, Flat 301',
        street: 'Sri Nagar Colony',
        city: 'Hyderabad',
        district: 'Rangareddy',
        state: 'Telangana',
        pincode: '500081',
      },
      academicQualification: 'Intermediate',
      sscPercentage: 95.4,
      intermediatePercentage: 96.2,
      diplomaPercentage: 0,
      semesterResults: demoSemesterResults,
      numberOfBacklogs: 0,
      cgpa: demoCgpa,
      careerInterest: 'Full Stack Cloud Architecture & AI Engineering',
      github: 'https://github.com/aaravsharma-demo',
      linkedin: 'https://linkedin.com/in/aaravsharma-demo',
      portfolio: 'https://aaravsharma.dev',
      resumeLink: 'https://drive.google.com/file/d/demo-resume.pdf',
    });

    studentsList.push(demoStudent);

    console.log('🌟 Creating requested Demo Student account (23SS1A0535 / demo123)...');
    const user23SS = await User.create({
      rollNumber: '23SS1A0535',
      email: '23ss1a0535@college.edu',
      password: 'demo123',
      role: 'student',
    });

    const semResults23SS = [
      { semester: 1, percentage: 89.0 },
      { semester: 2, percentage: 91.5 },
      { semester: 3, percentage: 90.0 },
      { semester: 4, percentage: 92.5 },
      { semester: 5, percentage: 94.0 },
    ];
    const cgpa23SS = calculateCGPAFromSemesters(semResults23SS);

    const student23SS = await Student.create({
      user: user23SS._id,
      rollNumber: '23SS1A0535',
      fullName: 'Raja Rajeshwari',
      studentId: 'STU-23SS1A0535',
      email: '23ss1a0535@college.edu',
      phone: '9876543210',
      studentMobile: '9876543210',
      gender: 'Female',
      dob: new Date('2004-08-20'),
      branch: 'Computer Science & Engineering',
      batch: '2023-2027',
      year: 3,
      semester: 5,
      motherName: 'Lakshmi Devi',
      motherMobile: '9876543211',
      fatherGuardianName: 'Srinivasa Rao',
      fatherGuardianMobile: '9876543212',
      address: {
        doorNo: 'Flat 302, Green Meadows',
        street: 'Main Road, Madhapur',
        city: 'Hyderabad',
        district: 'Rangareddy',
        state: 'Telangana',
        pincode: '500081',
      },
      academicQualification: 'Intermediate',
      sscPercentage: 94.8,
      intermediatePercentage: 95.5,
      diplomaPercentage: 0,
      semesterResults: semResults23SS,
      numberOfBacklogs: 0,
      cgpa: cgpa23SS,
      careerInterest: 'Full Stack Web Development & Cloud Computing',
      github: 'https://github.com/23ss1a0535',
      linkedin: 'https://linkedin.com/in/23ss1a0535',
      portfolio: 'https://23ss1a0535.dev',
      resumeLink: 'https://drive.google.com/file/d/demo-resume-23ss.pdf',
    });

    studentsList.push(student23SS);
    console.log(`✅ Student 23SS1A0535 created: Roll 23SS1A0535 / Pass demo123 (CGPA: ${cgpa23SS})`);

    console.log('👥 Generating 75 Multi-Branch student records across CSE, ECE, EEE, IT, AIML...');
    for (let i = 1; i <= 75; i++) {
      // Rotate branches evenly
      const branch = branches[(i - 1) % branches.length];
      const code = branchCodes[branch] || 'CSE';
      const rollNumber = `${code}${String(Math.floor((i - 1) / branches.length) + 1).padStart(3, '0')}`;
      
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${fName} ${lName}`;
      const email = `${rollNumber.toLowerCase()}@college.edu`;
      const studentMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

      // Parent Details
      const motherFName = motherFirstNames[Math.floor(Math.random() * motherFirstNames.length)];
      const fatherFName = fatherFirstNames[Math.floor(Math.random() * fatherFirstNames.length)];
      const motherName = `${motherFName} ${lName}`;
      const motherMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
      const fatherGuardianName = `${fatherFName} ${lName}`;
      const fatherGuardianMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

      // Address
      const location = cities[Math.floor(Math.random() * cities.length)];
      const address = {
        doorNo: `Plot ${Math.floor(10 + Math.random() * 190)}, Flat ${Math.floor(101 + Math.random() * 400)}`,
        street: ['Gandhi Road', 'RTC Colony', 'Madhapur Main Road', 'MG Road', 'Anna Salai', 'Sri Nagar Colony'][Math.floor(Math.random() * 6)],
        city: location.city,
        district: location.district,
        state: location.state,
        pincode: location.pincode,
      };

      // Year & Semester distribution (1st to 4th year)
      const year = ((i - 1) % 4) + 1; // 1, 2, 3, 4
      const semester = year * 2; // e.g. Year 1 -> Sem 2, Year 3 -> Sem 6, Year 4 -> Sem 8
      const batch = `${2027 - year}-${2031 - year}`;

      // Academic details
      const sscPercentage = Number((78 + Math.random() * 20).toFixed(1)); // 78% to 98%
      const isDiploma = Math.random() < 0.15; // 15% diploma lateral entries
      const academicQualification = isDiploma ? 'Diploma' : 'Intermediate';
      const intermediatePercentage = !isDiploma ? Number((75 + Math.random() * 23).toFixed(1)) : 0;
      const diplomaPercentage = isDiploma ? Number((72 + Math.random() * 24).toFixed(1)) : 0;

      // Dynamic Semester percentages up to current semester
      const semesterResults: { semester: number; percentage: number }[] = [];
      for (let s = 1; s <= semester; s++) {
        semesterResults.push({
          semester: s,
          percentage: Number((65 + Math.random() * 32).toFixed(1)),
        });
      }

      // Automatically calculate CGPA from semester percentages
      const cgpa = calculateCGPAFromSemesters(semesterResults);

      // Backlogs: 70% have 0 backlogs, 20% have 1, 10% have 2 or 3
      const backlogRoll = Math.random();
      const numberOfBacklogs = backlogRoll > 0.3 ? 0 : backlogRoll > 0.1 ? 1 : Math.floor(2 + Math.random() * 2);

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
        studentId: `STU-${rollNumber}`,
        fullName,
        email,
        phone: studentMobile,
        studentMobile,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        dob: new Date(2003, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)),
        branch,
        batch,
        year,
        semester,
        motherName,
        motherMobile,
        fatherGuardianName,
        fatherGuardianMobile,
        address,
        academicQualification,
        sscPercentage,
        intermediatePercentage,
        diplomaPercentage,
        semesterResults,
        numberOfBacklogs,
        cgpa,
        careerInterest,
        github: Math.random() > 0.3 ? `https://github.com/${rollNumber.toLowerCase()}` : '',
        linkedin: Math.random() > 0.3 ? `https://linkedin.com/in/${rollNumber.toLowerCase()}` : '',
        portfolio: Math.random() > 0.7 ? `https://${rollNumber.toLowerCase()}.dev` : '',
        resumeLink: Math.random() > 0.4 ? `https://drive.google.com/resume-${rollNumber.toLowerCase()}.pdf` : '',
      });

      studentsList.push(student);
    }

    console.log('📊 Injecting sub-module achievements for students...');
    const statuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'] as const;
    const rejectReasons = [
      'The uploaded certificate is blurry and unreadable.',
      'Dates do not match the organization details in the description.',
      'Please attach the official score sheet rather than the course landing page.',
      'GitHub repository is private. Please make it public or upload code proof.'
    ];

    for (const student of studentsList) {
      const studentId = student._id;

      // 1. Coding Profiles
      const platCount = Math.floor(Math.random() * 2) + 1;
      const shuffledPlats = [...platforms].sort(() => 0.5 - Math.random());
      for (let p = 0; p < platCount; p++) {
        await CodingProfile.create({
          student: studentId,
          platform: shuffledPlats[p],
          username: `${student.rollNumber.toLowerCase()}_code`,
          profileUrl: `https://${shuffledPlats[p].toLowerCase()}.com/${student.rollNumber.toLowerCase()}`,
          currentRating: Math.floor(1250 + Math.random() * 950),
          highestRating: Math.floor(1450 + Math.random() * 950),
          rank: Math.floor(100 + Math.random() * 40000),
          problemsSolved: Math.floor(60 + Math.random() * 450),
        });
      }

      // 2. Projects
      const projCount = Math.floor(Math.random() * 2) + 1;
      for (let pr = 1; pr <= projCount; pr++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isRejected = status === 'REJECTED';
        const isVerified = status === 'VERIFIED';

        await Project.create({
          student: studentId,
          projectName: `${student.careerInterest} Platform v${pr}`,
          description: `An enterprise web solution built with modular architecture, robust API design, and modern database pipelines.`,
          technologies: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Tailwind CSS'],
          category: ['Web Development', 'AI', 'Machine Learning', 'Cloud'][Math.floor(Math.random() * 4)],
          githubUrl: `https://github.com/${student.rollNumber.toLowerCase()}/project-${pr}`,
          liveDemoUrl: Math.random() > 0.5 ? `https://demo-project-${student.rollNumber.toLowerCase()}.netlify.app` : '',
          studentRole: ['Frontend Developer', 'Backend Developer', 'Team Lead', 'Full Stack Engineer'][Math.floor(Math.random() * 4)],
          projectType: ['Academic', 'Personal', 'Minor Project', 'Major Project'][Math.floor(Math.random() * 4)],
          startDate: new Date('2025-01-10'),
          endDate: new Date('2025-04-15'),
          proofDocument: mockDocument._id,
          verification: {
            status,
            rejectionReason: isRejected ? rejectReasons[Math.floor(Math.random() * rejectReasons.length)] : '',
            verifiedBy: isVerified || isRejected ? adminUser._id : undefined,
            verifiedAt: isVerified || isRejected ? new Date() : undefined,
          },
        });
      }

      // 3. Internships
      if (Math.random() > 0.35) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isRejected = status === 'REJECTED';
        const isVerified = status === 'VERIFIED';

        await Internship.create({
          student: studentId,
          company: ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Razorpay'][Math.floor(Math.random() * 8)],
          role: ['Software Engineering Intern', 'Web Developer Trainee', 'Data Analyst Intern', 'Cloud Support Intern'][Math.floor(Math.random() * 4)],
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-07-31'),
          internshipType: ['On-site', 'Remote', 'Hybrid'][Math.floor(Math.random() * 3)],
          description: 'Contributed to production codebases, automated workflows, designed REST APIs, and participated in daily agile scrums.',
          technologies: ['Node.js', 'Express', 'React', 'Docker'],
          certificate: mockDocument._id,
          offerLetter: mockDocument._id,
          verification: {
            status,
            rejectionReason: isRejected ? rejectReasons[Math.floor(Math.random() * rejectReasons.length)] : '',
            verifiedBy: isVerified || isRejected ? adminUser._id : undefined,
            verifiedAt: isVerified || isRejected ? new Date() : undefined,
          },
        });
      }

      // 4. Certifications
      if (Math.random() > 0.3) {
        const certNames = [
          { name: 'AWS Certified Solutions Architect', org: 'Amazon Web Services', cat: 'Cloud' },
          { name: 'Google Cloud Associate Cloud Engineer', org: 'Google Cloud Platform', cat: 'Cloud' },
          { name: 'Meta Front-End Professional Certificate', org: 'Meta', cat: 'Programming' },
          { name: 'Deep Learning Specialization', org: 'Coursera & DeepLearning.AI', cat: 'AI/ML' },
        ];
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
          credentialId: `CERT-${Math.floor(100000 + Math.random() * 900000)}`,
          credentialUrl: 'https://verify.certification.org/cert/12345',
          certificateFile: mockDocument._id,
          verification: {
            status,
            rejectionReason: isRejected ? rejectReasons[Math.floor(Math.random() * rejectReasons.length)] : '',
            verifiedBy: isVerified || isRejected ? adminUser._id : undefined,
            verifiedAt: isVerified || isRejected ? new Date() : undefined,
          },
        });
      }

      // 5. NPTEL
      if (Math.random() > 0.45) {
        const score = Math.floor(58 + Math.random() * 38);
        const certType = score >= 90 ? 'Elite + Gold' : score >= 75 ? 'Elite + Silver' : score >= 60 ? 'Elite' : 'Participation';
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        await NPTELRecord.create({
          student: studentId,
          courseName: ['Database Management Systems', 'Software Engineering', 'Data Structures & Algorithms', 'Operating Systems'][Math.floor(Math.random() * 4)],
          courseId: `noc25-cs${Math.floor(10 + Math.random() * 90)}`,
          score,
          certificationType: certType,
          eliteStatus: score >= 60,
          examDate: new Date('2024-10-20'),
          certificate: mockDocument._id,
          verification: {
            status,
            verifiedBy: status === 'VERIFIED' ? adminUser._id : undefined,
            verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
          },
        });
      }

      // Update student profile completion
      await updateProfileCompletion(studentId.toString());
    }

    console.log('📢 Creating realistic Announcements & Placement Drives...');
    const now = new Date();
    
    // 1. Active Placement Drive (Deadline in 10 days)
    await Announcement.create({
      title: 'TCS National Qualifier Test (NQT) Drive 2026',
      description: `Tata Consultancy Services (TCS) is inviting eligible final year and pre-final year students for the NQT Campus Drive 2026.\n\nRoles: Ninja (3.6 LPA) and Digital (7.2 LPA).\nAssessment includes Cognitive Skills and Advanced Technical Coding.\n\nPlease complete the registration before the deadline.`,
      type: 'Drive',
      isPlacementDrive: true,
      companyName: 'Tata Consultancy Services (TCS)',
      jobRole: 'Systems Engineer & Digital Developer',
      driveDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // In 15 days
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
      endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // Deadline in 10 days
      links: [
        { label: 'Register on TCS NextStep', url: 'https://nextstep.tcs.com/campus/#/' },
        { label: 'College Internal Registration Form', url: 'https://forms.google.com/tcs-drive-2026' },
      ],
      eligibility: {
        minCGPA: 6.5,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication Engineering'],
        eligibleYears: [3, 4],
      },
      isPublished: true,
      createdBy: adminUser._id,
    });

    // 2. Active Placement Drive (Deadline in 5 days)
    await Announcement.create({
      title: 'Microsoft Accelerate Internship & Full-time Drive 2026',
      description: `Microsoft University Recruiting is hiring Summer 2026 Software Engineer Interns and Full-time 2026 graduates.\n\nKey requirements: Strong Data Structures & Algorithms, Object-Oriented Design, and System Architecture fundamentals.\nEligible students must apply via the corporate career portal and confirm on Google Form.`,
      type: 'Placement',
      isPlacementDrive: true,
      companyName: 'Microsoft',
      jobRole: 'Software Development Engineer (SDE)',
      driveDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      links: [
        { label: 'Apply on Microsoft Careers', url: 'https://careers.microsoft.com/students' },
        { label: 'Upload Resume for TPO Shortlist', url: 'https://forms.google.com/msft-tpo-verify' },
      ],
      eligibility: {
        minCGPA: 7.5,
        maxBacklogs: 0,
        eligibleBranches: ['Computer Science & Engineering', 'Artificial Intelligence & Machine Learning', 'Information Technology'],
        eligibleYears: [3, 4],
      },
      isPublished: true,
      createdBy: adminUser._id,
    });

    // 3. Upcoming Hackathon / Event Announcement (Starts in 4 days)
    await Announcement.create({
      title: 'Smart India Hackathon (SIH) 2026 Internal Round Selection',
      description: `Department internal rounds for Smart India Hackathon 2026 nominations will be conducted in the Central Seminar Hall.\n\nTeams of 6 students (with at least 1 female team member mandatory) should submit their problem statement abstract through the link below.`,
      type: 'Event',
      isPlacementDrive: false,
      companyName: 'MHRD Govt of India',
      jobRole: 'National Hackathon Team Nomination',
      driveDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      startDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // Starts in 4 days (UPCOMING)
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      links: [
        { label: 'SIH 2026 Problem Statements', url: 'https://www.sih.gov.in/' },
        { label: 'Submit Team Abstract', url: 'https://forms.google.com/sih-2026-internal' },
      ],
      eligibility: {
        minCGPA: 0,
        maxBacklogs: 5,
        eligibleBranches: branches,
        eligibleYears: [1, 2, 3, 4],
      },
      isPublished: true,
      createdBy: adminUser._id,
    });

    // 4. Expired Announcement (Historical / Closed Drive)
    await Announcement.create({
      title: 'Infosys InfyTQ Certification & Placement Challenge 2025',
      description: `The registration window for Infosys InfyTQ 2025 has officially concluded. Shortlisted candidates have received examination slot booking emails directly from Infosys.`,
      type: 'Placement',
      isPlacementDrive: true,
      companyName: 'Infosys',
      jobRole: 'Systems Engineer Specialist',
      startDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // Ended 10 days ago (EXPIRED)
      isPublished: true,
      createdBy: adminUser._id,
    });

    console.log('🌟 Seeding Completed successfully!');
    console.log(`💡 Loaded 1 TPO account, 75 Multi-Branch Student profiles, and 4 Announcements.`);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
  }
};

if (require.main === module) {
  const { connectDB, closeDB } = require('../config/db');
  connectDB().then(async () => {
    await seedData();
    await closeDB();
    process.exit(0);
  });
}
