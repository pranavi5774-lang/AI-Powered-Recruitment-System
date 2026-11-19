// ============================================================
// HireSphere AI — Analysis service
// Single entry point that runs the full AI pipeline for one
// application: loads resume text + job, runs analyzeResume,
// upserts ResumeAnalysis and snapshots the scores onto the
// Application row. Used by POST /api/applications (synchronous,
// errors swallowed) and POST /api/ai/analyze/[applicationId]
// (errors surfaced as ANALYSIS_FAILED).
// ============================================================

import { db } from '@/lib/db';
import { analyzeResume, extractResumeInfo, AnalysisError } from './resume-matcher';
import { parseJson } from '@/lib/serialize';

export interface RunAnalysisResult {
  analysis: {
    applicationId: string;
    tfidfScore: number;
    skillScore: number | null;
    finalScore: number;
    weights: { tfidf: number; skill: number };
    matchedSkills: unknown[];
    missingSkills: string[];
    extraSkills: string[];
    summary: string | null;
    algorithmVersion: string;
  };
}

/**
 * Run the AI matching pipeline for an application.
 * Throws AnalysisError (subclasses Error) on any failure:
 *  - ANALYSIS_NOT_FOUND   — application does not exist
 *  - ANALYSIS_FAILED      — resume text unavailable / pipeline error
 *  - EMPTY_RESUME / MISSING_JOB_DESCRIPTION — re-thrown from matcher
 */
export async function runAnalysisForApplication(applicationId: string): Promise<RunAnalysisResult> {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { resume: true, job: true },
  });
  if (!application) {
    throw new AnalysisError('ANALYSIS_NOT_FOUND', 'Application not found');
  }

  const resumeText = application.resume?.extractedText ?? '';
  if (!resumeText || application.resume.parseStatus !== 'SUCCESS') {
    throw new AnalysisError(
      'ANALYSIS_FAILED',
      'Resume text is not available for analysis — the resume could not be parsed or is empty'
    );
  }

  let requiredSkills = parseJson<string[]>(application.job.requiredSkills, []);
  let preferredSkills = parseJson<string[]>(application.job.preferredSkills, []);
  if (!Array.isArray(requiredSkills)) requiredSkills = [];
  if (!Array.isArray(preferredSkills)) preferredSkills = [];

  const result = analyzeResume(resumeText, {
    title: application.job.title,
    description: application.job.description,
    requiredSkills,
    preferredSkills,
  });
  const extractedInfo = extractResumeInfo(resumeText);

  const data = {
    tfidfScore: result.tfidfScore,
    skillScore: result.skillScore,
    finalScore: result.finalScore,
    weights: JSON.stringify(result.weights),
    matchedSkills: JSON.stringify(result.matchedSkills),
    missingSkills: JSON.stringify(result.missingSkills),
    extraSkills: JSON.stringify(result.extraSkills),
    extractedInfo: JSON.stringify(extractedInfo),
    summary: result.summary,
    algorithmVersion: result.algorithmVersion,
  };

  await db.$transaction([
    db.resumeAnalysis.upsert({
      where: { applicationId },
      create: { applicationId, ...data },
      update: data,
    }),
    db.application.update({
      where: { id: applicationId },
      data: {
        matchScore: result.finalScore,
        tfidfScore: result.tfidfScore,
        skillScore: result.skillScore,
      },
    }),
  ]);

  return {
    analysis: {
      applicationId,
      tfidfScore: result.tfidfScore,
      skillScore: result.skillScore,
      finalScore: result.finalScore,
      weights: result.weights,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      extraSkills: result.extraSkills,
      summary: result.summary,
      algorithmVersion: result.algorithmVersion,
    },
  };
}
