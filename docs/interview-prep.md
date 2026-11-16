# HireSphere AI — Placement Interview Preparation

Q&A organized by topic, written from what the project actually implements. Numbers (scores, weights) are examples from the seeded demo — recompute live during an interview to show honesty.

## 1. Architecture & stack mapping

**Q: Your plan said Flask + MySQL — what did you build?**
A: The sandbox runtime is Node-based, so I built the same architecture on Next.js route handlers (equivalent of Flask blueprints), Prisma ORM (equivalent of SQLAlchemy) and SQLite (schema written to be MySQL-portable — provider switch + migrate). The AI engine is a faithful TF-IDF + cosine implementation; the math is language-agnostic. I can also walk through how each module maps to the Flask layout (models/, routes/, services/, ai_engine/).

**Q: Why is the frontend a single page with hash routing?**
A: Constraint of the preview environment (one exposed page) plus instant SPA navigation and deep-linkable URLs (`#/hr/jobs/:id`). Guards live in the router for UX, but every API re-checks authorization server-side — hiding buttons is never the security model.

## 2. REST API design

**Q: What makes your API "RESTful"?**
A: Resource-oriented paths (`/api/jobs`, `/api/applications/:id/status`), correct verbs and status codes (201 creates, 409 conflicts like duplicate application, 422 validation, 429 rate-limit), a consistent JSON envelope `{ok, data|error:{code,message}}`, pagination/sort/search conventions on collections, and stateless auth via a signed cookie.

**Q: How do you prevent a candidate from seeing someone else's application?**
A: Two layers: `requireAuth([CANDIDATE])` verifies identity and role, then the handler filters/loads by the session user's candidate profile — the WHERE clause includes ownership, so another ID simply 404s/403s. Same pattern for employee self-scoping.

## 3. Database design

**Q: How did you prevent duplicate job applications?**
A: At the database level — a composite UNIQUE constraint on `(jobId, candidateId)` in `Application`, plus a friendly 409 in the API. Code-level checks alone are race-prone; the DB is the final arbiter.

**Q: How is the hire→employee conversion kept idempotent?**
A: `Employee.sourceApplicationId` is unique. The conversion endpoint returns the existing employee (`alreadyCreated: true`) instead of creating a duplicate when HR retries.

**Q: Why denormalize actor name/role into history and audit rows?**
A: Those are historical records — they must survive user deletion. The FK keeps referential integrity where the relation is "live" (e.g. application→job), while actor snapshots preserve history.

**Q: Explain the attendance uniqueness rule.**
A: UNIQUE `(employeeId, date)` — one row per person per day. Corrections PATCH the same row and record who changed it; the API returns 409 `DUPLICATE_ATTENDANCE` otherwise.

## 4. Authentication & security

**Q: Walk through your auth flow.**
A: bcrypt hash stored for passwords (never plaintext). Login verifies the hash, signs a JWT (HS256, 7-day expiry) with jose, sets it in an **httpOnly, SameSite=Lax** cookie (`secure` in production) — so JavaScript can't read it (XSS mitigation). Every protected request re-verifies the token **and** re-checks the user's status in the DB, so suspensions take effect immediately.

**Q: CSRF considerations?**
A: Cookie is SameSite=Lax, which blocks cross-site POSTs in modern browsers; all writes are JSON (not form-encoded) via same-origin fetch. For cookie-session systems you'd additionally rotate tokens — noted as production hardening.

**Q: Rate limiting?**
A: In-memory per-IP sliding windows on login/register/reset/upload (e.g. 10 login attempts / 5 min). Honest limitation: per-process; Redis would be needed for multi-instance.

**Q: File upload safety?**
A: extension + MIME + magic-byte (`%PDF-`) checks, ≤5 MB, ≤20 pages, randomized stored filename, path-sanitized writes outside `public/`, and downloads served only through an authorization-checked API route.

## 5. NLP / AI matching

**Q: Explain TF-IDF.**
A: Term Frequency × Inverse Document Frequency. TF rewards terms appearing often in a document; IDF down-weights terms common across documents (the, and). I mirror scikit-learn's formulation: `idf = ln((1+N)/(1+df)) + 1` with L2-normalized vectors, so cosine similarity = dot product.

**Q: Why cosine similarity?**
A: It measures angle, not magnitude — a 2-page and a 6-page resume with the same vocabulary/profile get comparable scores, ignoring document length.

**Q: What's in your job document vs resume document?**
A: Job doc = title (weighted by repetition) + description + required/preferred skills; resume doc = full extracted text. Pool-aware ranking builds IDF over the job + all candidate resumes so common terms get properly down-weighted.

**Q: What is the skill-overlap component and why add it to TF-IDF?**
A: TF-IDF is purely lexical — "5 years of REST API" won't necessarily beat essays that mention 'rest'. The dictionary component matches ~85 canonical skills through alias patterns and computes `matched_required / required`. Final score = 0.6·tfidf + 0.4·skill (env-configurable, stored per analysis). If a job defines no required skills, the score collapses to TF-IDF alone.

**Q: How do you avoid pretending the score is more than it is?**
A: Labels and copy matter: it's a *text similarity / decision-support signal*, never "fit probability". Every analysis stores the formula weights, shared terms, per-skill resume evidence and `algorithmVersion`. The UI carries a permanent banner and the system has no auto-reject path — rejection is a human action that's audited.

**Q: Limitations of your matcher?**
A: Lexical: no semantics beyond the dictionary (embeddings would fix that); parsing is heuristic (unusual layouts may miss fields — shown as "—", never guessed); scanned PDFs can't be read; English-centric.

**Q: How would you upgrade it?**
A: Sentence embeddings (local MiniLM-style model) for semantic similarity blended with the skill overlap, then a calibrated model trained on labeled outcomes — with fairness audits before any automation.

## 6. Software testing

**Q: How did you test without a committed test suite?**
A: Reproducible scripted verification: a 12-scenario curl suite for the API (including 401/403 negatives, duplicates, transitions, CSV headers) and headless-browser E2E across all four roles (16 flows). It's documented in docs/testing.md. Honest gap: not packaged as Vitest/Playwright CI yet — that's the first thing I'd add next.

**Q: Give an example of a bug your testing caught.**
A: The screening screen crashed with `certifications.join is not a function` — extraction returns a string section, the frontend assumed an array. Fixed the contract + render. Also a skill-dictionary false positive: alias "tf" made "TF-IDF" match TensorFlow; removed the alias and re-seeded.

## 7. Deployment

**Q: How would you deploy this?**
A: Node standalone build behind Nginx with HTTPS, pm2, managed MySQL (`prisma migrate deploy`), `SESSION_SECRET` from the environment, uploads on a persistent volume, health check at `/api/health`, nightly mysqldumps. Free tiers exist but sleep/throttle — documented honestly in docs/deployment.md.

## 8. Individual contribution (be ready to demo)

- Database: 17-table schema, FKs, uniques, indexes — explain any of them live.
- Backend: 49 route files, one middleware-style helper set, transactions on multi-writes.
- AI engine: written from scratch — walk through `tfidf.ts` line by line.
- Frontend: design system, role-based shells, dashboards, screening workspace.
- Testing/deploy/docs: everything in `docs/`.

**Demo script (5 min):** login as HR → open job → ranking (genuine scores) → open top candidate → show evidence + formula → move to Interview → login as candidate (new tab) → show status + notification → back to HR → hire → create employee → login as that employee → attendance/leave.
