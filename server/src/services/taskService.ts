import { Prisma, Role, Task, TaskStatus } from '@prisma/client';
import prisma from '../prisma';

type Actor = { id: number; role: Role };
type Failure = { ok: false; status: number; code: string; error: string };
type Result<T> = { ok: true; data: T } | Failure;
type Fields = Pick<Task, 'title' | 'description' | 'sprintNumber' | 'status' | 'assigneeId' | 'milestoneId'>;
type Input = Partial<Fields> & { expectedVersion: number };
type Tx = Prisma.TransactionClient;
const fail = (status: number, code: string, error: string): Failure => ({ ok: false, status, code, error });
const invalid = (message: string) => fail(400, 'VALIDATION_ERROR', message);
const fields = ['title', 'description', 'sprintNumber', 'status', 'assigneeId', 'milestoneId'] as const;
const positive = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x > 0 && x <= 2147483647;

export function validateTaskBody(raw: unknown, creating: boolean): Result<Input> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return invalid('Request must be a JSON object.');
  const b = raw as Record<string, unknown>;
  if (Object.keys(b).some(key => key !== 'expectedVersion' && !fields.includes(key as typeof fields[number]))) return invalid('Unknown or non-writable field.');
  if (typeof b.expectedVersion !== 'number' || !Number.isInteger(b.expectedVersion) ||
      b.expectedVersion < 0 || b.expectedVersion >= 2147483647 || (creating && b.expectedVersion !== 0)) return invalid('Invalid expectedVersion.');
  const data: Input = { expectedVersion: b.expectedVersion };
  if (creating || 'title' in b) {
    if (typeof b.title !== 'string' || b.title.trim().length < 3 || b.title.trim().length > 120) return invalid('Title must contain 3-120 characters after trim.');
    data.title = b.title.trim();
  }
  if ('description' in b) {
    if (typeof b.description !== 'string' || b.description.trim().length > 5000) return invalid('Description must be at most 5000 characters.');
    data.description = b.description.trim();
  } else if (creating) data.description = '';
  if (creating || 'sprintNumber' in b) {
    if (!positive(b.sprintNumber) || b.sprintNumber > 3) return invalid('Sprint must be an integer from 1 to 3.');
    data.sprintNumber = b.sprintNumber;
  }
  if ('status' in b) {
    if (!Object.values(TaskStatus).includes(b.status as TaskStatus)) return invalid('Invalid task status.');
    data.status = b.status as TaskStatus;
  } else if (creating) data.status = 'TODO';
  for (const field of ['assigneeId', 'milestoneId'] as const) {
    if (field in b) {
      if (b[field] !== null && !positive(b[field])) return invalid(`Invalid ${field}.`);
      data[field] = b[field] as number | null;
    } else if (creating) data[field] = null;
  }
  if (!creating && !fields.some(field => field in b)) return invalid('At least one task field is required.');
  return { ok: true, data };
}

export interface TaskPaging { limit: number; afterId?: number; sprintNumber?: number; milestoneId?: number; status?: TaskStatus }
export function parseTaskQuery(query: Record<string, unknown>, event = false): Result<TaskPaging> {
  const allowed = event ? ['limit', 'afterId'] : ['limit', 'afterId', 'sprintNumber', 'milestoneId', 'status'];
  if (Object.keys(query).some(key => !allowed.includes(key))) return invalid('Unknown query field.');
  const data: TaskPaging = { limit: 50 };
  for (const name of ['limit', 'afterId', 'sprintNumber', 'milestoneId'] as const) {
    if (!(name in query)) continue;
    const raw = query[name];
    if (typeof raw !== 'string' || !/^[1-9][0-9]*$/.test(raw) || !positive(Number(raw))) return invalid(`Invalid ${name}.`);
    const value = Number(raw);
    if ((name === 'limit' && value > 100) || (name === 'sprintNumber' && value > 3)) return invalid(`Invalid ${name}.`);
    data[name] = value;
  }
  if ('status' in query) {
    if (typeof query.status !== 'string' || !Object.values(TaskStatus).includes(query.status as TaskStatus)) return invalid('Invalid status.');
    data.status = query.status as TaskStatus;
  }
  return { ok: true, data };
}

async function context(tx: Tx, teamId: number, actor: Actor, write = false) {
  if (write && actor.role !== 'STUDENT') return fail(403, 'STUDENT_ROLE_REQUIRED', 'Only team students may change tasks.');
  const team = await tx.projectTeam.findUnique({ where: { id: teamId }, include: { proposal: true } });
  if (!team) return fail(404, 'TEAM_NOT_FOUND', 'Team not found.');
  if (actor.role !== 'INSTRUCTOR' && !await tx.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: actor.id } } })) {
    return fail(403, 'BR06_FORBIDDEN_TEAM_ACCESS', 'You cannot access this team.');
  }
  if (write && team.proposal?.status !== 'APPROVED') return fail(409, 'APPROVED_TEAM_REQUIRED', 'Task changes require an approved team proposal.');
  return { ok: true as const, team };
}

async function validateContext(tx: Tx, teamId: number, courseId: number, data: Partial<Fields>): Promise<Failure | null> {
  if (data.assigneeId != null && !await tx.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: data.assigneeId } } })) {
    return fail(400, 'INVALID_TASK_ASSIGNEE', 'Choose a current member of this team.');
  }
  if (data.milestoneId != null && !await tx.milestone.findFirst({ where: { id: data.milestoneId, courseId, status: 'PUBLISHED' } })) {
    return fail(404, 'MILESTONE_NOT_FOUND', 'Published milestone not found in this course.');
  }
  return null;
}

export async function saveTask(teamOrTaskId: number, actor: Actor, raw: unknown, creating: boolean) {
  if (actor.role !== 'STUDENT') return fail(403, 'STUDENT_ROLE_REQUIRED', 'Only team students may change tasks.');
  return prisma.$transaction(async tx => {
    const found = creating ? null : await tx.task.findUnique({ where: { id: teamOrTaskId } });
    if (!creating && !found) return fail(404, 'TASK_NOT_FOUND', 'Task not found.');
    const teamId = creating ? teamOrTaskId : found!.teamId;
    // One team lock serializes task writes with version/event assignment.
    await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${teamId} FOR UPDATE`;
    const resolved = await context(tx, teamId, actor, true);
    if (!resolved.ok) return resolved;
    const input = validateTaskBody(raw, creating);
    if (!input.ok) return input;
    const existing = creating ? null : await tx.task.findUnique({ where: { id: teamOrTaskId } });
    if ((existing?.version ?? 0) !== input.data.expectedVersion) return fail(409, 'TASK_VERSION_CONFLICT', 'A newer task version exists. Reload and reconcile your draft.');
    const { expectedVersion, ...patch } = input.data;
    const next = existing ? { ...existing, ...patch } : patch as Fields;
    const rejected = await validateContext(tx, teamId, resolved.team.courseId, next);
    if (rejected) return rejected;
    const changes: Record<string, Prisma.InputJsonValue> = {};
    for (const field of fields) {
      if (!existing || existing[field] !== next[field]) changes[field] = { before: existing?.[field] ?? null, after: next[field] ?? null };
    }
    const now = new Date();
    const row = existing
      ? await tx.task.update({ where: { id: existing.id }, data: { ...patch, updatedById: actor.id, version: expectedVersion + 1, updatedAt: now } })
      : await tx.task.create({ data: { ...(next as Fields), teamId, createdById: actor.id, updatedById: actor.id, createdAt: now, updatedAt: now } });
    await tx.taskEvent.create({ data: { taskId: row.id, actorId: actor.id, version: row.version, changes, createdAt: now } });
    return { ok: true as const, data: { task: row } };
  });
}

export async function listTasks(teamId: number, actor: Actor, query: Record<string, unknown>) {
  return prisma.$transaction(async tx => {
    const resolved = await context(tx, teamId, actor);
    if (!resolved.ok) return resolved;
    const parsed = parseTaskQuery(query);
    if (!parsed.ok) return parsed;
    const { limit, afterId, ...filters } = parsed.data;
    const rows = await tx.task.findMany({ where: { teamId, ...filters, ...(afterId ? { id: { gt: afterId } } : {}) }, orderBy: { id: 'asc' }, take: limit + 1 });
    const tasks = rows.slice(0, limit);
    return { ok: true as const, data: { tasks, nextAfterId: rows.length > limit ? tasks[tasks.length - 1].id : null } };
  });
}

export async function listTaskEvents(taskId: number, actor: Actor, query: Record<string, unknown>) {
  return prisma.$transaction(async tx => {
    const task = await tx.task.findUnique({ where: { id: taskId } });
    if (!task) return fail(404, 'TASK_NOT_FOUND', 'Task not found.');
    const resolved = await context(tx, task.teamId, actor);
    if (!resolved.ok) return resolved;
    const parsed = parseTaskQuery(query, true);
    if (!parsed.ok) return parsed;
    const { limit, afterId } = parsed.data;
    const rows = await tx.taskEvent.findMany({ where: { taskId, ...(afterId ? { id: { gt: afterId } } : {}) },
      orderBy: { id: 'asc' }, take: limit + 1, include: { actor: { select: { id: true, fullName: true } } } });
    const events = rows.slice(0, limit);
    return { ok: true as const, data: { events, nextAfterId: rows.length > limit ? events[events.length - 1].id : null } };
  });
}
