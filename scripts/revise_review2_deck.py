from pathlib import Path
from math import ceil

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches as DocInches, Pt as DocPt, RGBColor as DocRGB
from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"
ASSETS = ROOT / "Review-2-Deliverables"
PPT_OUT = DOWNLOADS / "HireSphere_AI_Review2_Presentation_Improved.pptx"
SCRIPT_OUT = DOWNLOADS / "HireSphere_AI_Review2_Speaker_Script.docx"
MAPPING_OUT = DOWNLOADS / "HireSphere_AI_Requirements_Mapping.docx"

SW, SH = 13.333, 7.5
NAVY = RGBColor(15, 23, 42)
INK = RGBColor(30, 41, 59)
MUTED = RGBColor(91, 105, 125)
BLUE = RGBColor(55, 105, 245)
CYAN = RGBColor(47, 183, 197)
TEAL = RGBColor(18, 147, 136)
PURPLE = RGBColor(126, 87, 220)
BG = RGBColor(246, 248, 252)
WHITE = RGBColor(255, 255, 255)
LINE = RGBColor(222, 229, 239)
PALE_BLUE = RGBColor(235, 242, 255)
PALE_TEAL = RGBColor(231, 248, 246)
PALE_PURPLE = RGBColor(243, 238, 255)
PALE_AMBER = RGBColor(255, 247, 225)


def inch(value):
    return Inches(value)


def textbox(slide, text, x, y, w, h, size=16, color=INK, bold=False,
            align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.TOP, font="Aptos",
            margin=0.04, italic=False):
    shape = slide.shapes.add_textbox(inch(x), inch(y), inch(w), inch(h))
    frame = shape.text_frame
    frame.clear()
    frame.word_wrap = True
    frame.margin_left = inch(margin)
    frame.margin_right = inch(margin)
    frame.margin_top = inch(margin)
    frame.margin_bottom = inch(margin)
    frame.vertical_anchor = valign
    p = frame.paragraphs[0]
    p.text = text
    p.alignment = align
    p.font.name = font
    p.font.size = Pt(size)
    p.font.bold = bold
    p.font.italic = italic
    p.font.color.rgb = color
    return shape


def rect(slide, x, y, w, h, fill=WHITE, line=LINE, radius=True, line_width=1):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE,
        inch(x), inch(y), inch(w), inch(h)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = line
    shape.line.width = Pt(line_width)
    return shape


def line(slide, x1, y1, x2, y2, color=LINE, width=1.5, arrow=False):
    shape = slide.shapes.add_connector(
        1, inch(x1), inch(y1), inch(x2), inch(y2)
    )
    shape.line.color.rgb = color
    shape.line.width = Pt(width)
    if arrow:
        shape.line.end_arrowhead = True
    return shape


def add_bullets(slide, items, x, y, w, h, size=14, color=INK, gap=7):
    shape = slide.shapes.add_textbox(inch(x), inch(y), inch(w), inch(h))
    frame = shape.text_frame
    frame.clear()
    frame.word_wrap = True
    frame.margin_left = inch(0.03)
    frame.margin_right = inch(0.03)
    frame.margin_top = inch(0.02)
    frame.margin_bottom = inch(0.02)
    for i, item in enumerate(items):
        p = frame.paragraphs[0] if i == 0 else frame.add_paragraph()
        p.text = f"•  {item}"
        p.font.name = "Aptos"
        p.font.size = Pt(size)
        p.font.color.rgb = color
        p.space_after = Pt(gap)
        p.level = 0
    return shape


def card(slide, x, y, w, h, title, body, accent=BLUE, fill=WHITE,
         title_size=16, body_size=13):
    rect(slide, x, y, w, h, fill=fill)
    rect(slide, x, y, 0.08, h, fill=accent, line=accent, radius=False, line_width=0)
    textbox(slide, title, x + 0.22, y + 0.18, w - 0.42, 0.38,
            size=title_size, color=INK, bold=True)
    if isinstance(body, list):
        add_bullets(slide, body, x + 0.24, y + 0.68, w - 0.46, h - 0.82,
                    size=body_size, color=MUTED, gap=5)
    else:
        textbox(slide, body, x + 0.24, y + 0.68, w - 0.46, h - 0.82,
                size=body_size, color=MUTED)


def base_slide(prs, title, section, number):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = BG
    rect(slide, 0, 0, SW, 0.12, fill=BLUE, line=BLUE, radius=False, line_width=0)
    textbox(slide, section.upper(), 0.63, 0.32, 4.2, 0.25,
            size=9, color=BLUE, bold=True)
    textbox(slide, title, 0.63, 0.68, 12.0, 0.52,
            size=25, color=NAVY, bold=True)
    line(slide, 0.65, 1.29, 12.68, 1.29, color=LINE, width=1)
    textbox(slide, "HIRESPHERE AI  •  REVIEW 2", 0.65, 7.13, 5.0, 0.18,
            size=8, color=MUTED, bold=True)
    textbox(slide, f"{number:02d} / 12", 11.6, 7.13, 1.0, 0.18,
            size=8, color=MUTED, align=PP_ALIGN.RIGHT)
    return slide


def image_contain(slide, path, x, y, w, h):
    with Image.open(path) as image:
        iw, ih = image.size
    scale = min(w / iw, h / ih)
    rw, rh = iw * scale, ih * scale
    return slide.shapes.add_picture(
        str(path), inch(x + (w - rw) / 2), inch(y + (h - rh) / 2),
        width=inch(rw), height=inch(rh)
    )


def add_number(slide, n, x, y, color=BLUE):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.OVAL, inch(x), inch(y), inch(0.38), inch(0.38)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.color.rgb = color
    textbox(slide, str(n), x, y + 0.005, 0.38, 0.30, size=12, color=WHITE,
            bold=True, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE, margin=0)


def add_hyperlink(paragraph, text, address, color=BLUE, size=11):
    run = paragraph.add_run()
    run.text = text
    run.font.name = "Aptos"
    run.font.size = Pt(size)
    run.font.bold = True
    run.font.color.rgb = color
    run.hyperlink.address = address
    return run


def process_box(slide, x, y, w, h, title, body="", accent=BLUE, fill=WHITE):
    rect(slide, x, y, w, h, fill=fill, line=LINE)
    textbox(slide, title, x + 0.10, y + 0.12, w - 0.20, 0.35,
            size=13, color=INK, bold=True, align=PP_ALIGN.CENTER,
            valign=MSO_ANCHOR.MIDDLE)
    if body:
        textbox(slide, body, x + 0.12, y + 0.52, w - 0.24, h - 0.60,
                size=10, color=MUTED, align=PP_ALIGN.CENTER,
                valign=MSO_ANCHOR.MIDDLE)
    rect(slide, x, y, w, 0.055, fill=accent, line=accent, radius=False, line_width=0)


def build_deck():
    prs = Presentation()
    prs.slide_width = inch(SW)
    prs.slide_height = inch(SH)
    blank = prs.slide_layouts[6]

    # 1. Cover
    s = prs.slides.add_slide(blank)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = NAVY
    rect(s, 0, 0, 0.18, SH, fill=CYAN, line=CYAN, radius=False, line_width=0)
    textbox(s, "MIT VISHWAPRAYAG UNIVERSITY  |  SOLAPUR", 0.85, 0.60, 8.5, 0.34,
            size=12, color=RGBColor(175, 198, 255), bold=True)
    textbox(s, "REVIEW 2  •  DESIGN & IMPLEMENTATION", 0.85, 1.08, 8.5, 0.3,
            size=10, color=CYAN, bold=True)
    textbox(s, "HireSphere AI", 0.80, 1.72, 10.9, 0.9,
            size=40, color=WHITE, bold=True)
    textbox(s, "AI-Powered Recruitment & Employee Management System",
            0.85, 2.72, 10.9, 0.62, size=22,
            color=RGBColor(220, 228, 242), bold=True)
    textbox(s, "An explainable resume-matching workflow with a unified HR workspace",
            0.87, 3.48, 10.4, 0.48, size=15, color=RGBColor(165, 181, 207))
    rect(s, 0.85, 4.42, 11.6, 1.55,
         fill=RGBColor(24, 36, 61), line=RGBColor(51, 69, 103))
    textbox(s, "PROJECT TEAM", 1.12, 4.66, 2.0, 0.24,
            size=10, color=CYAN, bold=True)
    names = [
        ("Vijayalaxmi Mhetri", 1.12),
        ("Sakshi Sable", 4.90),
        ("Pranavi Jadhav", 8.47),
    ]
    for name, x in names:
        textbox(s, name, x, 5.08, 3.2, 0.34, size=15, color=WHITE, bold=True)
    textbox(s, "Project Guide: Arindam Sir", 0.9, 6.42, 5.0, 0.3,
            size=12, color=RGBColor(190, 201, 219))
    textbox(s, "BCA  •  Department of Computer Applications",
            7.15, 6.42, 5.2, 0.3, size=11, color=RGBColor(190, 201, 219),
            align=PP_ALIGN.RIGHT)

    # 2. Review-1 requirements mapping
    s = base_slide(prs, "Review-1 Requirements → Review-2 Implementation",
                   "Requirement traceability", 2)
    table_shape = s.shapes.add_table(
        7, 4, inch(0.72), inch(1.55), inch(11.9), inch(4.28)
    )
    table = table_shape.table
    for idx, width in enumerate([0.85, 2.65, 6.95, 1.45]):
        table.columns[idx].width = inch(width)
    rows = [
        ("ID", "Requirement", "Implementation evidence in current build", "Status"),
        ("FR01", "User login", "Role-aware login/session and protected API routes", "In code"),
        ("FR02", "Job posting", "HR job create/edit and job lifecycle", "In code"),
        ("FR03", "Resume upload", "PDF checks, text extraction, private file storage", "In code"),
        ("FR04", "Resume analysis", "Text preparation and heuristic profile/skill extraction", "In code"),
        ("FR05", "Candidate matching", "TF-IDF cosine + required-skill overlap and evidence", "In code"),
        ("FR06", "Candidate ranking", "Job-specific application ranking by match score", "In code"),
    ]
    for r, values in enumerate(rows):
        table.rows[r].height = inch(0.38 if r == 0 else 0.56)
        for c, value in enumerate(values):
            cell = table.cell(r, c)
            cell.text = value
            cell.margin_left = inch(0.07)
            cell.margin_right = inch(0.07)
            cell.margin_top = inch(0.03)
            cell.margin_bottom = inch(0.02)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.fill.solid()
            cell.fill.fore_color.rgb = NAVY if r == 0 else (
                RGBColor(241, 245, 251) if r % 2 else WHITE
            )
            for p in cell.text_frame.paragraphs:
                p.font.name = "Aptos"
                p.font.size = Pt(9 if r else 9.5)
                p.font.bold = (r == 0 or c == 0 or c == 3)
                p.font.color.rgb = WHITE if r == 0 else (
                    TEAL if c == 3 else INK
                )
    textbox(s, "Scope note: the requirements PDF excludes employee management from its draft scope. The current build adds attendance and leave as an extension; confirm this scope change with the guide.",
            0.85, 5.98, 11.6, 0.46, size=10, color=INK, bold=True,
            align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)
    link_box = rect(s, 1.55, 6.50, 10.2, 0.40, fill=PALE_BLUE, line=PALE_BLUE)
    link_p = link_box.text_frame.paragraphs[0]
    link_p.alignment = PP_ALIGN.CENTER
    link_p.text = ""
    add_hyperlink(
        link_p, "Open Requirements & NFR Mapping (DOCX)",
        MAPPING_OUT.as_uri(), size=10
    )

    # 3. Architecture
    s = base_slide(prs, "System Architecture", "How the application is organized", 3)
    labels = [
        ("USERS", "Candidate\nHR / Admin\nEmployee", BLUE),
        ("WEB UI", "Next.js 16\nReact 19\nTypeScript", PURPLE),
        ("API & AUTH", "Next.js route handlers\nJWT session\nZod validation", TEAL),
        ("SERVICES", "PDF text extraction\nResume parsing\nMatch scoring", CYAN),
        ("DATA", "Prisma ORM\nSQLite database\nPrivate resume files", RGBColor(76, 97, 128)),
    ]
    xs = [0.62, 3.05, 5.48, 7.91, 10.34]
    for i, (head, body, accent) in enumerate(labels):
        process_box(s, xs[i], 2.35, 2.12, 2.35, head, body,
                    accent=accent, fill=WHITE)
        if i < len(labels) - 1:
            line(s, xs[i] + 2.14, 3.52, xs[i + 1] - 0.06, 3.52,
                 color=RGBColor(136, 153, 177), width=2, arrow=True)
    rect(s, 1.0, 5.25, 11.3, 0.92, fill=PALE_BLUE, line=PALE_BLUE)
    textbox(s, "Request flow", 1.25, 5.50, 1.6, 0.25,
            size=13, color=BLUE, bold=True)
    textbox(s, "Browser → role-checked API → business logic → database / protected file storage",
            3.0, 5.47, 8.95, 0.33, size=14, color=INK, bold=True,
            align=PP_ALIGN.CENTER)
    textbox(s, "Resume files are stored outside the public web directory and served through an authorized API.",
            1.0, 6.46, 11.3, 0.32, size=12, color=MUTED, align=PP_ALIGN.CENTER)

    # 4. Stack plus model choice, validation, and performance
    s = base_slide(prs, "Technology Stack & Model Evaluation Status",
                   "What is used—and what is not claimed", 4)
    card(s, 0.72, 1.48, 5.75, 1.52, "Frontend",
         ["Next.js 16, React 19, TypeScript",
          "Tailwind CSS and shadcn/ui"],
         accent=BLUE, body_size=12)
    card(s, 6.83, 1.48, 5.75, 1.52, "Backend & security",
         ["Next.js route handlers on Node.js",
          "Prisma, Zod, bcryptjs, jose JWT sessions"],
         accent=PURPLE, body_size=12)
    card(s, 0.72, 3.20, 5.75, 1.52, "Database & file storage",
         ["SQLite accessed through Prisma ORM",
          "Resume PDFs stored outside the public directory"],
         accent=TEAL, body_size=12)
    card(s, 6.83, 3.20, 5.75, 1.52, "Matching method",
         ["unpdf + TypeScript text processing",
          "TF-IDF cosine and a transparent skill dictionary"],
         accent=CYAN, body_size=12)
    rect(s, 0.80, 4.98, 11.72, 1.55, fill=WHITE, line=LINE)
    textbox(s, "MODEL CHOICE", 1.05, 5.16, 1.48, 0.23,
            size=9, color=BLUE, bold=True)
    textbox(s, "A deterministic baseline is lightweight and explainable. This build does not train an ML/DL classifier; the optional Kaggle dataset in the proposal was not used.",
            2.58, 5.13, 9.62, 0.36, size=10, color=INK)
    textbox(s, "VALIDATION & PERFORMANCE", 1.05, 5.71, 2.05, 0.24,
            size=9, color=TEAL, bold=True)
    textbox(s, "TC01–TC10 are planned, not passed results. Future measures: PDF extraction success, match time per resume, and precision/recall only on labelled data. None are measured yet.",
            3.12, 5.67, 9.03, 0.47, size=10, color=INK)

    # 5. Database / ER overview
    s = base_slide(prs, "Database Design & Core Relationships",
                   "Prisma relational schema", 5)
    groups = [
        ("CANDIDATE", "User → CandidateProfile → Resume", BLUE),
        ("RECRUITMENT", "Department → Job → Application", PURPLE),
        ("ANALYSIS", "Application → ResumeAnalysis\nApplication → Interview\nApplication → Status History", TEAL),
        ("EMPLOYEE", "Employee → Attendance / Leave\nEmployee → PerformanceReview", CYAN),
    ]
    gx = [0.70, 3.82, 6.94, 10.06]
    for i, (title, body, accent) in enumerate(groups):
        process_box(s, gx[i], 2.15, 2.55, 2.0, title, body,
                    accent=accent, fill=WHITE)
        if i < 3:
            line(s, gx[i] + 2.58, 3.14, gx[i + 1] - 0.07, 3.14,
                 color=RGBColor(153, 165, 184), width=1.6, arrow=True)
    rect(s, 0.78, 4.55, 11.75, 1.12, fill=WHITE, line=LINE)
    textbox(s, "19 Prisma models", 1.02, 4.78, 1.8, 0.25,
            size=14, color=BLUE, bold=True)
    textbox(s, "User • CandidateProfile • Resume • Department • Job • Application • ResumeAnalysis • Interview • ApplicationStatusHistory • Employee • Attendance • LeaveType • LeaveRequest • LeaveBalance • PerformanceReview • Notification • AuditLog • PasswordResetToken • SystemSetting",
            2.85, 4.69, 9.35, 0.74, size=10, color=INK,
            valign=MSO_ANCHOR.MIDDLE)
    textbox(s, "Database constraints help prevent duplicate applications and duplicate attendance entries for one employee and date.",
            0.92, 6.05, 11.5, 0.45, size=12, color=MUTED,
            align=PP_ALIGN.CENTER)
    textbox(s, "Current configuration: SQLite. A different production database would require explicit migration and testing.",
            1.0, 6.55, 11.3, 0.30, size=10, color=MUTED, italic=True,
            align=PP_ALIGN.CENTER)

    # 6. Matching algorithm
    s = base_slide(prs, "Explainable Resume Matching", "Deterministic NLP workflow", 6)
    steps = [
        ("01", "Prepare text", "Extract resume PDF text and normalize it."),
        ("02", "Compare text", "Build TF-IDF vectors and calculate cosine similarity."),
        ("03", "Check required skills", "Count required skills found in the resume."),
        ("04", "Explain the result", "Save the score, evidence, and missing skills."),
    ]
    sx = [0.78, 3.90, 7.02, 10.14]
    for i, (n, title, body) in enumerate(steps):
        rect(s, sx[i], 2.04, 2.42, 2.15, fill=WHITE)
        add_number(s, n, sx[i] + 0.17, 2.23, color=[BLUE, PURPLE, TEAL, CYAN][i])
        textbox(s, title, sx[i] + 0.18, 2.79, 2.05, 0.42,
                size=14, color=INK, bold=True, align=PP_ALIGN.CENTER)
        textbox(s, body, sx[i] + 0.19, 3.25, 2.02, 0.65,
                size=11, color=MUTED, align=PP_ALIGN.CENTER)
        if i < 3:
            line(s, sx[i] + 2.44, 3.10, sx[i + 1] - 0.10, 3.10,
                 color=RGBColor(153, 165, 184), width=1.7, arrow=True)
    rect(s, 1.05, 4.63, 11.2, 0.80, fill=PALE_BLUE, line=PALE_BLUE)
    textbox(s, "Default final score = 0.6 × text similarity + 0.4 × required-skill overlap",
            1.25, 4.87, 10.8, 0.28, size=16, color=NAVY, bold=True,
            align=PP_ALIGN.CENTER)
    textbox(s, "Weights are configurable. If the job has no required skills, the score uses text similarity alone.",
            1.2, 5.62, 10.9, 0.28, size=11, color=MUTED,
            align=PP_ALIGN.CENTER)
    textbox(s, "A match score is not a hiring probability. HR reviews the evidence and makes every hiring decision; the system does not auto-reject.",
            1.0, 6.08, 11.3, 0.52, size=13, color=TEAL, bold=True,
            align=PP_ALIGN.CENTER)

    # 7. Workflow diagrams
    s = base_slide(prs, "Core Workflow Diagrams", "Registration, resume upload, and hiring", 7)
    rows = [
        ("A  CANDIDATE ACCOUNT", ["Enter details", "Validate input", "Create account\n& profile"],
         BLUE, PALE_BLUE),
        ("B  RESUME & APPLICATION", ["Choose PDF", "Validate & extract\ntext", "Apply to an\nopen job"],
         TEAL, PALE_TEAL),
        ("C  MATCH & HIRE", ["Calculate score\n& evidence", "HR reviews;\ninterview / decide", "If hired, create\nemployee record"],
         PURPLE, PALE_PURPLE),
    ]
    for ridx, (label, nodes, accent, tint) in enumerate(rows):
        y = 1.68 + ridx * 1.56
        rect(s, 0.78, y, 11.78, 1.30, fill=WHITE, line=LINE)
        textbox(s, label, 1.02, y + 0.12, 2.28, 0.25,
                size=10, color=accent, bold=True)
        start_x = 3.38
        for j, node in enumerate(nodes):
            x = start_x + j * 2.92
            rect(s, x, y + 0.41, 2.35, 0.65, fill=tint, line=tint)
            textbox(s, node, x + 0.06, y + 0.47, 2.23, 0.50,
                    size=11, color=INK, bold=True, align=PP_ALIGN.CENTER,
                    valign=MSO_ANCHOR.MIDDLE)
            if j < len(nodes) - 1:
                line(s, x + 2.37, y + 0.74, x + 2.83, y + 0.74,
                     color=accent, width=1.6, arrow=True)
    rect(s, 1.03, 6.48, 11.25, 0.38, fill=PALE_AMBER, line=PALE_AMBER)
    textbox(s, "The score informs review only. Pipeline status changes are made by an authorized human reviewer.",
            1.18, 6.53, 10.95, 0.24, size=10, color=INK, bold=True,
            align=PP_ALIGN.CENTER)

    # 8. Implementation progress
    s = base_slide(prs, "Implementation Progress & Repository",
                   "Code status and review evidence", 8)
    textbox(s, "Presenter: Pranavi Jadhav  •  Rubric area: Implementation progress (5M)",
            6.25, 1.35, 6.0, 0.20, size=9, color=PURPLE, bold=True,
            align=PP_ALIGN.RIGHT)
    card(s, 0.72, 1.60, 5.75, 2.05, "Core recruitment workflow",
         ["Auth and role checks; job management",
          "Resume upload, text extraction, matching and ranking",
          "Application status workflow"],
         accent=BLUE, body_size=12)
    card(s, 6.83, 1.60, 5.75, 2.05, "Extended employee modules",
         ["Employee records and hire conversion",
          "Attendance, leave and performance areas",
          "These extend the proposal’s recruitment-only draft scope"],
         accent=PURPLE, body_size=12)
    card(s, 0.72, 3.92, 5.75, 1.92, "Project organization",
         ["src/app: UI and API routes",
          "src/lib: shared logic and matching",
          "prisma/: database schema; docs/: design notes"],
         accent=TEAL, body_size=11)
    card(s, 6.83, 3.92, 5.75, 1.92, "Verification still needed",
         ["Run and record proposal tests TC01–TC10",
          "Demonstrate the required completion level live",
          "Do not report an unmeasured completion percentage"],
         accent=RGBColor(230, 160, 45), body_size=11)
    repo_box = rect(s, 1.05, 6.12, 11.2, 0.43, fill=PALE_BLUE, line=PALE_BLUE)
    repo_p = repo_box.text_frame.paragraphs[0]
    repo_p.alignment = PP_ALIGN.CENTER
    repo_p.text = ""
    add_hyperlink(
        repo_p, "GitHub project repository",
        "https://github.com/pranavi5774-lang/AI-Powered-Recruitment-System",
        size=10
    )
    textbox(s, "Repository link is provided for review; commit frequency and test pass rates are not asserted in this slide.",
            1.0, 6.64, 11.3, 0.20, size=9, color=MUTED,
            align=PP_ALIGN.CENTER, italic=True)

    # 9. Website screenshots - public pages
    s = base_slide(prs, "Website Screenshots: Public Experience", "Implemented interface", 9)
    textbox(s, "Presenter: Pranavi Jadhav  •  Rubric area: UI screens (5M track)",
            6.25, 1.35, 6.0, 0.20, size=9, color=PURPLE, bold=True,
            align=PP_ALIGN.RIGHT)
    rect(s, 0.72, 1.62, 7.55, 4.95, fill=WHITE, line=LINE)
    rect(s, 8.57, 1.62, 4.02, 4.95, fill=WHITE, line=LINE)
    textbox(s, "Landing page", 0.96, 1.83, 6.9, 0.30, size=15, color=INK, bold=True)
    textbox(s, "Sign-in page", 8.82, 1.83, 3.55, 0.30, size=15, color=INK, bold=True)
    image_contain(s, ASSETS / "website_landing_browser.png", 0.98, 2.30, 7.02, 3.80)
    image_contain(s, ASSETS / "website_login_redacted.png", 8.85, 2.28, 3.45, 3.80)
    textbox(s, "Public project landing screen", 1.0, 6.23, 6.95, 0.22,
            size=10, color=MUTED, align=PP_ALIGN.CENTER)
    textbox(s, "Fields shown without credentials", 8.82, 6.23, 3.5, 0.22,
            size=10, color=MUTED, align=PP_ALIGN.CENTER)

    # 10. Website screenshots - HR pages
    s = base_slide(prs, "Website Screenshots: HR Workspace", "Implemented interface", 10)
    textbox(s, "Presenter: Pranavi Jadhav  •  Rubric area: UI screens (5M track)",
            6.25, 1.35, 6.0, 0.20, size=9, color=PURPLE, bold=True,
            align=PP_ALIGN.RIGHT)
    rect(s, 0.72, 1.62, 5.85, 4.95, fill=WHITE, line=LINE)
    rect(s, 6.78, 1.62, 5.82, 4.95, fill=WHITE, line=LINE)
    textbox(s, "HR dashboard", 0.98, 1.83, 5.34, 0.30, size=15, color=INK, bold=True)
    textbox(s, "Job management", 7.04, 1.83, 5.30, 0.30, size=15, color=INK, bold=True)
    image_contain(s, ASSETS / "website_hr_dashboard_live.png", 0.97, 2.27, 5.35, 3.82)
    image_contain(s, ASSETS / "website_hr_jobs_live.png", 7.03, 2.27, 5.32, 3.82)
    textbox(s, "Overview and recruiter actions", 1.0, 6.23, 5.28, 0.22,
            size=10, color=MUTED, align=PP_ALIGN.CENTER)
    textbox(s, "Openings and draft jobs", 7.05, 6.23, 5.25, 0.22,
            size=10, color=MUTED, align=PP_ALIGN.CENTER)
    textbox(s, "Screenshots contain project/demo data; counts are not presented as production results.",
            1.0, 6.66, 11.3, 0.20, size=9, color=MUTED,
            align=PP_ALIGN.CENTER, italic=True)

    # 11. Demo plan and limitations
    s = base_slide(prs, "Live Demonstration & Current Boundaries",
                   "Evaluation walkthrough", 11)
    card(s, 0.72, 1.67, 7.25, 4.90, "Suggested demonstration",
         ["Sign in using a role-appropriate account.",
          "Open or create a job and review its requirements.",
          "Show candidate resume upload and application flow.",
          "Inspect text-match score, skill evidence, and missing skills.",
          "Update the application status as HR, then show employee tools."],
         accent=BLUE, body_size=14)
    card(s, 8.32, 1.67, 4.27, 4.90, "Be clear about limits",
         ["Scoring is deterministic and advisory.",
          "Scanned image-only PDFs may not provide extractable text.",
          "The current database configuration is SQLite.",
          "No independent speed or accuracy benchmark is claimed."],
         accent=RGBColor(230, 160, 45), fill=WHITE, body_size=13)

    # 12. Team and close
    s = base_slide(prs, "Team Responsibilities & Conclusion", "Thank you", 12)
    members = [
        ("Vijayalaxmi Mhetri", "Coordinate agreed work; UI, documentation, and testing as assigned", BLUE),
        ("Sakshi Sable", "Backend, data handling, testing, and integration as assigned", PURPLE),
        ("Pranavi Jadhav", "UI screens (5M rubric track) and implementation progress (5M); resume/matching UI as assigned", TEAL),
    ]
    for i, (name, role, accent) in enumerate(members):
        x = 0.72 + i * 4.04
        rect(s, x, 2.03, 3.75, 2.02, fill=WHITE, line=LINE)
        rect(s, x, 2.03, 3.75, 0.10, fill=accent, line=accent, radius=False, line_width=0)
        textbox(s, name, x + 0.18, 2.40, 3.38, 0.42,
                size=16, color=NAVY, bold=True, align=PP_ALIGN.CENTER)
        textbox(s, role, x + 0.27, 2.97, 3.20, 0.92,
                size=10 if i == 2 else 12, color=MUTED, align=PP_ALIGN.CENTER,
                valign=MSO_ANCHOR.MIDDLE)
    rect(s, 1.10, 4.65, 11.12, 1.10, fill=PALE_BLUE, line=PALE_BLUE)
    textbox(s, "HireSphere AI brings resume review and employee workflows into one explainable platform.",
            1.35, 4.96, 10.62, 0.42, size=17, color=NAVY, bold=True,
            align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)
    textbox(s, "Thank you  •  Questions?", 1.0, 6.08, 11.3, 0.42,
            size=22, color=BLUE, bold=True, align=PP_ALIGN.CENTER)
    textbox(s, "Suggested task allocation from the project plan—confirm or edit to match each member’s actual contribution.",
            1.0, 6.70, 11.3, 0.20, size=9, color=MUTED,
            align=PP_ALIGN.CENTER, italic=True)

    prs.save(PPT_OUT)
    return prs


FR_MAPPING = [
    ("FR01", "User login",
     "Role-aware login/session and protected API routes",
     "Present in code; execute TC01–TC02 to verify."),
    ("FR02", "Job posting",
     "HR job create/edit and job lifecycle",
     "Present in code; verify create/edit scenarios."),
    ("FR03", "Resume upload",
     "PDF type/size/signature checks, extraction, private file storage",
     "Present in code; run valid and invalid file cases."),
    ("FR04", "Resume analysis",
     "Readable text, heuristic extraction, and skill identification",
     "Present in code; extraction is not guaranteed for scans."),
    ("FR05", "Candidate matching",
     "TF-IDF cosine plus required-skill overlap and explanation",
     "Present in code; no trained model or accuracy claim."),
    ("FR06", "Candidate ranking",
     "Job-specific application ranking by match score",
     "Present in code; verify sort/filter behavior."),
]

NFR_MAPPING = [
    ("NFR01 Security",
     "bcrypt password hashes, JWT httpOnly sessions, role checks and input validation are implemented in code.",
     "Run authorized and unauthorized access tests; no independent security audit is claimed."),
    ("NFR02 Privacy",
     "Resume files are stored outside the public directory and retrieved through an authorized API.",
     "Verify access restrictions with candidate/HR roles before the review."),
    ("NFR03 Usability",
     "Role-based web views and responsive UI are present; screenshots are included in the deck.",
     "Screenshots demonstrate screens, not a formal usability study."),
    ("NFR04 Performance",
     "No measured latency, throughput, extraction success, precision, or recall result was provided.",
     "Record extraction success and time per resume; report precision/recall only with a labelled evaluation set."),
    ("NFR05 Reliability",
     "Validation and explicit PDF parse errors are implemented.",
     "Run TC03–TC07 and record actual outcomes; planned cases are not test results."),
    ("NFR06 Maintainability",
     "Code is separated into app routes, shared libraries, Prisma schema, and docs.",
     "Review folder organization and Git history with the project guide."),
]


def build_mapping_doc():
    doc = Document()
    section = doc.sections[0]
    section.top_margin = DocInches(0.65)
    section.bottom_margin = DocInches(0.65)
    section.left_margin = DocInches(0.65)
    section.right_margin = DocInches(0.65)
    doc.styles["Normal"].font.name = "Aptos"
    doc.styles["Normal"].font.size = DocPt(9)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("HireSphere AI")
    r.bold = True
    r.font.size = DocPt(22)
    r.font.color.rgb = DocRGB(15, 23, 42)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Review-2 Requirements & Implementation Mapping")
    r.bold = True
    r.font.size = DocPt(14)
    r.font.color.rgb = DocRGB(55, 105, 245)
    p = doc.add_paragraph(
        "Sources: Updated_AI_Powered_Recruitment_System.pdf (requirements/plan), "
        "Review-2 presentation guidelines, Review-2 design and implementation rubric, "
        "and the current project code."
    )
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_heading("1. Scope reconciliation", level=1)
    doc.add_paragraph(
        "The supplied requirements document describes a recruitment-focused proposal "
        "and explicitly lists employee records, attendance, leave, and payroll as out "
        "of scope for that draft. The current HireSphere AI code and screenshots also "
        "include employee records, attendance, leave, and performance features. Treat "
        "these as implementation extensions, not as approved baseline requirements, "
        "until the project guide confirms the scope."
    )

    doc.add_heading("2. Functional requirement traceability", level=1)
    table = doc.add_table(rows=1, cols=4)
    table.style = "Table Grid"
    for cell, label in zip(table.rows[0].cells, [
        "ID", "Requirement", "Current implementation evidence", "Verification status"
    ]):
        cell.text = label
    for row in FR_MAPPING:
        cells = table.add_row().cells
        for cell, value in zip(cells, row):
            cell.text = value
    doc.add_paragraph(
        "“Present in code” means implementation paths are present in the repository. "
        "It does not mean the planned test case has passed. Record test evidence before "
        "making pass-rate or completion claims."
    )

    doc.add_heading("3. Non-functional requirement mapping", level=1)
    table = doc.add_table(rows=1, cols=3)
    table.style = "Table Grid"
    for cell, label in zip(table.rows[0].cells, [
        "Requirement", "Current code/design evidence", "Remaining verification"
    ]):
        cell.text = label
    for row in NFR_MAPPING:
        cells = table.add_row().cells
        for cell, value in zip(cells, row):
            cell.text = value

    doc.add_heading("4. Model, data, and evaluation disclosure", level=1)
    for item in [
        "The implemented matcher is deterministic: TF-IDF cosine similarity and a required-skill overlap score, with configurable default weights of 0.6 and 0.4.",
        "The project does not train an ML/DL classifier. The optional Kaggle resume-category dataset named in the proposal was not used for model training.",
        "The rubric permits database design or UI layouts for projects that use those components. The deck therefore emphasizes the implemented database and interface, while clearly disclosing that no model-training or accuracy result exists.",
        "The proposal lists TC01–TC10 as planned scenarios. Do not mark them Pass until they are executed and recorded. No latency, throughput, extraction success, precision, recall, or matching-accuracy benchmark is claimed.",
        "Example quality checks for future evaluation: valid/invalid login, PDF acceptance/rejection, expected matched/missing skills on labelled sample resumes, role-based access, ranking order, and status updates.",
    ]:
        doc.add_paragraph(item, style="List Bullet")

    doc.add_heading("5. Review-2 evidence checklist", level=1)
    for item in [
        "Updated layered architecture: included in slide 3.",
        "Requirements mapping and Word-document link: included in slide 2.",
        "Model choice, training/evaluation disclosure, and performance-measurement caveat: included in slide 4.",
        "Database design and relationships: included in slide 5.",
        "Matching algorithm and major workflows: included in slides 6–7.",
        "Implementation progress, repository link, screenshots, and demo plan: included in slides 8–11.",
        "Individual team contribution slide: included in slide 12; confirm the suggested task split against actual work.",
    ]:
        doc.add_paragraph(item, style="List Bullet")

    doc.add_heading("Project repository", level=1)
    doc.add_paragraph("https://github.com/pranavi5774-lang/AI-Powered-Recruitment-System")
    doc.save(MAPPING_OUT)
    return doc


SCRIPT = [
    ("Slide 1 — Opening", "Vijayalaxmi Mhetri",
     "Good morning. We are presenting HireSphere AI, our AI-powered recruitment and employee management system. This is our Review 2 presentation about the system design and implementation. Our team members are Vijayalaxmi Mhetri, Sakshi Sable, and Pranavi Jadhav. Our project guide is Arindam Sir."),
    ("Slide 2 — Requirement mapping", "Vijayalaxmi Mhetri",
     "The first project document lists six main requirements: login, job posting, resume upload, resume analysis, candidate matching, and candidate ranking. The current code has implementation paths for these features. This is not the same as saying every planned test has passed. The original draft excludes employee management, while our current build has added employee features. We should confirm this scope extension with our guide. The Word mapping document is linked on this slide."),
    ("Slide 3 — System architecture", "Vijayalaxmi Mhetri",
     "The candidate, HR, administrator, and employee use the web interface. The Next.js application sends requests to its API routes. The API checks access and validates input before using the project services. Prisma connects the application to SQLite, while resume files are stored outside the public website folder."),
    ("Slide 4 — Technology, model, and evaluation", "Sakshi Sable",
     "The application uses Next.js, React, TypeScript, Prisma, and SQLite. The matching method uses TF-IDF cosine similarity and a required-skill dictionary. We chose this deterministic method because it is light and easy to explain. We did not train an ML or deep-learning classifier, and we did not use the optional Kaggle dataset for training. The test cases in our plan still need to be run and recorded. We do not claim measured accuracy or processing speed."),
    ("Slide 5 — Database design", "Sakshi Sable",
     "The database schema has nineteen Prisma models. These models cover users, candidates, resumes, jobs, applications, analysis results, interviews, employees, attendance, and leave. Related records are connected through database relationships. Unique rules help prevent a candidate applying twice to the same job and prevent duplicate attendance records for one employee on the same date."),
    ("Slide 6 — Resume matching", "Pranavi Jadhav",
     "First, the system extracts text from a resume PDF. It then compares the resume and job text using TF-IDF and cosine similarity. It also checks the required skills and records evidence for skills it finds. The default score combines text similarity at sixty percent and skill overlap at forty percent. These weights can be configured. This score is not a probability of success and never rejects a candidate automatically."),
    ("Slide 7 — Workflow diagrams", "Pranavi Jadhav",
     "This slide shows three workflows. A candidate first enters account details, which are validated before the account is created. The resume flow checks the PDF and extracts its text before an application is submitted. The system calculates a match score, then HR reviews the evidence and makes decisions. If a candidate is hired, HR can create an employee record."),
    ("Slide 8 — Implementation progress (5M rubric area)", "Pranavi Jadhav",
     "This slide presents the implementation progress section, which carries five marks in the rubric. The project code includes authentication, job management, resume processing, matching, ranking, application status, and employee workflows. The repository link is shown here. The proposal's test cases are planned, so we must run them and save the actual results. We should demonstrate working features and report completion only with evidence."),
    ("Slide 9 — Public website screens (UI screens 5M track)", "Pranavi Jadhav",
     "Here are screenshots of the public landing page and the sign-in page. The landing page introduces the project. The sign-in screen accepts an account email and password. The screenshot does not show real credentials."),
    ("Slide 10 — HR screens (UI screens 5M track)", "Pranavi Jadhav",
     "This is the HR dashboard and job management screen. The dashboard provides a starting point for recruiter actions. The jobs page shows openings and draft jobs. The figures shown in the screenshot are project or demo data, not production results."),
    ("Slide 11 — Live demonstration", "Pranavi Jadhav",
     "For the demonstration, we will sign in, open a job, and show how a candidate uploads a resume and applies. Then we will look at the score, matched skills, and missing skills. HR can update the application status and show the employee tools. Image-only or scanned PDFs may not contain text the parser can extract, and the current database setup uses SQLite."),
    ("Slide 12 — Contributions and questions", "All members",
     "The rubric gives five marks to implementation progress and five marks to one selected area such as UI screens, database design, or model evaluation. We selected the UI screens track, because our project does not train a model. Pranavi presents the UI screens and implementation progress sections. The suggested task allocation still needs to match each member's actual completed work. To conclude, HireSphere AI combines recruitment and employee workflows with an explainable match score. A human reviewer makes the hiring decision. Thank you. We are ready for questions."),
]


def build_script():
    doc = Document()
    section = doc.sections[0]
    section.top_margin = DocInches(0.7)
    section.bottom_margin = DocInches(0.7)
    section.left_margin = DocInches(0.8)
    section.right_margin = DocInches(0.8)
    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = DocPt(11)
    normal.font.color.rgb = DocRGB(35, 47, 68)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("HireSphere AI")
    run.bold = True
    run.font.size = DocPt(24)
    run.font.color.rgb = DocRGB(15, 23, 42)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("Review 2 — Simple English Presentation Script")
    run.font.size = DocPt(14)
    run.font.color.rgb = DocRGB(55, 105, 245)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run("Speakers: Vijayalaxmi Mhetri • Sakshi Sable • Pranavi Jadhav")

    doc.add_paragraph(
        "Speaking order is assigned by slide. Change any speaker or wording to match "
        "your actual project work and your preferred speaking style."
    )
    for heading, speaker, text in SCRIPT:
        doc.add_heading(heading, level=1)
        p = doc.add_paragraph()
        r = p.add_run(f"Presenter: {speaker}")
        r.bold = True
        r.font.color.rgb = DocRGB(55, 105, 245)
        doc.add_paragraph(text)

    doc.save(SCRIPT_OUT)
    return doc


def verify_outputs(prs):
    assert len(prs.slides) == 12, f"Expected 12 slides; found {len(prs.slides)}"
    all_text = "\n".join(
        shape.text
        for slide in prs.slides
        for shape in slide.shapes
        if shape.has_text_frame
    )
    forbidden = ["INSERT ", "PLACEHOLDER", "[Insert", "editable contribution table"]
    for marker in forbidden:
        assert marker.lower() not in all_text.lower(), f"Unresolved slide placeholder: {marker}"
    assert all((ASSETS / name).is_file() for name in [
        "website_landing_browser.png", "website_login_redacted.png",
        "website_hr_dashboard_live.png", "website_hr_jobs_live.png",
    ])
    pic_count = sum(
        1 for slide in prs.slides for shape in slide.shapes
        if shape.shape_type == 13
    )
    assert pic_count == 4, f"Expected 4 website screenshots; found {pic_count}"
    assert PPT_OUT.is_file() and PPT_OUT.stat().st_size > 50_000
    assert SCRIPT_OUT.is_file() and SCRIPT_OUT.stat().st_size > 10_000
    assert MAPPING_OUT.is_file() and MAPPING_OUT.stat().st_size > 10_000


if __name__ == "__main__":
    missing = [p for p in [
        ASSETS / "website_landing_browser.png",
        ASSETS / "website_login_redacted.png",
        ASSETS / "website_hr_dashboard_live.png",
        ASSETS / "website_hr_jobs_live.png",
    ] if not p.is_file()]
    if missing:
        raise FileNotFoundError("Required screenshot assets are missing: " +
                                ", ".join(str(p) for p in missing))
    build_mapping_doc()
    deck = build_deck()
    build_script()
    verify_outputs(deck)
    print(f"Created: {PPT_OUT}")
    print(f"Created: {SCRIPT_OUT}")
    print(f"Created: {MAPPING_OUT}")
    print(f"Verified: {len(deck.slides)} slides, no placeholders, 4 screenshots")
