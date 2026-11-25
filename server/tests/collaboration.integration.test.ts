import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { seedDatabase } from '../prisma/seed';
import { clearRevokedTokens, signAuthToken } from '../src/middleware/auth';
import { assertDisposableTestDatabase } from './helpers/disposableDatabase';

describe('F-07 task checkpoint: real API/PostgreSQL (S3-F07-AC01-05)', () => {
  let f: Awaited<ReturnType<typeof seedDatabase>>;
  let student: string, teammate: string, foreign: string, instructor: string;
  const body = () => ({ expectedVersion: 0, title: '  Implement task workflow  ',
    description: '  Persist assignments and status.  ', sprintNumber: 3, assigneeId: f.tatchakorn.id });
  const list = (token = student, suffix = '', teamId = f.teamAlpha.id) =>
    request(app).get(`/api/teams/${teamId}/tasks${suffix}`).set('Authorization', `Bearer ${token}`);
  const create = (payload: unknown = body(), token = student, teamId = f.teamAlpha.id) =>
    request(app).post(`/api/teams/${teamId}/tasks`).set('Authorization', `Bearer ${token}`).send(payload);
  const update = (id: number, payload: unknown, token = student) =>
    request(app).put(`/api/tasks/${id}`).set('Authorization', `Bearer ${token}`).send(payload);
  const events = (id: number, token = student, suffix = '') =>
    request(app).get(`/api/tasks/${id}/events${suffix}`).set('Authorization', `Bearer ${token}`);

  beforeEach(async () => {
    assertDisposableTestDatabase();
    await clearRevokedTokens();
    f = await seedDatabase(prisma);
    await prisma.teamMember.create({ data: { teamId: f.teamAlpha.id, userId: f.tatchakorn.id, courseId: f.course.id } });
    await prisma.projectProposal.update({ where: { teamId: f.teamAlpha.id }, data: { status: 'APPROVED' } });
    student = signAuthToken(f.pawarit); teammate = signAuthToken(f.tatchakorn);
    foreign = signAuthToken(f.somchai); instructor = signAuthToken(f.instructor);
  });
  afterAll(async () => { await prisma.$disconnect(); });

  it('S3-F07-T01/AC01: creates normalized assigned task, persisted GET/DB and attributed creation event', async () => {
    const saved = await create();
    expect(saved.status).toBe(201);
    expect(saved.headers['cache-control']).toBe('no-store');
    expect(saved.body.task).toMatchObject({ teamId: f.teamAlpha.id, title: 'Implement task workflow',
      description: 'Persist assignments and status.', sprintNumber: 3, status: 'TODO', version: 1,
      assigneeId: f.tatchakorn.id, createdById: f.pawarit.id, updatedById: f.pawarit.id, milestoneId: null });
    expect((await list(teammate)).body.tasks).toEqual([saved.body.task]);
    expect((await list(instructor)).body.tasks).toEqual([saved.body.task]);
    expect(await prisma.task.findUnique({ where: { id: saved.body.task.id } })).toMatchObject({ title: saved.body.task.title });
    const history = await events(saved.body.task.id);
    expect(history.body.events).toHaveLength(1);
    expect(history.body.events[0]).toMatchObject({ taskId: saved.body.task.id, actorId: f.pawarit.id, version: 1,
      changes: { title: { before: null, after: 'Implement task workflow' }, status: { before: null, after: 'TODO' } } });
    expect(JSON.stringify(saved.body)).not.toMatch(/passwordHash|peerEvaluation|reviewFeedback/);
  });

  it.each(['DRAFT', 'SUBMITTED', 'REVISION_REQUESTED'] as const)(
    'S3-F07-T02/AC02: non-approved %s denies writes while authorized history stays readable', async status => {
      const saved = await create(); expect(saved.status).toBe(201);
      await prisma.projectProposal.update({ where: { teamId: f.teamAlpha.id }, data: { status } });
      const denied = await create(); expect(denied.status).toBe(409);
      expect(denied.body.code).toBe('APPROVED_TEAM_REQUIRED');
      expect((await update(saved.body.task.id, { expectedVersion: 1, status: 'DONE' })).status).toBe(409);
      expect((await list()).body.tasks[0].version).toBe(1);
      expect((await events(saved.body.task.id)).body.events).toHaveLength(1);
    });

  it('S3-F07-T02/AC02: validates fields/assignee/published same-course context with no rejected writes', async () => {
    const rejected = [
      { title: 'ab' }, { title: 'x'.repeat(121) }, { title: null }, { description: 'x'.repeat(5001) },
      { description: 10 }, { sprintNumber: 0 }, { sprintNumber: 4 }, { sprintNumber: '3' },
      { sprintNumber: 1.5 }, { status: 'INVALID' }, { assigneeId: f.somchai.id },
      { assigneeId: f.instructor.id }, { assigneeId: '1' }, { expectedVersion: 1 },
      { expectedVersion: null }, { createdById: f.instructor.id }, { teamId: f.teamBeta.id },
    ];
    for (const patch of rejected) expect((await create({ ...body(), ...patch })).status).toBe(400);
    const otherCourse = await prisma.course.create({ data: { code: 'OTHER-TASKS', name: 'Other course', term: '1/2026' } });
    for (const [courseId, status] of [[f.course.id, 'DRAFT'], [otherCourse.id, 'PUBLISHED']] as const) {
      const m = await prisma.milestone.create({ data: { courseId, status, title: 'Context milestone', description: 'Task context', dueDate: new Date('2027-01-01Z') } });
      expect((await create({ ...body(), milestoneId: m.id })).status).toBe(404);
    }
    expect(await prisma.task.count()).toBe(0); expect(await prisma.taskEvent.count()).toBe(0);
    const m = await prisma.milestone.create({ data: { courseId: f.course.id, status: 'PUBLISHED', title: 'Published context', description: 'Task context', dueDate: new Date('2027-01-01Z') } });
    const valid = await create({ ...body(), title: 'abc', description: 'x'.repeat(5000), sprintNumber: 1, assigneeId: null, milestoneId: m.id });
    expect(valid.status).toBe(201);
    expect((await create({ ...body(), title: 'x'.repeat(120), status: 'DONE' })).status).toBe(201);
    const before = await prisma.task.findUnique({ where: { id: valid.body.task.id } });
    for (const payload of [{ expectedVersion: 1 }, { expectedVersion: 1, teamId: f.teamBeta.id },
      { status: 'DONE' }, { expectedVersion: 1, assigneeId: f.somchai.id }]) {
      expect((await update(valid.body.task.id, payload)).status).toBe(400);
    }
    expect(await prisma.task.findUnique({ where: { id: valid.body.task.id } })).toEqual(before);
  });

  it('S3-F07-T03/AC03: teammate transitions TODO -> IN_PROGRESS -> DONE -> TODO with immutable events', async () => {
    const saved = await create(); expect(saved.status).toBe(201); const id = saved.body.task.id;
    const creation = (await events(id)).body.events[0];
    let version = 1;
    for (const status of ['IN_PROGRESS', 'DONE', 'TODO']) {
      const changed = await update(id, { expectedVersion: version, status }, teammate);
      expect(changed.status).toBe(200); version++;
      expect(changed.body.task).toMatchObject({ status, version, updatedById: f.tatchakorn.id });
    }
    const history = (await events(id)).body.events;
    expect(history).toHaveLength(4); expect(history[0]).toEqual(creation);
    expect(history.map((e: {version: number}) => e.version)).toEqual([1, 2, 3, 4]);
    expect(history[3]).toMatchObject({ actorId: f.tatchakorn.id, changes: { status: { before: 'DONE', after: 'TODO' } } });
    expect((await list()).body.tasks[0]).toMatchObject({ status: 'TODO', version: 4 });
  });

  it('S3-F07-T04/AC04: anonymous/foreign/instructor writes are denied with unchanged rows/events', async () => {
    const saved = await create(); expect(saved.status).toBe(201); const id = saved.body.task.id;
    const before = await prisma.task.findUnique({ where: { id } });
    for (const path of [`/api/teams/${f.teamAlpha.id}/tasks`, `/api/tasks/${id}/events`]) {
      expect((await request(app).get(path)).status).toBe(401);
    }
    for (const denied of [await list(foreign), await events(id, foreign),
      await create(body(), foreign), await update(id, { expectedVersion: 1, status: 'DONE' }, foreign),
      await create(body(), instructor), await update(id, { expectedVersion: 1, status: 'DONE' }, instructor)]) {
      expect(denied.status).toBe(403); expect(JSON.stringify(denied.body)).not.toContain('Implement task workflow');
    }
    expect((await events(id, instructor)).status).toBe(200);
    await prisma.teamMember.delete({ where: { teamId_userId: { teamId: f.teamAlpha.id, userId: f.tatchakorn.id } } });
    expect((await list(teammate)).status).toBe(403);
    expect((await update(id, { expectedVersion: 1, status: 'DONE' }, teammate)).status).toBe(403);
    expect(await prisma.task.findUnique({ where: { id } })).toEqual(before);
    expect(await prisma.taskEvent.count()).toBe(1);
  });

  it('S3-F07-T05/AC05: barrier-controlled writers admit one version/event and reject stale replay', async () => {
    const saved = await create(); expect(saved.status).toBe(201); const id = saved.body.task.id;
    let unlock!: () => void, locked!: () => void;
    const gate = new Promise<void>(resolve => { unlock = resolve; });
    const ready = new Promise<void>(resolve => { locked = resolve; });
    const holder = prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${f.teamAlpha.id} FOR UPDATE`;
      locked(); await gate;
    }, { timeout: 10000 });
    await ready;
    const first = update(id, { expectedVersion: 1, status: 'IN_PROGRESS' }).then(r => r);
    const second = update(id, { expectedVersion: 1, status: 'DONE' }, teammate).then(r => r);
    let blocked = false;
    try {
      for (let attempt = 0; attempt < 100; attempt++) {
        const waiting = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) AS count FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`;
        if (Number(waiting[0].count) >= 2) { blocked = true; break; }
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally { unlock(); await holder; }
    const results = await Promise.all([first, second]);
    expect(blocked).toBe(true); expect(results.map(r => r.status).sort()).toEqual([200, 409]);
    expect(results.find(r => r.status === 409)!.body.code).toBe('TASK_VERSION_CONFLICT');
    const winner = results.find(r => r.status === 200)!.body.task;
    expect((await update(id, { expectedVersion: 1, title: 'Stale overwrite' })).status).toBe(409);
    expect((await list()).body.tasks[0]).toEqual(winner); expect((await events(id)).body.events).toHaveLength(2);
  });

  it('S3-F07-T06/AC05: deterministic task/event pagination, filters, empty and malformed requests', async () => {
    const ids: number[] = [];
    for (const sprintNumber of [1, 3, 3]) {
      const saved = await create({ ...body(), sprintNumber }); expect(saved.status).toBe(201); ids.push(saved.body.task.id);
    }
    const first = await list(student, '?limit=2'); expect(first.body.tasks.map((t: {id: number}) => t.id)).toEqual(ids.slice(0, 2));
    expect(first.body.nextAfterId).toBe(ids[1]);
    const last = await list(student, `?limit=2&afterId=${first.body.nextAfterId}`);
    expect(last.body.tasks.map((t: {id: number}) => t.id)).toEqual(ids.slice(2)); expect(last.body.nextAfterId).toBeNull();
    expect((await list(student, '?sprintNumber=3')).body.tasks).toHaveLength(2);
    expect((await list(student, '?status=DONE')).body.tasks).toEqual([]);
    expect((await list(foreign, '', f.teamBeta.id)).body.tasks).toEqual([]);
    for (const query of ['?limit=0', '?limit=101', '?afterId=1.5', '?sprintNumber=4', '?status=invalid', '?milestoneId=0', '?unknown=1', '?limit=1&limit=2']) {
      expect((await list(student, query)).status).toBe(400);
    }
    await update(ids[0], { expectedVersion: 1, status: 'DONE' });
    const history = await events(ids[0], student, '?limit=1'); expect(history.body.events).toHaveLength(1);
    expect((await events(ids[0], student, `?afterId=${history.body.nextAfterId}`)).body.events[0].version).toBe(2);
    expect((await request(app).get('/api/tasks/0/events').set('Authorization', `Bearer ${student}`)).status).toBe(400);
    expect((await events(2147483647)).status).toBe(404);
    expect((await list(student, '', 2147483647)).status).toBe(404);
  });
});
