# HireSphere AI — Project Report

## AI-Powered Recruitment & Employee Management System

**BCA Final Year Project**

---

## Table of Contents

1. [Dataset](#1-dataset)
2. [Sample Images](#2-sample-images)
3. [Training / Prerequisites](#3-training--prerequisites)
4. [References](#4-references)

---

## 1. Dataset

### 1.1 Overview

HireSphere AI uses a **fully synthetic, self-generated dataset** produced by the seed script (`src/scripts/seed.ts`). No external datasets, third-party CSV files, or real personal data are used anywhere in the project. Every record — user, resume, job posting, application, attendance entry, leave request, and performance review — is created programmatically to demonstrate the system's end-to-end capabilities.

> **Ethical note:** Since all data is synthetic and clearly labeled, there are zero privacy, copyright, or GDPR compliance concerns.

### 1.2 Database Schema

The system uses **17 Prisma ORM models** mapped to a SQLite database (MySQL-portable). The schema is defined in `prisma/schema.prisma`.

| # | Model (Table)              | Purpose                                                  | Approx. Seed Records |
|---|----------------------------|----------------------------------------------------------|----------------------|
| 1 | `User`                     | All login accounts (Admin, HR, Candidate, Employee)      | 7                    |
| 2 | `PasswordResetToken`       | Secure password-reset flow tokens                        | 0 (generated on use) |
| 3 | `CandidateProfile`         | Extended profile for candidate-role users                 | 5                    |
| 4 | `Resume`                   | Uploaded PDF resumes with extracted text & parse status   | 5                    |
| 5 | `Department`               | Organisation departments (Engineering, HR, etc.)         | 4                    |
| 6 | `Job`                      | Job postings with required/preferred skills, salary range | 4                    |
| 7 | `Application`              | Candidate → Job applications with AI score snapshot      | 8–12                 |
| 8 | `ApplicationStatusHistory` | Immutable audit trail of every status transition          | 15–25                |
| 9 | `Interview`                | Scheduled interviews (mode, link/location, status)       | 3–5                  |
| 10 | `ResumeAnalysis`          | Full AI scoring output (TF-IDF, skill overlap, evidence) | 8–12                 |
| 11 | `Employee`                | Employees converted from hired candidates                | 1–2                  |
| 12 | `Attendance`              | Daily attendance records (one per employee per day)      | 30–60                |
| 13 | `LeaveType`               | Leave categories (Annual, Sick, Casual)                  | 3                    |
| 14 | `LeaveRequest`            | Employee leave applications with approval workflow       | 3–5                  |
| 15 | `LeaveBalance`            | Per-employee, per-year leave quota tracking               | 3–6                  |
| 16 | `PerformanceReview`       | Manager-authored performance reviews (1–5 scale)         | 1–2                  |
| 17 | `Notification`            | In-app notification messages with read/unread status      | 10–20                |
| 18 | `AuditLog`                | Tamper-tolerant log of every significant system action    | 30–50                |
| 19 | `SystemSetting`           | Key-value application configuration                       | 0–2                  |

### 1.3 User Dataset

| # | Name              | Email                          | Role      | Purpose in Demo                          |
|---|-------------------|--------------------------------|-----------|------------------------------------------|
| 1 | System Admin      | `admin@hiresphere.ai`          | ADMIN     | Full system access, user management      |
| 2 | HR Manager        | `hr@hiresphere.ai`             | HR        | Job posting, candidate pipeline, reports |
| 3 | Aarav Sharma      | `aarav.sharma@example.com`     | EMPLOYEE  | Hired candidate → employee conversion   |
| 4 | Priya Nair        | `priya.nair@example.com`       | CANDIDATE | Frontend developer, moderate match       |
| 5 | Rohan Mehta       | `rohan.mehta@example.com`      | CANDIDATE | Data analyst, partial skill overlap      |
| 6 | Sneha Kulkarni    | `sneha.kulkarni@example.com`   | CANDIDATE | Fresh graduate, low experience match     |
| 7 | Vikram Rao        | `vikram.rao@example.com`       | CANDIDATE | Career changer, minimal skill overlap    |

**Password for all demo accounts:** `Password@123`

### 1.4 Synthetic Resume Dataset

Five PDF resumes are generated at seed time using `pdf-lib`. Each resume contains realistic but entirely fictional content:

| Candidate        | Profile                          | Skills Domain                                  | Experience | Resume Length |
|------------------|----------------------------------|-------------------------------------------------|------------|---------------|
| Aarav Sharma     | Full-Stack Python Developer      | Python, Django, Flask, REST API, scikit-learn, PostgreSQL, ML | 3 years    | ~250 words    |
| Priya Nair       | Frontend Developer               | React, TypeScript, Next.js, Tailwind CSS, UI/UX              | 2 years    | ~200 words    |
| Rohan Mehta      | Data Analyst                     | SQL, Power BI, Python, Pandas, Data Visualization             | 2 years    | ~180 words    |
| Sneha Kulkarni   | Aspiring Software Engineer       | Java, Spring Boot, MySQL, HTML/CSS, JavaScript                | 0 years    | ~160 words    |
| Vikram Rao       | Network Support Engineer         | Linux, Networking, Bash, CCNA                                 | 4 years    | ~140 words    |

**Key characteristic:** These resumes are run through the **real AI pipeline** (PDF → text extraction → TF-IDF vectorization → cosine similarity → skill matching) during seeding. The AI scores shown in the demo are **genuine computation results**, not hardcoded values.

### 1.5 Job Posting Dataset

| Job Title                        | Department  | Required Skills                                                    | Type       |
|----------------------------------|-------------|---------------------------------------------------------------------|------------|
| Python Backend Developer         | Engineering | Python, Django, REST API, PostgreSQL, Git                          | Full-Time  |
| Frontend React Developer         | Engineering | React, TypeScript, HTML/CSS, Tailwind CSS, Git                     | Full-Time  |
| Data Analyst                     | Analytics   | SQL, Excel, Power BI, Data Analysis, Python                        | Full-Time  |
| Junior Software Engineer         | Engineering | Java, OOP, Data Structures, Git, Problem Solving                   | Internship |

### 1.6 AI Scoring Dataset (Generated at Runtime)

Each application produces a `ResumeAnalysis` record containing:

| Field             | Type        | Description                                                            |
|-------------------|-------------|------------------------------------------------------------------------|
| `tfidfScore`      | Float (0–1) | Cosine similarity between TF-IDF vectors of resume and job text        |
| `skillScore`      | Float (0–1) | Ratio: matched required skills / total required skills                 |
| `finalScore`      | Float (0–1) | Weighted blend: `0.6 × tfidfScore + 0.4 × skillScore`                 |
| `weights`         | JSON        | `{"tfidf": 0.6, "skill": 0.4}` — stored for reproducibility           |
| `matchedSkills`   | JSON Array  | `[{skill, alias, evidence}]` — each with the resume sentence evidence |
| `missingSkills`   | JSON Array  | Skills required by job but not evidenced in resume                     |
| `extraSkills`     | JSON Array  | Skills found in resume but not in job requirements                     |
| `summary`         | String      | Plain-language explanation of the score for HR                         |
| `algorithmVersion`| String      | `tfidf-cosine-v1.0` — for version tracking                            |

### 1.7 Operational Datasets

**Attendance Data:**
- One record per employee per day (enforced by unique constraint `[employeeId, date]`)
- Statuses: PRESENT, ABSENT, LATE, HALF_DAY, LEAVE, WFH, HOLIDAY
- Includes check-in/out times and computed work hours

**Leave Data:**
- Leave types: Annual Leave (quota: 12), Sick Leave (quota: 8), Casual Leave (quota: 6)
- Leave requests with inclusive day counting, balance validation, and overlap detection
- Workflow: PENDING → APPROVED / REJECTED / CANCELLED

**Performance Reviews:**
- Rating scale: 1–5 (Poor / Below Average / Average / Good / Excellent)
- Fields: goals, achievements, feedback, strengths, areas to improve
- Reviewer identity and review period stored for auditability

### 1.8 Data Generation Process

```
Seed Script Execution Flow:
────────────────────────────
1. Wipe existing data (FK-safe order)
2. Create departments (4)
3. Create users (7) with bcrypt-hashed passwords
4. Generate PDF resumes with pdf-lib
5. Upload resumes to uploads/resumes/
6. Extract text from PDFs using unpdf (server-side pdf.js)
7. Parse structured info (name, email, phone, skills, education)
8. Create job postings with required/preferred skills
9. Submit applications (candidate → job)
10. Run REAL AI pipeline: TF-IDF + cosine similarity + skill matching
11. Store genuine AI scores (not hardcoded)
12. Create employee records (hired candidates)
13. Generate attendance records (past 30 days)
14. Create leave types, balances, and sample requests
15. Create performance reviews
16. Generate notifications and audit logs
```

**Command to regenerate:** `bun run src/scripts/seed.ts`

---

## 2. Sample Images

This section documents the key screens and interfaces of HireSphere AI. Screenshots should be captured during a live demo run across all four user roles.

### 2.1 Screenshot Index

| # | Screen / View                      | File Path                            | Role(s) Visible | Key Elements to Capture                                      |
|---|-------------------------------------|--------------------------------------|-----------------|--------------------------------------------------------------|
| 1 | Landing Page with 3D Hero           | `docs/screenshots/01-landing.png`    | Public          | Three.js animated hero, glassmorphism cards, CTA buttons     |
| 2 | Login Page                          | `docs/screenshots/02-login.png`      | Public          | Login form, demo credentials box, dark theme                 |
| 3 | Candidate Registration              | `docs/screenshots/03-registration.png`| Public          | Registration form with validation, role selection            |
| 4 | HR Dashboard                        | `docs/screenshots/04-hr-dashboard.png`| HR/Admin        | Recruitment funnel chart, trends, department donut, metrics  |
| 5 | Job Management                      | `docs/screenshots/05-jobs.png`       | HR              | Job list with status badges, search/filter, pagination       |
| 6 | Create/Edit Job Posting             | `docs/screenshots/06-create-job.png` | HR              | Form with skill chips, salary range, department dropdown     |
| 7 | AI Screening Workspace              | `docs/screenshots/07-ai-screening.png`| HR             | Score breakdown, matched/missing skills, evidence snippets   |
| 8 | Candidate Ranking                   | `docs/screenshots/08-ranking.png`    | HR              | Sorted candidates with scores, min-score filter, skill filter|
| 9 | Application Pipeline                | `docs/screenshots/09-pipeline.png`   | HR              | Status machine visualization, transition buttons, notes      |
| 10| Interview Scheduling                | `docs/screenshots/10-interview.png`  | HR              | Schedule form, mode selection, calendar integration          |
| 11| Candidate Portal — Job Browse       | `docs/screenshots/11-job-browse.png` | Candidate       | Open jobs list, search by skill/location/type                |
| 12| Candidate Apply Flow                | `docs/screenshots/12-apply.png`      | Candidate       | Resume upload (drag & drop), instant AI score display        |
| 13| Application Tracking                | `docs/screenshots/13-tracking.png`   | Candidate       | Status timeline, AI score snapshot, application history      |
| 14| Employee Dashboard                  | `docs/screenshots/14-emp-dashboard.png`| Employee       | Profile card, leave balances, upcoming actions               |
| 15| Attendance Calendar                 | `docs/screenshots/15-attendance.png` | Employee        | Month calendar with status dots, attendance records table    |
| 16| Leave Management                    | `docs/screenshots/16-leave.png`      | Employee/HR     | Leave request form, balance check, approval workflow         |
| 17| Performance Reviews                 | `docs/screenshots/17-performance.png`| Employee/HR     | Review timeline, rating display, goals and feedback          |
| 18| Employee Directory                  | `docs/screenshots/18-directory.png`  | HR/Admin        | Employee list with search, department filter, status badges  |
| 19| Reports & Export                    | `docs/screenshots/19-reports.png`    | HR/Admin        | Report types, CSV/JSON export, print-friendly layout         |
| 20| Audit Logs                          | `docs/screenshots/20-audit.png`      | Admin           | Action log with actor, entity, timestamp, IP, filters        |
| 21| Notifications Panel                 | `docs/screenshots/21-notifications.png`| All roles      | Notification list with unread badge, action links            |
| 22| Dark/Light Theme Toggle             | `docs/screenshots/22-theme.png`      | All roles       | Side-by-side dark and light theme comparison                 |
| 23| Mobile Responsive View              | `docs/screenshots/23-mobile.png`     | All roles       | Mobile layout of key screens, hamburger menu                 |
| 24| Forgot/Reset Password               | `docs/screenshots/24-reset.png`      | Public          | Forgot password form, dev-mode token display                 |

### 2.2 How to Capture Screenshots

\`\`\`powershell
# 1. Start the dev server
bun run dev

# 2. Open http://localhost:7000 in browser

# 3. Login as each demo user and capture relevant screens:
#    - Admin:     admin@hiresphere.ai / Password@123
#    - HR:        hr@hiresphere.ai / Password@123
#    - Candidate: priya.nair@example.com / Password@123
#    - Employee:  aarav.sharma@example.com / Password@123

# 4. Save screenshots to docs/screenshots/ folder
\`\`\`

### 2.3 Key UI Design Elements Visible in Screenshots

| Design Element            | Implementation                                           |
|---------------------------|-----------------------------------------------------------|
| **Color Palette**         | Dark navy/indigo/violet base + cyan/teal accents          |
| **Glassmorphism**         | Frosted glass effect on cards and modals                  |
| **3D Hero**               | Three.js via @react-three/fiber (lazy-loaded, SSR-safe)  |
| **Micro-animations**      | Framer Motion page transitions, hover effects, skeletons |
| **Charts**                | Recharts — funnel, trends, department donut, attendance   |
| **Component Library**     | shadcn/ui (New York variant) + Radix UI primitives       |
| **Icons**                 | Lucide React                                              |
| **Typography**            | System font stack via Tailwind CSS 4                      |
| **Responsive Breakpoints**| Mobile-first, 640px / 768px / 1024px / 1280px            |

---

## 3. Training / Prerequisites

### 3.1 System Requirements

| Requirement          | Minimum                        | Recommended                       |
|----------------------|--------------------------------|-----------------------------------|
| **Operating System** | Windows 10 / macOS 12 / Ubuntu 20.04 | Windows 11 / macOS 14 / Ubuntu 22.04 |
| **Node.js**          | v18.17.0+                      | v20.x LTS or v22.x               |
| **Package Manager**  | npm 9+ / pnpm 8+ / Bun 1.0+   | Bun 1.1+ (fastest)               |
| **RAM**              | 4 GB                           | 8 GB                             |
| **Disk Space**       | 500 MB (with node_modules)     | 1 GB                             |
| **Browser**          | Chrome 90+ / Firefox 90+ / Edge 90+ | Latest Chrome / Edge             |
| **Git**              | 2.30+                          | Latest                            |

### 3.2 Technology Prerequisites (Knowledge)

Students or developers working with this project should be familiar with the following technologies:

#### Core Technologies

| Technology       | Version Used | What to Learn                                            | Learning Resource                                          |
|------------------|-------------|-----------------------------------------------------------|------------------------------------------------------------|
| **TypeScript**   | 5.x         | Types, interfaces, generics, enums, async/await           | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) |
| **React**        | 19.x        | Components, hooks, state management, context, effects     | [React.dev](https://react.dev/learn)                       |
| **Next.js**      | 16.x        | App Router, Route Handlers, file-based API, SSR basics    | [Next.js Docs](https://nextjs.org/docs)                    |
| **HTML/CSS**     | HTML5/CSS3  | Semantic HTML, Flexbox, Grid, responsive design           | [MDN Web Docs](https://developer.mozilla.org/en-US/)       |
| **JavaScript**   | ES2022+     | Promises, fetch API, destructuring, modules               | [javascript.info](https://javascript.info/)                |

#### Database & Backend

| Technology       | Version Used | What to Learn                                            | Learning Resource                                          |
|------------------|-------------|-----------------------------------------------------------|------------------------------------------------------------|
| **Prisma ORM**   | 6.x         | Schema definition, migrations, queries, relations         | [Prisma Docs](https://www.prisma.io/docs)                  |
| **SQLite**       | 3.x         | Basic SQL (SELECT, INSERT, JOIN, constraints)             | [SQLite Tutorial](https://www.sqlitetutorial.net/)         |
| **REST API**     | —           | HTTP methods, status codes, JSON, authentication          | [RESTful API Design](https://restfulapi.net/)              |
| **JWT Auth**     | —           | Token-based authentication, httpOnly cookies, RBAC        | [JWT.io Introduction](https://jwt.io/introduction)         |

#### AI/ML Concepts

| Concept                   | What to Learn                                         | Academic Reference                                        |
|---------------------------|-------------------------------------------------------|-----------------------------------------------------------|
| **TF-IDF**                | Term Frequency, Inverse Document Frequency, weighting | Manning, Raghavan & Schütze (2008) — Chapter 6            |
| **Cosine Similarity**     | Vector space model, dot product, L2 normalization     | Manning, Raghavan & Schütze (2008) — Chapter 6            |
| **Text Preprocessing**    | Tokenization, stopword removal, stemming              | Bird, Klein & Loper (2009) — NLTK Book                    |
| **NLP Basics**            | Bag-of-words, document vectors, text similarity       | Jurafsky & Martin (2024) — Speech & Language Processing   |

#### UI & Styling

| Technology        | Version Used | What to Learn                                          | Learning Resource                                     |
|-------------------|-------------|--------------------------------------------------------|-------------------------------------------------------|
| **Tailwind CSS**  | 4.x         | Utility-first CSS, responsive design, dark mode        | [Tailwind Docs](https://tailwindcss.com/docs)         |
| **shadcn/ui**     | Latest      | Component installation, theming, Radix primitives      | [shadcn/ui Docs](https://ui.shadcn.com)               |
| **Framer Motion** | 12.x        | Animation variants, transitions, gesture handling      | [Framer Motion Docs](https://www.framer.com/motion/)  |
| **Recharts**      | 2.x         | Bar, Line, Pie, Funnel charts with React               | [Recharts Docs](https://recharts.org/)                |
| **Three.js**      | 0.186       | 3D scenes, meshes, lights, camera (via React Three Fiber)| [R3F Docs](https://docs.pmnd.rs/react-three-fiber)  |

### 3.3 Installation Steps (Step-by-Step)

#### Step 1: Install Node.js

Download and install Node.js LTS from [nodejs.org](https://nodejs.org/). Verify installation:

\`\`\`powershell
node --version    # Should show v18.17.0 or higher
npm --version     # Should show 9.x or higher
\`\`\`

#### Step 2: Install Bun (Recommended, Optional)

\`\`\`powershell
# Windows (PowerShell)
irm bun.sh/install.ps1 | iex

# Verify
bun --version     # Should show 1.x
\`\`\`

> **Note:** npm or pnpm work as alternatives. Replace `bun` commands with `npm` equivalents.

#### Step 3: Clone the Repository

\`\`\`powershell
git clone <your-repo-url> hiresphere-ai
cd hiresphere-ai
\`\`\`

#### Step 4: Install Dependencies

\`\`\`powershell
# Using Bun (fastest)
bun install

# OR using npm
npm install
\`\`\`

This installs ~86 packages including:
- **Runtime:** next, react, react-dom, prisma, jose, bcryptjs, zod, unpdf, pdf-lib, three
- **UI:** tailwindcss, shadcn/ui (Radix primitives), framer-motion, recharts, lucide-react
- **Dev:** typescript, eslint, @types/*

#### Step 5: Configure Environment

\`\`\`powershell
# Copy the example environment file
Copy-Item .env.example .env
\`\`\`

Edit `.env` with the following variables:

| Variable          | Required | Default Value       | Description                                    |
|-------------------|----------|---------------------|------------------------------------------------|
| `DATABASE_URL`    | Yes      | `file:./db/custom.db` | SQLite database file path                     |
| `SESSION_SECRET`  | Prod     | Dev fallback        | 32+ char random string for JWT signing         |
| `AI_WEIGHT_TFIDF` | No       | `0.6`               | Weight of TF-IDF score in final AI score       |
| `AI_WEIGHT_SKILL` | No       | `0.4`               | Weight of skill-overlap score in final AI score|

#### Step 6: Initialize the Database

\`\`\`powershell
# Push the Prisma schema to create all tables
bun run db:push
\`\`\`

This creates 17+ tables with foreign keys, unique constraints, and indexes in the SQLite database file.

#### Step 7: Seed Demo Data

\`\`\`powershell
# Generate synthetic data and run the real AI pipeline
bun run src/scripts/seed.ts
\`\`\`

This step:
1. Creates 7 user accounts with hashed passwords
2. Generates 5 PDF resumes using pdf-lib
3. Extracts text from PDFs using unpdf
4. Runs TF-IDF + cosine similarity matching (genuine scores)
5. Creates jobs, applications, employees, attendance, leaves, reviews
6. Populates notifications and audit logs

Expected output:
\`\`\`
🌱 Seeding HireSphere AI development database…
  ✓ Departments created
  ✓ Users created (7)
  ✓ Resumes generated & parsed (5)
  ✓ Jobs created (4)
  ✓ Applications submitted with AI scoring
  ✓ Employee records created
  ✓ Attendance, leaves, reviews populated
  ✓ Notifications and audit logs generated
🌱 Seed complete!
\`\`\`

#### Step 8: Start the Development Server

\`\`\`powershell
bun run dev
# → Server starts at http://localhost:7000
\`\`\`

#### Step 9: Access the Application

Open `http://localhost:7000` in your browser. Login with any demo account:

| Role      | Email                        | Password        |
|-----------|------------------------------|-----------------|
| Admin     | `admin@hiresphere.ai`        | `Password@123`  |
| HR        | `hr@hiresphere.ai`           | `Password@123`  |
| Candidate | `priya.nair@example.com`     | `Password@123`  |
| Employee  | `aarav.sharma@example.com`   | `Password@123`  |

### 3.4 Training the AI Model

> **Important:** HireSphere AI does **not** use a pre-trained neural network or external ML model. The AI engine is a **rule-based NLP pipeline** using classical information retrieval techniques. There is no model training phase.

#### How the AI Engine Works (No Training Required)

\`\`\`
┌─────────────────────────────────────────────────────┐
│              AI Pipeline (Per Application)           │
│                                                     │
│  1. PDF Upload → Validate (magic bytes, ≤5MB,       │
│     ≤20 pages)                                      │
│                                                     │
│  2. Text Extraction → unpdf (pdf.js serverless)     │
│                                                     │
│  3. Preprocessing → Normalize → Tokenize            │
│     (stopword removal, light stemming)              │
│                                                     │
│  4. TF-IDF Vectorization                            │
│     • tf(t,d) = count(t,d)                          │
│     • idf(t) = ln((1+N)/(1+df(t))) + 1   [smooth]  │
│     • weight = tf × idf                             │
│     • vector = weight / ||weight||₂       [L2 norm] │
│                                                     │
│  5. Cosine Similarity = dot(job_vec, resume_vec)    │
│     → tfidfScore ∈ [0, 1]                           │
│                                                     │
│  6. Skill Dictionary Scan                           │
│     • 200+ skills with aliases                      │
│     • Evidence: exact resume sentence per match     │
│     → skillScore = matched / total_required         │
│                                                     │
│  7. Final Score = 0.6 × tfidfScore + 0.4 ×          │
│     skillScore                                      │
│                                                     │
│  8. Store: scores + weights + evidence + version    │
└─────────────────────────────────────────────────────┘
\`\`\`

#### Algorithm Location in Codebase

| File                              | Responsibility                                          |
|-----------------------------------|---------------------------------------------------------|
| `src/lib/ai/text-preprocessing.ts`| Text normalization, tokenization, stopword removal, light stemming, section extraction |
| `src/lib/ai/tfidf.ts`            | TF-IDF vectorizer (smooth IDF, L2 normalization), cosine similarity, top shared terms |
| `src/lib/ai/skill-dictionary.ts`  | 200+ skill definitions with aliases and category mappings |
| `src/lib/ai/resume-matcher.ts`    | Full matching pipeline: TF-IDF + skill overlap + explainable scoring |
| `src/lib/ai/pdf-parser.ts`       | PDF text extraction using unpdf, magic byte validation   |
| `src/lib/ai/analyze-service.ts`  | API service layer: orchestrates the full analysis flow    |

### 3.5 Docker Deployment (Optional)

\`\`\`powershell
# Build and run with Docker Compose
docker-compose up --build

# OR build individually
docker build -t hiresphere-ai .
docker run -p 7000:7000 hiresphere-ai
\`\`\`

### 3.6 Troubleshooting Common Issues

| Issue                                    | Solution                                                    |
|------------------------------------------|-------------------------------------------------------------|
| `prisma generate` fails                 | Run `bun run db:generate` manually                          |
| Port 7000 already in use                | Kill the process or change port in `package.json`           |
| Seed script errors                       | Ensure `bun run db:push` completed first                    |
| PDF upload fails                        | Check `uploads/resumes/` directory exists and is writable   |
| "Module not found" errors               | Delete `node_modules` and reinstall: `bun install`          |
| SQLite locked errors                    | Ensure no other process has the `.db` file open             |

---

## 4. References

### 4.1 Academic References (AI & NLP)

1. **Manning, C. D., Raghavan, P., & Schütze, H.** (2008). *Introduction to Information Retrieval*. Cambridge University Press. — Chapter 6: Scoring, Term Weighting and the Vector Space Model.
   - Foundation for TF-IDF vectorization and cosine similarity used in the resume matching engine.

2. **Salton, G., & Buckley, C.** (1988). "Term-weighting approaches in automatic text retrieval." *Information Processing & Management*, 24(5), 513–523.
   - Seminal paper on term weighting schemes including TF-IDF.

3. **Salton, G., Wong, A., & Yang, C. S.** (1975). "A vector space model for automatic indexing." *Communications of the ACM*, 18(11), 613–620.
   - Original vector space model for document comparison via cosine similarity.

4. **Bird, S., Klein, E., & Loper, E.** (2009). *Natural Language Processing with Python*. O'Reilly Media.
   - Text preprocessing techniques: tokenization, stopword removal, stemming.

5. **Jurafsky, D., & Martin, J. H.** (2024). *Speech and Language Processing* (3rd ed. draft). Stanford University.
   - Comprehensive NLP reference for text classification and information extraction.

6. **Pedregosa, F., et al.** (2011). "Scikit-learn: Machine Learning in Python." *Journal of Machine Learning Research*, 12, 2825–2830.
   - Reference implementation for TfidfVectorizer that the TypeScript implementation mirrors.

7. **Singhal, A.** (2001). "Modern Information Retrieval: A Brief Overview." *IEEE Data Engineering Bulletin*, 24(4), 35–43.
   - Survey covering vector space models, TF-IDF, and document similarity.

### 4.2 Technology References

8. **Vercel Inc.** (2024). *Next.js Documentation*. https://nextjs.org/docs
   - Framework for server-side rendering, App Router, and API Route Handlers.

9. **Meta Platforms Inc.** (2024). *React Documentation*. https://react.dev
   - Component-based UI library used for the entire frontend.

10. **Microsoft.** (2024). *TypeScript Handbook*. https://www.typescriptlang.org/docs/handbook/
    - Typed superset of JavaScript used throughout the project.

11. **Prisma Data Inc.** (2024). *Prisma ORM Documentation*. https://www.prisma.io/docs
    - Object-Relational Mapping for database schema definition and queries.

12. **SQLite Consortium.** (2024). *SQLite Documentation*. https://www.sqlite.org/docs.html
    - Embedded relational database engine used in development.

13. **Oracle Corporation.** (2024). *MySQL Reference Manual*. https://dev.mysql.com/doc/
    - Target production database (schema is MySQL-portable).

### 4.3 UI & Design References

14. **Tailwind Labs.** (2024). *Tailwind CSS Documentation*. https://tailwindcss.com/docs
    - Utility-first CSS framework for responsive design and theming.

15. **shadcn.** (2024). *shadcn/ui Components*. https://ui.shadcn.com
    - Accessible, composable React component library built on Radix UI.

16. **Radix UI.** (2024). *Radix Primitives Documentation*. https://www.radix-ui.com/primitives/docs
    - Unstyled, accessible UI component primitives.

17. **Framer B.V.** (2024). *Framer Motion Documentation*. https://www.framer.com/motion/
    - React animation library for micro-interactions and page transitions.

18. **Three.js Contributors.** (2024). *Three.js Documentation*. https://threejs.org/docs/
    - 3D rendering library for the animated landing page hero.

19. **pmndrs.** (2024). *React Three Fiber Documentation*. https://docs.pmnd.rs/react-three-fiber
    - React renderer for Three.js used for declarative 3D scenes.

20. **Recharts Contributors.** (2024). *Recharts Documentation*. https://recharts.org/
    - Composable React charting library for dashboards and analytics.

### 4.4 Security & Authentication References

21. **Jones, M., Bradley, J., & Sakimura, N.** (2015). *RFC 7519: JSON Web Token (JWT)*. IETF.
    - Standard for secure token-based authentication used in session management.

22. **Provos, N., & Mazières, D.** (1999). "A Future-Adaptable Password Scheme." *Proceedings of USENIX Annual Technical Conference*.
    - bcrypt password hashing algorithm used for credential storage.

23. **OWASP Foundation.** (2024). *OWASP Top Ten*. https://owasp.org/www-project-top-ten/
    - Security best practices applied: input validation, auth checks, audit logging.

### 4.5 Tools & Libraries

24. **Collet, T.** (2024). *Zod: TypeScript-first Schema Validation*. https://zod.dev
    - Runtime validation library used for API request/response validation.

25. **unpdf Contributors.** (2024). *unpdf: Serverless PDF Text Extraction*. https://github.com/nicolo-ribaudo/unpdf
    - PDF text extraction using pdf.js in a serverless-compatible build.

26. **pdf-lib Contributors.** (2024). *pdf-lib: Create and Modify PDFs*. https://pdf-lib.js.org/
    - Used to generate synthetic PDF resumes for the demo dataset.

27. **panva.** (2024). *jose: JavaScript Object Signing and Encryption*. https://github.com/panva/jose
    - JWT implementation for session tokens (HS256 algorithm).

28. **pmndrs.** (2024). *Zustand: Bear-bones State Management*. https://zustand-demo.pmnd.rs/
    - Lightweight React state management for client-side stores.

### 4.6 Methodology & Design References

29. **Fielding, R. T.** (2000). *Architectural Styles and the Design of Network-based Software Architectures*. Doctoral dissertation, University of California, Irvine.
    - REST architectural style applied to all API endpoints.

30. **Fowler, M.** (2002). *Patterns of Enterprise Application Architecture*. Addison-Wesley.
    - Repository pattern, service layer, and audit trail design.

31. **WCAG 2.1.** (2018). *Web Content Accessibility Guidelines*. W3C Recommendation.
    - Accessibility considerations applied to UI components (semantic HTML, ARIA labels, keyboard navigation).

---

*This project report was prepared for the BCA Final Year Project submission.*
*All data is synthetic. No real personal information is used.*
*Project: HireSphere AI — AI-Powered Recruitment & Employee Management System*
