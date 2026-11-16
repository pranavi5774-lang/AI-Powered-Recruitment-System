# HireSphere AI — Architecture

## 1. High-level layers

```
Presentation (SPA)  →  Application/API (route handlers)  →  Domain services (AI engine, analysis service)  →  Data (Prisma + SQLite/MySQL)  →  Filesystem (private uploads)
```

### Presentation — single-page application at `/`
- The product renders exclusively at the Next.js route `/`. All screens are client components selected by a **hash router** (`src/lib/router.ts`, zustand): `#/hr/jobs`, `#/portal/jobs/:id`, etc.
- Why hash routing: one deployable page, instant navigation, deep-linkable URLs inside sandboxed/preview environments.
- State:
  - **Server state** — fetched per view through `src/lib/api-client.ts` (`get/post/patch/del` unwrap the `{ok,data}` envelope and throw typed `ApiError`).
  - **Client state** — zustand stores: router, auth (`src/lib/store.ts`), confirm-dialog host.
- Role guards are applied in the root view (`src/app/page.tsx`): `/admin/*` → ADMIN, `/hr/*` → HR|ADMIN, `/portal/*` → CANDIDATE, `/employee/*` → EMPLOYEE. Guards are UX only; the backend re-checks everything.

### Application/API — Next.js Route Handlers
- Mirrors the classic "Flask blueprints" layout: one folder per resource under `src/app/api/**/route.ts` (49 route files).
- Shared middleware implemented as composable helpers (`src/lib/api.ts`):
  - `handler()` — wraps every route; converts `ApiError`/`ZodError` to the standard envelope; masks unexpected errors (`500 INTERNAL_ERROR`, details only in server logs).
  - `requireAuth(req, roles)` — verifies the JWT cookie, then re-checks the user's status in DB (suspended users are rejected even with valid tokens).
  - `rateLimit()` — in-memory sliding window for `auth/login`, `auth/register`, `auth/forgot-password`, `resumes/upload`.
  - `logAudit()` / `notify()` — side-effect helpers used by business routes.
- Response envelope: `{ ok: true, data }` | `{ ok: false, error: { code, message, details? } }` with correct HTTP statuses (400/401/403/404/409/422/429/500).

### Domain services
- `src/lib/ai/analyze-service.ts` — orchestrates one analysis: load Application+Resume+Job → `analyzeResume()` → transaction (upsert `ResumeAnalysis`, snapshot scores onto `Application`).
- AI engine modules (pure, deterministic, unit-testable):
  - `text-preprocessing.ts` — normalization, stopwords, light stemmer, sentence split, section extraction.
  - `skill-dictionary.ts` — ~85 canonical skills with alias patterns; returns evidence snippets.
  - `tfidf.ts` — scikit-learn-compatible TF-IDF (smooth idf, L2 norm) + cosine similarity + pool-ranking.
  - `resume-matcher.ts` — scoring composition, explanation builder, resume information extraction.
  - `pdf-parser.ts` — magic-byte/type/size validation, unpdf extraction, safe filename generation.

### Data
- Prisma models (17) documented in `docs/database.md`; transactions via `db.$transaction` for multi-table writes.
- Resume PDFs are stored in `uploads/resumes/` **outside** `public/`. They are never statically served — the only access path is `GET /api/resumes/:id/download`, which performs role/ownership checks per request.

## 2. Security model

| Concern | Implementation |
|---|---|
| Passwords | bcrypt (cost 10); plaintext never stored/logged |
| Sessions | JWT HS256 (jose), httpOnly + SameSite=Lax cookie, 7-day expiry, `secure` in production |
| Authorization | `requireAuth(roles)` on every protected route + per-record ownership checks |
| Account state | DB status re-checked on every request (suspension is immediate) |
| Input validation | Zod schemas per endpoint; extra fields ignored; string lengths bounded |
| SQL injection | Prisma parameterized queries only |
| File uploads | extension + MIME + magic bytes + size ≤ 5 MB + page cap; randomized stored names; private directory |
| Rate limiting | login/register/reset/upload buckets per IP |
| XSS | React escaping; no `dangerouslySetInnerHTML` on user content |
| Error leakage | `handler()` masks internals; users only see coded messages |
| Audit | actor snapshot (id, name, role), action, entity, details, IP — passwords/tokens never logged |

## 3. Request lifecycle (example: candidate applies)

```
POST /api/applications {jobId, resumeId}
 └─ requireAuth([CANDIDATE])                     → 401/403 if not candidate
 └─ zod parse                                    → 422 on bad payload
 └─ load job (must be OPEN)                      → 409 JOB_CLOSED
 └─ duplicate check (unique jobId+candidateId)   → 409 DUPLICATE_APPLICATION
 └─ resume ownership check                       → 403
 └─ db.$transaction:
      create Application (APPLIED) + history row
 └─ runAnalysisForApplication(appId)             → TF-IDF + skill overlap + evidence
      upsert ResumeAnalysis, snapshot scores     (failure here never blocks the application)
 └─ notify all HR users · audit APPLICATION_SUBMITTED
 └─ 201 { application with analysis summary }
```

## 4. Frontend module map

```
src/
  app/page.tsx                  # SPA root: auth bootstrap + role-guarded router switch
  app/api/**/route.ts           # 49 REST endpoints
  lib/  router · api-client · store · auth · api helpers · constants
        ai/ (preprocessing, dictionary, tfidf, matcher, pdf, analyze-service)
        serialize · datetime · storage
  components/spa/
    layout/    DashboardShell · SidebarNav · Topbar · nav-config
    shared/    DataTable · StatCard · StatusBadge · charts · ScoreBar/Ring
               EmptyState · ErrorState · Loading · ConfirmDialog · formatters …
    landing/   Landing · HeroCanvas (R3F + fallbacks)
    auth/      Login · Register · ForgotPassword · ResetPassword
    admin/     Dashboard · Users · AuditLogs · OrgReports · Settings
    hr/        Dashboard · Jobs · JobForm · JobDetail · Applications ·
               ApplicationDetail (AI screening) · CandidateRanking · Employees ·
               EmployeeDetail · Attendance · Leaves · Performance · Reports
    candidate/ Dashboard · BrowseJobs · PublicJobDetail · MyApplications · Profile
    employee/  Dashboard · MyProfile · MyAttendance · MyLeaves · MyPerformance
```

## 5. Key design decisions & trade-offs
1. **SPA + hash routing** instead of multi-page routing → satisfies single-entry preview constraints; cost: manual title/SEO handling (acceptable for an authed product; landing is the public face).
2. **Synchronous AI analysis on apply** → candidate sees the score instantly; cost: ~50–150 ms added latency (measured trivially at this scale). Re-analysis is idempotent via `POST /api/ai/analyze/:id`.
3. **Denormalized actor fields** in history/audit (actorName/actorRole beside actorId) → history survives user deletion; cost: slight duplication.
4. **JSON-string columns** for arrays (SQLite has no scalar lists) → portable to MySQL JSON columns.
5. **String statuses + app-layer constants** (no DB enums) → SQLite compatibility; conversion guide in `docs/database.md`.
6. **3D hero behind dynamic import + ErrorBoundary + reduced-motion + IntersectionObserver** → heavy dependency never blocks first paint or breaks the page if WebGL fails.
