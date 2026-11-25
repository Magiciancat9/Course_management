import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SubmissionWorkspace from './SubmissionWorkspace';

const response = (data: unknown, status = 200) => ({ ok: status < 400, status, json: async () => data } as Response);
const missing = () => response({ error: 'No submission', code: 'SUBMISSION_NOT_FOUND' }, 404);
const value = (version = 1) => ({ id: 10, teamId: 1, version, repoUrl: 'https://example.org/saved',
  reportUrl: 'https://example.org/report.pdf', releaseTag: `v${version}`, notes: 'Saved notes',
  submittedAt: '2026-11-25T00:00:00Z', dueDateSnapshot: '2026-11-29T16:59:00Z', lateStatus: 'ON_TIME', publishedEvaluation: null });
const props = { token: 'a-token', userRole: 'STUDENT' as const, courseId: 1,
  milestone: { id: 3, title: 'Sprint 2', status: 'PUBLISHED' as const },
  ownTeam: { id: 1, proposalStatus: 'APPROVED' }, sessionGeneration: 1,
  getCurrentGeneration: () => 1, onUnauthorized: vi.fn() };
const field = (name: string) => screen.getByTestId(`submission-${name}-input`);
function fill() {
  fireEvent.change(field('repo'), { target: { value: 'https://example.org/my-draft' } });
  fireEvent.change(field('report'), { target: { value: 'https://example.org/my-report.pdf' } });
  fireEvent.change(field('tag'), { target: { value: 'my-release' } });
  fireEvent.change(field('notes'), { target: { value: 'My draft notes' } });
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('F-05 real form state and session boundaries', () => {
  it.each([400, 409, 0])('S2-F05-T10: pending prevents duplicates and %s retains all draft fields', async status => {
    let finish!: (value: Response) => void;
    let reject!: (cause: Error) => void;
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return new Promise<Response>((resolve, fail) => { finish = resolve; reject = fail; });
      return missing();
    });
    vi.stubGlobal('fetch', fetch);
    render(<SubmissionWorkspace {...props} />);
    await screen.findByTestId('submission-empty'); fill();
    fireEvent.click(screen.getByTestId('submission-save-btn'));
    expect(screen.getByTestId('submission-save-btn')).toBeDisabled();
    fireEvent.click(screen.getByTestId('submission-save-btn'));
    expect(fetch.mock.calls.filter(call => call[1]?.method === 'PUT')).toHaveLength(1);
    await act(async () => {
      if (status === 0) reject(new Error('Offline'));
      else finish(response({ error: 'Rejected; draft retained', code: status === 409 ? 'SUBMISSION_VERSION_CONFLICT' : 'VALIDATION_ERROR' }, status));
    });
    expect(await screen.findByTestId('submission-error')).toBeInTheDocument();
    expect(field('repo')).toHaveValue('https://example.org/my-draft');
    expect(field('report')).toHaveValue('https://example.org/my-report.pdf');
    expect(field('tag')).toHaveValue('my-release');
    expect(field('notes')).toHaveValue('My draft notes');
    expect(screen.queryByTestId('submission-success')).not.toBeInTheDocument();
  });

  it('S2-F05-T10: conflict reconcile keeps typed content and resubmits with current server version', async () => {
    let gets = 0;
    const puts: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        puts.push(JSON.parse(init.body as string));
        return puts.length === 1 ? response({ error: 'New version exists', code: 'SUBMISSION_VERSION_CONFLICT' }, 409) :
          response({ submission: { ...value(3), repoUrl: puts[1].repoUrl, releaseTag: puts[1].releaseTag } });
      }
      if (url.endsWith('/versions')) return response({ versions: [], nextAfterId: null });
      return response({ submission: value(++gets === 1 ? 1 : 2) });
    }));
    render(<SubmissionWorkspace {...props} />);
    await screen.findByTestId('submission-form'); await waitFor(() => expect(screen.getByTestId('submission-save-btn')).toBeEnabled());
    fill(); fireEvent.click(screen.getByTestId('submission-save-btn'));
    fireEvent.click(await screen.findByTestId('submission-reconcile-btn'));
    await waitFor(() => expect(screen.getByTestId('submission-save-btn')).toBeEnabled());
    expect(field('tag')).toHaveValue('my-release');
    fireEvent.click(screen.getByTestId('submission-save-btn'));
    expect(await screen.findByTestId('submission-success')).toHaveTextContent('version 3');
    expect(puts.map(p => p.expectedVersion)).toEqual([1, 2]);
    expect(puts[1].releaseTag).toBe('my-release');
  });

  it.each(['DRAFT', 'SUBMITTED', 'REVISION_REQUESTED'])('S2-F05-T10: %s teams get a truthful read-only prerequisite', async proposalStatus => {
    vi.stubGlobal('fetch', vi.fn(async () => missing()));
    render(<SubmissionWorkspace {...props} ownTeam={{ id: 1, proposalStatus }} />);
    await screen.findByTestId('submission-empty');
    expect(screen.getByTestId('submission-prerequisite')).toHaveTextContent('must be approved');
    expect(screen.queryByTestId('submission-form')).not.toBeInTheDocument();
  });

  it('S2-F05-T12: a late A save cannot expose data or clear B pending/draft state', async () => {
    let generation = 1;
    let finishA!: (value: Response) => void;
    let finishB!: (value: Response) => void;
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return new Promise<Response>(resolve => {
        if (String((init.headers as Record<string, string>).Authorization).includes('a-token')) finishA = resolve;
        else finishB = resolve;
      });
      return missing();
    });
    vi.stubGlobal('fetch', fetch);
    const current = () => generation;
    const view = render(<SubmissionWorkspace {...props} getCurrentGeneration={current} />);
    await screen.findByTestId('submission-empty'); fill(); fireEvent.click(screen.getByTestId('submission-save-btn'));
    generation = 2;
    view.rerender(<SubmissionWorkspace {...props} token="b-token" ownTeam={{ id: 2, proposalStatus: 'APPROVED' }}
      sessionGeneration={2} getCurrentGeneration={current} />);
    await screen.findByTestId('submission-empty');
    expect(field('repo')).toHaveValue('');
    fill(); fireEvent.change(field('notes'), { target: { value: 'B private draft' } });
    fireEvent.click(screen.getByTestId('submission-save-btn'));
    await act(async () => { finishA(response({ submission: { ...value(), notes: 'A PRIVATE RESPONSE' } }, 201)); });
    expect(screen.queryByText('A PRIVATE RESPONSE')).not.toBeInTheDocument();
    expect(field('notes')).toHaveValue('B private draft');
    expect(screen.getByTestId('submission-save-btn')).toBeDisabled();
    await act(async () => { finishB(response({ error: 'B validation error' }, 400)); });
    expect(await screen.findByTestId('submission-error')).toHaveTextContent('B validation error');
  });

  it('S2-F05-T12: active 401 invokes the session boundary callback', async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => response({ error: 'Revoked', code: 'TOKEN_REVOKED' }, 401)));
    render(<SubmissionWorkspace {...props} onUnauthorized={onUnauthorized} />);
    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledWith('Revoked', 'TOKEN_REVOKED'));
    expect(screen.queryByTestId('submission-form')).not.toBeInTheDocument();
  });

  it('S2-F05-T10: instructors retrieve saved team versions without a student mutation form', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/submissions')) return response({ submissions: [{ ...value(), team: { id: 1, name: 'Team Alpha' } }], nextAfterId: null });
      if (url.endsWith('/versions')) return response({ versions: [{ ...value(), id: 20 }], nextAfterId: null });
      return response({ submission: value() });
    }));
    render(<SubmissionWorkspace {...props} userRole="INSTRUCTOR" ownTeam={null} />);
    fireEvent.click(await screen.findByTestId('submission-team-1'));
    await screen.findByTestId('submission-history');
    expect(screen.getAllByTestId('submission-saved')[0]).toHaveTextContent('Saved version 1');
    expect(screen.queryByTestId('submission-form')).not.toBeInTheDocument();
  });
});
