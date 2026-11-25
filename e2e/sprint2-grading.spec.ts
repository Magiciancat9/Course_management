import { test, expect, Page } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..');
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Password123!';

async function login(page: Page, email: string) {
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(DEMO_PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('current-user-info')).toContainText(email);
}

async function logout(page: Page) {
  await page.getByTestId('logout-btn').click();
  await expect(page.getByTestId('login-submit')).toBeVisible();
}

test.describe('CoursePMS Sprint 2 — F-06 Grading & Publication E2E (S2-F06-T10)', () => {
  test.beforeEach(() => {
    execSync('npm --prefix server run prisma:seed', {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
  });

  test('S2-F06-T10 (S2-F06-AC09): instructor saves draft (hidden from student), publishes grade, owning student reloads and sees published evaluation, foreign student is denied 403', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1366, height: 860 });

    // 1. Setup prerequisites against real backend API (approve Team Alpha proposal, publish milestone, submit v1)
    const pawaritLogin = await (
      await request.post('/api/auth/login', {
        data: { email: 'pawarit@mail.kmutt.ac.th', password: DEMO_PASSWORD },
      })
    ).json();
    const instrLogin = await (
      await request.post('/api/auth/login', {
        data: { email: 'instructor@kmutt.ac.th', password: DEMO_PASSWORD },
      })
    ).json();
    const somchaiLogin = await (
      await request.post('/api/auth/login', {
        data: { email: 'somchai@mail.kmutt.ac.th', password: DEMO_PASSWORD },
      })
    ).json();

    const teamsData = await (
      await request.get('/api/teams', {
        headers: { Authorization: `Bearer ${pawaritLogin.token}` },
      })
    ).json();
    const teamAlpha = teamsData.teams.find((t: { name: string }) => t.name === 'Team Alpha');

    const subPropRes = await request.post(`/api/teams/${teamAlpha.id}/proposal/submit`, {
      headers: { Authorization: `Bearer ${pawaritLogin.token}` },
    });
    expect(subPropRes.ok()).toBe(true);
    const revPropRes = await request.post(`/api/proposals/${teamAlpha.proposal.id}/review`, {
      headers: { Authorization: `Bearer ${instrLogin.token}` },
      data: {
        decision: 'APPROVED',
        reviewFeedback: 'Approved proposal for Sprint 2 grading workflow.',
      },
    });
    expect(revPropRes.ok()).toBe(true);

    const msCreate = await (
      await request.post(`/api/courses/${teamAlpha.courseId}/milestones`, {
        headers: { Authorization: `Bearer ${instrLogin.token}` },
        data: {
          title: 'Sprint 2 Graded Deliverable',
          description: 'Submit deliverable for instructor rubric evaluation.',
          dueDate: '2027-06-01T23:59:00+07:00',
          weightPercent: 30,
        },
      })
    ).json();
    const milestoneId = msCreate.milestone.id as number;

    await request.post(`/api/milestones/${milestoneId}/publish`, {
      headers: { Authorization: `Bearer ${instrLogin.token}` },
      data: { expectedVersion: 1 },
    });

    const subCreate = await (
      await request.put(`/api/teams/${teamAlpha.id}/milestones/${milestoneId}/submission`, {
        headers: { Authorization: `Bearer ${pawaritLogin.token}` },
        data: {
          expectedVersion: 0,
          repoUrl: 'https://github.com/example/f06-e2e',
          reportUrl: 'https://example.org/f06-report.pdf',
          releaseTag: 'f06-v1',
          notes: 'Deliverable ready for grading.',
        },
      })
    ).json();
    const submissionId = subCreate.submission.id as number;

    // 2. Instructor signs in via UI, saves draft (score 91), verifies draft is not yet published, then clicks Publish grade
    await page.goto('/');
    await login(page, 'instructor@kmutt.ac.th');
    await page.getByTestId(`milestone-submission-btn-${milestoneId}`).click();
    await page.getByTestId(`submission-team-${teamAlpha.id}`).click();

    await expect(page.getByTestId('grading-console')).toBeVisible();
    await page.getByTestId('grading-score-input').fill('91');
    await page
      .getByTestId('grading-feedback-input')
      .fill('Excellent implementation, test coverage, and documentation.');
    await page.getByTestId('grading-save-draft-btn').click();
    await expect(page.getByTestId('grading-success')).toContainText('Not yet published to students');

    // Before publish, owning student API still sees evaluation: null
    const beforePubCheck = await (
      await request.get(`/api/submissions/${submissionId}/evaluation`, {
        headers: { Authorization: `Bearer ${pawaritLogin.token}` },
      })
    ).json();
    expect(beforePubCheck.evaluation).toBeNull();

    // Instructor explicitly publishes grade
    await page.getByTestId('grading-publish-btn').click();
    await expect(page.getByTestId('grading-published-summary')).toContainText('91/100');
    await logout(page);

    // 3. Owning student signs in via UI, opens milestone submission, and reloads to verify persisted published grade
    await login(page, 'pawarit@mail.kmutt.ac.th');
    await page.getByTestId(`milestone-submission-btn-${milestoneId}`).click();
    await expect(page.getByTestId('submission-published-grade').first()).toContainText('91/100');
    await expect(page.getByTestId('submission-published-grade').first()).toContainText(
      'Excellent implementation, test coverage, and documentation.'
    );

    await page.reload();
    await page.getByTestId(`milestone-submission-btn-${milestoneId}`).click();
    await expect(page.getByTestId('submission-published-grade').first()).toContainText('91/100');

    // 4. Foreign student (Somchai in Team Beta) direct API access -> 403 BR06_FORBIDDEN_TEAM_ACCESS
    const foreignRes = await request.get(`/api/submissions/${submissionId}/evaluation`, {
      headers: { Authorization: `Bearer ${somchaiLogin.token}` },
    });
    expect(foreignRes.status()).toBe(403);
    const foreignBody = await foreignRes.json();
    expect(foreignBody.code).toBe('BR06_FORBIDDEN_TEAM_ACCESS');
    expect(JSON.stringify(foreignBody)).not.toContain('Excellent implementation');
  });
});
