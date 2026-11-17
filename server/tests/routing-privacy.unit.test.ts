import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express, { Response } from 'express';

const repository = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  revokedToken: { deleteMany: vi.fn(), findUnique: vi.fn() },
  projectTeam: { findMany: vi.fn() },
}));
vi.mock('../src/prisma', () => ({ default: repository }));

const student = { id: 101, email: 'student@example.test', fullName: 'Synthetic student', studentCode: '101', role: 'STUDENT' as const };
const unassigned = { ...student, id: 102, email: 'unassigned@example.test' };
const instructor = { ...student, id: 201, email: 'instructor@example.test', role: 'INSTRUCTOR' as const };
const actors = [student, unassigned, instructor];
const proposal = { id: 501, teamId: 11, title: 'Private draft title', status: 'DRAFT', revisionCount: 1,
  problemStatement: 'Private problem statement', techStack: 'Private stack', repoUrl: 'https://example.test/private',
  reviewFeedback: 'Private feedback', updatedAt: '2026-11-17T00:00:00Z' };
const teams = [
  { id: 11, name: 'Own team', members: [{ userId: student.id }], proposal },
  { id: 12, name: 'Foreign team', members: [{ userId: 999 }], proposal: { ...proposal, id: 502, teamId: 12, title: 'Foreign private title' } },
];
let app: typeof import('../src/app')['default'];
let auth: typeof import('../src/middleware/auth');

beforeAll(async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('JWT_SECRET', 'synthetic-routing-unit-test-key-only');
  // Exercise the real production fallback without depending on a built frontend.
  vi.spyOn(express.response, 'sendFile').mockImplementation(function (this: Response) {
    return this.status(200).type('html').send('<main>Synthetic SPA response</main>');
  });
  app = (await import('../src/app')).default;
  auth = await import('../src/middleware/auth');
});
beforeEach(() => {
  vi.clearAllMocks();
  repository.user.findUnique.mockImplementation(async ({ where }) => actors.find(actor => actor.id === where.id));
  repository.revokedToken.findUnique.mockResolvedValue(null);
  repository.revokedToken.deleteMany.mockResolvedValue({ count: 0 });
  repository.projectTeam.findMany.mockResolvedValue(teams);
});
afterAll(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('Versioned roster and API routing contracts', () => {
  it('returns foreign rosters with no proposal metadata and preserves the current team full proposal', async () => {
    const result = await request(app).get('/api/teams').set('Authorization', `Bearer ${auth.signAuthToken(student)}`);
    expect(result.status).toBe(200);
    expect(result.body.teams[0].proposal).toEqual(proposal);
    expect(result.body.teams[1]).toMatchObject({ name: 'Foreign team', members: [{ userId: 999 }], proposal: null });
    expect(JSON.stringify(result.body)).not.toContain('Foreign private title');
    expect(teams[1].proposal.title).toBe('Foreign private title');
  });

  it('returns only rosters and null proposals to an unassigned student', async () => {
    const result = await request(app).get('/api/teams').set('Authorization', `Bearer ${auth.signAuthToken(unassigned)}`);
    expect(result.status).toBe(200);
    expect(result.body.teams).toHaveLength(2);
    for (const team of result.body.teams) expect(team.proposal).toBeNull();
    expect(JSON.stringify(result.body)).not.toContain('Private draft title');
  });

  it('retains complete proposals for the instructor', async () => {
    const result = await request(app).get('/api/teams').set('Authorization', `Bearer ${auth.signAuthToken(instructor)}`);
    expect(result.status).toBe(200);
    expect(result.body.teams).toEqual(teams);
  });

  it.each(['/api/proposals', '/api/proposals/999/unknown'])('requires authentication for unsupported protected proposal route %s', async route => {
    const result = await request(app).get(route);
    expect(result.status).toBe(401);
    expect(result.type).toBe('application/json');
    expect(result.body.code).toBe('UNAUTHORIZED');
  });

  it('returns JSON 404 for authenticated unsupported collection GET without inventing a list endpoint', async () => {
    const result = await request(app).get('/api/proposals').set('Authorization', `Bearer ${auth.signAuthToken(student)}`);
    expect(result.status).toBe(404);
    expect(result.type).toBe('application/json');
    expect(result.body).toEqual({ error: 'API route not found.', code: 'API_ROUTE_NOT_FOUND' });
    expect(repository.projectTeam.findMany).not.toHaveBeenCalled();
  });

  it('returns JSON 404 for unknown APIs before the SPA fallback', async () => {
    const result = await request(app).get('/api/nonexistent-route');
    expect(result.status).toBe(404);
    expect(result.type).toBe('application/json');
    expect(result.body.code).toBe('API_ROUTE_NOT_FOUND');
  });

  it('continues to send SPA HTML for frontend navigation', async () => {
    const result = await request(app).get('/courses/1');
    expect(result.status).toBe(200);
    expect(result.type).toBe('text/html');
    expect(result.text).toContain('Synthetic SPA response');
  });
});
