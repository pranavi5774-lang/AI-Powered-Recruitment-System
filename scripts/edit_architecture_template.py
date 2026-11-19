from pathlib import Path

from pptx import Presentation
from pptx.util import Inches


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"
TEMPLATE = DOWNLOADS / "sample ppt for architecture.pptx"
OUTPUT = DOWNLOADS / "HireSphere_AI_Edited_Architecture_Template.pptx"
ASSETS = ROOT / "Review-2-Deliverables"
ARCHITECTURE_IMAGE = Path(
    r"C:\Users\JADHAV\AppData\Roaming\Code\agentSessionData\ff661b7c-fef7-45e0-b186-d5675ac8bfc6\attachments\7af57f2b-8048-4541-8d5e-00891da12360\Pasted Image.png"
)


def replace_text(shape, text):
    frame = shape.text_frame
    frame.clear()
    frame.word_wrap = True
    for index, line in enumerate(text.split("\n")):
        paragraph = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        paragraph.text = line


def remove_shape(shape):
    shape._element.getparent().remove(shape._element)


def replace_large_picture(slide, image_path):
    for shape in list(slide.shapes):
        if getattr(shape, "shape_type", None) == 13:
            if shape.width >= Inches(2):
                left, top, width, height = shape.left, shape.top, shape.width, shape.height
                remove_shape(shape)
                slide.shapes.add_picture(
                    str(image_path),
                    left,
                    top,
                    width=width,
                    height=height,
                )
                return


if not TEMPLATE.exists():
    raise FileNotFoundError(TEMPLATE)

presentation = Presentation(str(TEMPLATE))

# Slide 1: replace only title, guide and team text.
slide = presentation.slides[0]
replace_text(
    slide.shapes[0],
    "AI-Powered Recruitment and Employee Management System",
)
replace_text(
    slide.shapes[1],
    "Project Guide: Prof. Arindam Sir",
)
replace_text(
    slide.shapes[3],
    "Team\n"
    "Vijayalaxmi Mhetri (SCFU224007)\n"
    "Sakshi Sable (SCFU224029)\n"
    "Pranavi Jadhav (SCFU224040)",
)
replace_text(
    slide.shapes[4],
    "MIT VISHWAPRAYAG UNIVERSITY, SOLAPUR\n"
    "School of Computing - BCA Final Year",
)

# Slide 2: replace only problem statement and objective content.
slide = presentation.slides[1]
replace_text(
    slide.shapes[3],
    "Design and develop an integrated recruitment and employee management platform "
    "that uses explainable AI for resume screening and candidate ranking.",
)
replace_text(
    slide.shapes[5],
    "1. Automate PDF resume parsing and structured data extraction\n"
    "2. Match candidates using TF-IDF cosine similarity and skill overlap\n"
    "3. Provide explainable scores with matched skills and evidence\n"
    "4. Manage applications, interviews, hiring and employee records\n"
    "5. Integrate attendance, leave, performance and audit reports",
)
replace_text(slide.shapes[6], "Objectives:")
replace_text(slide.shapes[7], "Candidate Resume")
replace_text(slide.shapes[8], "Ranked Candidate")

# Replace the original image-retrieval visual without changing slide layout.
group = next((shape for shape in slide.shapes if shape.shape_type == 6), None)
if group is not None:
    left, top, width, height = group.left, group.top, group.width, group.height
    remove_shape(group)
    lifecycle = ASSETS / "flowchart_application_lifecycle.png"
    if lifecycle.exists():
        slide.shapes.add_picture(
            str(lifecycle),
            left,
            top,
            width=width,
            height=height,
        )

# Slide 3: replace only the problem-description text.
slide = presentation.slides[2]
replace_text(slide.shapes[2], "Problem Description")
replace_text(
    slide.shapes[3],
    "Traditional recruitment requires HR teams to manually review hundreds of resumes, "
    "compare candidate skills, maintain employee records and track hiring decisions across "
    "fragmented tools. These processes are slow, inconsistent and difficult to audit.\n\n"
    "HireSphere AI combines a secure Next.js application, REST APIs, role-based authentication, "
    "Prisma database management and an explainable AI matching engine.\n\n"
    "The system validates and extracts PDF resume text, preprocesses the text, scans a skill "
    "dictionary, calculates TF-IDF cosine similarity and required-skill overlap, and produces "
    "a final score. The score is advisory only and never rejects candidates automatically.\n\n"
    "The application also manages interviews, hiring, employee conversion, attendance, leave "
    "approval, performance reviews, notifications and audit logs.",
)

# Slide 4: replace the architecture image only.
slide = presentation.slides[3]
replace_text(slide.shapes[2], "Architecture")
replace_large_picture(slide, ARCHITECTURE_IMAGE)

# Slide 5: replace the workflow image only.
slide = presentation.slides[4]
replace_text(slide.shapes[2], "Methodology / Workflow")
replace_large_picture(slide, ASSETS / "flowchart_resume_upload_extraction.png")

# Slide 6: replace only the closing text.
slide = presentation.slides[5]
replace_text(
    slide.shapes[1],
    "Thank You\n\nHireSphere AI - AI-Powered Recruitment and Employee Management System",
)

presentation.save(str(OUTPUT))
print(OUTPUT)
