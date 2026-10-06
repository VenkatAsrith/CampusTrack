# CampusTrack — TPO Role, Complete Data Flow & Operational Guide

---

## 1. Executive Summary & Purpose of the TPO Role

### 1.1 What is the TPO (Training & Placement Officer)?
In **CampusTrack**, the **Training & Placement Officer (TPO)** is the institutional guardian of student career readiness, credential authenticity, and corporate recruitment pipelines.

Historically, placement offices struggled with:
- **Unverified Student Claims:** Students exaggerating CGPAs, fake certificates, or unverified internship claims on resumes.
- **Data Fragmentation:** Student records scattered across disparate departmental spreadsheets, paper folders, and emails.
- **Recruiter Friction:** Corporate recruiters demanding verified, formatted Excel sheets sorted strictly by branch, year, and eligibility criteria on short notice.
- **Accreditation Chaos:** Difficulty gathering verified student achievements for NAAC, NBA, and NIRF rankings.

### 1.2 The TPO's Mission in CampusTrack
The TPO portal provides a centralized, real-time command center where the placement officer can:
1. **Inspect and Verify Student Portfolios:** Every project, internship, certification, hackathon, and NPTEL course is submitted with a verifiable PDF/image proof that the TPO reviews directly in the browser.
2. **Monitor Real-Time Academic Readiness:** Live dashboards track average CGPAs, backlog distributions, and student profile completion rates.
3. **Conduct Recruitment Drives:** Create, schedule, and broadcast company drives with automated eligibility filters (minimum CGPA, maximum backlogs, eligible branches/years).
4. **Produce Deterministic Recruiter Exports:** Generate professional, audit-proof Excel workbooks and maintain bidirectional synchronization with the placement cell's master Google Sheet.
5. **Manage Academic Cohorts:** Perform batch graduation and semester promotions while maintaining an indelible audit log.

---

## 2. High-Level Data Flow: How Data Reaches the TPO

```
+--------------------------------------------------------------------------------------------------+
|                                    1. STUDENT SUBMISSION LAYER                                   |
|                                                                                                  |
|   Student enters profile data -> Uploads Resume & Proof Documents -> Submits for Verification   |
|   * Personal, Parent & Address Info       * Semester Scores & Backlogs                           |
|   * Projects, Internships, Certifications * Coding Handles (LeetCode, GitHub, etc.)              |
|   * Proofs compressed via Client Canvas (Images) or passed as raw vector PDFs (5MB limit)        |
+--------------------------------------------------------------------------------------------------+
                                                │
                                                ▼ [Multipart Upload & JSON API]
+--------------------------------------------------------------------------------------------------+
|                                   2. BACKEND & CLOUD ASSET PIPELINE                              |
|                                                                                                  |
|   * Multer Memory Storage -> SHA-256 Deduplication -> Streamed to Cloudinary Edge CDN            |
|   * MongoDB Atlas stores student record, portfolio collections & verification state = PENDING     |
|   * Real-Time Event & Timestamp recorded (triggers live feed on TPO Dashboard)                   |
+--------------------------------------------------------------------------------------------------+
                                                │
                                                ▼ [Authenticated JWT Session]
+--------------------------------------------------------------------------------------------------+
|                                      3. TPO COMMAND DESK (PORTAL)                                |
|                                                                                                  |
|   [Dashboard]       -> Live 12s feed of student edits, college-wide CGPA & backlog KPIs          |
|   [Directory]       -> Drill down by Year (1-4) & Branch with live counter badges                |
|   [Verification]    -> Preview proof PDFs inline via Streaming Proxy -> Accept or Reject         |
|   [Drives]          -> Broadcast placement notices with automated CGPA/Backlog eligibility       |
|   [Academic Mgmt]   -> Promote semesters, dry-run batch migrations, graduate final years         |
+--------------------------------------------------------------------------------------------------+
                                                │
                                                ▼ [Reporting & Downstream Delivery]
+--------------------------------------------------------------------------------------------------+
|                                4. RECRUITER EXPORT & ACCREDITATION                               |
|                                                                                                  |
|   * ExcelJS Engine: Deterministic corporate sheet (Branch -> Year -> Roll No)                     |
|   * Google Apps Script: Real-time 2-way sync with Placement Master Sheet (ID: 1w2T9...KQBk)       |
|   * Audit Log Engine: Every approval, rejection, and override recorded permanently               |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. End-to-End TPO User Journey & Screen Walkthrough

### 3.1 Screen 1: TPO Analytics Dashboard (`/admin/dashboard`)
The moment the TPO signs into CampusTrack, they land on a comprehensive analytics command center designed to give instant situational awareness.

#### A. Key Performance Indicators (KPI Cards)
| Metric Card | What the TPO Sees | Operational Meaning |
| :--- | :--- | :--- |
| **Total Students** | Count of all registered students | Total enrolled student body across all branches and batches. |
| **Average CGPA** | College-wide academic average (e.g. `7.42`) | Benchmark of college academic performance. |
| **Zero Backlogs** | Count of students with 0 active backlogs | **Placement-ready pool** eligible for Tier-1 companies with strict no-backlog policies. |
| **With Backlogs** | Count of students with $\ge 1$ backlog | Pool requiring academic remediation or placement targeting companies that allow history of arrears. |
| **Awaiting Review** | Count of pending portfolio submissions | **TPO's pending verification workload**. Highlights urgent student submissions. |
| **Verified Records** | Approved portfolio records count | Authenticated institutional achievements ready for recruiter presentation. |
| **Active Notices** | Current published announcements | Number of active general circulars visible to students. |
| **Upcoming Drives** | Scheduled corporate drives | Placement recruitment pipelines currently active. |
| **Module Totals** | Total Projects, Internships, Certifications, Hackathons | College-wide innovation and experiential learning volume. |

#### B. Live Student Profile Updates (Real-Time Feed)
- **12-Second Auto-Polling:** The TPO dashboard automatically polls the backend every 12 seconds with a pulsing green indicator (`Live Auto-Sync Active`).
- **Immediate Visibility:** Whenever any student updates their profile photo, alters their phone number, submits a new CGPA, or uploads a revised resume, a card appears in this feed.
- **Card Data:**
  - Student photo / avatar initials.
  - Full Name, Roll Number, Branch, Year, and Semester.
  - CGPA badge (Color-coded: Emerald $\ge 8.0$, Blue $7.0-7.9$, Amber $< 7.0$).
  - Backlog badge (Emerald for 0, Rose for $\ge 1$).
  - Profile Completeness percentage (e.g. `92%`).
  - Relative time stamp (`Just now`, `5m ago`, `2h ago`).
  - **Quick Action Buttons:**
    - `View Resume`: Opens the student's official resume inside the browser instantly.
    - `Full Profile`: Deep-links into the full student profile verification desk.

---

### 3.2 Screen 2: Academic Hierarchy & Student Directory (`/admin/directory`)

The TPO has access to a structured navigation system in the left sidebar and main directory page to locate any student in seconds.

#### A. Sidebar Academic Hierarchy
- Organized into **1st Year, 2nd Year, 3rd Year, 4th Year**.
- Under each year, branches are listed with live student counter badges:
  - **CSE** (Computer Science & Engineering)
  - **CSE SF** (Self-Finance)
  - **CSC** (Cyber Security)
  - **CSM** (AI & Machine Learning)
  - **ECE** (Electronics & Communication)
  - **ME** (Mechanical Engineering)
  - **EEE** (Electrical & Electronics)
  - **Civil** (Civil Engineering)
- Clicking a branch (e.g., `3rd Year -> CSM`) immediately filters the directory to that specific sub-cohort.

#### B. Multi-Parametric Search & Filter Bar
The TPO can filter students across any combination of criteria:
1. **Search Query:** Free text search matching Student Name, Roll Number, or Email.
2. **Branch Filter:** Dropdown of all 8 college departments.
3. **Year Filter:** 1st, 2nd, 3rd, or 4th Year.
4. **Batch Filter:** Target specific graduating cohorts (e.g. `2021-2025`, `2022-2026`).
5. **Backlog Filter:** Select `Zero Backlogs (Direct Eligible)` or `Has Backlogs`.
6. **Minimum CGPA:** Filter candidates above any threshold (e.g. $\ge 7.5$ for exclusive drives).
7. **Sorting:** Sort by Roll Number, Full Name, CGPA, Backlogs, or Profile Completeness (Ascending/Descending).

#### C. Year-Wise KPI Bar
When filtering by a specific year, the TPO sees a banner summarizing:
- Total students in that year.
- Average CGPA for that year.
- Percentage of students with zero backlogs.
- Percentage with profile completeness $> 75\%$.

---

### 3.3 Screen 3: Student Verification Desk (`/admin/student/:id`)
This is the core operational screen where the TPO reviews, audits, and authenticates student credentials.

#### A. Student Header & Quick Actions
- Student Profile Picture, Full Name, Roll Number, Branch, Current Semester, and Batch.
- Metric indicators: Overall CGPA, Backlog count, Profile Completeness %.
- **In-Browser Resume Preview Button (`View Resume`):** Launches the document in an interactive modal.
- **Direct Resume Download Button (`Download`):** Allows downloading the file directly to workstation disk.
- **TPO Emergency Password Reset (`Change Password`):** Allows the TPO to set a new password for a student locked out of their account, with immediate password hash update in MongoDB.

#### B. 4 Structured Student Profile Information Cards
1. **Personal Contact Card:** Official Email, Mobile Phone, Student ID, Gender.
2. **Parent / Guardian Card:** Mother's Name & Phone, Father/Guardian Name & Phone.
3. **Permanent Address Card:** Door No, Street, City/Town, District, State, PIN Code.
4. **Academics & Career Card:** SSC Percentage, Intermediate/Diploma Percentage, Career Interest.

#### C. B.Tech Semester Performance Breakdown
- Visual grid from **Sem 1 through Sem 8**.
- Displays the exact percentage scored in each semester against the current enrolled semester.
- Tracks academic progression over time.

#### D. Professional Links & Document Vault
- **Coding & Social Handles:** Direct links to GitHub profile, LinkedIn profile, and personal website.
- **Institutional Cloud Documents Vault:** Lists every raw certificate and identification file uploaded to Cloudinary, with file name, file size, document type (`ID Card`, `Resume`, `Marksheet`, `Certificate`), and preview/download controls.

#### E. 8 Portfolio Verification Tabs
The TPO can switch between 8 dedicated review tabs:

```
[ Projects ]  [ Internships ]  [ Certifications ]  [ NPTEL Courses ]  [ Hackathons ]  [ Achievements ]  [ Coding Profiles ]  [ Document Vault ]
```

Each record displays:
- Title, category/domain, and detailed description.
- Technologies used, dates, duration, role, and organization.
- Live links (GitHub repo, live URL, credential URL).
- Current verification status badge (`PENDING`, `VERIFIED`, `REJECTED`, or `UNDER_REVIEW`).
- **Verifiable Proof Button (`View Proof`):** Displays the uploaded certificate or proof document.
- **Verification Action Buttons:**
  - `Verify`: Instantly marks the achievement as verified, stamps the TPO's user ID and timestamp, and updates audit records.
  - `Reject`: Opens a review modal requiring a **mandatory feedback comment** (e.g., *"Certificate name does not match student name"* or *"Invalid NPTEL score sheet uploaded"*). The student receives this reason and can re-upload corrections.

---

## 4. In-Browser Document Streaming: How Proofs are Viewed

One major innovation in CampusTrack is solving the **Forced Download Problem**:

### The Challenge
Third-party CDNs (like Cloudinary) return raw attachments with HTTP header:
`Content-Disposition: attachment; filename="..."`
This forces the TPO's workstation to download hundreds of student PDFs locally, cluttering disk space and creating privacy risks.

### The Solution: Secure Streaming Delivery Proxy
```
[ TPO clicks 'View Proof' / 'View Resume' ]
                   │
                   ▼
[ Frontend opens DocumentPreviewModal with ?token=<JWT> ]
                   │
                   ▼
[ Express Endpoint: GET /api/v1/documents/:id ]
                   │
                   ├── 1. Validates JWT Token (Admin / TPO permission)
                   ├── 2. Queries MongoDB Document record
                   ├── 3. Fetches upstream asset stream from Cloudinary
                   └── 4. Overrides header: Content-Disposition: inline;
                   │
                   ▼
[ Browser streams binary chunks inside native <iframe> / Canvas ]
                   │
                   ▼
[ TPO reviews high-resolution PDF/Image with zoom/pan without downloading to disk! ]
```

---

## 5. Placement Drives & Announcement Hub (`/admin/announcements`)

The TPO controls institutional communications and job postings:

### 5.1 Placement Drive Creation
When a corporate recruiter approaches the college, the TPO creates a structured drive:
- **Company Name & Role:** e.g., *Amazon — Software Development Engineer (SDE)*.
- **Drive Date & Application Deadlines:** Start date, drive date, and registration cutoff.
- **Registration Links:** Portal link, Google Form, or company ATS link.
- **Automated Eligibility Matrix:**
  - **Minimum CGPA:** (e.g. `7.5`)
  - **Maximum Backlogs Allowed:** (e.g. `0`)
  - **Eligible Years:** (e.g. `3rd Year, 4th Year`)
  - **Eligible Branches:** (e.g. `CSE, CSM, CSC, ECE`)

### 5.2 Student Visibility
Students who do not meet the criteria see the announcement flagged with their eligibility status, preventing unqualified applicants from congesting the placement cell's pipeline.

### 5.3 Drive Lifecycle Controls
- **Update Deadline:** Dynamically extend or close registration dates.
- **Publish / Unpublish:** Draft announcements privately before making them public.
- **Delete:** Remove outdated circulars.

---

## 6. Academic Management: Batches & Semester Promotions

The TPO and Placement Admin manage academic transitions to ensure placement data reflects current student standings:

### 6.1 Batch Management (`/admin/batches`)
- Organizes students by graduation batch (e.g., `2021-2025`, `2022-2026`).
- Displays cohort metrics:
  - Total students in cohort.
  - Active vs Graduated student count.
  - Placement rate percentage (% of cohort placed).
  - Verification rate (% of student records audited).
- **One-Click Graduate Batch:** When a cohort passes out, the TPO clicks `Graduate Batch`. This transitions all records to `Graduated` status, locking them from general active placement drives while preserving their historical records for institutional reporting.
- **Batch Excel Export:** Instantly exports the complete cohort record into an Excel workbook.

### 6.2 Semester Promotion (`/admin/semester-promotion`)
When a semester concludes, students must be promoted systematically:
1. **Transition Rules:** `1-1 -> 1-2`, `1-2 -> 2-1 (Year jump to 2nd year)`, `2-1 -> 2-2`, `2-2 -> 3-1 (Year jump to 3rd year)`, `3-1 -> 3-2`, `3-2 -> 4-1 (Year jump to 4th year)`, `4-1 -> 4-2`.
2. **Branch Selector:** Allows promoting specific branches independently or all branches together.
3. **Dry-Run Preview:** Simulates the promotion before modifying database records:
   - Identifies candidate count.
   - Highlights data anomalies or inactive students.
4. **Execution:** Performs atomic updates across MongoDB records and logs an immutable audit event.

---

## 7. Recruiter Excel Generation & Google Sheets Sync

Corporate recruiters require standardized, verifiable spreadsheets. CampusTrack supports two distinct export mechanisms:

### 7.1 Deterministic Excel Generation (`/exports/excel`)
- Built with **ExcelJS**.
- Groups and sorts records deterministically:
  $$\text{Branch} \longrightarrow \text{Year} \longrightarrow \text{Roll Number}$$
- **Custom Column Selector:** The TPO can select exactly which columns to include:
  - *Personal:* Roll Number, Full Name, Email, Mobile, Branch, Year, Semester.
  - *Parent / Address:* Mother/Father names and contacts, Full permanent address.
  - *Academics:* SSC %, Inter/Diploma %, Sem 1-8 %, Overall CGPA, Backlogs count.
  - *Portfolio:* Verified Project count, Verified Internship count, GitHub, LinkedIn, Coding handles.
- Contains only verified data, preventing unvetted student claims from reaching corporate HR.

### 7.2 Bidirectional Google Sheets Synchronization (`/sync/google-sheets`)
Placement cells frequently manage day-to-day recruiting shortlists in Google Sheets. CampusTrack provides automated 2-way sync:
- **Connected Spreadsheet ID:** `1w2T9SHihyIOdKWXCkYYPu7R_U2ZYqB3j4zhrQjXKQBk`
- **Security Secret Handshake:** Uses an `x-sync-secret` header verified by Google Apps Script.
- **Operations:**
  - *MongoDB $\rightarrow$ Google Sheets:* Pushes verified student roster, CGPAs, and contact details into the master sheet.
  - *Google Sheets $\rightarrow$ MongoDB:* Pulls recruiter shortlisting notes or status updates back into the database.
  - *Sync Validation:* Verifies schema integrity and row count alignment between cloud database and spreadsheet.

---

## 8. Audit Logs & Administrative Accountability (`/admin/audit-logs`)

To ensure integrity and prevent arbitrary grade changes or fraudulent verifications:
- Every administrative action is permanently logged in the `AuditLog` collection.
- **Logged Events Include:**
  - `TPO Approved Record (projects - Jane Doe)`
  - `TPO Rejected Record (internships - John Smith)` with rejection note.
  - `TPO Reset Password (Roll: 21011A0501)`
  - `TPO Promoted Semester (3-1 to 3-2 for CSE, ECE)`
  - `TPO Marked Batch 2021-2025 as Graduated`
- Logs record: **Timestamp**, **Officer ID & Name**, **Action Type**, **Target Entity**, and **Target Student ID**.
- Audit logs cannot be modified or deleted through the UI.

---

## 9. Role-Based Access Control (RBAC) Comparison

| Capability / Action | Student | TPO (Placement Officer) | System Admin |
| :--- | :---: | :---: | :---: |
| Edit Own Profile & Academics | Yes | No (Student responsibility) | No |
| Upload Portfolio Proofs & Resume | Yes | No | No |
| View Own Verification Status & Feedback | Yes | No | No |
| View Other Students' Records | No | Yes (All branches/years) | Yes |
| Real-Time TPO Analytics Dashboard | No | Yes | Yes |
| Academic Hierarchy Drilldown (1st-4th Year) | No | Yes | Yes |
| In-Browser Document Streaming Preview | Own docs only | Yes (All student proofs) | Yes |
| Verify / Reject Student Achievements | No | Yes | Yes |
| Reset Student Password Override | No | Yes | Yes |
| Create Placement Drives & Announcements | No | Yes | Yes |
| Export Recruiter Excel Sheets | No | Yes | Yes |
| Google Sheets Master Bidirectional Sync | No | Yes | Yes |
| Graduate Academic Batches | No | Yes | Yes |
| Semester Promotion Dry-Run & Execution | No | Yes | Yes |
| Inspect Institutional Audit Logs | No | Yes | Yes |
| Cloudinary Storage & Infrastructure Settings | No | View Only | Full Config |

---

## 10. Summary: A Day in the Life of a TPO

```
+-----------------------------------------------------------------------------------------+
|                                TYPICAL TPO WORKFLOW CYCLE                               |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  09:00 AM ── Check TPO Dashboard: Review live feed of recent profile updates & new       |
|              proofs awaiting verification.                                              |
|                                                                                         |
|  10:00 AM ── Verification Queue: Open pending project and internship proofs, preview    |
|              certificates inline via streaming modal, approve or provide rejection      |
|              feedback comments.                                                         |
|                                                                                         |
|  11:30 AM ── Recruiter Requirement: Corporate partner requests list of 3rd/4th year     |
|              CSE/ECE candidates with CGPA >= 7.5 and 0 backlogs.                        |
|                                                                                         |
|  11:45 AM ── Student Directory Filter: Apply filters (Year: 3,4; Branch: CSE,ECE;        |
|              Min CGPA: 7.5; Backlogs: 0). Click 'Excel Export' -> Generate formatted     |
|              ExcelJS workbook with verified contact & project counts.                   |
|                                                                                         |
|  02:00 PM ── Placement Drive Broadcast: Post new drive announcement for upcoming        |
|              recruiter with automated eligibility criteria and application deadlines.   |
|                                                                                         |
|  04:00 PM ── Synchronize Placement Master Sheet: Trigger 1-click Google Sheets Sync to   |
|              keep the department's shared tracking sheet updated with MongoDB Atlas.    |
|                                                                                         |
|  05:00 PM ── Audit & Verification Check: Verify all actions recorded cleanly in         |
|              Audit Logs before closing session.                                         |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```
