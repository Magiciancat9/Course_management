import React, { useEffect, useRef, useState } from 'react';

export interface GradePublicationItem {
  id: number;
  score: number;
  feedback: string;
  submissionVersion: number;
  draftRevision: number;
  publishedAt: string;
  publishedBy?: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface InstructorEvaluationDto {
  id: number;
  submissionId: number;
  submissionVersion: number;
  version: number;
  draftRevision: number;
  publishedDraftRevision: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'CORRECTION_DRAFT';
  draft: {
    score: number;
    feedback: string;
    draftRevision: number;
    updatedById: number;
    updatedAt: string;
  };
  published: GradePublicationItem | null;
  publications: GradePublicationItem[];
}

export interface GradingSubmissionTarget {
  id: number;
  version: number;
  repoUrl: string;
  reportUrl: string | null;
  releaseTag: string;
  notes: string;
}

export interface GradingConsoleProps {
  token: string;
  submission: GradingSubmissionTarget;
  sessionGeneration: number;
  getCurrentGeneration: () => number;
  onUnauthorized: (message: string, code?: string) => void;
  onEvaluationPublished?: () => void;
  onStaleSubmissionVersion?: () => Promise<void> | void;
}

function formatBangkokTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return (
    new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok',
      timeZoneName: 'short',
    }).format(date) + ' (Asia/Bangkok)'
  );
}

export default function GradingConsole({
  token,
  submission,
  sessionGeneration,
  getCurrentGeneration,
  onUnauthorized,
  onEvaluationPublished,
  onStaleSubmissionVersion,
}: GradingConsoleProps) {
  const [activeSubmission, setActiveSubmission] =
    useState<GradingSubmissionTarget>(submission);
  const propContextKey = `${token}:${sessionGeneration}:${submission.id}:${submission.version}`;
  const contextKey = `${token}:${sessionGeneration}:${activeSubmission.id}:${activeSubmission.version}`;
  const currentContextRef = useRef(contextKey);
  currentContextRef.current = contextKey;

  const [evaluation, setEvaluation] = useState<InstructorEvaluationDto | null>(null);
  const [expectedVersion, setExpectedVersion] = useState<number>(0);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingAction, setPendingAction] = useState<'save-draft' | 'publish' | null>(null);
  const pendingRef = useRef<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [conflictType, setConflictType] = useState<
    'GRADE_VERSION_CONFLICT' | 'STALE_SUBMISSION_VERSION' | null
  >(null);

  const controllersRef = useRef<Set<AbortController>>(new Set());
  const mountedRef = useRef<boolean>(false);

  function isCurrent(expectedKey: string, expectedGen: number): boolean {
    return (
      mountedRef.current &&
      currentContextRef.current === expectedKey &&
      expectedGen === getCurrentGeneration()
    );
  }

  async function apiRequest(
    url: string,
    init: RequestInit = {},
    expectedKey = currentContextRef.current,
    expectedGen = sessionGeneration
  ) {
    const controller = new AbortController();
    controllersRef.current.add(controller);
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...init.headers,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (controller.signal.aborted || !isCurrent(expectedKey, expectedGen)) {
        return null;
      }
      if (res.status === 401) {
        onUnauthorized(
          String(data.error || 'Session expired or revoked.'),
          typeof data.code === 'string' ? data.code : undefined
        );
        return null;
      }
      return { ok: res.ok, status: res.status, data };
    } catch {
      if (controller.signal.aborted || !isCurrent(expectedKey, expectedGen)) {
        return null;
      }
      return {
        ok: false,
        status: 0,
        data: { error: 'Network error while communicating with grading service.' },
      };
    } finally {
      controllersRef.current.delete(controller);
    }
  }

  async function loadEvaluation(
    options: {
      preserveDraft?: boolean;
      refreshSupersededSubmission?: boolean;
      targetSub?: GradingSubmissionTarget;
    } = {}
  ) {
    const {
      preserveDraft = false,
      refreshSupersededSubmission = false,
      targetSub = activeSubmission,
    } = options;

    const expectedKey = currentContextRef.current;
    const expectedGen = sessionGeneration;
    setLoading(true);
    setErrorMsg(null);

    if (refreshSupersededSubmission) {
      // Clear stale draft immediately so an older version's grade is never transferred to newer work
      setEvaluation(null);
      setExpectedVersion(0);
      setScoreInput('');
      setFeedbackInput('');
      setConflictType(null);
      if (onStaleSubmissionVersion) {
        await onStaleSubmissionVersion();
      }
    }

    // When refreshing after STALE_SUBMISSION_VERSION, omit ?submissionVersion= so the API resolves the current latest version
    const url = refreshSupersededSubmission
      ? `/api/submissions/${targetSub.id}/evaluation`
      : `/api/submissions/${targetSub.id}/evaluation?submissionVersion=${targetSub.version}`;

    const res = await apiRequest(url, {}, expectedKey, expectedGen);
    if (!res || !isCurrent(expectedKey, expectedGen)) return;

    if (!res.ok) {
      setErrorMsg(String(res.data.error || 'Could not load grading state.'));
      setLoading(false);
      return;
    }

    const loaded = (res.data.evaluation as InstructorEvaluationDto | null) ?? null;
    let nextSub = targetSub;

    if (
      res.data.currentSubmission &&
      typeof res.data.currentSubmission === 'object' &&
      typeof res.data.currentSubmission.version === 'number'
    ) {
      nextSub = res.data.currentSubmission as GradingSubmissionTarget;
    } else if (typeof res.data.currentSubmissionVersion === 'number') {
      nextSub = { ...targetSub, version: res.data.currentSubmissionVersion };
    } else if (loaded && typeof loaded.submissionVersion === 'number') {
      nextSub = { ...targetSub, version: loaded.submissionVersion };
    } else if (refreshSupersededSubmission) {
      nextSub = { ...targetSub, version: targetSub.version + 1 };
    }

    const nextKey = `${token}:${sessionGeneration}:${nextSub.id}:${nextSub.version}`;
    currentContextRef.current = nextKey;
    setActiveSubmission(nextSub);
    setEvaluation(loaded);
    setExpectedVersion(loaded?.version ?? 0);

    if (!preserveDraft) {
      if (loaded) {
        setScoreInput(String(loaded.draft.score));
        setFeedbackInput(loaded.draft.feedback);
      } else {
        setScoreInput('');
        setFeedbackInput('');
      }
    }

    setConflictType(null);
    if (refreshSupersededSubmission) {
      setSuccessMsg(
        `Loaded newer submission v${nextSub.version}. Review the updated deliverable before entering a grade.`
      );
    } else if (preserveDraft) {
      setSuccessMsg(
        `Reloaded latest grade state (v${loaded?.version ?? 0}). Your typed draft is preserved — review and save again.`
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    mountedRef.current = true;
    setActiveSubmission(submission);
    const initialKey = `${token}:${sessionGeneration}:${submission.id}:${submission.version}`;
    currentContextRef.current = initialKey;
    setEvaluation(null);
    setExpectedVersion(0);
    setScoreInput('');
    setFeedbackInput('');
    setPendingAction(null);
    pendingRef.current = false;
    setErrorMsg(null);
    setSuccessMsg(null);
    setConflictType(null);
    void loadEvaluation({ preserveDraft: false, targetSub: submission });

    return () => {
      mountedRef.current = false;
      controllersRef.current.forEach((c) => c.abort());
      controllersRef.current.clear();
    };
  }, [propContextKey]);

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (loading || pendingRef.current) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setConflictType(null);

    const trimmedScore = scoreInput.trim();
    const parsedScore = Number(trimmedScore);
    if (
      trimmedScore === '' ||
      !Number.isInteger(parsedScore) ||
      parsedScore < 0 ||
      parsedScore > 100
    ) {
      setErrorMsg('Score must be an integer between 0 and 100 inclusive.');
      return;
    }

    const trimmedFeedback = feedbackInput.trim();
    if (trimmedFeedback.length < 1 || trimmedFeedback.length > 2000) {
      setErrorMsg('Feedback must be between 1 and 2000 characters.');
      return;
    }

    const expectedKey = currentContextRef.current;
    const expectedGen = sessionGeneration;
    pendingRef.current = true;
    setPendingAction('save-draft');

    try {
      const res = await apiRequest(
        `/api/submissions/${activeSubmission.id}/evaluation`,
        {
          method: 'PUT',
          body: JSON.stringify({
            submissionVersion: activeSubmission.version,
            expectedVersion,
            score: parsedScore,
            feedback: feedbackInput,
          }),
        },
        expectedKey,
        expectedGen
      );

      if (!res || !isCurrent(expectedKey, expectedGen)) return;

      if (!res.ok) {
        if (res.data.code === 'STALE_SUBMISSION_VERSION') {
          setConflictType('STALE_SUBMISSION_VERSION');
        } else if (res.status === 409 || res.data.code === 'GRADE_VERSION_CONFLICT') {
          setConflictType('GRADE_VERSION_CONFLICT');
        }
        setErrorMsg(String(res.data.error || 'Could not save grading draft.'));
        return;
      }

      const saved = res.data.evaluation as InstructorEvaluationDto;
      setEvaluation(saved);
      setExpectedVersion(saved.version);
      setScoreInput(String(saved.draft.score));
      setFeedbackInput(saved.draft.feedback);
      setSuccessMsg(
        `Saved grading draft (revision ${saved.draftRevision}, resource v${saved.version}). Not yet published to students.`
      );
    } finally {
      if (isCurrent(expectedKey, expectedGen)) {
        pendingRef.current = false;
        setPendingAction(null);
      }
    }
  }

  async function handlePublishGrade() {
    if (loading || pendingRef.current || !evaluation) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setConflictType(null);

    const expectedKey = currentContextRef.current;
    const expectedGen = sessionGeneration;
    pendingRef.current = true;
    setPendingAction('publish');

    try {
      const res = await apiRequest(
        `/api/submissions/${activeSubmission.id}/evaluation/publish`,
        {
          method: 'POST',
          body: JSON.stringify({
            submissionVersion: activeSubmission.version,
            expectedVersion,
          }),
        },
        expectedKey,
        expectedGen
      );

      if (!res || !isCurrent(expectedKey, expectedGen)) return;

      if (!res.ok) {
        if (res.data.code === 'STALE_SUBMISSION_VERSION') {
          setConflictType('STALE_SUBMISSION_VERSION');
        } else if (res.status === 409 || res.data.code === 'GRADE_VERSION_CONFLICT') {
          setConflictType('GRADE_VERSION_CONFLICT');
        }
        setErrorMsg(String(res.data.error || 'Could not publish grade.'));
        return;
      }

      const published = res.data.evaluation as InstructorEvaluationDto;
      setEvaluation(published);
      setExpectedVersion(published.version);
      setSuccessMsg(
        `Published grade (${published.published?.score}/100) for submission v${activeSubmission.version}.`
      );
      onEvaluationPublished?.();
    } finally {
      if (isCurrent(expectedKey, expectedGen)) {
        pendingRef.current = false;
        setPendingAction(null);
      }
    }
  }

  const trimmedScore = scoreInput.trim();
  const parsedScore = Number(trimmedScore);
  const hasUnsavedDraftChanges =
    evaluation === null ||
    trimmedScore === '' ||
    !Number.isInteger(parsedScore) ||
    parsedScore !== evaluation.draft.score ||
    feedbackInput.trim() !== evaluation.draft.feedback;

  const canPublishDraft =
    evaluation !== null &&
    evaluation.publishedDraftRevision !== evaluation.draftRevision &&
    !hasUnsavedDraftChanges &&
    !loading &&
    pendingAction === null;

  const badgeLabel = evaluation ? evaluation.status : 'UNGRADED';

  return (
    <section
      className="mt-4 p-3 border rounded"
      aria-label={`Instructor grading for submission version ${activeSubmission.version}`}
      data-testid="grading-console"
    >
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <h4 className="h6 mb-0 fw-bold">
          Instructor Grading — Submission v{activeSubmission.version} ({activeSubmission.releaseTag})
        </h4>
        <span className="cpms-badge cpms-badge-muted" data-testid="grading-status-badge">
          {badgeLabel}
        </span>
      </div>

      <div className="small mb-3" style={{ color: 'var(--cpms-text-secondary)' }}>
        Evaluating artifact <code>{activeSubmission.repoUrl}</code>
        {activeSubmission.reportUrl ? (
          <>
            {' '}
            and report <code>{activeSubmission.reportUrl}</code>
          </>
        ) : null}
        . Saving a draft does not publish the grade to students.
      </div>

      {loading && <p role="status">Loading grading state…</p>}

      {errorMsg && (
        <div
          className="cpms-alert cpms-alert-error mb-3"
          role="alert"
          data-testid="grading-error"
        >
          <span>{errorMsg}</span>
          {conflictType !== null && (
            <button
              type="button"
              className="cpms-btn cpms-btn-secondary ms-2"
              data-testid="grading-reconcile-btn"
              disabled={loading || pendingAction !== null}
              onClick={() =>
                void loadEvaluation(
                  conflictType === 'STALE_SUBMISSION_VERSION'
                    ? { preserveDraft: false, refreshSupersededSubmission: true }
                    : { preserveDraft: true, refreshSupersededSubmission: false }
                )
              }
            >
              {conflictType === 'STALE_SUBMISSION_VERSION'
                ? 'Load newer submission version'
                : 'Reload latest and keep my draft'}
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div
          className="cpms-alert cpms-alert-success mb-3"
          role="status"
          data-testid="grading-success"
        >
          {successMsg}
        </div>
      )}

      {evaluation?.published && (
        <div className="p-2 border rounded mb-3 small" data-testid="grading-published-summary">
          <strong>Currently published to owning team (v{evaluation.published.submissionVersion}):</strong>{' '}
          {evaluation.published.score}/100 — {evaluation.published.feedback} (Published:{' '}
          {formatBangkokTime(evaluation.published.publishedAt)})
        </div>
      )}

      <form onSubmit={handleSaveDraft} data-testid="grading-form">
        <fieldset disabled={loading || pendingAction !== null}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="cpms-label" htmlFor="grading-score-input">
                Score (0–100) <span className="text-danger">*</span>
              </label>
              <input
                id="grading-score-input"
                data-testid="grading-score-input"
                type="number"
                min={0}
                max={100}
                step={1}
                className="cpms-input"
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
              />
            </div>
            <div className="col-md-9">
              <label className="cpms-label" htmlFor="grading-feedback-input">
                Rubric Feedback (1–2000 chars) <span className="text-danger">*</span>
              </label>
              <textarea
                id="grading-feedback-input"
                data-testid="grading-feedback-input"
                rows={3}
                maxLength={2000}
                className="cpms-textarea"
                placeholder="Enter private team feedback..."
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
              />
            </div>
          </div>

          {evaluation !== null && hasUnsavedDraftChanges && (
            <div
              className="small mt-2"
              data-testid="grading-unsaved-warning"
              style={{ color: 'var(--cpms-text-secondary)' }}
            >
              Save your modified draft before publishing so the published grade matches the form.
            </div>
          )}

          <div className="mt-3 d-flex flex-wrap gap-2">
            <button
              type="submit"
              data-testid="grading-save-draft-btn"
              className="cpms-btn cpms-btn-primary"
              disabled={loading || pendingAction !== null}
            >
              {pendingAction === 'save-draft' ? 'Saving draft…' : 'Save grading draft'}
            </button>
            <button
              type="button"
              data-testid="grading-publish-btn"
              className="cpms-btn cpms-btn-success"
              disabled={!canPublishDraft}
              onClick={() => void handlePublishGrade()}
            >
              {pendingAction === 'publish' ? 'Publishing grade…' : 'Publish grade'}
            </button>
          </div>
        </fieldset>
      </form>

      {evaluation && evaluation.publications.length > 1 && (
        <div className="mt-3 small" data-testid="grading-publication-history">
          <strong>Publication history for submission v{activeSubmission.version}:</strong>
          <ul className="mb-0 mt-1">
            {evaluation.publications.map((pub) => (
              <li key={pub.id}>
                Draft rev {pub.draftRevision}: {pub.score}/100 — {pub.feedback} (
                {formatBangkokTime(pub.publishedAt)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
