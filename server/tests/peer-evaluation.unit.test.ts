import { describe, expect, it } from 'vitest';
import { peerCompletion, peerId, validatePeerBody } from '../src/services/peerEvaluationService';

describe('S3-F07-T09/T10: peer completion and UTF-16 validation', () => {
  it.each([-1, 0, 1])('completion uses the server instant at dueDate %+dms', offset => {
    const due = new Date('2026-11-25T13:00:00Z');
    expect(peerCompletion('PUBLISHED', due, true, new Date(due.getTime() + offset)).canEvaluate).toBe(offset >= 0);
    expect(peerCompletion('DRAFT', due, true, new Date(due.getTime() + offset)).canEvaluate).toBe(false);
    expect(peerCompletion('PUBLISHED', due, false, new Date(due.getTime() + offset)).canEvaluate).toBe(false);
  });
  it('normalizes optional comments and measures trim/UTF-16 boundaries', () => {
    expect(validatePeerBody({ expectedVersion: 0, rating: 1 }).ok).toBe(true);
    expect(validatePeerBody({ expectedVersion: 1, rating: 5, comment: `  ${'😀'.repeat(1000)}  ` }).ok).toBe(true);
    expect(validatePeerBody({ expectedVersion: 1, rating: 5, comment: `${'😀'.repeat(1000)}x` }).ok).toBe(false);
    for (const raw of [null, [], 'bad', { expectedVersion: 0, rating: true }]) expect(validatePeerBody(raw).ok).toBe(false);
  });
  it('accepts only canonical positive int32 path/query identifiers', () => {
    for (const raw of ['0', '-1', '01', '1.0', '1e2', '2147483648', ['1'], 1]) expect(peerId(raw)).toBeNull();
    expect(peerId('1')).toBe(1); expect(peerId('2147483647')).toBe(2147483647);
  });
});
