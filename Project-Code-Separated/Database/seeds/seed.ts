// ============================================================
// HireSphere AI — Development Seed Script
// ============================================================
// Creates a complete, clearly-labeled synthetic dataset:
//   • 7 users (admin, HR, 4 candidates, employee-linked)
//   • Synthetic PDF resumes generated with pdf-lib, then parsed
//     through the REAL AI pipeline (unpdf extraction + TF-IDF
//     matching) so demo scores are genuine, not hardcoded.
//   • Jobs, applications, employees, attendance, leaves,
//     performance reviews, notifications, audit logs.
//
// Run:  bun run src/scripts/seed.ts
// Re-run is safe (wipes & recreates all data).
// ============================================================

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';
import { analyzeResume, extractResumeInfo } from '../lib/ai/resume-matcher';
import { normalizeText } from '../lib/ai/text-preprocessing';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'resumes');

const DEMO_PASSWORD = 'Password@123';

// ---------- synthetic resume PDF generation ----------

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      lines.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

async function createResumePdf(fileName: string, fullText: string): Promise<{ storedName: string; size: number }> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 800;
  const lines = fullText.split('\n');
  for (const rawLine of lines) {
    const isHeading = rawLine === rawLine.toUpperCase() && rawLine.trim().length > 2 && /[A-Z]/.test(rawLine);
    const f = isHeading ? bold : font;
    const size = isHeading ? 13 : 10.5;
    for (const seg of wrap(rawLine, 95)) {
      if (y < 50) {
        page = pdf.addPage([595, 842]);
        y = 800;
      }
      page.drawText(seg, { x: 48, y, size, font: f, color: rgb(0.08, 0.09, 0.13) });
      y -= size + 5;
    }
    y -= 4;
  }
  const bytes = await pdf.save();
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const storedName = `${Date.now()}-seed-${fileName}.pdf`;
  fs.writeFileSync(path.join(UPLOAD_DIR, storedName), bytes);
  return { storedName, size: bytes.length };
}

// ---------- resume templates (synthetic demo data) ----------

interface SeedCandidate {
  name: string;
  email: string;
  resumeFile: string;
  resumeText: string;
  profile: { phone: string; location: string; headline: string; summary: string; education: string; experienceYears: number; currentCompany?: string };
}

const CANDIDATES: SeedCandidate[] = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    resumeFile: 'aarav-sharma-resume',
    profile: {
      phone: '+91 98200 11223',
      location: 'Mumbai, India',
      headline: 'Full-Stack Python Developer',
      summary: 'Python developer with strong REST API and machine learning background.',
      education: 'B.E. Computer Engineering, Mumbai University, 2021',
      experienceYears: 3,
      currentCompany: 'TechNova Solutions',
    },
    resumeText: `AARAV SHARMA
Mumbai, India | +91 98200 11223 | aarav.sharma@example.com | github.com/aaravsharma

PROFESSIONAL SUMMARY
Python developer with 3 years of experience building REST APIs and machine learning pipelines.
Skilled in Django, Flask, PostgreSQL and scikit-learn with strong SQL and data analysis abilities.

WORK EXPERIENCE
Software Engineer, TechNova Solutions, Mumbai (2022-07 - Present)
- Built and maintained REST APIs using Django and Django REST Framework serving 40k daily requests.
- Developed a resume screening prototype with scikit-learn TF-IDF vectorizer and cosine similarity.
- Wrote SQL queries and PostgreSQL schema migrations; optimized report queries by 60%.
- Implemented unit tests with pytest; maintained 85% coverage on service layer.
- Collaborated in Agile sprints, code reviews and CI/CD pipelines using Git and Jenkins.

Python Developer Intern, CloudEdge Systems, Pune (2021-06 - 2022-06)
- Automated data cleaning with Pandas and NumPy for analytics dashboards.
- Built Flask endpoints for internal reporting tools and Postman-tested REST services.

SKILLS
Python, Django, Flask, REST API, PostgreSQL, MySQL, scikit-learn, Pandas, NumPy, Machine Learning,
NLP, Data Analysis, Git, Docker, Linux, Unit Testing, Agile/Scrum, SQL

CERTIFICATIONS
- Google Data Analytics Professional Certificate
- Machine Learning Specialization (Coursework)

EDUCATION
B.E. Computer Engineering, Mumbai University, 2021 — First Class

PROJECTS
Resume Screening Engine: TF-IDF + cosine similarity matcher over 5k synthetic resumes with skill-gap report.
Sales Forecast Dashboard: Pandas ETL with interactive Power BI dashboard for regional sales data.
`,
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    resumeFile: 'priya-nair-resume',
    profile: {
      phone: '+91 99870 44556',
      location: 'Bengaluru, India',
      headline: 'Frontend Developer — React & UI Engineering',
      summary: 'React developer focused on accessible, responsive interfaces.',
      education: 'B.Tech Information Technology, VIT, 2022',
      experienceYears: 2,
      currentCompany: 'PixelForge Studio',
    },
    resumeText: `PRIYA NAIR
Bengaluru, India | +91 99870 44556 | priya.nair@example.com

SUMMARY
Frontend developer with 2 years of experience building responsive SPAs with React, TypeScript and Tailwind CSS.
Passionate about accessibility, UI/UX and design systems.

EXPERIENCE
Frontend Developer, PixelForge Studio (2023-01 - Present)
- Built 12+ responsive React interfaces with TypeScript, Tailwind CSS and shadcn/ui components.
- Implemented client state with Zustand and server state with TanStack Query.
- Collaborated with designers in Figma; improved Lighthouse accessibility score from 71 to 96.
- Wrote unit tests with Jest and React Testing Library.

Junior Web Developer, WebCraft Labs (2022-07 - 2022-12)
- Converted Figma designs into HTML/CSS/Bootstrap pages; learned Git workflows.

SKILLS
JavaScript, TypeScript, React, Next.js, HTML/CSS, Tailwind CSS, Bootstrap, Git, Figma,
UI/UX, Unit Testing, REST API consumption, Agile/Scrum, Communication

EDUCATION
B.Tech Information Technology, VIT Vellore, 2022

PROJECTS
HireBoard UI: job-board front-end with React and REST API integration.
Accessibility Audit Tool: browser extension flagging common WCAG issues.
`,
  },
  {
    name: 'Rohan Mehta',
    email: 'rohan.mehta@example.com',
    resumeFile: 'rohan-mehta-resume',
    profile: {
      phone: '+91 98111 77889',
      location: 'Pune, India',
      headline: 'Data Analyst — SQL & Dashboards',
      summary: 'Data analyst with SQL, Power BI and Python pandas experience.',
      education: 'B.Com + PG Diploma in Data Analytics, Symbiosis, 2021',
      experienceYears: 2,
    },
    resumeText: `ROHAN MEHTA
Pune, India | +91 98111 77889 | rohan.mehta@example.com

PROFILE
Data analyst with 2 years of experience in SQL reporting, Power BI dashboards and Python-based data analysis.
Comfortable with Excel automation and stakeholder presentations.

EXPERIENCE
Data Analyst, Retail Insights Pvt Ltd (2023-02 - Present)
- Built 30+ Power BI dashboards on SQL Server data marts for regional sales teams.
- Automated monthly Excel reports with Python Pandas; saved 20 analyst-hours monthly.
- Ran exploratory data analysis to flag inventory anomalies.

Analytics Trainee, MetricWorks (2022-01 - 2023-01)
- Assisted ETL jobs; wrote ad-hoc SQL queries and pivot-table reports.

SKILLS
SQL, SQL Server, Excel, Power BI, Data Analysis, Data Visualization, Python, Pandas,
Communication, Teamwork, Time Management

EDUCATION
B.Com, Pune University, 2020
PG Diploma in Data Analytics, Symbiosis, 2021

CERTIFICATIONS
Microsoft Power BI Data Analyst (PL-300) coursework completed.
`,
  },
  {
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@example.com',
    resumeFile: 'sneha-kulkarni-resume',
    profile: {
      phone: '+91 97690 33445',
      location: 'Nagpur, India',
      headline: 'Aspiring Software Engineer',
      summary: 'CS graduate with Java and Spring Boot training projects.',
      education: 'B.Sc Computer Science, RTMNU, 2024',
      experienceYears: 0,
    },
    resumeText: `SNEHA KULKARNI
Nagpur, India | +91 97690 33445 | sneha.kulkarni@example.com

OBJECTIVE
Recent B.Sc Computer Science graduate seeking a software engineering role. Trained in Java and
Spring Boot through coursework and self-built projects; quick learner with strong fundamentals.

ACADEMIC PROJECTS
Library Management System (Java, Spring Boot, MySQL, 2024)
- CRUD REST API with JWT login, role-based access and Hibernate ORM.
Expense Tracker (HTML, CSS, JavaScript, 2023)
- LocalStorage-based tracker with chart visualizations.

INTERNSHIP
Web Development Intern, Local Startup Nagpur (2024-01 - 2024-03, 2 months)
- Fixed UI bugs in a PHP portal and wrote SQL reports.

SKILLS
Java, Spring Boot, MySQL, HTML/CSS, JavaScript, Git, OOP, Data Structures, SQL

EDUCATION
B.Sc Computer Science, RTMNU Nagpur, 2024 — 82%
`,
  },
  {
    name: 'Vikram Rao',
    email: 'vikram.rao@example.com',
    resumeFile: 'vikram-rao-resume',
    profile: {
      phone: '+91 90040 66778',
      location: 'Hyderabad, India',
      headline: 'Network Support Engineer',
      summary: 'IT support and networking background, transitioning careers.',
      education: 'Diploma in Electronics, C-TECH, 2019',
      experienceYears: 4,
    },
    resumeText: `VIKRAM RAO
Hyderabad, India | +91 90040 66778 | vikram.rao@example.com

SUMMARY
IT support engineer with 4 years in network operations and helpdesk management.
CCNA-trained; comfortable with Linux administration and monitoring tools.

EXPERIENCE
Network Support Engineer, NetServe Infra (2021-03 - Present)
- Managed LAN/WAN for 3 office sites; reduced ticket backlog by 45%.
- Administered Ubuntu servers, backup jobs and monitoring alerts.

IT Helpdesk Associate, SysCare Services (2019-08 - 2021-02)
- Handled hardware/software tickets; documented SOPs.

SKILLS
Linux, Networking, Bash, Ticketing, Teamwork, Communication, Time Management

EDUCATION
Diploma in Electronics & Communication, C-TECH Institute, 2019
`,
  },
];

// ---------- helpers ----------

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Seeding HireSphere AI development database…');

  // wipe in FK-safe order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.resumeAnalysis.deleteMany();
  await prisma.applicationStatusHistory.deleteMany();
  await prisma.application.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.job.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // ---------- core staff ----------
  const admin = await prisma.user.create({
    data: { email: 'admin@hiresphere.ai', passwordHash, name: 'Anita Desai', role: 'ADMIN', phone: '+91 98000 00001' },
  });
  const hrUser = await prisma.user.create({
    data: { email: 'hr@hiresphere.ai', passwordHash, name: 'Karan Malhotra', role: 'HR', phone: '+91 98000 00002' },
  });

  // ---------- departments ----------
  const [eng, dataDept, hrDept, sales] = await Promise.all([
    prisma.department.create({ data: { name: 'Engineering', description: 'Software development teams' } }),
    prisma.department.create({ data: { name: 'Data & Analytics', description: 'BI, analytics and data science' } }),
    prisma.department.create({ data: { name: 'Human Resources', description: 'People operations' } }),
    prisma.department.create({ data: { name: 'Sales', description: 'Business development and sales' } }),
  ]);

  // ---------- leave types ----------
  const [annual, sick, casual] = await Promise.all([
    prisma.leaveType.create({ data: { name: 'Annual Leave', annualQuota: 18, description: 'Planned paid time off' } }),
    prisma.leaveType.create({ data: { name: 'Sick Leave', annualQuota: 10, description: 'Medical leave' } }),
    prisma.leaveType.create({ data: { name: 'Casual Leave', annualQuota: 8, description: 'Short personal leave' } }),
  ]);

  // ---------- jobs ----------
  const jobPython = await prisma.job.create({
    data: {
      title: 'Python Developer (AI Screening Team)',
      description:
        'Join our AI screening team to build REST APIs and machine learning services. You will design Django/Flask endpoints, write PostgreSQL queries, and productionize scikit-learn models for document intelligence. Strong SQL, unit testing and Git hygiene expected. You will collaborate in Agile sprints with data scientists and frontend engineers, and help improve our NLP preprocessing pipeline.',
      departmentId: eng.id,
      location: 'Mumbai (Hybrid)',
      employmentType: 'FULL_TIME',
      experienceMin: 2,
      educationReq: 'Bachelor degree in CS/IT or related field',
      requiredSkills: JSON.stringify(['Python', 'Django', 'REST API', 'SQL', 'Machine Learning']),
      preferredSkills: JSON.stringify(['Flask', 'PostgreSQL', 'NLP', 'Docker', 'Unit Testing']),
      salaryMin: 700000,
      salaryMax: 1200000,
      openings: 2,
      status: 'OPEN',
      createdBy: hrUser.id,
      publishedAt: daysAgo(10),
    },
  });

  const jobFrontend = await prisma.job.create({
    data: {
      title: 'Frontend Developer — React',
      description:
        'Craft premium, accessible user interfaces for our HR platform. You will own React + TypeScript components, design-system work with Tailwind CSS, and REST API integration. We care about performance, accessibility and clean component architecture.',
      departmentId: eng.id,
      location: 'Remote (India)',
      employmentType: 'FULL_TIME',
      experienceMin: 1,
      educationReq: 'Bachelor degree or equivalent practical experience',
      requiredSkills: JSON.stringify(['JavaScript', 'React', 'HTML/CSS', 'Git']),
      preferredSkills: JSON.stringify(['TypeScript', 'Tailwind CSS', 'UI/UX', 'Unit Testing']),
      salaryMin: 500000,
      salaryMax: 900000,
      openings: 1,
      status: 'OPEN',
      createdBy: hrUser.id,
      publishedAt: daysAgo(6),
    },
  });

  const jobDataAnalyst = await prisma.job.create({
    data: {
      title: 'Data Analyst — HR Analytics',
      description:
        'Own people-analytics dashboards: SQL reporting, Power BI, Excel automation and light Python. You will partner with HR to model attrition, attendance and recruitment funnel metrics.',
      departmentId: dataDept.id,
      location: 'Bengaluru',
      employmentType: 'FULL_TIME',
      experienceMin: 1,
      educationReq: 'Any degree with analytics coursework',
      requiredSkills: JSON.stringify(['SQL', 'Excel', 'Data Analysis', 'Power BI']),
      preferredSkills: JSON.stringify(['Python', 'Pandas', 'Data Visualization']),
      salaryMin: 450000,
      salaryMax: 750000,
      openings: 1,
      status: 'OPEN',
      createdBy: hrUser.id,
      publishedAt: daysAgo(4),
    },
  });

  const jobIntern = await prisma.job.create({
    data: {
      title: 'Software Engineer Intern',
      description:
        'Six-month internship for final-year students. Work alongside mentors on Java/Spring Boot or Python services, unit tests and documentation. Strong OOP and data-structure fundamentals required.',
      departmentId: eng.id,
      location: 'Pune (Onsite)',
      employmentType: 'INTERNSHIP',
      experienceMin: 0,
      educationReq: 'Final-year BCA/B.Sc/B.E. student',
      requiredSkills: JSON.stringify(['Java', 'OOP', 'Data Structures']),
      preferredSkills: JSON.stringify(['SQL', 'Git', 'REST API']),
      salaryMin: 180000,
      salaryMax: 240000,
      openings: 3,
      status: 'OPEN',
      createdBy: hrUser.id,
      publishedAt: daysAgo(2),
    },
  });

  await prisma.job.create({
    data: {
      title: 'DevOps Engineer',
      description: 'Draft role — refining Kubernetes requirements before publishing.',
      departmentId: eng.id,
      location: 'Remote',
      employmentType: 'FULL_TIME',
      experienceMin: 3,
      requiredSkills: JSON.stringify(['Docker', 'Kubernetes', 'CI/CD']),
      preferredSkills: JSON.stringify(['AWS', 'Linux']),
      status: 'DRAFT',
      createdBy: hrUser.id,
    },
  });

  await prisma.job.create({
    data: {
      title: 'Sales Executive (Closed)',
      description: 'Campus-sales role closed after hiring target met.',
      departmentId: sales.id,
      location: 'Delhi',
      employmentType: 'FULL_TIME',
      experienceMin: 1,
      requiredSkills: JSON.stringify(['Communication']),
      preferredSkills: JSON.stringify(['Excel']),
      status: 'CLOSED',
      createdBy: hrUser.id,
      publishedAt: daysAgo(30),
      closedAt: daysAgo(5),
    },
  });

  // ---------- candidates + synthetic PDF resumes through the REAL pipeline ----------
  console.log('🧠 Generating synthetic PDF resumes and running the real AI pipeline…');

  const candidateUsers: { user: { id: string; name: string }; profileId: string; resumeId: string; text: string }[] = [];

  for (const cand of CANDIDATES) {
    const user = await prisma.user.create({
      data: { email: cand.email, passwordHash, name: cand.name, role: 'CANDIDATE', phone: cand.profile.phone },
    });
    const { storedName, size } = await createResumePdf(cand.resumeFile, cand.resumeText);
    const filePath = path.join(UPLOAD_DIR, storedName);
    const info = extractResumeInfo(cand.resumeText);
    const profile = await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        phone: cand.profile.phone,
        location: cand.profile.location,
        headline: cand.profile.headline,
        summary: cand.profile.summary,
        experienceYears: cand.profile.experienceYears,
        currentCompany: cand.profile.currentCompany,
        education: cand.profile.education,
      },
    });
    const resume = await prisma.resume.create({
      data: {
        candidateId: profile.id,
        fileName: `${cand.resumeFile}.pdf`,
        storedName,
        filePath,
        fileSize: size,
        mimeType: 'application/pdf',
        extractedText: normalizeText(cand.resumeText),
        parseStatus: 'SUCCESS',
        parsedData: JSON.stringify(info),
        isActive: true,
        uploadedAt: daysAgo(8),
      },
    });
    candidateUsers.push({ user: { id: user.id, name: cand.name }, profileId: profile.id, resumeId: resume.id, text: cand.resumeText });
  }

  const byName = (n: string) => candidateUsers.find((c) => c.user.name.startsWith(n))!;

  // ---------- applications + AI analysis (real compute) ----------
  const apply = async (candIdx: { text: string; user: { id: string; name: string }; profileId: string; resumeId: string }, job: { id: string; title: string; description: string; requiredSkills: string; preferredSkills: string }, daysBack: number, note?: string) => {
    const requiredSkills = JSON.parse(job.requiredSkills);
    const preferredSkills = JSON.parse(job.preferredSkills);
    const result = analyzeResume(candIdx.text, { title: job.title, description: job.description, requiredSkills, preferredSkills });
    const app = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: candIdx.profileId,
        resumeId: candIdx.resumeId,
        status: 'APPLIED',
        matchScore: result.finalScore,
        tfidfScore: result.tfidfScore,
        skillScore: result.skillScore,
        hrNotes: note,
        appliedAt: daysAgo(daysBack),
      },
    });
    await prisma.resumeAnalysis.create({
      data: {
        applicationId: app.id,
        tfidfScore: result.tfidfScore,
        skillScore: result.skillScore,
        finalScore: result.finalScore,
        weights: JSON.stringify(result.weights),
        matchedSkills: JSON.stringify(result.matchedSkills),
        missingSkills: JSON.stringify(result.missingSkills),
        extraSkills: JSON.stringify(result.extraSkills),
        extractedInfo: JSON.stringify(extractResumeInfo(candIdx.text)),
        summary: result.summary,
        algorithmVersion: result.algorithmVersion,
      },
    });
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: app.id,
        toStatus: 'APPLIED',
        actorId: candIdx.user.id,
        actorName: candIdx.user.name,
        actorRole: 'CANDIDATE',
        createdAt: daysAgo(daysBack),
      },
    });
    return app;
  };

  const advance = async (appId: string, to: string, daysBack: number, note?: string) => {
    const app = await prisma.application.findUnique({ where: { id: appId } });
    await prisma.application.update({ where: { id: appId }, data: { status: to } });
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: appId,
        fromStatus: app?.status ?? 'APPLIED',
        toStatus: to,
        actorId: hrUser.id,
        actorName: hrUser.name,
        actorRole: 'HR',
        note,
        createdAt: daysAgo(daysBack),
      },
    });
  };

  // Python job: strong, strong, partial, weak
  const a1 = await apply(byName('Aarav'), jobPython, 9, 'Referred by campus program.');
  const a2 = await apply(byName('Priya'), jobPython, 8);
  const a3 = await apply(byName('Rohan'), jobPython, 7);
  const a4 = await apply(byName('Vikram'), jobPython, 6);
  // Frontend job: strong
  const b1 = await apply(byName('Priya'), jobFrontend, 5, 'Portfolio link in resume.');
  const b2 = await apply(byName('Sneha'), jobFrontend, 4);
  // Data analyst: strong
  const c1 = await apply(byName('Rohan'), jobDataAnalyst, 4);
  const c2 = await apply(byName('Sneha'), jobDataAnalyst, 3);
  // Internship: partial, partial
  const d1 = await apply(byName('Sneha'), jobIntern, 2);
  const d2 = await apply(byName('Vikram'), jobIntern, 1);

  // advance pipeline (statuses persisted with history)
  await advance(a1.id, 'SHORTLISTED', 6, 'Excellent skill overlap and API experience.');
  await advance(a1.id, 'INTERVIEW', 4, 'Technical panel scheduled.');
  await advance(a2.id, 'UNDER_REVIEW', 5);
  await advance(b1.id, 'SHORTLISTED', 3);
  await advance(b1.id, 'INTERVIEW', 2, 'UI task review call.');
  await advance(c1.id, 'SHORTLISTED', 2);
  await advance(a4.id, 'REJECTED', 3, 'Profile does not meet the programming requirements for this role. (Human decision)');
  await advance(d1.id, 'UNDER_REVIEW', 1);

  // interviews
  await prisma.interview.create({
    data: {
      applicationId: a1.id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 3600 * 1000 * 5),
      mode: 'ONLINE',
      locationOrLink: 'https://meet.example.com/hiresphere-tech-a1',
      notes: 'Round 2: Django + ML case discussion',
    },
  });
  await prisma.interview.create({
    data: {
      applicationId: b1.id,
      scheduledAt: new Date(Date.now() + 3 * 24 * 3600 * 1000 + 3600 * 1000 * 3),
      mode: 'ONSITE',
      locationOrLink: 'Bengaluru Office — Meeting Room 4',
      notes: 'UI task walkthrough',
    },
  });

  // recompute per-status scores snapshot in application rows is already set by apply()

  // ---------- hired candidate → employee ----------
  const hiredApp = await apply(byName('Aarav'), jobFrontend, 26);
  await advance(hiredApp.id, 'SHORTLISTED', 22);
  await advance(hiredApp.id, 'INTERVIEW', 19);
  await advance(hiredApp.id, 'SELECTED', 16);
  await advance(hiredApp.id, 'HIRED', 15, 'Offer accepted.');

  // ---------- employees ----------
  const aarav = byName('Aarav');
  const aaravUser = await prisma.user.findUnique({ where: { email: aarav.user.name ? 'aarav.sharma@example.com' : '' } });

  const employeeSeed = [
    { code: 'HS-EMP-0001', name: 'Kavya Iyer', email: 'kavya.iyer@hiresphere.ai', dept: eng.id, designation: 'Senior Backend Engineer', joined: 900, userId: undefined as string | undefined, phone: '+91 98450 10101' },
    { code: 'HS-EMP-0002', name: 'Dev Patel', email: 'dev.patel@hiresphere.ai', dept: eng.id, designation: 'Frontend Engineer', joined: 420, userId: undefined as string | undefined, phone: '+91 98450 20202' },
    { code: 'HS-EMP-0003', name: 'Meera Joshi', email: 'meera.joshi@hiresphere.ai', dept: hrDept.id, designation: 'HR Generalist', joined: 700, userId: undefined as string | undefined, phone: '+91 98450 30303' },
    { code: 'HS-EMP-0004', name: 'Sanjay Kumar', email: 'sanjay.kumar@hiresphere.ai', dept: dataDept.id, designation: 'Data Analyst', joined: 260, userId: undefined as string | undefined, phone: '+91 98450 40404' },
  ];

  const employees: any[] = [];
  for (const e of employeeSeed) {
    const emp = await prisma.employee.create({
      data: {
        employeeCode: e.code,
        name: e.name,
        workEmail: e.email,
        phone: e.phone,
        departmentId: e.dept,
        designation: e.designation,
        joiningDate: daysAgo(e.joined),
        status: 'ACTIVE',
        address: 'Bengaluru, India',
        createdById: hrUser.id,
      },
    });
    employees.push(emp);
    for (const lt of [annual, sick, casual]) {
      await prisma.leaveBalance.create({
        data: { employeeId: emp.id, leaveTypeId: lt.id, year: new Date().getFullYear(), quota: lt.annualQuota, used: 0 },
      });
    }
  }

  // hired candidate → employee portal account (role upgrade)
  if (aaravUser) {
    const empAarav = await prisma.employee.create({
      data: {
        employeeCode: 'HS-EMP-0005',
        userId: aaravUser.id,
        name: 'Aarav Sharma',
        workEmail: 'aarav.sharma@hiresphere.ai',
        phone: '+91 98200 11223',
        departmentId: eng.id,
        designation: 'Software Engineer',
        joiningDate: daysAgo(15),
        status: 'ON_PROBATION',
        sourceApplicationId: hiredApp.id,
        createdById: hrUser.id,
      },
    });
    employees.push(empAarav);
    for (const lt of [annual, sick, casual]) {
      await prisma.leaveBalance.create({
        data: { employeeId: empAarav.id, leaveTypeId: lt.id, year: new Date().getFullYear(), quota: lt.annualQuota, used: 0 },
      });
    }
    await prisma.user.update({ where: { id: aaravUser.id }, data: { role: 'EMPLOYEE' } });
    console.log('👤 aarav.sharma@example.com upgraded to EMPLOYEE (employee portal demo)');
  }

  // ---------- attendance (last 14 days, weekdays) ----------
  const statuses: string[] = ['PRESENT', 'PRESENT', 'LATE', 'PRESENT', 'WFH', 'PRESENT', 'HALF_DAY', 'ABSENT'];
  for (const emp of employees) {
    for (let d = 0; d < 14; d++) {
      const date = daysAgo(d);
      const dow = date.getUTCDay();
      if (dow === 0 || dow === 6) continue;
      const seedIdx = (d + emp.employeeCode.charCodeAt(emp.employeeCode.length - 1)) % statuses.length;
      const status = d === 0 && emp.employeeCode === 'HS-EMP-0002' ? 'LATE' : statuses[seedIdx];
      const checkIn = status === 'LATE' ? '10:14' : '09:05';
      const checkOut = status === 'HALF_DAY' ? '13:30' : '18:20';
      const workHours = status === 'HALF_DAY' ? 4 : status === 'ABSENT' ? 0 : 8.5;
      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
          checkIn: status === 'ABSENT' ? null : new Date(`${date.toISOString().slice(0, 10)}T${checkIn}:00Z`),
          checkOut: status === 'ABSENT' ? null : new Date(`${date.toISOString().slice(0, 10)}T${checkOut}:00Z`),
          status,
          workHours,
          createdById: hrUser.id,
        },
      }).catch(() => { /* unique collision skip */ });
    }
  }

  // ---------- leave requests ----------
  const currentYear = new Date().getFullYear();
  const empForLeave = employees[0];
  await prisma.leaveRequest.create({
    data: {
      employeeId: employees[1].id,
      leaveTypeId: casual.id,
      startDate: new Date(`${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-22T00:00:00Z`),
      endDate: new Date(`${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-23T00:00:00Z`),
      days: 2,
      reason: 'Family function out of town.',
      status: 'PENDING',
    },
  });
  await prisma.leaveRequest.create({
    data: {
      employeeId: employees[3].id,
      leaveTypeId: sick.id,
      startDate: daysAgo(6),
      endDate: daysAgo(5),
      days: 2,
      reason: 'Fever and medical rest advised.',
      status: 'APPROVED',
      reviewedById: hrUser.id,
      reviewedByName: hrUser.name,
      reviewedAt: daysAgo(5),
      reviewNote: 'Get well soon.',
    },
  });
  await prisma.leaveBalance.update({
    where: { employeeId_leaveTypeId_year: { employeeId: employees[3].id, leaveTypeId: sick.id, year: currentYear } },
    data: { used: 2 },
  });
  await prisma.leaveRequest.create({
    data: {
      employeeId: empForLeave.id,
      leaveTypeId: annual.id,
      startDate: daysAgo(20),
      endDate: daysAgo(18),
      days: 3,
      reason: 'Vacation with family.',
      status: 'REJECTED',
      reviewedById: hrUser.id,
      reviewedByName: hrUser.name,
      reviewedAt: daysAgo(19),
      reviewNote: 'Release freeze during quarter close.',
    },
  });
  await prisma.leaveRequest.create({
    data: {
      employeeId: empForLeave.id,
      leaveTypeId: casual.id,
      startDate: daysAgo(9),
      endDate: daysAgo(9),
      days: 1,
      reason: 'Home maintenance visit.',
      status: 'APPROVED',
      reviewedById: hrUser.id,
      reviewedByName: hrUser.name,
      reviewedAt: daysAgo(9),
    },
  });
  await prisma.leaveBalance.update({
    where: { employeeId_leaveTypeId_year: { employeeId: empForLeave.id, leaveTypeId: casual.id, year: currentYear } },
    data: { used: 1 },
  });

  // ---------- performance reviews ----------
  await prisma.performanceReview.createMany({
    data: [
      {
        employeeId: employees[0].id,
        reviewerId: hrUser.id,
        reviewerName: hrUser.name,
        period: `${currentYear}-H1`,
        reviewDate: daysAgo(60),
        rating: 5,
        goals: 'Own payments service refactor; mentor two juniors.',
        achievements: 'Delivered refactor 2 weeks early; both mentees shipped independent features.',
        feedback: 'Outstanding ownership and code quality. Ready for architect track discussion.',
        strengths: 'System design, mentoring',
        areasToImprove: 'Delegation of on-call duties',
      },
      {
        employeeId: employees[1].id,
        reviewerId: hrUser.id,
        reviewerName: hrUser.name,
        period: `${currentYear}-H1`,
        reviewDate: daysAgo(55),
        rating: 4,
        goals: 'Ship design-system v2; cut bundle size 20%.',
        achievements: 'Design-system v2 adopted by 4 teams; bundle size down 24%.',
        feedback: 'Strong execution. Improve PR documentation for smoother reviews.',
        strengths: 'UI craftsmanship, performance tuning',
        areasToImprove: 'Written documentation',
      },
      {
        employeeId: employees[3].id,
        reviewerId: hrUser.id,
        reviewerName: hrUser.name,
        period: `${currentYear}-H1`,
        reviewDate: daysAgo(40),
        rating: 4,
        goals: 'Automate weekly HR reports.',
        achievements: '3 manual reports automated; stakeholder satisfaction up.',
        feedback: 'Reliable analyst with good SQL instincts.',
        strengths: 'SQL, stakeholder communication',
        areasToImprove: 'Python proficiency',
      },
    ],
  });

  // ---------- notifications ----------
  await prisma.notification.createMany({
    data: [
      { userId: aaravUser?.id ?? hrUser.id, title: 'Welcome to the team! 🎉', message: 'Your employee record HS-EMP-0005 is active. Explore your employee portal.', type: 'HR_ACTION', link: '#/employee/dashboard' },
      { userId: hrUser.id, title: 'New application received', message: 'Sneha Kulkarni applied for Software Engineer Intern.', type: 'HR_ACTION', link: '#/hr/applications' },
      { userId: hrUser.id, title: 'Interview scheduled', message: 'Aarav Sharma — Python Developer round 2 is on the calendar.', type: 'INTERVIEW', link: '#/hr/applications' },
      { userId: admin.id, title: 'Weekly digest', message: 'Recruitment funnel is healthy: 10 applications across 4 open jobs.', type: 'SYSTEM', link: '#/admin/dashboard' },
      { userId: hrUser.id, title: 'Leave request pending', message: 'Dev Patel requested 2 days of Casual Leave.', type: 'LEAVE_UPDATE', link: '#/hr/leaves' },
    ],
  });

  // ---------- audit trail ----------
  await prisma.auditLog.createMany({
    data: [
      { actorId: admin.id, actorName: admin.name, actorRole: 'ADMIN', action: 'USER_CREATED', entityType: 'USER', entityId: hrUser.id, details: 'Created HR account for Karan Malhotra', createdAt: daysAgo(35) },
      { actorId: hrUser.id, actorName: hrUser.name, actorRole: 'HR', action: 'JOB_PUBLISHED', entityType: 'JOB', entityId: jobPython.id, details: 'Published "Python Developer (AI Screening Team)"', createdAt: daysAgo(10) },
      { actorId: hrUser.id, actorName: hrUser.name, actorRole: 'HR', action: 'JOB_PUBLISHED', entityType: 'JOB', entityId: jobFrontend.id, details: 'Published "Frontend Developer — React"', createdAt: daysAgo(6) },
      { actorId: hrUser.id, actorName: hrUser.name, actorRole: 'HR', action: 'APPLICATION_STATUS_CHANGED', entityType: 'APPLICATION', entityId: a1.id, details: 'APPLIED → SHORTLISTED', createdAt: daysAgo(6) },
      { actorId: hrUser.id, actorName: hrUser.name, actorRole: 'HR', action: 'AI_ANALYSIS_RUN', entityType: 'APPLICATION', entityId: a1.id, details: 'tfidf-cosine-v1.0 re-analysis', createdAt: daysAgo(5) },
      { actorId: hrUser.id, actorName: hrUser.name, actorRole: 'HR', action: 'EMPLOYEE_CREATED_FROM_HIRE', entityType: 'EMPLOYEE', entityId: 'seed', details: 'Aarav Sharma hired via application → HS-EMP-0005', createdAt: daysAgo(15) },
      { actorId: hrUser.id, actorName: hrUser.name, actorRole: 'HR', action: 'LEAVE_DECISION', entityType: 'LEAVE', entityId: 'seed', details: 'Approved sick leave for Sanjay Kumar', createdAt: daysAgo(5) },
      { actorId: admin.id, actorName: admin.name, actorRole: 'ADMIN', action: 'REPORT_EXPORTED', entityType: 'SYSTEM', entityId: null, details: 'Exported recruitment report (CSV)', createdAt: daysAgo(2) },
    ],
  });

  await prisma.systemSetting.createMany({
    data: [
      { key: 'org_name', value: 'HireSphere Technologies (Demo)' },
      { key: 'work_start', value: '09:00' },
      { key: 'work_end', value: '18:00' },
      { key: 'late_after_minutes', value: '15' },
    ],
  });

  console.log('\n✅ Seed complete. Demo accounts (password for all: %s):', DEMO_PASSWORD);
  console.log('   ADMIN     admin@hiresphere.ai');
  console.log('   HR        hr@hiresphere.ai');
  console.log('   EMPLOYEE  aarav.sharma@example.com (upgraded from hired candidate)');
  console.log('   CANDIDATE priya.nair@example.com / rohan.mehta@example.com / sneha.kulkarni@example.com');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
