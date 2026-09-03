# CampusTrack

Institutional Student & Placement Management Portal for **JNTUH University College of Engineering**.

---

## 📌 Overview

**CampusTrack** is a centralized web portal designed for engineering colleges to track academic progress, student portfolios, placement drives, verified achievements, and institutional records with bidirectional Google Sheets synchronization and Cloudinary document storage.

---

## 🚀 Key Features

### 🎓 Student Portal
- **Dashboard & Portfolio:** Unified overview of student CGPA, academic standings, and verification scores.
- **Portfolio Modules:** Structured entry and proof submission for:
  - Capstone, Minor, and Major Projects
  - Software & Research Internships
  - Industry Certifications (AWS, GCP, Azure, etc.)
  - SWAYAM NPTEL Courses & Scores
  - Hackathon Entries & Accolades
  - Competitive Coding Profiles (LeetCode, CodeChef, GeeksforGeeks, Codeforces)
  - Co-curricular & Extracurricular Achievements
- **Document Optimization:** Client-side HTML5 Canvas image downscaling ($\le 1920$px) and JPEG compression (0.82 quality) prior to secure storage.
- **Non-Destructive PDF Handling:** Complete vector text legibility and document preservation for PDF/DOCX files.
- **Live Announcements:** Real-time feed for institutional notices, eligibility notifications, and placement drives.

### 🛡️ Training & Placement Officer (TPO) Portal
- **Academic Directory:** Multi-dimensional filtering by Academic Year (1st to 4th Year), Branch (CSE, CSE SF, CSC, CSM, ECE, ME, EEE, Civil), and CGPA thresholds.
- **Batch Management & Lifecycle:** Cohort tracking (e.g. `2023-2027`), semester progression, and final graduation marking while permanently preserving historical cohort records.
- **Verification Queue:** In-place review, approval, or feedback/rejection on student submitted achievements and proofs.
- **Secure Password Reset:** In-place student credential updates using salted `bcryptjs` hashing without plaintext exposure.
- **Placement Drives & Broadcasts:** Targeted broadcasts for placement notifications with custom CGPA criteria and application links.
- **Google Sheets Integration:** Keyed two-way synchronization on `studentId` with automated schema mapping and sync health auditing.

---

## 🎨 Design System & Theme Engine

CampusTrack features a multi-palette design engine with full dark mode support:
- **Royal Classic:** Institutional Royal Indigo (`#3B50DF`), Crisp Canvas (`#F4F6FA`), Clean Card Surfaces (`#FFFFFF`).
- **Coral Minimal:** Modern Warm Coral (`#F05A24`), Minimal Background (`#F9F9F9`), Soft Surfaces (`#F4F2F1`).
- **Unified Dark Mode:** Deep Slate & Onyx surfaces with high-contrast typography and dynamic accent tinting.
- **Collapsible Layouts:** Dual-state desktop sidebars (`w-64` $\leftrightarrow$ `w-20`) and mobile slide-in drawers.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite 5.2
- **Styling:** Tailwind CSS 3.4 + Custom CSS Design Tokens
- **Icons:** Lucide React
- **Routing:** React Router DOM v6
- **Forms & Validation:** React Hook Form + Zod

### Backend
- **Runtime:** Node.js + Express 4.19 + TypeScript
- **Database:** MongoDB Atlas / Mongoose 8.3
- **File Processing:** Multer + ExcelJS
- **Authentication:** JWT Bearer tokens + `bcryptjs`

---

## 🔑 Demo Access

Quick one-click access is pre-configured on the login page:

| Role | Identifier | Password | Portal Features |
| :--- | :--- | :--- | :--- |
| **Student** | `23SS1A0535` | `demo123` | Student Dashboard, Portfolio, Proof Uploader |
| **TPO / Admin** | `admin@college.edu` | `admin123` | Directory, Verification Queue, Batches, Sheets Sync |

---

## 💻 Local Setup & Development

### 1. Clone the repository
```bash
git clone https://github.com/VenkatAsrith/CampusTrack.git
cd CampusTrack
```

### 2. Setup Server
```bash
cd server
npm install
npm run dev
```

### 3. Setup Client
```bash
cd ../client
npm install
npm run dev
```

The client will be running at `http://localhost:5173` and the API server at `http://localhost:5000`.

---

## 📄 License
This project is proprietary and maintained for **JNTUH University College of Engineering**.
