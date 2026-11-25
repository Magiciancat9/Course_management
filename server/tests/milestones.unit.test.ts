import { describe, it, expect } from 'vitest';
import {
  parseCanonicalPositiveInt,
  parseExplicitOffsetIsoDate,
  validateCreateMilestoneBody,
  validateListMilestonesQuery,
  validatePublishDueDate,
  validatePublishMilestoneBody,
  validateUpdateMilestoneBody,
} from '../src/services/milestoneService';

describe('F-04 Milestone Validation & Boundaries — Unit Suite', () => {
  it('S2-F04-T02 (unit): enforces trimmed title (3..120) and description (10..5000) boundaries', () => {
    const validMin = validateCreateMilestoneBody({
      title: '  abc  ',
      description: '  1234567890  ',
      dueDate: '2026-11-29T23:59:00+07:00',
      weightPercent: 0,
    });
    expect(validMin.valid).toBe(true);
    if (validMin.valid) {
      expect(validMin.data.title).toBe('abc');
      expect(validMin.data.description).toBe('1234567890');
    }

    expect(
      validateCreateMilestoneBody({
        title: 'ab',
        description: '1234567890',
        dueDate: '2026-11-29T23:59:00Z',
        weightPercent: 10,
      }).valid
    ).toBe(false);

    expect(
      validateCreateMilestoneBody({
        title: 'a'.repeat(121),
        description: '1234567890',
        dueDate: '2026-11-29T23:59:00Z',
        weightPercent: 10,
      }).valid
    ).toBe(false);

    expect(
      validateCreateMilestoneBody({
        title: 'Valid',
        description: '123456789',
        dueDate: '2026-11-29T23:59:00Z',
        weightPercent: 10,
      }).valid
    ).toBe(false);

    expect(
      validateCreateMilestoneBody({
        title: 'Valid',
        description: 'd'.repeat(5001),
        dueDate: '2026-11-29T23:59:00Z',
        weightPercent: 10,
      }).valid
    ).toBe(false);
  });

  it('S2-F04-T03 (unit): enforces integer weightPercent (0..100), explicit-offset ISO dates, and schema keys', () => {
    expect(parseExplicitOffsetIsoDate('2026-11-29T23:59:00+07:00')?.toISOString()).toBe(
      '2026-11-29T16:59:00.000Z'
    );
    expect(parseExplicitOffsetIsoDate('2026-11-29T23:59:00')).toBeNull();
    expect(parseExplicitOffsetIsoDate('2026-02-30T12:00:00Z')).toBeNull();

    expect(parseCanonicalPositiveInt('1')).toBe(1);
    expect(parseCanonicalPositiveInt('0')).toBeNull();
    expect(parseCanonicalPositiveInt('01')).toBeNull();
    expect(parseCanonicalPositiveInt('1.5')).toBeNull();

    expect(
      validateCreateMilestoneBody({
        title: 'Valid',
        description: 'Valid description 123',
        dueDate: '2026-11-29T23:59:00Z',
        weightPercent: 50.5,
      }).valid
    ).toBe(false);

    expect(
      validateCreateMilestoneBody({
        title: 'Valid',
        description: 'Valid description 123',
        dueDate: '2026-11-29T23:59:00Z',
        weightPercent: 50,
        status: 'PUBLISHED',
      }).valid
    ).toBe(false);
  });

  it('S2-F04-T04 (unit): publish dueDate must be strictly greater than server now', () => {
    const now = new Date('2026-11-22T00:00:00.000Z');
    expect(validatePublishDueDate(new Date(now.getTime() - 1), now).valid).toBe(false);
    expect(validatePublishDueDate(new Date(now.getTime()), now).valid).toBe(false);
    expect(validatePublishDueDate(new Date(now.getTime() + 1), now).valid).toBe(true);
  });

  it('validates update, publish, and list query payloads', () => {
    expect(validateUpdateMilestoneBody({ expectedVersion: 1 }).valid).toBe(false);
    expect(validateUpdateMilestoneBody({ expectedVersion: 0, title: 'Valid' }).valid).toBe(false);
    expect(validateUpdateMilestoneBody({ expectedVersion: 1, title: 'Valid Title' }).valid).toBe(true);
    expect(validatePublishMilestoneBody({ expectedVersion: 2 }).valid).toBe(true);
    expect(validatePublishMilestoneBody({ expectedVersion: 2, extra: 1 }).valid).toBe(false);
    expect(validateListMilestonesQuery({ limit: '100', afterId: '5', status: 'PUBLISHED' }).valid).toBe(
      true
    );
    expect(validateListMilestonesQuery({ limit: '101' }).valid).toBe(false);
  });
});
