import { assertDisposableTestDatabase } from '../server/tests/helpers/disposableDatabase';
import { test, expect, type Page } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

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
async function selectAlpha(page: Page) {
  await page.locator('tbody tr').filter({ hasText: 'Team Alpha' }).getByRole('button').click();
  await expect(page.getByTestId('review-panel-team')).toContainText('Team Alpha');
}

test('L7-T05/T06: rejects revision 19, persists revision 20, resubmits and preserves approval 10 after reload', async ({ page }) => {
  assertDisposableTestDatabase();
  execSync('npm --prefix server run prisma:seed', { cwd: root, stdio: 'pipe' });
  await page.goto('/');
  await login(page, 'pawarit@mail.kmutt.ac.th');
  await page.getByTestId('submit-proposal-btn').click();
  await expect(page.getByTestId('proposal-status')).toHaveText('SUBMITTED');
  await logout(page);
  await login(page, 'instructor@kmutt.ac.th');
  await selectAlpha(page);
  await expect(page.getByTestId('review-feedback-hint')).toContainText('Request revision: minimum 20 after trim.');
  await page.getByTestId('review-feedback-input').fill('r'.repeat(19));
  await page.getByTestId('revision-proposal-btn').click();
  await expect(page.getByTestId('error-banner')).toContainText('BR05_FEEDBACK_TOO_SHORT');
  await expect(page.getByTestId('review-feedback-input')).toHaveValue('r'.repeat(19));
  await expect(page.getByTestId('review-panel-status')).toHaveText('SUBMITTED');
  await page.getByTestId('review-feedback-input').fill(`  ${'r'.repeat(20)}  `);
  await page.getByTestId('revision-proposal-btn').click();
  await expect(page.getByTestId('review-panel-status')).toHaveText('REVISION_REQUESTED');
  await logout(page);
  await login(page, 'pawarit@mail.kmutt.ac.th');
  await expect(page.getByTestId('proposal-status')).toHaveText('REVISION_REQUESTED');
  await expect(page.getByTestId('review-feedback-box')).toContainText('r'.repeat(20));
  await page.getByTestId('proposal-title').fill('CoursePMS revised proposal after Lab 7 feedback');
  await page.getByTestId('submit-proposal-btn').click();
  await expect(page.getByTestId('proposal-status')).toHaveText('SUBMITTED');
  await expect(page.getByTestId('proposal-revision')).toContainText('2');
  await logout(page);
  await login(page, 'instructor@kmutt.ac.th');
  await selectAlpha(page);
  await page.getByTestId('review-feedback-input').fill('a'.repeat(10));
  await page.getByTestId('approve-proposal-btn').click();
  await expect(page.getByTestId('review-panel-status')).toHaveText('APPROVED');
  await logout(page);
  await login(page, 'pawarit@mail.kmutt.ac.th');
  await page.reload();
  await expect(page.getByTestId('proposal-status')).toHaveText('APPROVED');
  await expect(page.getByTestId('review-feedback-box')).toContainText('a'.repeat(10));
});
