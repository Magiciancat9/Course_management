import { Role } from '@prisma/client';
import prisma from '../prisma';

export interface GradingFailure {
  ok: false;
  valid: false;
  status: number;
  code: string;
  error: string;
}

export type GradingOutcome<T> = { ok: true; data: T; created?: boolean } | GradingFailure;
export type GradingValidation<T> = { valid: true; data: T } | GradingFailure;

export interface EvaluationDraftInput {
  submissionVersion: number;
  expectedVersion: number;
  score: number;
  feedback: string;
}

export interface EvaluationPublishInput {
  submissionVersion: number;
  expectedVersion: number;
}

export interface Actor {
  id: number;
  role: Role;
}

const DRAFT_ALLOWED_KEYS = new Set([
  'submissionVersion',
  'expectedVersion',
  'score',
  'feedback',
]);
const PUBLISH_ALLOWED_KEYS = new Set(['submissionVersion', 'expectedVersion']);

function fail(status: number, code: string, error: string): GradingFailure {
  return { ok: false, valid: false, status, code, error };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parsePositiveIntParam(raw: unknown): number | null {
  if (typeof raw !== 'string' || !/^[1-9][0-9]*$/.test(raw)) {
    return null;
  }
  const num = Number(raw);
  return Number.isSafeInteger(num) && num >= 1 && num <= 2147483647 ? num : null;
}

function isPositiveSafeInt(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 1 &&
    value <= 2147483647
  );
}

function isNonNegativeSafeInt(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value < 2147483647
  );
}

export function validateEvaluationDraftBody(
  raw: unknown
): GradingValidation<EvaluationDraftInput> {
  if (!isPlainObject(raw)) {
    return fail(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }

  for (const key of Object.keys(raw)) {
    if (!DRAFT_ALLOWED_KEYS.has(key)) {
      return fail(400, 'VALIDATION_ERROR', `Unknown or non-writable field: ${key}`);
    }
  }

  if (!isPositiveSafeInt(raw.submissionVersion)) {
    return fail(400, 'VALIDATION_ERROR', 'submissionVersion must be a positive integer.');
  }

  if (!isNonNegativeSafeInt(raw.expectedVersion)) {
    return fail(400, 'VALIDATION_ERROR', 'expectedVersion must be a nonnegative integer.');
  }

  if (
    typeof raw.score !== 'number' ||
    !Number.isInteger(raw.score) ||
    raw.score < 0 ||
    raw.score > 100
  ) {
    return fail(400, 'VALIDATION_ERROR', 'score must be an integer between 0 and 100 inclusive.');
  }

  if (typeof raw.feedback !== 'string') {
    return fail(400, 'VALIDATION_ERROR', 'feedback must be a string between 1 and 2000 characters.');
  }

  const trimmedFeedback = raw.feedback.trim();
  if (trimmedFeedback.length < 1 || trimmedFeedback.length > 2000) {
    return fail(400, 'VALIDATION_ERROR', 'feedback must be between 1 and 2000 characters.');
  }

  return {
    valid: true,
    data: {
      submissionVersion: raw.submissionVersion,
      expectedVersion: raw.expectedVersion,
      score: raw.score,
      feedback: trimmedFeedback,
    },
  };
}

export function validateEvaluationPublishBody(
  raw: unknown
): GradingValidation<EvaluationPublishInput> {
  if (!isPlainObject(raw)) {
    return fail(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }

  for (const key of Object.keys(raw)) {
    if (!PUBLISH_ALLOWED_KEYS.has(key)) {
      return fail(400, 'VALIDATION_ERROR', `Unknown or non-writable field: ${key}`);
    }
  }

  if (!isPositiveSafeInt(raw.submissionVersion)) {
    return fail(400, 'VALIDATION_ERROR', 'submissionVersion must be a positive integer.');
  }

  if (!isPositiveSafeInt(raw.expectedVersion)) {
    return fail(400, 'VALIDATION_ERROR', 'expectedVersion must be a positive integer.');
  }

  return {
    valid: true,
    data: {
      submissionVersion: raw.submissionVersion,
      expectedVersion: raw.expectedVersion,
    },
  };
}

const PUBLISHER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
} as const;

function formatInstructorEvaluation(row: {
  id: number;
  submissionId: number;
  submissionVersion: number;
  score: number;
  feedback: string;
  version: number;
  draftRevision: number;
  publishedDraftRevision: number | null;
  updatedById: number;
  updatedAt: Date;
  publications: Array<{
    id: number;
    score: number;
    feedback: string;
    submissionVersion: number;
    draftRevision: number;
    publishedAt: Date;
    publishedBy: { id: number; email: string; fullName: string; role: Role };
  }>;
}) {
  const latestPub =
    row.publications.length > 0 ? row.publications[row.publications.length - 1] : null;
  const status =
    row.publishedDraftRevision === null
      ? ('DRAFT' as const)
      : row.publishedDraftRevision === row.draftRevision
        ? ('PUBLISHED' as const)
        : ('CORRECTION_DRAFT' as const);

  return {
    id: row.id,
    submissionId: row.submissionId,
    submissionVersion: row.submissionVersion,
    version: row.version,
    draftRevision: row.draftRevision,
    publishedDraftRevision: row.publishedDraftRevision,
    status,
    draft: {
      score: row.score,
      feedback: row.feedback,
      draftRevision: row.draftRevision,
      updatedById: row.updatedById,
      updatedAt: row.updatedAt,
    },
    published: latestPub
      ? {
          id: latestPub.id,
          score: latestPub.score,
          feedback: latestPub.feedback,
          submissionVersion: latestPub.submissionVersion,
          draftRevision: latestPub.draftRevision,
          publishedAt: latestPub.publishedAt,
          publishedBy: latestPub.publishedBy,
        }
      : null,
    publications: row.publications.map((pub) => ({
      id: pub.id,
      score: pub.score,
      feedback: pub.feedback,
      submissionVersion: pub.submissionVersion,
      draftRevision: pub.draftRevision,
      publishedAt: pub.publishedAt,
      publishedBy: pub.publishedBy,
    })),
  };
}

export async function getEvaluation(params: {
  submissionId: number;
  submissionVersion?: number;
  actor: Actor;
}): Promise<
  GradingOutcome<{
    evaluation: unknown;
    currentSubmissionVersion?: number;
    currentSubmission?: {
      id: number;
      version: number;
      repoUrl: string;
      reportUrl: string | null;
      releaseTag: string;
      notes: string;
    };
  }>
> {
  const submission = await prisma.milestoneSubmission.findUnique({
    where: { id: params.submissionId },
    include: {
      team: {
        include: {
          members: { select: { userId: true } },
        },
      },
    },
  });

  if (!submission) {
    return fail(404, 'SUBMISSION_NOT_FOUND', 'Submission not found.');
  }

  if (
    params.actor.role !== 'INSTRUCTOR' &&
    !submission.team.members.some((m) => m.userId === params.actor.id)
  ) {
    return fail(
      403,
      'BR06_FORBIDDEN_TEAM_ACCESS',
      'Forbidden: you may only view evaluations for your own team.'
    );
  }

  const targetVersion = params.submissionVersion ?? submission.version;
  const contentVersion = await prisma.submissionVersion.findUnique({
    where: {
      submissionId_version: {
        submissionId: submission.id,
        version: targetVersion,
      },
    },
  });

  if (!contentVersion) {
    return fail(404, 'SUBMISSION_VERSION_NOT_FOUND', 'Submission version not found.');
  }

  const evalRow = await prisma.submissionEvaluation.findUnique({
    where: {
      submissionId_submissionVersion: {
        submissionId: submission.id,
        submissionVersion: targetVersion,
      },
    },
    include: {
      publications: {
        orderBy: { draftRevision: 'asc' },
        include: { publishedBy: { select: PUBLISHER_SELECT } },
      },
    },
  });

  if (params.actor.role !== 'INSTRUCTOR') {
    const latestPub =
      evalRow && evalRow.publications.length > 0
        ? evalRow.publications[evalRow.publications.length - 1]
        : null;
    return {
      ok: true,
      data: {
        evaluation: latestPub
          ? {
              id: latestPub.id,
              submissionId: submission.id,
              submissionVersion: latestPub.submissionVersion,
              score: latestPub.score,
              feedback: latestPub.feedback,
              draftRevision: latestPub.draftRevision,
              publishedAt: latestPub.publishedAt,
              publishedBy: latestPub.publishedBy,
            }
          : null,
      },
    };
  }

  return {
    ok: true,
    data: {
      evaluation: evalRow ? formatInstructorEvaluation(evalRow) : null,
      currentSubmissionVersion: submission.version,
      currentSubmission: {
        id: submission.id,
        version: submission.version,
        repoUrl: submission.artifactUrl,
        reportUrl: submission.reportUrl,
        releaseTag: submission.releaseTag,
        notes: submission.notes,
      },
    },
  };
}

export async function saveEvaluationDraft(params: {
  submissionId: number;
  actor: Actor;
  body: unknown;
}): Promise<GradingOutcome<{ evaluation: ReturnType<typeof formatInstructorEvaluation> }>> {
  if (params.actor.role !== 'INSTRUCTOR') {
    return fail(403, 'INSTRUCTOR_ROLE_REQUIRED', 'Only instructors may grade submissions.');
  }

  const bodyRes = validateEvaluationDraftBody(params.body);
  if (!bodyRes.valid) return bodyRes;
  const input = bodyRes.data;

  const initialSub = await prisma.milestoneSubmission.findUnique({
    where: { id: params.submissionId },
    select: { id: true, teamId: true, milestoneId: true },
  });
  if (!initialSub) {
    return fail(404, 'SUBMISSION_NOT_FOUND', 'Submission not found.');
  }

  return prisma.$transaction(async (tx) => {
    // Acquire locks in the same Milestone -> ProjectTeam order as F-05 saveSubmission
    await tx.$queryRaw`SELECT "id" FROM "Milestone" WHERE "id" = ${initialSub.milestoneId} FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${initialSub.teamId} FOR UPDATE`;

    const currentSubmission = await tx.milestoneSubmission.findUnique({
      where: { id: params.submissionId },
    });
    if (!currentSubmission) {
      return fail(404, 'SUBMISSION_NOT_FOUND', 'Submission not found.');
    }

    if (input.submissionVersion !== currentSubmission.version) {
      const existingContent = await tx.submissionVersion.findUnique({
        where: {
          submissionId_version: {
            submissionId: currentSubmission.id,
            version: input.submissionVersion,
          },
        },
      });
      if (existingContent) {
        return fail(
          409,
          'STALE_SUBMISSION_VERSION',
          'This submission version has been superseded by a newer student submission.'
        );
      }
      return fail(404, 'SUBMISSION_VERSION_NOT_FOUND', 'Submission version not found.');
    }

    const existingEval = await tx.submissionEvaluation.findUnique({
      where: {
        submissionId_submissionVersion: {
          submissionId: currentSubmission.id,
          submissionVersion: input.submissionVersion,
        },
      },
    });

    const currentVersion = existingEval?.version ?? 0;
    if (currentVersion !== input.expectedVersion) {
      return fail(
        409,
        'GRADE_VERSION_CONFLICT',
        'Evaluation has been modified by another request. Reload and reconcile.'
      );
    }

    const nextVersion = currentVersion + 1;
    const nextDraftRevision = (existingEval?.draftRevision ?? 0) + 1;

    const saved = existingEval
      ? await tx.submissionEvaluation.update({
          where: { id: existingEval.id },
          data: {
            score: input.score,
            feedback: input.feedback,
            version: nextVersion,
            draftRevision: nextDraftRevision,
            updatedById: params.actor.id,
          },
          include: {
            publications: {
              orderBy: { draftRevision: 'asc' },
              include: { publishedBy: { select: PUBLISHER_SELECT } },
            },
          },
        })
      : await tx.submissionEvaluation.create({
          data: {
            submissionId: currentSubmission.id,
            submissionVersion: input.submissionVersion,
            score: input.score,
            feedback: input.feedback,
            version: 1,
            draftRevision: 1,
            publishedDraftRevision: null,
            updatedById: params.actor.id,
          },
          include: {
            publications: {
              orderBy: { draftRevision: 'asc' },
              include: { publishedBy: { select: PUBLISHER_SELECT } },
            },
          },
        });

    return {
      ok: true as const,
      created: !existingEval,
      data: { evaluation: formatInstructorEvaluation(saved) },
    };
  });
}

export async function publishEvaluation(params: {
  submissionId: number;
  actor: Actor;
  body: unknown;
  now?: Date;
}): Promise<GradingOutcome<{ evaluation: ReturnType<typeof formatInstructorEvaluation> }>> {
  if (params.actor.role !== 'INSTRUCTOR') {
    return fail(403, 'INSTRUCTOR_ROLE_REQUIRED', 'Only instructors may publish grades.');
  }

  const bodyRes = validateEvaluationPublishBody(params.body);
  if (!bodyRes.valid) return bodyRes;
  const input = bodyRes.data;

  const initialSub = await prisma.milestoneSubmission.findUnique({
    where: { id: params.submissionId },
    select: { id: true, teamId: true, milestoneId: true },
  });
  if (!initialSub) {
    return fail(404, 'SUBMISSION_NOT_FOUND', 'Submission not found.');
  }

  const publishedAt = params.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Milestone" WHERE "id" = ${initialSub.milestoneId} FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${initialSub.teamId} FOR UPDATE`;

    const currentSubmission = await tx.milestoneSubmission.findUnique({
      where: { id: params.submissionId },
    });
    if (!currentSubmission) {
      return fail(404, 'SUBMISSION_NOT_FOUND', 'Submission not found.');
    }

    if (input.submissionVersion !== currentSubmission.version) {
      const existingContent = await tx.submissionVersion.findUnique({
        where: {
          submissionId_version: {
            submissionId: currentSubmission.id,
            version: input.submissionVersion,
          },
        },
      });
      if (existingContent) {
        return fail(
          409,
          'STALE_SUBMISSION_VERSION',
          'Cannot publish grade for a superseded submission version.'
        );
      }
      return fail(404, 'SUBMISSION_VERSION_NOT_FOUND', 'Submission version not found.');
    }

    const existingEval = await tx.submissionEvaluation.findUnique({
      where: {
        submissionId_submissionVersion: {
          submissionId: currentSubmission.id,
          submissionVersion: input.submissionVersion,
        },
      },
    });

    if (!existingEval) {
      return fail(404, 'EVALUATION_NOT_FOUND', 'Save a grading draft before publishing.');
    }

    if (existingEval.version !== input.expectedVersion) {
      return fail(
        409,
        'GRADE_VERSION_CONFLICT',
        'Evaluation has been modified by another request. Reload and reconcile.'
      );
    }

    if (existingEval.publishedDraftRevision === existingEval.draftRevision) {
      return fail(
        409,
        'GRADE_ALREADY_PUBLISHED',
        'The current grading draft has already been published.'
      );
    }

    await tx.gradePublication.create({
      data: {
        evaluationId: existingEval.id,
        submissionId: currentSubmission.id,
        submissionVersion: existingEval.submissionVersion,
        draftRevision: existingEval.draftRevision,
        score: existingEval.score,
        feedback: existingEval.feedback,
        publishedById: params.actor.id,
        publishedAt,
      },
    });

    const updatedEval = await tx.submissionEvaluation.update({
      where: { id: existingEval.id },
      data: {
        version: existingEval.version + 1,
        publishedDraftRevision: existingEval.draftRevision,
        updatedById: params.actor.id,
      },
      include: {
        publications: {
          orderBy: { draftRevision: 'asc' },
          include: { publishedBy: { select: PUBLISHER_SELECT } },
        },
      },
    });

    return {
      ok: true as const,
      data: { evaluation: formatInstructorEvaluation(updatedEval) },
    };
  });
}
