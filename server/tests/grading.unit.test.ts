import { describe, expect, it } from 'vitest';
import {
  parsePositiveIntParam,
  validateEvaluationDraftBody,
  validateEvaluationPublishBody,
} from '../src/services/gradingService';

describe('F-06 Grading Validation & Boundaries — Unit Suite', () => {
  it('S2-F06-T02 (unit): accepts integer scores 0..100 and rejects out-of-range, fractions, strings, and null', () => {
    for (const validScore of [0, 1, 50, 99, 100]) {
      const res = validateEvaluationDraftBody({
        submissionVersion: 1,
        expectedVersion: 0,
        score: validScore,
        feedback: 'Valid feedback',
      });
      expect(res.valid).toBe(true);
      if (res.valid) {
        expect(res.data.score).toBe(validScore);
      }
    }

    for (const invalidScore of [-1, 101, 1.5, NaN, Infinity, '80', null, undefined, true]) {
      const res = validateEvaluationDraftBody({
        submissionVersion: 1,
        expectedVersion: 0,
        score: invalidScore,
        feedback: 'Valid feedback',
      });
      expect(res.valid).toBe(false);
    }
  });

  it('S2-F06-T03 (unit): trims feedback (1..2000), rejects blank/overlong/wrong types, and rejects unknown payload keys', () => {
    const min = validateEvaluationDraftBody({
      submissionVersion: 1,
      expectedVersion: 0,
      score: 75,
      feedback: '  X  ',
    });
    expect(min.valid).toBe(true);
    if (min.valid) {
      expect(min.data.feedback).toBe('X');
    }

    const max = validateEvaluationDraftBody({
      submissionVersion: 1,
      expectedVersion: 2,
      score: 75,
      feedback: 'F'.repeat(2000),
    });
    expect(max.valid).toBe(true);

    for (const invalidFeedback of ['', '   ', 'F'.repeat(2001), 123, null, undefined]) {
      expect(
        validateEvaluationDraftBody({
          submissionVersion: 1,
          expectedVersion: 0,
          score: 75,
          feedback: invalidFeedback,
        }).valid
      ).toBe(false);
    }

    expect(
      validateEvaluationDraftBody({
        submissionVersion: 1,
        expectedVersion: 0,
        score: 75,
        feedback: 'Valid',
        publishedById: 1,
      }).valid
    ).toBe(false);
  });

  it('validates publish payloads and positive integer path/query params', () => {
    expect(
      validateEvaluationPublishBody({ submissionVersion: 1, expectedVersion: 1 }).valid
    ).toBe(true);
    expect(
      validateEvaluationPublishBody({ submissionVersion: 1, expectedVersion: 0 }).valid
    ).toBe(false);
    expect(
      validateEvaluationPublishBody({
        submissionVersion: 1,
        expectedVersion: 1,
        extra: true,
      }).valid
    ).toBe(false);

    expect(parsePositiveIntParam('1')).toBe(1);
    expect(parsePositiveIntParam('0')).toBeNull();
    expect(parsePositiveIntParam('01')).toBeNull();
    expect(parsePositiveIntParam('-5')).toBeNull();
  });
});
