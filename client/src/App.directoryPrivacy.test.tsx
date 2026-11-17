import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

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
