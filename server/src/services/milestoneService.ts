import { Milestone, MilestoneStatus, Role } from '@prisma/client';
import prisma from '../prisma';

export interface ValidationFailure {
  valid: false;
  ok: false;
  error: string;
  code: string;
  status: number;
}

export type ValidationResult<T> = { valid: true; data: T } | ValidationFailure;

export interface CreateMilestoneInput {
  title: string;
  description: string;
  dueDate: Date;
  weightPercent: number;
}

export interface UpdateMilestoneInput {
  expectedVersion: number;
  title?: string;
  description?: string;
  dueDate?: Date;
  weightPercent?: number;
}

export interface ListMilestonesQuery {
  status?: MilestoneStatus;
  limit: number;
  afterId?: number;
}

const CREATE_ALLOWED_KEYS = new Set(['title', 'description', 'dueDate', 'weightPercent']);
const UPDATE_ALLOWED_KEYS = new Set([
  'expectedVersion',
  'title',
  'description',
  'dueDate',
  'weightPercent',
]);
const PUBLISH_ALLOWED_KEYS = new Set(['expectedVersion']);

const ISO_OFFSET_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/;

function fail(error: string, code: string, status = 400): ValidationFailure {
  return { valid: false, ok: false, error, code, status };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseCanonicalPositiveInt(raw: unknown): number | null {
  if (typeof raw !== 'string' || !/^[1-9][0-9]*$/.test(raw)) {
    return null;
  }
  const num = Number(raw);
  return Number.isSafeInteger(num) && num >= 1 ? num : null;
}

export function parseExplicitOffsetIsoDate(raw: unknown): Date | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  const match = ISO_OFFSET_REGEX.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
    return null;
  }
  if (match[9]) {
    const offsetHour = Number(match[10]);
    const offsetMin = Number(match[11]);
    if (offsetHour > 23 || offsetMin > 59) {
      return null;
    }
  }

  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day
  ) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateTitle(raw: unknown): ValidationResult<string> {
  if (typeof raw !== 'string') {
    return fail('Milestone title must be a string between 3 and 120 characters.', 'VALIDATION_ERROR');
  }
  const trimmed = raw.trim();
  if (trimmed.length < 3 || trimmed.length > 120) {
    return fail('Milestone title must be between 3 and 120 characters.', 'VALIDATION_ERROR');
  }
  return { valid: true, data: trimmed };
}

function validateDescription(raw: unknown): ValidationResult<string> {
  if (typeof raw !== 'string') {
    return fail(
      'Milestone description must be a string between 10 and 5000 characters.',
      'VALIDATION_ERROR'
    );
  }
  const trimmed = raw.trim();
  if (trimmed.length < 10 || trimmed.length > 5000) {
    return fail(
      'Milestone description must be between 10 and 5000 characters.',
      'VALIDATION_ERROR'
    );
  }
  return { valid: true, data: trimmed };
}

function validateWeightPercent(raw: unknown): ValidationResult<number> {
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0 || raw > 100) {
    return fail('weightPercent must be an integer between 0 and 100.', 'VALIDATION_ERROR');
  }
  return { valid: true, data: raw };
}

function validateExpectedVersion(raw: unknown): ValidationResult<number> {
  if (typeof raw !== 'number' || !Number.isSafeInteger(raw) || raw < 1) {
    return fail('expectedVersion must be a positive integer.', 'VALIDATION_ERROR');
  }
  return { valid: true, data: raw };
}

function validateAllowedKeys(
  obj: Record<string, unknown>,
  allowedKeys: Set<string>
): ValidationFailure | null {
  for (const key of Object.keys(obj)) {
    if (!allowedKeys.has(key)) {
      return fail(`Unknown or non-writable field: ${key}`, 'VALIDATION_ERROR');
    }
  }
  return null;
}

export function validateListMilestonesQuery(
  query: Record<string, unknown>
): ValidationResult<ListMilestonesQuery> {
  let limit = 50;
  if (query.limit !== undefined) {
    const parsedLimit = parseCanonicalPositiveInt(query.limit);
    if (parsedLimit === null || parsedLimit < 1 || parsedLimit > 100) {
      return fail('limit must be an integer between 1 and 100.', 'VALIDATION_ERROR');
    }
    limit = parsedLimit;
  }

  let afterId: number | undefined;
  if (query.afterId !== undefined) {
    const parsedAfter = parseCanonicalPositiveInt(query.afterId);
    if (parsedAfter === null) {
      return fail('afterId must be a positive integer.', 'VALIDATION_ERROR');
    }
    afterId = parsedAfter;
  }

  let status: MilestoneStatus | undefined;
  if (query.status !== undefined) {
    if (query.status !== 'DRAFT' && query.status !== 'PUBLISHED') {
      return fail('status filter must be DRAFT or PUBLISHED.', 'VALIDATION_ERROR');
    }
    status = query.status;
  }

  return { valid: true, data: { status, limit, afterId } };
}

export function validateCreateMilestoneBody(
  body: unknown
): ValidationResult<CreateMilestoneInput> {
  if (!isPlainObject(body)) {
    return fail('Request body must be a JSON object.', 'VALIDATION_ERROR');
  }

  const keyErr = validateAllowedKeys(body, CREATE_ALLOWED_KEYS);
  if (keyErr) return keyErr;

  const titleRes = validateTitle(body.title);
  if (!titleRes.valid) return titleRes;

  const descRes = validateDescription(body.description);
  if (!descRes.valid) return descRes;

  const dueDate = parseExplicitOffsetIsoDate(body.dueDate);
  if (!dueDate) {
    return fail(
      'dueDate must be an ISO-8601 timestamp with an explicit UTC offset.',
      'MILESTONE_DUE_DATE_INVALID'
    );
  }

  const weightRes = validateWeightPercent(body.weightPercent);
  if (!weightRes.valid) return weightRes;

  return {
    valid: true,
    data: {
      title: titleRes.data,
      description: descRes.data,
      dueDate,
      weightPercent: weightRes.data,
    },
  };
}

export function validateUpdateMilestoneBody(
  body: unknown
): ValidationResult<UpdateMilestoneInput> {
  if (!isPlainObject(body)) {
    return fail('Request body must be a JSON object.', 'VALIDATION_ERROR');
  }

  const keyErr = validateAllowedKeys(body, UPDATE_ALLOWED_KEYS);
  if (keyErr) return keyErr;

  const versionRes = validateExpectedVersion(body.expectedVersion);
  if (!versionRes.valid) return versionRes;

  const update: UpdateMilestoneInput = { expectedVersion: versionRes.data };
  let hasWritableField = false;

  if (body.title !== undefined) {
    const titleRes = validateTitle(body.title);
    if (!titleRes.valid) return titleRes;
    update.title = titleRes.data;
    hasWritableField = true;
  }

  if (body.description !== undefined) {
    const descRes = validateDescription(body.description);
    if (!descRes.valid) return descRes;
    update.description = descRes.data;
    hasWritableField = true;
  }

  if (body.dueDate !== undefined) {
    const dueDate = parseExplicitOffsetIsoDate(body.dueDate);
    if (!dueDate) {
      return fail(
        'dueDate must be an ISO-8601 timestamp with an explicit UTC offset.',
        'MILESTONE_DUE_DATE_INVALID'
      );
    }
    update.dueDate = dueDate;
    hasWritableField = true;
  }

  if (body.weightPercent !== undefined) {
    const weightRes = validateWeightPercent(body.weightPercent);
    if (!weightRes.valid) return weightRes;
    update.weightPercent = weightRes.data;
    hasWritableField = true;
  }

  if (!hasWritableField) {
    return fail('At least one writable milestone field must be provided.', 'VALIDATION_ERROR');
  }

  return { valid: true, data: update };
}

export function validatePublishMilestoneBody(
  body: unknown
): ValidationResult<{ expectedVersion: number }> {
  if (!isPlainObject(body)) {
    return fail('Request body must be a JSON object.', 'VALIDATION_ERROR');
  }

  const keyErr = validateAllowedKeys(body, PUBLISH_ALLOWED_KEYS);
  if (keyErr) return keyErr;

  const versionRes = validateExpectedVersion(body.expectedVersion);
  if (!versionRes.valid) return versionRes;

  return { valid: true, data: { expectedVersion: versionRes.data } };
}

export function validatePublishDueDate(
  dueDate: Date,
  now: Date
): { valid: true } | ValidationFailure {
  if (dueDate.getTime() <= now.getTime()) {
    return fail(
      'Cannot publish a milestone whose dueDate is not strictly in the future.',
      'MILESTONE_DUE_DATE_INVALID',
      400
    );
  }
  return { valid: true };
}

export type ServiceOutcome<T> = { ok: true; data: T } | ValidationFailure;

export async function listMilestonesForCourse(params: {
  courseId: number;
  role: Role;
  query: ListMilestonesQuery;
}): Promise<ServiceOutcome<{ milestones: Milestone[]; nextAfterId: number | null }>> {
  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) {
    return fail('Course not found.', 'COURSE_NOT_FOUND', 404);
  }

  const { status, limit, afterId } = params.query;
  let effectiveStatus: MilestoneStatus | undefined = status;
  if (params.role !== 'INSTRUCTOR') {
    if (status === 'DRAFT') {
      return { ok: true, data: { milestones: [], nextAfterId: null } };
    }
    effectiveStatus = 'PUBLISHED';
  }

  const rows = await prisma.milestone.findMany({
    where: {
      courseId: params.courseId,
      ...(effectiveStatus ? { status: effectiveStatus } : {}),
      ...(afterId !== undefined ? { id: { gt: afterId } } : {}),
    },
    orderBy: { id: 'asc' },
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const milestones = hasMore ? rows.slice(0, limit) : rows;
  const nextAfterId = hasMore ? milestones[milestones.length - 1].id : null;

  return { ok: true, data: { milestones, nextAfterId } };
}

export async function getMilestoneById(params: {
  id: number;
  role: Role;
}): Promise<ServiceOutcome<{ milestone: Milestone }>> {
  const milestone = await prisma.milestone.findUnique({ where: { id: params.id } });
  if (!milestone || (params.role !== 'INSTRUCTOR' && milestone.status !== 'PUBLISHED')) {
    return fail('Milestone not found.', 'MILESTONE_NOT_FOUND', 404);
  }
  return { ok: true, data: { milestone } };
}

export async function createMilestone(params: {
  courseId: number;
  input: CreateMilestoneInput;
}): Promise<ServiceOutcome<{ milestone: Milestone }>> {
  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) {
    return fail('Course not found.', 'COURSE_NOT_FOUND', 404);
  }

  const milestone = await prisma.milestone.create({
    data: {
      courseId: params.courseId,
      title: params.input.title,
      description: params.input.description,
      dueDate: params.input.dueDate,
      weightPercent: params.input.weightPercent,
      status: 'DRAFT',
      publishedAt: null,
      version: 1,
    },
  });

  return { ok: true, data: { milestone } };
}

export async function updateMilestone(params: {
  id: number;
  input: UpdateMilestoneInput;
}): Promise<ServiceOutcome<{ milestone: Milestone }>> {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Milestone" WHERE "id" = ${params.id} FOR UPDATE`;

    const current = await tx.milestone.findUnique({ where: { id: params.id } });
    if (!current) {
      return fail('Milestone not found.', 'MILESTONE_NOT_FOUND', 404);
    }

    if (current.version !== params.input.expectedVersion) {
      return fail(
        'Milestone has been modified by another request. Reload and retry.',
        'MILESTONE_VERSION_CONFLICT',
        409
      );
    }

    const updated = await tx.milestone.update({
      where: { id: params.id },
      data: {
        ...(params.input.title !== undefined ? { title: params.input.title } : {}),
        ...(params.input.description !== undefined
          ? { description: params.input.description }
          : {}),
        ...(params.input.dueDate !== undefined ? { dueDate: params.input.dueDate } : {}),
        ...(params.input.weightPercent !== undefined
          ? { weightPercent: params.input.weightPercent }
          : {}),
        version: current.version + 1,
      },
    });

    return { ok: true as const, data: { milestone: updated } };
  });

  return result;
}

export async function publishMilestone(params: {
  id: number;
  expectedVersion: number;
  now?: Date;
}): Promise<ServiceOutcome<{ milestone: Milestone }>> {
  const now = params.now ?? new Date();

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Milestone" WHERE "id" = ${params.id} FOR UPDATE`;

    const current = await tx.milestone.findUnique({ where: { id: params.id } });
    if (!current) {
      return fail('Milestone not found.', 'MILESTONE_NOT_FOUND', 404);
    }

    if (current.version !== params.expectedVersion) {
      return fail(
        'Milestone has been modified by another request. Reload and retry.',
        'MILESTONE_VERSION_CONFLICT',
        409
      );
    }

    if (current.status === 'PUBLISHED') {
      return fail('Milestone is already published.', 'MILESTONE_ALREADY_PUBLISHED', 409);
    }

    const dueCheck = validatePublishDueDate(current.dueDate, now);
    if (!dueCheck.valid) {
      return dueCheck;
    }

    const updated = await tx.milestone.update({
      where: { id: params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
        version: current.version + 1,
      },
    });

    return { ok: true as const, data: { milestone: updated } };
  });

  return result;
}
