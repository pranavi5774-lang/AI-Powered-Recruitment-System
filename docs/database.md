# HireSphere AI — Database Design

## 1. Engine & portability

The running build uses **SQLite** (`db/custom.db`) because the development sandbox provides it. The schema was written for **MySQL portability**:

```prisma
// prisma/schema.prisma — production switch
datasource db {
  provider = "mysql"                      // was "sqlite"
  url      = env("DATABASE_URL")          // mysql://user:pass@host:3306/hiresphere
}
```

```powershell
bun run db:push          # or: bunx prisma migrate dev --name init_mysql
```

Notes on the conversion:
- Status columns are `String` validated in `src/lib/constants.ts` (SQLite has no enums). On MySQL you may convert them to native `ENUM` columns — the application layer already constrains values, so this is optional.
- Array-shaped fields (job skills, analysis payloads) are JSON strings; on MySQL declare them as `JSON` or `TEXT` (current: `TEXT`, works on both).
- All IDs are cuid strings — no changes needed.

## 2. ER diagram (text form)

```
User 1──1 CandidateProfile 1──* Resume 1──* Application *──1 Job *──1 Department
 │                                                        │
 │ 1──* PasswordResetToken     Application 1──* ApplicationStatusHistory
 │ 1──* Notification           Application 1──* Interview
 │ 1──* PerformanceReview      Application 1──1 ResumeAnalysis
 │ 1──* Job (createdBy)
 └──1 Employee (nullable link)

Employee *──1 Department
Employee 1──* Attendance           (unique: employeeId+date)
Employee 1──* LeaveRequest *──1 LeaveType
Employee 1──* LeaveBalance         (unique: employeeId+leaveTypeId+year)
Employee 1──* PerformanceReview    (reviewer → User)

AuditLog / SystemSetting           (standalone)
```

### Mermaid version (paste into any renderer)

```mermaid
erDiagram
  USER ||--o| CANDIDATE_PROFILE : has
  USER ||--o| EMPLOYEE : "may become"
  USER ||--o{ PASSWORD_RESET_TOKEN : requests
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ JOB : creates
  USER ||--o{ PERFORMANCE_REVIEW : reviews
  CANDIDATE_PROFILE ||--o{ RESUME : uploads
  CANDIDATE_PROFILE ||--o{ APPLICATION : submits
  RESUME ||--o{ APPLICATION : supports
  JOB ||--o{ APPLICATION : receives
  DEPARTMENT ||--o{ JOB : groups
  DEPARTMENT ||--o{ EMPLOYEE : employs
  APPLICATION ||--o{ APPLICATION_STATUS_HISTORY : logs
  APPLICATION ||--o{ INTERVIEW : schedules
  APPLICATION ||--o| RESUME_ANALYSIS : scored_by
  APPLICATION ||--o{ EVALUATION_HISTORY : snapshots
  APPLICATION ||--o{ HR_REVIEW : reviewed_by
  EMPLOYEE ||--o{ ATTENDANCE : has
  EMPLOYEE ||--o{ LEAVE_REQUEST : makes
  EMPLOYEE ||--o{ LEAVE_BALANCE : holds
  LEAVE_TYPE ||--o{ LEAVE_REQUEST : typed
  LEAVE_TYPE ||--o{ LEAVE_BALANCE : quota
```

## 3. Model reference

| Model | Purpose | Key constraints / indexes |
|---|---|---|
| `User` | All accounts (ADMIN/HR/CANDIDATE/EMPLOYEE) | `email` unique; idx `role`, `status` |
| `PasswordResetToken` | Hashed reset tokens | idx `userId`; `expiresAt`, `usedAt` |
| `CandidateProfile` | Candidate details, completeness fields | `userId` unique |
| `Resume` | Uploaded PDF/DOCX + extracted text/structured data | `storedName` unique; idx `candidateId`, `(candidateId, contentHash)`, `parseStatus` |
| `Department` | Org units | `name` unique |
| `Job` | Postings incl. draft lifecycle | idx `status`, `departmentId`, `createdBy` |
| `Application` | Candidate×Job with pipeline status + score snapshot | **unique `(jobId, candidateId)`**; idx `status` |
| `ApplicationStatusHistory` | Immutable transition log (actor snapshot) | idx `applicationId`, `createdAt` |
| `Interview` | Scheduled interviews | idx `applicationId`, `scheduledAt` |
| `ResumeAnalysis` | Latest 12-parameter AI result: weights, evidence, recommendation, version | **unique `applicationId`** |
| `EvaluationHistory` | Score/weight/recommendation snapshot for each evaluation run | idx `(applicationId, createdAt)` |
| `HRReview` | Human review decision, reason, comments, reviewer snapshot | idx `(applicationId, createdAt)` |
| `Employee` | Workforce records (`HS-EMP-####`) | `employeeCode`, `workEmail` unique; `userId` unique nullable; `sourceApplicationId` unique nullable (idempotent hire) |
| `Attendance` | One row per employee per day | **unique `(employeeId, date)`**; idx `date` |
| `LeaveType` | Types + annual quota | `name` unique |
| `LeaveRequest` | Requests + decision metadata | idx `employeeId`, `status` |
| `LeaveBalance` | Yearly quota/used per type | **unique `(employeeId, leaveTypeId, year)`** |
| `PerformanceReview` | Periodic reviews 1–5 | idx `employeeId` |
| `Notification` | In-app alerts | idx `(userId, isRead)` |
| `AuditLog` | Tamper-tolerant action trail | idx `(entityType, entityId)`, `createdAt` |
| `SystemSetting` | Org settings (work hours, grace) | `key` unique |

## 4. Design reasoning (viva-ready)

1. **Why a snapshot of scores on `Application`?** Ranking lists and dashboards read thousands of rows; they should not parse analysis JSON each time. `ResumeAnalysis` remains the latest detailed report, and `EvaluationHistory` preserves prior runs.
2. **Why `sourceApplicationId` on Employee?** Makes hire→employee conversion idempotent and traceable; a retried workflow returns the existing record instead of duplicating.
3. **Why unique `(jobId, candidateId)`?** Duplicate application prevention is enforced by the database, not just code — the strongest guarantee.
4. **Why unique `(employeeId, date)` on Attendance?** Blocks double-marking at DB level; corrections update the same row and record the editor (`createdById`/`updatedById`).
5. **Why denormalized actor fields in history/audit?** Actor identity must survive user deletion; these are historical records, not live relations.
6. **JSON-string columns** — SQLite lacks scalar lists; documented above for MySQL.
7. **Cascades:** user→candidate profile→resumes→applications→history/analyses (deleting a candidate removes their PII); department refs are `SetNull` (history preserved); reviewer `SetNull` (review survives with reviewerName snapshot).

## 5. Resume evaluation data

`Job.evaluationWeights` and `Job.matchThresholds` store validated JSON configuration (weights total 100; thresholds descend strictly). `ResumeAnalysis.parameterScores` stores all 12 0–100 scores, configured weight, weighted contribution, explanation, resume evidence, and gaps. `ResumeAnalysis.parameterWeights` snapshots the exact per-job weights used; `recommendation` and `detailedExplanation` are persisted so reports load without re-running NLP. `EvaluationHistory` records each run, while `HRReview` stores human-only decisions and reasons independently from the application pipeline status.

After updating a checkout, synchronize its existing database schema with `npm run db:push` and regenerate Prisma Client with `npm run db:generate`. These commands apply the additive fields/tables; do not reset an existing database.

## 5. Commands

```powershell
bun run db:push        # push schema (dev)
bun run db:generate    # regenerate client
bun run db:migrate     # create a migration (named)
bun run src/scripts/seed.ts   # reset + seed demo data (idempotent)
```

## 6. Backup & restore

**SQLite (dev):**
```powershell
# backup
Copy-Item db\custom.db backups\custom-$(Get-Date -Format yyyyMMdd-HHmm).db
# restore
Copy-Item backups\custom-20250101-0900.db db\custom.db
```
Also back up `uploads\resumes\` — resumes live on disk, not in the DB.

**MySQL (production):**
```bash
mysqldump -u hiresphere -p --single-transaction --routines hiresphere > hiresphere-$(date +%F).sql
mysql -u hiresphere -p hiresphere < hiresphere-2025-01-01.sql
```
Schedule nightly dumps + offsite copy; test restores quarterly. Keep `uploads/` on persistent storage or object storage.
