import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { seedDatabase } from '../prisma/seed';
import { clearRevokedTokens, signAuthToken } from '../src/middleware/auth';

describe('F-05: real API/PostgreSQL submissions, immutable versions and access', () => {
  let fixture: Awaited<ReturnType<typeof seedDatabase>>;
  let milestoneId: number;
  let student: string;
  let foreign: string;
  let instructor: string;
  const deadline = new Date('2026-11-29T16:59:00.000Z');
  const body = (expectedVersion = 0) => ({
    expectedVersion,
    repoUrl: '  https://github.com/example/course-pms  ',
    reportUrl: ' https://example.org/reports/sprint-2.pdf ',
    releaseTag: ' v2.0.0 ',
    notes: ' Reviewed milestone deliverable. ',
  });
  const path = (teamId = fixture.teamAlpha.id, id = milestoneId) =>
    `/api/teams/${teamId}/milestones/${id}/submission`;
  const put = (payload: unknown = body(), token = student, teamId = fixture.teamAlpha.id, id = milestoneId) =>
    request(app).put(path(teamId, id)).set('Authorization', `Bearer ${token}`).send(payload);
  const get = (token = student, teamId = fixture.teamAlpha.id, suffix = '') =>
    request(app).get(path(teamId) + suffix).set('Authorization', `Bearer ${token}`);

  beforeEach(async () => {
    const database = new URL(process.env.DATABASE_URL || '');
    if (process.env.NODE_ENV === 'production' ||
        !['localhost', '127.0.0.1', 'postgres'].includes(database.hostname) ||
        !database.pathname.endsWith('_test')) {
      throw new Error('F-05 integration requires a disposable local/CI database ending in _test.');
    }
    await clearRevokedTokens();
    fixture = await seedDatabase(prisma);
    student = signAuthToken(fixture.pawarit);
    foreign = signAuthToken(fixture.somchai);
    instructor = signAuthToken(fixture.instructor);
    await prisma.projectProposal.update({ where: { teamId: fixture.teamAlpha.id }, data: { status: 'APPROVED' } });
    const milestone = await prisma.milestone.create({ data: {
      courseId: fixture.course.id, title: 'Sprint 2 submission', description: 'Submit reviewed source and report.',
      dueDate: deadline, weightPercent: 25, status: 'PUBLISHED', publishedAt: new Date('2026-11-25T00:00:00Z'),
    } });
    milestoneId = milestone.id;
  });
  afterAll(async () => { await prisma.$disconnect(); });

  it('S2-F05-T01/AC01: creates normalized version 1 and independently retrieves persisted current/history', async () => {
    const saved = await put();
    expect(saved.status).toBe(201);
    expect(saved.headers['cache-control']).toBe('no-store');
    expect(saved.body.submission).toMatchObject({
      teamId: fixture.teamAlpha.id, milestoneId, version: 1,
      repoUrl: 'https://github.com/example/course-pms', reportUrl: 'https://example.org/reports/sprint-2.pdf',
      releaseTag: 'v2.0.0', notes: 'Reviewed milestone deliverable.', publishedEvaluation: null,
      dueDateSnapshot: deadline.toISOString(), lateStatus: 'ON_TIME',
    });
    const read = await get();
    expect(read.status).toBe(200);
    expect(read.body.submission).toEqual(saved.body.submission);
    expect((await get(instructor)).body.submission.id).toBe(saved.body.submission.id);
    const versions = await get(student, fixture.teamAlpha.id, '/versions');
    expect(versions.status).toBe(200);
    expect(versions.body.versions).toHaveLength(1);
    expect(versions.body.versions[0]).toMatchObject({ version: 1, repoUrl: saved.body.submission.repoUrl });
    const row = await prisma.milestoneSubmission.findUniqueOrThrow({ where: { id: saved.body.submission.id } });
    expect(row.artifactUrl).toBe(saved.body.submission.repoUrl);
    expect(await prisma.submissionVersion.count({ where: { submissionId: row.id } })).toBe(1);
  });

  it.each(['DRAFT', 'SUBMITTED', 'REVISION_REQUESTED'] as const)(
    'S2-F05-T02/AC02: rejects %s prerequisites and leaves existing saved rows unchanged', async status => {
      const first = await put();
      expect(first.status).toBe(201);
      const before = await prisma.milestoneSubmission.findUniqueOrThrow({ where: { id: first.body.submission.id } });
      await prisma.projectProposal.update({ where: { teamId: fixture.teamAlpha.id }, data: { status } });
      const rejected = await put({ ...body(1), releaseTag: 'must-not-save' });
      expect(rejected.status).toBe(409);
      expect(rejected.body.code).toBe('BR07_APPROVED_PROPOSAL_REQUIRED');
      expect(await prisma.milestoneSubmission.findUniqueOrThrow({ where: { id: before.id } })).toEqual(before);
      expect(await prisma.submissionVersion.count()).toBe(1);
    });

  it('S2-F05-T03/AC03: rejects drafts, mismatched courses and missing resources', async () => {
    await prisma.milestone.update({ where: { id: milestoneId }, data: { status: 'DRAFT', publishedAt: null } });
    const draft = await put();
    expect(draft.status).toBe(409);
    expect(draft.body.code).toBe('MILESTONE_NOT_PUBLISHED');
    const other = await prisma.course.create({ data: { code: 'F05-OTHER', name: 'Other', term: '1/2026', maxTeamSize: 3 } });
    await prisma.milestone.update({ where: { id: milestoneId }, data: { courseId: other.id, status: 'PUBLISHED' } });
    expect((await put()).status).toBe(404);
    expect((await put(body(), student, fixture.teamAlpha.id, 2147483647)).status).toBe(404);
    expect(await prisma.milestoneSubmission.count()).toBe(0);
  });

  it('S2-F05-T04/AC04: validates URL/tag/type/length/schema boundaries without writes', async () => {
    const invalid = [
      { repoUrl: '' }, { reportUrl: null }, { repoUrl: 'ftp://example.org/repo' },
      { repoUrl: 'javascript:alert(1)' }, { reportUrl: '/relative.pdf' }, { repoUrl: 'https://' },
      { repoUrl: 'https://example.org/' + 'a'.repeat(2049) }, { releaseTag: '' },
      { releaseTag: 'has space' }, { releaseTag: 'control\u0000' }, { releaseTag: 'v'.repeat(129) },
      { notes: 'n'.repeat(10001) }, { notes: null }, { expectedVersion: '0' },
      { expectedVersion: -1 }, { expectedVersion: 0.5 }, { score: 100 }, { submittedAt: deadline.toISOString() },
      { isLate: false }, { lateStatus: 'ON_TIME' }, { dueDateSnapshot: deadline.toISOString() },
    ];
    for (const change of invalid) {
      const rejected = await put({ ...body(), ...change });
      expect(rejected.status, JSON.stringify(change)).toBe(400);
      expect(rejected.body.code).toBe('VALIDATION_ERROR');
    }
    expect((await put([])).status).toBe(400);
    const missing = body() as Record<string, unknown>;
    delete missing.expectedVersion;
    expect((await put(missing)).status).toBe(400);
    expect(await prisma.milestoneSubmission.count()).toBe(0);
    const prefix = 'https://example.org/';
    const accepted = await put({ ...body(), repoUrl: prefix + 'a'.repeat(2048 - prefix.length),
      reportUrl: prefix + 'r'.repeat(2048 - prefix.length), releaseTag: 'v'.repeat(128), notes: 'n'.repeat(10000) });
    expect(accepted.status).toBe(201);
  });

  it.each([-1, 0, 1])('S2-F05-T05/AC05: deadline %+i ms captures server time and consistent lateness', async offset => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(deadline.getTime() + offset));
    try {
      // The simulated deadline is days after fixture setup. Issue the real
      // session at the simulated time instead of using an expired 8h JWT.
      const saved = await put(body(), signAuthToken(fixture.pawarit));
      expect(saved.status).toBe(201);
      expect(saved.body.submission.submittedAt).toBe(new Date(deadline.getTime() + offset).toISOString());
      expect(saved.body.submission.dueDateSnapshot).toBe(deadline.toISOString());
      expect(saved.body.submission.lateStatus).toBe(offset > 0 ? 'LATE' : 'ON_TIME');
    } finally { vi.useRealTimers(); }
  });

  it('S2-F05-T06/AC06: resubmission retains immutable content/legacy grading and creates ungraded current version', async () => {
    const first = await put();
    expect(first.status).toBe(201);
    const submissionId = first.body.submission.id;
    await prisma.milestoneSubmission.update({ where: { id: submissionId }, data: { score: 75, feedback: 'Historical legacy feedback' } });
    const second = await put({ ...body(1), releaseTag: 'v2.0.1', notes: 'Updated content' });
    expect(second.status).toBe(200);
    expect(second.body.submission).toMatchObject({ id: submissionId, version: 2, releaseTag: 'v2.0.1', publishedEvaluation: null });
    const current = await prisma.milestoneSubmission.findUniqueOrThrow({ where: { id: submissionId } });
    expect(current.score).toBeNull();
    expect(current.feedback).toBeNull();
    const history = await get(instructor, fixture.teamAlpha.id, '/versions?limit=1');
    expect(history.body.versions[0]).toMatchObject({ version: 1, releaseTag: 'v2.0.0', notes: 'Reviewed milestone deliverable.',
      legacyEvaluation: { score: 75, feedback: 'Historical legacy feedback', publicationStatus: 'UNKNOWN' }, publishedEvaluation: null });
    expect(history.body.nextAfterId).toBeTypeOf('number');
    const next = await get(student, fixture.teamAlpha.id, `/versions?afterId=${history.body.nextAfterId}`);
    expect(next.body.versions).toHaveLength(1);
    expect(next.body.versions[0].version).toBe(2);
    const studentHistory = await get(student, fixture.teamAlpha.id, '/versions');
    expect(JSON.stringify(studentHistory.body)).not.toContain('Historical legacy feedback');
  });

  it('S2-F05-T07/AC07: enforces backend roles/ownership and no private response on denial', async () => {
    expect((await put()).status).toBe(201);
    for (const suffix of ['', '/versions']) {
      expect((await request(app).get(path() + suffix)).status).toBe(401);
      const denied = await get(foreign, fixture.teamAlpha.id, suffix);
      expect(denied.status).toBe(403);
      expect(JSON.stringify(denied.body)).not.toContain('example.org');
    }
    expect((await request(app).put(path()).send(body())).status).toBe(401);
    expect((await put(body(1), instructor)).status).toBe(403);
    expect((await put(body(1), foreign)).status).toBe(403);
    const listPath = `/api/courses/${fixture.course.id}/milestones/${milestoneId}/submissions`;
    expect((await request(app).get(listPath).set('Authorization', `Bearer ${student}`)).status).toBe(403);
    const listing = await request(app).get(listPath).set('Authorization', `Bearer ${instructor}`);
    expect(listing.status).toBe(200);
    expect(listing.body.submissions).toHaveLength(1);
    expect(await prisma.submissionVersion.count()).toBe(1);
  });

  it('S2-F05-T08/AC08: concurrent create/update and stale retries produce one winner per version', async () => {
    const create = await Promise.all([put(), put()]);
    expect(create.map(r => r.status).sort()).toEqual([201, 409]);
    const update = await Promise.all([put({ ...body(1), releaseTag: 'winner-a' }), put({ ...body(1), releaseTag: 'winner-b' })]);
    expect(update.map(r => r.status).sort()).toEqual([200, 409]);
    const stale = await put(body(1));
    expect(stale.status).toBe(409);
    expect(stale.body.code).toBe('SUBMISSION_VERSION_CONFLICT');
    expect(await prisma.milestoneSubmission.count()).toBe(1);
    expect((await prisma.submissionVersion.findMany({ orderBy: { version: 'asc' } })).map(v => v.version)).toEqual([1, 2]);
  });

  it('S2-F05-T09/AC09: deadline edits preserve prior snapshot and new writes use the new locked deadline', async () => {
    const first = await put();
    expect(first.status).toBe(201);
    const edit = await request(app).put(`/api/milestones/${milestoneId}`).set('Authorization', `Bearer ${instructor}`)
      .send({ expectedVersion: 1, dueDate: '2020-01-01T00:00:00Z' });
    expect(edit.status).toBe(200);
    const second = await put({ ...body(1), releaseTag: 'after-deadline-edit' });
    expect(second.status).toBe(200);
    expect(second.body.submission).toMatchObject({ lateStatus: 'LATE', dueDateSnapshot: '2020-01-01T00:00:00.000Z' });
    const history = await get();
    expect(history.body.submission.version).toBe(2);
    const versions = await get(student, fixture.teamAlpha.id, '/versions');
    expect(versions.body.versions[0].dueDateSnapshot).toBe(deadline.toISOString());
    expect(versions.body.versions[0].lateStatus).toBe('ON_TIME');
  });
});
