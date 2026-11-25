import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App, { Course, ProjectTeam, User } from './App';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});
(globalThis as Record<string, unknown>).localStorage = localStorageMock;

const COURSE: Course = {
  id: 1,
  code: 'CPE334',
  name: 'Software Engineering in the Age of AI Agents',
  term: '1/2026',
  maxTeamSize: 3,
};

function okJson(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => body,
  } as Response);
}

describe('CoursePMS UI Refresh (UIR v1.0)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('UIR-T01/T02: omits Quick Fill controls, uses real auth inputs, and toggles password visibility safely', () => {
    render(<App />);

    expect(screen.queryByTestId('quickfill-pawarit')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quickfill-suda')).not.toBeInTheDocument();
    expect(screen.queryByTestId('quickfill-instructor')).not.toBeInTheDocument();
    expect(screen.queryByText(/Quick Fill/i)).not.toBeInTheDocument();

    const emailInput = screen.getByTestId('login-email');
    const passwordInput = screen.getByTestId('login-password');
    expect(emailInput).toHaveAttribute('autocomplete', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');

    const toggleBtn = screen.getByRole('button', { name: 'Show password' });
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('UIR-T05/T08: renders role-aware student navigation without unimplemented Sprint 2-3 dead links and supports Escape on mobile menu', async () => {
    const student: User = {
      id: 10,
      email: 'student@mail.kmutt.ac.th',
      fullName: 'Student User',
      studentCode: '67070503400',
      role: 'STUDENT',
    };
    window.localStorage.setItem('course_pms_token', 'valid-token');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const path = String(input);
        if (path.endsWith('/api/auth/me')) return okJson({ user: student });
        if (path.endsWith('/api/courses')) return okJson({ courses: [COURSE] });
        if (path.endsWith('/api/teams')) return okJson({ teams: [] });
        return okJson({});
      })
    );

    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Student Workspace', level: 1 })).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'My Team' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proposal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Milestones' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Grading|Analytics/i })).not.toBeInTheDocument();

    const menuToggle = screen.getByRole('button', { name: 'Menu' });
    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveAttribute('aria-expanded', 'true');

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

    const scrollSpy = vi.fn();
    const teamSection = document.getElementById('section-team');
    expect(teamSection).not.toBeNull();
    teamSection!.scrollIntoView = scrollSpy;
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );

    fireEvent.click(screen.getByRole('button', { name: 'My Team' }));
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('UIR-T05/T10: renders instructor navigation and keeps BR-05 10-character hint', async () => {
    const instructor: User = {
      id: 20,
      email: 'instructor@kmutt.ac.th',
      fullName: 'Course Instructor',
      studentCode: null,
      role: 'INSTRUCTOR',
    };
    const team: ProjectTeam = {
      id: 1,
      name: 'Team Alpha',
      courseId: 1,
      course: COURSE,
      members: [],
      proposal: {
        id: 5,
        teamId: 1,
        title: 'Submitted Proposal',
        problemStatement: 'A clear engineering problem statement for testing.',
        techStack: 'React, Node, PostgreSQL',
        repoUrl: 'https://github.com/example/repo',
        status: 'SUBMITTED',
        revisionCount: 1,
        updatedAt: '2026-11-22T00:00:00Z',
      },
    };
    window.localStorage.setItem('course_pms_token', 'valid-instructor-token');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const path = String(input);
        if (path.endsWith('/api/auth/me')) return okJson({ user: instructor });
        if (path.endsWith('/api/courses')) return okJson({ courses: [COURSE] });
        if (path.endsWith('/api/teams')) return okJson({ teams: [team] });
        return okJson({});
      })
    );

    render(<App />);
    expect(
      await screen.findByRole('heading', { name: 'Instructor Review Console', level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Course Teams' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proposal Review' })).toBeInTheDocument();
    expect(screen.getByText(/Minimum 10 characters required/i)).toBeInTheDocument();
  });
});
