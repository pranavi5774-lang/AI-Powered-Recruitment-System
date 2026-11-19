import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
import os

prs = pptx.Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

# Professional Palette matching University Style
C_NAVY      = RGBColor(15, 23, 42)       # #0F172A
C_BLUE      = RGBColor(37, 99, 235)      # #2563EB
C_CARD_BG   = RGBColor(255, 255, 255)   # #FFFFFF
C_CARD_BRD  = RGBColor(226, 232, 240)   # #E2E8F0
C_DARK_TXT  = RGBColor(30, 41, 59)       # #1E293B
C_MUTED_TXT = RGBColor(100, 116, 139)   # #64748B
C_TEAL      = RGBColor(13, 148, 136)     # #0D9488
C_GREEN     = RGBColor(22, 101, 52)      # #166534

LOGO_PATH = "extracted_review1_images/slide_1_img_0_1.png"

def add_header(slide, title_text, presenter_tag=""):
    top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.15))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = C_NAVY
    top_bar.line.color.rgb = C_NAVY

    if os.path.exists(LOGO_PATH):
        try:
            slide.shapes.add_picture(LOGO_PATH, Inches(0.4), Inches(0.18), width=Inches(1.8))
        except Exception:
            pass

    tx_box = slide.shapes.add_textbox(Inches(2.4), Inches(0.12), Inches(10.5), Inches(0.95))
    tf = tx_box.text_frame
    tf.word_wrap = True
    tf.margin_top = Inches(0)
    tf.margin_bottom = Inches(0)
    
    p0 = tf.paragraphs[0]
    p0.text = f"MIT VISHWAPRAYAG UNIVERSITY, SOLAPUR — REVIEW 2  |  {presenter_tag.upper()}".strip()
    p0.font.name = "Calibri"
    p0.font.size = Pt(10)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(147, 197, 253)

    p1 = tf.add_paragraph()
    p1.text = title_text
    p1.font.name = "Calibri"
    p1.font.size = Pt(20)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 255, 255)

    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(1.15), Inches(13.333), Inches(0.04))
    line.fill.solid()
    line.fill.fore_color.rgb = C_BLUE
    line.line.color.rgb = C_BLUE

def add_card(slide, left, top, width, height, bg_rgb=C_CARD_BG, brd_rgb=C_CARD_BRD):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_rgb
    card.line.color.rgb = brd_rgb
    card.line.width = Pt(1.2)
    return card

# =========================================================================
# SLIDE 1: TITLE SLIDE (JOINT)
# =========================================================================
s1 = prs.slides.add_slide(blank_layout)
bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
bg1.fill.solid()
bg1.fill.fore_color.rgb = C_NAVY
bg1.line.color.rgb = C_NAVY

add_card(s1, Inches(1.0), Inches(0.7), Inches(11.333), Inches(6.1), bg_rgb=RGBColor(255, 255, 255), brd_rgb=C_BLUE)

if os.path.exists(LOGO_PATH):
    s1.shapes.add_picture(LOGO_PATH, Inches(1.4), Inches(0.95), width=Inches(2.5))

tb_u = s1.shapes.add_textbox(Inches(4.2), Inches(0.9), Inches(7.8), Inches(1.0))
tf_u = tb_u.text_frame
tf_u.word_wrap = True
p = tf_u.paragraphs[0]
p.text = "MIT VISHWAPRAYAG UNIVERSITY, SOLAPUR"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = C_BLUE
p_sub = tf_u.add_paragraph()
p_sub.text = "School of Computing — BCA Final Year | Review 2: Design & Midway Implementation"
p_sub.font.size = Pt(11.5)
p_sub.font.color.rgb = C_MUTED_TXT

tb_t = s1.shapes.add_textbox(Inches(1.4), Inches(2.2), Inches(10.5), Inches(1.4))
tf_t = tb_t.text_frame
tf_t.word_wrap = True
p_t = tf_t.paragraphs[0]
p_t.text = "AI-POWERED RECRUITMENT MANAGEMENT SYSTEM"
p_t.font.size = Pt(25)
p_t.font.bold = True
p_t.font.color.rgb = C_NAVY
p_subt = tf_t.add_paragraph()
p_subt.text = "HireSphere AI — An Integrated Platform for Automated Screening & Workforce Operations"
p_subt.font.size = Pt(12.5)
p_subt.font.italic = True
p_subt.font.color.rgb = C_MUTED_TXT

# Guide box
add_card(s1, Inches(1.4), Inches(3.8), Inches(4.8), Inches(2.7), bg_rgb=RGBColor(248, 250, 252))
tb_g = s1.shapes.add_textbox(Inches(1.6), Inches(3.9), Inches(4.4), Inches(2.5))
tf_g = tb_g.text_frame
p = tf_g.paragraphs[0]
p.text = "PROJECT GUIDE"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_BLUE
p = tf_g.add_paragraph()
p.text = "Arindam Sir"
p.font.size = Pt(15)
p.font.bold = True
p.font.color.rgb = C_NAVY
p = tf_g.add_paragraph()
p.text = "Department of Computer Applications\nSchool of Computing, MIT VPU, Solapur"
p.font.size = Pt(10)
p.font.color.rgb = C_MUTED_TXT

# Team box with exact student contributions
add_card(s1, Inches(6.5), Inches(3.8), Inches(5.4), Inches(2.7), bg_rgb=RGBColor(248, 250, 252))
tb_tm = s1.shapes.add_textbox(Inches(6.7), Inches(3.9), Inches(5.0), Inches(2.5))
tf_tm = tb_tm.text_frame
p = tf_tm.paragraphs[0]
p.text = "PROJECT TEAM & CONTRIBUTIONS"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_BLUE

team_data = [
    ("Vijayalaxmi Mhetri", "Frontend + UI + API Integration", "SCFU224007"),
    ("Sakshi Sable", "Backend + Database + Authentication", "SCFU224029"),
    ("Pranavi Jadhav", "AI + Resume Processing + Job Matching", "SCFU224040")
]
for name, role, prn in team_data:
    p = tf_tm.add_paragraph()
    p.text = f"• {name} ({prn})\n   Role: {role}"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 2: PROBLEM STATEMENT & PROPOSED SYSTEM (VIJAYALAXMI MHETRI)
# =========================================================================
s2 = prs.slides.add_slide(blank_layout)
add_header(s2, "Problem Statement & Proposed System Overview", "Speaker: Vijayalaxmi Mhetri")

add_card(s2, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.5), bg_rgb=RGBColor(254, 242, 242), brd_rgb=RGBColor(254, 202, 202))
tb_p2 = s2.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(5.3), Inches(5.1))
tf_p2 = tb_p2.text_frame
p = tf_p2.paragraphs[0]
p.text = "EXISTING CHALLENGES"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = RGBColor(185, 28, 28)
p_items = [
    "• High Screening Overhead: Reviewing hundreds of resumes takes 30–45s per resume with high human fatigue.",
    "• Skill Alias Mismatches: Traditional keyword ATS fails when candidates use varying terminology ('JS' vs 'JavaScript').",
    "• Opaque Black-Box Rejections: Existing commercial tools reject candidates blindly without explainable proof.",
    "• Fragmented Systems: Recruitment, attendance, and leave management live in disconnected spreadsheets."
]
for pi in p_items:
    p = tf_p2.add_paragraph()
    p.text = pi
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK_TXT

add_card(s2, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.5), bg_rgb=RGBColor(240, 253, 244), brd_rgb=RGBColor(187, 247, 208))
tb_o2 = s2.shapes.add_textbox(Inches(7.0), Inches(1.7), Inches(5.3), Inches(5.1))
tf_o2 = tb_o2.text_frame
p = tf_o2.paragraphs[0]
p.text = "HIRESPHERE AI SOLUTION"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = C_GREEN
o_items = [
    "• Automated PDF Ingestion: Server-side multi-page text extraction with magic-byte security checks.",
    "• Explainable Hybrid AI: TF-IDF Cosine Similarity + Skill Overlap with sentence evidence quotes (0.6 / 0.4 blend).",
    "• Candidate Ranking Workspace: HR decision-support table with score filtering and interview scheduling.",
    "• Integrated Employee Operations: Seamlessly converts hired candidates to employee records with attendance.",
    "• Full Auditability: Immutable status transition logs and tamper-proof action logging across 19 database tables."
]
for oi in o_items:
    p = tf_o2.add_paragraph()
    p.text = oi
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 3: UPDATED SYSTEM ARCHITECTURE (SAKSHI SABLE) — [RUBRIC: 2 MARKS]
# =========================================================================
s3 = prs.slides.add_slide(blank_layout)
add_header(s3, "Updated System Architecture (4-Tier Layered Design)", "Speaker: Sakshi Sable")

arch_img = "Review-2-Deliverables/system_architecture_diagram.png"
if os.path.exists(arch_img):
    s3.shapes.add_picture(arch_img, Inches(0.8), Inches(1.4), width=Inches(8.2))

add_card(s3, Inches(9.2), Inches(1.4), Inches(3.3), Inches(5.6))
tb_s3 = s3.shapes.add_textbox(Inches(9.35), Inches(1.5), Inches(3.0), Inches(5.4))
tf_s3 = tb_s3.text_frame
p = tf_s3.paragraphs[0]
p.text = "ARCHITECTURE (2M)"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = C_BLUE
arch_notes = [
    "1. Presentation Layer:\nNext.js 15 Client SPA with instant Hash Routing.",
    "2. API Gateway Layer:\n49 REST route handlers with Jose JWT auth, Zod validation, and rate limiters.",
    "3. AI Domain Engine:\nDeterministic TypeScript NLP; unpdf extraction & TF-IDF cosine similarity.",
    "4. Persistence Layer:\n19 Prisma relational models; atomic ACID transactions ($transaction)."
]
for an in arch_notes:
    p = tf_s3.add_paragraph()
    p.text = an
    p.font.size = Pt(9)
    p.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 4: REQUIREMENTS & MAPPING DOCUMENT LINK (VIJAYALAXMI MHETRI)
# =========================================================================
s4 = prs.slides.add_slide(blank_layout)
add_header(s4, "Requirements & Traceability Mapping Document", "Speaker: Vijayalaxmi Mhetri")

tbl_s4 = s4.shapes.add_table(7, 5, Inches(0.8), Inches(1.5), Inches(11.7), Inches(4.1)).table
tbl_s4.columns[0].width = Inches(1.1)
tbl_s4.columns[1].width = Inches(3.2)
tbl_s4.columns[2].width = Inches(2.6)
tbl_s4.columns[3].width = Inches(2.8)
tbl_s4.columns[4].width = Inches(2.0)
m_hdrs = ["Req ID", "Core Requirement", "Component Layer", "Database Entity & API", "Status"]
for idx, text in enumerate(m_hdrs):
    cell = tbl_s4.cell(0, idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = C_NAVY
    p = cell.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

m_rows = [
    ("FR-01", "Multi-Role Authentication (JWT, Bcrypt, RBAC)", "Security Gateway", "User, PasswordResetToken", "100% Done"),
    ("FR-02", "Job Requisitions & Public Portal", "Business API Handlers", "Job, Department", "100% Done"),
    ("FR-03", "Resume Ingestion & Info Extraction", "unpdf Parser & RegEx", "Resume, CandidateProfile", "100% Done"),
    ("FR-04", "AI Candidate-Job Matching & Scoring", "AI Domain Engine", "ResumeAnalysis, Application", "100% Done"),
    ("FR-05", "Application Pipeline & Status Audit", "Application Service", "ApplicationStatusHistory", "100% Done"),
    ("FR-06", "HR Candidate Screening & Ranking", "Ranking Workspace", "Interview, Employee", "100% Done"),
]
for r_idx, data in enumerate(m_rows):
    for c_idx, text in enumerate(data):
        cell = tbl_s4.cell(r_idx + 1, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(248, 250, 252) if r_idx % 2 == 0 else RGBColor(255, 255, 255)
        p = cell.text_frame.paragraphs[0]
        p.text = text
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_DARK_TXT
        if c_idx == 0:
            p.font.bold = True
        elif c_idx == 4:
            p.font.bold = True
            p.font.color.rgb = C_GREEN

card_wlink = add_card(s4, Inches(0.8), Inches(5.8), Inches(11.7), Inches(1.3), bg_rgb=RGBColor(239, 246, 255), brd_rgb=C_BLUE)
tb_wl = s4.shapes.add_textbox(Inches(1.0), Inches(5.88), Inches(11.3), Inches(1.1))
tf_wl = tb_wl.text_frame
p = tf_wl.paragraphs[0]
p.text = "OFFICIAL REQUIREMENTS & MAPPING WORD DOCUMENT (.DOCX):"
p.font.size = Pt(10.5)
p.font.bold = True
p.font.color.rgb = C_BLUE
p2 = tf_wl.add_paragraph()
p2.text = "File Path: Review-2-Deliverables/Requirements_and_Mapping_Document.docx"
p2.font.size = Pt(11)
p2.font.bold = True
p2.font.color.rgb = C_NAVY
p3 = tf_wl.add_paragraph()
p3.text = "Complete academic traceability document mapping business problems, architecture, database schemas, and verification criteria."
p3.font.size = Pt(9.5)
p3.font.color.rgb = C_MUTED_TXT

# =========================================================================
# SLIDE 5: FRONTEND UI & SCREEN LAYOUTS (VIJAYALAXMI MHETRI) — [RUBRIC: 5M]
# =========================================================================
s5 = prs.slides.add_slide(blank_layout)
add_header(s5, "Screen Layouts, UI Wireframes & API Integration", "Speaker: Vijayalaxmi Mhetri")

fe_cards = [
    ("Next.js SPA & Hash Routing", "• Single Page Application rendering at root '/'.\n• Client-side Hash Routing ('#/hr/jobs', '#/portal/jobs') ensures instant zero-reload transitions.\n• Zustand stores for auth, active session, and role guards.", Inches(0.8), Inches(1.5), Inches(5.7), Inches(2.6)),
    ("Responsive UI & Accessibility", "• Utility-first styling via Tailwind CSS.\n• Radix UI accessible component primitives (Buttons, Modals, Tabs, Dialogs).\n• Seamless Dark/Light theme toggle powered by 'next-themes'.", Inches(6.8), Inches(1.5), Inches(5.7), Inches(2.6)),
    ("Full-Stack API Integration", "• All 49 backend REST API endpoints connected via centralized client helper ('src/lib/api-client.ts').\n• Standard response unwrapping: { ok: true, data: { ... } } | { ok: false, error: { ... } }.\n• Automatic error toast notifications and HTTP status handling (401/403/409/422).", Inches(0.8), Inches(4.3), Inches(11.7), Inches(2.6))
]
for title, desc, l, t, w, h in fe_cards:
    add_card(s5, l, t, w, h)
    tb = s5.shapes.add_textbox(l + Inches(0.2), t + Inches(0.2), w - Inches(0.4), h - Inches(0.4))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 6: DATABASE DESIGN & ER DIAGRAM (SAKSHI SABLE) — [RUBRIC: 5M]
# =========================================================================
s6 = prs.slides.add_slide(blank_layout)
add_header(s6, "Database Design — 19 Relational Models (Prisma ORM)", "Speaker: Sakshi Sable")

er_img = "Review-2-Deliverables/database_er_diagram.png"
if os.path.exists(er_img):
    s6.shapes.add_picture(er_img, Inches(0.8), Inches(1.4), width=Inches(8.2))

add_card(s6, Inches(9.2), Inches(1.4), Inches(3.3), Inches(5.6))
tb_s6 = s6.shapes.add_textbox(Inches(9.35), Inches(1.5), Inches(3.0), Inches(5.4))
tf_s6 = tb_s6.text_frame
p = tf_s6.paragraphs[0]
p.text = "DATABASE DESIGN (5M)"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = C_BLUE
db_points = [
    "• 19 Relational Tables:\nUser, Candidate, Resume, Job, Application, Interview, Employee, Attendance, Leaves.",
    "• Duplicate Prevention:\n@@unique([jobId, candidateId]) makes duplicate applications impossible.",
    "• Attendance Integrity:\n@@unique([employeeId, date]) blocks double clock-ins.",
    "• ACID Transactions:\nPrisma $transaction guarantees zero partial database writes.",
    "• MySQL Portability:\nZero code change needed to switch from SQLite to MySQL 8.0."
]
for dp in db_points:
    p = tf_s6.add_paragraph()
    p.text = dp
    p.font.size = Pt(9)
    p.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 7: ML/NLP MODELS & WHY SELECTED (PRANAVI JADHAV) — [RUBRIC: 5M]
# =========================================================================
s7 = prs.slides.add_slide(blank_layout)
add_header(s7, "ML/NLP Models Used & Selection Rationale", "Speaker: Pranavi Jadhav")

tbl_s7 = s7.shapes.add_table(5, 4, Inches(0.8), Inches(1.5), Inches(11.7), Inches(3.8)).table
tbl_s7.columns[0].width = Inches(2.5)
tbl_s7.columns[1].width = Inches(3.2)
tbl_s7.columns[2].width = Inches(3.0)
tbl_s7.columns[3].width = Inches(3.0)
ai_headers = ["Selection Parameter", "Selected: Hybrid TF-IDF & Skill Overlap", "Alternative: Opaque Deep Learning (BERT)", "Alternative: Generative LLMs (OpenAI)"]
for idx, text in enumerate(ai_headers):
    cell = tbl_s7.cell(0, idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = C_NAVY if idx != 1 else C_BLUE
    p = cell.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)
ai_rows = [
    ("Explainability & Proof", "100% Explainable; outputs exact sentence quotes and missing skills", "Opaque black-box embeddings; impossible to explain score to HR", "Generative hallucinations; non-deterministic explanations"),
    ("Execution Latency", "~82 milliseconds per application; executes locally on server", "800–2,500 ms; requires GPU or heavy server hardware", "1,500–5,000 ms; dependent on external cloud network latency"),
    ("Operational Cost", "Zero external costs; runs inside application runtime", "High hosting costs for GPU compute instances", "Recurring token subscription fees per API request"),
    ("Determinism & Fairness", "100% deterministic; same input always yields identical score", "Stochastic variability; susceptible to training dataset bias", "Prompt-injection vulnerabilities; non-deterministic drift")
]
for row_idx, data in enumerate(ai_rows):
    for col_idx, text in enumerate(data):
        cell = tbl_s7.cell(row_idx + 1, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(239, 246, 255) if col_idx == 1 else (RGBColor(248, 250, 252) if row_idx % 2 == 0 else RGBColor(255, 255, 255))
        p = cell.text_frame.paragraphs[0]
        p.text = text
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_DARK_TXT
        if col_idx == 0:
            p.font.bold = True

add_card(s7, Inches(0.8), Inches(5.5), Inches(11.7), Inches(1.5), bg_rgb=RGBColor(240, 253, 244), brd_rgb=C_GREEN)
tb_s7e = s7.shapes.add_textbox(Inches(1.0), Inches(5.6), Inches(11.3), Inches(1.3))
tf_s7e = tb_s7e.text_frame
p = tf_s7e.paragraphs[0]
p.text = "MODEL TRAINING, VALIDATION & SELECTION RATIONALE (5M):"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN
p2 = tf_s7e.add_paragraph()
p2.text = "In human resources technology, ethical standards mandate that automated systems do not operate as unexplainable black boxes. Our hybrid TF-IDF + Skill Overlap algorithm provides recruiters with auditable mathematical scores, verifiable sentence evidence quotes, and deterministic ranking — completely free of demographic bias."
p2.font.size = Pt(9.5)
p2.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 8: FLOWCHARTS & ALGORITHMS (PRANAVI JADHAV) — [RUBRIC: 3 MARKS]
# =========================================================================
s8 = prs.slides.add_slide(blank_layout)
add_header(s8, "Flowcharts & Algorithms for Major Features", "Speaker: Pranavi Jadhav")

fc_files = [
    ("flowchart_candidate_registration.png", "A: Candidate Registration", Inches(0.8)),
    ("flowchart_resume_upload_extraction.png", "B: Resume Upload & Parsing", Inches(4.8)),
    ("flowchart_ai_matching.png", "C: AI Candidate Matching", Inches(8.8)),
]
for fname, title, left in fc_files:
    path = f"Review-2-Deliverables/{fname}"
    if os.path.exists(path):
        s8.shapes.add_picture(path, left, Inches(1.5), width=Inches(3.7))
    tb = s8.shapes.add_textbox(left, Inches(6.8), Inches(3.7), Inches(0.5))
    p = tb.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = title
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE

# =========================================================================
# SLIDE 9: IMPLEMENTATION PROGRESS & GITHUB (SAKSHI SABLE) — [RUBRIC: 5 MARKS]
# =========================================================================
s9 = prs.slides.add_slide(blank_layout)
add_header(s9, "Implementation Progress & GitHub Repository (82.3%)", "Speaker: Sakshi Sable")

tbl_s9 = s9.shapes.add_table(6, 3, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.3)).table
tbl_s9.columns[0].width = Inches(3.2)
tbl_s9.columns[1].width = Inches(2.2)
tbl_s9.columns[2].width = Inches(1.4)
p_hdrs = ["Module Name", "Feature Status", "Progress"]
for idx, text in enumerate(p_hdrs):
    cell = tbl_s9.cell(0, idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = C_NAVY
    p = cell.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

p_rows = [
    ("Auth & Security (JWT, Bcrypt, RBAC)", "7 / 7 Working", "100%"),
    ("Job Requisitions & Public Catalog", "8 / 8 Working", "100%"),
    ("Candidate Portal & Resume Upload", "6 / 6 Working", "100%"),
    ("AI Matching & Skill Evidence Engine", "5 / 5 Working", "100%"),
    ("Workforce Operations & Admin Audit", "10 / 12 Working", "83.3%"),
]
for r_idx, data in enumerate(p_rows):
    for c_idx, text in enumerate(data):
        cell = tbl_s9.cell(r_idx + 1, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(248, 250, 252) if r_idx % 2 == 0 else RGBColor(255, 255, 255)
        p = cell.text_frame.paragraphs[0]
        p.text = text
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_DARK_TXT
        if c_idx == 0:
            p.font.bold = True
        elif c_idx == 2:
            p.font.bold = True
            p.font.color.rgb = C_GREEN

add_card(s9, Inches(7.8), Inches(1.5), Inches(4.7), Inches(5.3), bg_rgb=RGBColor(240, 253, 244), brd_rgb=C_GREEN)
tb_bm = s9.shapes.add_textbox(Inches(8.0), Inches(1.7), Inches(4.3), Inches(4.9))
tf_bm = tb_bm.text_frame
p = tf_bm.paragraphs[0]
p.alignment = PP_ALIGN.CENTER
p.text = "IMPLEMENTATION PROGRESS (5M)"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = C_GREEN

p2 = tf_bm.add_paragraph()
p2.alignment = PP_ALIGN.CENTER
p2.text = "82.3% Completed"
p2.font.size = Pt(28)
p2.font.bold = True
p2.font.color.rgb = C_GREEN

p3 = tf_bm.add_paragraph()
p3.alignment = PP_ALIGN.CENTER
p3.text = "Surpasses Rubric Threshold (>= 70%)"
p3.font.size = Pt(10)
p3.font.bold = True
p3.font.color.rgb = C_DARK_TXT

bm_items = [
    "\n• GitHub: github.com/pranavi5774-lang/AI-Powered-Recruitment-System",
    "• Meaningful, regular commits & clean directory structure",
    "• AI Matching Latency: ~82 ms (Target <150 ms)",
    "• REST API Response: 45–115 ms (Target <200 ms)",
    "• Database Query Latency: 12–28 ms (Target <50 ms)"
]
for bi in bm_items:
    p = tf_bm.add_paragraph()
    p.text = bi
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 10: LIVE WEBSITE SCREENSHOTS (VIJAYALAXMI MHETRI)
# =========================================================================
s10 = prs.slides.add_slide(blank_layout)
add_header(s10, "Live Website Screenshots", "Speaker: Vijayalaxmi Mhetri")

ss_list = [
    ("Review-2-Deliverables/website_landing_browser.png", "HireSphere AI Landing Page", "Public entry page and project overview.", Inches(0.8), Inches(1.5)),
    ("Review-2-Deliverables/website_hr_dashboard_live.png", "Live HR Dashboard", "Recruitment overview and employee-operation shortcuts.", Inches(6.8), Inches(1.5)),
    ("Review-2-Deliverables/website_hr_jobs_live.png", "HR Job Management", "Live job-management screen from the local demo database.", Inches(0.8), Inches(4.3)),
    ("Review-2-Deliverables/website_login_redacted.png", "Sign-in Screen", "Role-based sign-in; demo credentials are excluded.", Inches(6.8), Inches(4.3)),
]
for path, label, description, l, t in ss_list:
    add_card(s10, l, t, Inches(5.7), Inches(2.7))
    if os.path.exists(path):
        image_width = Inches(2.7) if label == "Sign-in Screen" else Inches(3.2)
        s10.shapes.add_picture(path, l + Inches(0.15), t + Inches(0.15), width=image_width)
    tb = s10.shapes.add_textbox(l + Inches(3.5), t + Inches(0.2), Inches(2.0), Inches(2.3))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = label
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p2 = tf.add_paragraph()
    p2.text = description
    p2.font.size = Pt(8.5)
    p2.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 11: INDIVIDUAL CONTRIBUTIONS & CONCLUSION (JOINT / PRANAVI)
# =========================================================================
s11 = prs.slides.add_slide(blank_layout)
add_header(s11, "Individual Team Member Contributions (Rubric Required)", "All Team Members")

tbl_s11 = s11.shapes.add_table(10, 3, Inches(0.8), Inches(1.5), Inches(11.7), Inches(4.3)).table
tbl_s11.columns[0].width = Inches(5.8)
tbl_s11.columns[1].width = Inches(1.8)
tbl_s11.columns[2].width = Inches(4.1)
c_hdrs = ["Project Task & Implementation Ownership", "Status", "Student Name & Specialization"]
for idx, text in enumerate(c_hdrs):
    cell = tbl_s11.cell(0, idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = C_NAVY
    p = cell.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

tasks_final = [
    ("Frontend UI/UX Architecture & Responsive SPA Design (Next.js/React)", "Done", "Vijayalaxmi Mhetri (Frontend Lead)"),
    ("Candidate Portal & HR Screening Interface Design (Tailwind/Radix)", "Done", "Vijayalaxmi Mhetri (Frontend Lead)"),
    ("Client-Side API Integration & Zustand State Management", "Done", "Vijayalaxmi Mhetri (Frontend Lead)"),
    ("Backend REST API Architecture & 49 Route Handlers (Node.js)", "Done", "Sakshi Sable (Backend Lead)"),
    ("Database Schema Design & Prisma ORM Relational Models (19 Tables)", "Done", "Sakshi Sable (Database Lead)"),
    ("Jose JWT Authentication & Bcrypt Password Security Gateway", "Done", "Sakshi Sable (Security Lead)"),
    ("AI / NLP Matching Engine (TF-IDF Vectorizer & Cosine Similarity)", "Done", "Pranavi Jadhav (AI Lead)"),
    ("Resume Ingestion, PDF Magic-Byte Validation & unpdf Parsing", "Done", "Pranavi Jadhav (AI Lead)"),
    ("Canonical Skill Dictionary (~85 Skills) & Sentence Evidence Quotes", "Done", "Pranavi Jadhav (AI Lead)"),
]
for r_idx, data in enumerate(tasks_final):
    for c_idx, text in enumerate(data):
        cell = tbl_s11.cell(r_idx + 1, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(248, 250, 252) if r_idx % 2 == 0 else RGBColor(255, 255, 255)
        p = cell.text_frame.paragraphs[0]
        p.text = text
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_DARK_TXT
        if c_idx == 1:
            p.font.bold = True
            p.font.color.rgb = C_GREEN
        elif c_idx == 2:
            p.font.bold = True

add_card(s11, Inches(0.8), Inches(6.0), Inches(11.7), Inches(1.1), bg_rgb=RGBColor(240, 253, 244), brd_rgb=C_GREEN)
tb_c11 = s11.shapes.add_textbox(Inches(1.0), Inches(6.08), Inches(11.3), Inches(0.95))
tf_c11 = tb_c11.text_frame
p = tf_c11.paragraphs[0]
p.text = "CONCLUSION & ROADMAP TO FINAL REVIEW 3:"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_GREEN
p2 = tf_c11.add_paragraph()
p2.text = "HireSphere AI successfully delivers an explainable, ethical recruitment system with 82.3% completed. For Review 3, our roadmap includes third-party SMTP email alerts, bulk ZIP resume processing, and cloud Docker containerization. Thank you Guide Arindam Sir and committee members!"
p2.font.size = Pt(9)
p2.font.color.rgb = C_DARK_TXT

output_ppt = "Review-2-Deliverables/Review_2_AI_Recruitment_System.pptx"
prs.save(output_ppt)
print(f"Final Review-2 PPT regenerated with {len(prs.slides)} slides matching rubric.")
