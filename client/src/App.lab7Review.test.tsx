import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App, { type Course, type ProjectTeam, type User } from './App';

const instructor: User = { id: 20, email: 'instructor@example.test', fullName: 'Synthetic Instructor', studentCode: null, role: 'INSTRUCTOR' };
const course: Course = { id: 1, code: 'CPE334', name: 'Synthetic course', term: '1/2026', maxTeamSize: 3 };
const submitted: ProjectTeam = { id: 1, name: 'Team Alpha', courseId: 1, course, members: [],
  proposal: { id: 5, teamId: 1, title: 'Submitted proposal', status: 'SUBMITTED', revisionCount: 1,
    problemStatement: 'A sufficient proposal problem statement.', techStack: 'React, PostgreSQL', updatedAt: '2026-11-22T00:00:00Z' } };
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as Response;

function workspace(result: { decision?: 'APPROVED' | 'REVISION_REQUESTED'; feedback?: string; reject?: boolean } = {}) {
  let current: ProjectTeam = { ...submitted, proposal: { ...submitted.proposal! } };
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === '/api/auth/me') return response({ user: instructor });
    if (url === '/api/courses') return response({ courses: [course] });
    if (url === '/api/teams') return response({ teams: [current] });
    if (url === '/api/proposals/5/review' && init?.method === 'POST') {
      if (result.reject) return response({ code: 'BR05_FEEDBACK_TOO_SHORT', error: 'REVISION_REQUESTED feedback must be at least 20 characters after trim.' }, 400);
      current = { ...current, proposal: { ...current.proposal!, status: result.decision!, reviewFeedback: result.feedback! } };
      return response({ proposal: current.proposal });
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('Lab 7 L7-T06: distinct review hints and truthful action handling', () => {
  beforeEach(() => { localStorage.clear(); localStorage.setItem('course_pms_token', 'synthetic-instructor-token'); });
  afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  async function loaded() {
    render(<App />);
    await screen.findByTestId('review-feedback-input');
    await waitFor(() => expect(screen.getByTestId('review-panel-status')).toHaveTextContent('SUBMITTED'));
  }

  it('shows accessible, action-specific 10/20 guidance', async () => {
    workspace(); await loaded();
    expect(screen.getByTestId('review-feedback-hint')).toHaveTextContent('Approve: minimum 10 after trim. Request revision: minimum 20 after trim.');
    expect(screen.getByLabelText(/Instructor Review Feedback/)).toBe(screen.getByTestId('review-feedback-input'));
    expect(screen.getByTestId('revision-proposal-btn')).toHaveAttribute('aria-describedby', 'review-feedback-hint');
    expect(screen.getByTestId('approve-proposal-btn')).toHaveAttribute('aria-describedby', 'review-feedback-hint');
  });

  it('retains rejected 19-unit feedback and reports the real server error without false success', async () => {
    const fetch = workspace({ reject: true }); await loaded();
    fireEvent.change(screen.getByTestId('review-feedback-input'), { target: { value: 'r'.repeat(19) } });
    await act(async () => { fireEvent.click(screen.getByTestId('revision-proposal-btn')); });
    expect(screen.getByTestId('error-banner')).toHaveTextContent('BR05_FEEDBACK_TOO_SHORT');
    expect(screen.getByTestId('review-feedback-input')).toHaveValue('r'.repeat(19));
    expect(screen.getByTestId('review-panel-status')).toHaveTextContent('SUBMITTED');
    expect(screen.queryByTestId('success-banner')).not.toBeInTheDocument();
    const call = fetch.mock.calls.find(([url]) => url === '/api/proposals/5/review')!;
    expect(JSON.parse(call[1]!.body as string)).toEqual({ decision: 'REVISION_REQUESTED', reviewFeedback: 'r'.repeat(19) });
  });

  it.each([
    ['REVISION_REQUESTED', 'r'.repeat(20), 'revision-proposal-btn'],
    ['APPROVED', 'a'.repeat(10), 'approve-proposal-btn'],
  ] as const)('allows %s using its own threshold and reloads the confirmed result', async (decision, feedback, button) => {
    const fetch = workspace({ decision, feedback }); await loaded();
    fireEvent.change(screen.getByTestId('review-feedback-input'), { target: { value: feedback } });
    await act(async () => { fireEvent.click(screen.getByTestId(button)); });
    expect(screen.getByTestId('success-banner')).toHaveTextContent(decision);
    expect(screen.getByTestId('review-panel-status')).toHaveTextContent(decision);
    expect(screen.getByTestId('review-feedback-input')).toHaveValue('');
    const call = fetch.mock.calls.find(([url]) => url === '/api/proposals/5/review')!;
    expect(JSON.parse(call[1]!.body as string)).toEqual({ decision, reviewFeedback: feedback });
  });
});
