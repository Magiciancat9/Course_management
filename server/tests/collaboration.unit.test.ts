import { describe, expect, it } from 'vitest';
import { validateTaskBody } from '../src/services/taskService';

describe('S3-F07-T02: contract trim/UTF-16 title boundaries', () => {
  it.each(['  abc  ', '😀x', '😀'.repeat(60)])('accepts trimmed valid UTF-16 boundary', title => {
    const result = validateTaskBody({ expectedVersion: 0, title, sprintNumber: 3 }, true);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.title).toBe(title.trim());
  });
  it.each(['😀', '😀'.repeat(61), '  '])('rejects outside the 3-120 UTF-16 range', title => {
    expect(validateTaskBody({ expectedVersion: 0, title, sprintNumber: 3 }, true).ok).toBe(false);
  });
});
