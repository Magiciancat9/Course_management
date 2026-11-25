import { assertDisposableTestDatabase } from '../server/tests/helpers/disposableDatabase';
import { expect, test, type Page } from '@playwright/test';
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

test('S2-F05-T11/T12: approved team submits/reloads immutable versions, instructor retrieves, foreign student is denied', async ({ page }) => {
  assertDisposableTestDatabase();
  execSync('npm --prefix server run prisma:seed', { cwd: root, stdio: 'pipe' });
  await page.goto('/');
  await login(page, 'pawarit@mail.kmutt.ac.th');
  await page.getByTestId('submit-proposal-btn').click();
  await expect(page.getByTestId('proposal-status')).toHaveText('SUBMITTED');
  await logout(page);
  await login(page, 'instructor@kmutt.ac.th');
  await page.locator('tbody tr').filter({ hasText: 'Team Alpha' }).getByRole('button').click();
  await page.getByTestId('review-feedback-input').fill('Approved milestone submission scope and verification plan.');
  await page.getByTestId('approve-proposal-btn').click();
  await expect(page.getByTestId('review-panel-status')).toHaveText('APPROVED');
  await page.getByTestId('milestone-title-input').fill('F-05 persisted deliverable');
  await page.getByTestId('milestone-desc-input').fill('Submit source, release tag and the report.');
  await page.getByTestId('milestone-due-input').fill('2027-06-01T23:59');
  await page.getByTestId('milestone-save-btn').click();
  const card = page.locator('[data-testid^="milestone-item-"]').filter({ hasText: 'F-05 persisted deliverable' });
  await card.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(card).toContainText('PUBLISHED');
  await logout(page);
  await login(page, 'pawarit@mail.kmutt.ac.th');
  await page.locator('[data-testid^="milestone-submission-btn-"]').click();
  await page.getByTestId('submission-repo-input').fill('https://github.com/example/f05-e2e');
  await page.getByTestId('submission-report-input').fill('https://example.org/f05-report.pdf');
  await page.getByTestId('submission-tag-input').fill('f05-v1');
  await page.getByTestId('submission-notes-input').fill('Saved by the actual browser workflow.');
  await page.getByTestId('submission-save-btn').click();
  await expect(page.getByTestId('submission-success')).toContainText('version 1');
  await page.reload();
  await page.locator('[data-testid^="milestone-submission-btn-"]').click();
  await expect(page.getByTestId('submission-tag-input')).toHaveValue('f05-v1');
  await expect(page.getByTestId('submission-saved').first()).toContainText('ON_TIME');
  await page.getByTestId('submission-tag-input').fill('f05-v2');
  await page.getByTestId('submission-save-btn').click();
  await expect(page.getByTestId('submission-success')).toContainText('version 2');
  await expect(page.getByTestId('submission-history')).toContainText('f05-v1');
  await expect(page.getByTestId('submission-history')).toContainText('f05-v2');
  await page.screenshot({ path: 'test-results/f05-submission-v2.png', fullPage: true });
  const teamId = await page.evaluate(() => fetch('/api/teams', { headers: { Authorization: `Bearer ${localStorage.getItem('course_pms_token')}` } })
    .then(r => r.json()).then(data => data.teams.find((t: { name: string }) => t.name === 'Team Alpha').id));
  const milestoneId = Number((await page.locator('[data-testid^="milestone-submission-btn-"]').getAttribute('data-testid'))!.split('-').pop());
  await logout(page);
  await login(page, 'instructor@kmutt.ac.th');
  await page.locator('[data-testid^="milestone-submission-btn-"]').click();
  await page.getByTestId(`submission-team-${teamId}`).click();
  await expect(page.getByTestId('submission-saved').first()).toContainText('f05-v2');
  await expect(page.getByTestId('submission-form')).toHaveCount(0);
  await logout(page);
  await login(page, 'somchai@mail.kmutt.ac.th');
  const denial = await page.evaluate(async ({ teamId, milestoneId }) => {
    const r = await fetch(`/api/teams/${teamId}/milestones/${milestoneId}/submission`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('course_pms_token')}` },
    });
    return { status: r.status, body: await r.json() };
  }, { teamId, milestoneId });
  expect(denial.status).toBe(403);
  expect(denial.body.code).toBe('BR06_FORBIDDEN_TEAM_ACCESS');
  expect(JSON.stringify(denial.body)).not.toContain('f05-report.pdf');
});
