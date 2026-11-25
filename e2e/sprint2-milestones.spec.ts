import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..');
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'Password123!';

test.describe('CoursePMS Sprint 2 — F-04 Milestones E2E (S2-F04-T11)', () => {
  test.beforeEach(() => {
    execSync('npm --prefix server run prisma:seed', {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
  });

  test('S2-F04-T11 (S2-F04-AC08): instructor creates draft and publishes milestone; student signs in and sees published milestone without draft leak', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 860 });
    await page.goto('/');

    // 1. Login as Instructor
    await page.getByTestId('login-email').fill('instructor@kmutt.ac.th');
    await page.getByTestId('login-password').fill(DEMO_PASSWORD);
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('current-user-role')).toHaveText('INSTRUCTOR');

    // 2. Create Draft Milestone 1 (kept as DRAFT)
    await page.getByTestId('milestone-title-input').fill('Unpublished Draft Check');
    await page.getByTestId('milestone-due-input').fill('2027-05-01T23:59');
    await page.getByTestId('milestone-weight-input').fill('15');
    await page
      .getByTestId('milestone-desc-input')
      .fill('This draft milestone must not leak to students.');
    await page.getByTestId('milestone-save-btn').click();
    await expect(page.getByTestId('milestones-list')).toContainText('Unpublished Draft Check');

    // 3. Create Milestone 2 and Publish it
    await page.getByTestId('milestone-title-input').fill('Sprint 2 Public Milestone');
    await page.getByTestId('milestone-due-input').fill('2027-06-01T23:59');
    await page.getByTestId('milestone-weight-input').fill('25');
    await page
      .getByTestId('milestone-desc-input')
      .fill('Submit Sprint 2 deliverable and verification report.');
    await page.getByTestId('milestone-save-btn').click();
    await expect(page.getByTestId('milestones-list')).toContainText('Sprint 2 Public Milestone');

    // Publish the second milestone
    const pubCard = page
      .locator('[data-testid^="milestone-item-"]')
      .filter({ hasText: 'Sprint 2 Public Milestone' });
    await pubCard.locator('button:has-text("Publish")').click();
    await expect(pubCard).toContainText('PUBLISHED');

    // 4. Logout and login as Student
    await page.getByTestId('logout-btn').click();
    await page.getByTestId('login-email').fill('pawarit@mail.kmutt.ac.th');
    await page.getByTestId('login-password').fill(DEMO_PASSWORD);
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('current-user-role')).toHaveText('STUDENT');

    // 5. Verify student sees published milestone and NOT the draft, including after reload
    await expect(page.getByTestId('milestones-list')).toContainText('Sprint 2 Public Milestone');
    await expect(page.getByTestId('milestones-list')).toContainText('Weight: 25%');
    await expect(page.getByTestId('milestones-list')).not.toContainText('Unpublished Draft Check');

    await page.reload();
    await expect(page.getByTestId('milestones-list')).toContainText('Sprint 2 Public Milestone');
    await expect(page.getByTestId('milestones-list')).not.toContainText('Unpublished Draft Check');
  });
});
