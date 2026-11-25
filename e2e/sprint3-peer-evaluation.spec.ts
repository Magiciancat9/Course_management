import { expect, test, type Page } from '@playwright/test';
import { PrismaClient } from '../server/node_modules/@prisma/client';
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

test('S3-F07-T15/AC12: real confidential peer save/update/reload, teammate/foreign denial and instructor read', async ({ page, request }) => {
  assertDisposableTestDatabase();
  execSync('npm --prefix server run prisma:seed', { cwd: root, stdio: 'pipe' });
  const db = new PrismaClient();
  let teamId: number, milestoneId: number, targetId: number;
  try {
    const team = await db.projectTeam.findFirstOrThrow({ where: { name: 'Team Alpha' } }); teamId = team.id;
    const target = await db.user.findUniqueOrThrow({ where: { email: 'tatchakorn@mail.kmutt.ac.th' } }); targetId = target.id;
    await db.teamMember.create({ data: { teamId, userId: targetId, courseId: team.courseId } });
    await db.projectProposal.update({ where: { teamId }, data: { status: 'APPROVED' } });
    const milestone = await db.milestone.create({ data: { courseId: team.courseId, title: 'Completed milestone for peer evaluation',
      description: 'Synthetic real DB fixture: published, past due, with saved team submission.', dueDate: new Date(Date.now() - 3600000),
      status: 'PUBLISHED', publishedAt: new Date(Date.now() - 7200000) } }); milestoneId = milestone.id;
    await db.milestoneSubmission.create({ data: { milestoneId, teamId, artifactUrl: 'https://example.org/peer-fixture', releaseTag: 'peer-e2e-v1' } });
  } finally { await db.$disconnect(); }
  await page.setViewportSize({ width: 1366, height: 900 }); await page.goto('/');
  await login(page, 'pawarit@mail.kmutt.ac.th');
  await page.getByRole('button', { name: 'Peer Evaluation', exact: true }).click();
  await page.getByLabel('Peer evaluation milestone').selectOption(String(milestoneId));
  await expect(page.getByTestId('peer-eligibility')).toContainText('complete');
  await expect(page.getByLabel('Teammate to evaluate').getByRole('option', { name: 'Pawarit Wongdaeng' })).toHaveCount(0);
  await page.getByLabel('Teammate to evaluate').selectOption(String(targetId));
  await page.getByLabel('Contribution rating (1–5)').selectOption('4');
  await page.getByLabel('Confidential comment (optional)').fill('Synthetic confidential feedback: completed assigned work.');
  await page.getByTestId('peer-save').focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('peer-success')).toContainText('saved');
  await page.reload(); await page.getByRole('button', { name: 'Peer Evaluation', exact: true }).click();
  const section = page.getByTestId('peer-evaluation');
  await expect(section).toContainText('Synthetic confidential feedback: completed assigned work.');
  await page.getByLabel('Teammate to evaluate').selectOption(String(targetId));
  await page.getByLabel('Contribution rating (1–5)').selectOption('5');
  await page.getByLabel('Confidential comment (optional)').fill('Synthetic confidential feedback updated after reload.');
  await page.getByTestId('peer-save').click(); await expect(page.getByTestId('peer-success')).toContainText('saved');
  await expect(section).toContainText('Version 2');
  await section.screenshot({ path: path.join(root, 'test-results/f07-peer-outgoing.png') });
  const ownToken = await page.evaluate(() => localStorage.getItem('course_pms_token'));
  const base = `/api/teams/${teamId}/milestones/${milestoneId}/peer-evaluations`;
  const read = async () => (await (await request.get(`${base}/me`, { headers: { Authorization: `Bearer ${ownToken}` } })).json()).evaluations;
  const before = await read(); expect(before).toHaveLength(1); expect(before[0].version).toBe(2);
  for (const email of ['tatchakorn@mail.kmutt.ac.th', 'somchai@mail.kmutt.ac.th']) {
    const session = await request.post('/api/auth/login', { data: { email, password } });
    const headers = { Authorization: `Bearer ${(await session.json()).token}` };
    expect((await request.get(base, { headers })).status()).toBe(403);
    const outgoing = await request.get(`${base}/me`, { headers });
    expect(outgoing.status()).toBe(email.startsWith('tatchakorn') ? 200 : 403);
    expect(await outgoing.text()).not.toContain('Synthetic confidential feedback');
    expect((await request.put(`${base}/${targetId}`, { headers, data: { expectedVersion: 2, rating: 1 } })).status())
      .toBe(email.startsWith('tatchakorn') ? 400 : 403);
  }
  expect(await read()).toEqual(before);
  await logout(page); await login(page, 'tatchakorn@mail.kmutt.ac.th');
  await page.getByRole('button', { name: 'Peer Evaluation', exact: true }).click();
  await expect(section.getByTestId('peer-empty')).toBeVisible();
  await expect(section).not.toContainText('Synthetic confidential feedback');
  await logout(page); await login(page, 'instructor@kmutt.ac.th');
  await page.getByRole('button', { name: 'Peer Evaluation', exact: true }).click();
  await page.getByLabel('Peer evaluation team').selectOption(String(teamId));
  await page.getByLabel('Peer evaluation milestone').selectOption(String(milestoneId));
  await expect(section).toContainText('Synthetic confidential feedback updated after reload.');
  await expect(section).toContainText('Evaluator: Pawarit Wongdaeng');
  await expect(section.getByTestId('peer-form')).toHaveCount(0);
  await section.screenshot({ path: path.join(root, 'test-results/f07-peer-instructor.png') });
});
