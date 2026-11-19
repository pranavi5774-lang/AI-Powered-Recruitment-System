# Database Architecture — HireSphere AI
**Lead Developer:** Sakshi Sable (PRN: SCFU224029)  
**Specialization:** Database Design + ORM + Schema Modeling  
**ORM:** Prisma ORM • **Database:** SQLite (Development) / MySQL 8.0 (Production)  

---

## 📁 Directory Structure
```
Database/
├── schema/                  # Prisma Schema (19 Relational Entities)
│   └── schema.prisma        # Complete entity definitions, relations & indices
├── client/                  # Prisma Client singleton instance (db.ts)
├── seeds/                   # Seed script generating authentic test records (seed.ts)
├── sqlite/                  # Active development database (dev.db)
└── diagrams/                # 300 DPI High-Resolution ER Diagram (database_er_diagram.png)
```

## 📊 19 Relational Models Overview
1. **User:** Core credentials, multi-role (ADMIN, HR, CANDIDATE, EMPLOYEE), status.
2. **PasswordResetToken:** Secure 1-hour expiry tokens.
3. **CandidateProfile:** Phone, headline, bio, experience years, skills JSON.
4. **Resume:** Private disk storage path, original filename, parsed text, file size.
5. **Department:** Organizational hierarchy.
6. **Job:** Requisitions, department link, required skills array, min experience.
7. **Application:** Job-Candidate relation with compound unique constraint `@@unique([jobId, candidateId])`.
8. **ApplicationStatusHistory:** Audit trail of status transitions.
9. **ResumeAnalysis:** AI match score, canonical matched skills, missing skills, sentence evidence.
10. **Interview:** Round types (TECHNICAL, HR), scheduled timestamp, feedback, score.
11. **InterviewFeedback:** Detailed interviewer evaluations.
12. **Employee:** Idempotent conversion from candidate (`HS-EMP-xxxx`), job title, salary.
13. **AttendanceRecord:** Daily clock-in/out with `@@unique([employeeId, date])` integrity.
14. **LeaveRequest:** Type (CASUAL, SICK, PAID), status, manager approval notes.
15. **LeaveBalance:** Annual entitlements and remaining balances.
16. **PerformanceReview:** Review cycles, ratings (1-5), promotion eligibility.
17. **Notification:** Recipient alerts with read tracking.
18. **AuditLog:** System action records with user IP and timestamp.
19. **SystemSetting:** Key-value configuration parameters.
