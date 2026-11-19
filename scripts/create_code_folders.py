import os
import shutil
import zipfile

BASE_DIR = os.path.abspath(".")
DOWNLOADS_DIR = r"C:\Users\JADHAV\Downloads"

# =========================================================================
# 1. STANDALONE BACKEND FOLDER (BACKEND-CODE)
# =========================================================================
be_target = os.path.join(BASE_DIR, "Review-2-Deliverables", "Backend-Code")
if os.path.exists(be_target):
    shutil.rmtree(be_target)
os.makedirs(be_target, exist_ok=True)

# Copy all API routes (50 routes)
shutil.copytree(os.path.join(BASE_DIR, "src", "app", "api"), os.path.join(be_target, "api"))

# Copy Core Libraries (lib)
os.makedirs(os.path.join(be_target, "lib"), exist_ok=True)
for lib_f in ["auth.ts", "api.ts", "db.ts", "constants.ts", "datetime.ts", "serialize.ts", "storage.ts"]:
    src_f = os.path.join(BASE_DIR, "src", "lib", lib_f)
    if os.path.exists(src_f):
        shutil.copyfile(src_f, os.path.join(be_target, "lib", lib_f))

# Copy AI Engine inside Backend
shutil.copytree(os.path.join(BASE_DIR, "src", "lib", "ai"), os.path.join(be_target, "lib", "ai"))

# Copy Prisma Database
os.makedirs(os.path.join(be_target, "prisma"), exist_ok=True)
for p_f in ["schema.prisma", "dev.db"]:
    src_p = os.path.join(BASE_DIR, "prisma", p_f)
    if os.path.exists(src_p):
        shutil.copyfile(src_p, os.path.join(be_target, "prisma", p_f))

# Copy Seed script
os.makedirs(os.path.join(be_target, "scripts"), exist_ok=True)
shutil.copyfile(os.path.join(BASE_DIR, "src", "scripts", "seed.ts"), os.path.join(be_target, "scripts", "seed.ts"))

# Copy configs
for cfg in ["package.json", "tsconfig.json", ".env"]:
    src_c = os.path.join(BASE_DIR, cfg)
    if os.path.exists(src_c):
        shutil.copyfile(src_c, os.path.join(be_target, cfg))

be_guide = """# HireSphere AI — Backend Codebase
**Lead Developer:** Sakshi Sable (PRN: SCFU224029)  
**AI NLP Lead:** Pranavi Jadhav (PRN: SCFU224040)  
**Project Guide:** Dr. Arindam Sarkar  
**University:** MIT Vishwaprayag University, Solapur  

---

## 📁 Backend Directory Structure
```
Backend-Code/
├── api/                     # 50 REST Route Handlers (.ts files)
│   ├── auth/                # Login, Register, Logout, Me, Password Reset
│   ├── ai/                  # AI matching & analysis endpoints
│   ├── applications/        # Application lifecycle (CRUD, Status, Withdraw)
│   ├── attendance/          # Clock-in, history, monthly summary
│   ├── audit-logs/          # Immutable system logs
│   ├── candidate/           # Candidate profile APIs
│   ├── dashboard/           # HR, Employee & Candidate stats
│   ├── departments/         # Department management
│   ├── employees/           # Employee lifecycle & directory
│   ├── health/              # Server health check
│   ├── jobs/                # Job requisitions CRUD
│   ├── leaves/              # Leave requests & approvals
│   ├── notifications/       # User alert stream
│   ├── performance/         # Appraisal ratings
│   ├── reports/             # Exportable analytics
│   ├── resumes/             # Secure resume upload & retrieval
│   ├── settings/            # System preferences
│   └── users/               # User administration
├── lib/                     # Backend Utilities & Security (.ts files)
│   ├── auth.ts              # Jose JWT & Bcrypt password hashing
│   ├── api.ts               # Standard API Envelope, RBAC, Rate Limiting
│   ├── db.ts                # Prisma Client Singleton
│   ├── constants.ts         # System roles, statuses & thresholds
│   ├── datetime.ts          # Timezone & date utilities
│   ├── serialize.ts         # Safe JSON serialization
│   ├── storage.ts           # Private PDF file disk storage
│   └── ai/                  # AI / NLP Matching Engine (.ts files)
│       ├── analyze-service.ts
│       ├── pdf-parser.ts
│       ├── resume-matcher.ts
│       ├── skill-dictionary.ts
│       ├── text-preprocessing.ts
│       └── tfidf.ts
├── prisma/
│   ├── schema.prisma        # 19 Relational Entities Schema
│   └── dev.db               # SQLite database file
├── scripts/
│   └── seed.ts              # Database mock seed script
├── package.json
├── tsconfig.json
└── .env
```
"""
with open(os.path.join(be_target, "README.md"), "w", encoding="utf-8") as f:
    f.write(be_guide)

# =========================================================================
# 2. STANDALONE FRONTEND FOLDER (FRONTEND-CODE)
# =========================================================================
fe_target = os.path.join(BASE_DIR, "Review-2-Deliverables", "Frontend-Code")
if os.path.exists(fe_target):
    shutil.rmtree(fe_target)
os.makedirs(fe_target, exist_ok=True)

shutil.copytree(os.path.join(BASE_DIR, "src", "components"), os.path.join(fe_target, "components"))
shutil.copytree(os.path.join(BASE_DIR, "src", "hooks"), os.path.join(fe_target, "hooks"))
if os.path.exists(os.path.join(BASE_DIR, "public")):
    shutil.copytree(os.path.join(BASE_DIR, "public"), os.path.join(fe_target, "public"))

os.makedirs(os.path.join(fe_target, "pages"), exist_ok=True)
for pfile in ["page.tsx", "layout.tsx", "globals.css"]:
    p_path = os.path.join(BASE_DIR, "src", "app", pfile)
    if os.path.exists(p_path):
        shutil.copyfile(p_path, os.path.join(fe_target, "pages", pfile))

os.makedirs(os.path.join(fe_target, "lib"), exist_ok=True)
for lfile in ["store.ts", "router.ts", "api-client.ts", "api.ts", "utils.ts"]:
    l_path = os.path.join(BASE_DIR, "src", "lib", lfile)
    if os.path.exists(l_path):
        shutil.copyfile(l_path, os.path.join(fe_target, "lib", lfile))

for cfg in ["package.json", "tsconfig.json", "tailwind.config.ts", "postcss.config.mjs", "components.json"]:
    src_c = os.path.join(BASE_DIR, cfg)
    if os.path.exists(src_c):
        shutil.copyfile(src_c, os.path.join(fe_target, cfg))

# =========================================================================
# 3. STANDALONE DATABASE FOLDER (DATABASE-CODE)
# =========================================================================
db_target = os.path.join(BASE_DIR, "Review-2-Deliverables", "Database-Code")
if os.path.exists(db_target):
    shutil.rmtree(db_target)
os.makedirs(db_target, exist_ok=True)

shutil.copyfile(os.path.join(BASE_DIR, "prisma", "schema.prisma"), os.path.join(db_target, "schema.prisma"))
if os.path.exists(os.path.join(BASE_DIR, "prisma", "dev.db")):
    shutil.copyfile(os.path.join(BASE_DIR, "prisma", "dev.db"), os.path.join(db_target, "dev.db"))
shutil.copyfile(os.path.join(BASE_DIR, "src", "scripts", "seed.ts"), os.path.join(db_target, "seed.ts"))
shutil.copyfile(os.path.join(BASE_DIR, "src", "lib", "db.ts"), os.path.join(db_target, "db.ts"))
er_f = os.path.join(BASE_DIR, "Review-2-Deliverables", "database_er_diagram.png")
if os.path.exists(er_f):
    shutil.copyfile(er_f, os.path.join(db_target, "database_er_diagram.png"))

# =========================================================================
# 4. CREATE ZIP FILES
# =========================================================================
def create_zip(source_dir, output_zip):
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                full_p = os.path.join(root, file)
                rel_p = os.path.relpath(full_p, source_dir)
                zipf.write(full_p, arcname=rel_p)

be_zip = os.path.join(BASE_DIR, "Review-2-Deliverables", "Backend_Code_Folder.zip")
create_zip(be_target, be_zip)

fe_zip = os.path.join(BASE_DIR, "Review-2-Deliverables", "Frontend_Code_Folder.zip")
create_zip(fe_target, fe_zip)

db_zip = os.path.join(BASE_DIR, "Review-2-Deliverables", "Database_Code_Folder.zip")
create_zip(db_target, db_zip)

print("Individual code folders and zip files created successfully!")
