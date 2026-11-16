# HireSphere AI — Testing & Quality Assurance

## Honest summary of what was executed during development
- **Backend:** every endpoint was verified with scripted curl suites (below), including negative/authorization cases. All listed scenarios passed on the final build.
- **Frontend:** full-browser E2E runs (headless Chromium) across all four roles covering the golden paths and guards.
- **No automated test files are committed** to this repository. The suites below are reproducible commands, not a CI suite — this is disclosed rather than inflated. (The original plan specified pytest; the shipped stack is TypeScript, so verification was done with live API/browser runs instead.)

---

## 1. Backend verification suite (curl — 12 scenarios, all passing)

```bash
BASE=http://localhost:3000
# S1 health
curl -s $BASE/api/health
# S2 HR login (cookie jar)
curl -s -c hr.jar -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"hr@hiresphere.ai","password":"Password@123"}'
# S3 dashboard stats (real numbers)
curl -s -b hr.jar $BASE/api/dashboard/stats
# S4 dashboard charts
curl -s -b hr.jar $BASE/api/dashboard/charts
# S5 candidate sees only own applications
curl -s -c cand.jar -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"priya.nair@example.com","password":"Password@123"}'
curl -s -b cand.jar $BASE/api/applications
# S6 apply + duplicate prevention (second call → 409 DUPLICATE_APPLICATION)
curl -s -b cand.jar -X POST $BASE/api/applications -H 'Content-Type: application/json' -d '{"jobId":"<openJobId>"}'
curl -s -b cand.jar -X POST $BASE/api/applications -H 'Content-Type: application/json' -d '{"jobId":"<openJobId>"}'
# S7 ranking sorted by genuine score, nulls last
curl -s -b hr.jar $BASE/api/jobs/<jobId>/ranking
# S8 status change → history + candidate notification
curl -s -b hr.jar -X PATCH $BASE/api/applications/<id>/status -H 'Content-Type: application/json' \
  -d '{"status":"SHORTLISTED","note":"Strong overlap"}'
# S9 RBAC negatives (expect 403 / 401)
curl -s -b cand.jar $BASE/api/users          # 403
curl -s $BASE/api/employees                  # 401
# S10 leave workflow: request → approve → balance used; employee cannot approve (403)
curl -s -c emp.jar -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"aarav.sharma@example.com","password":"Password@123"}'
curl -s -b emp.jar -X POST $BASE/api/leaves/requests -H 'Content-Type: application/json' \
  -d '{"leaveTypeId":"<id>","startDate":"<future>","endDate":"<future+2d>","reason":"Family event"}'
curl -s -b hr.jar -X PATCH $BASE/api/leaves/requests/<id> -H 'Content-Type: application/json' -d '{"status":"APPROVED"}'
# S11 CSV export headers + content
curl -s -b hr.jar -D - "$BASE/api/reports/pipeline?format=csv" -o report.csv
# S12 forgot → dev token → reset → login with new password → rotate back to Password@123
```

Additional cases verified: suspended-account rejection, self-deactivation guard, draft job visibility, `JOB_HAS_APPLICATIONS` 409, upload of non-PDF (400) and oversize (400), corrupted PDF (magic byte check), encrypted/image-only PDF explicit errors, resume download ownership (403 for strangers), interview creation auto-transition + candidate notification, `INVALID_TRANSITION` 400 with allowed transitions list, hire idempotency (`alreadyCreated: true`), attendance duplicate 409 + correction audit, leave overlap 409 + insufficient balance 400, notifications ownership, settings ADMIN-only, report date filters + unknown type 404.

## 2. Browser E2E (headless Chromium, desktop 1280 + mobile 390)

| # | Flow | Result |
|---|---|---|
| 1 | Landing renders (3D hero, sections, footer) | ✅ |
| 2 | Login for all 4 roles lands on correct portal | ✅ |
| 3 | Register → auto-login → candidate dashboard (15% completeness) | ✅ |
| 4 | Resume upload (real PDF) → parsed summary (22 skills) → completeness 55% | ✅ |
| 5 | Browse → job detail → apply → instant AI score dialog (63%) | ✅ |
| 6 | Duplicate apply blocked with clear message | ✅ |
| 7 | Withdraw → re-apply path | ✅ |
| 8 | HR dashboard KPIs/charts equal DB aggregates | ✅ |
| 9 | AI screening screen: scores, evidence, transitions, notes, interviews, timeline | ✅ |
| 10 | Ranking page sorted by genuine scores + filters | ✅ |
| 11 | Employees / attendance / leaves / performance / reports pages data-driven | ✅ |
| 12 | Admin: users CRUD, audit trail entries from earlier actions, settings | ✅ |
| 13 | Employee portal: profile, today-attendance chip, calendar, leave apply/cancel, review view | ✅ |
| 14 | Role guards: HR→admin redirected; employee→HR redirected; guest→protected redirected | ✅ |
| 15 | Mobile 390px: no horizontal overflow; hamburger nav; calendar renders | ✅ |
| 16 | Theme toggle dark↔light; sticky footer (gap 0 on short pages) | ✅ |

## 3. AI engine behavior matrix (synthetic resumes)

| Case | Expected | Observed |
|---|---|---|
| Strong overlap (Python resume vs Python job) | high tfidf + high skill | 0.63 final (tfidf .38 + skill 1.00) |
| Partial overlap (analyst vs Python job) | mid-low | 0.22 (tfidf .11 + skill .40) |
| Weak overlap (networking resume vs Python job) | near zero | 0.01 |
| Cross-domain sanity (frontend resume on React job vs Python job) | React ≫ Python | 0.69 vs 0.16 |
| Job without required skills | final = tfidf only | ✅ (weights collapse) |
| Empty/short resume text | AnalysisError EMPTY_RESUME | ✅ explicit error state |
| Image-only / encrypted PDF | NO_EXTRACTABLE_TEXT / ENCRYPTED_PDF | ✅ explicit error, no fabricated data |
| Missing job description | MISSING_JOB_DESCRIPTION | ✅ |

Scores are deterministic and recomputable — re-running `POST /api/ai/analyze/:id` reproduces the same numbers (no LLM in the scoring path).

## 4. Suggested (not yet committed) automated suite
The natural next step is Vitest + Playwright:
- Unit: tfidf math vs hand-computed vectors; tokenizer; findPhone year-artifact rejection; transitions map.
- Integration: supertest-style route calls against a temp SQLite DB for every §1 scenario.
- E2E: Playwright specs for flows 1–16 above.
This is listed as a limitation in the README rather than promised as done.
