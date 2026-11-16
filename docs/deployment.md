# HireSphere AI — Deployment Guide

## 1. What you're deploying
- A **Next.js 16** application (frontend + REST API in one process)
- **Prisma** data layer → SQLite in dev; **MySQL** recommended for production
- Resume files on disk (`uploads/resumes/`) → persistent volume or object storage

## 2. Environment variables (production)

| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `mysql://user:pass@host:3306/hiresphere` | Set provider to `"mysql"` in `prisma/schema.prisma` first |
| `SESSION_SECRET` | 64-char random string | **Required.** `openssl rand -hex 32` / PowerShell: `-join ((48..57)+(97..122) | Get-Random -Count 64 \| % {[char]$_})` |
| `UPLOAD_DIR` | `/var/data/uploads/resumes` | Put uploaded resumes on persistent storage; defaults to `uploads/resumes` locally. |
| `NODE_ENV` | `production` | Enables secure cookie flag + hides dev reset token |
| `AI_WEIGHT_TFIDF` / `AI_WEIGHT_SKILL` | `0.6` / `0.4` | Optional; must sum ≤ 1 (weights are normalized) |

Never commit `.env`. A template is provided at `.env.example`.

## Render deployment (single-instance SQLite)

The root `render.yaml` describes a Docker web service with a persistent disk
mounted at `/var/data`. The database and uploaded resumes are stored on that
disk, so they survive service restarts and redeploys. This configuration uses a
paid Render instance with a persistent disk and is intended for a single app
instance; do not scale it horizontally. For a larger production workload, use
managed MySQL and private object storage instead.

After creating the service, create the first administrator without using the
development seed (which contains shared demo passwords and synthetic records):

1. In the Render service environment, set `BOOTSTRAP_ADMIN_EMAIL`,
   `BOOTSTRAP_ADMIN_NAME`, and a unique `BOOTSTRAP_ADMIN_PASSWORD` (at least
   12 characters). Do not put these values in source control or chat.
2. Open the service Shell and run `node scripts/bootstrap-admin.cjs` once.
3. Remove all three bootstrap variables from the service environment and redeploy.

The command refuses to create another administrator once one already exists.
The production sign-in page does not display development demo credentials.

## 3. Build & run (any Node host / VPS)

```bash
# 1. install + build
bun install            # or: npm ci
bun run db:push        # or: bunx prisma migrate deploy   (production: migrate deploy)
bun run build          # produces standalone build

# 2. start (standalone output)
NODE_ENV=production node .next/standalone/server.js
# with process manager
pm2 start .next/standalone/server.js --name hiresphere
```

For the classic Flask-like VPS layout, put **Nginx (HTTPS) → Node process** in front:

```nginx
server {
  server_name hiresphere.example.com;
  listen 443 ssl http2;
  # ssl_certificate ... (Let's Encrypt: certbot --nginx)

  client_max_body_size 6m;          # resume uploads ≤ 5 MB

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 4. Platform options (honest notes)

| Platform | Fits? | Watch-outs |
|---|---|---|
| **Render / Railway** (Node + MySQL) | Good fit | Free tiers **sleep** (cold starts) and may require paid MySQL. Set health check `/api/health`. Use persistent disk for `uploads/`. |
| **VPS (Hetzner/DigitalOcean/EC2)** | Best control | Run MySQL locally or managed; pm2 + certbot; cheapest at scale. |
| **Vercel** | Frontend fine | Serverless + filesystem is ephemeral → move uploads to S3/R2 and DB to managed MySQL/PlanetScale-style before deploying here. |
| **PythonAnywhere / Flask hosts** | ❌ not for this build | This build is Node; the Flask plan is a documented alternative architecture. |

Free tiers change often and may sleep, throttle or bill — verify limits before promising anything in a demo.

## 5. Production hardening checklist
- [ ] `SESSION_SECRET` set (32+ chars), rotated periodically
- [ ] `NODE_ENV=production` (secure cookies, no dev reset token)
- [ ] MySQL with least-privilege user (no DDL rights after migration)
- [ ] Nightly `mysqldump` + uploads backup, restore tested
- [ ] HTTPS enforced (HSTS optional), CORS same-origin (default)
- [ ] Change/remove all seed demo accounts (`admin@…`, `hr@…`, etc.)
- [ ] Rate limits reviewed (in-memory → Redis if multi-instance)
- [ ] Health check wired to platform monitoring (`GET /api/health`)

## 6. Health check
```
GET /api/health → 200 { ok: true, data: { status: "healthy", database: "connected" } }
```
The endpoint executes a real DB query — wire it to platform uptime probes.

## 7. Database migration process (production)
```bash
# switch schema provider to mysql first (see docs/database.md)
bunx prisma migrate deploy      # applies committed migrations, no data loss
bunx prisma migrate status      # verify
```

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `500` on every API call | DB unreachable / wrong `DATABASE_URL` | Check platform logs; verify connectivity (`GET /api/health`) |
| Login loops back to login page | Cookie not stored (http vs https mismatch) | Serve over HTTPS or set `secure: false` only for local http testing |
| Upload fails with 413 | Proxy body-size limit | Nginx: `client_max_body_size 6m` |
| `SESSION_SECRET` changed → everyone logged out | Expected | JWTs are signed with it; re-login |
| 3D hero missing | WebGL blocked / reduced-motion | By design — CSS fallback renders; check console |
| Resume parse fails "image-only" | Scanned PDF | Expected & honest: ask candidate for a text PDF |

## 9. Verifying a live deployment (do this before claiming "live")
1. `GET /api/health` returns `healthy`.
2. Register a fresh candidate → upload your own PDF → see a parsed summary.
3. Apply to an open job → instant AI score appears.
4. Login as HR → open the application → analysis panel + evidence visible.
5. Approve a leave as HR → employee balance decremented.
6. Check `#/admin/audit` shows the actions above.
