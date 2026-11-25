import React, { useEffect, useRef, useState } from 'react';

type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';
type Draft = { title: string; description: string; sprintNumber: number; status: Status; assigneeId: string; milestoneId: string };
interface Task extends Omit<Draft, 'assigneeId' | 'milestoneId'> {
  id: number; teamId: number; version: number; assigneeId: number | null; milestoneId: number | null;
}
interface Team { id: number; name: string; courseId: number; proposalStatus: string | null; members: { id: number; name: string }[] }
interface Milestone { id: number; title: string; status: string }
interface Event { id: number; version: number; actor: { fullName: string }; createdAt: string; changes: Record<string, { before: string | number | null; after: string | number | null }> }
interface Props { token: string; userRole: 'STUDENT' | 'INSTRUCTOR'; teams: Team[]; sessionGeneration: number;
  getCurrentGeneration: () => number; onUnauthorized: (message: string, code?: string) => void }
const empty = (): Draft => ({ title: '', description: '', sprintNumber: 3, status: 'TODO', assigneeId: '', milestoneId: '' });
const labels: Record<Status, string> = { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Done' };
const formatTime = (value: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok',
  year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value));
const toDraft = (task: Task): Draft => ({ title: task.title, description: task.description, sprintNumber: task.sprintNumber,
  status: task.status, assigneeId: task.assigneeId?.toString() ?? '', milestoneId: task.milestoneId?.toString() ?? '' });

export default function TaskBoard(props: Props) {
  const { token, userRole, teams, sessionGeneration, getCurrentGeneration, onUnauthorized } = props;
  const [teamId, setTeamId] = useState(teams[0]?.id ?? 0);
  const team = teams.find(t => t.id === teamId);
  const [sprint, setSprint] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);
  const [editing, setEditing] = useState<{ id: number; version: number } | null>(null);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadedContext, setLoadedContext] = useState('');
  const [history, setHistory] = useState<{ taskId: number; title: string; events: Event[]; cursor: number | null } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const context = `${token}:${sessionGeneration}:${teamId}`;
  const contextRef = useRef(context); contextRef.current = context;
  const abortRef = useRef(new AbortController());
  const listSeq = useRef(0), historySeq = useRef(0);
  const listAbort = useRef<AbortController | null>(null);
  const alive = (captured: string) => contextRef.current === captured && getCurrentGeneration() === sessionGeneration && !abortRef.current.signal.aborted;
  const writable = userRole === 'STUDENT' && team?.proposalStatus === 'APPROVED';

  async function api(path: string, init: RequestInit = {}, captured = context, signal = abortRef.current.signal) {
    const response = await fetch(path, { ...init, signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!alive(captured)) return null;
    if (response.status === 401) { onUnauthorized(data.error || 'Your session has expired.', data.code); return null; }
    return { response, data };
  }

  async function loadTasks(append = false) {
    const captured = context, sequence = ++listSeq.current;
    listAbort.current?.abort(); const controller = new AbortController(); listAbort.current = controller;
    if (append) setLoadingMore(true);
    else { setLoading(true); setLoadingMore(false); setCursor(null); }
    const params = new URLSearchParams();
    if (sprint) params.set('sprintNumber', sprint);
    if (statusFilter) params.set('status', statusFilter);
    if (append && cursor) params.set('afterId', String(cursor));
    try {
      const result = await api(`/api/teams/${teamId}/tasks?${params}`, {}, captured, controller.signal);
      if (!result || sequence !== listSeq.current) return;
      if (!result.response.ok) throw new Error(result.data.error || 'Unable to load tasks.');
      if (!Array.isArray(result.data.tasks)) throw new Error('Unexpected task response. Refresh tasks to retry.');
      setTasks(old => append ? [...old, ...result.data.tasks.filter((t: Task) => !old.some(o => o.id === t.id))] : result.data.tasks);
      setCursor(result.data.nextAfterId); setLoadedContext(captured);
    } catch (cause) {
      if (alive(captured) && sequence === listSeq.current && !controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Unable to load tasks.'); setLoadedContext(captured);
      }
    } finally { if (alive(captured) && sequence === listSeq.current) { setLoading(false); setLoadingMore(false); } }
  }

  async function loadMilestones(captured: string, courseId: number) {
    const all: Milestone[] = []; let after: number | null = null;
    try {
      do {
        const result = await api(`/api/courses/${courseId}/milestones?limit=100${after ? `&afterId=${after}` : ''}`, {}, captured);
        if (!result) return;
        if (!result.response.ok) throw new Error('Unable to load milestone choices.');
        all.push(...result.data.milestones.filter((m: Milestone) => m.status === 'PUBLISHED'));
        after = result.data.nextAfterId;
      } while (after && alive(captured));
      if (alive(captured)) setMilestones(all);
    } catch { if (alive(captured)) setError('Milestone choices could not be loaded. Refresh tasks to try again.'); }
  }

  useEffect(() => { if (!teams.some(t => t.id === teamId)) setTeamId(teams[0]?.id ?? 0); }, [teams, teamId]);
  useEffect(() => {
    abortRef.current = new AbortController();
    setTasks([]); setMilestones([]); setCursor(null); setDraft(empty()); setEditing(null); setHistory(null);
    setPending(false); setConflict(false); setError(''); setSuccess(''); setHistoryLoading(false); setLoadingMore(false); setLoadedContext('');
    if (team) void loadMilestones(context, team.courseId);
    return () => { abortRef.current.abort(); listAbort.current?.abort(); historySeq.current++; };
  }, [context]);
  useEffect(() => { if (team) void loadTasks(); else setLoading(false); }, [context, sprint, statusFilter]);

  function edit(task: Task, nextStatus?: Status) {
    setDraft({ ...toDraft(task), ...(nextStatus ? { status: nextStatus } : {}) });
    setEditing({ id: task.id, version: task.version }); setConflict(false); setError(''); setSuccess('');
  }
  async function save(input = draft, target = editing) {
    if (pending || !writable) return;
    const captured = context;
    historySeq.current++; setHistoryLoading(false); setHistory(null);
    setPending(true); setError(''); setSuccess(''); setConflict(false);
    try {
      const result = await api(target ? `/api/tasks/${target.id}` : `/api/teams/${teamId}/tasks`, {
        method: target ? 'PUT' : 'POST', body: JSON.stringify({ ...input, assigneeId: input.assigneeId ? Number(input.assigneeId) : null,
          milestoneId: input.milestoneId ? Number(input.milestoneId) : null, expectedVersion: target?.version ?? 0 }),
      }, captured);
      if (!result) return;
      if (!result.response.ok) {
        if (result.response.status === 409 && result.data.code === 'TASK_VERSION_CONFLICT') setConflict(true);
        throw new Error(result.data.error || 'Unable to save task.');
      }
      setSuccess('Task saved.'); setDraft(empty()); setEditing(null); setHistory(null);
      await loadTasks();
    } catch (cause) { if (alive(captured)) setError(cause instanceof Error ? cause.message : 'Unable to save task.'); }
    finally { if (alive(captured)) setPending(false); }
  }
  async function reconcile() {
    if (!editing || pending) return;
    const captured = context; setPending(true);
    try {
      const result = await api(`/api/teams/${teamId}/tasks?limit=1${editing.id > 1 ? `&afterId=${editing.id - 1}` : ''}`, {}, captured);
      if (!result) return;
      const latest = result.data.tasks?.find((t: Task) => t.id === editing.id);
      if (!result.response.ok || !latest) throw new Error('This task is no longer available. Refresh the task list.');
      setEditing({ id: latest.id, version: latest.version }); setConflict(false); setError('');
      setSuccess('Latest version loaded. Your draft is retained; review it before saving.');
    } catch (cause) { if (alive(captured)) setError(cause instanceof Error ? cause.message : 'Unable to load latest version.'); }
    finally { if (alive(captured)) setPending(false); }
  }
  async function loadHistory(task: { id: number; title: string }, append = false) {
    const captured = context, sequence = ++historySeq.current;
    const after = append && history?.taskId === task.id ? history.cursor : null;
    setHistoryLoading(true);
    if (!append) setHistory({ taskId: task.id, title: task.title, events: [], cursor: null });
    try {
      const result = await api(`/api/tasks/${task.id}/events${after ? `?afterId=${after}` : ''}`, {}, captured);
      if (!result || sequence !== historySeq.current) return;
      if (!result.response.ok) throw new Error(result.data.error || 'Unable to load activity.');
      setHistory(old => ({ taskId: task.id, title: task.title, events: append && old?.taskId === task.id ? [...old.events, ...result.data.events] : result.data.events,
        cursor: result.data.nextAfterId }));
    } catch (cause) { if (alive(captured) && sequence === historySeq.current) setError(cause instanceof Error ? cause.message : 'Unable to load activity.'); }
    finally { if (alive(captured) && sequence === historySeq.current) setHistoryLoading(false); }
  }
  function change(field: keyof Draft, value: string) { setDraft(old => ({ ...old, [field]: field === 'sprintNumber' ? Number(value) : value })); }
  function eventValue(field: string, value: string | number | null) {
    if (value === null) return 'None';
    if (field === 'status') return labels[value as Status];
    if (field === 'assigneeId') return team?.members.find(m => m.id === value)?.name || `Member ${value}`;
    if (field === 'milestoneId') return milestones.find(m => m.id === value)?.title || `Milestone ${value}`;
    return String(value);
  }

  return <section id="section-tasks" className="cpms-card mt-4" aria-labelledby="task-board-heading" data-testid="task-board">
    <div className="cpms-card-header"><h2 id="task-board-heading" className="h4 fw-bold mb-1">Team tasks</h2>
      <p className="cpms-muted mb-0">Plan, assign and track your team’s work.</p></div>
    <div className="cpms-card-body">
      {!teams.length ? <p>Join a project team to view tasks.</p> : <>
        <label className="cpms-label" htmlFor="task-team">Project team</label>
        <select id="task-team" className="cpms-input mb-3" value={teamId} disabled={pending} onChange={e => setTeamId(Number(e.target.value))}>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        {loadedContext !== context ? <p role="status">Loading tasks…</p> : <>
          {error && <div role="alert" className="alert alert-danger" data-testid="task-error">{error}
            {conflict && <button type="button" className="cpms-btn cpms-btn-secondary mt-2" disabled={pending} onClick={() => void reconcile()}>Load latest task version</button>}</div>}
          {success && <p role="status" className="alert alert-success" data-testid="task-success">{success}</p>}
          {userRole === 'INSTRUCTOR' ? <p>Instructor access is read-only.</p> : !writable && <p role="status">Your proposal must be approved before you can change tasks.</p>}
          <div className="row g-2 mb-3">
            <div className="col-sm"><label className="cpms-label" htmlFor="task-sprint-filter">Filter sprint</label>
              <select id="task-sprint-filter" className="cpms-input" value={sprint} disabled={pending} onChange={e => setSprint(e.target.value)}><option value="">All sprints</option>{[1, 2, 3].map(n => <option key={n} value={n}>Sprint {n}</option>)}</select></div>
            <div className="col-sm"><label className="cpms-label" htmlFor="task-status-filter">Filter status</label>
              <select id="task-status-filter" className="cpms-input" value={statusFilter} disabled={pending} onChange={e => setStatusFilter(e.target.value)}><option value="">All statuses</option>{Object.entries(labels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></div>
          </div>
          <button type="button" className="cpms-btn cpms-btn-secondary mb-3" disabled={pending || loading || loadingMore} onClick={() => { setError(''); void loadTasks(); if (team) void loadMilestones(context, team.courseId); }}>Refresh tasks</button>
          {loading ? <p role="status">Loading tasks…</p> : <>
            {!tasks.length && <p data-testid="task-empty">No tasks match these filters.</p>}
            <div className="row g-3">{Object.entries(labels).map(([value, label]) => <div className="col-lg-4" key={value}>
              <div className="h-100 rounded-3 border p-3" style={{ backgroundColor: 'var(--cpms-surface-subtle)' }}>
              <h3 className="h5 fw-semibold d-flex justify-content-between align-items-center">{label}<span className={`badge ${value === 'DONE' ? 'bg-success' : value === 'IN_PROGRESS' ? 'bg-primary' : 'bg-secondary'}`}>{tasks.filter(t => t.status === value).length}</span></h3>
              {tasks.filter(t => t.status === value).map(task => <article key={task.id} className="cpms-card p-3 mb-2" data-testid={`task-card-${task.id}`}>
                <h4 className="h6 text-break">{task.title}</h4><p className="text-break">{task.description}</p>
                <p className="cpms-muted">Sprint {task.sprintNumber} · {team?.members.find(m => m.id === task.assigneeId)?.name || 'Unassigned'} · Version {task.version}</p>
                {task.milestoneId && <p>{milestones.find(m => m.id === task.milestoneId)?.title || 'Linked milestone'}</p>}
                <div className="d-flex gap-2 flex-wrap">
                  {writable && <button type="button" className="cpms-btn cpms-btn-secondary" aria-label={`Edit ${task.title}`} disabled={pending} onClick={() => edit(task)}>Edit task</button>}
                  {writable && <button type="button" className="cpms-btn cpms-btn-secondary" disabled={pending || editing !== null} onClick={() => {
                    const next = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
                    edit(task, next); void save({ ...toDraft(task), status: next }, { id: task.id, version: task.version });
                  }}>{task.status === 'TODO' ? 'Start task' : task.status === 'IN_PROGRESS' ? 'Mark done' : 'Reopen task'}</button>}
                  <button type="button" className="cpms-btn cpms-btn-secondary" aria-label={`Activity for ${task.title}`} disabled={pending} onClick={() => void loadHistory(task)}>View activity</button>
                </div>
              </article>)}</div></div>)}</div>
          </>}
          {cursor && <button type="button" className="cpms-btn cpms-btn-secondary mt-2" disabled={pending || loadingMore || loading} onClick={() => void loadTasks(true)}>{loadingMore ? 'Loading more tasks…' : 'Load more tasks'}</button>}
          {writable && <form className="mt-4" data-testid="task-form" onSubmit={e => { e.preventDefault(); void save(); }}>
            <h3 className="h5">{editing ? 'Edit task' : 'Create task'}</h3>
            <fieldset disabled={pending}><div className="row g-3">
              <div className="col-12"><label className="cpms-label" htmlFor="task-title">Task title</label><input id="task-title" className="cpms-input" required minLength={3} maxLength={120} value={draft.title} onChange={e => change('title', e.target.value)} /></div>
              <div className="col-12"><label className="cpms-label" htmlFor="task-description">Task description</label><textarea id="task-description" className="cpms-textarea" maxLength={5000} value={draft.description} onChange={e => change('description', e.target.value)} /></div>
              <div className="col-sm-6"><label className="cpms-label" htmlFor="task-assignee">Assign to</label><select id="task-assignee" className="cpms-input" value={draft.assigneeId} onChange={e => change('assigneeId', e.target.value)}><option value="">Unassigned</option>{team?.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div className="col-sm-6"><label className="cpms-label" htmlFor="task-sprint">Sprint</label><select id="task-sprint" className="cpms-input" value={draft.sprintNumber} onChange={e => change('sprintNumber', e.target.value)}>{[1, 2, 3].map(n => <option key={n} value={n}>Sprint {n}</option>)}</select></div>
              <div className="col-sm-6"><label className="cpms-label" htmlFor="task-status">Task status</label><select id="task-status" className="cpms-input" value={draft.status} onChange={e => change('status', e.target.value)}>{Object.entries(labels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></div>
              <div className="col-sm-6"><label className="cpms-label" htmlFor="task-milestone">Milestone (optional)</label><select id="task-milestone" className="cpms-input" value={draft.milestoneId} onChange={e => change('milestoneId', e.target.value)}><option value="">No milestone</option>{milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
            </div>
            <button type="submit" className="cpms-btn cpms-btn-primary mt-3" disabled={conflict} data-testid="task-save">{pending ? 'Saving task…' : 'Save task'}</button>
            {editing && <button type="button" className="cpms-btn cpms-btn-secondary ms-2 mt-3" onClick={() => { setEditing(null); setDraft(empty()); setConflict(false); setError(''); }}>Cancel edit</button>}
            </fieldset>
          </form>}
          {history && <aside className="mt-4" aria-label="Task activity"><h3 className="h5">Activity: {history.title}</h3>
            {history.events.map(event => <div key={event.id} className="border-bottom py-2"><p className="mb-1">Version {event.version} · {event.actor.fullName} · {formatTime(event.createdAt)} (Asia/Bangkok)</p>
              <ul>{Object.entries(event.changes).map(([field, change]) => <li key={field}>{({ title: 'Title', description: 'Description', sprintNumber: 'Sprint', status: 'Status', assigneeId: 'Assignee', milestoneId: 'Milestone' } as Record<string, string>)[field]}: {eventValue(field, change.before)} → {eventValue(field, change.after)}</li>)}</ul></div>)}
            {historyLoading && <p role="status">Loading activity…</p>}
            {history.cursor && <button type="button" className="cpms-btn cpms-btn-secondary" disabled={historyLoading} onClick={() => void loadHistory({ id: history.taskId, title: history.title }, true)}>Load more activity</button>}
          </aside>}
        </>}
      </>}
    </div>
  </section>;
}
