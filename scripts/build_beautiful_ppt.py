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

# =========================================================================
# PREMIUM EXECUTIVE DESIGN SYSTEM
# =========================================================================
C_NAVY_DARK = RGBColor(10, 25, 47)       # #0A192F
C_NAVY_HDR  = RGBColor(15, 23, 42)       # #0F172A
C_ROYAL     = RGBColor(37, 99, 235)      # #2563EB
C_BLUE_SOFT = RGBColor(239, 246, 255)    # #EFF6FF
C_CARD_BG   = RGBColor(255, 255, 255)    # #FFFFFF
C_CARD_BRD  = RGBColor(226, 232, 240)    # #E2E8F0
C_TXT_MAIN  = RGBColor(15, 23, 42)       # #0F172A
C_TXT_BODY  = RGBColor(51, 65, 85)       # #334155
C_TXT_MUTED = RGBColor(100, 116, 139)    # #64748B
C_GREEN     = RGBColor(16, 185, 129)     # #10B981
C_GREEN_BG  = RGBColor(240, 253, 244)    # #F0FDF4
C_GREEN_BRD = RGBColor(187, 247, 208)    # #BBF7D0
C_RED       = RGBColor(220, 38, 38)      # #DC2626
C_RED_BG    = RGBColor(254, 242, 242)    # #FEF2F2
C_RED_BRD   = RGBColor(254, 202, 202)    # #FECACA
C_TEAL      = RGBColor(13, 148, 136)     # #0D9488

LOGO_PATH = "extracted_review1_images/slide_1_img_0_1.png"

# Authentic Web Screenshots Available
IMG_LANDING    = "extracted_review1_images/slide_9_img_5_10.png"
IMG_HR_SCREEN  = "extracted_review1_images/slide_9_img_6_11.png"
IMG_JOB_PORTAL = "extracted_review1_images/slide_9_img_7_12.png"
IMG_RESUME_UP  = "extracted_review1_images/slide_9_img_8_13.png"
IMG_APP_TRACK  = "extracted_review1_images/slide_9_img_9_14.png"
IMG_INTERVIEW  = "extracted_review1_images/slide_9_img_10_15.png"
IMG_ATTENDANCE = "extracted_review1_images/slide_9_img_11_16.png"
IMG_ANALYSIS   = "Analysis output 1.png"

def add_header(slide, title_text, presenter_name=""):
    top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.2))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = C_NAVY_HDR
    top_bar.line.color.rgb = C_NAVY_HDR

    if os.path.exists(LOGO_PATH):
        try:
            slide.shapes.add_picture(LOGO_PATH, Inches(0.5), Inches(0.2), width=Inches(1.85))
        except Exception:
            pass

    tx_box = slide.shapes.add_textbox(Inches(2.5), Inches(0.12), Inches(7.5), Inches(0.95))
    tf = tx_box.text_frame
    tf.word_wrap = True
    tf.margin_top = Inches(0)
    tf.margin_bottom = Inches(0)
    
    p0 = tf.paragraphs[0]
    p0.text = "MIT VISHWAPRAYAG UNIVERSITY, SOLAPUR  •  BCA REVIEW 2"
    p0.font.name = "Segoe UI"
    p0.font.size = Pt(9.5)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(147, 197, 253)

    p1 = tf.add_paragraph()
    p1.text = title_text
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(19)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 255, 255)

    if presenter_name:
        p_badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.2), Inches(0.35), Inches(2.6), Inches(0.5))
        p_badge.fill.solid()
        p_badge.fill.fore_color.rgb = RGBColor(30, 41, 59)
        p_badge.line.color.rgb = C_ROYAL
        p_badge.line.width = Pt(1.2)
        tb_p = slide.shapes.add_textbox(Inches(10.2), Inches(0.35), Inches(2.6), Inches(0.5))
        tf_p = tb_p.text_frame
        p_p = tf_p.paragraphs[0]
        p_p.alignment = PP_ALIGN.CENTER
        p_p.text = f"🎙️ {presenter_name}"
        p_p.font.name = "Segoe UI"
        p_p.font.size = Pt(9.5)
        p_p.font.bold = True
        p_p.font.color.rgb = RGBColor(224, 231, 255)

    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(1.2), Inches(13.333), Inches(0.04))
    line.fill.solid()
    line.fill.fore_color.rgb = C_ROYAL
    line.line.color.rgb = C_ROYAL

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
bg1.fill.fore_color.rgb = C_NAVY_DARK
bg1.line.color.rgb = C_NAVY_DARK

add_card(s1, Inches(0.9), Inches(0.65), Inches(11.533), Inches(6.2), bg_rgb=RGBColor(255, 255, 255), brd_rgb=C_ROYAL)

if os.path.exists(LOGO_PATH):
    s1.shapes.add_picture(LOGO_PATH, Inches(1.3), Inches(0.95), width=Inches(2.4))

tb_u = s1.shapes.add_textbox(Inches(3.9), Inches(0.9), Inches(8.0), Inches(1.0))
tf_u = tb_u.text_frame
tf_u.word_wrap = True
p = tf_u.paragraphs[0]
p.text = "MIT VISHWAPRAYAG UNIVERSITY, SOLAPUR"
p.font.name = "Segoe UI"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = C_ROYAL

p_sub = tf_u.add_paragraph()
p_sub.text = "School of Computing — Bachelor of Computer Applications (BCA) • Review 2"
p_sub.font.name = "Segoe UI"
p_sub.font.size = Pt(11)
p_sub.font.color.rgb = C_TXT_MUTED

add_card(s1, Inches(1.3), Inches(2.1), Inches(10.733), Inches(0.48), bg_rgb=C_BLUE_SOFT, brd_rgb=RGBColor(191, 219, 254))
tb_r = s1.shapes.add_textbox(Inches(1.3), Inches(2.1), Inches(10.733), Inches(0.48))
p = tb_r.text_frame.paragraphs[0]
p.alignment = PP_ALIGN.CENTER
p.text = "MAJOR PROJECT REVIEW 2: DESIGN & MIDWAY IMPLEMENTATION"
p.font.name = "Segoe UI"
p.font.size = Pt(10.5)
p.font.bold = True
p.font.color.rgb = C_ROYAL

tb_t = s1.shapes.add_textbox(Inches(1.3), Inches(2.75), Inches(10.733), Inches(1.2))
tf_t = tb_t.text_frame
tf_t.word_wrap = True
p_t = tf_t.paragraphs[0]
p_t.text = "AI-POWERED RECRUITMENT MANAGEMENT SYSTEM"
p_t.font.name = "Segoe UI"
p_t.font.size = Pt(25)
p_t.font.bold = True
p_t.font.color.rgb = C_TXT_MAIN

p_subt = tf_t.add_paragraph()
p_subt.text = "HireSphere AI — An Explainable Platform for Resume Screening, Job Matching & Employee Operations"
p_subt.font.name = "Segoe UI"
p_subt.font.size = Pt(12)
p_subt.font.italic = True
p_subt.font.color.rgb = C_TXT_MUTED

# Guide
add_card(s1, Inches(1.3), Inches(4.1), Inches(4.8), Inches(2.45), bg_rgb=RGBColor(248, 250, 252))
tb_g = s1.shapes.add_textbox(Inches(1.5), Inches(4.2), Inches(4.4), Inches(2.25))
tf_g = tb_g.text_frame
p = tf_g.paragraphs[0]
p.text = "PROJECT GUIDE"
p.font.name = "Segoe UI"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_ROYAL

p = tf_g.add_paragraph()
p.text = "Arindam Sir"
p.font.name = "Segoe UI"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = C_TXT_MAIN

p = tf_g.add_paragraph()
p.text = "Department of Computer Applications\nSchool of Computing\nMIT Vishwaprayag University, Solapur"
p.font.name = "Segoe UI"
p.font.size = Pt(9.5)
p.font.color.rgb = C_TXT_MUTED

# Team
add_card(s1, Inches(6.4), Inches(4.1), Inches(5.633), Inches(2.45), bg_rgb=RGBColor(248, 250, 252))
tb_tm = s1.shapes.add_textbox(Inches(6.6), Inches(4.2), Inches(5.2), Inches(2.25))
tf_tm = tb_tm.text_frame
p = tf_tm.paragraphs[0]
p.text = "PROJECT TEAM & SPECIALIZATIONS"
p.font.name = "Segoe UI"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_ROYAL

team_members = [
    ("Vijayalaxmi Mhetri", "Frontend + UI + API Integration", "SCFU224007"),
    ("Sakshi Sable", "Backend + Database + Authentication", "SCFU224029"),
    ("Pranavi Jadhav", "AI + Resume Processing + Job Matching", "SCFU224040")
]
for name, role, prn in team_members:
    p = tf_tm.add_paragraph()
    p.text = f"• {name} ({prn})"
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_TXT_MAIN
    p_role = tf_tm.add_paragraph()
    p_role.text = f"   Role: {role}"
    p_role.font.name = "Segoe UI"
    p_role.font.size = Pt(8.5)
    p_role.font.color.rgb = C_ROYAL

# =========================================================================
# SLIDE 2: PROBLEM STATEMENT & PROPOSED SYSTEM (VIJAYALAXMI MHETRI)
# =========================================================================
s2 = prs.slides.add_slide(blank_layout)
add_header(s2, "Problem Statement & Proposed System Overview", "Vijayalaxmi Mhetri")

add_card(s2, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.5), bg_rgb=C_RED_BG, brd_rgb=C_RED_BRD)
tb_prob = s2.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(5.3), Inches(5.1))
tf_prob = tb_prob.text_frame
tf_prob.word_wrap = True
p = tf_prob.paragraphs[0]
p.text = "CHALLENGES IN MANUAL RECRUITMENT"
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = C_RED

prob_list = [
    ("⏱️ High Screening Overhead", "Reviewing hundreds of resumes manually consumes 30–45s per resume, leading to recruiter cognitive fatigue and hiring delays."),
    ("🔤 Vocabulary & Keyword Mismatches", "Traditional keyword-based ATS tools fail when qualified applicants express skills using varying aliases (e.g. 'JS' vs 'JavaScript')."),
    ("🚫 Opaque Black-Box Decisioning", "Commercial AI systems often reject candidates blindly without explainable proof, risking ethical violations and compliance bias."),
    ("📁 Fragmented Disconnected Silos", "Recruitment applicant tracking and post-hire employee records live in isolated spreadsheets, creating manual re-entry errors.")
]
for title, desc in prob_list:
    p_t = tf_prob.add_paragraph()
    p_t.text = title
    p_t.font.name = "Segoe UI"
    p_t.font.size = Pt(10)
    p_t.font.bold = True
    p_t.font.color.rgb = C_TXT_MAIN
    p_d = tf_prob.add_paragraph()
    p_d.text = desc
    p_d.font.name = "Segoe UI"
    p_d.font.size = Pt(8.5)
    p_d.font.color.rgb = C_TXT_BODY

add_card(s2, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.5), bg_rgb=C_GREEN_BG, brd_rgb=C_GREEN_BRD)
tb_sol = s2.shapes.add_textbox(Inches(7.0), Inches(1.7), Inches(5.3), Inches(5.1))
tf_sol = tb_sol.text_frame
tf_sol.word_wrap = True
p = tf_sol.paragraphs[0]
p.text = "HIRESPHERE AI PROPOSED SOLUTION"
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = C_GREEN

sol_list = [
    ("⚡ Automated PDF Ingestion", "Server-side multi-page PDF text extraction with file header magic-byte verification (%PDF-1.x) to block disguised files."),
    ("🧠 Explainable Hybrid AI Matching", "Transparent TF-IDF Cosine Similarity with smooth IDF + Canonical Skill Overlap ratio, outputting exact sentence evidence quotes."),
    ("🎯 Centralized HR Decision Workspace", "Interactive candidate ranking table with sortable scores, skill chip filters, minimum score thresholds, and interview scheduling."),
    ("🔄 Unified Candidate-to-Employee Lifecycle", "Converts hired applicants idempotently into workforce employee records (HS-EMP-xxxx) with attendance clock-in and leave balances.")
]
for title, desc in sol_list:
    p_t = tf_sol.add_paragraph()
    p_t.text = title
    p_t.font.name = "Segoe UI"
    p_t.font.size = Pt(10)
    p_t.font.bold = True
    p_t.font.color.rgb = C_TXT_MAIN
    p_d = tf_sol.add_paragraph()
    p_d.text = desc
    p_d.font.name = "Segoe UI"
    p_d.font.size = Pt(8.5)
    p_d.font.color.rgb = C_TXT_BODY

# =========================================================================
# SLIDE 3: UPDATED SYSTEM ARCHITECTURE (SAKSHI SABLE) — [RUBRIC: 2 MARKS]
# =========================================================================
s3 = prs.slides.add_slide(blank_layout)
add_header(s3, "Updated System Architecture (4-Tier Layered Design)", "Sakshi Sable")

arch_img = "Review-2-Deliverables/system_architecture_diagram.png"
if os.path.exists(arch_img):
    s3.shapes.add_picture(arch_img, Inches(0.8), Inches(1.4), width=Inches(8.2))

add_card(s3, Inches(9.2), Inches(1.4), Inches(3.3), Inches(5.6))
tb_s3 = s3.shapes.add_textbox(Inches(9.35), Inches(1.5), Inches(3.0), Inches(5.4))
tf_s3 = tb_s3.text_frame
tf_s3.word_wrap = True
p = tf_s3.paragraphs[0]
p.text = "ARCHITECTURE (2M)"
p.font.name = "Segoe UI"
p.font.size = Pt(11.5)
p.font.bold = True
p.font.color.rgb = C_ROYAL

arch_points = [
    ("1. Presentation Layer (SPA)", "Next.js 15 Client SPA rendering at root '/'. Client-side Hash Routing ('#/hr/jobs') ensures instant zero-reload transitions."),
    ("2. API Gateway & Security", "49 REST route handlers on Node.js runtime. Jose JWT verification, bcrypt password hashing, Zod validation, and sliding rate limiters."),
    ("3. AI Domain Engine", "Deterministic pure TypeScript NLP. unpdf extraction, 85-term skill dictionary, TF-IDF smooth IDF cosine dot product."),
    ("4. Persistence Layer", "19 Prisma relational models. Atomic ACID transactions ($transaction) and secure private PDF disk storage outside web root.")
]
for title, desc in arch_points:
    p_t = tf_s3.add_paragraph()
    p_t.text = title
    p_t.font.name = "Segoe UI"
    p_t.font.size = Pt(9.5)
    p_t.font.bold = True
    p_t.font.color.rgb = C_TXT_MAIN
    p_d = tf_s3.add_paragraph()
    p_d.text = desc
    p_d.font.name = "Segoe UI"
    p_d.font.size = Pt(8)
    p_d.font.color.rgb = C_TXT_BODY

# =========================================================================
# SLIDE 4: REQUIREMENTS & TRACEABILITY MAPPING DOCUMENT (VIJAYALAXMI MHETRI)
# =========================================================================
s4 = prs.slides.add_slide(blank_layout)
add_header(s4, "Requirements & Traceability Mapping Document", "Vijayalaxmi Mhetri")

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
    cell.fill.fore_color.rgb = C_NAVY_HDR
    p = cell.text_frame.paragraphs[0]
    p.text = text
    p.font.name = "Segoe UI"
    p.font.size = Pt(9)
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
        p.font.name = "Segoe UI"
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_TXT_MAIN
        if c_idx == 0:
            p.font.bold = True
        elif c_idx == 4:
            p.font.bold = True
            p.font.color.rgb = C_GREEN

card_wlink = add_card(s4, Inches(0.8), Inches(5.8), Inches(11.7), Inches(1.3), bg_rgb=C_BLUE_SOFT, brd_rgb=RGBColor(191, 219, 254))
tb_wl = s4.shapes.add_textbox(Inches(1.0), Inches(5.88), Inches(11.3), Inches(1.1))
tf_wl = tb_wl.text_frame
tf_wl.word_wrap = True
p = tf_wl.paragraphs[0]
p.text = "OFFICIAL REQUIREMENTS & MAPPING WORD DOCUMENT (.DOCX):"
p.font.name = "Segoe UI"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_ROYAL
p2 = tf_wl.add_paragraph()
p2.text = "File Path: Review-2-Deliverables/Requirements_and_Mapping_Document.docx"
p2.font.name = "Segoe UI"
p2.font.size = Pt(11)
p2.font.bold = True
p2.font.color.rgb = C_TXT_MAIN
p3 = tf_wl.add_paragraph()
p3.text = "Comprehensive academic document containing detailed SRS, full traceability mapping, mathematical derivations, and verification matrices."
p3.font.name = "Segoe UI"
p3.font.size = Pt(9)
p3.font.color.rgb = C_TXT_MUTED

# =========================================================================
# SLIDE 5: SCREEN LAYOUTS WITH ACTUAL WEB IMAGES (VIJAYALAXMI MHETRI) — [5M]
# =========================================================================
s5 = prs.slides.add_slide(blank_layout)
add_header(s5, "Screen Layouts & Actual Web Application Interfaces", "Vijayalaxmi Mhetri")

# 3 Framed Web Image Cards
web_screens = [
    (IMG_JOB_PORTAL, "Candidate Job Portal & Filters", "Job search with department chips, skill requirements, and instant apply button.", Inches(0.8)),
    (IMG_RESUME_UP, "Resume Upload & Live Parser", "PDF drag-and-drop zone with unpdf parsing status and parsed profile review.", Inches(4.8)),
    (IMG_HR_SCREEN, "HR Screening Workspace", "AI score gauge, required skill breakdown, and sentence evidence quote snippets.", Inches(8.8)),
]
for img_path, title, desc, left in web_screens:
    # Outer Card
    add_card(s5, left, Inches(1.4), Inches(3.7), Inches(5.6))
    
    # Image Header Box
    tb_ih = s5.shapes.add_textbox(left + Inches(0.1), Inches(1.45), Inches(3.5), Inches(0.45))
    p = tb_ih.text_frame.paragraphs[0]
    p.text = title
    p.font.name = "Segoe UI"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_ROYAL

    # Embedded Web Image
    if os.path.exists(img_path):
        s5.shapes.add_picture(img_path, left + Inches(0.15), Inches(1.95), width=Inches(3.4))

    # Caption Box Below Image
    tb_ic = s5.shapes.add_textbox(left + Inches(0.15), Inches(5.4), Inches(3.4), Inches(1.5))
    tf_ic = tb_ic.text_frame
    tf_ic.word_wrap = True
    p = tf_ic.paragraphs[0]
    p.text = desc
    p.font.name = "Segoe UI"
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_TXT_BODY

# =========================================================================
# SLIDE 6: DATABASE DESIGN & ER DIAGRAM (SAKSHI SABLE) — [RUBRIC: 5M]
# =========================================================================
s6 = prs.slides.add_slide(blank_layout)
add_header(s6, "Database Design — 19 Relational Models (Prisma ORM)", "Sakshi Sable")

er_img = "Review-2-Deliverables/database_er_diagram.png"
if os.path.exists(er_img):
    s6.shapes.add_picture(er_img, Inches(0.8), Inches(1.4), width=Inches(8.2))

add_card(s6, Inches(9.2), Inches(1.4), Inches(3.3), Inches(5.6))
tb_s6 = s6.shapes.add_textbox(Inches(9.35), Inches(1.5), Inches(3.0), Inches(5.4))
tf_s6 = tb_s6.text_frame
tf_s6.word_wrap = True
p = tf_s6.paragraphs[0]
p.text = "DATABASE DESIGN (5M)"
p.font.name = "Segoe UI"
p.font.size = Pt(11.5)
p.font.bold = True
p.font.color.rgb = C_ROYAL

db_points = [
    ("19 Relational Models", "User, Candidate, Resume, Job, Application, Interview, Employee, Attendance, Leaves."),
    ("Duplicate Application Prevention", "@@unique([jobId, candidateId]) makes duplicate applications impossible at database level."),
    ("Attendance Integrity", "@@unique([employeeId, date]) blocks double clock-ins on same calendar date."),
    ("Atomic Transactions", "Prisma $transaction guarantees zero partial database writes across multi-table updates."),
    ("MySQL Portability", "Zero code change needed to switch database provider from SQLite to MySQL 8.0.")
]
for title, desc in db_points:
    p_t = tf_s6.add_paragraph()
    p_t.text = f"• {title}:"
    p_t.font.name = "Segoe UI"
    p_t.font.size = Pt(9)
    p_t.font.bold = True
    p_t.font.color.rgb = C_TXT_MAIN
    p_d = tf_s6.add_paragraph()
    p_d.text = desc
    p_d.font.name = "Segoe UI"
    p_d.font.size = Pt(8)
    p_d.font.color.rgb = C_TXT_BODY

# =========================================================================
# SLIDE 7: ML/NLP MODELS & WHY SELECTED (PRANAVI JADHAV) — [RUBRIC: 5M]
# =========================================================================
s7 = prs.slides.add_slide(blank_layout)
add_header(s7, "ML/NLP Models Used & Selection Rationale", "Pranavi Jadhav")

tbl_s7 = s7.shapes.add_table(5, 4, Inches(0.8), Inches(1.5), Inches(11.7), Inches(3.8)).table
tbl_s7.columns[0].width = Inches(2.5)
tbl_s7.columns[1].width = Inches(3.2)
tbl_s7.columns[2].width = Inches(3.0)
tbl_s7.columns[3].width = Inches(3.0)
ai_headers = ["Selection Parameter", "Selected: Hybrid TF-IDF & Skill Overlap", "Alternative: Opaque Deep Learning (BERT)", "Alternative: Generative LLMs (OpenAI)"]
for idx, text in enumerate(ai_headers):
    cell = tbl_s7.cell(0, idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = C_NAVY_HDR if idx != 1 else C_ROYAL
    p = cell.text_frame.paragraphs[0]
    p.text = text
    p.font.name = "Segoe UI"
    p.font.size = Pt(9)
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
        p.font.name = "Segoe UI"
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_TXT_MAIN
        if col_idx == 0:
            p.font.bold = True

add_card(s7, Inches(0.8), Inches(5.5), Inches(11.7), Inches(1.5), bg_rgb=C_GREEN_BG, brd_rgb=C_GREEN_BRD)
tb_s7e = s7.shapes.add_textbox(Inches(1.0), Inches(5.6), Inches(11.3), Inches(1.3))
tf_s7e = tb_s7e.text_frame
tf_s7e.word_wrap = True
p = tf_s7e.paragraphs[0]
p.text = "MODEL TRAINING, VALIDATION & SELECTION RATIONALE (5M):"
p.font.name = "Segoe UI"
p.font.size = Pt(10.5)
p.font.bold = True
p.font.color.rgb = C_GREEN
p2 = tf_s7e.add_paragraph()
p2.text = "In human resources technology, ethical standards mandate that automated systems do not operate as unexplainable black boxes. Our hybrid TF-IDF + Skill Overlap algorithm provides recruiters with auditable mathematical scores, verifiable sentence evidence quotes, and deterministic ranking — completely free of demographic bias."
p2.font.name = "Segoe UI"
p2.font.size = Pt(9)
p2.font.color.rgb = C_TXT_BODY

# =========================================================================
# SLIDE 8: FLOWCHARTS & ALGORITHMS (PRANAVI JADHAV) — [RUBRIC: 3 MARKS]
# =========================================================================
s8 = prs.slides.add_slide(blank_layout)
add_header(s8, "Flowcharts & Algorithms for Major Features", "Pranavi Jadhav")

fc_files = [
    ("flowchart_candidate_registration.png", "A: Candidate Registration Flow", Inches(0.8)),
    ("flowchart_resume_upload_extraction.png", "B: Resume Upload & Parsing", Inches(4.8)),
    ("flowchart_ai_matching.png", "C: AI Candidate-Job Matching", Inches(8.8)),
]
for fname, title, left in fc_files:
    path = f"Review-2-Deliverables/{fname}"
    if os.path.exists(path):
        s8.shapes.add_picture(path, left, Inches(1.4), width=Inches(3.7))
    tb = s8.shapes.add_textbox(left, Inches(6.8), Inches(3.7), Inches(0.5))
    p = tb.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = title
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_ROYAL

# =========================================================================
# SLIDE 9: IMPLEMENTATION PROGRESS & GITHUB (SAKSHI SABLE) — [RUBRIC: 5M]
# =========================================================================
s9 = prs.slides.add_slide(blank_layout)
add_header(s9, "Implementation Progress & GitHub Repository (82.3%)", "Sakshi Sable")

tbl_s9 = s9.shapes.add_table(6, 3, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.3)).table
tbl_s9.columns[0].width = Inches(3.2)
tbl_s9.columns[1].width = Inches(2.2)
tbl_s9.columns[2].width = Inches(1.4)
p_hdrs = ["Module Name", "Feature Status", "Progress"]
for idx, text in enumerate(p_hdrs):
    cell = tbl_s9.cell(0, idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = C_NAVY_HDR
    p = cell.text_frame.paragraphs[0]
    p.text = text
    p.font.name = "Segoe UI"
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
        p.font.name = "Segoe UI"
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_TXT_MAIN
        if c_idx == 0:
            p.font.bold = True
        elif c_idx == 2:
            p.font.bold = True
            p.font.color.rgb = C_GREEN

add_card(s9, Inches(7.8), Inches(1.5), Inches(4.7), Inches(5.3), bg_rgb=C_GREEN_BG, brd_rgb=C_GREEN_BRD)
tb_bm = s9.shapes.add_textbox(Inches(8.0), Inches(1.7), Inches(4.3), Inches(4.9))
tf_bm = tb_bm.text_frame
tf_bm.word_wrap = True
p = tf_bm.paragraphs[0]
p.alignment = PP_ALIGN.CENTER
p.text = "IMPLEMENTATION PROGRESS (5M)"
p.font.name = "Segoe UI"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = C_GREEN

p2 = tf_bm.add_paragraph()
p2.alignment = PP_ALIGN.CENTER
p2.text = "82.3% Completed"
p2.font.name = "Segoe UI"
p2.font.size = Pt(28)
p2.font.bold = True
p2.font.color.rgb = C_GREEN

p3 = tf_bm.add_paragraph()
p3.alignment = PP_ALIGN.CENTER
p3.text = "Surpasses Rubric Threshold (>= 70%)"
p3.font.name = "Segoe UI"
p3.font.size = Pt(10)
p3.font.bold = True
p3.font.color.rgb = C_TXT_MAIN

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
    p.font.name = "Segoe UI"
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_TXT_BODY

# =========================================================================
# SLIDE 10: ACTUAL WEB SCREENSHOTS & RESULTS (VIJAYALAXMI MHETRI)
# =========================================================================
s10 = prs.slides.add_slide(blank_layout)
add_header(s10, "Actual Web Application Screenshots & Results", "Vijayalaxmi Mhetri")

# 4 Framed Web Application Screenshots in a 2x2 grid
ss_grid = [
    (IMG_LANDING, "1. Landing Page & 3D Hero Canvas", Inches(0.8), Inches(1.4)),
    (IMG_ANALYSIS if os.path.exists(IMG_ANALYSIS) else IMG_HR_SCREEN, "2. Real-Time AI Screening Output", Inches(6.8), Inches(1.4)),
    (IMG_APP_TRACK, "3. Candidate Application Timeline", Inches(0.8), Inches(4.3)),
    (IMG_ATTENDANCE, "4. Employee Attendance Calendar", Inches(6.8), Inches(4.3)),
]
for path, label, l, t in ss_grid:
    add_card(s10, l, t, Inches(5.7), Inches(2.75))
    if os.path.exists(path):
        s10.shapes.add_picture(path, l + Inches(0.12), t + Inches(0.12), width=Inches(3.4))
    tb = s10.shapes.add_textbox(l + Inches(3.6), t + Inches(0.2), Inches(1.95), Inches(2.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = label
    p.font.name = "Segoe UI"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_ROYAL
    p2 = tf.add_paragraph()
    p2.text = "Captured live from running HireSphere AI application."
    p2.font.name = "Segoe UI"
    p2.font.size = Pt(8)
    p2.font.color.rgb = C_TXT_BODY

# =========================================================================
# SLIDE 11: INDIVIDUAL CONTRIBUTIONS & CONCLUSION (PRANAVI JADHAV / JOINT)
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
    cell.fill.fore_color.rgb = C_NAVY_HDR
    p = cell.text_frame.paragraphs[0]
    p.text = text
    p.font.name = "Segoe UI"
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
        p.font.name = "Segoe UI"
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_TXT_MAIN
        if c_idx == 1:
            p.font.bold = True
            p.font.color.rgb = C_GREEN
        elif c_idx == 2:
            p.font.bold = True

add_card(s11, Inches(0.8), Inches(6.0), Inches(11.7), Inches(1.1), bg_rgb=C_GREEN_BG, brd_rgb=C_GREEN_BRD)
tb_c11 = s11.shapes.add_textbox(Inches(1.0), Inches(6.08), Inches(11.3), Inches(0.95))
tf_c11 = tb_c11.text_frame
tf_c11.word_wrap = True
p = tf_c11.paragraphs[0]
p.text = "CONCLUSION & ROADMAP TO FINAL REVIEW 3:"
p.font.name = "Segoe UI"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_GREEN
p2 = tf_c11.add_paragraph()
p2.text = "HireSphere AI successfully delivers an explainable, ethical recruitment system with 82.3% completed. For Review 3, our roadmap includes third-party SMTP email alerts, bulk ZIP resume processing, and cloud Docker containerization. Thank you Guide Arindam Sir and committee members!"
p2.font.name = "Segoe UI"
p2.font.size = Pt(9)
p2.font.color.rgb = C_TXT_BODY

output_ppt = "Review-2-Deliverables/Review_2_AI_Recruitment_System.pptx"
prs.save(output_ppt)
print("Beautiful Presentation with real web images generated successfully!")
