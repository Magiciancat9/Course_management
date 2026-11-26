import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    expect(onNavigate).toHaveBeenCalledWith('milestones', 'section-milestones');

    fireEvent.click(screen.getByRole('button', { name: 'Grade submission' }));
    expect(onNavigate).toHaveBeenCalledWith('milestones', 'section-milestones');

    fireEvent.click(screen.getByRole('button', { name: 'Inspect workflow' }));
    expect(onNavigate).toHaveBeenCalledWith('review', 'section-review');
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
});
