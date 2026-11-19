# HireSphere AI — Complete Backend Source Code Documentation
**Lead Backend Developer:** Sakshi Sable (PRN: SCFU224029)  
**Lead AI Developer:** Pranavi Jadhav (PRN: SCFU224040)  
**Project Guide:** Dr. Arindam Sarkar  
**University:** MIT Vishwaprayag University, Solapur (School of Computing — BCA)  

---

## 📌 Executive Architecture Summary
The HireSphere AI backend is engineered as a secure, high-throughput RESTful architecture running on Node.js. It features:
- **Stateless Authentication:** Jose JWT with HS256 encryption, Bcrypt password hashing (10 salt rounds), and multi-role RBAC.
- **Atomic Persistence:** Prisma ORM connecting to SQLite/MySQL with ACID transactions ().
- **Explainable AI Engine:** Deterministic pure TypeScript NLP engine utilizing unpdf, canonical skill dictionary (~85 terms), and TF-IDF cosine similarity.

---


## 📄 Authentication & JWT Security Core
**File Path:** src/lib/auth.ts

`	ypescript
// ============================================================
// HireSphere AI — Authentication core
// bcryptjs password hashing + JWT session tokens (jose, HS256).
// Tokens are delivered as httpOnly cookies (SameSite=Lax).
// ============================================================

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { ROLES, type Role } from './constants';

function sessionSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error('SESSION_SECRET must be set to at least 32 characters in production');
    }
    return new TextEncoder().encode(secret);
  }
  return new TextEncoder().encode(secret || 'hiresphere-dev-secret-change-me-in-production');
}

export const SESSION_COOKIE = 'hs_token';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

export interface SessionPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: Role;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer('hiresphere-ai')
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(sessionSecretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecretKey(), { issuer: 'hiresphere-ai' });
    if (!payload.sub || !payload.role || !ROLES.includes(payload.role as Role)) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** Cryptographically strong random token (for password reset flow) */
export function generateResetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

`


## 📄 API Helper & Envelope Framework
**File Path:** src/lib/api.ts

`	ypescript
// ============================================================
// HireSphere AI — REST API helpers
// Response envelope, auth guards, pagination, rate limiting,
// audit logging and notifications. Every protected route MUST
// enforce authorization here (hiding UI is never sufficient).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { db } from './db';
import { SESSION_COOKIE, verifySession, type SessionPayload } from './auth';
import type { Role } from './constants';

// ---------- response envelope ----------

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** Wrap a route handler with consistent error handling. */
export function handler(fn: (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return fail(err.code, err.message, err.status, err.details);
      }
      if (err instanceof ZodError) {
        return fail('VALIDATION_ERROR', 'Invalid request data', 422, err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })));
      }
      console.error('[API] Unhandled error:', err);
      // Never leak internals to the client
      return fail('INTERNAL_ERROR', 'An unexpected error occurred', 500);
    }
  };
}

// ---------- auth guards ----------

/**
 * Resolve the session from the httpOnly cookie OR an
 * `Authorization: Bearer <token>` header.
 *
 * WHY the header fallback: the sandbox preview panel renders the app inside a
 * cross-origin iframe, where browsers do not store/send SameSite=Lax cookies.
 * The client therefore keeps the session JWT (returned by login/register) in
 * localStorage and sends it via the Authorization header. Same-origin, top-level
 * usage continues to work through the httpOnly cookie alone.
 */
export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const session = await verifySession(token);
    if (session) return session;
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return verifySession(authHeader.slice(7).trim());
  }
  return null;
}

export async function requireAuth(req: NextRequest, allowedRoles?: Role[]): Promise<SessionPayload> {
  const session = await getSession(req);
  if (!session) throw new ApiError('UNAUTHENTICATED', 'Authentication required', 401);
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new ApiError('FORBIDDEN', 'You do not have permission to perform this action', 403);
  }
  // Reject suspended accounts on every protected call
  const user = await db.user.findUnique({ where: { id: session.sub }, select: { status: true } });
  if (!user || user.status !== 'ACTIVE') throw new ApiError('ACCOUNT_DISABLED', 'This account has been deactivated', 403);
  return session;
}

// ---------- validation ----------

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError('INVALID_JSON', 'Request body must be valid JSON', 400);
  }
  return schema.parse(raw);
}

// ---------- pagination & query params ----------

export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  search: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export function getPagination(req: NextRequest, defaults?: { sortBy?: string }): Pagination {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? 10) || 10));
  const search = (sp.get('search') ?? '').trim().slice(0, 100);
  const sortBy = (sp.get('sortBy') ?? defaults?.sortBy ?? 'createdAt').replace(/[^a-zA-Z]/g, '') || 'createdAt';
  const sortDir = sp.get('sortDir') === 'asc' ? 'asc' : 'desc';
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize, search, sortBy, sortDir };
}

export function paginated<T>(items: T[], total: number, p: { page: number; pageSize: number }) {
  return { items, total, page: p.page, pageSize: p.pageSize, totalPages: Math.max(1, Math.ceil(total / p.pageSize)) };
}

// ---------- rate limiting (in-memory, per IP + bucket) ----------

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(req: NextRequest, bucket: string, max: number, windowMs: number) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = rateBuckets.get(key);
  if (!entry || entry.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > max) {
    throw new ApiError('RATE_LIMITED', 'Too many requests. Please try again later.', 429);
  }
}

// ---------- audit log ----------

export interface AuditInput {
  actor?: { id?: string; name: string; role: string } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string | null;
  ip?: string | null;
}

/** Records an audit trail entry. Never log passwords/tokens. */
export async function logAudit(input: AuditInput) {
  try {
    await db.auditLog.create({
      data: {
        actorId: input.actor?.id ?? null,
        actorName: input.actor?.name ?? 'System',
        actorRole: input.actor?.role ?? 'SYSTEM',
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        details: typeof input.details === 'string' ? input.details : input.details ? JSON.stringify(input.details) : null,
        ip: input.ip ?? null,
      },
    });
  } catch (err) {
    console.error('[AUDIT] Failed to record audit log:', err);
  }
}

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

// ---------- notifications ----------

export async function notify(userId: string, title: string, message: string, type: string, link?: string) {
  try {
    await db.notification.create({ data: { userId, title, message, type, link: link ?? null } });
  } catch (err) {
    console.error('[NOTIFY] Failed to create notification:', err);
  }
}

`


## 📄 Database Singleton Client
**File Path:** src/lib/db.ts

`	ypescript
import { PrismaClient } from '.prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
`


## 📄 POST /api/auth/login (User Sign-in)
**File Path:** src/app/api/auth/login/route.ts

`	ypescript
// POST /api/auth/login — email + password sign-in (sets httpOnly session cookie)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, parseBody, rateLimit, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { verifyPassword, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';
import type { Role } from '@/lib/constants';

const schema = z.object({
  email: z.email('A valid email is required').max(160),
  password: z.string().min(1, 'Password is required').max(72),
});

export const POST = handler(async (req) => {
  rateLimit(req, 'auth-login', 10, 5 * 60 * 1000);
  const body = await parseBody(req, schema);
  const email = body.email.trim().toLowerCase();

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new ApiError('INVALID_CREDENTIALS', 'Incorrect email or password', 401);
  }
  if (user.status !== 'ACTIVE') {
    throw new ApiError('ACCOUNT_DISABLED', 'This account has been deactivated', 403);
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role as Role });
  await logAudit({
    actor: { id: user.id, name: user.name, role: user.role },
    action: 'AUTH_LOGIN',
    entityType: 'AUTH',
    entityId: user.id,
    details: { email },
    ip: clientIp(req),
  });

  // `token` is also returned in the body so the SPA can attach it as
  // Authorization: Bearer … when cookies are unavailable (preview iframe).
  const response = ok({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return response;
});

`


## 📄 POST /api/auth/register (Candidate Registration)
**File Path:** src/app/api/auth/register/route.ts

`	ypescript
// POST /api/auth/register — candidate self-registration (auto-login)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, parseBody, rateLimit, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { hashPassword, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.email('A valid email is required').max(160),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  phone: z.string().trim().max(24).optional(),
});

export const POST = handler(async (req) => {
  rateLimit(req, 'auth-register', 10, 5 * 60 * 1000);
  const body = await parseBody(req, schema);
  const email = body.email.trim().toLowerCase();

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new ApiError('EMAIL_EXISTS', 'An account with this email already exists', 409);

  const passwordHash = await hashPassword(body.password);
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email, passwordHash, name: body.name, role: 'CANDIDATE', phone: body.phone ?? null },
    });
    await tx.candidateProfile.create({ data: { userId: created.id, phone: body.phone ?? null } });
    return created;
  });

  const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: 'CANDIDATE' });
  await logAudit({
    actor: { id: user.id, name: user.name, role: user.role },
    action: 'AUTH_REGISTER',
    entityType: 'AUTH',
    entityId: user.id,
    details: { email },
    ip: clientIp(req),
  });

  // `token` is also returned in the body so the SPA can attach it as
  // Authorization: Bearer … when cookies are unavailable (preview iframe).
  const response = ok(
    { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token },
    201
  );
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return response;
});

`


## 📄 GET /api/auth/me (Session Check)
**File Path:** src/app/api/auth/me/route.ts

`	ypescript
// GET /api/auth/me — current session user (any authenticated role)

export const dynamic = 'force-dynamic';

import { ok, handler, requireAuth, ApiError } from '@/lib/api';
import { db } from '@/lib/db';

export const GET = handler(async (req) => {
  const session = await requireAuth(req);
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      status: true,
      createdAt: true,
      candidateProfile: true,
      employee: { select: { id: true, employeeCode: true, designation: true } },
    },
  });
  if (!user) throw new ApiError('SESSION_USER_MISSING', 'Session user no longer exists', 401);
  const { employee, candidateProfile, ...rest } = user;
  return ok({
    user: {
      ...rest,
      hasEmployeeRecord: Boolean(employee),
      employeeRecord: employee ?? null,
      candidateProfile: user.role === 'CANDIDATE' ? candidateProfile : null,
    },
  });
});

`


## 📄 GET/POST /api/jobs (Job Requisitions)
**File Path:** src/app/api/jobs/route.ts

`	ypescript
// GET  /api/jobs — public job board (candidates/unauthenticated see OPEN only)
// POST /api/jobs — create job (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, getSession, requireAuth, parseBody, getPagination, paginated, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { JOB_STATUS, EMPLOYMENT_TYPES } from '@/lib/constants';
import { serializeJobSkills } from '@/lib/serialize';

const JOB_SORT: Record<string, string> = {
  title: 'title',
  location: 'location',
  createdat: 'createdAt',
  updatedat: 'updatedAt',
};

export const GET = handler(async (req) => {
  const session = await getSession(req);
  const isStaff = session?.role === 'HR' || session?.role === 'ADMIN';
  const p = getPagination(req);
  const sp = req.nextUrl.searchParams;

  const statusParam = sp.get('status') ?? undefined;
  let statusFilter: string | undefined;
  if (isStaff && statusParam && statusParam !== 'ALL') {
    if (!JOB_STATUS.includes(statusParam as never)) {
      throw new ApiError('INVALID_STATUS', 'status must be one of DRAFT, OPEN, CLOSED or ALL', 400);
    }
    statusFilter = statusParam;
  }

  const employmentType = sp.get('employmentType') ?? undefined;
  if (employmentType && !EMPLOYMENT_TYPES.includes(employmentType as never)) {
    throw new ApiError('INVALID_EMPLOYMENT_TYPE', 'Invalid employment type filter', 400);
  }
  const departmentId = sp.get('departmentId') ?? undefined;
  const location = sp.get('location') ?? undefined;

  const where = {
    ...(!isStaff || !statusParam ? { status: 'OPEN' as string } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(employmentType ? { employmentType } : {}),
    ...(location ? { location: { contains: location } } : {}),
    ...(p.search
      ? { OR: [{ title: { contains: p.search } }, { description: { contains: p.search } }] }
      : {}),
  };

  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where,
      orderBy: { [JOB_SORT[p.sortBy.toLowerCase()] ?? 'createdAt']: p.sortDir },
      skip: p.skip,
      take: p.take,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
    }),
    db.job.count({ where }),
  ]);

  return ok(
    paginated(
      jobs.map((j) => ({ ...j, ...serializeJobSkills(j) })),
      total,
      p
    )
  );
});

const skillsSchema = z.array(z.string().trim().min(1).max(60)).max(15, 'At most 15 skills');

export const createSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(8000),
  departmentId: z.string().min(1).nullish(),
  location: z.string().trim().min(2).max(120),
  employmentType: z.enum(EMPLOYMENT_TYPES).default('FULL_TIME'),
  experienceMin: z.coerce.number().min(0).max(30).default(0),
  educationReq: z.string().trim().max(200).nullish(),
  requiredSkills: skillsSchema.default([]),
  preferredSkills: skillsSchema.default([]),
  salaryMin: z.coerce.number().min(0).nullish(),
  salaryMax: z.coerce.number().min(0).nullish(),
  openings: z.coerce.number().int().min(1).max(100).default(1),
  status: z.enum(['DRAFT', 'OPEN']).default('DRAFT'),
});

export const POST = handler(async (req) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const body = await parseBody(req, createSchema);

  if (body.departmentId) {
    const dept = await db.department.findUnique({ where: { id: body.departmentId }, select: { id: true } });
    if (!dept) throw new ApiError('INVALID_DEPARTMENT', 'Department not found', 400);
  }
  if (body.salaryMin != null && body.salaryMax != null && body.salaryMin > body.salaryMax) {
    throw new ApiError('INVALID_SALARY_RANGE', 'salaryMin cannot exceed salaryMax', 400);
  }

  const isPublished = body.status === 'OPEN';
  const job = await db.job.create({
    data: {
      title: body.title,
      description: body.description,
      departmentId: body.departmentId ?? null,
      location: body.location,
      employmentType: body.employmentType,
      experienceMin: body.experienceMin,
      educationReq: body.educationReq ?? null,
      requiredSkills: JSON.stringify(body.requiredSkills),
      preferredSkills: JSON.stringify(body.preferredSkills),
      salaryMin: body.salaryMin ?? null,
      salaryMax: body.salaryMax ?? null,
      openings: body.openings,
      status: body.status,
      createdBy: session.sub,
      ...(isPublished ? { publishedAt: new Date() } : {}),
    },
    include: {
      department: { select: { id: true, name: true } },
      _count: { select: { applications: true } },
    },
  });

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'JOB_CREATED',
    entityType: 'JOB',
    entityId: job.id,
    details: { title: job.title, status: job.status },
    ip: clientIp(req),
  });
  if (isPublished) {
    await logAudit({
      actor: { id: session.sub, name: session.name, role: session.role },
      action: 'JOB_PUBLISHED',
      entityType: 'JOB',
      entityId: job.id,
      details: { title: job.title },
      ip: clientIp(req),
    });
  }

  return ok({ ...job, ...serializeJobSkills(job) }, 201);
});

`


## 📄 GET/POST /api/applications (Application Processing)
**File Path:** src/app/api/applications/route.ts

`	ypescript
// GET  /api/applications — role-scoped list (CANDIDATE/EMPLOYEE own; HR/ADMIN all)
// POST /api/applications — candidate applies to a job (runs AI pipeline synchronously)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, getPagination, paginated, logAudit, notify, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { APPLICATION_STATUSES, LABELS } from '@/lib/constants';
import { serializeAnalysis } from '@/lib/serialize';
import { runAnalysisForApplication } from '@/lib/ai/analyze-service';

const SORT: Record<string, string> = {
  appliedat: 'appliedAt',
  matchscore: 'matchScore',
  status: 'status',
  updatedat: 'updatedAt',
};

export const GET = handler(async (req) => {
  const session = await requireAuth(req);
  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  const p = getPagination(req, { sortBy: 'appliedAt' });
  const sp = req.nextUrl.searchParams;

  const statusParam = sp.get('status');
  if (statusParam && !APPLICATION_STATUSES.includes(statusParam as never)) {
    throw new ApiError('INVALID_STATUS', 'Invalid application status filter', 400);
  }
  const jobId = sp.get('jobId') ?? undefined;

  let where: Record<string, unknown> = {
    ...(statusParam ? { status: statusParam } : {}),
    ...(jobId ? { jobId } : {}),
  };

  if (!isStaff) {
    // CANDIDATE / EMPLOYEE → only their own applications
    const profile = await db.candidateProfile.findUnique({ where: { userId: session.sub }, select: { id: true } });
    where = { ...where, candidateId: profile?.id ?? 'none' };
  } else if (p.search) {
    where = { ...where, candidate: { user: { OR: [{ name: { contains: p.search } }, { email: { contains: p.search } }] } } };
  }

  const [applications, total] = await Promise.all([
    db.application.findMany({
      where,
      orderBy: { [SORT[p.sortBy.toLowerCase()] ?? 'appliedAt']: p.sortDir },
      skip: p.skip,
      take: p.take,
      include: {
        job: { include: { department: { select: { id: true, name: true } } } },
        candidate: { include: { user: { select: { name: true, email: true } } } },
        resume: { select: { id: true, fileName: true, parseStatus: true } },
        analyses: { take: 1 },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    }),
    db.application.count({ where }),
  ]);

  return ok(
    paginated(
      applications.map((a) => ({
        id: a.id,
        status: a.status,
        statusLabel: LABELS[a.status] ?? a.status,
        matchScore: a.matchScore,
        tfidfScore: a.tfidfScore,
        skillScore: a.skillScore,
        hrNotes: isStaff ? a.hrNotes : undefined,
        appliedAt: a.appliedAt,
        updatedAt: a.updatedAt,
        job: {
          id: a.job.id,
          title: a.job.title,
          location: a.job.location,
          employmentType: a.job.employmentType,
          status: a.job.status,
          department: a.job.department,
        },
        candidate: isStaff ? { name: a.candidate.user.name, email: a.candidate.user.email } : undefined,
        resume: a.resume,
        analysis: serializeAnalysis(a.analyses[0] ?? null),
        statusHistory: a.statusHistory.map((h) => ({
          id: h.id,
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          actorName: h.actorName,
          actorRole: h.actorRole,
          note: h.note,
          createdAt: h.createdAt,
        })),
      })),
      total,
      p
    )
  );
});

const applySchema = z.object({
  jobId: z.string().min(1, 'jobId is required'),
  resumeId: z.string().min(1).optional(),
  answers: z.record(z.string(), z.unknown()).optional(),
});

export const POST = handler(async (req) => {
  const session = await requireAuth(req, ['CANDIDATE']);
  const body = await parseBody(req, applySchema);

  const job = await db.job.findUnique({ where: { id: body.jobId } });
  if (!job) throw new ApiError('JOB_NOT_FOUND', 'Job not found', 404);
  if (job.status !== 'OPEN') throw new ApiError('JOB_CLOSED', 'This job is no longer accepting applications', 409);

  const profile = await db.candidateProfile.findUnique({
    where: { userId: session.sub },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!profile) throw new ApiError('CANDIDATE_PROFILE_MISSING', 'No candidate profile is linked to this account', 400);

  // Resolve resume: explicit resumeId (must be owned) or the candidate's active resume
  let resume;
  if (body.resumeId) {
    resume = await db.resume.findUnique({ where: { id: body.resumeId } });
    if (!resume || resume.candidateId !== profile.id) {
      throw new ApiError('INVALID_RESUME', 'Resume not found or does not belong to you', 403);
    }
  } else {
    resume = await db.resume.findFirst({
      where: { candidateId: profile.id, isActive: true },
      orderBy: { uploadedAt: 'desc' },
    });
    if (!resume) throw new ApiError('NO_RESUME', 'Upload a resume before applying', 400);
  }

  // Duplicate guard: same job + candidate with a live application
  const existing = await db.application.findUnique({
    where: { jobId_candidateId: { jobId: job.id, candidateId: profile.id } },
  });
  if (existing && existing.status !== 'WITHDRAWN') {
    throw new ApiError('DUPLICATE_APPLICATION', 'You have already applied to this job', 409);
  }

  const application = await db.$transaction(async (tx) => {
    const app = existing
      ? await tx.application.update({
          where: { id: existing.id },
          data: {
            status: 'APPLIED',
            resumeId: resume.id,
            appliedAt: new Date(),
            matchScore: null,
            tfidfScore: null,
            skillScore: null,
            hrNotes: null,
          },
        })
      : await tx.application.create({
          data: { jobId: job.id, candidateId: profile.id, resumeId: resume.id, status: 'APPLIED' },
        });
    await tx.applicationStatusHistory.create({
      data: {
        applicationId: app.id,
        fromStatus: existing ? existing.status : null,
        toStatus: 'APPLIED',
        actorId: session.sub,
        actorName: session.name,
        actorRole: session.role,
      },
    });
    return app;
  });

  // Notify all active HR users
  const hrUsers = await db.user.findMany({ where: { role: 'HR', status: 'ACTIVE' }, select: { id: true } });
  await Promise.all(
    hrUsers.map((u) =>
      notify(u.id, 'New application received', `${session.name} applied for ${job.title}.`, 'HR_ACTION', '#/hr/applications')
    )
  );
  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'APPLICATION_SUBMITTED',
    entityType: 'APPLICATION',
    entityId: application.id,
    details: { jobId: job.id, jobTitle: job.title, resumeId: resume.id },
    ip: clientIp(req),
  });

  // Synchronous AI scoring — must never block applying
  try {
    await runAnalysisForApplication(application.id);
  } catch (err) {
    console.error('[AI] Analysis failed for application', application.id, err instanceof Error ? err.message : err);
  }

  const full = await db.application.findUnique({
    where: { id: application.id },
    include: {
      job: { select: { id: true, title: true, location: true, status: true } },
      resume: { select: { id: true, fileName: true, parseStatus: true } },
      analyses: { take: 1 },
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!full) throw new ApiError('INTERNAL_ERROR', 'Application could not be loaded after creation', 500);

  return ok(
    {
      id: full.id,
      jobId: full.jobId,
      status: full.status,
      matchScore: full.matchScore,
      tfidfScore: full.tfidfScore,
      skillScore: full.skillScore,
      appliedAt: full.appliedAt,
      job: full.job,
      resume: full.resume,
      analysis: serializeAnalysis(full.analyses[0] ?? null),
      statusHistory: full.statusHistory,
    },
    201
  );
});

`


## 📄 PATCH /api/applications/[id]/status (Stage Update)
**File Path:** src/app/api/applications/[id]/status/route.ts

`	ypescript
// PATCH /api/applications/[id]/status — pipeline transition (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, logAudit, notify, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { APPLICATION_STATUSES, APPLICATION_TRANSITIONS, LABELS } from '@/lib/constants';

const schema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  note: z.string().trim().max(1000).optional(),
});

export const PATCH = handler(async (req, ctx) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const { id } = await ctx.params;
  const body = await parseBody(req, schema);

  const application = await db.application.findUnique({
    where: { id },
    include: {
      job: { select: { title: true } },
      candidate: { select: { userId: true } },
    },
  });
  if (!application) throw new ApiError('APPLICATION_NOT_FOUND', 'Application not found', 404);

  const allowed = APPLICATION_TRANSITIONS[application.status] ?? [];
  if (!allowed.includes(body.status)) {
    throw new ApiError(
      'INVALID_TRANSITION',
      `Cannot move from ${application.status} to ${body.status}`,
      400,
      { from: application.status, to: body.status, allowed }
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const app = await tx.application.update({
      where: { id },
      data: { status: body.status },
    });
    await tx.applicationStatusHistory.create({
      data: {
        applicationId: id,
        fromStatus: application.status,
        toStatus: body.status,
        actorId: session.sub,
        actorName: session.name,
        actorRole: session.role,
        note: body.note ?? null,
      },
    });
    return app;
  });

  await notify(
    application.candidate.userId,
    'Application status updated',
    `Your application for ${application.job.title} is now "${LABELS[body.status] ?? body.status}".`,
    'APPLICATION_UPDATE',
    '#/portal/applications'
  );
  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'APPLICATION_STATUS_CHANGED',
    entityType: 'APPLICATION',
    entityId: id,
    details: { from: application.status, to: body.status, note: body.note ?? null },
    ip: clientIp(req),
  });

  return ok(updated);
});

`


## 📄 POST /api/ai/analyze/[applicationId] (AI Pipeline Execution)
**File Path:** src/app/api/ai/analyze/[applicationId]/route.ts

`	ypescript
// POST /api/ai/analyze/[applicationId] — re-run the AI pipeline (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { ok, fail, handler, requireAuth, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { runAnalysisForApplication } from '@/lib/ai/analyze-service';
import { AnalysisError } from '@/lib/ai/resume-matcher';
import { serializeAnalysis } from '@/lib/serialize';

export const POST = handler(async (req, ctx) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const { applicationId } = await ctx.params;

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { select: { title: true } },
      resume: { select: { parseStatus: true } },
    },
  });
  if (!application) throw new ApiError('APPLICATION_NOT_FOUND', 'Application not found', 404);

  try {
    await runAnalysisForApplication(applicationId);
  } catch (err) {
    if (err instanceof AnalysisError) {
      return fail('ANALYSIS_FAILED', err.message, 400, { code: err.code });
    }
    throw err;
  }

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'AI_ANALYSIS_RUN',
    entityType: 'APPLICATION',
    entityId: applicationId,
    details: { jobTitle: application.job.title, resumeParseStatus: application.resume.parseStatus },
    ip: clientIp(req),
  });

  const analysis = await db.resumeAnalysis.findUnique({ where: { applicationId } });
  const app = await db.application.findUnique({
    where: { id: applicationId },
    select: { matchScore: true, tfidfScore: true, skillScore: true },
  });
  return ok({ application: app, analysis: serializeAnalysis(analysis) });
});

`


## 📄 GET /api/ai/analysis/[applicationId] (AI Analysis Retrieval)
**File Path:** src/app/api/ai/analysis/[applicationId]/route.ts

`	ypescript
// GET /api/ai/analysis/[applicationId] — stored analysis (owner candidate or HR/ADMIN)

export const dynamic = 'force-dynamic';

import { ok, handler, requireAuth, ApiError } from '@/lib/api';
import { db } from '@/lib/db';
import { serializeAnalysis } from '@/lib/serialize';

export const GET = handler(async (req, ctx) => {
  const session = await requireAuth(req);
  const { applicationId } = await ctx.params;

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      analyses: { take: 1 },
      candidate: { select: { userId: true } },
    },
  });
  if (!application) throw new ApiError('APPLICATION_NOT_FOUND', 'Application not found', 404);

  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  if (!isStaff && application.candidate.userId !== session.sub) {
    throw new ApiError('FORBIDDEN', 'You can only view analysis for your own applications', 403);
  }
  if (!application.analyses[0]) throw new ApiError('NO_ANALYSIS', 'No AI analysis is available for this application yet', 404);

  return ok(serializeAnalysis(application.analyses[0]));
});

`


## 📄 GET/POST /api/attendance (Attendance Clock-In)
**File Path:** src/app/api/attendance/route.ts

`	ypescript
// GET  /api/attendance — attendance records (HR/ADMIN any; EMPLOYEE own only)
// POST /api/attendance — record attendance (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, getPagination, paginated, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { ATTENDANCE_STATUSES } from '@/lib/constants';
import { monthRange, utcDateOnly, combineDateTime } from '@/lib/datetime';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SORT: Record<string, string> = { date: 'date', createdat: 'createdAt', updatedat: 'updatedAt' };

async function resolveEmployeeId(session: { role: string; sub: string }): Promise<string | null> {
  const employee = await db.employee.findUnique({ where: { userId: session.sub }, select: { id: true } });
  return employee?.id ?? null;
}

export const GET = handler(async (req) => {
  const session = await requireAuth(req);
  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  const p = getPagination(req);
  const sp = req.nextUrl.searchParams;

  const employeeId = sp.get('employeeId') ?? undefined;
  if (!isStaff && employeeId) {
    throw new ApiError('FORBIDDEN', 'Employees can only view their own attendance', 403);
  }
  const monthParam = sp.get('month');
  let monthWhere: Record<string, unknown> = {};
  if (monthParam) {
    try {
      const { start, end } = monthRange(monthParam);
      monthWhere = { date: { gte: start, lt: end } };
    } catch {
      throw new ApiError('INVALID_MONTH', 'month must be in YYYY-MM format', 400);
    }
  }

  let where: Record<string, unknown> = { ...monthWhere };
  if (isStaff) {
    if (employeeId) where = { ...where, employeeId };
  } else {
    const ownId = await resolveEmployeeId(session);
    where = { ...where, employeeId: ownId ?? 'none' };
  }

  const [items, total] = await Promise.all([
    db.attendance.findMany({
      where,
      orderBy: { [SORT[p.sortBy.toLowerCase()] ?? 'date']: p.sortDir },
      skip: p.skip,
      take: p.take,
      include: { employee: { select: { id: true, name: true, employeeCode: true } } },
    }),
    db.attendance.count({ where }),
  ]);
  return ok(paginated(items, total, p));
});

const createSchema = z.object({
  employeeId: z.string().min(1, 'employeeId is required'),
  date: z.string().regex(DATE_RE, 'date must be in YYYY-MM-DD format'),
  status: z.enum(ATTENDANCE_STATUSES),
  checkIn: z.string().regex(TIME_RE, 'checkIn must be HH:mm').nullish(),
  checkOut: z.string().regex(TIME_RE, 'checkOut must be HH:mm').nullish(),
  note: z.string().trim().max(500).nullish(),
});

function computeWorkHours(dateStr: string, checkIn: string | null, checkOut: string | null): number | null {
  if (!checkIn || !checkOut) return null;
  let ms = combineDateTime(dateStr, checkOut).getTime() - combineDateTime(dateStr, checkIn).getTime();
  if (ms < 0) ms += 24 * 3600 * 1000; // overnight shift
  return Math.round((ms / 3600000) * 100) / 100;
}

export const POST = handler(async (req) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const body = await parseBody(req, createSchema);

  const employee = await db.employee.findUnique({ where: { id: body.employeeId }, select: { id: true, name: true } });
  if (!employee) throw new ApiError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404);

  const date = utcDateOnly(new Date(`${body.date}T00:00:00.000Z`));
  const duplicate = await db.attendance.findUnique({
    where: { employeeId_date: { employeeId: body.employeeId, date } },
    select: { id: true },
  });
  if (duplicate) throw new ApiError('DUPLICATE_ATTENDANCE', 'Attendance already exists for this employee and date', 409);

  const workHours = computeWorkHours(body.date, body.checkIn ?? null, body.checkOut ?? null);
  const record = await db.attendance.create({
    data: {
      employeeId: body.employeeId,
      date,
      status: body.status,
      checkIn: body.checkIn ? combineDateTime(body.date, body.checkIn) : null,
      checkOut: body.checkOut ? combineDateTime(body.date, body.checkOut) : null,
      workHours,
      note: body.note ?? null,
      createdById: session.sub,
    },
    include: { employee: { select: { id: true, name: true, employeeCode: true } } },
  });

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'ATTENDANCE_RECORDED',
    entityType: 'ATTENDANCE',
    entityId: record.id,
    details: { employeeCode: record.employee.employeeCode, date: body.date, status: body.status },
    ip: clientIp(req),
  });
  return ok(record, 201);
});

`


## 📄 GET /api/attendance/summary (Monthly Attendance Report)
**File Path:** src/app/api/attendance/summary/route.ts

`	ypescript
// GET /api/attendance/summary?month=YYYY-MM — per-employee attendance counts
// HR/ADMIN: all employees (or ?employeeId=). EMPLOYEE: own row only.

export const dynamic = 'force-dynamic';

import { ok, handler, requireAuth, ApiError } from '@/lib/api';
import { db } from '@/lib/db';
import { monthRange } from '@/lib/datetime';

export const GET = handler(async (req) => {
  const session = await requireAuth(req);
  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  const sp = req.nextUrl.searchParams;

  const monthParam = sp.get('month') ?? new Date().toISOString().slice(0, 7);
  let range: { start: Date; end: Date };
  try {
    range = monthRange(monthParam);
  } catch {
    throw new ApiError('INVALID_MONTH', 'month must be in YYYY-MM format', 400);
  }

  let employeeWhere: Record<string, unknown> = {};
  if (isStaff) {
    const employeeId = sp.get('employeeId');
    if (employeeId) employeeWhere = { id: employeeId };
  } else {
    const own = await db.employee.findUnique({ where: { userId: session.sub }, select: { id: true } });
    employeeWhere = { id: own?.id ?? 'none' };
  }

  const employees = await db.employee.findMany({
    where: employeeWhere,
    select: { id: true, name: true, employeeCode: true },
    orderBy: { employeeCode: 'asc' },
  });

  const attendance = await db.attendance.findMany({
    where: { date: { gte: range.start, lt: range.end } },
    select: { employeeId: true, status: true },
  });

  const byEmployee = new Map<string, Map<string, number>>();
  for (const row of attendance) {
    let counts = byEmployee.get(row.employeeId);
    if (!counts) {
      counts = new Map();
      byEmployee.set(row.employeeId, counts);
    }
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }

  const items = employees.map((e) => {
    const counts = byEmployee.get(e.id);
    const get = (s: string) => counts?.get(s) ?? 0;
    const present = get('PRESENT');
    const absent = get('ABSENT');
    const late = get('LATE');
    const halfDay = get('HALF_DAY');
    const leave = get('LEAVE');
    const wfh = get('WFH');
    const holiday = get('HOLIDAY');
    return {
      employeeId: e.id,
      name: e.name,
      employeeCode: e.employeeCode,
      present,
      absent,
      late,
      halfDay,
      leave,
      wfh,
      holiday,
      total: present + absent + late + halfDay + leave + wfh + holiday,
    };
  });

  return ok({ month: monthParam, items });
});

`


## 📄 AI Resume Matcher Engine
**File Path:** src/lib/ai/resume-matcher.ts

`	ypescript
// ============================================================
// HireSphere AI — Resume Matching Engine
// ============================================================
// Combines two explainable components:
//
//  1. tfidfScore  — TF-IDF cosine similarity between the full resume
//     text and the job posting text (title + description + skills).
//  2. skillScore  — required-skill overlap ratio:
//        skillScore = |required skills found in resume| / |required skills|
//     (null when the job defines no required skills)
//
//  finalScore = w1 * tfidfScore + w2 * skillScore
//  (default weights 0.6 / 0.4 — configurable via AI_WEIGHT_TFIDF,
//   AI_WEIGHT_SKILL; stored with every analysis for transparency)
//
// The score is a DECISION-SUPPORT SIGNAL for human reviewers.
// It is NOT a probability of hiring success, and the system never
// auto-rejects candidates based on it. Protected personal
// characteristics are never used in scoring.
// ============================================================

import { normalizeText, splitSentences, extractSection } from './text-preprocessing';
import { findSkillsInText, type SkillHit } from './skill-dictionary';
import { buildTfidf, cosineSimilarity, topSharedTerms } from './tfidf';
import { AI_WEIGHT_SKILL, AI_WEIGHT_TFIDF, AI_ALGORITHM_VERSION } from '../constants';

export interface JobRequirements {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
}

export interface MatchResult {
  tfidfScore: number;
  skillScore: number | null;
  finalScore: number;
  weights: { tfidf: number; skill: number };
  matchedSkills: (SkillHit & { required: boolean })[];
  missingSkills: string[];
  extraSkills: string[];
  sharedTerms: string[];
  summary: string;
  algorithmVersion: string;
}

export class AnalysisError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** Compose the canonical job-side text used for similarity. */
export function jobTextOf(job: JobRequirements): string {
  return normalizeText(
    [job.title, job.title, job.description, 'Required skills: ' + job.requiredSkills.join(', '), 'Preferred skills: ' + job.preferredSkills.join(', ')].join('\n')
  );
}

/** Run the full matching pipeline for one resume against one job. */
export function analyzeResume(resumeText: string, job: JobRequirements): MatchResult {
  const cleanResume = normalizeText(resumeText ?? '');
  if (!cleanResume || cleanResume.length < 40) {
    throw new AnalysisError('EMPTY_RESUME', 'Resume text is empty or too short to analyze');
  }
  const cleanJob = jobTextOf(job);
  if (!cleanJob || cleanJob.length < 20) {
    throw new AnalysisError('MISSING_JOB_DESCRIPTION', 'Job posting has no description to compare against');
  }

  // ---- 1. TF-IDF cosine similarity (2-doc corpus for single pair) ----
  const model = buildTfidf([cleanJob, cleanResume]);
  const tfidfScore = cosineSimilarity(model.vectors[0], model.vectors[1]);

  // ---- 2. Skill overlap ----
  const sentences = splitSentences(cleanResume);
  const hits = findSkillsInText(cleanResume, sentences);
  const hitNames = new Set(hits.map((h) => h.skill.toLowerCase()));

  const required = job.requiredSkills.filter((s) => s.trim());
  const preferred = job.preferredSkills.filter((s) => s.trim());

  const matchedRequired: (SkillHit & { required: boolean })[] = [];
  const missingSkills: string[] = [];
  for (const req of required) {
    const hit = hits.find((h) => h.skill.toLowerCase() === req.toLowerCase());
    if (hit) matchedRequired.push({ ...hit, required: true });
    else missingSkills.push(req);
  }
  for (const pref of preferred) {
    if (!hitNames.has(pref.toLowerCase())) continue;
    if (!matchedRequired.some((m) => m.skill.toLowerCase() === pref.toLowerCase())) {
      const hit = hits.find((h) => h.skill.toLowerCase() === pref.toLowerCase());
      if (hit) matchedRequired.push({ ...hit, required: false });
    }
  }
  const extraSkills = hits
    .map((h) => h.skill)
    .filter((s) => !required.concat(preferred).some((r) => r.toLowerCase() === s.toLowerCase()));

  const skillScore = required.length > 0 ? matchedRequired.filter((m) => m.required).length / required.length : null;

  // ---- 3. Weighted final score ----
  let finalScore: number;
  if (skillScore === null) {
    finalScore = tfidfScore;
  } else {
    const wSum = AI_WEIGHT_TFIDF + AI_WEIGHT_SKILL || 1;
    finalScore = (AI_WEIGHT_TFIDF * tfidfScore + AI_WEIGHT_SKILL * skillScore) / wSum;
  }
  finalScore = Math.max(0, Math.min(1, finalScore));

  const sharedTerms = topSharedTerms(cleanJob, cleanResume, 8);

  // ---- 4. Plain-language explanation ----
  const parts: string[] = [
    `Text similarity (TF-IDF cosine): ${(tfidfScore * 100).toFixed(1)}%.`,
  ];
  if (skillScore !== null) {
    parts.push(`Required-skill overlap: ${matchedRequired.filter((m) => m.required).length}/${required.length} (${(skillScore * 100).toFixed(0)}%).`);
  }
  if (missingSkills.length > 0) parts.push(`Not evidenced in resume: ${missingSkills.join(', ')}.`);
  parts.push(
    `Final score ${(finalScore * 100).toFixed(1)}% = ${AI_WEIGHT_TFIDF}×TF-IDF${skillScore !== null ? ` + ${AI_WEIGHT_SKILL}×skill-overlap` : ''}.`
  );
  parts.push('This score is a decision-support signal for human review — not a hiring probability and never an automatic rejection.');

  return {
    tfidfScore,
    skillScore,
    finalScore,
    weights: { tfidf: AI_WEIGHT_TFIDF, skill: AI_WEIGHT_SKILL },
    matchedSkills: matchedRequired,
    missingSkills,
    extraSkills,
    sharedTerms,
    summary: parts.join(' '),
    algorithmVersion: AI_ALGORITHM_VERSION,
  };
}

// ------------------------------------------------------------
// Resume information extraction (structured, conservative)
// Fields that cannot be reliably found are returned as null —
// the engine never fabricates data.
// ------------------------------------------------------------

export interface ExtractedResumeInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  education: string | null;
  experienceSummary: string | null;
  experienceYears: number | null;
  certifications: string | null;
  projects: string | null;
  skills: string[];
  wordCount: number;
}

export function extractResumeInfo(rawText: string): ExtractedResumeInfo {
  const text = normalizeText(rawText);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const sentences = splitSentences(text);

  // Name: first short line near the top without digits/@
  let name: string | null = null;
  for (const line of lines.slice(0, 6)) {
    const clean = line.replace(/[|•,]/g, '').trim();
    if (clean.length >= 2 && clean.length <= 48 && !/\d|@|http|resume|curriculum/i.test(clean) && /^[A-Za-z][A-Za-z .'\-/&]+$/.test(clean)) {
      name = clean.split(/\s{2,}/)[0];
      break;
    }
  }

  const email = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0] ?? null;

  const phone = findPhone(text);

  const education = extractSection(text, ['education', 'academic background', 'academics', 'qualifications', 'educational qualifications']);

  const experienceSummary = extractSection(text, ['work experience', 'professional experience', 'experience', 'employment history', 'internships']);

  // Experience years: explicit "X years" mentions + year-range heuristics
  let experienceYears: number | null = null;
  const explicit = [...text.matchAll(/(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)/gi)].map((m) => parseFloat(m[1]));
  if (explicit.length > 0) experienceYears = Math.min(40, Math.max(...explicit));
  if (experienceYears === null) {
    const currentYear = new Date().getFullYear();
    const ranges = [...text.matchAll(/(20\d{2})\s*[-–—to]+\s*(20\d{2}|present|current|till date|now)/gi)].map((m) => {
      const end = /present|current|till|now/i.test(m[2]) ? currentYear : parseInt(m[2]);
      return end - parseInt(m[1]);
    });
    if (ranges.length > 0) experienceYears = Math.min(40, Math.max(0, ranges.reduce((a, b) => a + b, 0)));
  }

  const certifications = extractSection(text, ['certifications', 'certificates', 'licenses']);
  const projects = extractSection(text, ['projects', 'academic projects', 'key projects', 'personal projects']);

  const skillHits = findSkillsInText(text, sentences);

  return {
    name,
    email,
    phone,
    education,
    experienceSummary,
    experienceYears,
    certifications,
    projects,
    skills: skillHits.map((h) => h.skill),
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

/**
 * Phone extraction heuristic (explainable):
 *  1. prefer lines mentioning phone/mobile/contact/tel
 *  2. then international "+CC ..." numbers
 *  3. then bare 10–13 digit sequences
 * Candidates whose digits start with a 4-digit year pattern
 * (19xx/20xx) are rejected to avoid date-range false positives.
 */
function findPhone(text: string): string | null {
  const digitsOf = (s: string) => s.replace(/\D/g, '');
  const plausible = (s: string) => {
    const d = digitsOf(s);
    if (d.length < 10 || d.length > 13) return false;
    if (/^(19|20)\d{2}\d/.test(d)) return false; // year-range artifact
    return true;
  };

  const kwLine = text.split('\n').find((l) => /phone|mobile|contact|tel/i.test(l) && /\d{5,}/.test(digitsOf(l)));
  if (kwLine) {
    const m = kwLine.match(/\+?\d[\d\s.\-()]{7,17}\d/);
    if (m && plausible(m[0])) return m[0].trim();
  }
  const matches = text.match(/\+?\d[\d\s.\-()]{7,17}\d/g) ?? [];
  for (const c of matches) {
    if (c.startsWith('+') && plausible(c)) return c.trim();
  }
  for (const c of matches) {
    if (plausible(c)) return c.trim();
  }
  return null;
}

`


## 📄 AI TF-IDF Vectorizer & Cosine Similarity
**File Path:** src/lib/ai/tfidf.ts

`	ypescript
// ============================================================
// HireSphere AI — TF-IDF Vectorizer & Cosine Similarity
// ============================================================
// A faithful re-implementation of the classic TF-IDF model used by
// scikit-learn's TfidfVectorizer (smooth idf + L2 normalization):
//
//   tf(t, d)        = count(t, d)                    (raw count)
//   idf(t)          = ln((1 + N) / (1 + df(t))) + 1  (smooth)
//   weight(t, d)    = tf * idf
//   vector(d)       = weight / ||weight||₂           (L2 norm)
//   cosine(a, b)    = a · b                          (vectors pre-normalized)
//
// The result is a TEXT SIMILARITY SCORE in [0, 1]. It is a
// decision-support signal for HR — NOT a probability of hiring
// success and never an automatic rejection.
// ============================================================

import { tokenize } from './text-preprocessing';

export interface TfidfModel {
  vectors: Map<string, number>[]; // L2-normalized sparse vectors
  vocabulary: Map<string, number>; // term -> df count
  docCount: number;
}

/** Build TF-IDF vectors for a corpus of documents. */
export function buildTfidf(documents: string[]): TfidfModel {
  const tokenLists = documents.map((doc) => tokenize(doc));

  // document frequency
  const df = new Map<string, number>();
  for (const tokens of tokenLists) {
    const seen = new Set(tokens);
    for (const term of seen) df.set(term, (df.get(term) ?? 0) + 1);
  }

  const N = documents.length || 1;
  const vectors: Map<string, number>[] = tokenLists.map((tokens) => {
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);

    const vec = new Map<string, number>();
    let norm = 0;
    for (const [term, freq] of tf) {
      const idf = Math.log((1 + N) / (1 + (df.get(term) ?? 0))) + 1;
      const w = freq * idf;
      vec.set(term, w);
      norm += w * w;
    }
    // L2 normalize
    const mag = Math.sqrt(norm);
    if (mag > 0) {
      for (const [term, w] of vec) vec.set(term, w / mag);
    }
    return vec;
  });

  return { vectors, vocabulary: df, docCount: N };
}

/** Cosine similarity of two pre-normalized vectors (dot product). */
export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, w] of small) {
    const other = large.get(term);
    if (other) dot += w * other;
  }
  return Math.max(0, Math.min(1, dot)); // clamped to [0,1]
}

/**
 * Pairwise similarity: builds a corpus over [jobText, ...resumeTexts]
 * so IDF statistics reflect the candidate pool (more robust than a
 * 2-document corpus), then returns similarity of each resume to the job.
 */
export function rankResumesAgainstJob(jobText: string, resumeTexts: string[]): number[] {
  if (!jobText.trim()) return resumeTexts.map(() => 0);
  const corpus = [jobText, ...resumeTexts.map((t) => (t.trim() ? t : '∅'))];
  const model = buildTfidf(corpus);
  const jobVec = model.vectors[0];
  return resumeTexts.map((_, i) => cosineSimilarity(jobVec, model.vectors[i + 1]));
}

/** Top contributing shared terms between two texts (explainability aid). */
export function topSharedTerms(jobText: string, resumeText: string, limit = 8): string[] {
  const model = buildTfidf([jobText, resumeText]);
  const jobVec = model.vectors[0];
  const resVec = model.vectors[1];
  const shared: { term: string; w: number }[] = [];
  for (const [term, w] of jobVec) {
    const other = resVec.get(term);
    if (other) shared.push({ term, w: w * other });
  }
  return shared
    .sort((a, b) => b.w - a.w)
    .slice(0, limit)
    .map((s) => s.term);
}

`


## 📄 AI PDF Multi-Page Parser
**File Path:** src/lib/ai/pdf-parser.ts

`	ypescript
// ============================================================
// HireSphere AI — PDF Resume Parsing
// ============================================================
// Server-side PDF validation + text extraction via unpdf
// (pdf.js serverless build). Handles corrupted, encrypted and
// image-only PDFs with explicit, meaningful errors — never
// silently fabricates content.
// ============================================================

import { extractText, getDocumentProxy } from 'unpdf';
import { RESUME_MAX_SIZE, RESUME_MIME_TYPES } from '../constants';

export class PdfParseError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export interface PdfValidationInput {
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

/** Validate an uploaded resume file (type, size, magic bytes). */
export function validateResumeFile(input: PdfValidationInput): void {
  const ext = input.fileName.toLowerCase().split('.').pop();
  if (ext !== 'pdf') {
    throw new PdfParseError('INVALID_TYPE', 'Only PDF files are accepted');
  }
  if (input.mimeType && !RESUME_MIME_TYPES.includes(input.mimeType)) {
    throw new PdfParseError('INVALID_TYPE', 'Only PDF files are accepted');
  }
  if (input.size <= 0) throw new PdfParseError('EMPTY_FILE', 'The uploaded file is empty');
  if (input.size > RESUME_MAX_SIZE) {
    throw new PdfParseError('FILE_TOO_LARGE', `File exceeds the ${RESUME_MAX_SIZE / (1024 * 1024)} MB limit`);
  }
  const header = input.buffer.subarray(0, 5).toString('latin1');
  if (header !== '%PDF-') {
    throw new PdfParseError('CORRUPTED_PDF', 'This file is not a valid PDF document');
  }
}

export interface PdfExtractResult {
  text: string;
  pageCount: number;
}

/** Extract text from a validated PDF buffer. */
export async function extractResumeText(buffer: Buffer): Promise<PdfExtractResult> {
  let data: Uint8Array;
  try {
    data = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(data);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    const pages = Array.isArray(text) ? text.join('\n') : text;
    const cleaned = pages.replace(/\u0000/g, '').trim();
    if (!cleaned || cleaned.replace(/\s+/g, '').length < 20) {
      throw new PdfParseError(
        'NO_EXTRACTABLE_TEXT',
        'No readable text found — the PDF may be image-only/scanned or password-protected'
      );
    }
    if (totalPages > 20) {
      throw new PdfParseError('TOO_MANY_PAGES', 'Resume PDFs are limited to 20 pages');
    }
    return { text: cleaned, pageCount: totalPages };
  } catch (err) {
    if (err instanceof PdfParseError) throw err;
    const msg = err instanceof Error ? err.message : 'unknown error';
    if (/password|encrypt/i.test(msg)) {
      throw new PdfParseError('ENCRYPTED_PDF', 'Password-protected PDFs cannot be processed');
    }
    throw new PdfParseError('EXTRACTION_FAILED', 'Failed to extract text from this PDF');
  }
}

/** Generate a safe, collision-free server-side filename. */
export function safeStoredName(originalName: string): string {
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  const base = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '_')
    .replace(/\.pdf$/i, '')
    .slice(0, 60);
  return `${stamp}-${rand}-${base || 'resume'}.pdf`;
}

`


## 📄 AI Canonical Skill Dictionary
**File Path:** src/lib/ai/skill-dictionary.ts

`	ypescript
// ============================================================
// HireSphere AI — Skill Dictionary
// ============================================================
// A transparent mapping of canonical skill names to common resume
// variants. This is the ONLY place skill terminology is normalized;
// no hidden model is involved. HR can audit exactly why a skill was
// counted as matched.
// ============================================================

export interface SkillEntry {
  canonical: string;
  aliases: string[]; // lowercase variants matched against resume text
  category: 'LANGUAGE' | 'FRAMEWORK' | 'DATABASE' | 'TOOL' | 'CLOUD' | 'CONCEPT' | 'SOFT';
}

export const SKILL_DICTIONARY: SkillEntry[] = [
  // Languages
  { canonical: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'ecmascript', 'java script'], category: 'LANGUAGE' },
  { canonical: 'TypeScript', aliases: ['typescript', 'ts'], category: 'LANGUAGE' },
  { canonical: 'Python', aliases: ['python', 'python3'], category: 'LANGUAGE' },
  { canonical: 'Java', aliases: ['java', 'core java', 'java 8', 'java11'], category: 'LANGUAGE' },
  { canonical: 'C++', aliases: ['c++', 'cpp'], category: 'LANGUAGE' },
  { canonical: 'C#', aliases: ['c#', 'csharp', 'c sharp'], category: 'LANGUAGE' },
  { canonical: 'PHP', aliases: ['php'], category: 'LANGUAGE' },
  { canonical: 'SQL', aliases: ['sql', 'ansi sql'], category: 'LANGUAGE' },
  { canonical: 'Go', aliases: ['golang', 'go lang'], category: 'LANGUAGE' },
  { canonical: 'R', aliases: ['r language', 'rstudio', ' r '], category: 'LANGUAGE' },
  { canonical: 'Kotlin', aliases: ['kotlin'], category: 'LANGUAGE' },
  { canonical: 'Swift', aliases: ['swift', 'swiftui'], category: 'LANGUAGE' },
  { canonical: 'HTML/CSS', aliases: ['html', 'css', 'html5', 'css3', 'html/css', 'sass', 'scss'], category: 'LANGUAGE' },
  { canonical: 'Bash/Shell', aliases: ['bash', 'shell scripting', 'shell', 'powershell'], category: 'LANGUAGE' },

  // Frameworks & libraries
  { canonical: 'React', aliases: ['react', 'reactjs', 'react.js', 'react js'], category: 'FRAMEWORK' },
  { canonical: 'Next.js', aliases: ['next.js', 'nextjs', 'next js'], category: 'FRAMEWORK' },
  { canonical: 'Node.js', aliases: ['node.js', 'nodejs', 'node js', 'node'], category: 'FRAMEWORK' },
  { canonical: 'Express.js', aliases: ['express', 'express.js', 'expressjs'], category: 'FRAMEWORK' },
  { canonical: 'Angular', aliases: ['angular', 'angularjs', 'angular 2+'], category: 'FRAMEWORK' },
  { canonical: 'Vue.js', aliases: ['vue', 'vuejs', 'vue.js'], category: 'FRAMEWORK' },
  { canonical: 'Django', aliases: ['django', 'django rest framework', 'drf'], category: 'FRAMEWORK' },
  { canonical: 'Flask', aliases: ['flask', 'flask-restful'], category: 'FRAMEWORK' },
  { canonical: 'FastAPI', aliases: ['fastapi', 'fast api'], category: 'FRAMEWORK' },
  { canonical: 'Spring Boot', aliases: ['spring boot', 'springboot', 'spring mvc', 'spring'], category: 'FRAMEWORK' },
  { canonical: 'Bootstrap', aliases: ['bootstrap', 'bootstrap 5'], category: 'FRAMEWORK' },
  { canonical: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss', 'tailwind css'], category: 'FRAMEWORK' },
  { canonical: '.NET', aliases: ['.net', 'dotnet', 'asp.net', 'asp.net core'], category: 'FRAMEWORK' },
  { canonical: 'Flutter', aliases: ['flutter', 'dart'], category: 'FRAMEWORK' },
  { canonical: 'TensorFlow', aliases: ['tensorflow'], category: 'FRAMEWORK' },
  { canonical: 'PyTorch', aliases: ['pytorch', 'torch'], category: 'FRAMEWORK' },
  { canonical: 'Scikit-learn', aliases: ['scikit-learn', 'sklearn', 'scikit learn'], category: 'FRAMEWORK' },
  { canonical: 'Pandas', aliases: ['pandas'], category: 'FRAMEWORK' },
  { canonical: 'NumPy', aliases: ['numpy'], category: 'FRAMEWORK' },

  // Databases
  { canonical: 'MySQL', aliases: ['mysql', 'mariadb'], category: 'DATABASE' },
  { canonical: 'PostgreSQL', aliases: ['postgresql', 'postgres'], category: 'DATABASE' },
  { canonical: 'MongoDB', aliases: ['mongodb', 'mongo'], category: 'DATABASE' },
  { canonical: 'SQLite', aliases: ['sqlite', 'sqlite3'], category: 'DATABASE' },
  { canonical: 'Redis', aliases: ['redis'], category: 'DATABASE' },
  { canonical: 'Oracle DB', aliases: ['oracle', 'oracle db', 'pl/sql'], category: 'DATABASE' },
  { canonical: 'SQL Server', aliases: ['sql server', 'mssql', 'ms sql'], category: 'DATABASE' },

  // Tools
  { canonical: 'Git', aliases: ['git', 'github', 'gitlab', 'version control'], category: 'TOOL' },
  { canonical: 'Docker', aliases: ['docker', 'containerization', 'containers'], category: 'TOOL' },
  { canonical: 'Kubernetes', aliases: ['kubernetes', 'k8s'], category: 'TOOL' },
  { canonical: 'Postman', aliases: ['postman', 'api testing'], category: 'TOOL' },
  { canonical: 'Jenkins', aliases: ['jenkins', 'ci/cd', 'cicd'], category: 'TOOL' },
  { canonical: 'Jira', aliases: ['jira', 'atlassian'], category: 'TOOL' },
  { canonical: 'Figma', aliases: ['figma'], category: 'TOOL' },
  { canonical: 'Excel', aliases: ['excel', 'ms excel', 'spreadsheets', 'pivot tables'], category: 'TOOL' },
  { canonical: 'Power BI', aliases: ['power bi', 'powerbi'], category: 'TOOL' },
  { canonical: 'Tableau', aliases: ['tableau'], category: 'TOOL' },
  { canonical: 'Linux', aliases: ['linux', 'ubuntu', 'unix'], category: 'TOOL' },

  // Cloud
  { canonical: 'AWS', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'], category: 'CLOUD' },
  { canonical: 'Azure', aliases: ['azure', 'microsoft azure'], category: 'CLOUD' },
  { canonical: 'GCP', aliases: ['gcp', 'google cloud', 'google cloud platform'], category: 'CLOUD' },
  { canonical: 'Firebase', aliases: ['firebase', 'firestore'], category: 'CLOUD' },
  { canonical: 'Heroku', aliases: ['heroku', 'render.com', 'render'], category: 'CLOUD' },

  // Concepts / practices
  { canonical: 'REST API', aliases: ['rest api', 'restful api', 'rest', 'restful', 'api development'], category: 'CONCEPT' },
  { canonical: 'GraphQL', aliases: ['graphql', 'apollo'], category: 'CONCEPT' },
  { canonical: 'Machine Learning', aliases: ['machine learning', 'ml', 'supervised learning', 'predictive modeling'], category: 'CONCEPT' },
  { canonical: 'NLP', aliases: ['nlp', 'natural language processing', 'text mining'], category: 'CONCEPT' },
  { canonical: 'Data Analysis', aliases: ['data analysis', 'data analytics', 'eda', 'exploratory data analysis'], category: 'CONCEPT' },
  { canonical: 'Data Visualization', aliases: ['data visualization', 'data viz', 'dashboarding', 'charts'], category: 'CONCEPT' },
  { canonical: 'Deep Learning', aliases: ['deep learning', 'neural networks', 'cnn', 'rnn', 'lstm'], category: 'CONCEPT' },
  { canonical: 'Computer Vision', aliases: ['computer vision', 'opencv', 'image processing'], category: 'CONCEPT' },
  { canonical: 'Agile/Scrum', aliases: ['agile', 'scrum', 'kanban', 'sprint planning'], category: 'CONCEPT' },
  { canonical: 'Unit Testing', aliases: ['unit testing', 'unit tests', 'pytest', 'jest', 'test automation'], category: 'CONCEPT' },
  { canonical: 'CI/CD', aliases: ['ci/cd', 'continuous integration', 'continuous deployment', 'devops'], category: 'CONCEPT' },
  { canonical: 'Microservices', aliases: ['microservices', 'microservices architecture'], category: 'CONCEPT' },
  { canonical: 'System Design', aliases: ['system design', 'system architecture', 'scalability'], category: 'CONCEPT' },
  { canonical: 'OOP', aliases: ['oop', 'object oriented programming', 'object-oriented'], category: 'CONCEPT' },
  { canonical: 'Data Structures', aliases: ['data structures', 'dsa', 'algorithms', 'problem solving'], category: 'CONCEPT' },
  { canonical: 'SDLC', aliases: ['sdlc', 'software development life cycle'], category: 'CONCEPT' },
  { canonical: 'Cybersecurity', aliases: ['cybersecurity', 'information security', 'infosec', 'owasp'], category: 'CONCEPT' },
  { canonical: 'UI/UX', aliases: ['ui/ux', 'ux design', 'ui design', 'wireframing', 'prototyping'], category: 'CONCEPT' },

  // Soft skills
  { canonical: 'Communication', aliases: ['communication', 'communication skills', 'presentation skills'], category: 'SOFT' },
  { canonical: 'Teamwork', aliases: ['teamwork', 'team collaboration', 'collaboration', 'cross-functional'], category: 'SOFT' },
  { canonical: 'Leadership', aliases: ['leadership', 'led a team', 'mentoring', 'mentored'], category: 'SOFT' },
  { canonical: 'Time Management', aliases: ['time management', 'prioritization'], category: 'SOFT' },
  { canonical: 'Adaptability', aliases: ['adaptability', 'fast learner', 'quick learner'], category: 'SOFT' },
];

/** Normalized full-text search term for one canonical skill (longest alias first). */
export function getSkill(canonical: string): SkillEntry | undefined {
  return SKILL_DICTIONARY.find((s) => s.canonical.toLowerCase() === canonical.toLowerCase());
}

export interface SkillHit {
  skill: string; // canonical name
  alias: string; // the variant actually found
  evidence: string; // resume sentence containing it
}

/** Scan normalized resume text for dictionary skills; return canonical hits with evidence. */
export function findSkillsInText(text: string, evidenceSentences: string[]): SkillHit[] {
  const lower = ` ${text.toLowerCase()} `;
  const hits: SkillHit[] = [];
  const seen = new Set<string>();
  for (const entry of SKILL_DICTIONARY) {
    for (const alias of entry.aliases) {
      const pattern = buildAliasRegex(alias);
      if (!pattern) continue;
      if (pattern.test(lower)) {
        if (!seen.has(entry.canonical)) {
          seen.add(entry.canonical);
          hits.push({
            skill: entry.canonical,
            alias,
            evidence: findEvidence(evidenceSentences, alias) || 'Found in resume text',
          });
        }
        break;
      }
    }
  }
  return hits;
}

function findEvidence(sentences: string[], alias: string): string | null {
  for (const s of sentences) {
    if (buildAliasRegex(alias)?.test(s.toLowerCase())) {
      return s.length > 180 ? s.slice(0, 177) + '…' : s;
    }
  }
  return null;
}

function buildAliasRegex(alias: string): RegExp | null {
  const escaped = alias.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  if (!escaped) return null;
  // word-ish boundaries; allow the padded-space trick used for " r "
  return new RegExp(`(?<![a-z0-9+#])${escaped}(?![a-z0-9+#])`, 'i');
}

`
