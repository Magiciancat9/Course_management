import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import AnalyticsDashboard, { CourseAnalyticsData } from './AnalyticsDashboard';

const courses = [
  { id: 1, code: 'CPE334', name: 'Software Engineering', term: '1/2026' },
  { id: 2, code: 'CPE399', name: 'Capstone Project', term: '1/2026' },
];

const baseProps = {
  token: 'inst-token-1',
  userId: 10,
  userRole: 'INSTRUCTOR' as const,
  courses,
  sessionGeneration: 1,
  getCurrentGeneration: () => 1,
  onUnauthorized: vi.fn(),
  onNavigateToSection: vi.fn(),
};

function makeAnalyticsPayload(overrides: Partial<CourseAnalyticsData> = {}): CourseAnalyticsData {
  return {
    course: { id: 1, code: 'CPE334', name: 'Software Engineering', term: '1/2026' },
    generatedAt: '2026-12-01T10:00:00.000Z',
    totals: {
      totalTeams: 3,
      publishedMilestones: 1,
      submittedDeliverables: 2,
      gradedDeliverables: 1,
      ungradedDeliverables: 1,
      flaggedTeams: 1,
    },
    proposalStates: {
      NONE: 1,
      DRAFT: 0,
      SUBMITTED: 0,
      APPROVED: 1,
      REVISION_REQUESTED: 1,
    },
    milestoneProgress: [
      {
        milestoneId: 11,
        title: 'Sprint 2 Release Milestone',
        dueDate: '2026-11-29T16:59:00.000Z',
        weightPercent: 30,
        submittedTeams: 2,
        totalTeams: 3,
        completionRatePct: 66.67,
        onTimeCount: 1,
        lateCount: 1,
        unknownLateCount: 0,
        gradedCount: 1,
        ungradedCount: 1,
      },
    ],
    ungraded: [
      {
        submissionId: 501,
        submissionVersion: 2,
        teamId: 1,
        teamName: 'Team Alpha',
        milestoneId: 11,
        milestoneTitle: 'Sprint 2 Release Milestone',
        submittedAt: '2026-11-30T08:00:00.000Z',
        lateStatus: 'LATE',
        hasDraftEvaluation: true,
      },
    ],
    flaggedTeams: [
      {
        teamId: 2,
        teamName: 'Team Beta',
        proposalStatus: 'REVISION_REQUESTED',
        reasons: ['REVISION_REQUESTED', 'OVERDUE_MISSING_SUBMISSION'],
        overdueMilestoneIds: [11],
        lateMilestoneIds: [],
      },
    ],
    ...overrides,
  };
}

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

const csvResponse = (csv = '\uFEFF"courseCode"\r\n"CPE334"\r\n', filename = 'CPE334-gradebook-2026-12-01.csv') =>
  ({
    ok: true,
    status: 200,
    headers: new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }),
    text: async () => csv,
    json: async () => ({}),
  }) as unknown as Response;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('S3-F08-T11 (S3-F08-AC10): Instructor AnalyticsDashboard UI, export, error/retry, and session isolation', () => {
  it('shows loading state without fabricated zeros, then renders real snapshot, Bangkok time, and workflow navigation actions', async () => {
    let resolveLoad!: (res: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveLoad = resolve;
          })
      )
    );
    const onNavigate = vi.fn();
    render(<AnalyticsDashboard {...baseProps} onNavigateToSection={onNavigate} />);

    expect(screen.getByTestId('analytics-loading')).toHaveTextContent('Loading course analytics…');
    expect(screen.queryByTestId('analytics-totals')).not.toBeInTheDocument();

    await act(async () => {
      resolveLoad(jsonResponse(makeAnalyticsPayload()));
    });

    expect(screen.queryByTestId('analytics-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId('analytics-generated-at')).toHaveTextContent('17:00');
    expect(screen.getByTestId('analytics-total-teams')).toHaveTextContent('3');
    expect(screen.getByTestId('proposal-state-NONE')).toHaveTextContent('1');
    expect(screen.getByTestId('proposal-state-APPROVED')).toHaveTextContent('1');
    expect(screen.getByTestId('proposal-state-REVISION_REQUESTED')).toHaveTextContent('1');
    expect(screen.getByTestId('analytics-milestone-row-11')).toHaveTextContent('2 / 3');
    expect(screen.getByTestId('analytics-milestone-row-11')).toHaveTextContent('66.67%');
    expect(screen.getByTestId('analytics-ungraded-row-501')).toHaveTextContent('v2');
    expect(screen.getByTestId('analytics-ungraded-row-501')).toHaveTextContent('Draft saved (unpublished)');
    expect(screen.getByTestId('analytics-flagged-row-2')).toHaveTextContent(
      'REVISION_REQUESTED, OVERDUE_MISSING_SUBMISSION'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open in Milestones' }));
    expect(onNavigate).toHaveBeenCalledWith('milestones', 'section-milestones', {
      courseId: 1,
      milestoneId: 11,
      milestoneTitle: 'Sprint 2 Release Milestone',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Grade submission' }));
    expect(onNavigate).toHaveBeenCalledWith('milestones', 'section-milestones', {
      courseId: 1,
      milestoneId: 11,
      milestoneTitle: 'Sprint 2 Release Milestone',
      teamId: 1,
      submissionId: 501,
      submissionVersion: 2,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Inspect workflow' }));
    expect(onNavigate).toHaveBeenCalledWith('review', 'section-review', {
      courseId: 1,
      teamId: 2,
      milestoneId: 11,
    });
  });

  it('renders empty course state with explicit no-teams message and Not applicable (0 / 0) completion rate', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          makeAnalyticsPayload({
            totals: {
              totalTeams: 0,
              publishedMilestones: 1,
              submittedDeliverables: 0,
              gradedDeliverables: 0,
              ungradedDeliverables: 0,
              flaggedTeams: 0,
            },
            proposalStates: { NONE: 0, DRAFT: 0, SUBMITTED: 0, APPROVED: 0, REVISION_REQUESTED: 0 },
            milestoneProgress: [
              {
                milestoneId: 12,
                title: 'Zero Team Milestone',
                dueDate: '2026-12-05T16:59:00.000Z',
                weightPercent: 20,
                submittedTeams: 0,
                totalTeams: 0,
                completionRatePct: null,
                onTimeCount: 0,
                lateCount: 0,
                unknownLateCount: 0,
                gradedCount: 0,
                ungradedCount: 0,
              },
            ],
            ungraded: [],
            flaggedTeams: [],
          })
        )
      )
    );

    render(<AnalyticsDashboard {...baseProps} />);
    await screen.findByTestId('analytics-no-teams');
    expect(screen.getByTestId('analytics-milestone-row-12')).toHaveTextContent('0 / 0');
    expect(screen.getByTestId('analytics-milestone-row-12')).toHaveTextContent('Not applicable (0 / 0)');
    expect(screen.getByTestId('analytics-ungraded-empty')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-flagged-empty')).toBeInTheDocument();
  });

  it('displays error without fabricated metrics on fetch failure and recovers on Refresh analytics retry', async () => {
    let attempts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        if (++attempts === 1) {
          throw new Error('Analytics service temporarily unavailable');
        }
        return jsonResponse(makeAnalyticsPayload());
      })
    );

    render(<AnalyticsDashboard {...baseProps} />);
    const alert = await screen.findByTestId('analytics-error');
    expect(alert).toHaveTextContent('Analytics service temporarily unavailable');
    expect(screen.queryByTestId('analytics-totals')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('analytics-refresh'));
    await screen.findByTestId('analytics-totals');
    expect(screen.queryByTestId('analytics-error')).not.toBeInTheDocument();
  });

  it('prevents duplicate CSV exports while pending and announces download upon completion', async () => {
    let resolveCsv!: (res: Response) => void;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/gradebook.csv')) {
        return new Promise<Response>((resolve) => {
          resolveCsv = resolve;
        });
      }
      return jsonResponse(makeAnalyticsPayload());
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AnalyticsDashboard {...baseProps} />);
    await screen.findByTestId('analytics-totals');

    const exportBtn = screen.getByTestId('analytics-export-csv');
    fireEvent.click(exportBtn);
    fireEvent.click(exportBtn);

    expect(exportBtn).toBeDisabled();
    expect(exportBtn).toHaveTextContent('Exporting CSV…');
    const csvCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/gradebook.csv'));
    expect(csvCalls).toHaveLength(1);

    await act(async () => {
      resolveCsv(csvResponse());
    });

    await screen.findByTestId('analytics-export-success');
    expect(screen.getByTestId('analytics-export-success')).toHaveTextContent(
      'Exported gradebook CSV (CPE334-gradebook-2026-12-01.csv).'
    );
    expect(screen.getByTestId('analytics-export-csv')).toBeEnabled();
  });

  it('discards delayed analytics and CSV export responses after session generation or course switch', async () => {
    let resolveDelayedCsv!: (res: Response) => void;
    let currentGen = 1;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/gradebook.csv')) {
          return new Promise<Response>((resolve) => {
            resolveDelayedCsv = resolve;
          });
        }
        return jsonResponse(makeAnalyticsPayload());
      })
    );

    const view = render(<AnalyticsDashboard {...baseProps} getCurrentGeneration={() => currentGen} />);
    await screen.findByTestId('analytics-totals');

    fireEvent.click(screen.getByTestId('analytics-export-csv'));
    expect(screen.getByTestId('analytics-export-csv')).toBeDisabled();

    // Simulate logout / account switch to a student session
    currentGen = 2;
    view.rerender(
      <AnalyticsDashboard
        {...baseProps}
        token="student-token-2"
        userId={99}
        userRole="STUDENT"
        sessionGeneration={2}
        getCurrentGeneration={() => currentGen}
      />
    );

    expect(screen.queryByTestId('analytics-dashboard')).not.toBeInTheDocument();

    await act(async () => {
      resolveDelayedCsv(csvResponse());
    });
    expect(screen.queryByTestId('analytics-export-success')).not.toBeInTheDocument();
  });

  it('delegates 401 responses on analytics or CSV export to onUnauthorized without announcing success', async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'Token expired', code: 'SESSION_EXPIRED' }, 401))
    );

    render(<AnalyticsDashboard {...baseProps} onUnauthorized={onUnauthorized} />);
    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledWith('Token expired', 'SESSION_EXPIRED'));
    expect(screen.queryByTestId('analytics-totals')).not.toBeInTheDocument();
  });

  it('does not call onUnauthorized when a CSV export 401 body resolves after an identity switch', async () => {
    let resolve401Body!: (body: unknown) => void;
    let currentGen = 1;
    const onUnauthorized = vi.fn();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/gradebook.csv')) {
          return {
            ok: false,
            status: 401,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: () =>
              new Promise((resolve) => {
                resolve401Body = resolve;
              }),
          } as unknown as Response;
        }
        return jsonResponse(makeAnalyticsPayload());
      })
    );

    const view = render(
      <AnalyticsDashboard
        {...baseProps}
        onUnauthorized={onUnauthorized}
        getCurrentGeneration={() => currentGen}
      />
    );
    await screen.findByTestId('analytics-totals');

    fireEvent.click(screen.getByTestId('analytics-export-csv'));
    await waitFor(() => expect(resolve401Body).toBeTypeOf('function'));

    // User switches accounts while the 401 error body is still pending
    currentGen = 2;
    view.rerender(
      <AnalyticsDashboard
        {...baseProps}
        token="inst-token-2"
        userId={22}
        userRole="INSTRUCTOR"
        sessionGeneration={2}
        getCurrentGeneration={() => currentGen}
        onUnauthorized={onUnauthorized}
      />
    );

    await act(async () => {
      resolve401Body({ error: 'Stale token expired', code: 'SESSION_EXPIRED' });
    });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('preserves leading UTF-8 BOM bytes (EF BB BF) in the downloaded CSV Blob', async () => {
    let capturedBlob: Blob | null = null;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((obj: Blob | MediaSource) => {
      capturedBlob = obj as Blob;
      return 'blob:cpms-csv-bom-test';
    });
    URL.revokeObjectURL = vi.fn();

    try {
      // Use a real WHATWG Response whose .text() would strip the UTF-8 BOM
      const rawCsvWithBom = '\uFEFF"courseCode","teamName"\r\n"CPE334","ทีมอัลฟ่า"\r\n';
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: RequestInfo | URL) => {
          const url = String(input);
          if (url.endsWith('/gradebook.csv')) {
            return new Response(rawCsvWithBom, {
              status: 200,
              headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="CPE334-gradebook-2026-12-01.csv"',
              },
            });
          }
          return jsonResponse(makeAnalyticsPayload());
        })
      );

      render(<AnalyticsDashboard {...baseProps} />);
      await screen.findByTestId('analytics-totals');

      fireEvent.click(screen.getByTestId('analytics-export-csv'));
      await screen.findByTestId('analytics-export-success');

      expect(capturedBlob).not.toBeNull();
      const rawBuffer =
        typeof capturedBlob!.arrayBuffer === 'function'
          ? await capturedBlob!.arrayBuffer()
          : await new Promise<ArrayBuffer>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as ArrayBuffer);
              reader.onerror = () => reject(reader.error);
              reader.readAsArrayBuffer(capturedBlob!);
            });
      const downloadedBytes = new Uint8Array(rawBuffer);
      expect(Array.from(downloadedBytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
      const decodedText = new TextDecoder('utf-8', { ignoreBOM: true }).decode(downloadedBytes);
      expect(decodedText).toContain('"ทีมอัลฟ่า"');
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it('switches MilestoneManager to Course B and opens the targeted submission for grading when multiple courses exist', async () => {
    localStorage.setItem('course_pms_token', 'inst-token-1');

    const courseBMilestone = {
      id: 22,
      courseId: 2,
      title: 'Capstone Final Deliverable',
      description: 'Capstone final report and repository release tag',
      dueDate: '2026-12-10T16:59:00.000Z',
      weightPercent: 50,
      status: 'PUBLISHED' as const,
      publishedAt: '2026-11-15T10:00:00.000Z',
      version: 1,
    };

    const courseBSubmission = {
      id: 802,
      teamId: 20,
      version: 3,
      repoUrl: 'https://github.com/example/capstone-omega',
      reportUrl: 'https://example.com/capstone-omega.pdf',
      releaseTag: 'v3.0.0-capstone',
      notes: 'Course B Team Omega submission',
      submittedAt: '2026-12-01T09:00:00.000Z',
      dueDateSnapshot: '2026-12-10T16:59:00.000Z',
      lateStatus: 'ON_TIME' as const,
      publishedEvaluation: null,
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/auth/me') {
        return jsonResponse({
          user: {
            id: 10,
            email: 'instructor@cpe.kmutt.ac.th',
            fullName: 'Dr. Instructor',
            studentCode: null,
            role: 'INSTRUCTOR',
          },
        });
      }
      if (url === '/api/courses') {
        return jsonResponse({
          courses: [
            { id: 1, code: 'CPE334', name: 'Software Engineering', term: '1/2026', maxTeamSize: 4 },
            { id: 2, code: 'CPE399', name: 'Capstone Project', term: '1/2026', maxTeamSize: 4 },
          ],
        });
      }
      if (url === '/api/teams') {
        return jsonResponse({
          teams: [
            {
              id: 1,
              name: 'Team Alpha',
              courseId: 1,
              course: { id: 1, code: 'CPE334', name: 'Software Engineering', term: '1/2026', maxTeamSize: 4 },
              members: [],
              proposal: { id: 101, teamId: 1, title: 'Course A Proposal', status: 'APPROVED', revisionCount: 1, updatedAt: '2026-11-20T00:00:00.000Z' },
            },
            {
              id: 20,
              name: 'Team Omega',
              courseId: 2,
              course: { id: 2, code: 'CPE399', name: 'Capstone Project', term: '1/2026', maxTeamSize: 4 },
              members: [],
              proposal: { id: 202, teamId: 20, title: 'Course B Proposal', status: 'APPROVED', revisionCount: 1, updatedAt: '2026-11-20T00:00:00.000Z' },
            },
          ],
        });
      }
      if (url === '/api/courses/1/milestones') {
        return jsonResponse({
          milestones: [
            {
              id: 11,
              courseId: 1,
              title: 'Sprint 2 Release Milestone',
              description: 'Course A milestone description',
              dueDate: '2026-11-29T16:59:00.000Z',
              weightPercent: 30,
              status: 'PUBLISHED',
              publishedAt: '2026-11-01T00:00:00.000Z',
              version: 1,
            },
          ],
          nextAfterId: null,
        });
      }
      if (url === '/api/courses/2/milestones') {
        return jsonResponse({
          milestones: [courseBMilestone],
          nextAfterId: null,
        });
      }
      if (url === '/api/courses/1/analytics') {
        return jsonResponse(makeAnalyticsPayload());
      }
      if (url === '/api/courses/2/analytics') {
        return jsonResponse(
          makeAnalyticsPayload({
            course: { id: 2, code: 'CPE399', name: 'Capstone Project', term: '1/2026' },
            milestoneProgress: [
              {
                milestoneId: 22,
                title: 'Capstone Final Deliverable',
                dueDate: '2026-12-10T16:59:00.000Z',
                weightPercent: 50,
                submittedTeams: 1,
                totalTeams: 1,
                completionRatePct: 100,
                onTimeCount: 1,
                lateCount: 0,
                unknownLateCount: 0,
                gradedCount: 0,
                ungradedCount: 1,
              },
            ],
            ungraded: [
              {
                submissionId: 802,
                submissionVersion: 3,
                teamId: 20,
                teamName: 'Team Omega',
                milestoneId: 22,
                milestoneTitle: 'Capstone Final Deliverable',
                submittedAt: '2026-12-01T09:00:00.000Z',
                lateStatus: 'ON_TIME',
                hasDraftEvaluation: false,
              },
            ],
            flaggedTeams: [],
          })
        );
      }
      if (url === '/api/courses/2/milestones/22/submissions') {
        return jsonResponse({
          submissions: [
            {
              ...courseBSubmission,
              team: { id: 20, name: 'Team Omega' },
            },
          ],
          nextAfterId: null,
        });
      }
      if (url === '/api/teams/20/milestones/22/submission') {
        return jsonResponse({ submission: courseBSubmission });
      }
      if (url === '/api/teams/20/milestones/22/submission/versions') {
        return jsonResponse({ versions: [courseBSubmission], nextAfterId: null });
      }
      if (url.startsWith('/api/submissions/802/evaluation')) {
        return jsonResponse({ evaluation: null, history: [], nextAfterId: null });
      }
      if (url.includes('/tasks')) {
        return jsonResponse({ tasks: [], nextAfterId: null });
      }
      if (url.includes('/peer-evaluations')) {
        return jsonResponse({ members: [], submittedEvaluations: [], summary: [] });
      }
      return jsonResponse({});
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await screen.findByTestId('analytics-course-select');

    // MilestoneManager initially defaults to Course A (id = 1)
    expect(screen.getByTestId('milestone-course-select')).toHaveValue('1');

    // Switch Analytics to Course B (id = 2)
    fireEvent.change(screen.getByTestId('analytics-course-select'), { target: { value: '2' } });
    await screen.findByTestId('analytics-ungraded-row-802');

    // Click "Grade submission" on Course B's ungraded submission
    fireEvent.click(screen.getByRole('button', { name: 'Grade submission' }));

    // MilestoneManager must switch to Course B and open Course B's milestone submission and grading console
    await waitFor(() => {
      expect(screen.getByTestId('milestone-course-select')).toHaveValue('2');
    });
    expect(await screen.findByTestId('submission-workspace')).toHaveTextContent(
      'Capstone Final Deliverable — submissions'
    );
    expect(await screen.findByTestId('submission-detail')).toHaveTextContent('v3.0.0-capstone');
    expect(await screen.findByTestId('grading-console')).toHaveTextContent(
      'Instructor Grading — Submission v3 (v3.0.0-capstone)'
    );

    localStorage.removeItem('course_pms_token');
  });
});
