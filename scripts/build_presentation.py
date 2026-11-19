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

# Theme Colors
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
    p0.text = f"MIT VISHWAPRAYAG UNIVERSITY, SOLAPUR — BCA REVIEW 2  |  {presenter_tag.upper()}".strip()
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
p_subt.text = "An Integrated Web Platform for Resume Screening, Explainable AI Matching, and Workforce Management"
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

# Team box
add_card(s1, Inches(6.5), Inches(3.8), Inches(5.4), Inches(2.7), bg_rgb=RGBColor(248, 250, 252))
tb_tm = s1.shapes.add_textbox(Inches(6.7), Inches(3.9), Inches(5.0), Inches(2.5))
tf_tm = tb_tm.text_frame
p = tf_tm.paragraphs[0]
p.text = "PROJECT TEAM & SPECIALIZATIONS"
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
# SLIDE 2: PROBLEM STATEMENT & OBJECTIVES (VIJAYALAXMI MHETRI)
# =========================================================================
s2 = prs.slides.add_slide(blank_layout)
add_header(s2, "Problem Statement & Project Objectives", "Speaker: Vijayalaxmi Mhetri")

add_card(s2, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.5), bg_rgb=RGBColor(254, 242, 242), brd_rgb=RGBColor(254, 202, 202))
tb_prob = s2.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(5.3), Inches(5.1))
tf_prob = tb_prob.text_frame
p = tf_prob.paragraphs[0]
p.text = "PROBLEM STATEMENT"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = RGBColor(185, 28, 28)
prob_items = [
    "• High Manual Screening Time: Reviewing hundreds of resumes takes 30–45s per applicant, causing severe recruiter fatigue.",
    "• Skill Terminology Mismatch: Traditional ATS fails to match candidate skills with varying aliases (e.g. 'JS' vs 'JavaScript').",
    "• Opaque Black-Box Rejections: Existing commercial tools reject candidates blindly without explainable evidence.",
    "• Fragmented Disconnected Systems: Recruitment, attendance, and employee records live in isolated spreadsheets."
]
for item in prob_items:
    p = tf_prob.add_paragraph()
    p.text = item
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK_TXT

add_card(s2, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.5), bg_rgb=RGBColor(240, 253, 244), brd_rgb=RGBColor(187, 247, 208))
tb_obj = s2.shapes.add_textbox(Inches(7.0), Inches(1.7), Inches(5.3), Inches(5.1))
tf_obj = tb_obj.text_frame
p = tf_obj.paragraphs[0]
p.text = "KEY PROJECT OBJECTIVES"
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = C_GREEN
obj_items = [
    "1. Role-Based Secure Access: Segregated views for Admin, HR, Candidate, and Employee via Jose JWT & Bcrypt.",
    "2. Automated Resume Parsing: Extract clean text, contact info, and experience from multi-page PDFs using unpdf.",
    "3. Explainable AI Matching: TF-IDF Cosine Similarity + Skill Overlap with sentence quotes (0.6 / 0.4 blend).",
    "4. Candidate Ranking Workspace: HR decision-support table with score filtering and interview scheduling.",
    "5. Integrated Employee Management: Seamlessly convert hired candidates to active employee records with attendance."
]
for item in obj_items:
    p = tf_obj.add_paragraph()
    p.text = item
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 3: SYSTEM ARCHITECTURE (SAKSHI SABLE)
# =========================================================================
s3 = prs.slides.add_slide(blank_layout)
add_header(s3, "System Architecture — 4-Tier Layered Design", "Speaker: Sakshi Sable")

arch_img = "Review-2-Deliverables/system_architecture_diagram.png"
if os.path.exists(arch_img):
    s3.shapes.add_picture(arch_img, Inches(0.8), Inches(1.4), width=Inches(8.2))

add_card(s3, Inches(9.2), Inches(1.4), Inches(3.3), Inches(5.6))
tb_s3 = s3.shapes.add_textbox(Inches(9.35), Inches(1.5), Inches(3.0), Inches(5.4))
tf_s3 = tb_s3.text_frame
p = tf_s3.paragraphs[0]
p.text = "ARCHITECTURE LAYERS"
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
# SLIDE 4: FRONTEND UI & API INTEGRATION (VIJAYALAXMI MHETRI)
# =========================================================================
s4 = prs.slides.add_slide(blank_layout)
add_header(s4, "Frontend Architecture, UI & API Integration", "Speaker: Vijayalaxmi Mhetri")

fe_cards = [
    ("Next.js SPA & Hash Routing", "• Single Page Application rendering at root '/'.\n• Client-side Hash Routing ('#/hr/jobs', '#/portal/jobs') ensures instant zero-reload transitions.\n• Zustand stores for auth, active session, and role guards.", Inches(0.8), Inches(1.5), Inches(5.7), Inches(2.6)),
    ("Responsive UI & Accessibility", "• Utility-first styling via Tailwind CSS.\n• Radix UI accessible component primitives (Buttons, Modals, Tabs, Dialogs).\n• Seamless Dark/Light theme toggle powered by 'next-themes'.", Inches(6.8), Inches(1.5), Inches(5.7), Inches(2.6)),
    ("Full-Stack API Integration", "• All 49 backend REST API endpoints connected via centralized client helper ('src/lib/api-client.ts').\n• Standard response unwrapping: { ok: true, data: { ... } } | { ok: false, error: { ... } }.\n• Automatic error toast notifications and HTTP status handling (401/403/409/422).", Inches(0.8), Inches(4.3), Inches(11.7), Inches(2.6))
]
for title, desc, l, t, w, h in fe_cards:
    add_card(s4, l, t, w, h)
    tb = s4.shapes.add_textbox(l + Inches(0.2), t + Inches(0.2), w - Inches(0.4), h - Inches(0.4))
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
# SLIDE 5: BACKEND ARCHITECTURE & SECURITY (SAKSHI SABLE)
# =========================================================================
s5 = prs.slides.add_slide(blank_layout)
add_header(s5, "Backend Architecture, Security & Authentication", "Speaker: Sakshi Sable")

be_cards = [
    ("49 REST API Route Handlers", "• Modular Next.js server route handlers executing on Node.js runtime.\n• Standardized handler() wrapper converts ZodErrors to unified JSON envelopes and masks internals.\n• Endpoints: /api/auth, /api/jobs, /api/resumes, /api/applications, /api/ai, /api/attendance.", Inches(0.8), Inches(1.5)),
    ("Jose JWT Session Management", "• Stateless signed tokens using HS256 cryptographic algorithm.\n• Stored in secure httpOnly, SameSite=Lax cookies with 7-day expiration (immune to XSS theft).\n• DB account re-check on every request ensures instant rejection of suspended accounts.", Inches(6.8), Inches(1.5)),
    ("Bcrypt.js Password Hashing", "• Cost factor 10 hashing algorithm protects all user accounts.\n• Plaintext passwords are never stored, logged, or returned in API responses.\n• Robust defense against rainbow tables and brute-force attacks.", Inches(0.8), Inches(4.3)),
    ("Role-Based Access Control (RBAC)", "• Segregated access across ADMIN, HR, CANDIDATE, and EMPLOYEE.\n• requireAuth(roles) middleware intercepts unauthorized requests on server side.\n• Private resume storage ('uploads/resumes/') outside web root; verified streaming only.", Inches(6.8), Inches(4.3))
]
for title, desc, l, t in be_cards:
    add_card(s5, l, t, Inches(5.7), Inches(2.6))
    tb = s5.shapes.add_textbox(l + Inches(0.2), t + Inches(0.2), Inches(5.3), Inches(2.2))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_TEAL
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 6: DATABASE DESIGN & ER DIAGRAM (SAKSHI SABLE)
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
p.text = "DATABASE INTEGRITY"
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
# SLIDE 7: AI MATCHING ALGORITHM FORMULATION (PRANAVI JADHAV)
# =========================================================================
s7 = prs.slides.add_slide(blank_layout)
add_header(s7, "AI Candidate-Job Matching Formulation", "Speaker: Pranavi Jadhav")

ai_math = [
    ("1. Smooth IDF Formulation", "To avoid division-by-zero and scale term importance:\n   idf(t) = ln((1 + N) / (1 + df(t))) + 1\nWhere N is corpus document count, df(t) is document frequency.\nSmooth IDF prevents zero-weight singularity artifacts.", Inches(0.8), Inches(1.5), Inches(5.7), Inches(2.6)),
    ("2. L2 Normalization & Cosine Similarity", "Term weights w = tf * idf are L2-normalized onto unit hypersphere:\n   vec(d) = w(d) / ||w(d)||₂\nCosine similarity between Job vector (J) and Resume vector (R):\n   tfidfScore = J · R = Σ (J_i * R_i)  ∈ [0, 1]", Inches(6.8), Inches(1.5), Inches(5.7), Inches(2.6)),
    ("3. Required Skill Overlap Ratio", "Evaluates candidate fulfillment of mandatory job prerequisites:\n   skillScore = |R_req ∩ S_res| / |R_req|\nWhere R_req is required skills and S_res is detected resume skills.\nReturns null if job defines zero required skills.", Inches(0.8), Inches(4.3), Inches(5.7), Inches(2.6)),
    ("4. Weighted Final Hybrid Score", "Synthesizes general semantic context with hard technical criteria:\n   finalScore = (0.6 * tfidfScore) + (0.4 * skillScore)\nOutputs sentence quotes, missing skills, and plain summary.\nStored as reproducible snapshot on Application record.", Inches(6.8), Inches(4.3), Inches(5.7), Inches(2.6)),
]
for title, desc, l, t, w, h in ai_math:
    add_card(s7, l, t, w, h)
    tb = s7.shapes.add_textbox(l + Inches(0.15), t + Inches(0.15), w - Inches(0.3), h - Inches(0.3))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 8: RESUME PARSING & SKILL EVIDENCE (PRANAVI JADHAV)
# =========================================================================
s8 = prs.slides.add_slide(blank_layout)
add_header(s8, "Resume Parsing & Sentence Evidence Generation", "Speaker: Pranavi Jadhav")

parse_boxes = [
    ("File Hygiene & unpdf Extraction", "• File size <= 5 MB cap.\n• Inspects PDF magic bytes ('%PDF-1.x') to block disguised files.\n• unpdf (server-side pdf.js) extracts multi-page text cleanly in Node.js.\n• Rejects empty or corrupt PDF scans (<40 characters).", Inches(0.8), Inches(1.5)),
    ("Conservative RegEx Extraction", "• Candidate Name: Top 6 lines alphabetic heuristic.\n• Email & Phone: RFC-standard regex + Indian 10-digit mobile parser.\n• Experience Years: 'X years' mentions + year-range delta calculations.\n• Fields not found return null (zero hallucinated data).", Inches(6.8), Inches(1.5)),
    ("Canonical Skill Dictionary (~85 Skills)", "• 85 core technical skills across Languages, Frameworks, DBs, and Tools.\n• 300+ aliases: 'js' -> JavaScript, 'drf' -> Django, 'k8s' -> Kubernetes.\n• Normalizes vocabulary so candidates aren't penalized for terminology.", Inches(0.8), Inches(4.3)),
    ("Exact Sentence Evidence Quotes", "• Captures the exact sentence where a skill was evidenced in the resume.\n• Example: 'Architected backend REST APIs using Django and PostgreSQL.'\n• Recruiter Trust: Human HR can verify claims without opening PDF.", Inches(6.8), Inches(4.3)),
]
for title, desc, l, t in parse_boxes:
    add_card(s8, l, t, Inches(5.7), Inches(2.6))
    tb = s8.shapes.add_textbox(l + Inches(0.2), t + Inches(0.2), Inches(5.3), Inches(2.2))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_TEAL
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 9: IMPLEMENTATION PROGRESS & BENCHMARKS (SAKSHI SABLE)
# =========================================================================
s9 = prs.slides.add_slide(blank_layout)
add_header(s9, "Implementation Progress & Empirical Benchmarks", "Speaker: Sakshi Sable")

# Left: Progress Table
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

# Right Benchmarks Card
add_card(s9, Inches(7.8), Inches(1.5), Inches(4.7), Inches(5.3), bg_rgb=RGBColor(240, 253, 244), brd_rgb=C_GREEN)
tb_bm = s9.shapes.add_textbox(Inches(8.0), Inches(1.7), Inches(4.3), Inches(4.9))
tf_bm = tb_bm.text_frame
p = tf_bm.paragraphs[0]
p.alignment = PP_ALIGN.CENTER
p.text = "OVERALL PROGRESS: 82.3%"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = C_GREEN
p2 = tf_bm.add_paragraph()
p2.alignment = PP_ALIGN.CENTER
p2.text = "Surpasses University Rubric (>= 70%)"
p2.font.size = Pt(11)
p2.font.bold = True
p2.font.color.rgb = C_DARK_TXT

bm_items = [
    "\n• AI Matching Latency: ~82 ms (Target <150 ms)",
    "• REST API Response Time: 45–115 ms (Target <200 ms)",
    "• Database Query Latency: 12–28 ms (Target <50 ms)",
    "• First Contentful Paint: ~0.9 sec (Target <1.5 sec)",
    "• Active GitHub Repo: 49 APIs & 19 Tables operational"
]
for bi in bm_items:
    p = tf_bm.add_paragraph()
    p.text = bi
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_DARK_TXT

# =========================================================================
# SLIDE 10: TEAM CONTRIBUTIONS & CONCLUSION (JOINT / PRANAVI)
# =========================================================================
s10 = prs.slides.add_slide(blank_layout)
add_header(s10, "Individual Team Contributions & Conclusion", "All Team Members")

tbl_s10 = s10.shapes.add_table(10, 3, Inches(0.8), Inches(1.5), Inches(11.7), Inches(4.3)).table
tbl_s10.columns[0].width = Inches(5.8)
tbl_s10.columns[1].width = Inches(1.8)
tbl_s10.columns[2].width = Inches(4.1)
c_hdrs = ["Project Task & Implementation Ownership", "Status", "Student Name & Specialization"]
for idx, text in enumerate(c_hdrs):
    cell = tbl_s10.cell(0, idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = C_NAVY
    p = cell.text_frame.paragraphs[0]
    p.text = text
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

tasks_main = [
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
for r_idx, data in enumerate(tasks_main):
    for c_idx, text in enumerate(data):
        cell = tbl_s10.cell(r_idx + 1, c_idx)
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

add_card(s10, Inches(0.8), Inches(6.0), Inches(11.7), Inches(1.1), bg_rgb=RGBColor(240, 253, 244), brd_rgb=C_GREEN)
tb_c = s10.shapes.add_textbox(Inches(1.0), Inches(6.08), Inches(11.3), Inches(0.95))
tf_c = tb_c.text_frame
p = tf_c.paragraphs[0]
p.text = "CONCLUSION & FUTURE ROADMAP (REVIEW 3):"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_GREEN
p2 = tf_c.add_paragraph()
p2.text = "HireSphere AI successfully delivers an explainable, ethical recruitment system with 82.3% completed. For Review 3, our roadmap includes third-party SMTP email alerts, bulk ZIP resume processing, and cloud Docker containerization. Thank you Guide Arindam Sir and committee members!"
p2.font.size = Pt(9)
p2.font.color.rgb = C_DARK_TXT

output_ppt = "Review-2-Deliverables/Review_2_AI_Recruitment_System.pptx"
prs.save(output_ppt)
print(f"Compact Presentation regenerated without requirements slide: {len(prs.slides)} slides.")
