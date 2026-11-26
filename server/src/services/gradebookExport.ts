export const GRADEBOOK_CSV_COLUMNS = [
  'courseCode',
  'teamId',
  'teamName',
  'proposalStatus',
  'milestoneId',
  'milestoneTitle',
  'dueDateUtc',
  'weightPercent',
  'submissionId',
  'submissionVersion',
  'submittedAtUtc',
  'lateStatus',
  'publishedScore',
  'publishedAtUtc',
] as const;

export interface GradebookTeamRowInput {
  teamId: number;
  teamName: string;
  proposalStatus: 'NONE' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
}

export interface GradebookMilestoneRowInput {
  milestoneId: number;
  milestoneTitle: string;
  dueDateUtc: string;
  weightPercent: number | null;
}

export interface GradebookSubmissionCellInput {
  submissionId: number;
  submissionVersion: number;
  submittedAtUtc: string;
  lateStatus: 'ON_TIME' | 'LATE' | 'UNKNOWN';
  publishedScore: number | null;
  publishedAtUtc: string | null;
}

export interface GradebookSnapshotInput {
  courseCode: string;
  generatedAtUtc: string;
  teams: GradebookTeamRowInput[];
  publishedMilestones: GradebookMilestoneRowInput[];
  submissionsByTeamAndMilestone: Map<string, GradebookSubmissionCellInput>;
}

export function isFormulaRiskText(value: string): boolean {
  if (!value) return false;
  if (/^[\t\r\n]/.test(value)) return true;
  const trimmedLeading = value.replace(/^[\s\u0000-\u001f\u007f-\u009f]+/u, '');
  if (!trimmedLeading) return false;
  const normalized = trimmedLeading.normalize('NFKC');
  return /^[=+\-@]/.test(normalized);
}

export function neutralizeFormulaRisk(value: string): string {
  if (!value) return '';
  return isFormulaRiskText(value) ? `\t${value}` : value;
}

export function quoteCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function sanitizeGradebookFilename(courseCode: string, generatedAtUtc: string): string {
  const safeCode = courseCode.trim().replace(/[^A-Za-z0-9._-]+/g, '-') || 'course';
  const datePart = generatedAtUtc.slice(0, 10);
  return `${safeCode}-gradebook-${datePart}.csv`;
}

export function formatGradebookCsv(snapshot: GradebookSnapshotInput): { csv: string; filename: string } {
  const headerLine = GRADEBOOK_CSV_COLUMNS.map((col) => quoteCsvCell(col)).join(',');
  const lines: string[] = [headerLine];
  const safeCourseCode = neutralizeFormulaRisk(snapshot.courseCode);

  if (snapshot.teams.length > 0) {
    if (snapshot.publishedMilestones.length === 0) {
      for (const team of snapshot.teams) {
        const cells = [
          safeCourseCode,
          String(team.teamId),
          neutralizeFormulaRisk(team.teamName),
          team.proposalStatus,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ];
        lines.push(cells.map(quoteCsvCell).join(','));
      }
    } else {
      for (const team of snapshot.teams) {
        const safeTeamName = neutralizeFormulaRisk(team.teamName);
        for (const ms of snapshot.publishedMilestones) {
          const safeMilestoneTitle = neutralizeFormulaRisk(ms.milestoneTitle);
          const key = `${team.teamId}:${ms.milestoneId}`;
          const sub = snapshot.submissionsByTeamAndMilestone.get(key);
          const cells = [
            safeCourseCode,
            String(team.teamId),
            safeTeamName,
            team.proposalStatus,
            String(ms.milestoneId),
            safeMilestoneTitle,
            ms.dueDateUtc,
            ms.weightPercent === null || ms.weightPercent === undefined ? '' : String(ms.weightPercent),
            sub ? String(sub.submissionId) : '',
            sub ? String(sub.submissionVersion) : '',
            sub ? sub.submittedAtUtc : '',
            sub ? sub.lateStatus : '',
            sub && sub.publishedScore !== null && sub.publishedScore !== undefined ? String(sub.publishedScore) : '',
            sub && sub.publishedAtUtc ? sub.publishedAtUtc : '',
          ];
          lines.push(cells.map(quoteCsvCell).join(','));
        }
      }
    }
  }

  return {
    csv: `\uFEFF${lines.join('\r\n')}\r\n`,
    filename: sanitizeGradebookFilename(snapshot.courseCode, snapshot.generatedAtUtc),
  };
}
