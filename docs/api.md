# HireSphere AI — API Documentation

Interactive exploration: import `docs/postman_collection.json` (structure below) into Postman, or use the curl recipes.

**Base URL:** `http://localhost:3000`
**Envelope:** `{ ok: true, data }` / `{ ok: false, error: { code, message, details? } }`
**Auth:** httpOnly cookie `hs_token` (JWT). Login sets it; all subsequent calls send it automatically (same-origin fetch or Postman cookie jar).

## Quick start (curl)

```bash
# login (stores cookie)
curl -s -c jar.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"hr@hiresphere.ai","password":"Password@123"}'

# authenticated call
curl -s -b jar.txt http://localhost:3000/api/dashboard/stats
```

## Endpoint map

### Auth — `/api/auth`
| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/register` | public | Candidate self-registration; auto-login; rate-limited |
| POST | `/login` | public | Sets cookie; updates lastLoginAt; rate-limited |
| POST | `/logout` | any | Clears cookie |
| GET | `/me` | any authed | Session user (+candidateProfile / employeeRecord) |
| POST | `/forgot-password` | public | Generic 200; dev mode returns `devResetToken` |
| POST | `/reset-password` | public | `{token, password}`; single-use hashed token, 1 h |

### Users & departments
| Method | Path | Roles |
|---|---|---|
| GET / POST | `/api/users` | ADMIN |
| PATCH / DELETE | `/api/users/[id]` | ADMIN (DELETE = suspend; self-protection) |
| GET / POST | `/api/departments` | any authed / HR+ADMIN |

### Jobs
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/jobs` | public→OPEN only; HR/ADMIN → `?status=` filter | search/filter/paginate |
| POST | `/api/jobs` | HR+ADMIN | DRAFT or OPEN |
| GET / PATCH / DELETE | `/api/jobs/[id]` | visibility rules; HR+ADMIN | DELETE blocked when applications exist (409) |
| GET | `/api/jobs/[id]/applications` | HR+ADMIN | |
| GET | `/api/jobs/[id]/ranking` | HR+ADMIN | `{job, total, items[]}`; `?minScore=&skill=&status=` |

### Resumes
| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/api/resumes/upload` | CANDIDATE | multipart `file`; PDF ≤5 MB; runs extraction + parsing; rate-limited |
| GET | `/api/resumes/mine` | CANDIDATE | |
| GET | `/api/resumes/[id]` | owner or HR+ADMIN | metadata + extracted text + parsed JSON |
| GET | `/api/resumes/[id]/download` | owner or HR+ADMIN | streams PDF (attachment) |

### Applications
| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/api/applications` | CANDIDATE | `{jobId, resumeId?}`; 409 DUPLICATE_APPLICATION; runs AI analysis |
| GET | `/api/applications` | CANDIDATE(own) / HR+ADMIN(all) | `?jobId=&status=&search=` |
| GET | `/api/applications/[id]` | owner / HR+ADMIN | full detail incl. analysis + history + interviews |
| PATCH | `/api/applications/[id]/status` | HR+ADMIN | transition-validated; history + notification |
| POST | `/api/applications/[id]/withdraw` | owner | |
| PATCH | `/api/applications/[id]/notes` | HR+ADMIN | |
| POST | `/api/applications/[id]/interviews` | HR+ADMIN | schedules + auto-transition to INTERVIEW when legal |

### AI
| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/api/ai/analyze/[applicationId]` | HR+ADMIN | re-runs pipeline, returns analysis |
| GET | `/api/ai/analysis/[applicationId]` | owner / HR+ADMIN | |

### Employees · Attendance · Leaves · Performance
| Method | Path | Roles | Notes |
|---|---|---|---|
| GET / POST | `/api/employees` | HR+ADMIN | directory + direct create |
| GET / PATCH | `/api/employees/[id]` | HR+ADMIN / self-read | |
| POST | `/api/employees/hire/[applicationId]` | HR+ADMIN | app must be HIRED; idempotent (`alreadyCreated`) |
| GET / POST | `/api/attendance` | HR+ADMIN / self-read | POST 409 on duplicate employee+date |
| PATCH | `/api/attendance/[id]` | HR+ADMIN | correction (audit ATTENDANCE_CORRECTED) |
| GET | `/api/attendance/summary?month=` | HR+ADMIN / self | per-employee counts |
| GET / POST | `/api/leaves/types` | authed / HR+ADMIN | |
| GET / POST | `/api/leaves/requests` | HR+ADMIN / EMPLOYEE | overlap + balance validation |
| PATCH | `/api/leaves/requests/[id]` | HR+ADMIN (approve/reject) / owner-cancel pending | approval updates balance + creates LEAVE attendance |
| GET | `/api/leaves/balances` | self / HR+ADMIN `?employeeId=` | |
| GET / POST | `/api/performance` | HR+ADMIN / self-read | |
| PATCH | `/api/performance/[id]` | HR+ADMIN / author | |

### Dashboards · Reports · Notifications · Audit · Misc
| Method | Path | Roles |
|---|---|---|
| GET | `/api/dashboard/stats` · `/api/dashboard/charts` | HR+ADMIN |
| GET | `/api/dashboard/candidate` | CANDIDATE |
| GET | `/api/dashboard/employee` | EMPLOYEE |
| GET | `/api/reports/[type]?from=&to=&format=json\|csv` | HR+ADMIN — types: `recruitment, pipeline, employees, attendance, leaves, performance, screening` |
| GET | `/api/notifications` · PATCH `/[id]/read` · PATCH `/read-all` | owner |
| GET | `/api/audit-logs` | ADMIN (`?entityType=&action=`) |
| GET | `/api/health` | public (DB check) |
| GET / PATCH | `/api/settings` | ADMIN |

## Pagination & sorting
List endpoints accept `?page=&pageSize=&search=&sortBy=&sortDir=asc|desc` and return
`{ items, total, page, pageSize, totalPages }`.

## Error codes you may handle in clients
`UNAUTHENTICATED(401)` · `FORBIDDEN(403)` · `ACCOUNT_DISABLED(403)` · `NOT_FOUND(404)` · `EMAIL_EXISTS(409)` · `DUPLICATE_APPLICATION(409)` · `JOB_CLOSED(409)` · `JOB_HAS_APPLICATIONS(409)` · `LEAVE_OVERLAP(409)` · `DUPLICATE_ATTENDANCE(409)` · `INVALID_TRANSITION(400)` · `NOT_HIRED(400)` · `NO_RESUME(400)` · `INSUFFICIENT_BALANCE(400)` · `INVALID_TYPE / FILE_TOO_LARGE / CORRUPTED_PDF / NO_EXTRACTABLE_TEXT / ENCRYPTED_PDF(400-422)` · `RATE_LIMITED(429)` · `VALIDATION_ERROR(422)` · `INTERNAL_ERROR(500)`

## Postman
`docs/postman_collection.json` — folders mirror the endpoint map; `{{base_url}}` variable; login request stores the cookie automatically.

```json
{
  "info": { "name": "HireSphere AI", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  "variable": [{ "key": "base_url", "value": "http://localhost:3000" }],
  "item": [
    { "name": "Auth", "item": [
      { "name": "Login", "request": { "method": "POST", "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{\n  \"email\": \"hr@hiresphere.ai\",\n  \"password\": \"Password@123\"\n}" },
        "url": "{{base_url}}/api/auth/login" } },
      { "name": "Me", "request": { "method": "GET", "url": "{{base_url}}/api/auth/me" } },
      { "name": "Register", "request": { "method": "POST", "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{\n  \"name\": \"New Candidate\",\n  \"email\": \"new@example.com\",\n  \"password\": \"Password@123\"\n}" },
        "url": "{{base_url}}/api/auth/register" } },
      { "name": "Logout", "request": { "method": "POST", "url": "{{base_url}}/api/auth/logout" } }
    ]},
    { "name": "Jobs", "item": [
      { "name": "List", "request": { "method": "GET", "url": "{{base_url}}/api/jobs?search=&page=1&pageSize=10" } },
      { "name": "Ranking", "request": { "method": "GET", "url": "{{base_url}}/api/jobs/:id/ranking" } }
    ]},
    { "name": "Applications", "item": [
      { "name": "Apply", "request": { "method": "POST", "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{\n  \"jobId\": \"<jobId>\"\n}" },
        "url": "{{base_url}}/api/applications" } },
      { "name": "Change status", "request": { "method": "PATCH", "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": { "mode": "raw", "raw": "{\n  \"status\": \"SHORTLISTED\",\n  \"note\": \"Strong overlap\"\n}" },
        "url": "{{base_url}}/api/applications/:id/status" } }
    ]},
    { "name": "AI", "item": [
      { "name": "Re-analyze", "request": { "method": "POST", "url": "{{base_url}}/api/ai/analyze/:applicationId" } }
    ]},
    { "name": "Dashboard", "item": [
      { "name": "Stats", "request": { "method": "GET", "url": "{{base_url}}/api/dashboard/stats" } },
      { "name": "Charts", "request": { "method": "GET", "url": "{{base_url}}/api/dashboard/charts" } }
    ]},
    { "name": "Reports", "item": [
      { "name": "Pipeline CSV", "request": { "method": "GET", "url": "{{base_url}}/api/reports/pipeline?format=csv" } }
    ]}
  ]
}
```
