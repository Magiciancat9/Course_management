import { MilestoneSubmission, Prisma, Role, SubmissionVersion } from '@prisma/client';
import prisma from '../prisma';

type Failure = { ok: false; status: number; error: string; code: string };
type Outcome<T> = { ok: true; data: T } | Failure;
type Actor = { id: number; role: Role };
type Context = { teamId: number; milestoneId: number; actor: Actor };
type Tx = Prisma.TransactionClient;
export interface SubmissionInput {
  expectedVersion: number;
  repoUrl: string;
  reportUrl: string;
  releaseTag: string;
  notes: string;
}
const fail = (status: number, code: string, error: string): Failure => ({ ok: false, status, code, error });
const allowed = new Set(['expectedVersion', 'repoUrl', 'reportUrl', 'releaseTag', 'notes']);

function httpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname ? value : null;
  } catch { return null; }
}

export function validateSubmissionBody(raw: unknown): { valid: true; data: SubmissionInput } |
  { valid: false; status: number; error: string; code: string } {
  const invalid = (error: string) => ({ valid: false as const, status: 400, error, code: 'VALIDATION_ERROR' });
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return invalid('Request body must be a JSON object.');
  const body = raw as Record<string, unknown>;
  if (Object.keys(body).some(key => !allowed.has(key))) return invalid('Request contains unknown or non-writable fields.');
  if (typeof body.expectedVersion !== 'number' || !Number.isSafeInteger(body.expectedVersion) ||
      body.expectedVersion < 0 || body.expectedVersion >= 2147483647) return invalid('expectedVersion must be a nonnegative integer.');
  const repoUrl = httpUrl(body.repoUrl);
  const reportUrl = httpUrl(body.reportUrl);
  if (!repoUrl || !reportUrl) return invalid('Repository and report URLs must be absolute HTTP(S) URLs of at most 2048 characters.');
  if (typeof body.releaseTag !== 'string') return invalid('Release tag must be a string.');
  const releaseTag = body.releaseTag.trim();
  if (!releaseTag || releaseTag.length > 128 || /[\s\u0000-\u001f\u007f-\u009f]/u.test(releaseTag)) {
    return invalid('Release tag must contain 1-128 characters without whitespace or control characters.');
  }
  if (body.notes !== undefined && typeof body.notes !== 'string') return invalid('Notes must be a string.');
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (notes.length > 10000) return invalid('Notes must not exceed 10000 characters.');
  return { valid: true, data: { expectedVersion: body.expectedVersion, repoUrl, reportUrl, releaseTag, notes } };
}

export function calculateLateStatus(submittedAt: Date, dueDate: Date): 'ON_TIME' | 'LATE' {
  return submittedAt.getTime() > dueDate.getTime() ? 'LATE' : 'ON_TIME';
}

function legacyEvaluation(score: number | null, feedback: string | null, actor: Actor) {
  return actor.role === 'INSTRUCTOR' && (score !== null || feedback !== null)
    ? { score, feedback, publicationStatus: 'UNKNOWN' as const } : null;
}

function currentDto(row: MilestoneSubmission, actor: Actor) {
  return { id: row.id, milestoneId: row.milestoneId, teamId: row.teamId, version: row.version,
    repoUrl: row.artifactUrl, reportUrl: row.reportUrl, releaseTag: row.releaseTag, notes: row.notes,
    submittedAt: row.submittedAt, dueDateSnapshot: row.dueDateSnapshot, lateStatus: row.lateStatus,
    // F-06 supplies verified, current-version GradePublication summaries. Legacy
    // projection fields alone never establish publication to a student.
    publishedEvaluation: null, legacyEvaluation: legacyEvaluation(row.score, row.feedback, actor) };
}

function versionDto(row: SubmissionVersion, actor: Actor) {
  return { id: row.id, submissionId: row.submissionId, version: row.version, repoUrl: row.repoUrl,
    reportUrl: row.reportUrl, releaseTag: row.releaseTag, notes: row.notes, submittedAt: row.submittedAt,
    dueDateSnapshot: row.dueDateSnapshot, lateStatus: row.lateStatus, publishedEvaluation: null,
    legacyEvaluation: legacyEvaluation(row.legacyScore, row.legacyFeedback, actor) };
}

async function context(tx: Tx, params: Context, write = false) {
  const team = await tx.projectTeam.findUnique({ where: { id: params.teamId }, include: {
    members: { select: { userId: true } }, proposal: { select: { status: true } },
  } });
  if (!team) return fail(404, 'TEAM_NOT_FOUND', 'Team not found.');
  if (params.actor.role !== 'INSTRUCTOR' && !team.members.some(m => m.userId === params.actor.id)) {
    return fail(403, 'BR06_FORBIDDEN_TEAM_ACCESS', 'You may only access your own team submission.');
  }
  const milestone = await tx.milestone.findUnique({ where: { id: params.milestoneId } });
  if (!milestone || milestone.courseId !== team.courseId) return fail(404, 'MILESTONE_NOT_FOUND', 'Milestone not found in this course.');
  if (write && milestone.status !== 'PUBLISHED') return fail(409, 'MILESTONE_NOT_PUBLISHED', 'This milestone has not been published.');
  if (!write && params.actor.role !== 'INSTRUCTOR' && milestone.status !== 'PUBLISHED') {
    return fail(404, 'MILESTONE_NOT_FOUND', 'Milestone not found.');
  }
  if (write && team.proposal?.status !== 'APPROVED') {
    return fail(409, 'BR07_APPROVED_PROPOSAL_REQUIRED', 'Your team proposal must be approved before submitting a milestone.');
  }
  return { ok: true as const, team, milestone };
}

export async function saveSubmission(params: Context & { body: unknown; now?: Date }) {
  if (params.actor.role !== 'STUDENT') return fail(403, 'STUDENT_ROLE_REQUIRED', 'Only owning-team students may submit.');
  return prisma.$transaction(async tx => {
    // Same milestone lock as F-04: deadline edits and accepted submission time
    // use one coherent row snapshot. Team lock serializes first-create retries.
    await tx.$queryRaw`SELECT "id" FROM "Milestone" WHERE "id" = ${params.milestoneId} FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${params.teamId} FOR UPDATE`;
    const resolved = await context(tx, params, true);
    if (!resolved.ok) return resolved;
    const input = validateSubmissionBody(params.body);
    if (!input.valid) return fail(input.status, input.code, input.error);
    const { expectedVersion, repoUrl, reportUrl, releaseTag, notes } = input.data;
    const key = { milestoneId: params.milestoneId, teamId: params.teamId };
    const existing = await tx.milestoneSubmission.findUnique({ where: { milestoneId_teamId: key } });
    if ((existing?.version ?? 0) !== expectedVersion) {
      return fail(409, 'SUBMISSION_VERSION_CONFLICT', 'A newer submission exists. Reload the latest version and reconcile your draft.');
    }
    const submittedAt = params.now ?? new Date();
    const dueDateSnapshot = resolved.milestone.dueDate;
    const lateStatus = calculateLateStatus(submittedAt, dueDateSnapshot);
    const version = expectedVersion + 1;
    if (existing && (existing.score !== null || existing.feedback !== null)) {
      // Preserve legacy grading provenance separately from immutable content;
      // never label an undocumented legacy score as a published F-06 grade.
      await tx.submissionVersion.update({
        where: { submissionId_version: { submissionId: existing.id, version: existing.version } },
        data: { legacyScore: existing.score, legacyFeedback: existing.feedback },
      });
    }
    const data = { artifactUrl: repoUrl, reportUrl, releaseTag, notes, submittedAt, dueDateSnapshot,
      lateStatus, version, score: null, feedback: null };
    const row = existing
      ? await tx.milestoneSubmission.update({ where: { id: existing.id }, data })
      : await tx.milestoneSubmission.create({ data: { ...key, ...data } });
    await tx.submissionVersion.create({ data: { submissionId: row.id, version, repoUrl, reportUrl,
      releaseTag, notes, submittedAt, dueDateSnapshot, lateStatus } });
    return { ok: true as const, created: !existing, data: { submission: currentDto(row, params.actor) } };
  });
}

export async function getSubmission(params: Context) {
  return prisma.$transaction(async tx => {
    const resolved = await context(tx, params);
    if (!resolved.ok) return resolved;
    const row = await tx.milestoneSubmission.findUnique({ where: {
      milestoneId_teamId: { milestoneId: params.milestoneId, teamId: params.teamId },
    } });
    if (!row) return fail(404, 'SUBMISSION_NOT_FOUND', 'No submission has been saved for this team and milestone.');
    return { ok: true as const, data: { submission: currentDto(row, params.actor) } };
  });
}

export interface Paging { limit: number; afterId?: number }
export function parseSubmissionPaging(query: Record<string, unknown>): Outcome<Paging> {
  const number = (value: unknown) => typeof value === 'string' && /^[1-9][0-9]*$/.test(value) &&
    Number.isSafeInteger(Number(value)) && Number(value) <= 2147483647 ? Number(value) : null;
  const limit = query.limit === undefined ? 50 : number(query.limit);
  const afterId = query.afterId === undefined ? undefined : number(query.afterId);
  if (limit === null || limit > 100 || afterId === null) return fail(400, 'VALIDATION_ERROR', 'Invalid pagination: limit 1-100 and positive afterId are required.');
  return { ok: true, data: { limit, afterId } };
}

export async function listSubmissionVersions(params: Context & Paging) {
  return prisma.$transaction(async tx => {
    const resolved = await context(tx, params);
    if (!resolved.ok) return resolved;
    const row = await tx.milestoneSubmission.findUnique({ where: {
      milestoneId_teamId: { milestoneId: params.milestoneId, teamId: params.teamId },
    } });
    if (!row) return fail(404, 'SUBMISSION_NOT_FOUND', 'No submission has been saved for this team and milestone.');
    const rows = await tx.submissionVersion.findMany({ where: { submissionId: row.id,
      ...(params.afterId === undefined ? {} : { id: { gt: params.afterId } }) }, orderBy: { id: 'asc' }, take: params.limit + 1 });
    const more = rows.length > params.limit;
    const page = more ? rows.slice(0, params.limit) : rows;
    return { ok: true as const, data: { versions: page.map(v => versionDto(v, params.actor)), nextAfterId: more ? page[page.length - 1].id : null } };
  });
}

export async function listCourseSubmissions(params: { courseId: number; milestoneId: number; actor: Actor } & Paging) {
  if (params.actor.role !== 'INSTRUCTOR') return fail(403, 'INSTRUCTOR_ROLE_REQUIRED', 'Only instructors may list course submissions.');
  const milestone = await prisma.milestone.findUnique({ where: { id: params.milestoneId } });
  if (!milestone || milestone.courseId !== params.courseId) return fail(404, 'MILESTONE_NOT_FOUND', 'Milestone not found in this course.');
  const rows = await prisma.milestoneSubmission.findMany({ where: { milestoneId: params.milestoneId,
    ...(params.afterId === undefined ? {} : { id: { gt: params.afterId } }) },
    include: { team: { select: { id: true, name: true } } }, orderBy: { id: 'asc' }, take: params.limit + 1 });
  const more = rows.length > params.limit;
  const page = more ? rows.slice(0, params.limit) : rows;
  return { ok: true as const, data: { submissions: page.map(row => ({ ...currentDto(row, params.actor), team: row.team })),
    nextAfterId: more ? page[page.length - 1].id : null } };
}
