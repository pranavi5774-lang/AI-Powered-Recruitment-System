// GET /api/resumes/[id] — resume detail (owner candidate or HR/ADMIN)

export const dynamic = 'force-dynamic';

import { ok, handler, requireAuth, ApiError } from '@/lib/api';
import { db } from '@/lib/db';
import { serializeParsedData } from '@/lib/serialize';

export const GET = handler(async (req, ctx) => {
  const session = await requireAuth(req);
  const { id } = await ctx.params;

  const resume = await db.resume.findUnique({
    where: { id },
    include: { candidate: { select: { userId: true, user: { select: { name: true } } } } },
  });
  if (!resume) throw new ApiError('RESUME_NOT_FOUND', 'Resume not found', 404);

  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  if (!isStaff && resume.candidate.userId !== session.sub) {
    throw new ApiError('FORBIDDEN', 'You can only access your own resumes', 403);
  }

  return ok({
    id: resume.id,
    fileName: resume.fileName,
    fileSize: resume.fileSize,
    mimeType: resume.mimeType,
    parseStatus: resume.parseStatus,
    parseError: resume.parseError,
    isActive: resume.isActive,
    uploadedAt: resume.uploadedAt,
    extractedText: resume.extractedText,
    parsedData: serializeParsedData(resume.parsedData),
    candidate: { name: resume.candidate.user.name },
  });
});
