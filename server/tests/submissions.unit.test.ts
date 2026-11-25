import { describe, expect, it } from 'vitest';
import { calculateLateStatus, validateSubmissionBody } from '../src/services/submissionService';

const valid = { expectedVersion: 0, repoUrl: ' https://github.com/example/project ',
  reportUrl: ' https://example.org/report.pdf ', releaseTag: ' v1.0.0 ' };

describe('F-05 submission validation and server-time rules', () => {
  it('S2-F05-T04: normalizes allowed URLs/tag and defaults absent notes', () => {
    expect(validateSubmissionBody(valid)).toEqual({ valid: true, data: {
      expectedVersion: 0, repoUrl: 'https://github.com/example/project', reportUrl: 'https://example.org/report.pdf',
      releaseTag: 'v1.0.0', notes: '',
    } });
    expect(validateSubmissionBody({ ...valid, repoUrl: 'http://example.org/repo', expectedVersion: 2 }).valid).toBe(true);
  });
  it.each(['javascript:alert(1)', 'ftp://example.org/file', '/relative', 'https://', '', null, 123])(
    'S2-F05-T04: rejects invalid URL %s', repoUrl => {
      expect(validateSubmissionBody({ ...valid, repoUrl }).valid).toBe(false);
    });
  it('S2-F05-T04: accepts exact UTF-16 limits and rejects the next unit', () => {
    const prefix = 'https://example.org/';
    const exact = { ...valid, repoUrl: prefix + 'a'.repeat(2048 - prefix.length),
      reportUrl: prefix + 'r'.repeat(2048 - prefix.length), releaseTag: 'v'.repeat(128), notes: 'n'.repeat(10000) };
    expect(validateSubmissionBody(exact).valid).toBe(true);
    for (const field of ['repoUrl', 'reportUrl', 'releaseTag', 'notes'] as const) {
      expect(validateSubmissionBody({ ...exact, [field]: exact[field] + 'a' }).valid).toBe(false);
    }
    for (const releaseTag of ['two tags', 'a\tb', 'a\u0000b', 'a\u007fb', '']) {
      expect(validateSubmissionBody({ ...valid, releaseTag }).valid).toBe(false);
    }
  });
  it('S2-F05-T04: rejects wrong body types, forged server fields and malformed versions', () => {
    for (const body of [null, [], 'string', 1]) expect(validateSubmissionBody(body).valid).toBe(false);
    for (const expectedVersion of [undefined, null, -1, '0', 1.5, Number.MAX_SAFE_INTEGER, true]) {
      expect(validateSubmissionBody({ ...valid, expectedVersion }).valid).toBe(false);
    }
    for (const key of ['teamId', 'milestoneId', 'score', 'feedback', 'submittedAt', 'dueDateSnapshot', 'isLate', 'lateStatus']) {
      expect(validateSubmissionBody({ ...valid, [key]: 'forged' }).valid).toBe(false);
    }
    expect(validateSubmissionBody({ ...valid, notes: null }).valid).toBe(false);
  });
  it('S2-F05-T05: equality is ON_TIME and only strictly later server time is LATE', () => {
    const deadline = new Date('2026-11-29T16:59:00Z');
    expect(calculateLateStatus(new Date(deadline.getTime() - 1), deadline)).toBe('ON_TIME');
    expect(calculateLateStatus(deadline, deadline)).toBe('ON_TIME');
    expect(calculateLateStatus(new Date(deadline.getTime() + 1), deadline)).toBe('LATE');
  });
});
