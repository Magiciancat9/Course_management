import { assertDisposableTestDatabase } from './helpers/disposableDatabase';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { seedDatabase } from '../prisma/seed';
import { clearRevokedTokens, signAuthToken } from '../src/middleware/auth';

describe('F-06 Instructor Grading, Publication & Private Feedback — Integration Suite (S2-F06-T01 to T08, T11)', () => {
  let seeded: Awaited<ReturnType<typeof seedDatabase>>;
  let instructorToken: string;
  let instructor2Token: string;
  let studentAToken: string;
  let studentBToken: string;
  let milestoneId: number;
  let submissionId: number;

  const submitV1Body = {
    expectedVersion: 0,
    repoUrl: 'https://github.com/example/team-alpha-sprint2',
    reportUrl: 'https://example.org/reports/team-alpha-v1.pdf',
    releaseTag: 'v1.0.0',
    notes: 'Initial Sprint 2 submission.',
  };

  const submitV2Body = {
    expectedVersion: 1,
    repoUrl: 'https://github.com/example/team-alpha-sprint2',
    reportUrl: 'https://example.org/reports/team-alpha-v2.pdf',
    releaseTag: 'v2.0.0',
    notes: 'Updated Sprint 2 submission.',
  };

  beforeEach(async () => {
    assertDisposableTestDatabase();
    await clearRevokedTokens();
    seeded = await seedDatabase(prisma);

    const instructor2 = await prisma.user.create({
      data: {
        email: 'instructor2@kmutt.ac.th',
        fullName: 'Dr. Second Reviewer',
        passwordHash: seeded.instructor.passwordHash,
        role: 'INSTRUCTOR',
      },
    });

    instructorToken = signAuthToken(seeded.instructor);
    instructor2Token = signAuthToken(instructor2);
    studentAToken = signAuthToken(seeded.pawarit);
    studentBToken = signAuthToken(seeded.somchai);

    await prisma.projectProposal.update({
      where: { teamId: seeded.teamAlpha.id },
      data: { status: 'APPROVED' },
    });

    const milestone = await prisma.milestone.create({
      data: {
        courseId: seeded.course.id,
        title: 'Sprint 2 Graded Milestone',
        description: 'Milestone for F-06 grading verification.',
        dueDate: new Date('2026-11-29T16:59:00.000Z'),
        weightPercent: 30,
        status: 'PUBLISHED',
        publishedAt: new Date('2026-11-25T00:00:00.000Z'),
      },
    });
    milestoneId = milestone.id;

    const subRes = await request(app)
      .put(`/api/teams/${seeded.teamAlpha.id}/milestones/${milestoneId}/submission`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send(submitV1Body);
    expect(subRes.status).toBe(201);
    submissionId = subRes.body.submission.id as number;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('S2-F06-T01 (S2-F06-AC01): instructor saves a valid draft evaluation of current submitted content and retrieves it while student still sees null', async () => {
    const saveRes = await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 0,
        score: 75,
        feedback: '  Solid architecture and test coverage.  ',
      });

    expect(saveRes.status).toBe(201);
    expect(saveRes.headers['cache-control']).toBe('no-store');
    expect(saveRes.body.evaluation).toMatchObject({
      submissionId,
      submissionVersion: 1,
      version: 1,
      draftRevision: 1,
      publishedDraftRevision: null,
      draft: {
        score: 75,
        feedback: 'Solid architecture and test coverage.',
        draftRevision: 1,
      },
      published: null,
      publications: [],
    });

    // Instructor independent GET retrieves persisted draft
    const instrGet = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(instrGet.status).toBe(200);
    expect(instrGet.body.evaluation.draft).toMatchObject({
      score: 75,
      feedback: 'Solid architecture and test coverage.',
      draftRevision: 1,
    });

    // Direct DB verification
    const rows = await prisma.$queryRaw<Array<{ score: number; feedback: string; version: number; draftRevision: number }>>`
      SELECT "score", "feedback", "version", "draftRevision"
      FROM "SubmissionEvaluation"
      WHERE "submissionId" = ${submissionId} AND "submissionVersion" = 1
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      score: 75,
      feedback: 'Solid architecture and test coverage.',
      version: 1,
      draftRevision: 1,
    });

    // Owning student still sees null (no draft leak)
    const stuGet = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(stuGet.status).toBe(200);
    expect(stuGet.body.evaluation).toBeNull();
    expect(JSON.stringify(stuGet.body)).not.toContain('Solid architecture');
  });

  it('S2-F06-T02 (S2-F06-AC02): accepts score boundaries 0 and 100 and rejects out-of-range/fraction/string/null without mutation', async () => {
    for (const invalidScore of [-1, 101, 1.5, '80', null, undefined, true]) {
      const badRes = await request(app)
        .put(`/api/submissions/${submissionId}/evaluation`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          submissionVersion: 1,
          expectedVersion: 0,
          score: invalidScore,
          feedback: 'Valid feedback',
        });
      expect(badRes.status).toBe(400);
      expect(badRes.body.code).toBe('VALIDATION_ERROR');
    }

    const zeroRes = await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 0,
        score: 0,
        feedback: 'Zero score boundary check.',
      });
    expect(zeroRes.status).toBe(201);
    expect(zeroRes.body.evaluation.draft.score).toBe(0);

    const hundredRes = await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 1,
        score: 100,
        feedback: 'Full score boundary check.',
      });
    expect(hundredRes.status).toBe(200);
    expect(hundredRes.body.evaluation.draft.score).toBe(100);
    expect(hundredRes.body.evaluation.version).toBe(2);

    // Rejected write after valid draft preserves version 2 and score 100
    const afterBad = await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 2,
        score: 105,
        feedback: 'Should not overwrite 100.',
      });
    expect(afterBad.status).toBe(400);

    const checkGet = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(checkGet.body.evaluation.draft.score).toBe(100);
    expect(checkGet.body.evaluation.version).toBe(2);
  });

  it('S2-F06-T03 (S2-F06-AC03): enforces feedback trim/type/length (1..2000) and rejects unknown payload keys', async () => {
    for (const badBody of [
      { submissionVersion: 1, expectedVersion: 0, score: 80, feedback: '' },
      { submissionVersion: 1, expectedVersion: 0, score: 80, feedback: '   ' },
      { submissionVersion: 1, expectedVersion: 0, score: 80, feedback: 'x'.repeat(2001) },
      { submissionVersion: 1, expectedVersion: 0, score: 80, feedback: 123 },
      { submissionVersion: 1, expectedVersion: 0, score: 80, feedback: null },
      {
        submissionVersion: 1,
        expectedVersion: 0,
        score: 80,
        feedback: 'Valid',
        publishedById: 999,
      },
    ]) {
      const res = await request(app)
        .put(`/api/submissions/${submissionId}/evaluation`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(badBody);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    }

    // Exact 1-char and 2000-char feedback boundaries pass
    const minFb = await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 0,
        score: 80,
        feedback: '  A  ',
      });
    expect(minFb.status).toBe(201);
    expect(minFb.body.evaluation.draft.feedback).toBe('A');

    const maxFb = await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 1,
        score: 85,
        feedback: 'F'.repeat(2000),
      });
    expect(maxFb.status).toBe(200);
    expect(maxFb.body.evaluation.draft.feedback).toHaveLength(2000);
  });

  it('S2-F06-T04 (S2-F06-AC04): explicit publication persists version, score, feedback, actor and time; duplicate/stale publish rejected with 409', async () => {
    const fixedNow = new Date('2026-11-26T09:30:00.000Z');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(fixedNow);
    const timedInstructorToken = signAuthToken(seeded.instructor);

    try {
      await request(app)
        .put(`/api/submissions/${submissionId}/evaluation`)
        .set('Authorization', `Bearer ${timedInstructorToken}`)
        .send({
          submissionVersion: 1,
          expectedVersion: 0,
          score: 88,
          feedback: 'Published rubric evaluation for Sprint 2.',
        });

      const pubRes = await request(app)
        .post(`/api/submissions/${submissionId}/evaluation/publish`)
        .set('Authorization', `Bearer ${timedInstructorToken}`)
        .send({ submissionVersion: 1, expectedVersion: 1 });

      expect(pubRes.status).toBe(200);
      expect(pubRes.body.evaluation).toMatchObject({
        submissionId,
        submissionVersion: 1,
        version: 2,
        draftRevision: 1,
        publishedDraftRevision: 1,
        published: {
          score: 88,
          feedback: 'Published rubric evaluation for Sprint 2.',
          submissionVersion: 1,
          draftRevision: 1,
          publishedAt: fixedNow.toISOString(),
          publishedBy: {
            id: seeded.instructor.id,
            email: seeded.instructor.email,
          },
        },
      });

      // Stale expectedVersion (1) -> 409 GRADE_VERSION_CONFLICT
      const stalePub = await request(app)
        .post(`/api/submissions/${submissionId}/evaluation/publish`)
        .set('Authorization', `Bearer ${timedInstructorToken}`)
        .send({ submissionVersion: 1, expectedVersion: 1 });
      expect(stalePub.status).toBe(409);
      expect(stalePub.body.code).toBe('GRADE_VERSION_CONFLICT');

      // Duplicate publish with current version (2) but unchanged draft -> 409 GRADE_ALREADY_PUBLISHED
      const dupPub = await request(app)
        .post(`/api/submissions/${submissionId}/evaluation/publish`)
        .set('Authorization', `Bearer ${timedInstructorToken}`)
        .send({ submissionVersion: 1, expectedVersion: 2 });
      expect(dupPub.status).toBe(409);
      expect(dupPub.body.code).toBe('GRADE_ALREADY_PUBLISHED');

      const pubCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM "GradePublication"
      `;
      expect(Number(pubCount[0].count)).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('S2-F06-T05 (S2-F06-AC05): enforces anonymous 401, student write 403, foreign-team read 403, and no draft leakage', async () => {
    const secretDraftText = 'PRIVATE_DRAFT_NOTE_DO_NOT_LEAK_TO_STUDENTS';
    await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 0,
        score: 65,
        feedback: secretDraftText,
      });

    // Anonymous -> 401
    expect(
      (await request(app).get(`/api/submissions/${submissionId}/evaluation`)).status
    ).toBe(401);
    expect(
      (await request(app).put(`/api/submissions/${submissionId}/evaluation`).send({})).status
    ).toBe(401);
    expect(
      (
        await request(app)
          .post(`/api/submissions/${submissionId}/evaluation/publish`)
          .send({})
      ).status
    ).toBe(401);

    // Student PUT / publish -> 403 INSTRUCTOR_ROLE_REQUIRED
    const stuPut = await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({ submissionVersion: 1, expectedVersion: 1, score: 100, feedback: 'Self grade' });
    expect(stuPut.status).toBe(403);
    expect(stuPut.body.code).toBe('INSTRUCTOR_ROLE_REQUIRED');

    const stuPub = await request(app)
      .post(`/api/submissions/${submissionId}/evaluation/publish`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send({ submissionVersion: 1, expectedVersion: 1 });
    expect(stuPub.status).toBe(403);
    expect(stuPub.body.code).toBe('INSTRUCTOR_ROLE_REQUIRED');

    // Foreign team student GET -> 403 BR06_FORBIDDEN_TEAM_ACCESS
    const foreignGet = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(foreignGet.status).toBe(403);
    expect(foreignGet.body.code).toBe('BR06_FORBIDDEN_TEAM_ACCESS');
    expect(JSON.stringify(foreignGet.body)).not.toContain(secretDraftText);

    // Owning student GET before publish -> null, no secretDraftText
    const ownBeforePub = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(ownBeforePub.status).toBe(200);
    expect(ownBeforePub.body.evaluation).toBeNull();
    expect(JSON.stringify(ownBeforePub.body)).not.toContain(secretDraftText);
  });

  it('S2-F06-T06 (S2-F06-AC06): correction draft preserves previous publication for students until republished and retains immutable publication history', async () => {
    // 1. Save draft 1 (score 70) -> version 1, draftRevision 1
    await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 0,
        score: 70,
        feedback: 'Initial published feedback (70).',
      });

    // 2. Publish draft 1 -> version 2, publishedDraftRevision 1
    const pub1 = await request(app)
      .post(`/api/submissions/${submissionId}/evaluation/publish`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ submissionVersion: 1, expectedVersion: 1 });
    expect(pub1.status).toBe(200);

    // 3. Save correction draft 2 (score 80, secret correction note) without publishing -> version 3, draftRevision 2
    const corrDraft = await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 2,
        score: 80,
        feedback: 'Unpublished correction draft (80).',
      });
    expect(corrDraft.status).toBe(200);
    expect(corrDraft.body.evaluation).toMatchObject({
      version: 3,
      draftRevision: 2,
      publishedDraftRevision: 1,
    });

    // Owning student still sees 70, NOT 80
    const stuWhileDraft = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(stuWhileDraft.status).toBe(200);
    expect(stuWhileDraft.body.evaluation).toMatchObject({
      score: 70,
      feedback: 'Initial published feedback (70).',
      draftRevision: 1,
    });
    expect(JSON.stringify(stuWhileDraft.body)).not.toContain('Unpublished correction draft');

    // 4. Publish correction draft 2 -> version 4, publishedDraftRevision 2
    const pub2 = await request(app)
      .post(`/api/submissions/${submissionId}/evaluation/publish`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ submissionVersion: 1, expectedVersion: 3 });
    expect(pub2.status).toBe(200);
    expect(pub2.body.evaluation.version).toBe(4);
    expect(pub2.body.evaluation.publications).toHaveLength(2);
    expect(pub2.body.evaluation.publications.map((p: { score: number }) => p.score)).toEqual([
      70, 80,
    ]);

    // Owning student now sees 80
    const stuAfterRepub = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(stuAfterRepub.status).toBe(200);
    expect(stuAfterRepub.body.evaluation).toMatchObject({
      score: 80,
      feedback: 'Unpublished correction draft (80).',
      draftRevision: 2,
    });
  });

  it('S2-F06-T07 (S2-F06-AC07): new submission version v2 is ungraded, rejects stale v1 grading/publication with 409, and preserves v1 published grade in history', async () => {
    // Save and publish grade for v1
    await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 0,
        score: 82,
        feedback: 'Grade for v1 submission.',
      });
    await request(app)
      .post(`/api/submissions/${submissionId}/evaluation/publish`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ submissionVersion: 1, expectedVersion: 1 });

    // Student submits v2
    const v2Res = await request(app)
      .put(`/api/teams/${seeded.teamAlpha.id}/milestones/${milestoneId}/submission`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send(submitV2Body);
    expect(v2Res.status).toBe(200);
    expect(v2Res.body.submission.version).toBe(2);
    expect(v2Res.body.submission.publishedEvaluation).toBeNull();

    // Current evaluation (defaults to v2) is null for both student and instructor
    const stuCurrent = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(stuCurrent.status).toBe(200);
    expect(stuCurrent.body.evaluation).toBeNull();

    // Historical v1 grade remains inspectable via ?submissionVersion=1 and /submission/versions
    const stuV1 = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation?submissionVersion=1`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(stuV1.status).toBe(200);
    expect(stuV1.body.evaluation).toMatchObject({
      submissionVersion: 1,
      score: 82,
      feedback: 'Grade for v1 submission.',
    });

    const versionsRes = await request(app)
      .get(`/api/teams/${seeded.teamAlpha.id}/milestones/${milestoneId}/submission/versions`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(versionsRes.status).toBe(200);
    expect(versionsRes.body.versions[0].publishedEvaluation).toMatchObject({
      score: 82,
      feedback: 'Grade for v1 submission.',
    });
    expect(versionsRes.body.versions[1].publishedEvaluation).toBeNull();

    // Attempting to save or publish a draft for superseded v1 returns 409 STALE_SUBMISSION_VERSION
    const staleDraft = await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 1,
        expectedVersion: 2,
        score: 90,
        feedback: 'Stale v1 edit after v2 exists.',
      });
    expect(staleDraft.status).toBe(409);
    expect(staleDraft.body.code).toBe('STALE_SUBMISSION_VERSION');

    const stalePub = await request(app)
      .post(`/api/submissions/${submissionId}/evaluation/publish`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ submissionVersion: 1, expectedVersion: 2 });
    expect(stalePub.status).toBe(409);
    expect(stalePub.body.code).toBe('STALE_SUBMISSION_VERSION');
  });

  it('S2-F06-T08 (S2-F06-AC07): concurrent I1/I2 draft/publish writes and publish racing F-05 content update never double-publish or attach v1 grade to v2', async () => {
    // 1. Concurrent initial draft creation with expectedVersion 0 -> one 201, one 409
    const [d1, d2] = await Promise.all([
      request(app)
        .put(`/api/submissions/${submissionId}/evaluation`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ submissionVersion: 1, expectedVersion: 0, score: 75, feedback: 'Instructor 1 draft' }),
      request(app)
        .put(`/api/submissions/${submissionId}/evaluation`)
        .set('Authorization', `Bearer ${instructor2Token}`)
        .send({ submissionVersion: 1, expectedVersion: 0, score: 85, feedback: 'Instructor 2 draft' }),
    ]);
    expect([d1.status, d2.status].sort()).toEqual([201, 409]);

    // 2. Concurrent publish of v1 with expectedVersion 1 racing F-05 v2 submission
    const [pubA, pubB, subV2] = await Promise.all([
      request(app)
        .post(`/api/submissions/${submissionId}/evaluation/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ submissionVersion: 1, expectedVersion: 1 }),
      request(app)
        .post(`/api/submissions/${submissionId}/evaluation/publish`)
        .set('Authorization', `Bearer ${instructor2Token}`)
        .send({ submissionVersion: 1, expectedVersion: 1 }),
      request(app)
        .put(`/api/teams/${seeded.teamAlpha.id}/milestones/${milestoneId}/submission`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send(submitV2Body),
    ]);

    expect(subV2.status).toBe(200);
    // At most one publish can win (if serialized before subV2) or both 409 (if serialized after subV2)
    const pubStatuses = [pubA.status, pubB.status].sort();
    expect([
      [200, 409],
      [409, 409],
    ]).toContainEqual(pubStatuses);

    // Under no ordering may v2 inherit the v1 grade!
    const currentV2Eval = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(currentV2Eval.status).toBe(200);
    expect(currentV2Eval.body.evaluation).toBeNull();
  });

  it('S2-F06-T11 (S2-F06-AC09): preserves legacy score/feedback without inventing a publication, then reads back new published v2 evaluation accurately', async () => {
    // Simulate a legacy score/feedback on v1 without any SubmissionEvaluation/GradePublication
    await prisma.milestoneSubmission.update({
      where: { id: submissionId },
      data: { score: 77, feedback: 'Legacy unverified score' },
    });
    await prisma.submissionVersion.update({
      where: { submissionId_version: { submissionId, version: 1 } },
      data: { legacyScore: 77, legacyFeedback: 'Legacy unverified score' },
    });

    // Student does NOT receive legacy score as a published evaluation
    const stuLegacy = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(stuLegacy.status).toBe(200);
    expect(stuLegacy.body.evaluation).toBeNull();

    // Student submits v2; instructor grades and publishes v2
    await request(app)
      .put(`/api/teams/${seeded.teamAlpha.id}/milestones/${milestoneId}/submission`)
      .set('Authorization', `Bearer ${studentAToken}`)
      .send(submitV2Body);

    await request(app)
      .put(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        submissionVersion: 2,
        expectedVersion: 0,
        score: 94,
        feedback: 'Verified v2 published evaluation.',
      });
    const pubV2 = await request(app)
      .post(`/api/submissions/${submissionId}/evaluation/publish`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ submissionVersion: 2, expectedVersion: 1 });
    expect(pubV2.status).toBe(200);

    // Student now sees published v2 evaluation on both /evaluation and F-05 /submission
    const stuV2Eval = await request(app)
      .get(`/api/submissions/${submissionId}/evaluation`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(stuV2Eval.status).toBe(200);
    expect(stuV2Eval.body.evaluation).toMatchObject({
      submissionVersion: 2,
      score: 94,
      feedback: 'Verified v2 published evaluation.',
    });

    const f05Readback = await request(app)
      .get(`/api/teams/${seeded.teamAlpha.id}/milestones/${milestoneId}/submission`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(f05Readback.status).toBe(200);
    expect(f05Readback.body.submission.publishedEvaluation).toMatchObject({
      score: 94,
      feedback: 'Verified v2 published evaluation.',
      submissionVersion: 2,
    });
  });
});
