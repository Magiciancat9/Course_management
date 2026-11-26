import { expect, test, type Page } from '@playwright/test';
import { PrismaClient } from '../server/node_modules/@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { assertDisposableTestDatabase } from '../server/tests/helpers/disposableDatabase';

const root = path.resolve(__dirname, '..');
const password = process.env.DEMO_USER_PASSWORD || 'Password123!';

async function login(page: Page, email: string) {
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('current-user-info')).toContainText(email);
}

async function logout(page: Page) {
  await page.getByTestId('logout-btn').click();
  await expect(page.getByTestId('login-submit')).toBeVisible();
}

test('S3-F08-T12 (S3-F08-AC10): instructor analytics dashboard and CSV export reconcile with persisted F-03..F-06 data while denying student access', async ({
  page,
  request,
}) => {
  assertDisposableTestDatabase();
  execSync('npm --prefix server run prisma:seed', { cwd: root, stdio: 'pipe' });

  const db = new PrismaClient();
  let courseId: number;
  let m1Id: number;
  let m2Id: number;
  let subM2Id: number;

  try {
    const course = await db.course.findFirstOrThrow({ where: { code: 'CPE334' } });
    courseId = course.id;
    const teamAlpha = await db.projectTeam.findFirstOrThrow({ where: { courseId, name: 'Team Alpha' } });
    const teamBeta = await db.projectTeam.findFirstOrThrow({ where: { courseId, name: 'Team Beta' } });
    const instructor = await db.user.findUniqueOrThrow({ where: { email: 'instructor@kmutt.ac.th' } });
    const suda = await db.user.findUniqueOrThrow({ where: { email: 'suda@mail.kmutt.ac.th' } });

    await db.projectProposal.update({ where: { teamId: teamAlpha.id }, data: { status: 'APPROVED' } });
    await db.projectProposal.update({
      where: { teamId: teamBeta.id },
      data: {
        status: 'REVISION_REQUESTED',
        reviewFeedback: 'Please expand the calibration workflow requirements.',
      },
    });
    // Team Gamma with NONE proposal state
    await db.projectTeam.create({
      data: { name: 'Team Gamma', courseId, createdById: suda.id },
    });

    const m1 = await db.milestone.create({
      data: {
        courseId,
        title: 'M1 Baseline Architecture',
        description: 'Past-due published milestone',
        dueDate: new Date(Date.now() - 3600000),
        weightPercent: 30,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 7200000),
      },
    });
    m1Id = m1.id;

    const m2 = await db.milestone.create({
      data: {
        courseId,
        title: 'M2 Release Candidate',
        description: 'Future-due published milestone',
        dueDate: new Date(Date.now() + 86400000),
        weightPercent: 40,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 7200000),
      },
    });
    m2Id = m2.id;

    // Team Alpha on M1: v1 with legitimate published score 0
    const subM1 = await db.milestoneSubmission.create({
      data: {
        milestoneId: m1.id,
        teamId: teamAlpha.id,
        version: 1,
        artifactUrl: 'https://example.org/alpha-m1',
        reportUrl: 'https://example.org/alpha-m1-report',
        releaseTag: 'm1-v1',
        submittedAt: new Date(Date.now() - 4000000),
        dueDateSnapshot: m1.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    await db.submissionVersion.create({
      data: {
        submissionId: subM1.id,
        version: 1,
        repoUrl: 'https://example.org/alpha-m1',
        reportUrl: 'https://example.org/alpha-m1-report',
        releaseTag: 'm1-v1',
        submittedAt: new Date(Date.now() - 4000000),
        dueDateSnapshot: m1.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    const evalM1 = await db.submissionEvaluation.create({
      data: {
        submissionId: subM1.id,
        submissionVersion: 1,
        score: 0,
        feedback: 'Published zero score on M1',
        version: 2,
        draftRevision: 1,
        publishedDraftRevision: 1,
        updatedById: instructor.id,
      },
    });
    await db.gradePublication.create({
      data: {
        evaluationId: evalM1.id,
        submissionId: subM1.id,
        submissionVersion: 1,
        draftRevision: 1,
        score: 0,
        feedback: 'Published zero score on M1',
        publishedById: instructor.id,
      },
    });

    // Team Alpha on M2: v1 published 88, then v2 current with unpublished draft evaluation -> ungraded queue
    const subM2 = await db.milestoneSubmission.create({
      data: {
        milestoneId: m2.id,
        teamId: teamAlpha.id,
        version: 2,
        artifactUrl: 'https://example.org/alpha-m2-v2',
        reportUrl: 'https://example.org/alpha-m2-report-v2',
        releaseTag: 'm2-v2',
        submittedAt: new Date(Date.now() - 60000),
        dueDateSnapshot: m2.dueDate,
        lateStatus: 'ON_TIME',
      },
    });
    subM2Id = subM2.id;
    await db.submissionVersion.createMany({
      data: [
        {
          submissionId: subM2.id,
          version: 1,
          repoUrl: 'https://example.org/alpha-m2-v1',
          reportUrl: 'https://example.org/alpha-m2-report-v1',
          releaseTag: 'm2-v1',
          submittedAt: new Date(Date.now() - 120000),
          dueDateSnapshot: m2.dueDate,
          lateStatus: 'ON_TIME',
        },
        {
          submissionId: subM2.id,
          version: 2,
          repoUrl: 'https://example.org/alpha-m2-v2',
          reportUrl: 'https://example.org/alpha-m2-report-v2',
          releaseTag: 'm2-v2',
          submittedAt: new Date(Date.now() - 60000),
          dueDateSnapshot: m2.dueDate,
          lateStatus: 'ON_TIME',
        },
      ],
    });
    const evalM2V1 = await db.submissionEvaluation.create({
      data: {
        submissionId: subM2.id,
        submissionVersion: 1,
        score: 88,
        feedback: 'Superseded v1 published grade',
        version: 2,
        draftRevision: 1,
        publishedDraftRevision: 1,
        updatedById: instructor.id,
      },
    });
    await db.gradePublication.create({
      data: {
        evaluationId: evalM2V1.id,
        submissionId: subM2.id,
        submissionVersion: 1,
        draftRevision: 1,
        score: 88,
        feedback: 'Superseded v1 published grade',
        publishedById: instructor.id,
      },
    });
    await db.submissionEvaluation.create({
      data: {
        submissionId: subM2.id,
        submissionVersion: 2,
        score: 94,
        feedback: 'Unpublished v2 draft evaluation',
        version: 1,
        draftRevision: 1,
        updatedById: instructor.id,
      },
    });
  } finally {
    await db.$disconnect();
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  // 1) Student cannot see analytics UI and is denied by backend on both JSON and CSV routes
  await login(page, 'pawarit@mail.kmutt.ac.th');
  await expect(page.getByTestId('analytics-dashboard')).toHaveCount(0);
  const studentToken = await page.evaluate(() => localStorage.getItem('course_pms_token'));
  const stuHeaders = { Authorization: `Bearer ${studentToken}` };
  const stuAnalytics = await request.get(`/api/courses/${courseId}/analytics`, { headers: stuHeaders });
  expect(stuAnalytics.status()).toBe(403);
  const stuCsv = await request.get(`/api/courses/${courseId}/gradebook.csv`, { headers: stuHeaders });
  expect(stuCsv.status()).toBe(403);

  await logout(page);

  // 2) Instructor views analytics dashboard, reloads, and exports CSV gradebook
  await login(page, 'instructor@kmutt.ac.th');
  await page.getByRole('button', { name: 'Analytics & Export', exact: true }).click();

  const dashboard = page.getByTestId('analytics-dashboard');
  await expect(dashboard.getByTestId('analytics-total-teams')).toHaveText('3');
  await expect(dashboard.getByTestId('analytics-published-milestones')).toHaveText('2');
  await expect(dashboard.getByTestId('analytics-submitted-deliverables')).toHaveText('2');
  await expect(dashboard.getByTestId('analytics-graded-deliverables')).toHaveText('1');
  await expect(dashboard.getByTestId('analytics-ungraded-deliverables')).toHaveText('1');
  await expect(dashboard.getByTestId('analytics-flagged-count')).toHaveText('2');

  await expect(dashboard.getByTestId('proposal-state-NONE')).toHaveText('1');
  await expect(dashboard.getByTestId('proposal-state-APPROVED')).toHaveText('1');
  await expect(dashboard.getByTestId('proposal-state-REVISION_REQUESTED')).toHaveText('1');

  await expect(dashboard.getByTestId(`analytics-milestone-row-${m1Id}`)).toContainText('1 / 3');
  await expect(dashboard.getByTestId(`analytics-milestone-row-${m1Id}`)).toContainText('33.33%');
  await expect(dashboard.getByTestId(`analytics-milestone-row-${m2Id}`)).toContainText('1 / 3');
  await expect(dashboard.getByTestId(`analytics-ungraded-row-${subM2Id}`)).toContainText('v2');
  await expect(dashboard.getByTestId(`analytics-ungraded-row-${subM2Id}`)).toContainText('Draft saved (unpublished)');
  await expect(dashboard.getByTestId('analytics-flagged-teams')).toContainText(
    'REVISION_REQUESTED, OVERDUE_MISSING_SUBMISSION'
  );

  // Reload and verify persisted snapshot + CSV export
  await page.reload();
  await page.getByRole('button', { name: 'Analytics & Export', exact: true }).click();
  await expect(dashboard.getByTestId('analytics-total-teams')).toHaveText('3');

  const downloadPromise = page.waitForEvent('download');
  await dashboard.getByTestId('analytics-export-csv').click();
  const download = await downloadPromise;
  await expect(dashboard.getByTestId('analytics-export-success')).toContainText('Exported gradebook CSV');

  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const downloadedFileBytes = fs.readFileSync(downloadPath!);
  expect(Array.from(downloadedFileBytes.subarray(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
  const downloadedCsvText = downloadedFileBytes.toString('utf8');
  expect(downloadedCsvText.startsWith('\uFEFF')).toBe(true);
  expect(downloadedCsvText).toContain('"M1 Baseline Architecture"');
  expect(downloadedCsvText).toContain('"0"'); // published zero score on M1
  expect(downloadedCsvText).not.toContain('"88"'); // superseded v1 grade on M2 excluded
  expect(downloadedCsvText).not.toContain('"94"'); // unpublished v2 draft on M2 excluded

  const instToken = await page.evaluate(() => localStorage.getItem('course_pms_token'));
  const csvRes = await request.get(`/api/courses/${courseId}/gradebook.csv`, {
    headers: { Authorization: `Bearer ${instToken}` },
  });
  expect(csvRes.status()).toBe(200);
  const csvBody = await csvRes.text();
  expect(csvBody.startsWith('\uFEFF')).toBe(true);
  expect(csvBody).toContain('"M1 Baseline Architecture"');
  expect(csvBody).toContain('"0"'); // published zero score on M1
  expect(csvBody).not.toContain('"88"'); // superseded v1 grade on M2 excluded
  expect(csvBody).not.toContain('"94"'); // unpublished v2 draft on M2 excluded

  // Clicking "Grade submission" opens the targeted course/milestone/team submission in GradingConsole
  await dashboard
    .getByTestId(`analytics-ungraded-row-${subM2Id}`)
    .getByRole('button', { name: 'Grade submission' })
    .click();
  await expect(page.getByTestId('submission-workspace')).toContainText('M2 Release Candidate — submissions');
  await expect(page.getByTestId('grading-console')).toContainText('Instructor Grading — Submission v2 (m2-v2)');

  await dashboard.screenshot({ path: path.join(root, 'test-results/f08-analytics-dashboard.png') });
});
