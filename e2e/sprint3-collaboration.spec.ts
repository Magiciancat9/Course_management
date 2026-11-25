import { expect, test, type Page } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { assertDisposableTestDatabase } from '../server/tests/helpers/disposableDatabase';
const root = path.resolve(__dirname, '..');
const password = process.env.DEMO_USER_PASSWORD || 'Password123!';
async function login(page: Page, email: string) {
  await page.getByTestId('login-email').fill(email); await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click(); await expect(page.getByTestId('current-user-info')).toContainText(email);
}
async function logout(page: Page) {
  await page.getByTestId('logout-btn').click(); await expect(page.getByTestId('login-submit')).toBeVisible();
}

test('S3-F07-T08/AC06: approved-team keyboard task assignment/lifecycle/reload, attributed history and foreign denial', async ({ page, request }) => {
  assertDisposableTestDatabase();
  execSync('npm --prefix server run prisma:seed', { cwd: root, stdio: 'pipe' });
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/'); await login(page, 'pawarit@mail.kmutt.ac.th');
  await page.getByTestId('add-member-email').fill('tatchakorn@mail.kmutt.ac.th');
  await page.getByTestId('add-member-btn').click();
  await expect(page.getByTestId('team-roster-list')).toContainText('Tatchakorn');
  await page.getByTestId('submit-proposal-btn').click(); await expect(page.getByTestId('proposal-status')).toHaveText('SUBMITTED');
  await logout(page); await login(page, 'instructor@kmutt.ac.th');
  await page.locator('tbody tr').filter({ hasText: 'Team Alpha' }).getByRole('button').click();
  await page.getByTestId('review-feedback-input').fill('Approved team scope for the task checkpoint workflow.');
  await page.getByTestId('approve-proposal-btn').click(); await expect(page.getByTestId('review-panel-status')).toHaveText('APPROVED');
  await logout(page); await login(page, 'pawarit@mail.kmutt.ac.th');
  await page.getByRole('button', { name: 'Team Tasks', exact: true }).click();
  await page.getByLabel('Task title', { exact: true }).fill('Verify Sprint 3 task workflow');
  await page.getByLabel('Task description', { exact: true }).fill('Assigned task retained after completing the real browser workflow.');
  await page.getByLabel('Assign to', { exact: true }).selectOption({ label: 'Tatchakorn Thamnimitr' });
  await page.getByTestId('task-save').focus(); await page.keyboard.press('Enter');
  const card = page.locator('[data-testid^="task-card-"]').filter({ hasText: 'Verify Sprint 3 task workflow' });
  await expect(card).toContainText('Tatchakorn'); await expect(card).toContainText('Version 1');
  await card.getByRole('button', { name: 'Start task', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(card).toContainText('Version 2');
  await card.getByRole('button', { name: 'Mark done', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(card).toContainText('Version 3');
  await page.reload(); await page.getByRole('button', { name: 'Team Tasks', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Reopen task' })).toBeVisible(); await expect(card).toContainText('Tatchakorn');
  await card.getByRole('button', { name: 'Activity for Verify Sprint 3 task workflow' }).click();
  const activity = page.getByRole('complementary', { name: 'Task activity' });
  await expect(activity).toContainText('Version 3'); await expect(activity).toContainText('Pawarit Wongdaeng');
  const id = Number((await card.getAttribute('data-testid'))!.replace('task-card-', ''));
  const ownToken = await page.evaluate(() => localStorage.getItem('course_pms_token'));
  const own = { Authorization: `Bearer ${ownToken}` };
  const teamsResponse = await request.get('/api/teams', { headers: own });
  const team = (await teamsResponse.json()).teams.find((t: {name: string}) => t.name === 'Team Alpha');
  const read = async () => (await (await request.get(`/api/teams/${team.id}/tasks`, { headers: own })).json()).tasks;
  const before = await read();
  const foreignLogin = await request.post('/api/auth/login', { data: { email: 'somchai@mail.kmutt.ac.th', password } });
  const foreign = { Authorization: `Bearer ${(await foreignLogin.json()).token}` };
  expect((await request.get(`/api/teams/${team.id}/tasks`, { headers: foreign })).status()).toBe(403);
  expect((await request.get(`/api/tasks/${id}/events`, { headers: foreign })).status()).toBe(403);
  expect((await request.put(`/api/tasks/${id}`, { headers: foreign, data: { expectedVersion: 3, title: 'Foreign overwrite' } })).status()).toBe(403);
  expect(await read()).toEqual(before);
  await page.getByTestId('task-board').screenshot({ path: path.join(root, 'test-results/f07-task-checkpoint.png') });
});
