import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GradingConsole, { InstructorEvaluationDto } from './GradingConsole';

function okJson(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

const SAMPLE_SUBMISSION = {
  id: 42,
  version: 1,
  repoUrl: 'https://github.com/example/team-alpha',
  reportUrl: 'https://example.org/report-v1.pdf',
  releaseTag: 'v1.0.0',
  notes: 'Sprint 2 deliverable.',
};

const DRAFT_EVAL_V1: InstructorEvaluationDto = {
  id: 100,
  submissionId: 42,
  submissionVersion: 1,
  version: 1,
  draftRevision: 1,
  publishedDraftRevision: null,
  status: 'DRAFT',
  draft: {
    score: 85,
    feedback: 'Saved draft feedback.',
    draftRevision: 1,
    updatedById: 1,
    updatedAt: '2026-11-26T00:00:00.000Z',
  },
  published: null,
  publications: [],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('F-06 GradingConsole Component (S2-F06-T09)', () => {
  it('S2-F06-T09a: separates Save grading draft from Publish grade, disables duplicate actions, and preserves typed input on 409 conflict with reload reconcile', async () => {
    let getCount = 0;
    let putCount = 0;
    let resolveFirstPut!: (value: Response) => void;

    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (method === 'GET' && url.includes('/api/submissions/42/evaluation')) {
        getCount += 1;
        return okJson({
          evaluation: getCount === 1 ? null : { ...DRAFT_EVAL_V1, version: 2, draftRevision: 2 },
        });
      }
      if (method === 'PUT' && url === '/api/submissions/42/evaluation') {
        putCount += 1;
        if (putCount === 1) {
          return new Promise<Response>((resolve) => {
            resolveFirstPut = resolve;
          });
        }
        const body = JSON.parse(String(init?.body || '{}'));
        expect(body.expectedVersion).toBe(2);
        expect(body.score).toBe(92);
        expect(body.feedback).toBe('Preserved draft feedback after 409');
        return okJson({
          evaluation: {
            ...DRAFT_EVAL_V1,
            version: 3,
            draftRevision: 3,
            draft: {
              ...DRAFT_EVAL_V1.draft,
              score: 92,
              feedback: 'Preserved draft feedback after 409',
              draftRevision: 3,
            },
          },
        });
      }
      if (method === 'POST' && url === '/api/submissions/42/evaluation/publish') {
        return okJson({
          evaluation: {
            ...DRAFT_EVAL_V1,
            version: 4,
            draftRevision: 3,
            publishedDraftRevision: 3,
            status: 'PUBLISHED',
            published: {
              id: 1,
              score: 92,
              feedback: 'Preserved draft feedback after 409',
              submissionVersion: 1,
              draftRevision: 3,
              publishedAt: '2026-11-26T08:00:00.000Z',
            },
            publications: [
              {
                id: 1,
                score: 92,
                feedback: 'Preserved draft feedback after 409',
                submissionVersion: 1,
                draftRevision: 3,
                publishedAt: '2026-11-26T08:00:00.000Z',
              },
            ],
          },
        });
      }
      return okJson({});
    });
    vi.stubGlobal('fetch', fetchMock);

    const onPublished = vi.fn();
    render(
      <GradingConsole
        token="instr-token"
        submission={SAMPLE_SUBMISSION}
        sessionGeneration={1}
        getCurrentGeneration={() => 1}
        onUnauthorized={vi.fn()}
        onEvaluationPublished={onPublished}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('grading-save-draft-btn')).not.toBeDisabled()
    );
    // Publish is disabled before a draft exists
    expect(screen.getByTestId('grading-publish-btn')).toBeDisabled();

    fireEvent.change(screen.getByTestId('grading-score-input'), {
      target: { value: '92' },
    });
    fireEvent.change(screen.getByTestId('grading-feedback-input'), {
      target: { value: 'Preserved draft feedback after 409' },
    });

    fireEvent.click(screen.getByTestId('grading-save-draft-btn'));
    expect(screen.getByTestId('grading-save-draft-btn')).toBeDisabled();
    expect(screen.getByTestId('grading-save-draft-btn')).toHaveTextContent('Saving draft…');

    // Duplicate click while pending does not fire second PUT
    fireEvent.click(screen.getByTestId('grading-save-draft-btn'));
    expect(putCount).toBe(1);

    // Resolve with 409 conflict
    await act(async () => {
      resolveFirstPut(
        await okJson(
          {
            error: 'Evaluation has been modified by another request. Reload and reconcile.',
            code: 'GRADE_VERSION_CONFLICT',
          },
          409
        )
      );
    });

    expect(await screen.findByTestId('grading-error')).toHaveTextContent(
      'modified by another request'
    );
    expect(screen.getByTestId('grading-score-input')).toHaveValue(92);
    expect(screen.getByTestId('grading-feedback-input')).toHaveValue(
      'Preserved draft feedback after 409'
    );

    // Reconcile reloads latest server expectedVersion=2 while keeping typed draft
    fireEvent.click(screen.getByTestId('grading-reconcile-btn'));
    expect(await screen.findByTestId('grading-success')).toHaveTextContent(
      'Reloaded latest grade state (v2)'
    );
    expect(screen.getByTestId('grading-score-input')).toHaveValue(92);

    // Save draft now succeeds with expectedVersion=2 -> resource v3
    fireEvent.click(screen.getByTestId('grading-save-draft-btn'));
    expect(await screen.findByTestId('grading-success')).toHaveTextContent(
      'Not yet published to students'
    );
    expect(screen.getByTestId('grading-publish-btn')).not.toBeDisabled();

    // Explicit Publish grade
    fireEvent.click(screen.getByTestId('grading-publish-btn'));
    expect(await screen.findByTestId('grading-published-summary')).toHaveTextContent('92/100');
    expect(onPublished).toHaveBeenCalledTimes(1);
    // Publish button disables again once current draft is published
    expect(screen.getByTestId('grading-publish-btn')).toBeDisabled();
  });

  it('S2-F06-T09b: clears draft state and ignores delayed stale responses across session/submission switches', async () => {
    let resolveStaleGet!: (value: Response) => void;
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/api/submissions/42/evaluation')) {
        return new Promise<Response>((resolve) => {
          resolveStaleGet = resolve;
        });
      }
      return okJson({ evaluation: null });
    });
    vi.stubGlobal('fetch', fetchMock);

    let currentGen = 1;
    const { rerender } = render(
      <GradingConsole
        token="instr-a"
        submission={SAMPLE_SUBMISSION}
        sessionGeneration={1}
        getCurrentGeneration={() => currentGen}
        onUnauthorized={vi.fn()}
      />
    );

    // Switch session to generation 2 and submission 99 before submission 42's GET resolves
    currentGen = 2;
    rerender(
      <GradingConsole
        token="instr-b"
        submission={{ ...SAMPLE_SUBMISSION, id: 99, version: 2, releaseTag: 'v2.0.0' }}
        sessionGeneration={2}
        getCurrentGeneration={() => currentGen}
        onUnauthorized={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('grading-save-draft-btn')).not.toBeDisabled()
    );

    // Resolve stale response from session 1 with score 85 -> must NOT populate session 2's inputs
    await act(async () => {
      resolveStaleGet(await okJson({ evaluation: DRAFT_EVAL_V1 }));
    });

    expect(screen.getByTestId('grading-score-input')).toHaveValue(null);
    expect(screen.getByTestId('grading-feedback-input')).toHaveValue('');
  });

  it('S2-F06-T09c: disables Publish grade while visible inputs differ from the saved draft', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (method === 'GET' && url.includes('/api/submissions/42/evaluation')) {
        return okJson({ evaluation: DRAFT_EVAL_V1 });
      }
      if (method === 'PUT' && url === '/api/submissions/42/evaluation') {
        const body = JSON.parse(String(init?.body || '{}'));
        return okJson({
          evaluation: {
            ...DRAFT_EVAL_V1,
            version: 2,
            draftRevision: 2,
            draft: {
              ...DRAFT_EVAL_V1.draft,
              score: body.score,
              feedback: body.feedback,
              draftRevision: 2,
            },
          },
        });
      }
      return okJson({});
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <GradingConsole
        token="instr-token"
        submission={SAMPLE_SUBMISSION}
        sessionGeneration={1}
        getCurrentGeneration={() => 1}
        onUnauthorized={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('grading-publish-btn')).not.toBeDisabled()
    );
    expect(screen.getByTestId('grading-score-input')).toHaveValue(85);

    // Change visible score from 85 to 92 without saving -> Publish must disable immediately
    fireEvent.change(screen.getByTestId('grading-score-input'), {
      target: { value: '92' },
    });
    expect(screen.getByTestId('grading-publish-btn')).toBeDisabled();
    expect(screen.getByTestId('grading-unsaved-warning')).toBeInTheDocument();

    // Save draft with 92 -> Publish re-enables for the newly saved draft
    fireEvent.click(screen.getByTestId('grading-save-draft-btn'));
    await waitFor(() =>
      expect(screen.getByTestId('grading-publish-btn')).not.toBeDisabled()
    );
  });

  it('S2-F06-T09d: superseded submission recovery refreshes to the newer submission version and clears old draft', async () => {
    let getCalls = 0;
    const requestedGetUrls: string[] = [];
    const putBodies: Array<Record<string, unknown>> = [];

    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (method === 'GET' && url.startsWith('/api/submissions/42/evaluation')) {
        getCalls += 1;
        requestedGetUrls.push(url);
        if (getCalls === 1) {
          return okJson({ evaluation: DRAFT_EVAL_V1, currentSubmissionVersion: 1 });
        }
        return okJson({
          evaluation: null,
          currentSubmissionVersion: 2,
          currentSubmission: {
            ...SAMPLE_SUBMISSION,
            version: 2,
            releaseTag: 'v2.0.0',
            reportUrl: 'https://example.org/report-v2.pdf',
          },
        });
      }
      if (method === 'POST' && url === '/api/submissions/42/evaluation/publish') {
        return okJson(
          {
            error: 'Cannot publish grade for a superseded submission version.',
            code: 'STALE_SUBMISSION_VERSION',
          },
          409
        );
      }
      if (method === 'PUT' && url === '/api/submissions/42/evaluation') {
        const parsed = JSON.parse(String(init?.body || '{}'));
        putBodies.push(parsed);
        return okJson(
          {
            evaluation: {
              ...DRAFT_EVAL_V1,
              submissionVersion: 2,
              version: 1,
              draftRevision: 1,
              draft: {
                ...DRAFT_EVAL_V1.draft,
                score: parsed.score,
                feedback: parsed.feedback,
              },
            },
          },
          201
        );
      }
      return okJson({});
    });
    vi.stubGlobal('fetch', fetchMock);

    const onStale = vi.fn();
    render(
      <GradingConsole
        token="instr-token"
        submission={SAMPLE_SUBMISSION}
        sessionGeneration={1}
        getCurrentGeneration={() => 1}
        onUnauthorized={vi.fn()}
        onStaleSubmissionVersion={onStale}
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('grading-publish-btn')).not.toBeDisabled()
    );

    // Attempt to publish v1 after student submitted v2 -> 409 STALE_SUBMISSION_VERSION
    fireEvent.click(screen.getByTestId('grading-publish-btn'));
    expect(await screen.findByTestId('grading-error')).toHaveTextContent(
      'superseded submission version'
    );

    const reconcileBtn = screen.getByTestId('grading-reconcile-btn');
    expect(reconcileBtn).toHaveTextContent('Load newer submission version');
    fireEvent.click(reconcileBtn);

    expect(await screen.findByTestId('grading-success')).toHaveTextContent(
      'Loaded newer submission v2'
    );
    expect(onStale).toHaveBeenCalledTimes(1);
    // Recovery GET omits ?submissionVersion=1 so it fetches current v2
    expect(requestedGetUrls[1]).toBe('/api/submissions/42/evaluation');

    // Old v1 draft (85) is NOT transferred to v2; Publish is disabled until v2 is graded
    expect(screen.getByTestId('grading-score-input')).toHaveValue(null);
    expect(screen.getByTestId('grading-feedback-input')).toHaveValue('');
    expect(screen.getByTestId('grading-publish-btn')).toBeDisabled();
    expect(
      screen.getByText(/Instructor Grading — Submission v2 \(v2\.0\.0\)/)
    ).toBeInTheDocument();

    // New draft saved targets submissionVersion=2, expectedVersion=0
    fireEvent.change(screen.getByTestId('grading-score-input'), {
      target: { value: '95' },
    });
    fireEvent.change(screen.getByTestId('grading-feedback-input'), {
      target: { value: 'Fresh grade after reviewing v2 content.' },
    });
    fireEvent.click(screen.getByTestId('grading-save-draft-btn'));

    await waitFor(() => expect(putBodies).toHaveLength(1));
    expect(putBodies[0]).toMatchObject({
      submissionVersion: 2,
      expectedVersion: 0,
      score: 95,
    });
  });
});
