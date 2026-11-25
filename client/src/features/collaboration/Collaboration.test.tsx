import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TaskBoard from './TaskBoard';

const response = (data: unknown, status = 200) => ({ ok: status < 400, status, json: async () => data } as Response);
const task = (id = 10, title = 'Private Alpha task', version = 1) => ({ id, teamId: 1, title, description: 'Saved details',
  sprintNumber: 3, status: 'TODO', assigneeId: 2, milestoneId: null, version });
const team = { id: 1, name: 'Alpha', courseId: 1, proposalStatus: 'APPROVED', members: [{ id: 1, name: 'Leader' }, { id: 2, name: 'Teammate' }] };
const props = { token: 'token-a', userRole: 'STUDENT' as const, teams: [team], sessionGeneration: 1,
  getCurrentGeneration: () => 1, onUnauthorized: vi.fn() };
const page = (tasks: unknown[] = [], nextAfterId: number | null = null) => response({ tasks, nextAfterId });
const milestones = () => response({ milestones: [], nextAfterId: null });
function fill(title = 'My unsaved task') {
  fireEvent.change(screen.getByLabelText('Task title'), { target: { value: title } });
  fireEvent.change(screen.getByLabelText('Task description'), { target: { value: 'My typed description' } });
  fireEvent.change(screen.getByLabelText('Assign to'), { target: { value: '2' } });
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('S3-F07-T07/AC06: accessible task board and session boundaries', () => {
  it.each([400, 0])('retains the draft on %s, disables duplicates and derives member assignment', async status => {
    let finish!: (r: Response) => void, reject!: (e: Error) => void;
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return new Promise<Response>((resolve, fail) => { finish = resolve; reject = fail; });
      return url.includes('/milestones') ? milestones() : page();
    });
    vi.stubGlobal('fetch', fetch); render(<TaskBoard {...props} />);
    await screen.findByTestId('task-form'); fill();
    fireEvent.click(screen.getByTestId('task-save')); fireEvent.click(screen.getByTestId('task-save'));
    expect(screen.getByTestId('task-save')).toBeDisabled(); expect(screen.getByLabelText('Project team')).toBeDisabled();
    const calls = fetch.mock.calls.filter(c => c[1]?.method === 'POST'); expect(calls).toHaveLength(1);
    expect(JSON.parse(calls[0][1]!.body as string)).toMatchObject({ expectedVersion: 0, assigneeId: 2, sprintNumber: 3, status: 'TODO' });
    await act(async () => { if (status) finish(response({ error: 'Rejected task' }, status)); else reject(new Error('Offline')); });
    expect(await screen.findByTestId('task-error')).toBeInTheDocument();
    expect(screen.getByLabelText('Task title')).toHaveValue('My unsaved task');
    expect(screen.getByLabelText('Task description')).toHaveValue('My typed description');
    expect(screen.queryByTestId('task-success')).not.toBeInTheDocument();
  });

  it('reconciles conflict version while retaining all typed fields and explicitly saving again', async () => {
    const writes: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        writes.push(JSON.parse(init.body as string));
        return writes.length === 1 ? response({ error: 'A newer version exists', code: 'TASK_VERSION_CONFLICT' }, 409) : response({ task: task(10, 'My unsaved task', 4) });
      }
      if (url.includes('/milestones')) return milestones();
      if (url.includes('limit=1')) return page([task(10, 'New server title', 3)]);
      return page([task()]);
    }));
    render(<TaskBoard {...props} />); await screen.findByText('Private Alpha task');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Private Alpha task' })); fill();
    fireEvent.change(screen.getByLabelText('Task status'), { target: { value: 'DONE' } });
    fireEvent.click(screen.getByTestId('task-save'));
    await screen.findByTestId('task-error'); expect(screen.getByTestId('task-save')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Load latest task version' }));
    await waitFor(() => expect(screen.getByTestId('task-save')).toBeEnabled());
    expect(screen.getByLabelText('Task title')).toHaveValue('My unsaved task');
    expect(screen.getByLabelText('Task status')).toHaveValue('DONE');
    fireEvent.click(screen.getByTestId('task-save')); await waitFor(() => expect(writes).toHaveLength(2));
    expect(writes[1]).toMatchObject({ expectedVersion: 3, title: 'My unsaved task', description: 'My typed description', status: 'DONE', assigneeId: 2 });
  });

  it('discards pending A mutations and clears drafts/private tasks at a B session boundary', async () => {
    let finish!: (r: Response) => void; let generation = 1;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return new Promise<Response>(resolve => { finish = resolve; });
      if (url.includes('/milestones')) return milestones();
      return (init?.headers as Record<string, string>)?.Authorization === 'Bearer token-b' ? page() : page([task()]);
    }));
    const getGeneration = () => generation;
    const view = render(<TaskBoard {...props} getCurrentGeneration={getGeneration} />);
    await screen.findByText('Private Alpha task'); fill(); fireEvent.click(screen.getByTestId('task-save'));
    generation = 2; view.rerender(<TaskBoard {...props} token="token-b" sessionGeneration={2} getCurrentGeneration={getGeneration} />);
    await screen.findByTestId('task-empty'); expect(screen.getByLabelText('Task title')).toHaveValue('');
    await act(async () => finish(response({ task: task(99, 'Stale A saved task') }, 201)));
    expect(screen.queryByText('Private Alpha task')).not.toBeInTheDocument();
    expect(screen.queryByText('Stale A saved task')).not.toBeInTheDocument();
    expect(screen.queryByTestId('task-success')).not.toBeInTheDocument(); expect(screen.getByTestId('task-save')).toBeEnabled();
  });

  it('resets pending pagination on team switch and discards stale load-more data', async () => {
    let finish!: (r: Response) => void;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/milestones')) return milestones();
      if (url.includes('afterId=10')) return new Promise<Response>(resolve => { finish = resolve; });
      return url.includes('/teams/2/') ? page([task(20, 'Beta task')]) : page([task()], 10);
    }));
    render(<TaskBoard {...props} teams={[team, { ...team, id: 2, name: 'Beta' }]} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Load more tasks' }));
    fireEvent.change(screen.getByLabelText('Project team'), { target: { value: '2' } });
    await screen.findByText('Beta task');
    await act(async () => finish(page([task(11, 'Stale Alpha page')])));
    expect(screen.queryByText('Stale Alpha page')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Load more tasks|Loading more tasks/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh tasks' })).toBeEnabled();
  });

  it('ignores old activity responses after selecting another task', async () => {
    let finish!: (r: Response) => void;
    const event = (actor: string) => ({ id: 1, version: 1, actor: { fullName: actor }, changes: {}, createdAt: '2026-11-25T00:00:00Z' });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/milestones')) return milestones();
      if (url.includes('/tasks/10/events')) return new Promise<Response>(resolve => { finish = resolve; });
      if (url.includes('/tasks/20/events')) return response({ events: [event('Beta actor')], nextAfterId: null });
      return page([task(), task(20, 'Second task')]);
    }));
    render(<TaskBoard {...props} />); await screen.findByText('Private Alpha task');
    fireEvent.click(screen.getByRole('button', { name: 'Activity for Private Alpha task' }));
    fireEvent.click(screen.getByRole('button', { name: 'Activity for Second task' }));
    await screen.findByText(/Beta actor/);
    await act(async () => finish(response({ events: [event('Stale actor')], nextAfterId: null })));
    expect(screen.queryByText(/Stale actor/)).not.toBeInTheDocument();
  });

  it.each(['INSTRUCTOR', 'NON_APPROVED'])('shows %s read access without task mutation controls', async mode => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.includes('/milestones') ? milestones() : page([task()])));
    render(<TaskBoard {...props} userRole={mode === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT'} teams={[{ ...team, proposalStatus: mode === 'NON_APPROVED' ? 'DRAFT' : 'APPROVED' }]} />);
    await screen.findByText('Private Alpha task'); expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start task' })).not.toBeInTheDocument();
  });

  it('passes 401 to the session owner without claiming a successful load', async () => {
    const expired = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => response({ error: 'Expired session', code: 'SESSION_EXPIRED' }, 401)));
    render(<TaskBoard {...props} onUnauthorized={expired} />);
    await waitFor(() => expect(expired).toHaveBeenCalledWith('Expired session', 'SESSION_EXPIRED'));
    expect(screen.queryByTestId('task-success')).not.toBeInTheDocument();
  });
});
