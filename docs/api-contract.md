# HireSphere AI — API Contract (Binding for all agents)

Every endpoint returns the envelope `{ ok: true, data }` on success or
`{ ok: false, error: { code, message, details? } }` on failure with proper HTTP status.

- Auth = httpOnly cookie `hs_token` (JWT). Sent automatically by fetch with `credentials: 'include'` (same-origin so default fetch works).
- Roles: `ADMIN | HR | CANDIDATE | EMPLOYEE`.
- List endpoints accept `?page=&pageSize=&search=&sortBy=&sortDir=(asc|desc)` and return
  `{ items, total, page, pageSize, totalPages }`.
- Helpers: `import { ok, fail, handler, requireAuth, parseBody, getPagination, paginated, rateLimit, logAudit, notify, ApiError, getSession, clientIp } from '@/lib/api'`.
  `handler()` wraps `(req, ctx)` and auto-converts `ApiError`/`ZodError` to responses.
- Constants/labels: `@/lib/constants` (ROLES, APPLICATION_STATUSES, APPLICATION_TRANSITIONS, LABELS, RESUME_MAX_SIZE…).
- Prisma client: `import { db } from '@/lib/db'`.
- AI engine: `@/lib/ai/resume-matcher` (`analyzeResume`, `extractResumeInfo`, `jobTextOf`), `@/lib/ai/pdf-parser` (`validateResumeFile`, `extractResumeText`, `safeStoredName`, `PdfParseError`).
- Statuses are strings; validate against constants. Use `LABELS` for display text.
- JSON-string-array columns: Job.requiredSkills/preferredSkills, Resume.parsedData, ResumeAnalysis.matchedSkills/missingSkills/extraSkills/weights/extractedInfo. Parse with `JSON.parse` when reading.
- Uploader dir: `uploads/resumes/` (project root). `import { UPLOAD_DIR } from '@/lib/storage'` — helper exported there (mkdir recursive + path builder). SEEDED by Task 1. If not present when you code Task 2-a, create `src/lib/storage.ts` exporting `UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'resumes')` and `resumeFilePath(storedName)`.

## Auth `/api/auth`
- `POST /api/auth/register` — body `{ name, email, password, phone? }`. Creates role=CANDIDATE + CandidateProfile. Rate-limit 10/5min. Duplicate email → 409 `EMAIL_EXISTS`. Audit `AUTH_REGISTER`. Auto-login (sets cookie).
- `POST /api/auth/login` — body `{ email, password }`. Rate-limit 10/5min. Sets cookie, updates lastLoginAt, audit `AUTH_LOGIN`. Wrong creds → 401 `INVALID_CREDENTIALS`. Suspended → 403 `ACCOUNT_DISABLED`. Response data: `{ user: {id,email,name,role} }`.
- `POST /api/auth/logout` — clears cookie.
- `GET /api/auth/me` — returns `{ user }` or 401. `{ user: { id, email, name, role, phone, status, hasEmployeeRecord, candidateProfile? } }` where candidateProfile is included for CANDIDATE role.
- `POST /api/auth/forgot-password` — body `{ email }`. Always 200 with generic message (no user enumeration). Creates PasswordResetToken (sha256 hash stored, 1h expiry). In DEV (NODE_ENV!=='production') response data includes `{ devResetToken }` so the flow is testable without email service — document this. Audit `AUTH_PASSWORD_RESET_REQUESTED` (no email in details).
- `POST /api/auth/reset-password` — body `{ token, password }`. Validates token hash + expiry + unused, sets new passwordHash, marks usedAt, invalidates. Audit `AUTH_PASSWORD_RESET_COMPLETED`.

## Users (Admin) `/api/users`
- `GET /api/users?role=&status=&...pagination` — ADMIN only. Items include id,email,name,role,status,phone,lastLoginAt,createdAt.
- `POST /api/users` — ADMIN only. Body `{ name, email, password, role: HR|ADMIN, phone? }`. Audit `USER_CREATED`.
- `PATCH /api/users/[id]` — ADMIN only. Body `{ name?, phone?, role?, status? (ACTIVE|SUSPENDED) }`. Cannot demote/deactivate self. Audit `USER_UPDATED`.
- `DELETE /api/users/[id]` — ADMIN only, soft action = set status SUSPENDED. Audit `USER_DEACTIVATED`. Admin cannot deactivate self.

## Departments `/api/departments`
- `GET /api/departments` — any authenticated. List with `{id,name,description,_count:{employees,jobs}}`.
- `POST /api/departments` — HR/ADMIN. Body `{ name, description? }`. Unique name → 409.

## Jobs `/api/jobs`
- `GET /api/jobs` — public for candidates (only status=OPEN unless authenticated HR/ADMIN; HR/ADMIN can pass `?status=DRAFT|OPEN|CLOSED|ALL&departmentId=&employmentType=&location=`). Items include department, `_count: { applications }`, parsed requiredSkills/preferredSkills arrays.
- `POST /api/jobs` — HR/ADMIN. Body `{ title, description, departmentId?, location, employmentType, experienceMin?, educationReq?, requiredSkills: string[], preferredSkills: string[], salaryMin?, salaryMax?, openings?, status?: DRAFT|OPEN }`. Validate arrays of nonempty strings (max 15 each). Audit `JOB_CREATED`. If OPEN → publishedAt=now, audit `JOB_PUBLISHED`.
- `GET /api/jobs/[id]` — public if OPEN; DRAFT/CLOSED only HR/ADMIN. Include department + application counts.
- `PATCH /api/jobs/[id]` — HR/ADMIN. Partial of create body + `status`. Transition DRAFT→OPEN sets publishedAt; →CLOSED sets closedAt. Audit `JOB_UPDATED` / `JOB_PUBLISHED` / `JOB_CLOSED`.
- `DELETE /api/jobs/[id]` — HR/ADMIN. Only if zero applications, else 409 `JOB_HAS_APPLICATIONS`. Audit `JOB_DELETED`.
- `GET /api/jobs/[id]/applications` — HR/ADMIN. Include candidate.user(name,email), resume meta, analysis scores. Pagination + `?status=`.
- `GET /api/jobs/[id]/ranking` — HR/ADMIN. Returns all applications for the job with candidate name, status, matchScore/tfidfScore/skillScore, matchedSkills/missingSkills (parsed), experienceYears from analysis.extractedInfo or candidate profile, education. Sortable by client; default sort matchScore desc (nulls last). Add `?minScore=&skill=&status=`.

## Resumes `/api/resumes`
- `POST /api/resumes/upload` — CANDIDATE (auth) — multipart/form-data field `file`. Use `validateResumeFile`, store to UPLOAD_DIR with `safeStoredName`, `extractResumeText`, `extractResumeInfo`; save Resume with parseStatus SUCCESS/FAILED (on parse fail still store file + parseError, parseStatus=FAILED, extractedText=null). Marks previous resumes isActive=false. Response data: resume row (id, fileName, parseStatus, parsedData parsed, uploadedAt). Audit `RESUME_UPLOADED`. Rate-limit 20/10min.
- `GET /api/resumes/mine` — CANDIDATE. List own resumes (id, fileName, fileSize, parseStatus, isActive, uploadedAt).
- `GET /api/resumes/[id]` — owner CANDIDATE or HR/ADMIN. Returns metadata + extractedText + parsedData (parsed JSON).
- `GET /api/resumes/[id]/download` — owner CANDIDATE or HR/ADMIN. Streams PDF: `new NextResponse(buffer, { headers: {'Content-Type':'application/pdf','Content-Disposition': attachment; filename="..."} })`. Read with `fs.promises.readFile(resumeFilePath(storedName))`. 404 if file missing.

## Applications `/api/applications`
- `POST /api/applications` — CANDIDATE. Body `{ jobId, resumeId?, answers? }`. Job must be OPEN (409 `JOB_CLOSED`). Duplicate active application (same job, candidate, status != WITHDRAWN) → 409 `DUPLICATE_APPLICATION`. resumeId defaults to candidate's active resume; if none → 400 `NO_RESUME`. Creates Application status=APPLIED, runs the AI pipeline SYNCHRONOUSLY (call `runAnalysisForApplication(applicationId)` helper from `@/lib/ai/analyze-service` — Task 2-a creates this: loads resume text + job, calls analyzeResume, upserts ResumeAnalysis, updates Application.matchScore/tfidfScore/skillScore; swallow errors → analysis stays absent, never blocks applying). Creates ApplicationStatusHistory (APPLIED, actor=candidate). Notifies all HR users `HR_ACTION`. Audit `APPLICATION_SUBMITTED`.
- `GET /api/applications` — role-scoped: CANDIDATE → own (include job, resume, analysis, statusHistory latest first); HR/ADMIN → all with `?jobId=&status=`. Pagination.
- `GET /api/applications/[id]` — owner CANDIDATE or HR/ADMIN. Include job(+department), resume(parsedData + parseStatus), analysis (all JSON parsed), statusHistory asc, interviews.
- `PATCH /api/applications/[id]/status` — HR/ADMIN. Body `{ status, note? }`. Validate against APPLICATION_TRANSITIONS (400 `INVALID_TRANSITION`). Special rule: body `{ status: 'WITHDRAWN' }` allowed for CANDIDATE owner too via `/api/applications/[id]/withdraw`. Creates history entry, updates updatedAt. If →HIRED set nothing else here (employee creation is a separate explicit endpoint). Notify candidate `APPLICATION_UPDATE` with link `#/portal/applications`. Audit `APPLICATION_STATUS_CHANGED`.
- `POST /api/applications/[id]/withdraw` — CANDIDATE owner. Allowed unless status already WITHDRAWN/HIRED/REJECTED. History + audit.
- `PATCH /api/applications/[id]/notes` — HR/ADMIN. Body `{ hrNotes }`. Audit `APPLICATION_NOTES_UPDATED`.
- `POST /api/applications/[id]/interviews` — HR/ADMIN. Body `{ scheduledAt (ISO), mode, locationOrLink?, notes? }`. Creates Interview status=SCHEDULED; also moves application status to INTERVIEW via transition check (if legal) + history. Notify candidate. Audit `INTERVIEW_SCHEDULED`.

## AI `/api/ai`
- `POST /api/ai/analyze/[applicationId]` — HR/ADMIN. Re-runs pipeline (same helper) and returns analysis. 400 `ANALYSIS_FAILED` with message if resume text unavailable (parseStatus FAILED / empty). Audit `AI_ANALYSIS_RUN`.
- `GET /api/ai/analysis/[applicationId]` — owner CANDIDATE (their own, without missing-skills? include full — it's their own resume) or HR/ADMIN. Returns analysis or 404 `NO_ANALYSIS`.

## Employees `/api/employees`
- `GET /api/employees?departmentId=&status=&...pagination` — HR/ADMIN. Include department, `_count` attendance/leaves/reviews.
- `POST /api/employees` — HR/ADMIN. Body `{ name, workEmail, phone?, departmentId?, designation, joiningDate (ISO), status?, address?, emergencyContact?, userId?, sourceApplicationId? }`. Generates employeeCode `HS-EMP-####` sequential (count existing + 1, padded). Audit `EMPLOYEE_CREATED`.
- `GET /api/employees/[id]` — HR/ADMIN or the EMPLOYEE owner (user.userId match). Include department + leaveBalances(+leaveType).
- `PATCH /api/employees/[id]` — HR/ADMIN. Partial body. Audit `EMPLOYEE_UPDATED`.
- `POST /api/employees/hire/[applicationId]` — HR/ADMIN. Application must be status HIRED (400 `NOT_HIRED`). **Idempotent**: if an Employee with sourceApplicationId exists → return it (200, `alreadyCreated: true`). Body `{ departmentId?, designation, joiningDate?, workEmail? }`. Creates Employee (name from candidate.user.name, workEmail default candidate email, userId = candidate userId so they get the employee portal, upgrades user role to EMPLOYEE, status ACTIVE, sourceApplicationId set). Creates LeaveBalance rows for current year from all LeaveTypes. Notifies the new employee. Audit `EMPLOYEE_CREATED_FROM_HIRE`. Prevents duplicates via unique(sourceApplicationId) catch → return existing.

## Attendance `/api/attendance`
- `GET /api/attendance?employeeId=&month=YYYY-MM&...pagination` — HR/ADMIN any employee; EMPLOYEE only own (force employeeId from session). Include employee{name,employeeCode}.
- `POST /api/attendance` — HR/ADMIN. Body `{ employeeId, date (YYYY-MM-DD), status, checkIn? (HH:mm), checkOut? (HH:mm), note? }`. Unique (employeeId,date) → 409 `DUPLICATE_ATTENDANCE`. workHours computed if both times. Audit `ATTENDANCE_RECORDED`.
- `PATCH /api/attendance/[id]` — HR/ADMIN correction. Audit `ATTENDANCE_CORRECTED`.
- `GET /api/attendance/summary?month=YYYY-MM` — HR/ADMIN (all) or EMPLOYEE (own). Returns per-employee counts `{ employeeId, name, employeeCode, present, absent, late, halfDay, leave, wfh, total }`.

## Leaves `/api/leaves`
- `GET /api/leaves/types` — any authenticated.
- `POST /api/leaves/types` — HR/ADMIN `{ name, annualQuota, description? }`.
- `GET /api/leaves/requests?status=&employeeId=` — HR/ADMIN all; EMPLOYEE own only. Include employee{name,employeeCode}, leaveType{name}.
- `POST /api/leaves/requests` — EMPLOYEE (or HR on behalf with employeeId). Body `{ leaveTypeId, startDate, endDate, reason }`. Validate: start<=end, both >= today (allow past only for HR), days = inclusive day diff (count days, min 0.5 not needed — use whole days), overlap with existing PENDING/APPROVED → 409 `LEAVE_OVERLAP`, balance check quota-used >= days → 400 `INSUFFICIENT_BALANCE`. Status PENDING. Audit `LEAVE_REQUESTED`.
- `PATCH /api/leaves/requests/[id]` — HR/ADMIN. Body `{ status: APPROVED|REJECTED|CANCELLED, reviewNote? }`. Employee can only CANCEL own PENDING request (body `{status: CANCELLED}` when session role EMPLOYEE). **Employees can never approve** — enforce role. On APPROVED: increment LeaveBalance.used, if attendance rows within range don't exist create LEAVE entries (best-effort, skip if exist). Notify employee. Audit `LEAVE_DECISION`.
- `GET /api/leaves/balances` — EMPLOYEE own balances (+leaveType); HR/ADMIN pass `?employeeId=`.

## Performance `/api/performance`
- `GET /api/performance?employeeId=` — HR/ADMIN all/filtered; EMPLOYEE own only. Include employee{name,employeeCode}.
- `POST /api/performance` — HR/ADMIN. Body `{ employeeId, period, reviewDate, rating (1-5 int), goals, achievements, feedback, strengths?, areasToImprove? }`. reviewerId = session.sub, reviewerName = session.name. Audit `PERFORMANCE_REVIEW_CREATED`.
- `PATCH /api/performance/[id]` — HR/ADMIN (or the author reviewer). Audit `PERFORMANCE_REVIEW_UPDATED`.

## Dashboard `/api/dashboard`
- `GET /api/dashboard/stats` — HR/ADMIN. `{ totalEmployees, activeJobs, totalCandidates, totalApplications, shortlisted, interviewsScheduled (interviews with status SCHEDULED + future), hired, pendingLeaves }`.
- `GET /api/dashboard/charts` — HR/ADMIN. `{ funnel: [{stage,label,count}] for APPLIED→HIRED pipeline counts (per application current status), applicationTrends: [{date,count}] last 14 days (applications per day, zero-filled), departmentWise: [{name,count}] employees per department, attendanceOverview: [{status,label,count}] for today, recentApplications: latest 6 (candidate name, job title, status, matchScore, appliedAt), recentActivities: latest 8 audit logs (HR-relevant entities) }`.
- `GET /api/dashboard/candidate` — CANDIDATE. `{ activeJobs, myApplications, myShortlisted, profileCompleteness (0-100: has resume 40, phone 15, headline 15, education 15, summary 15), recentStatus: latest status change }`.
- `GET /api/dashboard/employee` — EMPLOYEE (their Employee record). `{ profile: {…employee}, todayAttendance, monthlyPresent (current month count), pendingLeaves, latestReview (rating+period), leaveBalances }`.

## Reports `/api/reports`
- `GET /api/reports/[type]?from=&to=&format=(json|csv)` — HR/ADMIN. Types: `recruitment` (per job: title, total, shortlisted, interviewed, hired, avgMatchScore), `pipeline` (application-level: candidate, job, status, matchScore, appliedAt), `employees`, `attendance?month=`, `leaves`, `performance`, `screening` (analysis rows: candidate, job, tfidf, skill, final, version). CSV = text/csv with headers; response `new NextResponse(csv, {headers})`. Enforce role. Audit `REPORT_EXPORTED` for csv.

## Notifications `/api/notifications`
- `GET /api/notifications` — own, latest 30 + `unreadCount`.
- `PATCH /api/notifications/[id]/read` — own.
- `PATCH /api/notifications/read-all` — own.

## Audit `/api/audit-logs`
- `GET /api/audit-logs?entityType=&action=&...pagination` — ADMIN only.

## Misc
- `GET /api/health` — public. `{ ok:true, data:{ status:'healthy', timestamp, version } }`.
- `GET /api/settings` — ADMIN. `PATCH /api/settings` — ADMIN body `{ key, value }`. Audit `SETTING_UPDATED`.

## Rules
1. Every route file starts with `export const dynamic = 'force-dynamic'` where DB access happens (default in Next 16 dynamic APIs, but be explicit on GETs using cookies).
2. NEVER return raw db errors to client — `handler()` catches; throw `ApiError` for expected cases.
3. Ownership checks: CANDIDATE only own application/resume/profile; EMPLOYEE only own attendance/leave/performance. HR sees all; ADMIN sees all + admin features.
4. Never store/return plaintext passwords, tokens, or passwordHash.
5. Transactions (db.$transaction) for multi-write operations (application submit, status change + history, hire → employee + balances).
6. Files in `src/app/api/**/route.ts`. Dynamic segments use `{ params }: { params: Promise<{ id: string }> }` — `await params` (Next 16).
