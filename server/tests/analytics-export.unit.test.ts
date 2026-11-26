import { describe, expect, it } from 'vitest';
import {
  computeCompletionRatePct,
  isMilestoneOverdue,
  parseCourseIdParam,
} from '../src/services/analyticsService';
import {
  formatGradebookCsv,
  GRADEBOOK_CSV_COLUMNS,
  isFormulaRiskText,
  neutralizeFormulaRisk,
  quoteCsvCell,
  sanitizeGradebookFilename,
} from '../src/services/gradebookExport';

describe('S3-F08 unit tests: analytics calculation boundaries and CSV formula neutralization', () => {
  it('S3-F08-T03 (S3-F08-AC03): computes completionRatePct rounded to 2 decimals and returns null when totalTeams=0', () => {
    expect(computeCompletionRatePct(0, 0)).toBeNull();
    expect(computeCompletionRatePct(0, 3)).toBe(0);
    expect(computeCompletionRatePct(1, 3)).toBe(33.33);
    expect(computeCompletionRatePct(2, 3)).toBe(66.67);
    expect(computeCompletionRatePct(3, 3)).toBe(100);
  });

  it('S3-F08-T05 (S3-F08-AC05): overdue boundary is false before and at exact dueDate equality, true at dueDate + 1ms', () => {
    const due = new Date('2026-12-01T10:00:00.000Z');
    expect(isMilestoneOverdue(due, new Date(due.getTime() - 1))).toBe(false);
    expect(isMilestoneOverdue(due, new Date(due.getTime()))).toBe(false);
    expect(isMilestoneOverdue(due, new Date(due.getTime() + 1))).toBe(true);
  });

  it('S3-F08-T06 (S3-F08-AC06): accepts only canonical positive int32 courseId strings', () => {
    for (const raw of ['0', '-1', '01', '1.0', '1e2', '2147483648', '', null, undefined, 1, ['1']]) {
      expect(parseCourseIdParam(raw)).toBeNull();
    }
    expect(parseCourseIdParam('1')).toBe(1);
    expect(parseCourseIdParam('2147483647')).toBe(2147483647);
  });

  it('S3-F08-T07 / T09 (S3-F08-AC07 / AC08): neutralizes ASCII, full-width, whitespace-prefixed, and control-prefixed formula strings with a single leading tab', () => {
    const risky = [
      '=SUM(A1:A2)',
      '+1+1',
      '-1+2',
      '@HYPERLINK("https://evil.example")',
      '＝1+1',
      '＋1+1',
      '－1+1',
      '＠CMD',
      '   =TRIMMED_EQ()',
      '\u000b\u000c +CONTROL_PLUS()',
      '\tLEADING_TAB',
      '\rLEADING_CR',
      '\nLEADING_LF',
    ];
    for (const sample of risky) {
      expect(isFormulaRiskText(sample)).toBe(true);
      expect(neutralizeFormulaRisk(sample)).toBe(`\t${sample}`);
    }

    const safe = ['', 'Team Alpha', 'ทีมสมชาย, "Alpha"', '100% Complete', 'Normal - Dash Inside'];
    for (const sample of safe) {
      expect(isFormulaRiskText(sample)).toBe(false);
      expect(neutralizeFormulaRisk(sample)).toBe(sample);
    }

    expect(quoteCsvCell('A "quoted", value\r\nline2')).toBe('"A ""quoted"", value\r\nline2"');
    expect(sanitizeGradebookFilename('CPE 334 / Sec 1', '2026-12-01T10:00:00.000Z')).toBe(
      'CPE-334-Sec-1-gradebook-2026-12-01.csv'
    );
  });

  it('S3-F08-T07 / T08 (S3-F08-AC07): formats UTF-8 BOM + CRLF quoted CSV for empty teams, no published milestones, and score 0 vs empty grade', () => {
    const emptyResult = formatGradebookCsv({
      courseCode: 'CPE334',
      generatedAtUtc: '2026-12-01T10:00:00.000Z',
      teams: [],
      publishedMilestones: [],
      submissionsByTeamAndMilestone: new Map(),
    });
    expect(emptyResult.csv).toBe(
      `\uFEFF${GRADEBOOK_CSV_COLUMNS.map((c) => `"${c}"`).join(',')}\r\n`
    );

    const map = new Map();
    map.set('1:10', {
      submissionId: 100,
      submissionVersion: 2,
      submittedAtUtc: '2026-12-01T09:00:00.000Z',
      lateStatus: 'ON_TIME' as const,
      publishedScore: 0,
      publishedAtUtc: '2026-12-01T09:30:00.000Z',
    });

    const zeroScoreResult = formatGradebookCsv({
      courseCode: 'CPE334',
      generatedAtUtc: '2026-12-01T10:00:00.000Z',
      teams: [{ teamId: 1, teamName: '=RiskyTeam', proposalStatus: 'APPROVED' }],
      publishedMilestones: [
        {
          milestoneId: 10,
          milestoneTitle: 'M1',
          dueDateUtc: '2026-12-05T16:59:00.000Z',
          weightPercent: 30,
        },
      ],
      submissionsByTeamAndMilestone: map,
    });
    const lines = zeroScoreResult.csv.slice(1).trimEnd().split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      '"CPE334","1","\t=RiskyTeam","APPROVED","10","M1","2026-12-05T16:59:00.000Z","30","100","2","2026-12-01T09:00:00.000Z","ON_TIME","0","2026-12-01T09:30:00.000Z"'
    );
  });
});
