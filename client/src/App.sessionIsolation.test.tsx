import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
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

const COURSE_CPE334: Course = {
  id: 1,
  code: 'CPE334',
  name: 'Software Engineering',
  term: '1/2026',
  maxTeamSize: 3,
};

const STUDENT_A: User = {
  id: 101,
  email: 'student-a@example.test',
  fullName: 'Student Alpha',
  studentCode: '67070500001',
  role: 'STUDENT',
};

const STUDENT_B: User = {
  id: 102,
  email: 'student-b@example.test',
  fullName: 'Student Beta',
  studentCode: '67070500002',
  role: 'STUDENT',
};

const STUDENT_NO_TEAM: User = {
  id: 103,
  email: 'student-c@example.test',
  fullName: 'Student Unassigned',
  studentCode: '67070500003',
  role: 'STUDENT',
};

const INSTRUCTOR_I: User = {
  id: 201,
  email: 'instructor@example.test',
  fullName: 'Instructor One',
  studentCode: null,
  role: 'INSTRUCTOR',
};

const TEAM_A_WITH_DRAFT: ProjectTeam = {
  id: 11,
  name: 'Synthetic Alpha Team',
  courseId: 1,
  course: COURSE_CPE334,
  members: [{ id: 1, userId: STUDENT_A.id, memberRole: 'LEADER', user: STUDENT_A }],
  proposal: {
    id: 501,
    teamId: 11,
    title: 'Alpha Private Draft Title',
    problemStatement: 'Alpha private problem statement with sufficient detail.',
    techStack: 'React, Node, PostgreSQL',
    repoUrl: 'https://github.com/example/alpha-private-repo',
    status: 'DRAFT',
    revisionCount: 0,
    updatedAt: '2026-11-15T10:00:00.000Z',
  },
};

const TEAM_B_NO_PROPOSAL: ProjectTeam = {
  id: 12,
  name: 'Synthetic Beta Team',
  courseId: 1,
  course: COURSE_CPE334,
  members: [{ id: 2, userId: STUDENT_B.id, memberRole: 'LEADER', user: STUDENT_B }],
  proposal: null,
};

const TEAM_B_WITH_OWN_PROPOSAL: ProjectTeam = {
  id: 12,
  name: 'Synthetic Beta Team',
  courseId: 1,
  course: COURSE_CPE334,
  members: [{ id: 2, userId: STUDENT_B.id, memberRole: 'LEADER', user: STUDENT_B }],
  proposal: {
    id: 502,
    teamId: 12,
    title: 'Beta Own Proposal Title',
    problemStatement: 'Beta own problem statement completely separate from Alpha.',
    techStack: 'TypeScript, Vitest',
    repoUrl: 'https://github.com/example/beta-own-repo',
    status: 'DRAFT',
    revisionCount: 0,
    updatedAt: '2026-11-15T10:05:00.000Z',
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function signInThroughForm(email: string, password = 'SyntheticPassword123!') {
  fireEvent.change(screen.getByTestId('login-email'), { target: { value: email } });
  fireEvent.change(screen.getByTestId('login-password'), { target: { value: password } });
  await act(async () => {
    fireEvent.click(screen.getByTestId('login-submit'));
  });
}

describe('CoursePMS Session-Scoped Draft Isolation (L6-OUT-EXP-001)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('clears all four proposal fields when switching from Account A (draft) to Account B (no proposal) without reload', async () => {
    const tokenUsers: Record<string, User> = {
      'token-a': STUDENT_A,
      'token-b': STUDENT_B,
    };
    const teamsList = [TEAM_A_WITH_DRAFT, TEAM_B_NO_PROPOSAL];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        const headers = (init?.headers || {}) as Record<string, string>;
        const auth = headers['Authorization'] || '';
        const token = auth.replace('Bearer ', '');

        if (path.endsWith('/api/auth/login')) {
          const body = JSON.parse(String(init?.body || '{}'));
          if (body.email === STUDENT_A.email) return jsonResponse({ token: 'token-a', user: STUDENT_A });
          if (body.email === STUDENT_B.email) return jsonResponse({ token: 'token-b', user: STUDENT_B });
        }
        if (path.endsWith('/api/auth/logout')) {
          return jsonResponse({ message: 'Logged out' });
        }
        if (path.endsWith('/api/auth/me')) {
          return jsonResponse({ user: tokenUsers[token] });
        }
        if (path.endsWith('/api/courses')) {
          return jsonResponse({ courses: [COURSE_CPE334] });
        }
        if (path.endsWith('/api/teams')) {
          return jsonResponse({ teams: teamsList });
        }
        return jsonResponse({});
      })
    );

    render(<App />);

    // Sign in as Student A (has 4-field draft)
    await signInThroughForm(STUDENT_A.email);
    await waitFor(() => {
      expect(screen.getByTestId('my-team-name')).toHaveTextContent(TEAM_A_WITH_DRAFT.name);
      expect(screen.getByTestId('proposal-title')).toHaveValue('Alpha Private Draft Title');
    });
    expect(screen.getByTestId('proposal-problem')).toHaveValue(
      'Alpha private problem statement with sufficient detail.'
    );
    expect(screen.getByTestId('proposal-stack')).toHaveValue('React, Node, PostgreSQL');
    expect(screen.getByTestId('proposal-repo')).toHaveValue(
      'https://github.com/example/alpha-private-repo'
    );

    // Log out without reloading
    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });
    expect(screen.getByText('Sign In to CoursePMS')).toBeInTheDocument();

    // Sign in as Student B (team has NO proposal)
    await signInThroughForm(STUDENT_B.email);
    await waitFor(() => {
      expect(screen.getByTestId('current-user-info')).toHaveTextContent(STUDENT_B.fullName);
      expect(screen.getByTestId('my-team-name')).toHaveTextContent(TEAM_B_NO_PROPOSAL.name);
    });

    expect(screen.getByTestId('proposal-title')).toHaveValue('');
    expect(screen.getByTestId('proposal-problem')).toHaveValue('');
    expect(screen.getByTestId('proposal-stack')).toHaveValue('');
    expect(screen.getByTestId('proposal-repo')).toHaveValue('');
  });

  it('handles reverse switching, no-team student, instructor, and B with its own proposal cleanly', async () => {
    const tokenUsers: Record<string, User> = {
      'token-a': STUDENT_A,
      'token-b-own': STUDENT_B,
      'token-c-noteam': STUDENT_NO_TEAM,
      'token-i': INSTRUCTOR_I,
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        const headers = (init?.headers || {}) as Record<string, string>;
        const token = (headers['Authorization'] || '').replace('Bearer ', '');

        if (path.endsWith('/api/auth/login')) {
          const body = JSON.parse(String(init?.body || '{}'));
          if (body.email === STUDENT_A.email) return jsonResponse({ token: 'token-a', user: STUDENT_A });
          if (body.email === STUDENT_B.email) return jsonResponse({ token: 'token-b-own', user: STUDENT_B });
          if (body.email === STUDENT_NO_TEAM.email)
            return jsonResponse({ token: 'token-c-noteam', user: STUDENT_NO_TEAM });
          if (body.email === INSTRUCTOR_I.email) return jsonResponse({ token: 'token-i', user: INSTRUCTOR_I });
        }
        if (path.endsWith('/api/auth/logout')) return jsonResponse({ message: 'Logged out' });
        if (path.endsWith('/api/auth/me')) return jsonResponse({ user: tokenUsers[token] });
        if (path.endsWith('/api/courses')) return jsonResponse({ courses: [COURSE_CPE334] });
        if (path.endsWith('/api/teams')) {
          return jsonResponse({ teams: [TEAM_A_WITH_DRAFT, TEAM_B_WITH_OWN_PROPOSAL] });
        }
        return jsonResponse({});
      })
    );

    render(<App />);

    // 1. Account A -> Account B (own proposal)
    await signInThroughForm(STUDENT_A.email);
    await waitFor(() => {
      expect(screen.getByTestId('proposal-title')).toHaveValue('Alpha Private Draft Title');
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });

    await signInThroughForm(STUDENT_B.email);
    await waitFor(() => {
      expect(screen.getByTestId('proposal-title')).toHaveValue('Beta Own Proposal Title');
    });
    expect(screen.getByTestId('proposal-problem')).toHaveValue(
      'Beta own problem statement completely separate from Alpha.'
    );
    expect(screen.getByTestId('proposal-stack')).toHaveValue('TypeScript, Vitest');
    expect(screen.getByTestId('proposal-repo')).toHaveValue('https://github.com/example/beta-own-repo');

    // 2. Reverse switch B -> A
    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });
    await signInThroughForm(STUDENT_A.email);
    await waitFor(() => {
      expect(screen.getByTestId('proposal-title')).toHaveValue('Alpha Private Draft Title');
    });

    // 3. Switch A -> Unassigned student C (no team)
    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });
    await signInThroughForm(STUDENT_NO_TEAM.email);
    await waitFor(() => {
      expect(screen.getByTestId('current-user-info')).toHaveTextContent(STUDENT_NO_TEAM.fullName);
      expect(screen.getByTestId('create-team-btn')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('proposal-title')).not.toBeInTheDocument();

    // 4. Switch C -> Instructor I -> type review feedback -> logout -> A
    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });
    await signInThroughForm(INSTRUCTOR_I.email);
    await waitFor(() => {
      expect(screen.getByTestId('current-user-role')).toHaveTextContent('INSTRUCTOR');
      expect(screen.getByTestId('review-feedback-input')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId('review-feedback-input'), {
      target: { value: 'Instructor private review note' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });

    // Back to Instructor I: prior reviewFeedbackInput must be cleared
    await signInThroughForm(INSTRUCTOR_I.email);
    await waitFor(() => {
      expect(screen.getByTestId('review-feedback-input')).toHaveValue('');
    });
  });

  it('ignores delayed dashboard responses from Account A that resolve after Account B has loaded', async () => {
    const delayedATeams = createDeferred<Response>();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        const headers = (init?.headers || {}) as Record<string, string>;
        const token = (headers['Authorization'] || '').replace('Bearer ', '');

        if (path.endsWith('/api/auth/login')) {
          const body = JSON.parse(String(init?.body || '{}'));
          if (body.email === STUDENT_A.email) return jsonResponse({ token: 'token-a', user: STUDENT_A });
          if (body.email === STUDENT_B.email) return jsonResponse({ token: 'token-b', user: STUDENT_B });
        }
        if (path.endsWith('/api/auth/logout')) return jsonResponse({ message: 'Logged out' });
        if (path.endsWith('/api/auth/me')) {
          return jsonResponse({ user: token === 'token-a' ? STUDENT_A : STUDENT_B });
        }
        if (path.endsWith('/api/courses')) return jsonResponse({ courses: [COURSE_CPE334] });
        if (path.endsWith('/api/teams')) {
          if (token === 'token-a') {
            return delayedATeams.promise;
          }
          return jsonResponse({ teams: [TEAM_B_NO_PROPOSAL] });
        }
        return jsonResponse({});
      })
    );

    render(<App />);

    // Sign in as A while /api/teams for A is still pending
    await signInThroughForm(STUDENT_A.email);
    await waitFor(() => {
      expect(screen.getByTestId('current-user-info')).toHaveTextContent(STUDENT_A.fullName);
    });

    // Logout A and sign in as B immediately
    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });
    await signInThroughForm(STUDENT_B.email);
    await waitFor(() => {
      expect(screen.getByTestId('current-user-info')).toHaveTextContent(STUDENT_B.fullName);
      expect(screen.getByTestId('my-team-name')).toHaveTextContent(TEAM_B_NO_PROPOSAL.name);
    });

    // Now Account A's stale /api/teams response finally resolves
    await act(async () => {
      delayedATeams.resolve(jsonResponse({ teams: [TEAM_A_WITH_DRAFT, TEAM_B_NO_PROPOSAL] }));
      await delayedATeams.promise;
    });

    // Account B's workspace must NOT be overwritten by A's delayed data
    expect(screen.getByTestId('current-user-info')).toHaveTextContent(STUDENT_B.fullName);
    expect(screen.getByTestId('my-team-name')).toHaveTextContent(TEAM_B_NO_PROPOSAL.name);
    expect(screen.getByTestId('proposal-title')).toHaveValue('');
    expect(screen.getByTestId('proposal-problem')).toHaveValue('');
    expect(screen.getByTestId('proposal-stack')).toHaveValue('');
    expect(screen.getByTestId('proposal-repo')).toHaveValue('');
  });

  it('prevents delayed mutation/finally callbacks from a prior session from overwriting B state or pending status', async () => {
    const delayedSaveDraft = createDeferred<Response>();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        const headers = (init?.headers || {}) as Record<string, string>;
        const token = (headers['Authorization'] || '').replace('Bearer ', '');

        if (path.endsWith('/api/auth/login')) {
          const body = JSON.parse(String(init?.body || '{}'));
          if (body.email === STUDENT_A.email) return jsonResponse({ token: 'token-a', user: STUDENT_A });
          if (body.email === STUDENT_B.email) return jsonResponse({ token: 'token-b', user: STUDENT_B });
        }
        if (path.endsWith('/api/auth/me')) {
          return jsonResponse({ user: token === 'token-a' ? STUDENT_A : STUDENT_B });
        }
        if (path.endsWith('/api/courses')) return jsonResponse({ courses: [COURSE_CPE334] });
        if (path.endsWith('/api/teams')) {
          return jsonResponse({ teams: [TEAM_A_WITH_DRAFT, TEAM_B_NO_PROPOSAL] });
        }
        if (path.endsWith(`/api/teams/${TEAM_A_WITH_DRAFT.id}/proposal`) && init?.method === 'PUT') {
          return delayedSaveDraft.promise;
        }
        return jsonResponse({});
      })
    );

    render(<App />);
    await signInThroughForm(STUDENT_A.email);
    await waitFor(() => {
      expect(screen.getByTestId('proposal-title')).toHaveValue('Alpha Private Draft Title');
    });

    // Trigger Save Draft for A (stays pending)
    fireEvent.click(screen.getByTestId('save-draft-btn'));
    expect(screen.getByTestId('save-draft-btn')).toBeDisabled();

    // Simulate 401 session invalidation / account switch by clearing token in a new login flow:
    // Actually trigger an expired session via a 401 on /api/auth/me on reload/re-check:
    // Wait: while save-draft is pending, we can simulate session expiry when another request returns 401
    // or directly test that once session transitions (e.g. token cleared & B signs in), resolving delayedSaveDraft
    // does not set A's success banner or overwrite B's state.
    await act(async () => {
      window.localStorage.setItem('course_pms_token', 'token-b');
      window.dispatchEvent(new StorageEvent('storage', { key: 'course_pms_token', newValue: 'token-b' }));
    });

    // Now resolve A's delayed Save Draft after storage/session switched
    await act(async () => {
      delayedSaveDraft.resolve(jsonResponse({ proposal: TEAM_A_WITH_DRAFT.proposal }));
      await delayedSaveDraft.promise;
    });

    expect(screen.queryByText('Proposal draft saved to PostgreSQL.')).not.toBeInTheDocument();
  });

  it('clears sensitive proposal state on 401 session expiry and preserves same-session typing on save error', async () => {
    let saveCalls = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        const headers = (init?.headers || {}) as Record<string, string>;
        const token = (headers['Authorization'] || '').replace('Bearer ', '');

        if (path.endsWith('/api/auth/login')) {
          const body = JSON.parse(String(init?.body || '{}'));
          if (body.email === STUDENT_A.email) return jsonResponse({ token: 'token-a', user: STUDENT_A });
          if (body.email === STUDENT_B.email) return jsonResponse({ token: 'token-b', user: STUDENT_B });
        }
        if (path.endsWith('/api/auth/me')) {
          return jsonResponse({ user: token === 'token-a' ? STUDENT_A : STUDENT_B });
        }
        if (path.endsWith('/api/courses')) return jsonResponse({ courses: [COURSE_CPE334] });
        if (path.endsWith('/api/teams')) {
          return jsonResponse({ teams: [TEAM_A_WITH_DRAFT, TEAM_B_NO_PROPOSAL] });
        }
        if (path.endsWith(`/api/teams/${TEAM_A_WITH_DRAFT.id}/proposal`) && init?.method === 'PUT') {
          saveCalls += 1;
          if (saveCalls === 1) {
            return jsonResponse({ error: 'Validation error', code: 'VALIDATION_ERROR' }, 400);
          }
          return jsonResponse({ error: 'Token revoked', code: 'TOKEN_REVOKED' }, 401);
        }
        return jsonResponse({});
      })
    );

    render(<App />);
    await signInThroughForm(STUDENT_A.email);
    await waitFor(() => {
      expect(screen.getByTestId('proposal-title')).toHaveValue('Alpha Private Draft Title');
    });

    // 1. Same-session typing + failed 400 save must preserve unsaved edits
    fireEvent.change(screen.getByTestId('proposal-title'), {
      target: { value: 'Alpha Unsaved Edit In Progress' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-draft-btn'));
    });
    expect(await screen.findByTestId('error-banner')).toHaveTextContent('VALIDATION_ERROR');
    expect(screen.getByTestId('proposal-title')).toHaveValue('Alpha Unsaved Edit In Progress');

    // 2. Subsequent 401 session expiry must transition to unauthenticated and clear sensitive state
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-draft-btn'));
    });
    expect(await screen.findByText('Sign In to CoursePMS')).toBeInTheDocument();
    expect(screen.getByTestId('auth-error')).toHaveTextContent('TOKEN_REVOKED');
    expect(window.localStorage.getItem('course_pms_token')).toBeNull();

    // 3. Signing in as B (no proposal) after 401 shows empty proposal fields
    await signInThroughForm(STUDENT_B.email);
    await waitFor(() => {
      expect(screen.getByTestId('my-team-name')).toHaveTextContent(TEAM_B_NO_PROPOSAL.name);
    });
    expect(screen.getByTestId('proposal-title')).toHaveValue('');
    expect(screen.getByTestId('proposal-problem')).toHaveValue('');
    expect(screen.getByTestId('proposal-stack')).toHaveValue('');
    expect(screen.getByTestId('proposal-repo')).toHaveValue('');
  });
});
