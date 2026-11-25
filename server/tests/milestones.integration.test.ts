import { assertDisposableTestDatabase } from './helpers/disposableDatabase';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { seedDatabase } from '../prisma/seed';
import { clearRevokedTokens } from '../src/middleware/auth';

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Password123!';

async function loginAs(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: DEMO_PASSWORD });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe('F-04 Course Milestone Management — API & DB Integration (S2-F04-T01 to T09)', () => {
  let seeded: Awaited<ReturnType<typeof seedDatabase>>;
  let instructorToken: string;
  let studentToken: string;

  beforeEach(async () => {
    assertDisposableTestDatabase();
    await clearRevokedTokens();
    seeded = await seedDatabase(prisma);
    instructorToken = await loginAs(seeded.instructor.email);
    studentToken = await loginAs(seeded.pawarit.email);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('S2-F04-T01 (S2-F04-AC01): instructor creates a version-1 draft persisted and retrievable by later GET', async () => {
    const createRes = await request(app)
      .post(`/api/courses/${seeded.course.id}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: '  Sprint 2 delivery  ',
        description: '  Submit the reviewed release and report.  ',
        dueDate: '2026-11-29T23:59:00+07:00',
        weightPercent: 20,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.headers['cache-control']).toBe('no-store');
    expect(createRes.body.milestone).toMatchObject({
      courseId: seeded.course.id,
      title: 'Sprint 2 delivery',
      description: 'Submit the reviewed release and report.',
      dueDate: '2026-11-29T16:59:00.000Z',
      weightPercent: 20,
      status: 'DRAFT',
      publishedAt: null,
      version: 1,
    });

    const createdId = createRes.body.milestone.id;
    const getRes = await request(app)
      .get(`/api/milestones/${createdId}`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.headers['cache-control']).toBe('no-store');
    expect(getRes.body.milestone.id).toBe(createdId);
    expect(getRes.body.milestone.version).toBe(1);
    expect(getRes.body.milestone.status).toBe('DRAFT');

    const dbRow = await prisma.milestone.findUnique({ where: { id: createdId } });
    expect(dbRow).not.toBeNull();
    expect(dbRow?.title).toBe('Sprint 2 delivery');
    expect(dbRow?.version).toBe(1);
    expect(dbRow?.status).toBe('DRAFT');
  });

  it('S2-F04-T02 (S2-F04-AC02): validates exact title (3..120) and description (10..5000) boundaries without mutating DB', async () => {
    const courseId = seeded.course.id;

    // Invalid boundaries -> 400
    const invalidPayloads = [
      { title: 'ab', description: 'Valid description 123', dueDate: '2026-11-29T23:59:00Z', weightPercent: 10 },
      { title: '   ab   ', description: 'Valid description 123', dueDate: '2026-11-29T23:59:00Z', weightPercent: 10 },
      { title: 'a'.repeat(121), description: 'Valid description 123', dueDate: '2026-11-29T23:59:00Z', weightPercent: 10 },
      { title: 'Valid Title', description: '123456789', dueDate: '2026-11-29T23:59:00Z', weightPercent: 10 },
      { title: 'Valid Title', description: 'd'.repeat(5001), dueDate: '2026-11-29T23:59:00Z', weightPercent: 10 },
      { title: null, description: 'Valid description 123', dueDate: '2026-11-29T23:59:00Z', weightPercent: 10 },
      { title: 123, description: 'Valid description 123', dueDate: '2026-11-29T23:59:00Z', weightPercent: 10 },
    ];

    for (const payload of invalidPayloads) {
      const res = await request(app)
        .post(`/api/courses/${courseId}/milestones`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(payload);
      expect(res.status).toBe(400);
    }
    expect(await prisma.milestone.count()).toBe(0);

    // Exact valid minima and maxima -> 201
    const minRes = await request(app)
      .post(`/api/courses/${courseId}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'abc',
        description: '1234567890',
        dueDate: '2026-11-29T23:59:00Z',
        weightPercent: 0,
      });
    expect(minRes.status).toBe(201);

    const maxRes = await request(app)
      .post(`/api/courses/${courseId}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 't'.repeat(120),
        description: 'd'.repeat(5000),
        dueDate: '2026-11-29T23:59:00Z',
        weightPercent: 100,
      });
    expect(maxRes.status).toBe(201);
    expect(await prisma.milestone.count()).toBe(2);
  });

  it('S2-F04-T03 (S2-F04-AC02): validates weightPercent (0..100 integer), offset-required dueDate, and rejects unknown writable keys', async () => {
    const courseId = seeded.course.id;
    const badPayloads = [
      { title: 'Valid Title', description: 'Valid description 123', dueDate: '2026-11-29T23:59:00Z', weightPercent: -1 },
      { title: 'Valid Title', description: 'Valid description 123', dueDate: '2026-11-29T23:59:00Z', weightPercent: 101 },
      { title: 'Valid Title', description: 'Valid description 123', dueDate: '2026-11-29T23:59:00Z', weightPercent: 10.5 },
      { title: 'Valid Title', description: 'Valid description 123', dueDate: '2026-11-29T23:59:00Z', weightPercent: '10' },
      { title: 'Valid Title', description: 'Valid description 123', dueDate: '2026-11-29T23:59:00', weightPercent: 10 },
      { title: 'Valid Title', description: 'Valid description 123', dueDate: 'not-a-date', weightPercent: 10 },
      { title: 'Valid Title', description: 'Valid description 123', dueDate: '2026-11-29T23:59:00Z', weightPercent: 10, status: 'PUBLISHED' },
    ];

    for (const payload of badPayloads) {
      const res = await request(app)
        .post(`/api/courses/${courseId}/milestones`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(payload);
      expect(res.status).toBe(400);
    }
    expect(await prisma.milestone.count()).toBe(0);
  });

  it('S2-F04-T04 (S2-F04-AC03): publish requires strictly future dueDate (now-1ms and now fail 400; now+1ms publishes)', async () => {
    const fixedNow = new Date('2026-11-22T00:00:00.000Z');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(fixedNow);

    try {
      // Create draft with past date (now - 1ms) -> allowed for draft
      const createRes = await request(app)
        .post(`/api/courses/${seeded.course.id}/milestones`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Boundary Publish Test',
          description: 'Testing strict future publish boundary.',
          dueDate: new Date(fixedNow.getTime() - 1).toISOString(),
          weightPercent: 25,
        });
      expect(createRes.status).toBe(201);
      const id = createRes.body.milestone.id as number;

      // Publish at now - 1ms -> 400
      const pubMinus1 = await request(app)
        .post(`/api/milestones/${id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ expectedVersion: 1 });
      expect(pubMinus1.status).toBe(400);
      expect(pubMinus1.body.code).toBe('MILESTONE_DUE_DATE_INVALID');

      // Update dueDate to exact now -> publish fails 400
      const editExactNow = await request(app)
        .put(`/api/milestones/${id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ expectedVersion: 1, dueDate: fixedNow.toISOString() });
      expect(editExactNow.status).toBe(200);
      expect(editExactNow.body.milestone.version).toBe(2);

      const pubExactNow = await request(app)
        .post(`/api/milestones/${id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ expectedVersion: 2 });
      expect(pubExactNow.status).toBe(400);
      expect(pubExactNow.body.code).toBe('MILESTONE_DUE_DATE_INVALID');

      // Update dueDate to now + 1ms -> publish succeeds 200
      const editPlus1 = await request(app)
        .put(`/api/milestones/${id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ expectedVersion: 2, dueDate: new Date(fixedNow.getTime() + 1).toISOString() });
      expect(editPlus1.status).toBe(200);
      expect(editPlus1.body.milestone.version).toBe(3);

      const pubPlus1 = await request(app)
        .post(`/api/milestones/${id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ expectedVersion: 3 });
      expect(pubPlus1.status).toBe(200);
      expect(pubPlus1.body.milestone).toMatchObject({
        id,
        status: 'PUBLISHED',
        publishedAt: fixedNow.toISOString(),
        version: 4,
      });

      // Republishing already published milestone -> 409 MILESTONE_ALREADY_PUBLISHED
      const pubAgain = await request(app)
        .post(`/api/milestones/${id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ expectedVersion: 4 });
      expect(pubAgain.status).toBe(409);
      expect(pubAgain.body.code).toBe('MILESTONE_ALREADY_PUBLISHED');
    } finally {
      vi.useRealTimers();
    }
  });

  it('S2-F04-T05 (S2-F04-AC04): editing published milestone retains publishedAt/status and leaves existing submission records untouched', async () => {
    const createRes = await request(app)
      .post(`/api/courses/${seeded.course.id}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Published Milestone',
        description: 'Original published milestone description.',
        dueDate: '2027-01-15T12:00:00Z',
        weightPercent: 30,
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.milestone.id as number;

    const pubRes = await request(app)
      .post(`/api/milestones/${id}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ expectedVersion: 1 });
    expect(pubRes.status).toBe(200);
    const originalPublishedAt = pubRes.body.milestone.publishedAt;

    // Seed an existing submission record linked to this milestone
    const existingSub = await prisma.milestoneSubmission.create({
      data: {
        milestoneId: id,
        teamId: seeded.teamAlpha.id,
        artifactUrl: 'https://github.com/example/repo/releases/tag/v1.0',
        releaseTag: 'v1.0',
        notes: 'Submitted before deadline edit',
      },
    });

    // Instructor corrects published dueDate to a past instant
    const editRes = await request(app)
      .put(`/api/milestones/${id}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        expectedVersion: 2,
        dueDate: '2020-01-01T00:00:00Z',
      });
    expect(editRes.status).toBe(200);
    expect(editRes.body.milestone).toMatchObject({
      id,
      status: 'PUBLISHED',
      publishedAt: originalPublishedAt,
      dueDate: '2020-01-01T00:00:00.000Z',
      weightPercent: 30,
      version: 3,
    });

    const reloadedSub = await prisma.milestoneSubmission.findUnique({
      where: { id: existingSub.id },
    });
    expect(reloadedSub?.submittedAt.toISOString()).toBe(existingSub.submittedAt.toISOString());
    expect(reloadedSub?.releaseTag).toBe('v1.0');
  });

  it('S2-F04-T06 (S2-F04-AC04): rejects missing/wrong/stale expectedVersion and empty-field edits without losing writes', async () => {
    const createRes = await request(app)
      .post(`/api/courses/${seeded.course.id}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Edit Validation Target',
        description: 'Initial description for edit validation.',
        dueDate: '2027-02-01T00:00:00Z',
        weightPercent: 15,
      });
    const id = createRes.body.milestone.id as number;

    const missingVer = await request(app)
      .put(`/api/milestones/${id}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Updated Title' });
    expect(missingVer.status).toBe(400);

    const noFields = await request(app)
      .put(`/api/milestones/${id}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ expectedVersion: 1 });
    expect(noFields.status).toBe(400);

    const staleVer = await request(app)
      .put(`/api/milestones/${id}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ expectedVersion: 99, title: 'Should Conflict' });
    expect(staleVer.status).toBe(409);
    expect(staleVer.body.code).toBe('MILESTONE_VERSION_CONFLICT');

    const partialUpdate = await request(app)
      .put(`/api/milestones/${id}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ expectedVersion: 1, title: 'New Title Only' });
    expect(partialUpdate.status).toBe(200);
    expect(partialUpdate.body.milestone).toMatchObject({
      title: 'New Title Only',
      description: 'Initial description for edit validation.',
      weightPercent: 15,
      version: 2,
    });
  });

  it('S2-F04-T07 (S2-F04-AC05): enforces 401 anonymous, 403 student mutation, and 404 student draft GET', async () => {
    const createRes = await request(app)
      .post(`/api/courses/${seeded.course.id}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Secret Draft Milestone',
        description: 'Students must not discover this draft.',
        dueDate: '2027-03-01T00:00:00Z',
        weightPercent: 40,
      });
    const draftId = createRes.body.milestone.id as number;

    // Anonymous -> 401
    expect((await request(app).get(`/api/courses/${seeded.course.id}/milestones`)).status).toBe(401);
    expect((await request(app).get(`/api/milestones/${draftId}`)).status).toBe(401);
    expect((await request(app).post(`/api/courses/${seeded.course.id}/milestones`).send({})).status).toBe(401);
    expect((await request(app).put(`/api/milestones/${draftId}`).send({})).status).toBe(401);
    expect((await request(app).post(`/api/milestones/${draftId}/publish`).send({})).status).toBe(401);

    // Student mutations -> 403 (authorization precedes validation)
    const stuCreate = await request(app)
      .post(`/api/courses/${seeded.course.id}/milestones`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'x' });
    expect(stuCreate.status).toBe(403);
    expect(stuCreate.body.code).toBe('INSTRUCTOR_ROLE_REQUIRED');

    const stuEdit = await request(app)
      .put(`/api/milestones/${draftId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ expectedVersion: 1, title: 'Hacked' });
    expect(stuEdit.status).toBe(403);

    const stuPub = await request(app)
      .post(`/api/milestones/${draftId}/publish`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ expectedVersion: 1 });
    expect(stuPub.status).toBe(403);

    // Student GET draft -> 404
    const stuGetDraft = await request(app)
      .get(`/api/milestones/${draftId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(stuGetDraft.status).toBe(404);
  });

  it('S2-F04-T08 (S2-F04-AC06): concurrent edit/edit and publish/publish allow only one winner and 409 for loser', async () => {
    const createRes = await request(app)
      .post(`/api/courses/${seeded.course.id}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Concurrency Milestone',
        description: 'Testing optimistic concurrency under barrier.',
        dueDate: '2027-04-01T00:00:00Z',
        weightPercent: 20,
      });
    const id = createRes.body.milestone.id as number;

    const [editA, editB] = await Promise.all([
      request(app)
        .put(`/api/milestones/${id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ expectedVersion: 1, title: 'Concurrent Edit A' }),
      request(app)
        .put(`/api/milestones/${id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ expectedVersion: 1, title: 'Concurrent Edit B' }),
    ]);

    const editStatuses = [editA.status, editB.status].sort();
    expect(editStatuses).toEqual([200, 409]);

    const [pubA, pubB] = await Promise.all([
      request(app)
        .post(`/api/milestones/${id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ expectedVersion: 2 }),
      request(app)
        .post(`/api/milestones/${id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ expectedVersion: 2 }),
    ]);

    const pubStatuses = [pubA.status, pubB.status].sort();
    expect(pubStatuses).toEqual([200, 409]);

    const finalRow = await prisma.milestone.findUnique({ where: { id } });
    expect(finalRow?.version).toBe(3);
    expect(finalRow?.status).toBe('PUBLISHED');
  });

  it('S2-F04-T09 (S2-F04-AC07): lists are course-scoped, published-only for students, paginated, and 200 on empty', async () => {
    const otherCourse = await prisma.course.create({
      data: {
        code: 'CPE999',
        name: 'Other Course',
        term: '1/2026',
        maxTeamSize: 3,
      },
    });

    // Empty course -> 200 []
    const emptyRes = await request(app)
      .get(`/api/courses/${otherCourse.id}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body).toEqual({ milestones: [], nextAfterId: null });

    // Create 2 drafts in seeded.course and publish 1; create 1 published in otherCourse
    const d1 = await request(app)
      .post(`/api/courses/${seeded.course.id}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Draft One', description: 'First milestone description.', dueDate: '2027-05-01T00:00:00Z', weightPercent: 10 });
    const d2 = await request(app)
      .post(`/api/courses/${seeded.course.id}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Published Two', description: 'Second milestone description.', dueDate: '2027-05-02T00:00:00Z', weightPercent: 20 });
    const dOther = await request(app)
      .post(`/api/courses/${otherCourse.id}/milestones`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Other Course Pub', description: 'Other course milestone description.', dueDate: '2027-05-03T00:00:00Z', weightPercent: 30 });

    await request(app)
      .post(`/api/milestones/${d2.body.milestone.id}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ expectedVersion: 1 });
    await request(app)
      .post(`/api/milestones/${dOther.body.milestone.id}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ expectedVersion: 1 });

    // Student sees only published milestone in seeded.course
    const stuList = await request(app)
      .get(`/api/courses/${seeded.course.id}/milestones`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(stuList.status).toBe(200);
    expect(stuList.body.milestones).toHaveLength(1);
    expect(stuList.body.milestones[0].id).toBe(d2.body.milestone.id);

    // Instructor pagination limit=1
    const page1 = await request(app)
      .get(`/api/courses/${seeded.course.id}/milestones?limit=1`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(page1.status).toBe(200);
    expect(page1.body.milestones).toHaveLength(1);
    expect(page1.body.milestones[0].id).toBe(d1.body.milestone.id);
    expect(page1.body.nextAfterId).toBe(d1.body.milestone.id);

    const page2 = await request(app)
      .get(`/api/courses/${seeded.course.id}/milestones?limit=1&afterId=${page1.body.nextAfterId}`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(page2.status).toBe(200);
    expect(page2.body.milestones).toHaveLength(1);
    expect(page2.body.milestones[0].id).toBe(d2.body.milestone.id);
    expect(page2.body.nextAfterId).toBeNull();

    // Invalid paging -> 400
    const badLimit = await request(app)
      .get(`/api/courses/${seeded.course.id}/milestones?limit=0`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(badLimit.status).toBe(400);
  });
});
