import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
import os
import shutil

SAMPLE_IMG = "Review-2-Deliverables/sample_images_uploaded.jpg"

def apply_sample_images_slide(slide, presenter_name="Vijayalaxmi Mhetri"):
    # Remove existing shapes on slide
    for sh in list(slide.shapes):
        sp = sh._element
        sp.getparent().remove(sp)
    
    # Add full slide image
    slide.shapes.add_picture(SAMPLE_IMG, Inches(0), Inches(0), width=Inches(13.333), height=Inches(7.5))
    
    # Add elegant speaker badge in the white space between "Sample Images" and the MIT logo
    if presenter_name:
        p_badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.5), Inches(0.22), Inches(2.7), Inches(0.45))
        p_badge.fill.solid()
        p_badge.fill.fore_color.rgb = RGBColor(245, 243, 255)
        p_badge.line.color.rgb = RGBColor(126, 34, 206)
        p_badge.line.width = Pt(1.2)
        tb_p = slide.shapes.add_textbox(Inches(7.5), Inches(0.22), Inches(2.7), Inches(0.45))
        p_p = tb_p.text_frame.paragraphs[0]
        p_p.alignment = PP_ALIGN.CENTER
        p_p.text = f"🎙️ {presenter_name}"
        p_p.font.name = "Segoe UI"
        p_p.font.size = Pt(9.5)
        p_p.font.bold = True
        p_p.font.color.rgb = RGBColor(126, 34, 206)

# 1. Update HireSphere_AI_Review_2_Master.pptx (Slide 9 - index 8)
prs_master = pptx.Presentation("Review-2-Deliverables/HireSphere_AI_Review_2_Master.pptx")
print(f"Master presentation total slides: {len(prs_master.slides)}")
apply_sample_images_slide(prs_master.slides[8])
prs_master.save("Review-2-Deliverables/HireSphere_AI_Review_2_Master.pptx")
print("Updated Slide 9 in HireSphere_AI_Review_2_Master.pptx")

# 2. Update Review_2_AI_Recruitment_System.pptx (Slide 4 - index 3)
prs_r2 = pptx.Presentation("Review-2-Deliverables/Review_2_AI_Recruitment_System.pptx")
print(f"Review 2 presentation total slides: {len(prs_r2.slides)}")
apply_sample_images_slide(prs_r2.slides[3])
prs_r2.save("Review-2-Deliverables/Review_2_AI_Recruitment_System.pptx")
print("Updated Slide 4 in Review_2_AI_Recruitment_System.pptx")
