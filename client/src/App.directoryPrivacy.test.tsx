import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import App, { Course, ProjectTeam, User } from './App';

beforeEach(() => localStorage.setItem('course_pms_token', 'synthetic-session'));
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });

it('labels foreign proposal state as private instead of implying that no draft exists', async () => {
  const user = { id: 101, email: 'student@example.test', fullName: 'Synthetic student', studentCode: '101', role: 'STUDENT' };
  const course = { id: 1, code: 'TEST', name: 'Synthetic course', term: '2026', maxTeamSize: 3 };
  const teams = [
    { id: 11, name: 'Own team', courseId: 1, course, members: [{ id: 1, userId: user.id, user, memberRole: 'LEADER' }], proposal: null },
    { id: 12, name: 'Foreign team', courseId: 1, course, members: [], proposal: null },
  ];
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const data = String(input) === '/api/auth/me' ? { user }
      : String(input) === '/api/courses' ? { courses: [course] } : { teams };
    return { status: 200, ok: true, json: async () => data } as Response;
  }));
  render(<App />);
  const foreign = await screen.findByRole('row', { name: /Foreign team/ });
  expect(within(foreign).getByText('PRIVATE')).toBeInTheDocument();
  expect(within(foreign).queryByText('NO_DRAFT')).not.toBeInTheDocument();
  expect(within(screen.getByRole('row', { name: /Own team/ })).getByText('NO_DRAFT')).toBeInTheDocument();
  // Keep the denial-inspection control available; the API still enforces access.
  expect(within(foreign).getByTestId('inspect-proposal-12')).toBeEnabled();
});

it('shows authorized instructor proposal statuses and badge colors without team membership', async () => {
  const user: User = { id: 201, email: 'instructor@example.test', fullName: 'Synthetic instructor', studentCode: null, role: 'INSTRUCTOR' };
  const course: Course = { id: 1, code: 'TEST', name: 'Synthetic course', term: '2026', maxTeamSize: 3 };
  const statuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REVISION_REQUESTED'] as const;
  const colors = ['bg-secondary', 'bg-primary', 'bg-success', 'bg-warning'];
  const teams: ProjectTeam[] = statuses.map((status, index) => ({
    id: index + 11, name: `Instructor team ${status}`, courseId: 1, course, members: [],
    proposal: { id: index + 501, teamId: index + 11, title: `Authorized ${status} proposal`,
      status, revisionCount: 1, updatedAt: '2026-11-17T00:00:00Z' },
  }));
  teams.push({ id: 15, name: 'Instructor team without proposal', courseId: 1, course, members: [], proposal: null });
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const data = String(input) === '/api/auth/me' ? { user }
      : String(input) === '/api/courses' ? { courses: [course] } : { teams };
    return { status: 200, ok: true, json: async () => data } as Response;
  }));
  render(<App />);
  for (const [index, status] of statuses.entries()) {
    const row = await screen.findByRole('row', { name: new RegExp(`Instructor team ${status} `) });
    expect(within(row).getByText(status, { exact: true })).toHaveClass(colors[index]);
    expect(within(row).getByText(`Authorized ${status} proposal`)).toBeInTheDocument();
    expect(within(row).queryByText('PRIVATE')).not.toBeInTheDocument();
  }
  const emptyRow = screen.getByRole('row', { name: /Instructor team without proposal/ });
  expect(within(emptyRow).getByText('NONE')).toHaveClass('bg-secondary');
  expect(within(emptyRow).queryByText('PRIVATE')).not.toBeInTheDocument();

  fireEvent.change(screen.getByTestId('instructor-status-filter'), { target: { value: 'SUBMITTED' } });
  await waitFor(() => expect(screen.queryByRole('row', { name: /Instructor team DRAFT / })).not.toBeInTheDocument());
  expect(screen.getByRole('row', { name: /Instructor team SUBMITTED / })).toBeInTheDocument();
});
