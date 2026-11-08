import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const REPO_ROOT = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = process.env.SPRINT1_ARTIFACT_DIR
  ? path.resolve(process.env.SPRINT1_ARTIFACT_DIR)
  : path.join(REPO_ROOT, 'artifacts', 'sprint-1', 'verification');

test.describe('CoursePMS Sprint 1 — End-to-End Browser Verification (TEST-11, TEST-12 & TEST-20)', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test.beforeEach(() => {
    execSync('npm --prefix server run prisma:seed', {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
  });

  test('TEST-11: completes full Sprint 1 domain journey (Student adds teammate -> submits proposal -> Instructor approves -> Student retrieves persisted APPROVED state)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 860 });
    await page.goto('/');

    // 1. Login as Student (Pawarit — Team Alpha Leader)
    await page.getByTestId('quickfill-pawarit').click();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01_login_screen.png'),
      fullPage: true,
    });
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('current-user-role')).toHaveText('STUDENT');
    await expect(page.getByTestId('my-team-name')).toHaveText('Team Alpha');
    await expect(page.getByTestId('team-capacity-badge')).toHaveText('1 / 3 Members');

    // 2. Add Teammate (Tatchakorn) to Team Alpha (F-02 / AC-04)
    await page.getByTestId('add-member-email').fill('tatchakorn@mail.kmutt.ac.th');
    await page.getByTestId('add-member-btn').click();
    await expect(page.getByTestId('team-capacity-badge')).toHaveText('2 / 3 Members');
    await expect(page.getByTestId('team-roster-list')).toContainText('Tatchakorn Thamnimitr');

    // 3. Submit Proposal for Review (F-03 / AC-07)
    await page.getByTestId('submit-proposal-btn').click();
    await expect(page.getByTestId('proposal-status')).toHaveText('SUBMITTED');
    await expect(page.getByTestId('proposal-revision')).toContainText('Revision #1');
    await expect(page.getByTestId('submit-proposal-btn')).toBeDisabled();
    await expect(page.getByTestId('save-draft-btn')).toBeDisabled();
    await expect(page.getByTestId('add-member-btn')).toBeDisabled();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02_student_submitted_journey.png'),
      fullPage: true,
    });

    // 4. Logout as Student (F-01 / AC-03)
    await page.getByTestId('logout-btn').click();
    await expect(page.getByTestId('login-submit')).toBeVisible();

    // 5. Login as Instructor and Approve Proposal (F-03 / AC-09)
    await page.getByTestId('quickfill-instructor').click();
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('current-user-role')).toHaveText('INSTRUCTOR');

    await page.locator('tbody tr').filter({ hasText: 'SUBMITTED' }).first().getByRole('button').click();
    await expect(page.getByTestId('review-panel-status')).toHaveText('SUBMITTED');
    await page
      .getByTestId('review-feedback-input')
      .fill('Approved for Sprint 1! Well-defined domain boundaries, RBAC matrix, and schema.');
    await page.getByTestId('approve-proposal-btn').click();
    await expect(page.getByTestId('review-panel-status')).toHaveText('APPROVED');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03_instructor_approved_review.png'),
      fullPage: true,
    });
    await expect(page.getByTestId('approve-proposal-btn')).toHaveCount(0);

    // 6. Logout Instructor, Login back as Student, and retrieve persisted APPROVED result
    await page.getByTestId('logout-btn').click();
    await page.getByTestId('quickfill-pawarit').click();
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('proposal-status')).toHaveText('APPROVED');
    await expect(page.getByTestId('review-feedback-box')).toContainText(
      'Approved for Sprint 1! Well-defined domain boundaries, RBAC matrix, and schema.'
    );
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04_student_persisted_approved_retrieval.png'),
      fullPage: true,
    });
  });

  test('TEST-12: demonstrates business-rule rejections (BR-01 duplicate team, BR-04 incomplete proposal) and cross-team ownership forbidden rejection (BR-06)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 860 });
    await page.goto('/');

    // 1. Login as Student (Pawarit — already in Team Alpha)
    await page.getByTestId('quickfill-pawarit').click();
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('current-user-role')).toHaveText('STUDENT');

    // 2. UI prevents an invalid duplicate-team action; the API still enforces BR-01 directly.
    await expect(page.getByTestId('create-team-btn')).toHaveCount(0);
    const duplicateCreate = await page.evaluate(async () => {
      const token = localStorage.getItem('course_pms_token');
      const coursesResponse = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { courses } = await coursesResponse.json();
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Duplicate Team Attempt', courseId: courses[0].id }),
      });
      return { status: response.status, body: await response.json() };
    });
    expect(duplicateCreate.status).toBe(409);
    expect(duplicateCreate.body.code).toBe('BR01_DUPLICATE_TEAM_MEMBERSHIP');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05_br01_duplicate_team_rejection.png'),
      fullPage: true,
    });

    // 3. Business-Rule Rejection 2: Attempt to submit incomplete proposal with short title (BR-04)
    await page.getByTestId('proposal-title').fill('AI');
    await page.getByTestId('submit-proposal-btn').click();
    await expect(page.getByTestId('error-banner')).toContainText('BR04_INCOMPLETE_PROPOSAL');

    // 4. Forbidden Ownership Operation (BR-06): Student in Team Alpha attempts to view Team Beta's private proposal via API button
    const inspectButtons = page.locator('[data-testid^="inspect-proposal-"]');
    const count = await inspectButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await inspectButtons.nth(1).click();
    await expect(page.getByTestId('error-banner')).toContainText('BR06_FORBIDDEN_TEAM_ACCESS');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06_br06_cross_team_forbidden_rejection.png'),
      fullPage: true,
    });
  });

  test('TEST-20: displays invalid-login errors and supports dismissing the alert', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('login-email').fill('unknown@example.test');
    await page.getByTestId('login-password').fill('WrongPassword!');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('auth-error')).toContainText('INVALID_CREDENTIALS');
    await page.getByRole('button', { name: 'Dismiss error' }).click();
    await expect(page.getByTestId('auth-error')).toHaveCount(0);
  });
});
