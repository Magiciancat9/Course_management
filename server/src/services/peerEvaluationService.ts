import { Prisma, Role } from '@prisma/client';
import prisma from '../prisma';

type Actor = { id: number; role: Role };
type Failure = { ok: false; status: number; code: string; error: string };
type Result<T> = { ok: true; data: T } | Failure;
type Tx = Prisma.TransactionClient;
const fail = (status: number, code: string, error: string): Failure => ({ ok: false, status, code, error });
const invalid = (message: string) => fail(400, 'VALIDATION_ERROR', message);
export const peerId = (value: unknown): number | null => typeof value === 'string' && /^[1-9][0-9]*$/.test(value) &&
  Number.isInteger(Number(value)) && Number(value) <= 2147483647 ? Number(value) : null;

export function validatePeerBody(raw: unknown): Result<{ expectedVersion: number; rating: number; comment?: string }> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return invalid('Request must be a JSON object.');
  const b = raw as Record<string, unknown>;
  if (Object.keys(b).some(key => !['expectedVersion', 'rating', 'comment'].includes(key))) return invalid('Unknown or non-writable field.');
  if (typeof b.expectedVersion !== 'number' || !Number.isInteger(b.expectedVersion) || b.expectedVersion < 0 || b.expectedVersion >= 2147483647)
    return invalid('Expected version must be a nonnegative integer.');
  if (typeof b.rating !== 'number' || !Number.isInteger(b.rating) || b.rating < 1 || b.rating > 5)
    return invalid('Rating must be an integer from 1 to 5.');
  if ('comment' in b && (typeof b.comment !== 'string' || b.comment.trim().length > 2000))
    return invalid('Comment must be at most 2000 characters after trim.');
  return { ok: true, data: { expectedVersion: b.expectedVersion, rating: b.rating,
    ...('comment' in b ? { comment: (b.comment as string).trim() } : {}) } };
}

export function peerCompletion(status: string, dueDate: Date, hasSubmission: boolean, now: Date) {
  const canEvaluate = status === 'PUBLISHED' && now.getTime() >= dueDate.getTime() && hasSubmission;
  return { canEvaluate, reason: canEvaluate ? 'This milestone is complete for your team.'
    : 'Peer evaluation opens after a published milestone is due and your team has a saved submission.',
    dueDate: dueDate.toISOString(), serverTime: now.toISOString() };
}

async function context(tx: Tx, teamId: number, milestoneId: number, actor: Actor) {
  const team = await tx.projectTeam.findUnique({ where: { id: teamId } });
  if (!team) return fail(404, 'TEAM_NOT_FOUND', 'Team not found.');
  if (actor.role !== 'INSTRUCTOR' && !await tx.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: actor.id } } }))
    return fail(403, 'BR06_FORBIDDEN_TEAM_ACCESS', 'You cannot access this team.');
  const milestone = await tx.milestone.findFirst({ where: { id: milestoneId, courseId: team.courseId } });
  if (!milestone) return fail(404, 'MILESTONE_NOT_FOUND', 'Milestone not found in this course.');
  const submitted = await tx.milestoneSubmission.findUnique({ where: { milestoneId_teamId: { milestoneId, teamId } }, select: { id: true } });
  return { ok: true as const, eligibility: peerCompletion(milestone.status, milestone.dueDate, !!submitted, new Date(Date.now())) };
}

// Explicit DTO selection keeps credentials and incoming/other authors' records out of student reads.
const select = { id: true, teamId: true, milestoneId: true, evaluatorId: true, evaluateeId: true,
  rating: true, comment: true, version: true, createdAt: true, updatedAt: true,
  evaluator: { select: { id: true, fullName: true } }, evaluatee: { select: { id: true, fullName: true } } } as const;

export async function savePeerEvaluation(teamId: number, milestoneId: number, evaluateeId: number, actor: Actor, raw: unknown) {
  if (actor.role !== 'STUDENT') return fail(403, 'STUDENT_ROLE_REQUIRED', 'Only students may submit their own peer evaluation.');
  return prisma.$transaction(async tx => {
    // Serializes first creation and updates. The milestone lock also orders deadline edits.
    await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${teamId} FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "Milestone" WHERE "id" = ${milestoneId} FOR UPDATE`;
    const resolved = await context(tx, teamId, milestoneId, actor);
    if (!resolved.ok) return resolved;
    if (!resolved.eligibility.canEvaluate) return fail(409, 'MILESTONE_NOT_COMPLETED', resolved.eligibility.reason);
    if (evaluateeId === actor.id) return fail(400, 'SELF_EVALUATION_NOT_ALLOWED', 'You cannot evaluate yourself.');
    const target = await tx.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: evaluateeId } }, include: { user: { select: { role: true } } } });
    if (!target || target.user.role !== 'STUDENT') return fail(400, 'INVALID_PEER_TARGET', 'Choose another current student in your team.');
    const input = validatePeerBody(raw);
    if (!input.ok) return input;
    const pair = { milestoneId, evaluatorId: actor.id, evaluateeId };
    const existing = await tx.peerEvaluation.findUnique({ where: { milestoneId_evaluatorId_evaluateeId: pair } });
    if (existing && existing.teamId !== teamId) return fail(403, 'BR06_FORBIDDEN_TEAM_ACCESS', 'This evaluation is outside the current team context.');
    if ((existing?.version ?? 0) !== input.data.expectedVersion)
      return fail(409, 'PEER_EVALUATION_VERSION_CONFLICT', 'A newer evaluation exists. Load the latest version and review your draft before saving.');
    const { expectedVersion, ...patch } = input.data;
    const now = new Date(Date.now());
    const evaluation = existing
      ? await tx.peerEvaluation.update({ where: { id: existing.id }, data: { ...patch, version: expectedVersion + 1, updatedAt: now }, select })
      : await tx.peerEvaluation.create({ data: { ...pair, teamId, ...patch, createdAt: now, updatedAt: now }, select });
    return { ok: true as const, created: !existing, data: { evaluation } };
  });
}

export async function listPeerEvaluations(teamId: number, milestoneId: number, actor: Actor, query: Record<string, unknown>, own: boolean) {
  if ((own && actor.role !== 'STUDENT') || (!own && actor.role !== 'INSTRUCTOR'))
    return fail(403, 'ROLE_FORBIDDEN', own ? 'Only students may read their own outgoing evaluations.' : 'Only instructors may inspect confidential team evaluations.');
  return prisma.$transaction(async tx => {
    const resolved = await context(tx, teamId, milestoneId, actor);
    if (!resolved.ok) return resolved;
    if (Object.keys(query).some(key => !['limit', 'afterId'].includes(key))) return invalid('Unknown query field.');
    const limit = 'limit' in query ? peerId(query.limit) : 50;
    const afterId = 'afterId' in query ? peerId(query.afterId) : null;
    if (!limit || limit > 100 || ('afterId' in query && !afterId)) return invalid('Invalid pagination.');
    const rows = await tx.peerEvaluation.findMany({ where: { teamId, milestoneId,
      ...(own ? { evaluatorId: actor.id } : {}), ...(afterId ? { id: { gt: afterId } } : {}) }, select,
      orderBy: { id: 'asc' }, take: limit + 1 });
    const evaluations = rows.slice(0, limit);
    return { ok: true as const, data: { evaluations, nextAfterId: rows.length > limit ? evaluations[evaluations.length - 1].id : null,
      eligibility: resolved.eligibility } };
  });
}
