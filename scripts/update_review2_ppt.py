from pathlib import Path

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_AUTO_SIZE, PP_ALIGN
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor


SOURCE = Path(
    r"C:\Users\JADHAV\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm"
    r"\LocalState\sessions\9FDEB90792F20569DCF8429B5001F064569A909F"
    r"\transfers\2026-46\AI_Powered_Employee_Management_System_Review_2.pptx"
)
OUTPUT = Path.home() / "Downloads" / "HireSphere_AI_Review_2_Final.pptx"
ARCHITECTURE = Path(
    r"C:\Users\JADHAV\AppData\Roaming\Code\agentSessionData\ff661b7c-fef7-45e0-b186-d5675ac8bfc6"
    r"\attachments\7af57f2b-8048-4541-8d5e-00891da12360\Pasted Image.png"
)
LOGO = Path(__file__).resolve().parents[1] / "extracted_review1_images" / "slide_1_img_0_1.png"


def remove_shape(shape):
    shape._element.getparent().remove(shape._element)


def set_shape_text(shape, text):
    frame = shape.text_frame
    frame.word_wrap = True
    paragraph = frame.paragraphs[0]
    if paragraph.runs:
        run = paragraph.runs[0]
        run.text = text
        for extra_run in paragraph.runs[1:]:
            extra_run._r.getparent().remove(extra_run._r)
    else:
        paragraph.text = text
    for extra_paragraph in frame.paragraphs[1:]:
        extra_paragraph._p.getparent().remove(extra_paragraph._p)
    frame.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE


def add_text(slide, value, x, y, w, h, size=13, color=(30, 41, 59), bold=False):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = shape.text_frame
    frame.clear()
    frame.word_wrap = True
    frame.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
    frame.margin_left = Inches(0.06)
    frame.margin_right = Inches(0.06)
    frame.margin_top = Inches(0.04)
    frame.margin_bottom = Inches(0.04)
    paragraph = frame.paragraphs[0]
    paragraph.text = value
    paragraph.font.name = "Arial"
    paragraph.font.size = Pt(size)
    paragraph.font.bold = bold
    paragraph.font.color.rgb = RGBColor(*color)
    return shape


def add_card(slide, x, y, w, h, title, body):
    card = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(x),
        Inches(y),
        Inches(w),
        Inches(h),
    )
    card.fill.solid()
    card.fill.fore_color.rgb = RGBColor(255, 255, 255)
    card.line.color.rgb = RGBColor(205, 218, 237)
    card.line.width = Pt(1)
    add_text(slide, title, x + 0.18, y + 0.14, w - 0.36, 0.32, 13, (27, 72, 150), True)
    add_text(slide, body, x + 0.18, y + 0.52, w - 0.36, h - 0.62, 10, (50, 60, 75))


def replace_text(slide, old_fragment, new_text):
    for shape in slide.shapes:
        if hasattr(shape, "text") and old_fragment in shape.text:
            set_shape_text(shape, shape.text.replace(old_fragment, new_text))
            return


def replace_largest_picture(slide, image_path):
    candidates = [
        shape
        for shape in slide.shapes
        if getattr(shape, "shape_type", None) == 13
    ]
    if not candidates:
        return

    picture = max(candidates, key=lambda shape: shape.width * shape.height)
    left, top, width, height = (
        picture.left,
        picture.top,
        picture.width,
        picture.height,
    )
    remove_shape(picture)
    slide.shapes.add_picture(
        str(image_path),
        left,
        top,
        width=width,
        height=height,
    )


if not SOURCE.exists():
    raise FileNotFoundError(SOURCE)

presentation = Presentation(str(SOURCE))

# Slide 1
slide = presentation.slides[0]
if LOGO.exists():
    slide.shapes.add_picture(str(LOGO), Inches(10.75), Inches(0.08), width=Inches(1.55))
replace_text(slide, "AI - Powered Employee Management System",
             "AI-Powered Recruitment & Employee Management System")
replace_text(slide, "Dr. Arindam Sarkar", "Dr. Arindam Sarkar")

# Slides 2-19: repeat the MIT logo in the existing header area.
if LOGO.exists():
    for slide in list(presentation.slides)[1:]:
        slide.shapes.add_picture(str(LOGO), Inches(10.0), Inches(0.04), width=Inches(0.95))

# Slide 2
slide = presentation.slides[1]
replace_text(
    slide,
    "To develop an AI-powered employee management system that centralizes employee information and supports HR activities such as attendance, leave, and performance tracking through data-driven insights.",
    "To develop a unified recruitment and employee management system that automates "
    "resume screening and supports secure HR workflows.",
)
replace_text(
    slide,
    "Reduce manual record-keeping, improve access to employee information, and help HR/Admin make informed decisions while keeping final decisions under human control.",
    "Reduce manual resume review and record-keeping while keeping final hiring and HR "
    "decisions under human control.",
)
replace_text(
    slide,
    "•  Provide secure role-based access for Admin, HR and Employee.\n"
    "•  Maintain centralized employee profiles and department details.\n"
    "•  Record attendance and manage leave requests and approvals.\n"
    "•  Track performance information and generate HR dashboard summaries.\n"
    "•  Use AI/ML-based analytics to identify patterns and provide decision-support insights.",
    "•  Secure role-based access for Admin, HR, Candidate and Employee.\n"
    "•  Parse resumes and match candidates to job requirements with explainable AI.\n"
    "•  Manage jobs, applications, shortlisting, interviews and hiring.\n"
    "•  Convert hires into employee records and manage attendance, leave and performance.\n"
    "•  Provide dashboards, reports, notifications and audit history.",
)

# Slide 5
slide = presentation.slides[4]
replace_text(
    slide,
    "An integrated web-based platform focused only on employee management.",
    "An integrated web-based platform for recruitment, employee operations and explainable AI decision support.",
)
replace_text(slide, "Employee Profiles", "Jobs & Recruitment")
replace_text(
    slide,
    "Create, view and update employee details.",
    "Post jobs, review applications and track candidate stages.",
)
replace_text(slide, "Attendance", "AI Resume Matching")
replace_text(
    slide,
    "Record daily attendance and view attendance summaries.",
    "Extract resume text and compare it with job requirements.",
)
replace_text(slide, "Leave Management", "Candidate Ranking")
replace_text(
    slide,
    "Submit, review and track leave requests and balances.",
    "Rank applicants with explainable scores and evidence.",
)
replace_text(
    slide,
    "Maintain review records and performance indicators.",
    "Convert successful candidates into employee records.",
)
replace_text(slide, "Performance", "Employee Conversion")
replace_text(slide, "AI Insights", "Attendance & Leave")
replace_text(
    slide,
    "Summarize patterns and flag records for HR review.",
    "Record attendance and manage leave requests and approvals.",
)
replace_text(slide, "HR Dashboard", "HR Dashboard & Reports")
replace_text(
    slide,
    "Show employee count, attendance, leave and performance summaries.",
    "Track recruitment progress and employee operations in one place.",
)

# Slide 8: architecture
slide = presentation.slides[7]
replace_text(
    slide,
    "Proposed architecture for the employee-management-only scope.",
    "Updated layered architecture for recruitment and employee-management workflows.",
)
replace_text(slide, "PRESENTATION LAYER  |  HTML • CSS • JavaScript • Bootstrap",
             "PRESENTATION LAYER  |  Next.js • React • TypeScript • Tailwind CSS")
replace_text(slide, "APPLICATION LAYER  |  Python Flask • Authentication • Role-based access • Validation",
             "APPLICATION LAYER  |  Next.js REST APIs • JWT • RBAC • Zod validation")
replace_text(slide, "EMPLOYEE MODULES  |  Profiles  •  Attendance  •  Leave  •  Performance  •  HR Dashboard",
             "CORE MODULES  |  Recruitment  •  Resume AI  •  Employees  •  Attendance  •  Leave")
replace_text(slide, "AI / ANALYTICS LAYER  |  Pandas • Scikit-learn\nTrend analysis & decision support",
             "AI / ANALYSIS LAYER  |  TF-IDF • Cosine Similarity • Skill Dictionary • PDF Parser")
replace_text(slide, "DATA LAYER  |  MySQL\nEmployee • Attendance • Leave • Performance",
             "DATA LAYER  |  Prisma ORM • SQLite / MySQL-ready")
replace_text(slide, "Data flow: User → Web UI → Flask services → Database / Analytics → Dashboard response",
             "Data flow: Browser ? Next.js APIs ? AI / Services ? Prisma ? Database")
if ARCHITECTURE.exists():
    keep_fragments = (
        "SCHOOL OF COMPUTING",
        "MINOR PROJECT",
        "Updated System Architecture",
        "Updated layered architecture",
        "School of Computing",
    )
    for shape in list(slide.shapes):
        if getattr(shape, "shape_type", None) == 13:
            continue
        text_value = getattr(shape, "text", "")
        if hasattr(shape, "text") and text_value.strip() and not any(
            fragment in text_value for fragment in keep_fragments
        ):
            remove_shape(shape)
        elif getattr(shape, "shape_type", None) == 1:
            remove_shape(shape)
    slide.shapes.add_picture(
        str(ARCHITECTURE),
        Inches(0.75),
        Inches(1.52),
        width=Inches(11.83),
        height=Inches(5.35),
    )

# Slide 11
slide = presentation.slides[10]
replace_text(
    slide,
    "ATTENDANCE",
    "RECRUITMENT",
)
replace_text(
    slide,
    "Login → Select date → Validate employee → Save status → Update summary",
    "Post job ? Candidate applies ? Resume analyzed ? HR reviews ? Interview ? Hire",
)
replace_text(slide, "LEAVE WORKFLOW", "EMPLOYEE OPS")
replace_text(
    slide,
    "Employee submits request → HR reviews → Approve / Reject → Update status",
    "Convert hire ? Employee profile ? Attendance ? Leave ? Performance",
)
replace_text(slide, "AI INSIGHT", "AI MATCHING")
replace_text(
    slide,
    "Load authorized records → Clean data → Calculate indicators → Show insight → HR reviews",
    "Upload PDF ? Extract text ? TF-IDF + skills ? Explainable score ? HR decides",
)

# Slide 9: UI wireframes
slide = presentation.slides[8]
replace_text(
    slide,
    "Conceptual wireframes for Review 2; replace with actual application screenshots as implementation progresses.",
    "Conceptual UI wireframes aligned to the implemented HireSphere AI workflows.",
)
replace_text(slide, "TalentFlow HR Dashboard", "HireSphere AI HR Dashboard")

# Slide 10: database design
slide = presentation.slides[9]
replace_text(
    slide,
    "Proposed relational database structure; finalize fields and constraints during implementation.",
    "Implemented relational database structure using Prisma ORM.",
)
replace_text(
    slide,
    "Relationships: Employee 1—M Attendance | Employee 1—M LeaveRequests | Employee 1—M Performance",
    "Key relations: User 1:M Applications | Job 1:M Applications | Employee 1:M Attendance, Leave and Performance",
)

# Slide 14: implementation progress
slide = presentation.slides[13]
replace_text(
    slide,
    "Review 2 midway status — update each item with the latest working evidence before presentation.",
    "Implemented feature set in the current HireSphere AI project.",
)
replace_text(
    slide,
    "Important: show only features that run in the live demo as completed; replace status labels with verified project evidence.",
    "Review 2 implementation scope",
)
add_card(slide, 0.75, 1.65, 5.75, 1.65, "Recruitment",
         "Role-based accounts, job posting, candidate applications, PDF resume upload, AI analysis, candidate ranking and interview scheduling.")
add_card(slide, 6.80, 1.65, 5.75, 1.65, "AI Resume Matching",
         "PDF text extraction, TF-IDF cosine similarity, required-skill overlap, matched/missing skills and supporting evidence.")
add_card(slide, 0.75, 3.65, 5.75, 1.65, "Employee Operations",
         "Hired-candidate conversion, employee profiles, attendance, leave requests and approvals, and performance reviews.")
add_card(slide, 6.80, 3.65, 5.75, 1.65, "Platform & Oversight",
         "Role and ownership checks, dashboards, notifications, reports and audit logs. AI provides decision support only.")
add_text(slide, "Demo evidence: run the current application and show each completed workflow during the review.",
         0.90, 5.75, 11.5, 0.45, 11, (70, 80, 95), True)

# Slide 15: testing plan
slide = presentation.slides[14]
replace_text(
    slide,
    "No numerical performance or model results are reported until tests are actually executed.",
    "Planned validation areas for the Review 2 build; no unverified performance figures are claimed.",
)
add_card(slide, 0.75, 1.65, 5.75, 1.65, "Authentication & Access",
         "Verify login, role permissions, ownership rules and restricted employee/resume access.")
add_card(slide, 6.80, 1.65, 5.75, 1.65, "Recruitment Workflow",
         "Check job lifecycle, duplicate applications, legal status transitions and interview scheduling.")
add_card(slide, 0.75, 3.65, 5.75, 1.65, "Resume & AI",
         "Validate PDF type/size, text extraction errors, matching score inputs and explanation evidence.")
add_card(slide, 6.80, 3.65, 5.75, 1.65, "Employee Operations",
         "Check hired-candidate conversion, one attendance record per day, leave balances and overlapping requests.")
add_text(slide, "Record actual test results before presenting; do not report estimates as measured results.",
         0.90, 5.75, 11.5, 0.45, 11, (70, 80, 95), True)

# Slide 12
slide = presentation.slides[11]
replace_text(
    slide,
    "Attendance Pattern Analysis",
    "Resume Matching",
)
replace_text(
    slide,
    "Start with descriptive statistics and trend detection. Suitable for attendance summaries and unusual-pattern flags.",
    "TF-IDF cosine similarity compares resume text with job requirements. Skill overlap adds a job-relevant matching signal.",
)
replace_text(slide, "Leave Trend Insights", "Skill Evidence")
replace_text(
    slide,
    "Use aggregation / time-series summaries to highlight leave trends by month or department.",
    "Skill aliases are matched to resume evidence. Missing required skills are shown clearly to HR.",
)
replace_text(slide, "Performance Trend Support", "Candidate Ranking")
replace_text(
    slide,
    "Explore a regression or classification model only if sufficient, relevant, consented and representative data is available.",
    "Applications are ranked per job using explainable scores; HR filters and makes the final decision.",
)
replace_text(
    slide,
    "Model status: selection and validation are part of Review 2 work; no trained-model accuracy is claimed yet.",
    "AI scores are advisory only. HR reviews the evidence and makes every hiring decision.",
)
replace_text(
    slide,
    "AI features are planned as decision-support tools; final model choice depends on available, approved data.",
    "The implemented resume-matching engine provides explainable decision support; HR retains final authority.",
)

# Slide 17
slide = presentation.slides[16]
replace_text(
    slide,
    "Wireframes, responsive pages, dashboard cards, navigation and usability checks.",
    "Responsive UI, shared components, dashboard screens and API integration.",
)
replace_text(
    slide,
    "Vijayalaxmi Mhetri",
    "Vijayalaxmi Mhetri",
)
replace_text(
    slide,
    "UI / Frontend & Dashboard",
    "Frontend, UI & API Integration",
)
replace_text(
    slide,
    "Pranavi Jadhav",
    "Pranavi Jadhav",
)
replace_text(
    slide,
    "Employee Workflows & Database",
    "AI, Resume Processing & Job Matching",
)
replace_text(
    slide,
    "Sakshi Sable",
    "Sakshi Sable",
)
replace_text(
    slide,
    "AI / Analytics & Integration",
    "Backend, Database & Authentication",
)
replace_text(
    slide,
    "Employee profile, attendance and leave workflow design; database tables and validation.",
    "TF-IDF matching, resume extraction, evidence generation and AI workflow integration.",
)
replace_text(
    slide,
    "Data preparation, AI insight approach, integration support, testing and technical documentation.",
    "Backend APIs, Prisma database, authentication, validation and system integration.",
)

# Slide 18
slide = presentation.slides[17]
replace_text(
    slide,
    "Frontend: HTML, CSS, JavaScript, Bootstrap",
    "Frontend: Next.js, React, TypeScript, Tailwind CSS",
)
replace_text(
    slide,
    "Backend: Python, Flask",
    "Backend: Next.js Route Handlers, REST APIs",
)
replace_text(
    slide,
    "Database: MySQL",
    "Database: Prisma ORM, SQLite/MySQL-ready",
)
replace_text(
    slide,
    "AI / Data: Scikit-learn, Pandas, NumPy",
    "AI / Data: TypeScript TF-IDF, Cosine Similarity, PDF parsing",
)
replace_text(
    slide,
    "Python Documentation",
    "Next.js Documentation",
)
replace_text(slide, "Flask Documentation", "TypeScript Documentation")
replace_text(slide, "MySQL Documentation", "Prisma Documentation")
replace_text(slide, "Scikit-learn Documentation", "Postman Documentation")
replace_text(slide, "Pandas Documentation", "TF-IDF / Cosine Similarity")

presentation.save(str(OUTPUT))
print(OUTPUT)
