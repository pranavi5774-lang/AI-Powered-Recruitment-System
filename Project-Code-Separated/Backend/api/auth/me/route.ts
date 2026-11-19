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
