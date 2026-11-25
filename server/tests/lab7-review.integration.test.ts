import { assertDisposableTestDatabase } from './helpers/disposableDatabase';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma';
import { seedDatabase } from '../prisma/seed';
import { clearRevokedTokens, signAuthToken } from '../src/middleware/auth';

describe('Lab 7: real API/PostgreSQL review validation and retained data/access', () => {
  let seeded: Awaited<ReturnType<typeof seedDatabase>>;
  let proposalId: number;
  let instructorToken: string;

  beforeEach(async () => {
    assertDisposableTestDatabase();
    await clearRevokedTokens();
    seeded = await seedDatabase(prisma);
    const proposal = await prisma.projectProposal.update({
      where: { teamId: seeded.teamAlpha.id },
      data: { status: 'SUBMITTED', submittedAt: new Date('2026-11-22T00:00:00Z'), revisionCount: 1 },
    });
    proposalId = proposal.id;
    instructorToken = signAuthToken(seeded.instructor);
  });
  afterAll(async () => { await prisma.$disconnect(); });

  const review = (decision: unknown, reviewFeedback: unknown, token = instructorToken) =>
    request(app).post(`/api/proposals/${proposalId}/review`)
      .set('Authorization', `Bearer ${token}`).send({ decision, reviewFeedback });
  const row = () => prisma.projectProposal.findUniqueOrThrow({ where: { id: proposalId } });

  it('L7-T01/T05: rejects 19-unit revision feedback and leaves the complete stored row unchanged', async () => {
    const before = await row();
    const response = await review('REVISION_REQUESTED', 'r'.repeat(19));
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('BR05_FEEDBACK_TOO_SHORT');
    expect(response.body.error).toContain('20');
    expect(response.body.proposal).toBeUndefined();
    expect(await row()).toEqual(before);
  });

  it.each([
    ['REVISION_REQUESTED', 'r'.repeat(20)],
    ['REVISION_REQUESTED', 'r'.repeat(21)],
    ['APPROVED', 'a'.repeat(10)],
    ['APPROVED', 'a'.repeat(11)],
  ])('L7-T01/T03/T05: persists %s feedback of %s with correct actor and authorized readback', async (decision, feedback) => {
    const before = await row();
    const response = await review(decision, ` \t${feedback}\n\u00a0`);
    expect(response.status).toBe(200);
    const saved = await row();
    expect(saved).toMatchObject({ status: decision, reviewFeedback: feedback, reviewedById: seeded.instructor.id });
    expect(saved.reviewedAt).toBeInstanceOf(Date);
    expect(saved.submittedAt).toEqual(before.submittedAt);
    expect(saved.revisionCount).toBe(before.revisionCount);
    for (const token of [instructorToken, signAuthToken(seeded.pawarit)]) {
      const readback = await request(app).get(`/api/teams/${seeded.teamAlpha.id}/proposal`)
        .set('Authorization', `Bearer ${token}`);
      expect(readback.status).toBe(200);
      expect(readback.body.proposal).toMatchObject({ status: decision, reviewFeedback: feedback });
      expect(readback.body.proposal.reviewedAt).toBe(saved.reviewedAt!.toISOString());
      expect(readback.body.proposal.reviewedBy.id).toBe(seeded.instructor.id);
    }
  });

  it('L7-T02: trim removes padding before the revision length check', async () => {
    const before = await row();
    expect((await review('REVISION_REQUESTED', ` \t${'r'.repeat(19)}\n\u00a0`)).status).toBe(400);
    expect(await row()).toEqual(before);
  });

  it.each([undefined, null, 42, false, [], {}, '', ' \t\n '].map(feedback => ({ feedback })))(
    'L7-T02/T05: rejects invalid revision feedback %j without any persisted change', async ({ feedback }) => {
      const before = await row();
      const response = await review('REVISION_REQUESTED', feedback);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('BR05_FEEDBACK_TOO_SHORT');
      expect(await row()).toEqual(before);
    }
  );

  it.each([
    ['\u{1f642}'.repeat(9) + 'a', 400],
    ['\u{1f642}'.repeat(10), 200],
    ['r'.repeat(19) + '\u200b', 200],
  ])('L7-T02: enforces UTF-16 and JavaScript trim semantics for %s', async (feedback, status) => {
    const response = await review('REVISION_REQUESTED', feedback);
    expect(response.status).toBe(status);
    if (status === 200) expect((await row()).reviewFeedback).toBe(feedback);
  });

  it('L7-T03: preserves approval rejection at 9 and invalid-decision precedence', async () => {
    const before = await row();
    const tooShort = await review('APPROVED', 'a'.repeat(9));
    expect(tooShort.status).toBe(400);
    expect(tooShort.body.code).toBe('BR05_FEEDBACK_TOO_SHORT');
    expect(tooShort.body.error).toContain('10');
    const invalid = await review('REJECTED', '');
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');
    expect(await row()).toEqual(before);
  });

  it.each(['DRAFT', 'APPROVED', 'REVISION_REQUESTED'] as const)(
    'L7-T04: retains state precedence and row equality for %s', async (status) => {
      await prisma.projectProposal.update({ where: { id: proposalId }, data: { status } });
      const before = await row();
      const response = await review('REJECTED', null);
      expect(response.status).toBe(409);
      expect(response.body.code).toBe('BR03_INVALID_STATUS_TRANSITION');
      expect(await row()).toEqual(before);
    }
  );

  it('L7-T04/T06: enforces anonymous, role and foreign-team denials before private feedback is exposed', async () => {
    const before = await row();
    const anonymous = await request(app).post(`/api/proposals/${proposalId}/review`).send({});
    expect(anonymous.status).toBe(401);
    const student = await review('REJECTED', null, signAuthToken(seeded.pawarit));
    expect(student.status).toBe(403);
    expect(student.body.code).toBe('BR06_INSTRUCTOR_ROLE_REQUIRED');
    const missing = await request(app).post('/api/proposals/2147483647/review')
      .set('Authorization', `Bearer ${instructorToken}`).send({ decision: 'APPROVED', reviewFeedback: 'a'.repeat(10) });
    expect(missing.status).toBe(404);
    const foreign = await request(app).get(`/api/teams/${seeded.teamAlpha.id}/proposal`)
      .set('Authorization', `Bearer ${signAuthToken(seeded.somchai)}`);
    expect(foreign.status).toBe(403);
    expect(foreign.body.proposal).toBeUndefined();
    expect(await row()).toEqual(before);
  });

  it.each(['APPROVED', 'REVISION_REQUESTED'] as const)(
    'L7-T05: preserves historical 10–19-unit %s reviews without rewriting them', async (status) => {
      const historical = await prisma.projectProposal.update({
        where: { id: proposalId },
        data: { status, reviewFeedback: 'legacy-review', reviewedById: seeded.instructor.id,
          reviewedAt: new Date('2026-11-17T12:00:00Z') },
      });
      for (const token of [instructorToken, signAuthToken(seeded.pawarit)]) {
        const response = await request(app).get(`/api/teams/${seeded.teamAlpha.id}/proposal`)
          .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.proposal.reviewFeedback).toBe('legacy-review');
        expect(response.body.proposal.status).toBe(status);
      }
      expect(await row()).toEqual(historical);
    }
  );
});
