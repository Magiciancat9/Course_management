import React, { useEffect, useRef, useState } from 'react';
import type { Course } from '../../App';

export interface MilestoneItem {
  id: number;
  courseId: number;
  title: string;
  description: string;
  dueDate: string;
  weightPercent: number;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  version: number;
}

interface MilestoneManagerProps {
  token: string;
  userRole: 'STUDENT' | 'INSTRUCTOR';
  courses: Course[];
  sessionGeneration: number;
  getCurrentGeneration: () => number;
  onUnauthorized: (message: string, code?: string) => void;
}

function toLocalDateTimeInput(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatDateWithTimezone(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export default function MilestoneManager({
  token,
  userRole,
  courses,
  sessionGeneration,
  getCurrentGeneration,
  onUnauthorized,
}: MilestoneManagerProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    courses[0]?.id ?? null
  );
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Instructor form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expectedVersion, setExpectedVersion] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<'DRAFT' | 'PUBLISHED' | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [weightInput, setWeightInput] = useState('20');

  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [formError, setFormError] = useState<{ error: string; code?: string } | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (courses.length === 0) {
      setSelectedCourseId(null);
      setMilestones([]);
      return;
    }
    if (selectedCourseId === null || !courses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  function resetFormToNew() {
    setEditingId(null);
    setExpectedVersion(null);
    setEditingStatus(null);
    setTitleInput('');
    setDescriptionInput('');
    setDueDateInput('');
    setWeightInput('20');
    setFormError(null);
    setHasConflict(false);
  }

  function startEditing(item: MilestoneItem) {
    setEditingId(item.id);
    setExpectedVersion(item.version);
    setEditingStatus(item.status);
    setTitleInput(item.title);
    setDescriptionInput(item.description);
    setDueDateInput(toLocalDateTimeInput(item.dueDate));
    setWeightInput(String(item.weightPercent));
    setFormError(null);
    setFormSuccess(null);
    setHasConflict(false);
  }

  async function loadMilestones(courseId: number) {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const expectedGen = sessionGeneration;

    setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/milestones`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));

      if (controller.signal.aborted || expectedGen !== getCurrentGeneration()) {
        return;
      }

      if (res.status === 401) {
        onUnauthorized(
          String(data.error || 'Session expired or revoked.'),
          typeof data.code === 'string' ? data.code : undefined
        );
        return;
      }

      if (!res.ok) {
        setLoadError(String(data.error || 'Could not load milestones.'));
        return;
      }

      setMilestones(Array.isArray(data.milestones) ? data.milestones : []);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError' || expectedGen !== getCurrentGeneration()) {
        return;
      }
      setLoadError('Network error while loading milestones.');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      if (!controller.signal.aborted && expectedGen === getCurrentGeneration()) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (selectedCourseId !== null && token) {
      loadMilestones(selectedCourseId);
    }
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [selectedCourseId, token, sessionGeneration]);

  async function handleSaveMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (selectedCourseId === null || pendingAction !== null) return;

    setFormError(null);
    setFormSuccess(null);
    setHasConflict(false);

    const parsedDate = dueDateInput ? new Date(dueDateInput) : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      setFormError({
        error: 'Please enter a valid due date and time.',
        code: 'MILESTONE_DUE_DATE_INVALID',
      });
      return;
    }

    const parsedWeight = Number(weightInput);
    if (!Number.isInteger(parsedWeight) || weightInput.trim() === '') {
      setFormError({
        error: 'Weight (%) must be an integer between 0 and 100.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const expectedGen = sessionGeneration;
    setPendingAction('save-milestone');

    try {
      const isEdit = editingId !== null && expectedVersion !== null;
      const url = isEdit
        ? `/api/milestones/${editingId}`
        : `/api/courses/${selectedCourseId}/milestones`;
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? {
            expectedVersion,
            title: titleInput,
            description: descriptionInput,
            dueDate: parsedDate.toISOString(),
            weightPercent: parsedWeight,
          }
        : {
            title: titleInput,
            description: descriptionInput,
            dueDate: parsedDate.toISOString(),
            weightPercent: parsedWeight,
          };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (expectedGen !== getCurrentGeneration()) return;

      if (res.status === 401) {
        onUnauthorized(
          String(data.error || 'Session expired or revoked.'),
          typeof data.code === 'string' ? data.code : undefined
        );
        return;
      }

      if (!res.ok) {
        if (data.code === 'MILESTONE_VERSION_CONFLICT') {
          setHasConflict(true);
        }
        setFormError({
          error: String(data.error || 'Could not save milestone.'),
          code: typeof data.code === 'string' ? data.code : undefined,
        });
        return;
      }

      setFormSuccess(isEdit ? 'Milestone updated.' : 'Milestone draft created.');
      resetFormToNew();
      await loadMilestones(selectedCourseId);
    } catch {
      if (expectedGen === getCurrentGeneration()) {
        setFormError({ error: 'Network error while saving milestone.' });
      }
    } finally {
      if (expectedGen === getCurrentGeneration()) {
        setPendingAction(null);
      }
    }
  }

  async function handlePublishMilestone(item: MilestoneItem) {
    if (selectedCourseId === null || pendingAction !== null) return;

    setFormError(null);
    setFormSuccess(null);
    setHasConflict(false);

    const expectedGen = sessionGeneration;
    setPendingAction(`publish-${item.id}`);

    try {
      const res = await fetch(`/api/milestones/${item.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expectedVersion: item.version }),
      });
      const data = await res.json().catch(() => ({}));

      if (expectedGen !== getCurrentGeneration()) return;

      if (res.status === 401) {
        onUnauthorized(
          String(data.error || 'Session expired or revoked.'),
          typeof data.code === 'string' ? data.code : undefined
        );
        return;
      }

      if (!res.ok) {
        if (data.code === 'MILESTONE_VERSION_CONFLICT') {
          setHasConflict(true);
        }
        setFormError({
          error: String(data.error || 'Could not publish milestone.'),
          code: typeof data.code === 'string' ? data.code : undefined,
        });
        return;
      }

      setFormSuccess(`Published "${item.title}".`);
      if (editingId === item.id) {
        resetFormToNew();
      }
      await loadMilestones(selectedCourseId);
    } catch {
      if (expectedGen === getCurrentGeneration()) {
        setFormError({ error: 'Network error while publishing milestone.' });
      }
    } finally {
      if (expectedGen === getCurrentGeneration()) {
        setPendingAction(null);
      }
    }
  }

  async function handleReloadAfterConflict() {
    if (selectedCourseId === null) return;
    await loadMilestones(selectedCourseId);
    setHasConflict(false);
    setFormError(null);
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;

  return (
    <section
      id="section-milestones"
      className="cpms-card mt-4"
      aria-labelledby="milestones-heading"
    >
      <div className="cpms-card-header">
        <div>
          <h2 id="milestones-heading" className="h5 mb-0 fw-bold">
            Course Milestones
          </h2>
          {selectedCourse && (
            <div className="small" style={{ color: 'var(--cpms-text-secondary)' }}>
              {selectedCourse.code} — {selectedCourse.name} ({selectedCourse.term})
            </div>
          )}
        </div>
        {courses.length > 1 && (
          <div>
            <label htmlFor="milestone-course-select" className="visually-hidden">
              Select course
            </label>
            <select
              id="milestone-course-select"
              data-testid="milestone-course-select"
              className="cpms-select"
              value={selectedCourseId ?? ''}
              onChange={(e) => {
                setSelectedCourseId(Number(e.target.value));
                resetFormToNew();
              }}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} ({c.term})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="cpms-card-body">
        {courses.length === 0 ? (
          <div data-testid="milestones-no-course" className="small" style={{ color: 'var(--cpms-text-secondary)' }}>
            No course context is available yet.
          </div>
        ) : (
          <>
            {formError && (
              <div
                className="cpms-alert cpms-alert-error mb-3"
                data-testid="milestone-form-error"
                role="alert"
              >
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <span>{formError.error}</span>
                  {hasConflict && (
                    <button
                      type="button"
                      data-testid="milestone-reload-btn"
                      className="cpms-btn cpms-btn-secondary"
                      onClick={handleReloadAfterConflict}
                    >
                      Reload latest
                    </button>
                  )}
                </div>
              </div>
            )}

            {formSuccess && (
              <div
                className="cpms-alert cpms-alert-success mb-3"
                data-testid="milestone-form-success"
                role="status"
                aria-live="polite"
              >
                {formSuccess}
              </div>
            )}

            {loadError && (
              <div className="cpms-alert cpms-alert-error mb-3" role="alert">
                {loadError}
              </div>
            )}

            {userRole === 'INSTRUCTOR' && (
              <form
                onSubmit={handleSaveMilestone}
                className="mb-4 p-3 rounded border"
                data-testid="milestone-form"
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h6 mb-0 fw-bold">
                    {editingId !== null ? `Edit Milestone (v${expectedVersion})` : 'New Milestone'}
                  </h3>
                  {editingId !== null && (
                    <button
                      type="button"
                      data-testid="milestone-new-btn"
                      className="cpms-btn cpms-btn-secondary"
                      onClick={resetFormToNew}
                      disabled={pendingAction !== null}
                    >
                      New milestone
                    </button>
                  )}
                </div>

                {editingStatus === 'PUBLISHED' && (
                  <div className="cpms-alert cpms-alert-info mb-3">
                    Editing a published milestone updates future submissions while preserving
                    historical submission snapshots.
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="cpms-label" htmlFor="milestone-title-input">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      id="milestone-title-input"
                      data-testid="milestone-title-input"
                      type="text"
                      className="cpms-input"
                      placeholder="e.g. Sprint 2 Delivery"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      disabled={pendingAction !== null}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="cpms-label" htmlFor="milestone-due-input">
                      Due Date (Local) <span className="text-danger">*</span>
                    </label>
                    <input
                      id="milestone-due-input"
                      data-testid="milestone-due-input"
                      type="datetime-local"
                      className="cpms-input"
                      value={dueDateInput}
                      onChange={(e) => setDueDateInput(e.target.value)}
                      disabled={pendingAction !== null}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="cpms-label" htmlFor="milestone-weight-input">
                      Weight (%) <span className="text-danger">*</span>
                    </label>
                    <input
                      id="milestone-weight-input"
                      data-testid="milestone-weight-input"
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      className="cpms-input"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      disabled={pendingAction !== null}
                    />
                  </div>
                  <div className="col-12">
                    <label className="cpms-label" htmlFor="milestone-desc-input">
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="milestone-desc-input"
                      data-testid="milestone-desc-input"
                      rows={3}
                      className="cpms-textarea"
                      placeholder="Describe deliverables and expectations (10–5000 characters)..."
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      disabled={pendingAction !== null}
                    />
                  </div>
                </div>

                <div className="mt-3 d-flex flex-wrap gap-2">
                  <button
                    type="submit"
                    data-testid="milestone-save-btn"
                    className="cpms-btn cpms-btn-primary"
                    disabled={pendingAction !== null}
                  >
                    {pendingAction === 'save-milestone'
                      ? 'Saving…'
                      : editingId !== null
                        ? 'Save Changes'
                        : 'Save Draft'}
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="small" style={{ color: 'var(--cpms-text-secondary)' }}>
                Loading milestones…
              </div>
            ) : milestones.length === 0 ? (
              <div
                data-testid="milestones-empty"
                className="small"
                style={{ color: 'var(--cpms-text-secondary)' }}
              >
                {userRole === 'INSTRUCTOR'
                  ? 'No milestones created for this course yet.'
                  : 'No published milestones for this course yet.'}
              </div>
            ) : (
              <div className="d-flex flex-column gap-3" data-testid="milestones-list">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    data-testid={`milestone-item-${m.id}`}
                    className="p-3 rounded border"
                  >
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="fw-bold">{m.title}</span>
                          <span
                            className={`cpms-badge ${
                              m.status === 'PUBLISHED' ? 'cpms-badge-success' : 'cpms-badge-muted'
                            }`}
                          >
                            {m.status}
                          </span>
                          <span className="small" style={{ color: 'var(--cpms-text-secondary)' }}>
                            Weight: {m.weightPercent}% · v{m.version}
                          </span>
                        </div>
                        <div className="small mt-1" style={{ color: 'var(--cpms-text-secondary)' }}>
                          Due: {formatDateWithTimezone(m.dueDate)}
                          {m.publishedAt && ` · Published: ${formatDateWithTimezone(m.publishedAt)}`}
                        </div>
                      </div>

                      {userRole === 'INSTRUCTOR' && (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            data-testid={`milestone-edit-btn-${m.id}`}
                            className="cpms-btn cpms-btn-secondary"
                            onClick={() => startEditing(m)}
                            disabled={pendingAction !== null}
                          >
                            Edit
                          </button>
                          {m.status === 'DRAFT' && (
                            <button
                              type="button"
                              data-testid={`milestone-publish-btn-${m.id}`}
                              className="cpms-btn cpms-btn-success"
                              onClick={() => handlePublishMilestone(m)}
                              disabled={pendingAction !== null}
                            >
                              {pendingAction === `publish-${m.id}` ? 'Publishing…' : 'Publish'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="mb-0 mt-2 small">{m.description}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
