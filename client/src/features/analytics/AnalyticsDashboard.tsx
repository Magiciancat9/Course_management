import React, { useEffect, useRef, useState } from 'react';

export interface AnalyticsCourseOption {
  id: number;
  code: string;
  name: string;
  term: string;
}

export type ProposalStateBucket = 'NONE' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
export type FlagReason = 'REVISION_REQUESTED' | 'OVERDUE_MISSING_SUBMISSION' | 'LATE_SUBMISSION';

export interface CourseAnalyticsData {
  course: {
    id: number;
    code: string;
    name: string;
    term: string;
  };
  generatedAt: string;
  totals: {
    totalTeams: number;
    publishedMilestones: number;
    submittedDeliverables: number;
    gradedDeliverables: number;
    ungradedDeliverables: number;
    flaggedTeams: number;
  };
  proposalStates: Record<ProposalStateBucket, number>;
  milestoneProgress: Array<{
    milestoneId: number;
    title: string;
    dueDate: string;
    weightPercent: number | null;
    submittedTeams: number;
    totalTeams: number;
    completionRatePct: number | null;
    onTimeCount: number;
    lateCount: number;
    unknownLateCount: number;
    gradedCount: number;
    ungradedCount: number;
  }>;
  ungraded: Array<{
    submissionId: number;
    submissionVersion: number;
    teamId: number;
    teamName: string;
    milestoneId: number;
    milestoneTitle: string;
    submittedAt: string;
    lateStatus: 'ON_TIME' | 'LATE' | 'UNKNOWN';
    hasDraftEvaluation: boolean;
  }>;
  flaggedTeams: Array<{
    teamId: number;
    teamName: string;
    proposalStatus: ProposalStateBucket;
    reasons: FlagReason[];
    overdueMilestoneIds: number[];
    lateMilestoneIds: number[];
  }>;
}

export interface AnalyticsWorkflowTarget {
  courseId: number;
  milestoneId?: number;
  milestoneTitle?: string;
  teamId?: number;
  submissionId?: number;
  submissionVersion?: number;
}

export interface AnalyticsDashboardProps {
  token: string;
  userId: number;
  userRole: 'STUDENT' | 'INSTRUCTOR';
  courses: AnalyticsCourseOption[];
  sessionGeneration: number;
  getCurrentGeneration: () => number;
  onUnauthorized: (message: string, code?: string) => void;
  onNavigateToSection?: (
    navKey: 'overview' | 'team' | 'proposal' | 'teams' | 'review' | 'milestones' | 'tasks' | 'peers' | 'analytics',
    sectionId?: string,
    target?: AnalyticsWorkflowTarget
  ) => void;
}

function formatBangkokTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function extractFilename(contentDisposition: string | null, courseCode: string, generatedAt: string): string {
  if (contentDisposition) {
    const match = /filename="([^"]+)"/i.exec(contentDisposition);
    if (match?.[1]) return match[1];
  }
  const safeCode = courseCode.trim().replace(/[^A-Za-z0-9._-]+/g, '-') || 'course';
  return `${safeCode}-gradebook-${generatedAt.slice(0, 10)}.csv`;
}

export default function AnalyticsDashboard(props: AnalyticsDashboardProps) {
  const {
    token,
    userId,
    userRole,
    courses,
    sessionGeneration,
    getCurrentGeneration,
    onUnauthorized,
    onNavigateToSection,
  } = props;

  const [courseId, setCourseId] = useState<number>(courses[0]?.id ?? 0);
  const [analytics, setAnalytics] = useState<CourseAnalyticsData | null>(null);
  const [loadedContext, setLoadedContext] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');

  const contextKey = `${token}:${userId}:${userRole}:${sessionGeneration}:${courseId}`;
  const currentContextRef = useRef(contextKey);
  currentContextRef.current = contextKey;
  const epochRef = useRef(0);
  const loadSeqRef = useRef(0);
  const exportInFlightRef = useRef(false);
  const loadAbortRef = useRef<AbortController | null>(null);
  const exportAbortRef = useRef<AbortController | null>(null);

  const isContextValid = (capturedContext: string, capturedEpoch: number) =>
    currentContextRef.current === capturedContext &&
    epochRef.current === capturedEpoch &&
    getCurrentGeneration() === sessionGeneration;

  useEffect(() => {
    if (courses.length > 0 && !courses.some((c) => c.id === courseId)) {
      setCourseId(courses[0].id);
    }
  }, [courses, courseId]);

  async function loadAnalytics() {
    if (userRole !== 'INSTRUCTOR' || !courseId) {
      setLoading(false);
      return;
    }
    const capturedContext = contextKey;
    const capturedEpoch = epochRef.current;
    const seq = ++loadSeqRef.current;
    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${courseId}/analytics`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const body = await response.json();
      if (!isContextValid(capturedContext, capturedEpoch) || seq !== loadSeqRef.current || controller.signal.aborted) {
        return;
      }
      if (response.status === 401) {
        onUnauthorized(body.error || 'Your session has expired.', body.code);
        return;
      }
      if (!response.ok) {
        throw new Error(body.error || 'Unable to load course analytics.');
      }
      if (!body.course || !body.totals || !body.proposalStates || !Array.isArray(body.milestoneProgress)) {
        throw new Error('Unexpected analytics payload.');
      }
      setAnalytics(body as CourseAnalyticsData);
      setLoadedContext(capturedContext);
    } catch (err) {
      if (isContextValid(capturedContext, capturedEpoch) && seq === loadSeqRef.current && !controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Unable to load course analytics.');
      }
    } finally {
      if (isContextValid(capturedContext, capturedEpoch) && seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    epochRef.current++;
    loadAbortRef.current?.abort();
    exportAbortRef.current?.abort();
    exportInFlightRef.current = false;
    setAnalytics(null);
    setLoadedContext('');
    setExporting(false);
    setError('');
    setExportSuccess('');
    if (userRole === 'INSTRUCTOR' && courseId) {
      void loadAnalytics();
    } else {
      setLoading(false);
    }
    return () => {
      epochRef.current++;
      loadAbortRef.current?.abort();
      exportAbortRef.current?.abort();
      exportInFlightRef.current = false;
    };
  }, [contextKey]);

  async function handleExportCsv() {
    if (exportInFlightRef.current || !courseId || userRole !== 'INSTRUCTOR') return;
    const capturedContext = contextKey;
    const capturedEpoch = epochRef.current;
    exportAbortRef.current?.abort();
    const controller = new AbortController();
    exportAbortRef.current = controller;
    exportInFlightRef.current = true;
    setExporting(true);
    setError('');
    setExportSuccess('');

    try {
      const response = await fetch(`/api/courses/${courseId}/gradebook.csv`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!isContextValid(capturedContext, capturedEpoch) || controller.signal.aborted) return;

      if (response.status === 401) {
        let errMsg = 'Your session has expired.';
        let errCode: string | undefined;
        try {
          const errJson = await response.json();
          errMsg = errJson.error || errMsg;
          errCode = errJson.code;
        } catch {
          // ignore
        }
        if (!isContextValid(capturedContext, capturedEpoch) || controller.signal.aborted) return;
        onUnauthorized(errMsg, errCode);
        return;
      }

      if (!response.ok) {
        let errMsg = 'Unable to export course gradebook.';
        try {
          const errJson = await response.json();
          errMsg = errJson.error || errMsg;
        } catch {
          // ignore
        }
        if (!isContextValid(capturedContext, capturedEpoch) || controller.signal.aborted) return;
        throw new Error(errMsg);
      }

      let csvBytes: Uint8Array;
      if (typeof response.arrayBuffer === 'function') {
        const rawBuffer = await response.arrayBuffer();
        csvBytes = new Uint8Array(rawBuffer);
      } else if (typeof response.blob === 'function') {
        const rawBlob = await response.blob();
        csvBytes = new Uint8Array(await rawBlob.arrayBuffer());
      } else {
        const csvText = await response.text();
        csvBytes = new TextEncoder().encode(csvText);
      }
      if (!isContextValid(capturedContext, capturedEpoch) || controller.signal.aborted) return;

      // Ensure leading UTF-8 BOM (0xEF 0xBB 0xBF) is preserved in the downloaded file bytes
      const hasUtf8Bom =
        csvBytes.length >= 3 && csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf;
      if (!hasUtf8Bom) {
        const prefixed = new Uint8Array(csvBytes.length + 3);
        prefixed.set([0xef, 0xbb, 0xbf], 0);
        prefixed.set(csvBytes, 3);
        csvBytes = prefixed;
      }

      const filename = extractFilename(
        response.headers.get('Content-Disposition'),
        analytics?.course.code || courses.find((c) => c.id === courseId)?.code || 'course',
        analytics?.generatedAt || new Date().toISOString()
      );

      if (typeof window !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const blob = new Blob([csvBytes as unknown as BlobPart], { type: 'text/csv;charset=utf-8;' });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (typeof URL.revokeObjectURL === 'function') {
          URL.revokeObjectURL(objectUrl);
        }
      }

      setExportSuccess(`Exported gradebook CSV (${filename}).`);
    } catch (err) {
      if (isContextValid(capturedContext, capturedEpoch) && !controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Unable to export course gradebook.');
      }
    } finally {
      if (isContextValid(capturedContext, capturedEpoch)) {
        exportInFlightRef.current = false;
        setExporting(false);
      }
    }
  }

  if (userRole !== 'INSTRUCTOR') {
    return null;
  }

  const ready = loadedContext === contextKey && analytics !== null && !loading;

  return (
    <section
      id="section-analytics"
      className="cpms-card mt-4"
      aria-labelledby="analytics-heading"
      data-testid="analytics-dashboard"
    >
      <div className="cpms-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h2 id="analytics-heading" className="h4 fw-bold mb-1">
            Instructor Analytics &amp; Gradebook Export
          </h2>
          <p className="cpms-muted mb-0">
            Coherent course snapshot of proposal states, milestone submission rates, current-version ungraded queue, and flagged teams.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="cpms-btn cpms-btn-secondary"
            data-testid="analytics-refresh"
            disabled={loading || exporting || !courseId}
            onClick={() => {
              setExportSuccess('');
              void loadAnalytics();
            }}
          >
            Refresh analytics
          </button>
          <button
            type="button"
            className="cpms-btn cpms-btn-primary"
            data-testid="analytics-export-csv"
            disabled={loading || exporting || !courseId}
            onClick={() => void handleExportCsv()}
          >
            {exporting ? 'Exporting CSV…' : 'Export gradebook CSV'}
          </button>
        </div>
      </div>

      <div className="cpms-card-body">
        {courses.length === 0 ? (
          <p data-testid="analytics-no-courses">No courses are available for analytics.</p>
        ) : (
          <>
            <div className="row g-3 align-items-end mb-3">
              <div className="col-md-6">
                <label className="cpms-label" htmlFor="analytics-course">
                  Analytics course
                </label>
                <select
                  id="analytics-course"
                  data-testid="analytics-course-select"
                  className="cpms-input"
                  value={courseId}
                  disabled={loading || exporting}
                  onChange={(e) => setCourseId(Number(e.target.value))}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name} ({c.term})
                    </option>
                  ))}
                </select>
              </div>
              {ready && analytics && (
                <div className="col-md-6 text-md-end">
                  <p className="cpms-muted mb-0" data-testid="analytics-generated-at">
                    Course: <strong>{analytics.course.code}</strong> · Snapshot as of{' '}
                    <strong>{formatBangkokTime(analytics.generatedAt)}</strong>
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div role="alert" className="alert alert-danger" data-testid="analytics-error">
                {error}
              </div>
            )}
            {exportSuccess && ready && (
              <p role="status" className="alert alert-success" data-testid="analytics-export-success">
                {exportSuccess}
              </p>
            )}

            {loading && !ready ? (
              <p role="status" data-testid="analytics-loading">
                Loading course analytics…
              </p>
            ) : (
              ready &&
              analytics && (
                <>
                  {/* Summary metrics */}
                  <div className="row g-3 mb-4" data-testid="analytics-totals">
                    <div className="col-6 col-lg-2">
                      <div className="border rounded-3 p-3 h-100">
                        <div className="cpms-muted small">Registered Teams</div>
                        <div className="h4 fw-bold mb-0" data-testid="analytics-total-teams">
                          {analytics.totals.totalTeams}
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-2">
                      <div className="border rounded-3 p-3 h-100">
                        <div className="cpms-muted small">Published Milestones</div>
                        <div className="h4 fw-bold mb-0" data-testid="analytics-published-milestones">
                          {analytics.totals.publishedMilestones}
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-2">
                      <div className="border rounded-3 p-3 h-100">
                        <div className="cpms-muted small">Current Submissions</div>
                        <div className="h4 fw-bold mb-0" data-testid="analytics-submitted-deliverables">
                          {analytics.totals.submittedDeliverables}
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-2">
                      <div className="border rounded-3 p-3 h-100">
                        <div className="cpms-muted small">Published Grades</div>
                        <div className="h4 fw-bold mb-0" data-testid="analytics-graded-deliverables">
                          {analytics.totals.gradedDeliverables}
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-2">
                      <div className="border rounded-3 p-3 h-100">
                        <div className="cpms-muted small">Ungraded Queue</div>
                        <div className="h4 fw-bold mb-0" data-testid="analytics-ungraded-deliverables">
                          {analytics.totals.ungradedDeliverables}
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-2">
                      <div className="border rounded-3 p-3 h-100">
                        <div className="cpms-muted small">Flagged Teams</div>
                        <div className="h4 fw-bold mb-0" data-testid="analytics-flagged-count">
                          {analytics.totals.flaggedTeams}
                        </div>
                      </div>
                    </div>
                  </div>

                  {analytics.totals.totalTeams === 0 && (
                    <p className="alert alert-secondary" data-testid="analytics-no-teams">
                      No registered teams in this course. Completion rates are not applicable (0 / 0 teams).
                    </p>
                  )}

                  {/* Proposal state distribution */}
                  <div className="mb-4" data-testid="analytics-proposal-states">
                    <h3 className="h5">Proposal State Distribution</h3>
                    <div className="row g-2">
                      {(
                        [
                          ['NONE', 'No Proposal (NONE)'],
                          ['DRAFT', 'Draft (DRAFT)'],
                          ['SUBMITTED', 'Submitted (SUBMITTED)'],
                          ['APPROVED', 'Approved (APPROVED)'],
                          ['REVISION_REQUESTED', 'Revision Requested (REVISION_REQUESTED)'],
                        ] as const
                      ).map(([bucket, label]) => (
                        <div className="col-6 col-md-4 col-lg" key={bucket}>
                          <div className="border rounded-3 p-2">
                            <div className="small cpms-muted">{label}</div>
                            <div className="fw-bold" data-testid={`proposal-state-${bucket}`}>
                              {analytics.proposalStates[bucket]}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Per-milestone progress */}
                  <div className="mb-4" data-testid="analytics-milestone-progress">
                    <h3 id="analytics-milestones-caption" className="h5">
                      Published Milestone Submission Progress
                    </h3>
                    {analytics.milestoneProgress.length === 0 ? (
                      <p data-testid="analytics-no-milestones">
                        No published milestones in this course. Draft milestones are excluded from progress and gradebook export.
                      </p>
                    ) : (
                      <div
                        tabIndex={0}
                        role="region"
                        aria-labelledby="analytics-milestones-caption"
                        className="table-responsive"
                      >
                        <table className="table align-middle mb-0">
                          <caption className="visually-hidden">
                            Published milestone submission rates and grading progress
                          </caption>
                          <thead>
                            <tr>
                              <th scope="col">Milestone</th>
                              <th scope="col">Due Date (Asia/Bangkok)</th>
                              <th scope="col">Weight</th>
                              <th scope="col">Submitted / Total Teams</th>
                              <th scope="col">Completion Rate</th>
                              <th scope="col">Timeliness</th>
                              <th scope="col">Grading Status</th>
                              <th scope="col">Workflow</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.milestoneProgress.map((ms) => (
                              <tr key={ms.milestoneId} data-testid={`analytics-milestone-row-${ms.milestoneId}`}>
                                <th scope="row">{ms.title}</th>
                                <td>{formatBangkokTime(ms.dueDate)}</td>
                                <td>{ms.weightPercent !== null ? `${ms.weightPercent}%` : '—'}</td>
                                <td>
                                  {ms.submittedTeams} / {ms.totalTeams}
                                </td>
                                <td>
                                  {ms.completionRatePct === null
                                    ? 'Not applicable (0 / 0)'
                                    : `${ms.completionRatePct.toFixed(2)}%`}
                                </td>
                                <td>
                                  On time: {ms.onTimeCount} · Late: {ms.lateCount} · Unknown: {ms.unknownLateCount}
                                </td>
                                <td>
                                  {ms.gradedCount} graded / {ms.ungradedCount} ungraded
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="cpms-btn cpms-btn-secondary btn-sm"
                                    onClick={() =>
                                      onNavigateToSection?.('milestones', 'section-milestones', {
                                        courseId: analytics.course.id,
                                        milestoneId: ms.milestoneId,
                                        milestoneTitle: ms.title,
                                      })
                                    }
                                  >
                                    Open in Milestones
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Current-version ungraded queue */}
                  <div className="mb-4" data-testid="analytics-ungraded-queue">
                    <h3 id="analytics-ungraded-caption" className="h5">
                      Current-Version Ungraded Queue
                    </h3>
                    {analytics.ungraded.length === 0 ? (
                      <p data-testid="analytics-ungraded-empty">
                        No current-version submissions are awaiting grade publication.
                      </p>
                    ) : (
                      <div
                        tabIndex={0}
                        role="region"
                        aria-labelledby="analytics-ungraded-caption"
                        className="table-responsive"
                      >
                        <table className="table align-middle mb-0">
                          <caption className="visually-hidden">
                            Current submitted deliverables without a published grade for the current version
                          </caption>
                          <thead>
                            <tr>
                              <th scope="col">Team</th>
                              <th scope="col">Milestone</th>
                              <th scope="col">Content Version</th>
                              <th scope="col">Submitted (Asia/Bangkok)</th>
                              <th scope="col">Lateness</th>
                              <th scope="col">Draft State</th>
                              <th scope="col">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.ungraded.map((item) => (
                              <tr key={item.submissionId} data-testid={`analytics-ungraded-row-${item.submissionId}`}>
                                <th scope="row">{item.teamName}</th>
                                <td>{item.milestoneTitle}</td>
                                <td>v{item.submissionVersion}</td>
                                <td>{formatBangkokTime(item.submittedAt)}</td>
                                <td>{item.lateStatus}</td>
                                <td>{item.hasDraftEvaluation ? 'Draft saved (unpublished)' : 'Not evaluated'}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="cpms-btn cpms-btn-secondary btn-sm"
                                    onClick={() =>
                                      onNavigateToSection?.('milestones', 'section-milestones', {
                                        courseId: analytics.course.id,
                                        milestoneId: item.milestoneId,
                                        milestoneTitle: item.milestoneTitle,
                                        teamId: item.teamId,
                                        submissionId: item.submissionId,
                                        submissionVersion: item.submissionVersion,
                                      })
                                    }
                                  >
                                    Grade submission
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Flagged teams */}
                  <div data-testid="analytics-flagged-teams">
                    <h3 id="analytics-flagged-caption" className="h5">
                      Flagged Teams Requiring Attention
                    </h3>
                    {analytics.flaggedTeams.length === 0 ? (
                      <p data-testid="analytics-flagged-empty">No teams are currently flagged.</p>
                    ) : (
                      <div
                        tabIndex={0}
                        role="region"
                        aria-labelledby="analytics-flagged-caption"
                        className="table-responsive"
                      >
                        <table className="table align-middle mb-0">
                          <caption className="visually-hidden">
                            Teams flagged for proposal revision, overdue missing submission, or late submission
                          </caption>
                          <thead>
                            <tr>
                              <th scope="col">Team</th>
                              <th scope="col">Proposal Status</th>
                              <th scope="col">Flag Reasons</th>
                              <th scope="col">Workflow</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.flaggedTeams.map((team) => (
                              <tr key={team.teamId} data-testid={`analytics-flagged-row-${team.teamId}`}>
                                <th scope="row">{team.teamName}</th>
                                <td>{team.proposalStatus}</td>
                                <td>{team.reasons.join(', ')}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="cpms-btn cpms-btn-secondary btn-sm"
                                    onClick={() => {
                                      const isRevision = team.reasons.includes('REVISION_REQUESTED');
                                      const targetMilestoneId =
                                        team.lateMilestoneIds[0] ?? team.overdueMilestoneIds[0];
                                      onNavigateToSection?.(
                                        isRevision ? 'review' : 'milestones',
                                        isRevision ? 'section-review' : 'section-milestones',
                                        {
                                          courseId: analytics.course.id,
                                          teamId: team.teamId,
                                          ...(targetMilestoneId ? { milestoneId: targetMilestoneId } : {}),
                                        }
                                      );
                                    }}
                                  >
                                    Inspect workflow
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )
            )}
          </>
        )}
      </div>
    </section>
  );
}
