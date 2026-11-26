import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PeerEvaluation from './PeerEvaluation';

const response = (data: unknown, status = 200) => ({ ok: status < 400, status, json: async () => data } as Response);
const team = { id: 1, name: 'Alpha', courseId: 1, members: [{ id: 1, name: 'Author' }, { id: 2, name: 'Teammate' }] };
const props = { token: 'token-a', userId: 1, userRole: 'STUDENT' as const, teams: [team], sessionGeneration: 1,
  getCurrentGeneration: () => 1, onUnauthorized: vi.fn() };
const evaluation = (id = 10, comment = 'My confidential saved feedback', version = 1, evaluateeId = 2) => ({ id, teamId: 1,
  milestoneId: 1, evaluatorId: 1, evaluateeId, rating: 4, comment, version,
  createdAt: '2026-11-25T12:00:00Z', updatedAt: '2026-11-25T13:00:00Z',
  evaluator: { id: 1, fullName: 'Author' }, evaluatee: { id: evaluateeId, fullName: 'Teammate' } });
const page = (records: unknown[] = [], canEvaluate = true, nextAfterId: number | null = null) => response({
  evaluations: records, nextAfterId, eligibility: { canEvaluate, reason: canEvaluate ? 'Milestone complete.' : 'Wait for completion and a saved submission.',
    dueDate: '2026-11-25T12:00:00Z', serverTime: '2026-11-25T13:00:00Z' } });
const milestones = () => response({ milestones: [{ id: 1, title: 'Completed milestone' }, { id: 2, title: 'Another milestone' }], nextAfterId: null });
function fill() {
  fireEvent.change(screen.getByLabelText('Teammate to evaluate'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Contribution rating (1–5)'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Confidential comment (optional)'), { target: { value: 'My unsaved private draft' } });
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('S3-F07-T14/AC12: confidential peer UI, failures and context isolation', () => {
  it('allows retry when milestone choices fail before any milestone can be selected', async () => {
    let choices = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('peer-evaluations')) return page();
      if (++choices === 1) throw new Error('Offline milestone catalogue');
      return milestones();
    }));
    render(<PeerEvaluation {...props} />);
    await screen.findByText('Offline milestone catalogue');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh peer evaluations' }));
    await screen.findByTestId('peer-form'); expect(screen.queryByTestId('peer-error')).not.toBeInTheDocument();
  });
  it('uses server eligibility, excludes self and shows saved outgoing feedback with Bangkok time', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('peer-evaluations') ? page([evaluation()], false) : milestones()));
    render(<PeerEvaluation {...props} />);
    await screen.findByTestId('peer-record-10');
    expect(screen.getByTestId('peer-save')).toBeDisabled();
    expect(screen.getByLabelText('Teammate to evaluate')).toBeDisabled();
    expect(screen.queryByRole('option', { name: 'Author' })).not.toBeInTheDocument();
    expect(screen.getByText('My confidential saved feedback')).toBeInTheDocument();
    expect(screen.getByTestId('peer-record-10')).toHaveTextContent('20:00');
    expect(screen.getByTestId('peer-record-10')).toHaveTextContent(/GMT\+7|ICT/);
  });

  it.each([400, 0])('preserves the draft on rejection/network %s and blocks duplicate writes/context switches', async status => {
    let finish!: (r: Response) => void, reject!: (error: Error) => void;
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return new Promise<Response>((resolve, fail) => { finish = resolve; reject = fail; });
      return url.includes('peer-evaluations') ? page() : milestones();
    });
    vi.stubGlobal('fetch', fetch); render(<PeerEvaluation {...props} />); await screen.findByTestId('peer-form'); fill();
    fireEvent.submit(screen.getByTestId('peer-form')); fireEvent.submit(screen.getByTestId('peer-form'));
    expect(screen.getByTestId('peer-save')).toBeDisabled(); expect(screen.getByLabelText('Peer evaluation milestone')).toBeDisabled();
    expect(screen.getByLabelText('Peer evaluation team')).toBeDisabled();
    const writes = fetch.mock.calls.filter(call => call[1]?.method === 'PUT'); expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0][1]!.body as string)).toEqual({ expectedVersion: 0, rating: 5, comment: 'My unsaved private draft' });
    await act(async () => { if (status) finish(response({ error: 'Rejected feedback' }, status)); else reject(new Error('Offline')); });
    await screen.findByTestId('peer-error'); expect(screen.getByLabelText('Confidential comment (optional)')).toHaveValue('My unsaved private draft');
    expect(screen.queryByTestId('peer-success')).not.toBeInTheDocument();
  });

  it('loads the latest conflict version without replacing a typed draft or automatically resubmitting', async () => {
    let reads = 0; const writes: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        writes.push(JSON.parse(init.body as string));
        return writes.length === 1 ? response({ error: 'Newer version exists', code: 'PEER_EVALUATION_VERSION_CONFLICT' }, 409)
          : response({ evaluation: evaluation(10, 'My unsaved private draft', 4) });
      }
      if (!url.includes('peer-evaluations')) return milestones();
      return page([evaluation(10, 'Server feedback', ++reads === 1 ? 1 : 3)]);
    }));
    render(<PeerEvaluation {...props} />); await screen.findByTestId('peer-form'); fill();
    fireEvent.submit(screen.getByTestId('peer-form')); await screen.findByTestId('peer-error');
    expect(screen.getByTestId('peer-save')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Load latest evaluation version' }));
    await waitFor(() => expect(screen.getByTestId('peer-save')).toBeEnabled());
    expect(screen.getByLabelText('Confidential comment (optional)')).toHaveValue('My unsaved private draft');
    expect(screen.getByLabelText('Contribution rating (1–5)')).toHaveValue('5'); expect(writes).toHaveLength(1);
    fireEvent.submit(screen.getByTestId('peer-form'));
    await screen.findByTestId('peer-success'); expect(writes[1]).toMatchObject({ expectedVersion: 3, rating: 5, comment: 'My unsaved private draft' });
  });

  it('loads all outgoing pages before selecting an existing pair, avoiding an accidental duplicate create', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (!url.includes('peer-evaluations')) return milestones();
      return url.includes('afterId=11') ? page([evaluation(12, 'Second-page saved feedback', 7)]) : page([evaluation(11, 'Other outgoing', 1, 3)], true, 11);
    }));
    render(<PeerEvaluation {...props} />); await screen.findByTestId('peer-form');
    fireEvent.change(screen.getByLabelText('Teammate to evaluate'), { target: { value: '2' } });
    expect(screen.getByLabelText('Confidential comment (optional)')).toHaveValue('Second-page saved feedback');
    expect(screen.getByText('Editing your saved evaluation · Version 7')).toBeInTheDocument();
  });

  it('clears private draft and discards an old mutation after identity/generation changes', async () => {
    let finish!: (r: Response) => void; let generation = 1;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return new Promise<Response>(resolve => { finish = resolve; });
      if (!url.includes('peer-evaluations')) return milestones();
      return (init?.headers as Record<string, string>).Authorization === 'Bearer token-b' ? page() : page([evaluation()]);
    }));
    const getGeneration = () => generation;
    const view = render(<PeerEvaluation {...props} getCurrentGeneration={getGeneration} />);
    await screen.findByTestId('peer-form'); fill(); fireEvent.submit(screen.getByTestId('peer-form'));
    generation = 2;
    view.rerender(<PeerEvaluation {...props} token="token-b" userId={2} sessionGeneration={2} getCurrentGeneration={getGeneration} />);
    await screen.findByTestId('peer-empty');
    await act(async () => finish(response({ evaluation: evaluation(20, 'Stale private A feedback') }, 201)));
    expect(screen.getByLabelText('Confidential comment (optional)')).toHaveValue('');
    expect(screen.queryByText('Stale private A feedback')).not.toBeInTheDocument();
    expect(screen.queryByText('My confidential saved feedback')).not.toBeInTheDocument();
    expect(screen.queryByTestId('peer-success')).not.toBeInTheDocument();
  });

  it('resets instructor pagination on team switch and discards stale feedback even after switching back', async () => {
    let finish!: (r: Response) => void;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (!url.includes('peer-evaluations')) return milestones();
      if (url.includes('afterId=10')) return new Promise<Response>(resolve => { finish = resolve; });
      return url.includes('/teams/2/') ? page([evaluation(20, 'Beta confidential')]) : page([evaluation()], true, 10);
    }));
    render(<PeerEvaluation {...props} userRole="INSTRUCTOR" teams={[team, { ...team, id: 2, name: 'Beta' }]} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Load more evaluations' }));
    fireEvent.change(screen.getByLabelText('Peer evaluation team'), { target: { value: '2' } });
    await screen.findByText('Beta confidential');
    fireEvent.change(screen.getByLabelText('Peer evaluation team'), { target: { value: '1' } });
    await screen.findByText('My confidential saved feedback');
    await act(async () => finish(page([evaluation(11, 'Stale first Alpha request')])));
    expect(screen.queryByText('Stale first Alpha request')).not.toBeInTheDocument();
    expect(screen.queryByText('Beta confidential')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load more evaluations' })).toBeEnabled();
    expect(screen.queryByTestId('peer-form')).not.toBeInTheDocument();
  });

  it('ignores a delayed old milestone read and resets the draft on milestone selection', async () => {
    let finish!: (r: Response) => void;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (!url.includes('peer-evaluations')) return milestones();
      return url.includes('/milestones/1/') ? new Promise<Response>(resolve => { finish = resolve; }) : page();
    }));
    render(<PeerEvaluation {...props} />);
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    fireEvent.change(screen.getByLabelText('Peer evaluation milestone'), { target: { value: '2' } });
    await screen.findByTestId('peer-empty');
    await act(async () => finish(page([evaluation(10, 'Old milestone private feedback')])));
    expect(screen.queryByText('Old milestone private feedback')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Confidential comment (optional)')).toHaveValue('');
  });

  it('reports 401 to the session owner without announcing a successful save', async () => {
    const expired = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('peer-evaluations') ? response({ error: 'Expired', code: 'SESSION_EXPIRED' }, 401) : milestones()));
    render(<PeerEvaluation {...props} onUnauthorized={expired} />);
    await waitFor(() => expect(expired).toHaveBeenCalledWith('Expired', 'SESSION_EXPIRED'));
    expect(screen.queryByTestId('peer-success')).not.toBeInTheDocument();
  });
});
