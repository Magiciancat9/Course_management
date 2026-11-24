import React, { useState, useEffect, useRef } from 'react';

export interface User {
  id: number;
  email: string;
  fullName: string;
  studentCode: string | null;
  role: 'STUDENT' | 'INSTRUCTOR';
}

export interface Course {
  id: number;
  code: string;
  name: string;
  term: string;
  maxTeamSize: number;
}

export interface TeamMember {
  id: number;
  userId: number;
  memberRole: string;
  user: User;
}

export interface Proposal {
  id: number;
  teamId: number;
  title: string;
  problemStatement?: string;
  techStack?: string;
  repoUrl?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
  reviewFeedback?: string | null;
  reviewedBy?: User | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  revisionCount: number;
  updatedAt: string;
}

export interface ProjectTeam {
  id: number;
  name: string;
  courseId: number;
  course: Course;
  members: TeamMember[];
  proposal: Proposal | null;
}

interface ApiResponseData {
  error?: string;
  code?: string;
  token?: string;
  user?: User;
  courses?: Course[];
  teams?: ProjectTeam[];
  team?: ProjectTeam;
  proposal?: Proposal;
}

const API_BASE = '';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('course_pms_token'));
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<ProjectTeam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<{ error: string; code?: string } | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Navigation state
  const [activeNav, setActiveNav] = useState<'overview' | 'team' | 'proposal' | 'teams' | 'review'>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Student Team creation & member addition state
  const [newTeamName, setNewTeamName] = useState('');
  const [addMemberEmail, setAddMemberEmail] = useState('');

  // Student Proposal editor state
  const [propTitle, setPropTitle] = useState('');
  const [propProblem, setPropProblem] = useState('');
  const [propStack, setPropStack] = useState('');
  const [propRepo, setPropRepo] = useState('');

  // Instructor Review state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [reviewFeedbackInput, setReviewFeedbackInput] = useState('');

  // Session boundary refs: prevent cross-session stale responses and callbacks
  const sessionGenerationRef = useRef<number>(0);
  const dashboardAbortRef = useRef<AbortController | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);

  function getInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  function clearProposalEditorFields() {
    setPropTitle('');
    setPropProblem('');
    setPropStack('');
    setPropRepo('');
  }

  function clearWorkspaceState() {
    setTeams([]);
    setCourses([]);
    setNewTeamName('');
    setAddMemberEmail('');
    clearProposalEditorFields();
    setStatusFilter('ALL');
    setSelectedTeamId(null);
    setReviewFeedbackInput('');
    setActiveNav('overview');
    setMobileNavOpen(false);
  }

  function invalidateSessionBoundary(nextToken: string | null = null): number {
    sessionGenerationRef.current += 1;
    dashboardAbortRef.current?.abort();
    dashboardAbortRef.current = null;
    setLoading(false);
    setPendingAction(null);
    setErrorBanner(null);
    setSuccessBanner(null);
    setLoginEmail('');
    setLoginPassword('');
    setShowPassword(false);
    clearWorkspaceState();
    if (nextToken === null) {
      localStorage.removeItem('course_pms_token');
      setToken(null);
      setUser(null);
    }
    return sessionGenerationRef.current;
  }

  async function apiFetch(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
      let data: ApiResponseData;
      try {
        const payload: unknown = await response.json();
        if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
          throw new Error('Response body is not an object.');
        }
        data = payload as ApiResponseData;
      } catch {
        data = {
          error: 'The server returned an unreadable response.',
          code: 'INVALID_RESPONSE',
        };
      }
      return { status: response.status, ok: response.ok, aborted: false, data };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          status: 0,
          ok: false,
          aborted: true,
          data: {
            error: 'Request aborted.',
            code: 'ABORTED',
          },
        };
      }
      console.error(`API request failed for ${path}:`, error);
      return {
        status: 0,
        ok: false,
        aborted: false,
        data: {
          error: 'Unable to reach the server. Check your connection and try again.',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  async function loadDashboardData(
    activeToken: string,
    expectedGeneration: number = sessionGenerationRef.current,
    hydrateEditor: boolean = true
  ) {
    dashboardAbortRef.current?.abort();
    const controller = new AbortController();
    dashboardAbortRef.current = controller;

    setLoading(true);
    try {
      const meRes = await apiFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${activeToken}` },
        signal: controller.signal,
      });
      if (
        meRes.aborted ||
        controller.signal.aborted ||
        expectedGeneration !== sessionGenerationRef.current
      ) {
        return;
      }
      if (!meRes.ok) {
        const errorPayload = {
          error: String(meRes.data.error || 'Could not load the current user.'),
          code: typeof meRes.data.code === 'string' ? meRes.data.code : undefined,
        };
        if (meRes.status === 401) {
          invalidateSessionBoundary(null);
        }
        setErrorBanner(errorPayload);
        return;
      }
      const currentUser = meRes.data.user;
      if (!currentUser) {
        setErrorBanner({
          error: 'The server response did not include the current user.',
          code: 'INVALID_RESPONSE',
        });
        return;
      }
      setUser(currentUser);

      const [coursesRes, teamsRes] = await Promise.all([
        apiFetch('/api/courses', {
          headers: { Authorization: `Bearer ${activeToken}` },
          signal: controller.signal,
        }),
        apiFetch('/api/teams', {
          headers: { Authorization: `Bearer ${activeToken}` },
          signal: controller.signal,
        }),
      ]);
      if (
        coursesRes.aborted ||
        teamsRes.aborted ||
        controller.signal.aborted ||
        expectedGeneration !== sessionGenerationRef.current
      ) {
        return;
      }

      if (coursesRes.ok) {
        setCourses(coursesRes.data.courses || []);
      } else if (coursesRes.status === 401) {
        invalidateSessionBoundary(null);
        setErrorBanner({
          error: String(coursesRes.data.error || 'Session expired or revoked.'),
          code: typeof coursesRes.data.code === 'string' ? coursesRes.data.code : undefined,
        });
        return;
      } else {
        setErrorBanner({
          error: String(coursesRes.data.error || 'Could not load courses.'),
          code: typeof coursesRes.data.code === 'string' ? coursesRes.data.code : undefined,
        });
      }

      if (teamsRes.ok) {
        const loadedTeams: ProjectTeam[] = teamsRes.data.teams || [];
        setTeams(loadedTeams);

        if (currentUser.role === 'STUDENT') {
          setSelectedTeamId(null);
          setReviewFeedbackInput('');
          const myTeam = loadedTeams.find((t) =>
            t.members.some((m) => m.userId === currentUser.id)
          );
          if (myTeam?.proposal && hydrateEditor) {
            setPropTitle(myTeam.proposal.title || '');
            setPropProblem(myTeam.proposal.problemStatement || '');
            setPropStack(myTeam.proposal.techStack || '');
            setPropRepo(myTeam.proposal.repoUrl || '');
          } else if (!myTeam?.proposal && hydrateEditor) {
            clearProposalEditorFields();
          }
        } else {
          clearProposalEditorFields();
          if (
            loadedTeams.length > 0 &&
            (selectedTeamId === null || !loadedTeams.some((t) => t.id === selectedTeamId))
          ) {
            setSelectedTeamId(loadedTeams[0].id);
          } else if (loadedTeams.length === 0) {
            setSelectedTeamId(null);
          }
        }
      } else if (teamsRes.status === 401) {
        invalidateSessionBoundary(null);
        setErrorBanner({
          error: String(teamsRes.data.error || 'Session expired or revoked.'),
          code: typeof teamsRes.data.code === 'string' ? teamsRes.data.code : undefined,
        });
        return;
      } else {
        setErrorBanner({
          error: String(teamsRes.data.error || 'Could not load teams.'),
          code: typeof teamsRes.data.code === 'string' ? teamsRes.data.code : undefined,
        });
      }
    } finally {
      if (dashboardAbortRef.current === controller) {
        dashboardAbortRef.current = null;
      }
      if (!controller.signal.aborted && expectedGeneration === sessionGenerationRef.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (token) {
      loadDashboardData(token, sessionGenerationRef.current);
    }
    return () => {
      dashboardAbortRef.current?.abort();
    };
  }, [token]);

  useEffect(() => () => {
    // Late mutations and logins must also become stale on unmount.
    sessionGenerationRef.current += 1;
  }, []);

  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key === 'course_pms_token' || event.key === null) {
        const updatedToken = localStorage.getItem('course_pms_token');
        if (updatedToken !== token) {
          invalidateSessionBoundary(updatedToken);
          if (updatedToken !== null) {
            setUser(null);
            setToken(updatedToken);
          }
        }
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
        menuToggleRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  function navigateToSection(
    navKey: 'overview' | 'team' | 'proposal' | 'teams' | 'review',
    sectionId?: string
  ) {
    setActiveNav(navKey);
    setMobileNavOpen(false);
    if (sectionId) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(sectionId)?.scrollIntoView?.({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }

  async function withPendingAction(action: string, operation: () => Promise<void>) {
    if (pendingAction) return;
    const actionGeneration = sessionGenerationRef.current;
    setPendingAction(action);
    try {
      await operation();
    } catch (error) {
      console.error(`${action} failed:`, error);
      if (actionGeneration === sessionGenerationRef.current) {
        setErrorBanner({
          error: 'The request could not be completed. Please try again.',
          code: 'REQUEST_FAILED',
        });
      }
    } finally {
      if (actionGeneration === sessionGenerationRef.current) {
        setPendingAction(null);
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await withPendingAction('login', async () => {
      const requestGeneration = sessionGenerationRef.current;
      setErrorBanner(null);
      setSuccessBanner(null);
      if (!loginEmail.trim() || !loginPassword.trim()) {
        setErrorBanner({
          error: 'Email and password are required.',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const { ok, data } = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (requestGeneration !== sessionGenerationRef.current) return;
      if (!ok) {
        setErrorBanner({ error: data.error || 'Login failed.', code: data.code });
        return;
      }
      if (!data.token || !data.user) {
        setErrorBanner({
          error: 'The server response did not include login credentials.',
          code: 'INVALID_RESPONSE',
        });
        return;
      }

      invalidateSessionBoundary(data.token);
      localStorage.setItem('course_pms_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setSuccessBanner(`Authenticated as ${data.user.fullName} (${data.user.role})`);
    });
  }

  async function handleLogout() {
    await withPendingAction('logout', async () => {
      const requestGeneration = sessionGenerationRef.current;
      setErrorBanner(null);
      setSuccessBanner(null);
      if (!token) {
        setErrorBanner({ error: 'No active session token is available.', code: 'NO_SESSION' });
        return;
      }

      const { ok, status, data } = await apiFetch('/api/auth/logout', { method: 'POST' });
      if (requestGeneration !== sessionGenerationRef.current) return;
      if (!ok) {
        if (status === 401) {
          invalidateSessionBoundary(null);
        }
        setErrorBanner({ error: data.error || 'Logout failed.', code: data.code });
        return;
      }

      invalidateSessionBoundary(null);
      setSuccessBanner('Logged out successfully. Session token revoked.');
    });
  }

  const myTeam = user
    ? teams.find((t) => t.members.some((m) => m.userId === user.id))
    : undefined;

  function canViewTeamProposalStatus(teamId: number) {
    return user?.role === 'INSTRUCTOR' || teamId === myTeam?.id;
  }

  function handleActionFailure(
    status: number,
    data: ApiResponseData,
    fallbackMessage: string
  ) {
    if (status === 401) {
      invalidateSessionBoundary(null);
    }
    setErrorBanner({ error: data.error || fallbackMessage, code: data.code });
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    await withPendingAction('create-team', async () => {
      const requestGeneration = sessionGenerationRef.current;
      setErrorBanner(null);
      setSuccessBanner(null);
      const courseId = courses[0]?.id || 1;
      const { ok, status, data } = await apiFetch('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name: newTeamName, courseId }),
      });
      if (requestGeneration !== sessionGenerationRef.current) return;
      if (!ok) {
        handleActionFailure(status, data, 'Could not create team.');
        return;
      }
      if (!data.team) {
        setErrorBanner({ error: 'The server response did not include the new team.', code: 'INVALID_RESPONSE' });
        return;
      }
      setNewTeamName('');
      setSuccessBanner(`Created project team "${data.team.name}" successfully.`);
      if (token) await loadDashboardData(token, requestGeneration);
    });
  }

  async function handleAddMember(e: React.FormEvent, targetTeamId?: number) {
    e.preventDefault();
    await withPendingAction('add-member', async () => {
      const requestGeneration = sessionGenerationRef.current;
      setErrorBanner(null);
      setSuccessBanner(null);
      const tId = targetTeamId || myTeam?.id;
      if (!tId) return;

      const { ok, status, data } = await apiFetch(`/api/teams/${tId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: addMemberEmail }),
      });
      if (requestGeneration !== sessionGenerationRef.current) return;
      if (!ok) {
        handleActionFailure(status, data, 'Could not add team member.');
        return;
      }
      if (!data.team) {
        setErrorBanner({ error: 'The server response did not include the updated team.', code: 'INVALID_RESPONSE' });
        return;
      }
      setAddMemberEmail('');
      setSuccessBanner(
        `Added member to ${data.team.name} (${data.team.members.length}/${data.team.course.maxTeamSize} members).`
      );
      // Roster refreshes must not discard the current user's unsaved draft.
      if (token) await loadDashboardData(token, requestGeneration, false);
    });
  }

  async function handleSaveDraft() {
    if (!myTeam) return;
    await withPendingAction('save-draft', async () => {
      const requestGeneration = sessionGenerationRef.current;
      setErrorBanner(null);
      setSuccessBanner(null);
      const { ok, status, data } = await apiFetch(`/api/teams/${myTeam.id}/proposal`, {
        method: 'PUT',
        body: JSON.stringify({
          title: propTitle,
          problemStatement: propProblem,
          techStack: propStack,
          repoUrl: propRepo,
        }),
      });
      if (requestGeneration !== sessionGenerationRef.current) return;
      if (!ok) {
        handleActionFailure(status, data, 'Could not save proposal draft.');
        return;
      }
      setSuccessBanner('Proposal draft saved to PostgreSQL.');
      if (token) await loadDashboardData(token, requestGeneration);
    });
  }

  async function handleSubmitProposal() {
    if (!myTeam) return;
    await withPendingAction('submit-proposal', async () => {
      const requestGeneration = sessionGenerationRef.current;
      setErrorBanner(null);
      setSuccessBanner(null);
      const { ok, status, data } = await apiFetch(`/api/teams/${myTeam.id}/proposal/submit`, {
        method: 'POST',
        body: JSON.stringify({
          title: propTitle,
          problemStatement: propProblem,
          techStack: propStack,
          repoUrl: propRepo,
        }),
      });
      if (requestGeneration !== sessionGenerationRef.current) return;
      if (!ok) {
        handleActionFailure(status, data, 'Could not submit proposal.');
        return;
      }
      if (!data.proposal) {
        setErrorBanner({ error: 'The server response did not include the submitted proposal.', code: 'INVALID_RESPONSE' });
        return;
      }
      setSuccessBanner(
        `Proposal submitted for Instructor review (Status: ${data.proposal.status}, Revision #${data.proposal.revisionCount}).`
      );
      if (token) await loadDashboardData(token, requestGeneration);
    });
  }

  async function handleInspectTeamProposal(targetTeamId: number) {
    await withPendingAction('inspect-proposal', async () => {
      const requestGeneration = sessionGenerationRef.current;
      setErrorBanner(null);
      setSuccessBanner(null);
      const { ok, status, data } = await apiFetch(`/api/teams/${targetTeamId}/proposal`);
      if (requestGeneration !== sessionGenerationRef.current) return;
      if (!ok) {
        handleActionFailure(status, data, 'Could not load proposal.');
        return;
      }
      setSuccessBanner(`Loaded proposal for Team #${targetTeamId}: "${data.proposal?.title || 'No proposal'}"`);
    });
  }

  async function handleInstructorDecision(
    proposalId: number,
    decision: 'APPROVED' | 'REVISION_REQUESTED'
  ) {
    await withPendingAction('review-proposal', async () => {
      const requestGeneration = sessionGenerationRef.current;
      setErrorBanner(null);
      setSuccessBanner(null);
      const { ok, status, data } = await apiFetch(`/api/proposals/${proposalId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          reviewFeedback: reviewFeedbackInput,
        }),
      });
      if (requestGeneration !== sessionGenerationRef.current) return;
      if (!ok) {
        handleActionFailure(status, data, 'Could not record instructor decision.');
        return;
      }
      if (!data.proposal) {
        setErrorBanner({ error: 'The server response did not include the reviewed proposal.', code: 'INVALID_RESPONSE' });
        return;
      }
      setReviewFeedbackInput('');
      setSuccessBanner(
        `Proposal #${proposalId} transitioned to ${data.proposal.status} with recorded feedback.`
      );
      if (token) await loadDashboardData(token, requestGeneration);
    });
  }

  function statusBadgeClass(status?: string) {
    switch (status) {
      case 'APPROVED':
        return 'bg-success';
      case 'SUBMITTED':
        return 'bg-primary';
      case 'REVISION_REQUESTED':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  }

  // ==========================================================================
  // Unauthenticated View: Login Screen
  // ==========================================================================
  if (!user) {
    return (
      <div className="cpms-login-page">
        <header className="cpms-login-topbar">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="fw-bold fs-5">CoursePMS</span>
            <span className="cpms-course-pill" data-testid="release-badge">
              CPE 334 Cloud Release
            </span>
          </div>
          <span className="small" style={{ color: 'var(--cpms-navy-muted)' }}>
            Course Project Management System
          </span>
        </header>

        <main className="cpms-login-main">
          <div className="cpms-login-grid">
            <section className="cpms-login-hero" aria-label="CoursePMS overview">
              <div>
                <p className="text-uppercase small fw-semibold mb-2" style={{ letterSpacing: '0.06em' }}>
                  Academic Project Workspace
                </p>
                <h2 className="fw-bold fs-3 mb-3">
                  Coordinate project teams, proposals, and instructor reviews in one place.
                </h2>
                <p className="mb-0">
                  Sign in with your university credentials to form your course team, draft and submit
                  your project proposal, or review team submissions.
                </p>
              </div>
              <ul className="list-unstyled mb-0 small d-flex flex-column gap-2">
                <li>• Role-aware workspace for Students and Instructors</li>
                <li>• Team-scoped proposal drafting and revision history</li>
                <li>• Verified university account authentication</li>
              </ul>
            </section>

            <section className="cpms-login-form-panel" aria-labelledby="login-heading">
              {errorBanner && (
                <div className="cpms-alert cpms-alert-danger mb-3" data-testid="auth-error" role="alert">
                  <div>
                    <div className="fw-bold">
                      Request Rejected {errorBanner.code ? `(${errorBanner.code})` : ''}
                    </div>
                    <div>{errorBanner.error}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Dismiss error"
                    onClick={() => setErrorBanner(null)}
                  />
                </div>
              )}
              {successBanner && (
                <div
                  className="cpms-alert cpms-alert-success mb-3"
                  data-testid="auth-success"
                  role="status"
                  aria-live="polite"
                >
                  <div>{successBanner}</div>
                </div>
              )}

              <h1 id="login-heading" className="fw-bold fs-3 mb-1">
                Sign In to CoursePMS
              </h1>
              <p className="small mb-4" style={{ color: 'var(--cpms-text-secondary)' }}>
                Authenticate with your university account (Student or Instructor).
              </p>

              <form onSubmit={handleLogin} aria-labelledby="login-heading">
                <div className="mb-3">
                  <label className="cpms-label" htmlFor="login-email">
                    University Email
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    data-testid="login-email"
                    type="email"
                    className="cpms-input"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="next"
                    placeholder="name@mail.kmutt.ac.th"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <label className="cpms-label" htmlFor="login-password">
                    Password
                  </label>
                  <div className="cpms-password-row">
                    <input
                      id="login-password"
                      name="password"
                      data-testid="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="cpms-input"
                      autoComplete="current-password"
                      enterKeyHint="done"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="cpms-btn cpms-btn-secondary"
                      aria-pressed={showPassword}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  data-testid="login-submit"
                  className="cpms-btn cpms-btn-primary w-100"
                  disabled={pendingAction !== null}
                >
                  {pendingAction === 'login' ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================================
  // Authenticated View: Sidebar/Topbar + Role Workspace
  // ==========================================================================
  const filteredTeams =
    statusFilter === 'ALL'
      ? teams
      : teams.filter((t) => (t.proposal?.status || 'DRAFT') === statusFilter);

  const selectedInstructorTeam =
    teams.find((t) => t.id === selectedTeamId) || filteredTeams[0] || null;
  const proposalLocked =
    myTeam?.proposal?.status === 'SUBMITTED' || myTeam?.proposal?.status === 'APPROVED';
  const teamAtCapacity = Boolean(myTeam && myTeam.members.length >= myTeam.course.maxTeamSize);
  const canReviewSelectedProposal = selectedInstructorTeam?.proposal?.status === 'SUBMITTED';
  const courseCode = courses[0]?.code || 'CPE334';
  const courseTerm = courses[0]?.term || '1/2026';

  const navItems: Array<{
    key: 'overview' | 'team' | 'proposal' | 'teams' | 'review';
    label: string;
    sectionId: string;
  }> =
    user.role === 'STUDENT'
      ? [
          { key: 'overview', label: 'Overview', sectionId: 'main-content' },
          { key: 'team', label: 'My Team', sectionId: 'section-team' },
          { key: 'proposal', label: 'Proposal', sectionId: 'section-proposal' },
        ]
      : [
          { key: 'overview', label: 'Overview', sectionId: 'main-content' },
          { key: 'teams', label: 'Course Teams', sectionId: 'section-teams' },
          { key: 'review', label: 'Proposal Review', sectionId: 'section-review' },
        ];

  return (
    <>
      <a href="#main-content" className="cpms-skip-link">
        Skip to main content
      </a>

      <div className="cpms-app-shell">
        <aside className="cpms-sidebar">
          <div className="cpms-brand-row">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="cpms-brand-title">CoursePMS</span>
              <span className="cpms-course-pill">
                {courseCode} ({courseTerm})
              </span>
            </div>
            <button
              ref={menuToggleRef}
              type="button"
              className="cpms-menu-toggle"
              aria-expanded={mobileNavOpen}
              aria-controls="primary-nav"
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? 'Close' : 'Menu'}
            </button>
          </div>

          <nav
            id="primary-nav"
            aria-label="Primary"
            className="cpms-nav-container"
            data-open={mobileNavOpen ? 'true' : 'false'}
          >
            <ul className="cpms-nav-list">
              {navItems.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className="cpms-nav-link"
                    aria-current={activeNav === item.key ? 'page' : undefined}
                    onClick={() => navigateToSection(item.key, item.sectionId)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="cpms-workspace-column">
          <header className="cpms-topbar">
            <div>
              <h1 className="h4 fw-bold mb-0">
                {user.role === 'INSTRUCTOR' ? 'Instructor Review Console' : 'Student Workspace'}
              </h1>
              <div className="small" style={{ color: 'var(--cpms-text-secondary)' }}>
                {courses[0]?.name || 'Course Project Management System'}
              </div>
            </div>

            <div className="cpms-topbar-actions">
              <div className="text-end" data-testid="current-user-info">
                <div className="fw-semibold">
                  {user.fullName}{' '}
                  {user.studentCode ? (
                    <span style={{ color: 'var(--cpms-action)' }}>({user.studentCode})</span>
                  ) : null}
                </div>
                <div className="small cpms-wrap-anywhere" style={{ color: 'var(--cpms-text-secondary)' }}>
                  {user.email}
                </div>
              </div>
              <span
                data-testid="current-user-role"
                className={`badge ${
                  user.role === 'INSTRUCTOR' ? 'bg-warning text-dark' : 'bg-success'
                }`}
              >
                {user.role}
              </span>
              <button
                type="button"
                data-testid="logout-btn"
                className="cpms-btn cpms-btn-outline-dark"
                onClick={handleLogout}
                disabled={pendingAction !== null}
              >
                {pendingAction === 'logout' ? 'Logging out…' : 'Logout'}
              </button>
            </div>
          </header>

          <main id="main-content" tabIndex={-1} className="cpms-main-content">
            {loading && (
              <div className="cpms-alert cpms-alert-info" role="status">
                <div>Loading latest course data…</div>
              </div>
            )}
            {errorBanner && (
              <div className="cpms-alert cpms-alert-danger" data-testid="error-banner" role="alert">
                <div>
                  <div className="fw-bold">
                    Operation Rejected {errorBanner.code ? `[${errorBanner.code}]` : ''}
                  </div>
                  <div>{errorBanner.error}</div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Dismiss error"
                  onClick={() => setErrorBanner(null)}
                />
              </div>
            )}
            {successBanner && (
              <div
                className="cpms-alert cpms-alert-success"
                data-testid="success-banner"
                role="status"
                aria-live="polite"
              >
                <div>{successBanner}</div>
              </div>
            )}

            {/* ================================================================== */}
            {/* STUDENT WORKSPACE                                                  */}
            {/* ================================================================== */}
            {user.role === 'STUDENT' && (
              <div className="cpms-two-col">
                <div className="d-flex flex-column gap-4">
                  {/* My Team Card */}
                  <section id="section-team" className="cpms-card" aria-labelledby="my-team-heading">
                    <div className="cpms-card-header">
                      <h2 id="my-team-heading" className="h5 mb-0 fw-bold">
                        My Project Team
                      </h2>
                      {myTeam && (
                        <span className="badge bg-dark" data-testid="team-capacity-badge">
                          {myTeam.members.length} / {myTeam.course.maxTeamSize} Members
                        </span>
                      )}
                    </div>
                    <div className="cpms-card-body">
                      {myTeam ? (
                        <>
                          <div className="fw-bold fs-5 mb-1" style={{ color: 'var(--cpms-action)' }} data-testid="my-team-name">
                            {myTeam.name}
                          </div>
                          <p className="small mb-3" style={{ color: 'var(--cpms-text-secondary)' }}>
                            Course: {myTeam.course.code} — Maximum team size: {myTeam.course.maxTeamSize}
                          </p>

                          <h3 className="h6 fw-semibold mb-2">Team Roster</h3>
                          <ul className="list-group mb-3" data-testid="team-roster-list">
                            {myTeam.members.map((m) => (
                              <li
                                key={m.id}
                                className="list-group-item d-flex justify-content-between align-items-center gap-2"
                              >
                                <div className="d-flex align-items-center gap-2 min-w-0">
                                  <span className="cpms-avatar" aria-hidden="true">
                                    {getInitials(m.user.fullName)}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="fw-semibold">{m.user.fullName}</div>
                                    <div className="small cpms-wrap-anywhere" style={{ color: 'var(--cpms-text-secondary)' }}>
                                      {m.user.email}{' '}
                                      {m.user.studentCode ? `• ID: ${m.user.studentCode}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <span className="badge bg-secondary">{m.memberRole}</span>
                              </li>
                            ))}
                          </ul>

                          <form onSubmit={(e) => handleAddMember(e, myTeam.id)}>
                            <label className="cpms-label" htmlFor="add-member-email">
                              Add Teammate by University Email
                            </label>
                            <div className="cpms-inline-form">
                              <input
                                id="add-member-email"
                                type="email"
                                data-testid="add-member-email"
                                className="cpms-input"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                placeholder="teammate@mail.kmutt.ac.th"
                                value={addMemberEmail}
                                onChange={(e) => setAddMemberEmail(e.target.value)}
                                disabled={pendingAction !== null || teamAtCapacity || proposalLocked}
                              />
                              <button
                                type="submit"
                                data-testid="add-member-btn"
                                className="cpms-btn cpms-btn-secondary cpms-btn-full-mobile"
                                disabled={pendingAction !== null || teamAtCapacity || proposalLocked}
                              >
                                {pendingAction === 'add-member' ? 'Adding…' : 'Add Member'}
                              </button>
                            </div>
                            {teamAtCapacity && (
                              <div className="cpms-hint">This team has reached its member limit.</div>
                            )}
                            {proposalLocked && (
                              <div className="cpms-hint">
                                Team changes are locked while this proposal is under review or approved.
                              </div>
                            )}
                          </form>
                        </>
                      ) : (
                        <>
                          <p className="small mb-3" style={{ color: 'var(--cpms-text-secondary)' }}>
                            You are not currently assigned to a team in <strong>{courseCode}</strong>.
                            Create a new project team below, or ask an existing team member to add
                            your university email.
                          </p>
                          <form onSubmit={handleCreateTeam}>
                            <label className="cpms-label" htmlFor="create-team-name">
                              Create New Project Team in {courseCode}
                            </label>
                            <div className="cpms-inline-form">
                              <input
                                id="create-team-name"
                                type="text"
                                data-testid="create-team-name"
                                className="cpms-input"
                                placeholder="New team name (e.g., Team Gamma)"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                disabled={pendingAction !== null}
                              />
                              <button
                                type="submit"
                                data-testid="create-team-btn"
                                className="cpms-btn cpms-btn-primary cpms-btn-full-mobile"
                                disabled={pendingAction !== null}
                              >
                                {pendingAction === 'create-team' ? 'Creating…' : 'Create Team'}
                              </button>
                            </div>
                          </form>
                        </>
                      )}
                    </div>
                  </section>

                  {/* Course Teams Directory */}
                  <section className="cpms-card" aria-labelledby="directory-heading">
                    <div className="cpms-card-header">
                      <h2 id="directory-heading" className="h5 mb-0 fw-bold">
                        Course Teams Directory
                      </h2>
                    </div>
                    <div
                      className="cpms-table-scroll"
                      role="region"
                      tabIndex={0}
                      aria-label="Course teams directory"
                    >
                      <table className="cpms-table">
                        <caption className="visually-hidden">
                          Registered teams in the selected course and their proposal visibility
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Team</th>
                            <th scope="col">Members</th>
                            <th scope="col">Status</th>
                            <th scope="col" className="text-end">
                              Proposal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {teams.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-4" style={{ color: 'var(--cpms-text-secondary)' }}>
                                No project teams are available in this course yet.
                              </td>
                            </tr>
                          ) : (
                            teams.map((t) => (
                              <tr key={t.id}>
                                <td className="fw-semibold">{t.name}</td>
                                <td>
                                  {t.members.length}/{t.course.maxTeamSize}
                                </td>
                                <td>
                                  <span
                                    className={`badge ${statusBadgeClass(
                                      canViewTeamProposalStatus(t.id) ? t.proposal?.status : undefined
                                    )}`}
                                  >
                                    {canViewTeamProposalStatus(t.id)
                                      ? t.proposal?.status || 'NO_DRAFT'
                                      : 'PRIVATE'}
                                  </span>
                                </td>
                                <td className="text-end">
                                  <button
                                    type="button"
                                    data-testid={`inspect-proposal-${t.id}`}
                                    className="cpms-btn cpms-btn-secondary"
                                    onClick={() => handleInspectTeamProposal(t.id)}
                                    disabled={pendingAction !== null}
                                  >
                                    {pendingAction === 'inspect-proposal' ? 'Loading…' : 'View Proposal'}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                {/* Right Column: Project Proposal Editor */}
                <section id="section-proposal" className="cpms-card" aria-labelledby="proposal-heading">
                  <div className="cpms-card-header">
                    <div>
                      <h2 id="proposal-heading" className="h5 mb-0 fw-bold">
                        Team Project Proposal
                      </h2>
                      <div className="small" style={{ color: 'var(--cpms-text-secondary)' }}>
                        Draft your proposal, save progress, and submit for instructor review.
                      </div>
                    </div>
                    {myTeam?.proposal && (
                      <div className="text-end">
                        <span
                          data-testid="proposal-status"
                          className={`badge ${statusBadgeClass(myTeam.proposal.status)} fs-6`}
                        >
                          {myTeam.proposal.status}
                        </span>
                        <div className="small mt-1" style={{ color: 'var(--cpms-text-secondary)' }} data-testid="proposal-revision">
                          Revision #{myTeam.proposal.revisionCount}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="cpms-card-body">
                    {!myTeam ? (
                      <div className="cpms-alert cpms-alert-info mb-0">
                        <div>
                          Create a project team first, or ask an existing team member to add your
                          university email before drafting a proposal.
                        </div>
                      </div>
                    ) : (
                      <>
                        {myTeam.proposal?.reviewFeedback && (
                          <div
                            className={`cpms-alert mb-4 ${
                              myTeam.proposal.status === 'APPROVED'
                                ? 'cpms-alert-success'
                                : 'cpms-alert-warning'
                            }`}
                            data-testid="review-feedback-box"
                          >
                            <div>
                              <div className="fw-bold">
                                Instructor Review Decision: {myTeam.proposal.status}
                                {myTeam.proposal.reviewedBy
                                  ? ` (by ${myTeam.proposal.reviewedBy.fullName})`
                                  : ''}
                              </div>
                              <div className="mt-1">{myTeam.proposal.reviewFeedback}</div>
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="cpms-label" htmlFor="proposal-title">
                            Project Title <span className="text-danger">*</span>
                          </label>
                          <div id="proposal-title-hint" className="cpms-hint mb-1">
                            Required, minimum 5 characters.
                          </div>
                          <input
                            id="proposal-title"
                            type="text"
                            data-testid="proposal-title"
                            className="cpms-input"
                            aria-describedby="proposal-title-hint"
                            value={propTitle}
                            onChange={(e) => setPropTitle(e.target.value)}
                            disabled={proposalLocked || pendingAction !== null}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="cpms-label" htmlFor="proposal-problem">
                            Problem Statement &amp; Scope <span className="text-danger">*</span>
                          </label>
                          <div id="proposal-problem-hint" className="cpms-hint mb-1">
                            Required, minimum 20 characters.
                          </div>
                          <textarea
                            id="proposal-problem"
                            rows={4}
                            data-testid="proposal-problem"
                            className="cpms-textarea"
                            aria-describedby="proposal-problem-hint"
                            value={propProblem}
                            onChange={(e) => setPropProblem(e.target.value)}
                            disabled={proposalLocked || pendingAction !== null}
                          />
                        </div>

                        <div className="row g-3 mb-4">
                          <div className="col-md-6">
                            <label className="cpms-label" htmlFor="proposal-stack">
                              Selected Tech Stack <span className="text-danger">*</span>
                            </label>
                            <input
                              id="proposal-stack"
                              type="text"
                              data-testid="proposal-stack"
                              className="cpms-input"
                              value={propStack}
                              onChange={(e) => setPropStack(e.target.value)}
                              disabled={proposalLocked || pendingAction !== null}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="cpms-label" htmlFor="proposal-repo">
                              GitHub Repository URL
                            </label>
                            <input
                              id="proposal-repo"
                              type="url"
                              data-testid="proposal-repo"
                              className="cpms-input"
                              value={propRepo}
                              onChange={(e) => setPropRepo(e.target.value)}
                              disabled={proposalLocked || pendingAction !== null}
                            />
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            data-testid="save-draft-btn"
                            className="cpms-btn cpms-btn-secondary cpms-btn-full-mobile"
                            onClick={handleSaveDraft}
                            disabled={proposalLocked || pendingAction !== null}
                          >
                            {pendingAction === 'save-draft' ? 'Saving…' : 'Save Draft'}
                          </button>
                          <button
                            type="button"
                            data-testid="submit-proposal-btn"
                            className="cpms-btn cpms-btn-primary cpms-btn-full-mobile"
                            onClick={handleSubmitProposal}
                            disabled={proposalLocked || pendingAction !== null}
                          >
                            {pendingAction === 'submit-proposal'
                              ? 'Submitting…'
                              : 'Submit Proposal for Review'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* ================================================================== */}
            {/* INSTRUCTOR REVIEW CONSOLE                                          */}
            {/* ================================================================== */}
            {user.role === 'INSTRUCTOR' && (
              <div className="d-flex flex-column gap-4">
                <section className="cpms-metrics-grid" aria-label="Course proposal summary">
                  <div className="cpms-card">
                    <div className="cpms-card-body text-center">
                      <div className="small fw-semibold" style={{ color: 'var(--cpms-text-secondary)' }}>
                        Total Registered Teams
                      </div>
                      <div className="fs-3 fw-bold mt-1">{teams.length}</div>
                    </div>
                  </div>
                  <div className="cpms-card">
                    <div className="cpms-card-body text-center">
                      <div className="small fw-semibold" style={{ color: 'var(--cpms-action)' }}>
                        Submitted (Pending Review)
                      </div>
                      <div className="fs-3 fw-bold mt-1" style={{ color: 'var(--cpms-action)' }}>
                        {teams.filter((t) => t.proposal?.status === 'SUBMITTED').length}
                      </div>
                    </div>
                  </div>
                  <div className="cpms-card">
                    <div className="cpms-card-body text-center">
                      <div className="small fw-semibold text-success">Approved Proposals</div>
                      <div className="fs-3 fw-bold text-success mt-1">
                        {teams.filter((t) => t.proposal?.status === 'APPROVED').length}
                      </div>
                    </div>
                  </div>
                  <div className="cpms-card">
                    <div className="cpms-card-body text-center">
                      <div className="small fw-semibold" style={{ color: '#92400e' }}>
                        Revision Requested
                      </div>
                      <div className="fs-3 fw-bold mt-1" style={{ color: '#92400e' }}>
                        {teams.filter((t) => t.proposal?.status === 'REVISION_REQUESTED').length}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="cpms-two-col cpms-two-col--equal">
                  <section id="section-teams" className="cpms-card" aria-labelledby="all-teams-heading">
                    <div className="cpms-card-header">
                      <h2 id="all-teams-heading" className="h5 mb-0 fw-bold">
                        All Course Project Teams
                      </h2>
                      <div>
                        <label htmlFor="instructor-status-filter" className="visually-hidden">
                          Filter teams by proposal status
                        </label>
                        <select
                          id="instructor-status-filter"
                          data-testid="instructor-status-filter"
                          className="cpms-select"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="SUBMITTED">SUBMITTED</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="REVISION_REQUESTED">REVISION_REQUESTED</option>
                          <option value="DRAFT">DRAFT</option>
                        </select>
                      </div>
                    </div>
                    <div
                      className="cpms-table-scroll"
                      role="region"
                      tabIndex={0}
                      aria-label="All course project teams"
                    >
                      <table className="cpms-table">
                        <caption className="visually-hidden">
                          All course teams and their current proposal review status
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Team</th>
                            <th scope="col">Members</th>
                            <th scope="col">Proposal Status</th>
                            <th scope="col" className="text-end">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTeams.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-4" style={{ color: 'var(--cpms-text-secondary)' }}>
                                No teams match this status filter.
                              </td>
                            </tr>
                          ) : (
                            filteredTeams.map((t) => (
                              <tr
                                key={t.id}
                                className={
                                  selectedInstructorTeam?.id === t.id ? 'cpms-row-active' : undefined
                                }
                              >
                                <td>
                                  <div className="fw-bold">{t.name}</div>
                                  <div className="small" style={{ color: 'var(--cpms-text-secondary)' }}>
                                    {t.proposal?.title || 'No proposal'}
                                  </div>
                                </td>
                                <td>
                                  {t.members.length}/{t.course.maxTeamSize}
                                </td>
                                <td>
                                  <span
                                    className={`badge ${statusBadgeClass(
                                      canViewTeamProposalStatus(t.id) ? t.proposal?.status : undefined
                                    )}`}
                                  >
                                    {canViewTeamProposalStatus(t.id)
                                      ? t.proposal?.status || 'NONE'
                                      : 'PRIVATE'}
                                  </span>
                                </td>
                                <td className="text-end">
                                  <button
                                    type="button"
                                    data-testid={`select-team-${t.id}`}
                                    className="cpms-btn cpms-btn-secondary"
                                    onClick={() => setSelectedTeamId(t.id)}
                                  >
                                    Inspect / Review
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section id="section-review" className="cpms-card" aria-labelledby="review-panel-heading">
                    <div className="cpms-card-header">
                      <h2 id="review-panel-heading" className="h5 mb-0 fw-bold">
                        Instructor Proposal Review Panel
                      </h2>
                    </div>
                    <div className="cpms-card-body">
                      {!selectedInstructorTeam || !selectedInstructorTeam.proposal ? (
                        <div style={{ color: 'var(--cpms-text-secondary)' }}>
                          Select a team with a proposal to inspect.
                        </div>
                      ) : (
                        <>
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-3 flex-wrap">
                            <div>
                              <h3 className="h5 fw-bold mb-1" data-testid="review-panel-team">
                                {selectedInstructorTeam.name}: {selectedInstructorTeam.proposal.title}
                              </h3>
                              <div className="small" style={{ color: 'var(--cpms-text-secondary)' }}>
                                Members:{' '}
                                {selectedInstructorTeam.members
                                  .map((m) => `${m.user.fullName} (${m.user.studentCode || ''})`)
                                  .join(', ')}
                              </div>
                            </div>
                            <span
                              data-testid="review-panel-status"
                              className={`badge ${statusBadgeClass(
                                selectedInstructorTeam.proposal.status
                              )} fs-6`}
                            >
                              {selectedInstructorTeam.proposal.status}
                            </span>
                          </div>

                          <div
                            className="p-3 rounded mb-3 border"
                            style={{ backgroundColor: 'var(--cpms-surface-subtle)' }}
                          >
                            <div
                              className="fw-semibold small text-uppercase mb-1"
                              style={{ color: 'var(--cpms-text-secondary)' }}
                            >
                              Problem Statement
                            </div>
                            <p className="mb-2">{selectedInstructorTeam.proposal.problemStatement}</p>
                            <div className="small cpms-wrap-anywhere">
                              <strong>Tech Stack:</strong> {selectedInstructorTeam.proposal.techStack}{' '}
                              | <strong>Repo:</strong> {selectedInstructorTeam.proposal.repoUrl} |{' '}
                              <strong>Revision:</strong> #{selectedInstructorTeam.proposal.revisionCount}
                            </div>
                          </div>

                          {selectedInstructorTeam.proposal.reviewFeedback && (
                            <div className="cpms-alert cpms-alert-info small mb-3">
                              <div>
                                <strong>Latest Recorded Feedback:</strong>{' '}
                                {selectedInstructorTeam.proposal.reviewFeedback}
                              </div>
                            </div>
                          )}

                          <div className="mb-3">
                            <label className="cpms-label" htmlFor="review-feedback-input">
                              Instructor Review Feedback <span className="text-danger">*</span>
                            </label>
                            <div id="review-feedback-hint" data-testid="review-feedback-hint" className="cpms-hint mb-1">
                              Approve: minimum 10 after trim. Request revision: minimum 20 after trim.
                            </div>
                            <textarea
                              id="review-feedback-input"
                              rows={3}
                              data-testid="review-feedback-input"
                              className="cpms-textarea"
                              aria-describedby="review-feedback-hint"
                              placeholder="Provide feedback: 10 for approval, 20 for revision, after trim."
                              value={reviewFeedbackInput}
                              onChange={(e) => setReviewFeedbackInput(e.target.value)}
                              disabled={!canReviewSelectedProposal || pendingAction !== null}
                            />
                          </div>

                          {canReviewSelectedProposal ? (
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                data-testid="approve-proposal-btn"
                                aria-describedby="review-feedback-hint"
                                className="cpms-btn cpms-btn-success cpms-btn-full-mobile"
                                onClick={() =>
                                  handleInstructorDecision(
                                    selectedInstructorTeam.proposal!.id,
                                    'APPROVED'
                                  )
                                }
                                disabled={pendingAction !== null}
                              >
                                {pendingAction === 'review-proposal'
                                  ? 'Recording…'
                                  : 'Approve Proposal'}
                              </button>
                              <button
                                type="button"
                                data-testid="revision-proposal-btn"
                                aria-describedby="review-feedback-hint"
                                className="cpms-btn cpms-btn-warning cpms-btn-full-mobile"
                                onClick={() =>
                                  handleInstructorDecision(
                                    selectedInstructorTeam.proposal!.id,
                                    'REVISION_REQUESTED'
                                  )
                                }
                                disabled={pendingAction !== null}
                              >
                                {pendingAction === 'review-proposal'
                                  ? 'Recording…'
                                  : 'Request Revision'}
                              </button>
                            </div>
                          ) : (
                            <div className="small" style={{ color: 'var(--cpms-text-secondary)' }}>
                              Instructor decisions are available only while a proposal is submitted
                              for review.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
