import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App, { Course, ProjectTeam, User } from './App';

const a: User = { id: 101, email: 'a@example.test', fullName: 'Alpha', studentCode: '101', role: 'STUDENT' };
const b: User = { ...a, id: 102, email: 'b@example.test', fullName: 'Beta' };
const course: Course = { id: 1, code: 'TEST', name: 'Synthetic course', term: '2026', maxTeamSize: 3 };
const teamA: ProjectTeam = {
  id: 11, name: 'Alpha team', courseId: 1, course,
  members: [{ id: 1, userId: a.id, user: a, memberRole: 'LEADER' }],
  proposal: { id: 501, teamId: 11, title: 'Alpha private title', problemStatement: 'Alpha private problem statement',
    techStack: 'Alpha stack', repoUrl: 'https://example.test/alpha', status: 'DRAFT', revisionCount: 0, updatedAt: '2026-11-17T00:00:00Z' },
};
const teamB: ProjectTeam = { ...teamA, id: 12, name: 'Beta team', proposal: null,
  members: [{ id: 2, userId: b.id, user: b, memberRole: 'LEADER' }] };
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as Response;
function deferred() {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>(done => { resolve = done; });
  return { promise, resolve };
}

function workspace(override: (path: string, init?: RequestInit) => Response | Promise<Response> | undefined = () => undefined) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    const result = override(path, init);
    if (result !== undefined) return result;
    const auth = (init?.headers as Record<string, string>)?.Authorization;
    if (path === '/api/auth/login') return response({ token: 'token-a', user: a });
    if (path === '/api/auth/me') return response({ user: auth === 'Bearer token-b' ? b : a });
    if (path === '/api/courses') return response({ courses: [course] });
    if (path === '/api/teams') return response({ teams: [teamA, teamB] });
    if (path === '/api/auth/logout') return response({});
    if (path.endsWith('/members')) return response({ team: teamA });
    if (path.endsWith('/proposal')) return response({ proposal: teamA.proposal });
    throw new Error(`Unexpected request: ${path}`);
  }));
}
async function login() {
  fireEvent.change(screen.getByTestId('login-email'), { target: { value: a.email } });
  fireEvent.change(screen.getByTestId('login-password'), { target: { value: 'synthetic-only' } });
  await act(async () => { fireEvent.click(screen.getByTestId('login-submit')); });
}
async function switchToB() {
  await act(async () => {
    localStorage.setItem('course_pms_token', 'token-b');
    window.dispatchEvent(new StorageEvent('storage', { key: 'course_pms_token', newValue: 'token-b' }));
  });
  await waitFor(() => expect(screen.getByTestId('my-team-name')).toHaveTextContent(teamB.name));
}
async function loadedA() {
  await login();
  await waitFor(() => expect(screen.getByTestId('proposal-title')).toHaveValue(teamA.proposal!.title));
}

describe('L6-OUT-EXP-001 PR review regressions', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('ignores a delayed login response after another tab switches to B', async () => {
    const pending = deferred();
    workspace(path => path === '/api/auth/login' ? pending.promise : undefined);
    render(<App />);
    await login();
    expect(screen.getByTestId('login-submit')).toBeDisabled();
    await switchToB();
    await act(async () => { pending.resolve(response({ token: 'token-a', user: a })); await pending.promise; });
    expect(screen.getByTestId('current-user-info')).toHaveTextContent(b.fullName);
    expect(localStorage.getItem('course_pms_token')).toBe('token-b');
    expect(screen.getByTestId('proposal-title')).toHaveValue('');
  });

  it('clears private title banners and login fields at an identity boundary', async () => {
    workspace();
    render(<App />);
    await loadedA();
    await act(async () => { fireEvent.click(screen.getByTestId(`inspect-proposal-${teamA.id}`)); });
    expect(screen.getByTestId('success-banner')).toHaveTextContent(teamA.proposal!.title);
    await switchToB();
    expect(screen.queryByText(/Loaded proposal for Team/)).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByTestId('logout-btn')); });
    expect(screen.getByTestId('login-email')).toHaveValue('');
    expect(screen.getByTestId('login-password')).toHaveValue('');
  });

  it('preserves all unsaved editor fields after a same-session member refresh', async () => {
    workspace();
    render(<App />);
    await loadedA();
    const edits = { 'proposal-title': 'Unsaved title', 'proposal-problem': 'Unsaved private problem',
      'proposal-stack': 'Unsaved stack', 'proposal-repo': 'https://example.test/unsaved' };
    for (const [id, value] of Object.entries(edits)) fireEvent.change(screen.getByTestId(id), { target: { value } });
    fireEvent.change(screen.getByTestId('add-member-email'), { target: { value: 'new@example.test' } });
    await act(async () => { fireEvent.click(screen.getByTestId('add-member-btn')); });
    await waitFor(() => expect(screen.getByTestId('add-member-btn')).toBeEnabled());
    for (const [id, value] of Object.entries(edits)) expect(screen.getByTestId(id)).toHaveValue(value);
  });

  it('keeps B pending while a stale A mutation finishes', async () => {
    const saveA = deferred(), saveB = deferred();
    workspace((path, init) => path.endsWith('/proposal') && init?.method === 'PUT'
      ? ((init.headers as Record<string, string>).Authorization === 'Bearer token-a' ? saveA.promise : saveB.promise)
      : undefined);
    render(<App />);
    await loadedA();
    fireEvent.click(screen.getByTestId('save-draft-btn'));
    await switchToB();
    fireEvent.change(screen.getByTestId('proposal-title'), { target: { value: 'Beta unsaved title' } });
    fireEvent.click(screen.getByTestId('save-draft-btn'));
    expect(screen.getByTestId('save-draft-btn')).toBeDisabled();
    await act(async () => { saveA.resolve(response({ proposal: teamA.proposal })); await saveA.promise; });
    expect(screen.getByTestId('save-draft-btn')).toBeDisabled();
    expect(screen.getByTestId('proposal-title')).toHaveValue('Beta unsaved title');
    expect(screen.queryByText('Proposal draft saved to PostgreSQL.')).not.toBeInTheDocument();
    await act(async () => { saveB.resolve(response({ error: 'Retry B only', code: 'VALIDATION_ERROR' }, 400)); await saveB.promise; });
    expect(screen.getByTestId('save-draft-btn')).toBeEnabled();
    expect(screen.getByTestId('proposal-title')).toHaveValue('Beta unsaved title');
  });

  it('restores all saved fields after unmount and reload with the same token', async () => {
    workspace();
    const first = render(<App />);
    await loadedA();
    fireEvent.change(screen.getByTestId('proposal-title'), { target: { value: 'Unsaved before reload' } });
    first.unmount();
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('proposal-title')).toHaveValue(teamA.proposal!.title));
    expect(screen.getByTestId('proposal-problem')).toHaveValue(teamA.proposal!.problemStatement);
    expect(screen.getByTestId('proposal-stack')).toHaveValue(teamA.proposal!.techStack);
    expect(screen.getByTestId('proposal-repo')).toHaveValue(teamA.proposal!.repoUrl);
  });
});
