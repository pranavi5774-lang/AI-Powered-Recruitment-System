import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs('Review-2-Deliverables', exist_ok=True)

# -------------------------------------------------------------
# 1. SYSTEM ARCHITECTURE DIAGRAM
# -------------------------------------------------------------
def generate_architecture():
    fig, ax = plt.subplots(figsize=(16, 10), dpi=300)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.axis('off')
    
    # Background
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')
    
    # Title
    ax.text(8, 9.6, "AI-POWERED RECRUITMENT & MANAGEMENT SYSTEM (HIRESPHERE AI)", 
            ha='center', va='center', fontsize=18, fontweight='bold', color='#0F172A', fontfamily='sans-serif')
    ax.text(8, 9.2, "Updated Layered System Architecture — Design & Midway Implementation", 
            ha='center', va='center', fontsize=12, color='#475569', fontfamily='sans-serif')

    # Color palette
    c_pres = '#3B82F6'    # Blue
    c_sec  = '#6366F1'    # Indigo
    c_ai   = '#0D9488'    # Teal
    c_biz  = '#2563EB'    # Royal Blue
    c_data = '#475569'    # Slate / Dark
    
    # 1. Presentation Layer
    rect_pres = patches.FancyBboxPatch((0.8, 7.3), 14.4, 1.5, boxstyle="round,pad=0.1,rounding_size=0.15",
                                      facecolor='#EFF6FF', edgecolor=c_pres, linewidth=2)
    ax.add_patch(rect_pres)
    ax.text(1.2, 8.5, "PRESENTATION LAYER (CLIENT-SIDE SPA)", fontsize=11, fontweight='bold', color=c_pres)
    
    # Components inside Presentation
    comp_pres = [
        ("Candidate Portal\n• Job Browse & Search\n• Resume Drag & Drop\n• Application Tracker", 1.2, 7.5, 3.2),
        ("HR Recruitment Hub\n• Job Requisition Mgmt\n• AI Screening Workspace\n• Candidate Ranking Table", 4.7, 7.5, 3.2),
        ("Employee Self-Service\n• Attendance Clock-In\n• Leave Quota Requests\n• Performance Reviews", 8.2, 7.5, 3.2),
        ("Admin Control Center\n• User Role Provisioning\n• Tamper-Proof Audit Logs\n• Organization Analytics", 11.7, 7.5, 3.2),
    ]
    for text, x, y, w in comp_pres:
        p = patches.FancyBboxPatch((x, y), w, 0.85, boxstyle="round,pad=0.05,rounding_size=0.1",
                                   facecolor='#FFFFFF', edgecolor='#BFDBFE', linewidth=1.2)
        ax.add_patch(p)
        ax.text(x + w/2, y + 0.42, text, ha='center', va='center', fontsize=8.5, color='#1E293B', fontweight='medium')

    # Down Arrow 1
    ax.annotate('', xy=(8, 6.95), xytext=(8, 7.25),
                arrowprops=dict(facecolor='#64748B', edgecolor='#64748B', width=2, headwidth=8, headlength=6))
    ax.text(8.2, 7.1, "HTTPS / REST JSON API / JWT Cookie", fontsize=8, color='#64748B', style='italic')

    # 2. Application & API Gateway Layer
    rect_api = patches.FancyBboxPatch((0.8, 5.3), 14.4, 1.5, boxstyle="round,pad=0.1,rounding_size=0.15",
                                     facecolor='#EEF2FF', edgecolor=c_sec, linewidth=2)
    ax.add_patch(rect_api)
    ax.text(1.2, 6.5, "APPLICATION & API GATEWAY LAYER (NEXT.JS ROUTE HANDLERS)", fontsize=11, fontweight='bold', color=c_sec)

    comp_api = [
        ("Security & Auth Gateway\n• JWT Token (Jose HS256)\n• Bcrypt Cost 10 Password Hash\n• In-Memory Sliding Rate Limiter", 1.2, 5.5, 3.2),
        ("Input Validation & RBAC\n• Strict Zod Schema Parse\n• Role Guard: ADMIN/HR/CAND/EMP\n• DB State & Suspension Re-Check", 4.7, 5.5, 3.2),
        ("REST API Endpoints (49)\n• /api/auth, /api/jobs, /api/resumes\n• /api/applications, /api/ai/analyze\n• /api/attendance, /api/leaves", 8.2, 5.5, 3.2),
        ("Audit & Notifications\n• Transactional Audit Trail\n• Immutable Status Transitions\n• In-App Event Alerts", 11.7, 5.5, 3.2),
    ]
    for text, x, y, w in comp_api:
        p = patches.FancyBboxPatch((x, y), w, 0.85, boxstyle="round,pad=0.05,rounding_size=0.1",
                                   facecolor='#FFFFFF', edgecolor='#C7D2FE', linewidth=1.2)
        ax.add_patch(p)
        ax.text(x + w/2, y + 0.42, text, ha='center', va='center', fontsize=8.5, color='#1E293B', fontweight='medium')

    # Down Arrow 2
    ax.annotate('', xy=(8, 4.95), xytext=(8, 5.25),
                arrowprops=dict(facecolor='#64748B', edgecolor='#64748B', width=2, headwidth=8, headlength=6))

    # 3. Core Business & AI Domain Engine
    rect_core = patches.FancyBboxPatch((0.8, 2.5), 14.4, 2.3, boxstyle="round,pad=0.1,rounding_size=0.15",
                                      facecolor='#F0FDF4', edgecolor=c_ai, linewidth=2)
    ax.add_patch(rect_core)
    ax.text(1.2, 4.5, "CORE DOMAIN & AI MATCHING ENGINE (EXPLAINABLE NLP PIPELINE)", fontsize=11, fontweight='bold', color='#166534')

    comp_ai = [
        ("PDF Extraction & Hygiene\n• Server-side unpdf (pdf.js)\n• Magic-byte & MIME check\n• Text sanitization & line clean\n• Max 5MB / 10-page cap", 1.2, 2.7, 3.2),
        ("Resume Parser & RegEx Heuristics\n• Name & Contact Extraction\n• Section segmentation (Edu/Exp)\n• Experience Year Calculation\n• Skill Identification (~85 skills)", 4.7, 2.7, 3.2),
        ("TF-IDF Vectorizer & Cosine Math\n• Smooth IDF: ln((1+N)/(1+df)) + 1\n• Sub-linear TF term frequency\n• L2 Euclidean normalization\n• Cosine Dot Product in [0, 1]", 8.2, 2.7, 3.2),
        ("Hybrid Scoring & Evidence\n• Final = 0.6*TF-IDF + 0.4*Skill\n• Sentence-level quote evidence\n• Missing vs Extra skills breakdown\n• Transparent Human Decision Support", 11.7, 2.7, 3.2),
    ]
    for text, x, y, w in comp_ai:
        p = patches.FancyBboxPatch((x, y), w, 1.65, boxstyle="round,pad=0.05,rounding_size=0.1",
                                   facecolor='#FFFFFF', edgecolor='#BBF7D0', linewidth=1.2)
        ax.add_patch(p)
        ax.text(x + w/2, y + 0.82, text, ha='center', va='center', fontsize=8.2, color='#1E293B', fontweight='medium')

    # Down Arrow 3
    ax.annotate('', xy=(8, 2.15), xytext=(8, 2.45),
                arrowprops=dict(facecolor='#64748B', edgecolor='#64748B', width=2, headwidth=8, headlength=6))

    # 4. Persistence & Storage Layer
    rect_data = patches.FancyBboxPatch((0.8, 0.4), 14.4, 1.6, boxstyle="round,pad=0.1,rounding_size=0.15",
                                       facecolor='#F8FAFC', edgecolor=c_data, linewidth=2)
    ax.add_patch(rect_data)
    ax.text(1.2, 1.75, "DATA PERSISTENCE & SECURE STORAGE LAYER", fontsize=11, fontweight='bold', color=c_data)

    comp_data = [
        ("Prisma ORM Layer\n• Type-safe client queries\n• Transaction isolation ($transaction)\n• Auto-generated migrations", 1.2, 0.6, 4.3),
        ("Relational Database (19 Models)\n• SQLite (Dev) / MySQL 8.0 (Prod portable)\n• Unique (jobId, candidateId) constraint\n• Unique (employeeId, date) constraint", 5.8, 0.6, 4.4),
        ("Secure File Storage\n• uploads/resumes/ (outside web root)\n• Authenticated stream download\n• Zero static exposure of PII PDFs", 10.5, 0.6, 4.4),
    ]
    for text, x, y, w in comp_data:
        p = patches.FancyBboxPatch((x, y), w, 1.0, boxstyle="round,pad=0.05,rounding_size=0.1",
                                   facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1.2)
        ax.add_patch(p)
        ax.text(x + w/2, y + 0.5, text, ha='center', va='center', fontsize=8.5, color='#1E293B', fontweight='medium')

    plt.tight_layout()
    plt.savefig('Review-2-Deliverables/system_architecture_diagram.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Architecture diagram generated.")

# -------------------------------------------------------------
# 2. DATABASE ER DIAGRAM
# -------------------------------------------------------------
def generate_er_diagram():
    fig, ax = plt.subplots(figsize=(18, 12), dpi=300)
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 12)
    ax.axis('off')
    
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')
    
    # Title
    ax.text(9, 11.6, "DATABASE ENTITY RELATIONSHIP (ER) DIAGRAM — 19 TABLES", 
            ha='center', va='center', fontsize=18, fontweight='bold', color='#0F172A')
    ax.text(9, 11.2, "Relational Schema Designed with Prisma ORM — Portable to MySQL / PostgreSQL", 
            ha='center', va='center', fontsize=12, color='#475569')

    # Table styling helper
    def draw_table(name, pk, fks, attrs, x, y, w=3.0, h=2.2, color='#1E3A8A'):
        # Header
        p_hdr = patches.FancyBboxPatch((x, y + h - 0.45), w, 0.45, boxstyle="round,pad=0.02,rounding_size=0.06",
                                       facecolor=color, edgecolor=color, linewidth=1)
        ax.add_patch(p_hdr)
        ax.text(x + w/2, y + h - 0.22, name, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#FFFFFF')
        
        # Body
        p_body = patches.FancyBboxPatch((x, y), w, h - 0.45, boxstyle="round,pad=0.02,rounding_size=0.06",
                                        facecolor='#FFFFFF', edgecolor=color, linewidth=1)
        ax.add_patch(p_body)
        
        # Text
        lines = [f"[PK] {pk}"]
        for fk in fks:
            lines.append(f"[FK] {fk}")
        for attr in attrs:
            lines.append(f" • {attr}")
        
        content = "\n".join(lines)
        ax.text(x + 0.15, y + (h - 0.45)/2, content, ha='left', va='center', fontsize=7.8, color='#1E293B', linespacing=1.25)

    # Core Recruitment Cluster
    draw_table("User", "id (CUID)", [], ["email (UQ), passwordHash", "name, role (ADMIN/HR/CAND/EMP)", "status (ACTIVE/SUSPENDED)", "createdAt, updatedAt"], 0.6, 8.4, 3.2, 2.2, '#1E40AF')
    draw_table("CandidateProfile", "id (CUID)", ["userId -> User(id)"], ["headline, phone, location", "experienceYears, education", "skills (JSON text)", "completenessScore"], 4.3, 8.4, 3.2, 2.2, '#1E40AF')
    draw_table("Resume", "id (CUID)", ["candidateId -> Candidate(id)"], ["fileName, storedName (UQ)", "mimeType, fileSizeBytes", "extractedText, parseStatus", "parsedInfo (JSON)"], 8.0, 8.4, 3.2, 2.2, '#0D9488')
    draw_table("Department", "id (CUID)", [], ["name (UQ)", "code, description", "createdAt, updatedAt"], 11.7, 8.4, 2.6, 2.2, '#374151')
    draw_table("Job", "id (CUID)", ["departmentId -> Dept(id)", "createdBy -> User(id)"], ["title, slug, status (DRAFT/OPEN)", "requiredSkills (JSON)", "preferredSkills (JSON)", "minSalary, maxSalary"], 14.6, 8.4, 3.0, 2.2, '#1E40AF')

    # Middle Cluster - Applications & AI
    draw_table("Application", "id (CUID)", ["candidateId -> Candidate(id)", "jobId -> Job(id)", "resumeId -> Resume(id)"], ["status (APPLIED/SHORTLISTED/HIRED)", "finalScore, tfidfScore, skillScore", "UQ(jobId, candidateId)", "appliedAt, updatedAt"], 4.3, 5.0, 3.5, 2.4, '#B91C1C')
    draw_table("ResumeAnalysis", "id (CUID)", ["applicationId -> App(id) (UQ)"], ["tfidfScore, skillScore, finalScore", "weights: {tfidf:0.6, skill:0.4}", "matchedSkills (JSON with quotes)", "missingSkills, extraSkills (JSON)", "summary, algorithmVersion"], 0.6, 5.0, 3.4, 2.4, '#0D9488')
    draw_table("ApplicationStatusHistory", "id (CUID)", ["applicationId -> App(id)"], ["fromStatus, toStatus", "actorId, actorRole, actorName", "note, reason", "createdAt"], 8.2, 5.0, 3.1, 2.4, '#4B5563')
    draw_table("Interview", "id (CUID)", ["applicationId -> App(id)"], ["scheduledAt, mode (ONLINE/ONSITE)", "meetingLink, location", "status (SCHEDULED/COMPLETED)", "interviewerNotes, rating"], 11.7, 5.0, 3.0, 2.4, '#6366F1')

    # Bottom Cluster - Employee & Operations
    draw_table("Employee", "id (CUID)", ["userId -> User(id)", "deptId -> Dept(id)", "sourceAppId -> App(id)"], ["employeeCode (UQ: HS-EMP-xxxx)", "workEmail (UQ), designation", "joiningDate, employmentType", "status (ACTIVE/RESIGNED)"], 14.6, 4.8, 3.0, 2.6, '#047857')
    draw_table("Attendance", "id (CUID)", ["employeeId -> Emp(id)"], ["date (DateTime)", "status (PRESENT/WFH/LEAVE)", "checkIn, checkOut, workHours", "UQ(employeeId, date)"], 14.6, 1.4, 3.0, 2.4, '#047857')
    draw_table("LeaveType", "id (CUID)", [], ["name (UQ: Annual/Sick/Casual)", "quotaDays (e.g. 12/8/6)", "carryForwardMax", "isActive (Boolean)"], 11.2, 1.4, 2.8, 2.4, '#047857')
    draw_table("LeaveRequest", "id (CUID)", ["employeeId -> Emp(id)", "leaveTypeId -> Type(id)"], ["startDate, endDate, totalDays", "status (PENDING/APPROVED/REJ)", "reason, decisionNote", "decidedById, decidedAt"], 7.8, 1.4, 3.1, 2.4, '#047857')
    draw_table("LeaveBalance", "id (CUID)", ["employeeId -> Emp(id)", "leaveTypeId -> Type(id)"], ["year (Int)", "totalQuota, usedDays", "pendingDays, availableDays", "UQ(empId, leaveTypeId, year)"], 4.4, 1.4, 3.1, 2.4, '#047857')
    draw_table("PerformanceReview", "id (CUID)", ["employeeId -> Emp(id)", "reviewerId -> User(id)"], ["reviewPeriod, rating (1-5 Scale)", "goals, achievements, feedback", "strengths, areasToImprove", "status (DRAFT/SUBMITTED)"], 0.6, 1.4, 3.5, 2.4, '#7C3AED')

    # Standalone System Tables
    p_box = patches.FancyBboxPatch((0.6, 0.2), 17.0, 0.8, boxstyle="round,pad=0.05,rounding_size=0.1",
                                   facecolor='#F1F5F9', edgecolor='#94A3B8', linewidth=1)
    ax.add_patch(p_box)
    ax.text(1.0, 0.6, "System Infrastructure Tables:", fontweight='bold', fontsize=8.5, color='#334155')
    ax.text(4.0, 0.6, "• Notification [PK: id, FK: userId, title, message, isRead, link, createdAt]\n• AuditLog [PK: id, actorId, action, entityType, entityId, details (JSON), ipAddress, createdAt]\n• PasswordResetToken [PK: id, FK: userId, tokenHash, expiresAt, usedAt] | SystemSetting [PK: id, key (UQ), value]", 
            fontsize=7.8, color='#475569', va='center')

    # Draw Relationship Connectors
    def connect(x1, y1, x2, y2, label=""):
        ax.plot([x1, x2], [y1, y2], color='#64748B', linestyle='--', linewidth=1.2)
        if label:
            mx, my = (x1 + x2)/2, (y1 + y2)/2
            ax.text(mx, my, label, fontsize=7.5, color='#475569', ha='center', va='center',
                    bbox=dict(boxstyle='square,pad=0.1', facecolor='#FFFFFF', edgecolor='none'))

    connect(3.8, 9.5, 4.3, 9.5, "1:1")
    connect(7.5, 9.5, 8.0, 9.5, "1:N")
    connect(14.3, 9.5, 14.6, 9.5, "1:N")
    connect(6.0, 8.4, 6.0, 7.4, "1:N")
    connect(4.3, 6.2, 4.0, 6.2, "1:1")
    connect(7.8, 6.2, 8.2, 6.2, "1:N")
    connect(7.8, 5.8, 11.7, 5.8, "1:N")
    connect(14.6, 6.0, 7.8, 6.0, "1:N")
    connect(16.1, 8.4, 16.1, 7.4, "1:1")

    plt.tight_layout()
    plt.savefig('Review-2-Deliverables/database_er_diagram.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("Database ER diagram generated.")

# -------------------------------------------------------------
# 3. FLOWCHARTS FOR MAJOR FEATURES
# -------------------------------------------------------------
def generate_flowchart(title, steps, filename):
    fig, ax = plt.subplots(figsize=(10, 12), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, len(steps)*1.5 + 1.5)
    ax.axis('off')
    
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')
    
    y_top = len(steps)*1.5 + 0.8
    ax.text(5, y_top, title, ha='center', va='center', fontsize=14, fontweight='bold', color='#0F172A')
    
    y = y_top - 1.2
    for i, step in enumerate(steps):
        stype, text = step
        if stype == 'start' or stype == 'end':
            p = patches.FancyBboxPatch((2.5, y - 0.4), 5.0, 0.8, boxstyle="round,pad=0.1,rounding_size=0.4",
                                       facecolor='#2563EB', edgecolor='#1D4ED8', linewidth=1.5)
            tcolor = '#FFFFFF'
            fweight = 'bold'
        elif stype == 'decision':
            p = patches.Polygon([[5, y + 0.55], [7.7, y], [5, y - 0.55], [2.3, y]], 
                                facecolor='#FEF3C7', edgecolor='#D97706', linewidth=1.5)
            tcolor = '#92400E'
            fweight = 'bold'
        else: # process
            p = patches.FancyBboxPatch((1.8, y - 0.45), 6.4, 0.9, boxstyle="round,pad=0.08,rounding_size=0.1",
                                       facecolor='#FFFFFF', edgecolor='#3B82F6', linewidth=1.5)
            tcolor = '#1E293B'
            fweight = 'normal'
            
        ax.add_patch(p)
        ax.text(5, y, text, ha='center', va='center', fontsize=9, color=tcolor, fontweight=fweight, multialignment='center')
        
        if i < len(steps) - 1:
            ax.annotate('', xy=(5, y - 0.9), xytext=(5, y - 0.45 if stype != 'decision' else y - 0.55),
                        arrowprops=dict(facecolor='#64748B', edgecolor='#64748B', width=1.5, headwidth=6, headlength=5))
        y -= 1.5

    plt.tight_layout()
    plt.savefig(f'Review-2-Deliverables/{filename}', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"Flowchart {filename} generated.")

generate_architecture()
generate_er_diagram()

# A. Candidate Registration Flowchart
generate_flowchart("FLOWCHART A: CANDIDATE REGISTRATION & ONBOARDING", [
    ('start', 'START: Candidate Visits Registration Page'),
    ('process', 'Input Name, Email, Password, Headline, Phone & Education'),
    ('decision', 'Validate Client Form & Zod Schema\n(Email syntax, Pass >= 8 chars)?'),
    ('process', 'Check DB for Existing Email in User Table'),
    ('decision', 'Is Email Unique in Database?'),
    ('process', 'Hash Password with Bcrypt (Cost 10)\nCreate User & CandidateProfile via $transaction'),
    ('process', 'Issue Secure JWT (Jose HS256) httpOnly Cookie\nCreate AuditLog Entry'),
    ('end', 'END: Redirect to Candidate Portal Dashboard')
], 'flowchart_candidate_registration.png')

# B. Resume Upload & Information Extraction
generate_flowchart("FLOWCHART B: RESUME UPLOAD & TEXT EXTRACTION", [
    ('start', 'START: Candidate Selects Resume PDF'),
    ('process', 'Verify File Extension (.pdf), MIME type & Size <= 5MB'),
    ('process', 'Inspect PDF Magic Bytes (%PDF-1.x) to Prevent Spoofing'),
    ('process', 'Extract Raw Text using Server-Side unpdf (pdf.js)'),
    ('decision', 'Is Extracted Text Valid & Length >= 40 chars?'),
    ('process', 'Execute Regex Information Extraction:\nName, Email, Phone, Years of Exp, Education, Projects'),
    ('process', 'Scan ~85 Skills Dictionary & Extract Sentence Evidence Quotes'),
    ('process', 'Store PDF in uploads/resumes/ & Save Metadata in DB'),
    ('end', 'END: Resume Successfully Processed & Linked to Profile')
], 'flowchart_resume_upload_extraction.png')

# C. Candidate-Job Matching & AI Scoring
generate_flowchart("FLOWCHART C: AI CANDIDATE-JOB MATCHING ALGORITHM", [
    ('start', 'START: Application Submitted (Resume + Job ID)'),
    ('process', 'Load Clean Resume Text & Compose Canonical Job Text'),
    ('process', 'Build 2-Document Corpus: [JobText, ResumeText]'),
    ('process', 'Compute Smooth IDF: idf(t) = ln((1+N)/(1+df(t))) + 1\n& L2 Euclidean Vector Normalization'),
    ('process', 'Calculate TF-IDF Cosine Similarity Dot Product -> tfidfScore [0, 1]'),
    ('process', 'Calculate Required Skills Overlap Ratio:\nskillScore = |Matched Skills| / |Total Required Skills|'),
    ('process', 'Compute Weighted Final Score:\nfinalScore = (0.6 * tfidfScore) + (0.4 * skillScore)'),
    ('process', 'Compile Human Explainability Summary & Missing Skills List'),
    ('end', 'END: Store ResumeAnalysis & Snapshot Scores on Application')
], 'flowchart_ai_matching.png')

# D. Application Status Lifecycle
generate_flowchart("FLOWCHART D: APPLICATION STATUS & PIPELINE LIFECYCLE", [
    ('start', 'START: Application Created in APPLIED State'),
    ('process', 'Instant AI Screening Computes Score (0–100%)'),
    ('process', 'HR Evaluates Candidate in Ranking Workspace'),
    ('decision', 'Recruiter Decision: Shortlist Candidate?'),
    ('process', 'Transition to SHORTLISTED & Notify Candidate'),
    ('process', 'Schedule Interview (Date, Mode, Video Link) -> INTERVIEW_SCHEDULED'),
    ('process', 'Conduct Interview & Log Evaluation Rating -> INTERVIEWED'),
    ('decision', 'Hiring Committee Decision: Extend Offer?'),
    ('process', 'Status -> OFFERED -> If Accepted: HIRED'),
    ('end', 'END: Auto-Provision Employee Record (HS-EMP-xxxx)')
], 'flowchart_application_lifecycle.png')

# E. Admin / HR Management & Audit Trail
generate_flowchart("FLOWCHART E: ADMIN & HR MANAGEMENT AUDIT WORKFLOW", [
    ('start', 'START: Admin / HR Performs Privileged Operation'),
    ('process', 'Verify JWT Session & Check User Role in Database'),
    ('decision', 'Is User ACTIVE and Authorized for Resource?'),
    ('process', 'Execute Business Mutation (e.g. Post Job, Suspend User, Export Data)'),
    ('process', 'Execute Prisma DB $transaction to Guarantee ACID Consistency'),
    ('process', 'Capture Actor Snapshot (actorId, actorName, actorRole, IP)'),
    ('process', 'Write Tamper-Proof AuditLog Record & System Notification'),
    ('end', 'END: Action Logged & Updated State Returned to UI')
], 'flowchart_admin_hr_management.png')

print("All diagrams and flowcharts generated successfully.")

