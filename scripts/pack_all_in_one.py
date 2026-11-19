import os
import shutil
import zipfile

BASE_DIR = os.path.abspath(".")
ALL_IN_ONE_DIR = os.path.join(BASE_DIR, "Review-2-Deliverables", "HireSphere_AI_Complete_Review_2_Project")

if os.path.exists(ALL_IN_ONE_DIR):
    shutil.rmtree(ALL_IN_ONE_DIR)
os.makedirs(ALL_IN_ONE_DIR, exist_ok=True)

# 1. Presentations
p_dir = os.path.join(ALL_IN_ONE_DIR, "01_Presentations_PPT")
os.makedirs(p_dir, exist_ok=True)
for ppt in ["HireSphere_AI_Review_2_Master.pptx", "Review_2_AI_Recruitment_System.pptx"]:
    src = os.path.join(BASE_DIR, "Review-2-Deliverables", ppt)
    if os.path.exists(src):
        dst_name = "HireSphere_AI_Review_1_and_2_Complete.pptx" if "Master" in ppt else ppt
        shutil.copyfile(src, os.path.join(p_dir, dst_name))

# 2. Source Code Modular
code_dir = os.path.join(ALL_IN_ONE_DIR, "02_Modular_Source_Code")
src_code = os.path.join(BASE_DIR, "Project-Code-Separated")
if os.path.exists(src_code):
    shutil.copytree(src_code, code_dir)

# 3. Backend Source Handbook
b_dir = os.path.join(ALL_IN_ONE_DIR, "03_Backend_Source_Handbook")
os.makedirs(b_dir, exist_ok=True)
src_bk = os.path.join(BASE_DIR, "Review-2-Deliverables", "Backend_Complete_Source_Code.md")
if os.path.exists(src_bk):
    shutil.copyfile(src_bk, os.path.join(b_dir, "Backend_Complete_Source_Code.md"))

# 4. Academic Reports & Scripts
rep_dir = os.path.join(ALL_IN_ONE_DIR, "04_Academic_Reports_and_Scripts")
os.makedirs(rep_dir, exist_ok=True)
for doc in ["Requirements_and_Mapping_Document.docx", "Project_Implementation_Progress_Report.md", "PPT_Presentation_Script.md"]:
    src = os.path.join(BASE_DIR, "Review-2-Deliverables", doc)
    if os.path.exists(src):
        shutil.copyfile(src, os.path.join(rep_dir, doc))

# 5. High-Res Diagrams & Flowcharts
diag_dir = os.path.join(ALL_IN_ONE_DIR, "05_System_Diagrams_and_Flowcharts")
os.makedirs(diag_dir, exist_ok=True)
diag_files = [
    "system_architecture_diagram.png",
    "database_er_diagram.png",
    "flowchart_candidate_registration.png",
    "flowchart_resume_upload_extraction.png",
    "flowchart_ai_matching.png",
    "flowchart_application_lifecycle.png",
    "flowchart_admin_hr_management.png"
]
for df in diag_files:
    src = os.path.join(BASE_DIR, "Review-2-Deliverables", df)
    if os.path.exists(src):
        shutil.copyfile(src, os.path.join(diag_dir, df))

# 6. Live Web Screenshots
ss_dir = os.path.join(ALL_IN_ONE_DIR, "06_Live_Web_Screenshots")
os.makedirs(ss_dir, exist_ok=True)
ss_files = [
    "Analysis_output_1.png",
    "sample_images_uploaded.jpg",
    "website_landing_browser.png",
    "website_hr_dashboard_live.png",
    "website_hr_jobs_live.png"
]
for sf in ss_files:
    src = os.path.join(BASE_DIR, "Review-2-Deliverables", sf)
    if os.path.exists(src):
        shutil.copyfile(src, os.path.join(ss_dir, sf))

# 7. Master Index & README
index_md = """# HireSphere AI — Complete Review 2 Project Package
**Project Title:** AI-Powered Recruitment and Employee Management System  
**University:** MIT Vishwaprayag University, Solapur  
**School:** School of Computing — Bachelor of Computer Applications (BCA)  
**Project Guide:** Dr. Arindam Sarkar  

---

## 👥 Project Team & Domain Specializations

| Team Member | PRN | Role | Assigned Directory |
|---|---|---|---|
| **Vijayalaxmi Mhetri** | SCFU224007 | **Frontend Lead:** UI/UX, Next.js 15 SPA, State, Routing & API Integration | `02_Modular_Source_Code/Frontend` |
| **Sakshi Sable** | SCFU224029 | **Backend & Database Lead:** 49 REST APIs, JWT Auth & 19 Prisma Relational Models | `02_Modular_Source_Code/Backend` & `Database` |
| **Pranavi Jadhav** | SCFU224040 | **AI Lead:** Resume Parsing (`unpdf`), TF-IDF Cosine Similarity & Skill Matcher | `02_Modular_Source_Code/AI-Engine` |

---

## 📁 Package Directory Contents

```
HireSphere_AI_Complete_Review_2_Project/
├── 01_Presentations_PPT/
│   ├── HireSphere_AI_Review_1_and_2_Complete.pptx   (Master 15-slide unified presentation)
│   └── Review_2_AI_Recruitment_System.pptx          (10-slide core Review-2 presentation)
├── 02_Modular_Source_Code/
│   ├── Frontend/                                    (122 UI, SPA, Hooks & Style files)
│   ├── Backend/                                     (49 REST API route handlers, Auth & Services)
│   ├── Database/                                    (19 Prisma Models, SQLite db, seed script)
│   └── AI-Engine/                                   (TF-IDF Cosine Matcher, Skill Dictionary)
├── 03_Backend_Source_Handbook/
│   └── Backend_Complete_Source_Code.md              (73 KB consolidated backend source code)
├── 04_Academic_Reports_and_Scripts/
│   ├── Requirements_and_Mapping_Document.docx       (Official academic SRS & mapping matrix)
│   ├── Project_Implementation_Progress_Report.md    (82.3% technical implementation audit)
│   └── PPT_Presentation_Script.md                  (Rehearsal speaking script for each student)
├── 05_System_Diagrams_and_Flowcharts/
│   ├── system_architecture_diagram.png              (300 DPI 4-Tier Layered Architecture)
│   ├── database_er_diagram.png                      (300 DPI 19-Table Entity Relationship Diagram)
│   ├── flowchart_candidate_registration.png         (Candidate Registration Flow)
│   ├── flowchart_resume_upload_extraction.png       (Resume Ingestion & unpdf Extraction)
│   └── flowchart_ai_matching.png                    (AI Candidate-Job Matching Algorithm)
├── 06_Live_Web_Screenshots/
│   ├── Analysis_output_1.png                        (Live AI Match Analysis Output with 85% Score)
│   ├── sample_images_uploaded.jpg                   (7-Screen Sample Images Layout)
│   ├── website_landing_browser.png                  (Live Landing Page)
│   └── website_hr_dashboard_live.png                (Live HR Management Dashboard)
└── README.md
```

## 🏆 Review 2 Rubrics Coverage (15 Marks)
1. **System Architecture (2M):** Covered in `05_System_Diagrams_and_Flowcharts/system_architecture_diagram.png` & Slide 7.
2. **Database Design & UI Wireframes (5M):** Covered in `05_.../database_er_diagram.png`, `06_.../sample_images_uploaded.jpg` & Slides 8 & 9.
3. **Flowcharts & Algorithms (3M):** Covered in `05_.../flowchart_*.png` & Slide 11.
4. **Implementation Progress (5M):** Demonstrated at **82.3%** completion with working live screenshots & GitHub audit.
5. **Individual Contributions:** Highlighted in Slide 14 and in each modular source directory.
"""

with open(os.path.join(ALL_IN_ONE_DIR, "README.md"), "w", encoding="utf-8") as f:
    f.write(index_md)

# Create Master Zip
zip_target = os.path.join(BASE_DIR, "Review-2-Deliverables", "HireSphere_AI_Complete_Review_2_Project.zip")
with zipfile.ZipFile(zip_target, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(ALL_IN_ONE_DIR):
        for file in files:
            full_p = os.path.join(root, file)
            rel_p = os.path.relpath(full_p, ALL_IN_ONE_DIR)
            zipf.write(full_p, arcname=rel_p)

print(f"All-in-one package folder created at: {ALL_IN_ONE_DIR}")
print(f"Master ZIP archive created at: {zip_target} ({os.path.getsize(zip_target)} bytes)")
