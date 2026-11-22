import { describe, expect, it } from 'vitest';
import { validateInstructorReview, type ProposalState } from '../src/utils/domainRules';

describe('Lab 7 CR-L7-01: decision-specific trimmed UTF-16 feedback', () => {
  it('L7-T01: rejects 19-unit REVISION_REQUESTED feedback on a SUBMITTED proposal', () => {
    const result = validateInstructorReview('SUBMITTED', 'REVISION_REQUESTED', 'r'.repeat(19));
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
    expect(result.code).toBe('BR05_FEEDBACK_TOO_SHORT');
  });

  it.each([20, 21])('L7-T01: accepts %i-unit revision feedback', (length) => {
    expect(validateInstructorReview('SUBMITTED', 'REVISION_REQUESTED', 'r'.repeat(length)))
      .toEqual({ valid: true });
  });

  it('L7-T02: padding cannot rescue 19 revision units after trim', () => {
    expect(validateInstructorReview('SUBMITTED', 'REVISION_REQUESTED', ` \t${'r'.repeat(19)}\n\u00a0`))
      .toMatchObject({ valid: false, status: 400, code: 'BR05_FEEDBACK_TOO_SHORT' });
  });

  it('L7-T02: padded 20-unit revision feedback is valid', () => {
    expect(validateInstructorReview('SUBMITTED', 'REVISION_REQUESTED', `\u00a0 ${'r'.repeat(20)}\t\n`))
      .toEqual({ valid: true });
  });

  describe.each(['APPROVED', 'REVISION_REQUESTED'])('%s invalid feedback', (decision) => {
    it.each([undefined, null, '', ' \t\n\u00a0', 0, false, [], {}])(
      'L7-T02: rejects non-string/missing/blank value %j', (feedback) => {
        expect(validateInstructorReview('SUBMITTED', decision, feedback as string | undefined))
          .toMatchObject({ valid: false, status: 400, code: 'BR05_FEEDBACK_TOO_SHORT' });
      }
    );
  });

  it('L7-T02: rejects 19 UTF-16 units even when surrogate pairs are present', () => {
    const feedback = '\u{1f642}'.repeat(9) + 'a';
    expect(feedback.length).toBe(19);
    expect(validateInstructorReview('SUBMITTED', 'REVISION_REQUESTED', feedback))
      .toMatchObject({ valid: false, status: 400, code: 'BR05_FEEDBACK_TOO_SHORT' });
  });

  it('L7-T02: accepts ten surrogate pairs because they are 20 UTF-16 units', () => {
    const feedback = '\u{1f642}'.repeat(10);
    expect(feedback.length).toBe(20);
    expect(validateInstructorReview('SUBMITTED', 'REVISION_REQUESTED', feedback)).toEqual({ valid: true });
  });

  it('L7-T02: preserves JavaScript trim semantics for a zero-width space', () => {
    expect(validateInstructorReview('SUBMITTED', 'REVISION_REQUESTED', 'r'.repeat(19) + '\u200b'))
      .toEqual({ valid: true });
  });

  it('L7-T03: rejects approval feedback at 9 units', () => {
    expect(validateInstructorReview('SUBMITTED', 'APPROVED', 'a'.repeat(9)))
      .toMatchObject({ valid: false, status: 400, code: 'BR05_FEEDBACK_TOO_SHORT' });
  });

  it.each([10, 11])('L7-T03: keeps approval valid at %i units', (length) => {
    expect(validateInstructorReview('SUBMITTED', 'APPROVED', 'a'.repeat(length))).toEqual({ valid: true });
  });

  it('L7-T03: keeps padded 10-unit approval valid', () => {
    expect(validateInstructorReview('SUBMITTED', 'APPROVED', ` \t${'a'.repeat(10)}\n`))
      .toEqual({ valid: true });
  });

  it.each(['REJECTED', '', null, 17])('L7-T03: rejects invalid decision %j before feedback validation', (decision) => {
    expect(validateInstructorReview('SUBMITTED', decision as string, ''))
      .toMatchObject({ valid: false, status: 400, code: 'VALIDATION_ERROR' });
  });

  it.each(['DRAFT', 'APPROVED', 'REVISION_REQUESTED'] as ProposalState[])(
    'L7-T04: keeps state precedence for %s even with invalid decision and feedback', (status) => {
      expect(validateInstructorReview(status, 'REJECTED', ''))
        .toMatchObject({ valid: false, status: 409, code: 'BR03_INVALID_STATUS_TRANSITION' });
    }
  );
});
