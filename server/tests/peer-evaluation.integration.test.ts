import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { seedDatabase } from '../prisma/seed';
import { clearRevokedTokens, signAuthToken } from '../src/middleware/auth';
import { assertDisposableTestDatabase } from './helpers/disposableDatabase';

describe('F-07 confidential peer evaluation: actual API/PostgreSQL', () => {
  let f: Awaited<ReturnType<typeof seedDatabase>>;
  let student: string, teammate: string, foreign: string, instructor: string;
  let milestoneId: number;
  const instant = Date.parse('2026-11-25T13:00:00.000Z');
  const base = (teamId = f.teamAlpha.id, mid = milestoneId) => `/api/teams/${teamId}/milestones/${mid}/peer-evaluations`;
  const save = (payload: unknown = { expectedVersion: 0, rating: 4, comment: '  Confidential contribution  ' },
    token = student, target = f.tatchakorn.id, teamId = f.teamAlpha.id, mid = milestoneId) =>
    request(app).put(`${base(teamId, mid)}/${target}`).set('Authorization', `Bearer ${token}`).send(payload);
  const own = (token = student, query = '') => request(app).get(`${base()}/me${query}`).set('Authorization', `Bearer ${token}`);
  const all = (token = instructor, query = '') => request(app).get(`${base()}${query}`).set('Authorization', `Bearer ${token}`);
  const rows = () => prisma.$queryRawUnsafe('SELECT * FROM "PeerEvaluation" ORDER BY "id"');

  beforeEach(async () => {
    assertDisposableTestDatabase(); await clearRevokedTokens(); f = await seedDatabase(prisma);
    await prisma.teamMember.create({ data: { teamId: f.teamAlpha.id, userId: f.tatchakorn.id, courseId: f.course.id } });
    await prisma.projectProposal.update({ where: { teamId: f.teamAlpha.id }, data: { status: 'APPROVED' } });
    const milestone = await prisma.milestone.create({ data: { courseId: f.course.id, title: 'Completed peer milestone',
      description: 'Synthetic completion boundary', status: 'PUBLISHED', dueDate: new Date(instant), publishedAt: new Date(instant - 10000) } });
    milestoneId = milestone.id;
    await prisma.milestoneSubmission.create({ data: { milestoneId, teamId: f.teamAlpha.id, artifactUrl: 'https://example.org/repo', releaseTag: 'peer-v1' } });
    student = signAuthToken(f.pawarit); teammate = signAuthToken(f.tatchakorn);
    foreign = signAuthToken(f.somchai); instructor = signAuthToken(f.instructor);
    vi.spyOn(Date, 'now').mockReturnValue(instant);
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => { await prisma.$disconnect(); });

  it('S3-F07-T09/AC07: server time due-1/equal/+1, published and real own submission prerequisites', async () => {
    vi.mocked(Date.now).mockReturnValue(instant - 1);
    expect((await save()).status).toBe(409);
    expect((await own()).body.eligibility.canEvaluate).toBe(false);
    vi.mocked(Date.now).mockReturnValue(instant);
    expect((await save()).status).toBe(201);
    vi.mocked(Date.now).mockReturnValue(instant + 1);
    expect((await save({ expectedVersion: 1, rating: 5 })).status).toBe(200);
    const before = await rows();
    for (const status of ['DRAFT', 'PUBLISHED'] as const) {
      await prisma.milestone.update({ where: { id: milestoneId }, data: { status, dueDate: new Date(instant + 100) } });
      const denied = await save({ expectedVersion: 2, rating: 1 });
      expect(denied.status).toBe(409); expect(denied.body.code).toBe('MILESTONE_NOT_COMPLETED');
    }
    // Authorized historical reads survive a deadline extension; writes do not.
    expect((await own()).body.evaluations).toHaveLength(1);
    await prisma.milestone.update({ where: { id: milestoneId }, data: { dueDate: new Date(instant - 1) } });
    await prisma.milestoneSubmission.deleteMany({ where: { milestoneId } });
    expect((await save({ expectedVersion: 2, rating: 1 })).body.code).toBe('MILESTONE_NOT_COMPLETED');
    expect(await rows()).toEqual(before);
  });

  it('S3-F07-T10/AC08: rating/comment/version/type boundaries, no self-rating, current eligible teammates', async () => {
    expect((await save({}, student, f.pawarit.id)).body.code).toBe('SELF_EVALUATION_NOT_ALLOWED');
    expect((await save({}, student, f.somchai.id)).body.code).toBe('INVALID_PEER_TARGET');
    const valid = { expectedVersion: 0, rating: 1, comment: 'x'.repeat(2000) };
    for (const patch of [{ rating: 0 }, { rating: 6 }, { rating: 1.5 }, { rating: '4' }, { rating: null },
      { comment: 'x'.repeat(2001) }, { comment: null }, { comment: 4 }, { expectedVersion: '0' }, { expectedVersion: -1 },
      { expectedVersion: 1.5 }, { expectedVersion: 2147483647 }, { evaluatorId: f.tatchakorn.id }, { teamId: f.teamBeta.id },
      { createdAt: '2020-01-01Z' }]) expect((await save({ ...valid, ...patch })).status).toBe(400);
    expect((await save({ rating: 4 })).status).toBe(400);
    expect(await rows()).toEqual([]);
    expect((await save(valid)).status).toBe(201);
    expect((await save({ expectedVersion: 1, rating: 5, comment: ' '.repeat(10) + 'x'.repeat(2000) + ' ' })).status).toBe(200);
    const before = await rows();
    await prisma.teamMember.delete({ where: { teamId_userId: { teamId: f.teamAlpha.id, userId: f.tatchakorn.id } } });
    expect((await save({ expectedVersion: 2, rating: 3 })).body.code).toBe('INVALID_PEER_TARGET');
    expect(await rows()).toEqual(before);
  });

  it('S3-F07-T11/AC09: own outgoing save/update/readback retains one pair, actor and creation metadata', async () => {
    const created = await save(); expect(created.status).toBe(201);
    expect(created.headers['cache-control']).toBe('no-store');
    expect(created.body.evaluation).toMatchObject({ teamId: f.teamAlpha.id, milestoneId, evaluatorId: f.pawarit.id,
      evaluateeId: f.tatchakorn.id, rating: 4, comment: 'Confidential contribution', version: 1 });
    const updated = await save({ expectedVersion: 1, rating: 5 }); expect(updated.status).toBe(200);
    expect(updated.body.evaluation.comment).toBe('Confidential contribution');
    expect(updated.body.evaluation.createdAt).toBe(created.body.evaluation.createdAt);
    expect(updated.body.evaluation.id).toBe(created.body.evaluation.id);
    expect((await own()).body.evaluations).toEqual([updated.body.evaluation]);
    expect((await own(teammate)).body.evaluations).toEqual([]);
    expect((await save()).status).toBe(409); expect((await rows() as unknown[])).toHaveLength(1);
    expect((await prisma.milestoneSubmission.findFirst({ where: { milestoneId } }))?.score).toBeNull();
  });

  it('S3-F07-T12/AC10: all route/method auth, foreign-team, role and removed-membership denials preserve data', async () => {
    expect((await save()).status).toBe(201); const before = await rows();
    const routes = [{ method: 'get', path: `${base()}/me` }, { method: 'get', path: base() },
      { method: 'put', path: `${base()}/${f.tatchakorn.id}` }] as const;
    for (const route of routes) {
      expect((await request(app)[route.method](route.path)).status).toBe(401);
      const denied = await request(app)[route.method](route.path).set('Authorization', `Bearer ${foreign}`).send({ expectedVersion: 1, rating: 1 });
      expect(denied.status).toBe(403); expect(JSON.stringify(denied.body)).not.toContain('Confidential contribution');
    }
    expect((await all(student)).status).toBe(403); expect((await all(teammate)).status).toBe(403);
    expect((await own(instructor)).status).toBe(403); expect((await save({}, instructor)).status).toBe(403);
    const authorized = await all(); expect(authorized.status).toBe(200); expect(authorized.headers['cache-control']).toBe('no-store');
    expect(authorized.body.evaluations[0].comment).toBe('Confidential contribution');
    for (const path of ['/api/teams', `/api/teams/${f.teamAlpha.id}`, `/api/teams/${f.teamAlpha.id}/tasks`,
      `/api/courses/${f.course.id}/milestones`]) {
      const general = await request(app).get(path).set('Authorization', `Bearer ${teammate}`);
      expect(general.status).toBe(200); expect(JSON.stringify(general.body)).not.toMatch(/Confidential contribution|evaluatorId|peerEvaluations/);
    }
    await prisma.teamMember.delete({ where: { teamId_userId: { teamId: f.teamAlpha.id, userId: f.pawarit.id } } });
    expect((await own()).status).toBe(403); expect((await save({ expectedVersion: 1, rating: 1 })).status).toBe(403);
    expect(await rows()).toEqual(before);
  });

  it('S3-F07-T11/T12: outgoing/instructor pagination and context/identifier validation never broaden visibility', async () => {
    await prisma.teamMember.create({ data: { teamId: f.teamAlpha.id, userId: f.suda.id, courseId: f.course.id } });
    expect((await save()).status).toBe(201);
    expect((await save({ expectedVersion: 0, rating: 2 }, student, f.suda.id)).status).toBe(201);
    expect((await save({ expectedVersion: 0, rating: 3 }, teammate, f.pawarit.id)).status).toBe(201);
    const first = await own(student, '?limit=1'); expect(first.body.evaluations).toHaveLength(1);
    const last = await own(student, `?limit=1&afterId=${first.body.nextAfterId}`);
    expect(last.body.evaluations).toHaveLength(1); expect(last.body.nextAfterId).toBeNull();
    expect(last.body.evaluations[0].evaluatorId).toBe(f.pawarit.id);
    const allFirst = await all(instructor, '?limit=2'); expect(allFirst.body.evaluations).toHaveLength(2);
    expect((await all(instructor, `?afterId=${allFirst.body.nextAfterId}`)).body.evaluations).toHaveLength(1);
    for (const query of ['?limit=0', '?limit=101', '?afterId=0', '?afterId=1.5', '?evaluatorId=1', '?limit=1&limit=2'])
      expect((await own(student, query)).status).toBe(400);
    const otherCourse = await prisma.course.create({ data: { code: 'PEER-OTHER', name: 'Other course', term: '1/2026' } });
    const other = await prisma.milestone.create({ data: { courseId: otherCourse.id, title: 'Wrong course', description: 'Mismatch', dueDate: new Date(instant) } });
    expect((await save({}, student, f.tatchakorn.id, f.teamAlpha.id, other.id)).status).toBe(404);
    expect((await request(app).get(`${base(f.teamAlpha.id, 0)}/me`).set('Authorization', `Bearer ${student}`)).status).toBe(400);
    expect((await save({}, student, 0)).status).toBe(400);
  });

  it.each([0, 1])('S3-F07-T13/AC11: barrier-controlled concurrent version %s has one winner and one conflict', async expectedVersion => {
    if (expectedVersion) expect((await save()).status).toBe(201);
    let unlock!: () => void, locked!: () => void;
    const gate = new Promise<void>(resolve => { unlock = resolve; });
    const ready = new Promise<void>(resolve => { locked = resolve; });
    const holder = prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${f.teamAlpha.id} FOR UPDATE`;
      locked(); await gate;
    }, { timeout: 10000 });
    await ready;
    const first = save({ expectedVersion, rating: 1 }).then(r => r);
    const second = save({ expectedVersion, rating: 5 }).then(r => r);
    let blocked = false;
    try {
      for (let attempt = 0; attempt < 100; attempt++) {
        const waiting = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) AS count FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`;
        if (Number(waiting[0].count) >= 2) { blocked = true; break; }
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } finally { unlock(); await holder; }
    const results = await Promise.all([first, second]); expect(blocked).toBe(true);
    expect(results.map(r => r.status).sort()).toEqual([expectedVersion ? 200 : 201, 409]);
    expect(results.find(r => r.status === 409)!.body.code).toBe('PEER_EVALUATION_VERSION_CONFLICT');
    const winner = results.find(r => r.status !== 409)!.body.evaluation;
    expect((await own()).body.evaluations).toEqual([winner]); expect((await rows() as unknown[])).toHaveLength(1);
  });
});
