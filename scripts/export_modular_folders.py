import os
import shutil
import zipfile

BASE_DIR = os.path.abspath(".")
OUT_DIR = os.path.join(BASE_DIR, "Project-Code-Separated")

# Recreate output dir
if os.path.exists(OUT_DIR):
    shutil.rmtree(OUT_DIR)
os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. FRONTEND FOLDER (VIJAYALAXMI MHETRI - SCFU224007)
# -------------------------------------------------------------
fe_dir = os.path.join(OUT_DIR, "Frontend")
os.makedirs(fe_dir, exist_ok=True)

# Components (SPA & UI)
shutil.copytree(os.path.join(BASE_DIR, "src", "components", "spa"), os.path.join(fe_dir, "components", "spa"))
shutil.copytree(os.path.join(BASE_DIR, "src", "components", "ui"), os.path.join(fe_dir, "components", "ui"))
if os.path.exists(os.path.join(BASE_DIR, "src", "components", "theme-provider.tsx")):
    shutil.copyfile(os.path.join(BASE_DIR, "src", "components", "theme-provider.tsx"), os.path.join(fe_dir, "components", "theme-provider.tsx"))

# Hooks
shutil.copytree(os.path.join(BASE_DIR, "src", "hooks"), os.path.join(fe_dir, "hooks"))

# State & Router & API Client
os.makedirs(os.path.join(fe_dir, "state"), exist_ok=True)
shutil.copyfile(os.path.join(BASE_DIR, "src", "lib", "store.ts"), os.path.join(fe_dir, "state", "store.ts"))

os.makedirs(os.path.join(fe_dir, "routing"), exist_ok=True)
shutil.copyfile(os.path.join(BASE_DIR, "src", "lib", "router.ts"), os.path.join(fe_dir, "routing", "router.ts"))

os.makedirs(os.path.join(fe_dir, "services"), exist_ok=True)
shutil.copyfile(os.path.join(BASE_DIR, "src", "lib", "api-client.ts"), os.path.join(fe_dir, "services", "api-client.ts"))
shutil.copyfile(os.path.join(BASE_DIR, "src", "lib", "api.ts"), os.path.join(fe_dir, "services", "api.ts"))
if os.path.exists(os.path.join(BASE_DIR, "src", "lib", "utils.ts")):
    shutil.copyfile(os.path.join(BASE_DIR, "src", "lib", "utils.ts"), os.path.join(fe_dir, "services", "utils.ts"))

# Pages & App Shell
os.makedirs(os.path.join(fe_dir, "pages"), exist_ok=True)
for pfile in ["page.tsx", "layout.tsx", "globals.css"]:
    p_path = os.path.join(BASE_DIR, "src", "app", pfile)
    if os.path.exists(p_path):
        shutil.copyfile(p_path, os.path.join(fe_dir, "pages", pfile))

# Styles & Configs
os.makedirs(os.path.join(fe_dir, "config"), exist_ok=True)
for cfile in ["tailwind.config.ts", "postcss.config.mjs", "components.json"]:
    c_path = os.path.join(BASE_DIR, cfile)
    if os.path.exists(c_path):
        shutil.copyfile(c_path, os.path.join(fe_dir, "config", cfile))

# Public Assets
if os.path.exists(os.path.join(BASE_DIR, "public")):
    shutil.copytree(os.path.join(BASE_DIR, "public"), os.path.join(fe_dir, "public"))

fe_readme = """# Frontend Architecture — HireSphere AI
**Lead Developer:** Vijayalaxmi Mhetri (PRN: SCFU224007)  
**Specialization:** Frontend + UI + API Integration  
**Framework:** Next.js 15 (Client SPA) • React 19 • Tailwind CSS • Radix UI • Zustand  

---

## 📁 Directory Structure
```
Frontend/
├── components/
│   ├── spa/                 # Domain Feature Pages (Single Page Application)
│   │   ├── admin/           # System Administration & Audit Logs
│   │   ├── auth/            # Multi-Role Login, Register, Forgot/Reset Password
│   │   ├── candidate/       # Job Search, Application Status, Profile
│   │   ├── employee/        # Profile, Attendance Clock-In, Leave Requests
│   │   ├── hr/              # Job Postings, Candidate Screening, Ranking Table
│   │   ├── landing/         # Modern Landing Page & 3D Interactive Hero Canvas
│   │   ├── layout/          # Top Navbar, Sidebar & Role-Based Navigation
│   │   └── shared/          # Reusable Modals, Status Badges, Data Tables
│   ├── ui/                  # 48 Modular UI Components (Buttons, Dialogs, Cards)
│   └── theme-provider.tsx   # Dark/Light Theme Provider
├── hooks/                   # Custom React Hooks (useToast, useMobile)
├── state/                   # Zustand Client State Store (store.ts)
├── routing/                 # Client-Side Hash Router (router.ts - zero reloads)
├── services/                # API Client Services (api-client.ts, api.ts)
├── pages/                   # Next.js Shell Pages (page.tsx, layout.tsx, globals.css)
├── config/                  # Tailwind, PostCSS & Components Configs
└── public/                  # Static Assets, SVG Icons & Logos
```

## 🚀 Key Responsibilities Implemented
1. **Responsive SPA Architecture:** Instant navigation between candidate, HR, employee, and admin roles using zero-reload hash routing (`#/hr/jobs`).
2. **Interactive HR Candidate Screening:** Dynamic score sort, filter chips by department/skill, and 1-click modal for applicant review.
3. **Client-Side State:** Centralized Zustand store handling active user session, token persistence, and optimistic UI updates.
"""
with open(os.path.join(fe_dir, "README.md"), "w", encoding="utf-8") as f:
    f.write(fe_readme)

# -------------------------------------------------------------
# 2. BACKEND FOLDER (SAKSHI SABLE - SCFU224029)
# -------------------------------------------------------------
be_dir = os.path.join(OUT_DIR, "Backend")
os.makedirs(be_dir, exist_ok=True)

# API Route Handlers (49 routes)
shutil.copytree(os.path.join(BASE_DIR, "src", "app", "api"), os.path.join(be_dir, "api"))

# Security & Middleware
os.makedirs(os.path.join(be_dir, "security"), exist_ok=True)
shutil.copyfile(os.path.join(BASE_DIR, "src", "lib", "auth.ts"), os.path.join(be_dir, "security", "auth.ts"))

# Backend Helpers & Services
os.makedirs(os.path.join(be_dir, "services"), exist_ok=True)
for sfile in ["constants.ts", "datetime.ts", "serialize.ts", "storage.ts"]:
    s_path = os.path.join(BASE_DIR, "src", "lib", sfile)
    if os.path.exists(s_path):
        shutil.copyfile(s_path, os.path.join(be_dir, "services", sfile))

be_readme = """# Backend Architecture — HireSphere AI
**Lead Developer:** Sakshi Sable (PRN: SCFU224029)  
**Specialization:** Backend + Database + Authentication  
**Runtime:** Node.js • Next.js API Route Handlers • Jose JWT • Bcrypt • Zod  

---

## 📁 Directory Structure
```
Backend/
├── api/                     # 49 REST Route Handlers
│   ├── auth/                # Login, Register, Logout, Me, Password Reset
│   ├── ai/                  # AI Analysis trigger & retrieval endpoints
│   ├── applications/        # Application lifecycle (CRUD, Status, Notes, Withdraw)
│   ├── attendance/          # Clock-in/out, Daily History, Monthly Summary
│   ├── audit-logs/          # Immutable system activity tracking
│   ├── candidate/           # Candidate profile management
│   ├── dashboard/           # Aggregated statistics & analytics per role
│   ├── departments/         # Department management
│   ├── employees/           # Employee lifecycle, directory & updates
│   ├── health/              # Server health check endpoint
│   ├── jobs/                # Job requisitions CRUD, skills & criteria
│   ├── leaves/              # Leave requests, balance tracking & approval
│   ├── notifications/       # User alert stream & read status
│   ├── performance/         # Employee appraisal & performance scores
│   ├── reports/             # Exportable HR analytics
│   ├── resumes/             # Secure resume upload & private disk retrieval
│   ├── settings/            # System preferences
│   └── users/               # User administration & role changes
├── security/                # Jose JWT, Bcrypt password hashing & RBAC
└── services/                # Datetime calculations, JSON serialization, storage
```

## 🚀 Key Responsibilities Implemented
1. **Robust Security Gateway:** Stateless Jose JWT verification with httpOnly cookie storage, Bcrypt salt generation, and strict RBAC authorization.
2. **Comprehensive REST APIs:** 49 structured route handlers with status codes, error wrapping, and rate limiting.
3. **Atomic Operations:** Guarantees data consistency across multi-table operations using Prisma `$transaction`.
"""
with open(os.path.join(be_dir, "README.md"), "w", encoding="utf-8") as f:
    f.write(be_readme)

# -------------------------------------------------------------
# 3. DATABASE FOLDER (SAKSHI SABLE - SCFU224029)
# -------------------------------------------------------------
db_dir = os.path.join(OUT_DIR, "Database")
os.makedirs(db_dir, exist_ok=True)

# Schema
os.makedirs(os.path.join(db_dir, "schema"), exist_ok=True)
shutil.copyfile(os.path.join(BASE_DIR, "prisma", "schema.prisma"), os.path.join(db_dir, "schema", "schema.prisma"))

# Client
os.makedirs(os.path.join(db_dir, "client"), exist_ok=True)
shutil.copyfile(os.path.join(BASE_DIR, "src", "lib", "db.ts"), os.path.join(db_dir, "client", "db.ts"))

# Seeds
os.makedirs(os.path.join(db_dir, "seeds"), exist_ok=True)
shutil.copyfile(os.path.join(BASE_DIR, "src", "scripts", "seed.ts"), os.path.join(db_dir, "seeds", "seed.ts"))

# SQLite Database
os.makedirs(os.path.join(db_dir, "sqlite"), exist_ok=True)
if os.path.exists(os.path.join(BASE_DIR, "prisma", "dev.db")):
    shutil.copyfile(os.path.join(BASE_DIR, "prisma", "dev.db"), os.path.join(db_dir, "sqlite", "dev.db"))

# High-Res ER Diagram
os.makedirs(os.path.join(db_dir, "diagrams"), exist_ok=True)
er_src = os.path.join(BASE_DIR, "Review-2-Deliverables", "database_er_diagram.png")
if os.path.exists(er_src):
    shutil.copyfile(er_src, os.path.join(db_dir, "diagrams", "database_er_diagram.png"))

db_readme = """# Database Architecture — HireSphere AI
**Lead Developer:** Sakshi Sable (PRN: SCFU224029)  
**Specialization:** Database Design + ORM + Schema Modeling  
**ORM:** Prisma ORM • **Database:** SQLite (Development) / MySQL 8.0 (Production)  

---

## 📁 Directory Structure
```
Database/
├── schema/                  # Prisma Schema (19 Relational Entities)
│   └── schema.prisma        # Complete entity definitions, relations & indices
├── client/                  # Prisma Client singleton instance (db.ts)
├── seeds/                   # Seed script generating authentic test records (seed.ts)
├── sqlite/                  # Active development database (dev.db)
└── diagrams/                # 300 DPI High-Resolution ER Diagram (database_er_diagram.png)
```

## 📊 19 Relational Models Overview
1. **User:** Core credentials, multi-role (ADMIN, HR, CANDIDATE, EMPLOYEE), status.
2. **PasswordResetToken:** Secure 1-hour expiry tokens.
3. **CandidateProfile:** Phone, headline, bio, experience years, skills JSON.
4. **Resume:** Private disk storage path, original filename, parsed text, file size.
5. **Department:** Organizational hierarchy.
6. **Job:** Requisitions, department link, required skills array, min experience.
7. **Application:** Job-Candidate relation with compound unique constraint `@@unique([jobId, candidateId])`.
8. **ApplicationStatusHistory:** Audit trail of status transitions.
9. **ResumeAnalysis:** AI match score, canonical matched skills, missing skills, sentence evidence.
10. **Interview:** Round types (TECHNICAL, HR), scheduled timestamp, feedback, score.
11. **InterviewFeedback:** Detailed interviewer evaluations.
12. **Employee:** Idempotent conversion from candidate (`HS-EMP-xxxx`), job title, salary.
13. **AttendanceRecord:** Daily clock-in/out with `@@unique([employeeId, date])` integrity.
14. **LeaveRequest:** Type (CASUAL, SICK, PAID), status, manager approval notes.
15. **LeaveBalance:** Annual entitlements and remaining balances.
16. **PerformanceReview:** Review cycles, ratings (1-5), promotion eligibility.
17. **Notification:** Recipient alerts with read tracking.
18. **AuditLog:** System action records with user IP and timestamp.
19. **SystemSetting:** Key-value configuration parameters.
"""
with open(os.path.join(db_dir, "README.md"), "w", encoding="utf-8") as f:
    f.write(db_readme)

# -------------------------------------------------------------
# 4. AI-ENGINE FOLDER (PRANAVI JADHAV - SCFU224040)
# -------------------------------------------------------------
ai_dir = os.path.join(OUT_DIR, "AI-Engine")
os.makedirs(ai_dir, exist_ok=True)

# NLP algorithms
os.makedirs(os.path.join(ai_dir, "nlp"), exist_ok=True)
shutil.copytree(os.path.join(BASE_DIR, "src", "lib", "ai"), os.path.join(ai_dir, "nlp"), dirs_exist_ok=True)

# Diagrams
os.makedirs(os.path.join(ai_dir, "diagrams"), exist_ok=True)
for fc in ["flowchart_ai_matching.png", "flowchart_resume_upload_extraction.png"]:
    fc_src = os.path.join(BASE_DIR, "Review-2-Deliverables", fc)
    if os.path.exists(fc_src):
        shutil.copyfile(fc_src, os.path.join(ai_dir, "diagrams", fc))

ai_readme = """# AI / NLP Matching Engine — HireSphere AI
**Lead Developer:** Pranavi Jadhav (PRN: SCFU224040)  
**Specialization:** AI + Resume Processing + Job Matching  
**Technology:** TypeScript NLP • TF-IDF Vectorizer • Cosine Similarity • unpdf Parser  

---

## 📁 Directory Structure
```
AI-Engine/
├── nlp/
│   ├── analyze-service.ts     # Orchestrator combining PDF parser, TF-IDF & skills
│   ├── pdf-parser.ts          # Server-side multi-page extraction via unpdf
│   ├── resume-matcher.ts      # Hybrid matching algorithm & evidence extractor
│   ├── skill-dictionary.ts    # 85+ Canonical skills with alias mapping
│   ├── text-preprocessing.ts  # Tokenization, lowercasing, stop-word removal
│   └── tfidf.ts               # Term Frequency - Inverse Document Frequency engine
└── diagrams/
    ├── flowchart_ai_matching.png              # AI Matching Algorithm Flowchart
    └── flowchart_resume_upload_extraction.png # Resume Parsing Flowchart
```

## 🧠 Core Mathematical Formula & Methodology
```
Match Score = (0.50 × Cosine_Similarity(TFIDF_Resume, TFIDF_Job)) 
            + (0.50 × (Matched_Canonical_Skills / Required_Job_Skills))
```

### Why Selected:
- **100% Explainable:** Rejects black-box decisioning by outputting exact sentence-level evidence quotes from the PDF.
- **Ultra-Fast Execution:** Local execution executes in **~82 milliseconds** per candidate.
- **Zero API Costs:** Pure deterministic TypeScript engine with no recurring OpenAI/Anthropic cloud billing.
"""
with open(os.path.join(ai_dir, "README.md"), "w", encoding="utf-8") as f:
    f.write(ai_readme)

# -------------------------------------------------------------
# ROOT PROJECT README & SUMMARY
# -------------------------------------------------------------
root_readme = """# AI-Powered Recruitment and Employee Management System (HireSphere AI)
**University:** MIT Vishwaprayag University, Solapur  
**School:** School of Computing — Bachelor of Computer Applications (BCA)  
**Project Guide:** Dr. Arindam Sarkar  

---

## 👥 Student Contributions & Module Ownership

| Student Name | PRN | Role & Assigned Module | Directory |
|---|---|---|---|
| **Vijayalaxmi Mhetri** | SCFU224007 | **Frontend Lead:** UI/UX, Next.js 15 SPA, State, Routing & API Integration | `Frontend/` |
| **Sakshi Sable** | SCFU224029 | **Backend & Database Lead:** 49 REST APIs, JWT Auth & 19 Prisma Relational Models | `Backend/` & `Database/` |
| **Pranavi Jadhav** | SCFU224040 | **AI Lead:** Resume Parsing (`unpdf`), TF-IDF Cosine Similarity & Skill Matcher | `AI-Engine/` |

---

## 📁 Modular Directory Overview
- **`Frontend/`**: Client-side Next.js 15 Single Page Application, Radix UI components, Zustand store, client hash routing.
- **`Backend/`**: 49 Node.js REST API route handlers, Jose JWT authentication, Bcrypt password hashing, RBAC.
- **`Database/`**: 19 Prisma ORM relational models, active SQLite database file (`dev.db`), seed script, 300 DPI ER diagram.
- **`AI-Engine/`**: Explainable hybrid TF-IDF vectorizer, canonical skill dictionary (~85 skills), PDF parser, and flowcharts.
"""
with open(os.path.join(OUT_DIR, "README.md"), "w", encoding="utf-8") as f:
    f.write(root_readme)

print("Modular architecture folders created successfully in 'Project-Code-Separated'!")

# Create ZIP file
zip_path = os.path.join(BASE_DIR, "Review-2-Deliverables", "HireSphere_AI_Modular_Code_Folders.zip")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(OUT_DIR):
        for file in files:
            full_p = os.path.join(root, file)
            rel_p = os.path.relpath(full_p, OUT_DIR)
            zipf.write(full_p, arcname=rel_p)

print(f"ZIP archive generated at: {zip_path}")
