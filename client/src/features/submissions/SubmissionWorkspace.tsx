import React, { useEffect, useRef, useState } from 'react';

interface Session {
  token: string;
  sessionGeneration: number;
  getCurrentGeneration: () => number;
  onUnauthorized: (message: string, code?: string) => void;
}
interface Submission {
  id: number;
  teamId?: number;
  version: number;
  repoUrl: string;
  reportUrl: string | null;
  releaseTag: string;
  notes: string;
  submittedAt: string;
  dueDateSnapshot: string | null;
  lateStatus: 'ON_TIME' | 'LATE' | 'UNKNOWN';
  publishedEvaluation: { score: number; feedback: string } | null;
  legacyEvaluation?: { score: number | null; feedback: string | null; publicationStatus: 'UNKNOWN' } | null;
}
export interface SubmissionWorkspaceProps extends Session {
  userRole: 'STUDENT' | 'INSTRUCTOR';
  courseId: number;
  milestone: { id: number; title: string; status: 'DRAFT' | 'PUBLISHED' };
  ownTeam: { id: number; proposalStatus: string | null } | null;
}
type Payload = Record<string, any>;

// Every read/mutation is tied to both the authenticated session and resource
// context. An old response cannot clear a new user's draft or pending state.
function useRequests(session: Session, context: string) {
  const current = useRef(context);
  current.current = context;
  const mounted = useRef(false);
  const controllers = useRef(new Set<AbortController>());
  const isCurrent = () => mounted.current && current.current === context &&
    session.sessionGeneration === session.getCurrentGeneration();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controllers.current.forEach(controller => controller.abort());
      controllers.current.clear();
    };
  }, [context]);
  async function request(url: string, init: RequestInit = {}) {
    const controller = new AbortController();
    controllers.current.add(controller);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}`, ...init.headers } });
      let data: Payload;
      try {
        data = await response.json();
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid response');
      } catch { data = { error: 'The server returned an unreadable response.', code: 'INVALID_RESPONSE' }; }
      if (!isCurrent() || controller.signal.aborted) return null;
      if (response.status === 401) {
        session.onUnauthorized(String(data.error || 'Session expired.'), data.code);
        return null;
      }
      return { ok: response.ok, status: response.status, data };
    } catch {
      if (!isCurrent() || controller.signal.aborted) return null;
      return { ok: false, status: 0, data: { error: 'Unable to reach the server. Your draft has been preserved.' } as Payload };
    } finally { controllers.current.delete(controller); }
  }
  return { request, isCurrent };
}

function time(value: string | null) {
  if (!value) return 'Unknown (legacy record)';
  return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok', timeZoneName: 'short' })
    .format(new Date(value)) + ' (Asia/Bangkok)';
}
function SafeLink({ value, label }: { value: string | null; label: string }) {
  let safe = false;
  try { safe = !!value && ['http:', 'https:'].includes(new URL(value).protocol); } catch { /* legacy unknown */ }
  return safe ? <a href={value!} target="_blank" rel="noopener noreferrer">{label}</a> : <span>{label}: unknown</span>;
}

function SavedSubmission({ value }: { value: Submission }) {
  return <div className="p-3 border rounded mb-3" data-testid="submission-saved">
    <h4 className="h6">Saved version {value.version}</h4>
    <div className="d-flex flex-wrap gap-3"><SafeLink value={value.repoUrl} label="Repository" />
      <SafeLink value={value.reportUrl} label="Report" /><span>Release: {value.releaseTag}</span></div>
    <p className="mb-1">{value.notes}</p>
    <div className="small">Submitted: {time(value.submittedAt)}</div>
    <div className="small">Deadline at submission: {time(value.dueDateSnapshot)}</div>
    <div className="small" data-testid="submission-late-status">{value.lateStatus} — at time of submission</div>
    {value.publishedEvaluation && <div>Published grade: {value.publishedEvaluation.score}/100 — {value.publishedEvaluation.feedback}</div>}
    {value.legacyEvaluation && <div className="small">Legacy grading (publication unknown): {value.legacyEvaluation.score ?? 'No score'} — {value.legacyEvaluation.feedback}</div>}
  </div>;
}

function SubmissionDetail(props: SubmissionWorkspaceProps & { teamId: number }) {
  const key = `${props.token}:${props.sessionGeneration}:${props.courseId}:${props.milestone.id}:${props.teamId}`;
  const { request, isCurrent } = useRequests(props, key);
  const base = `/api/teams/${props.teamId}/milestones/${props.milestone.id}/submission`;
  const [saved, setSaved] = useState<Submission | null>(null);
  const [version, setVersion] = useState(0);
  const [repo, setRepo] = useState('');
  const [report, setReport] = useState('');
  const [tag, setTag] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [history, setHistory] = useState<Submission[]>([]);
  const [historyAfter, setHistoryAfter] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyEpoch = useRef(0);

  async function readHistory(afterId?: number) {
    const epoch = afterId === undefined ? ++historyEpoch.current : historyEpoch.current;
    setHistoryLoading(true);
    const response = await request(base + '/versions' + (afterId === undefined ? '' : `?afterId=${afterId}`));
    if (!response || !isCurrent() || epoch !== historyEpoch.current) return;
    if (response.ok && Array.isArray(response.data.versions)) {
      setHistory(previous => afterId === undefined ? response.data.versions : [...previous,
        ...response.data.versions.filter((v: Submission) => !previous.some(old => old.id === v.id))]);
      setHistoryAfter(typeof response.data.nextAfterId === 'number' ? response.data.nextAfterId : null);
    } else setError(String(response.data.error || 'Could not load submission history.'));
    setHistoryLoading(false);
  }

  async function reload(preserveDraft = false) {
    setLoading(true);
    setError(null);
    const response = await request(base);
    if (!response || !isCurrent()) return;
    if (response.status === 404 && response.data.code === 'SUBMISSION_NOT_FOUND') {
      setSaved(null); setVersion(0); setAvailable(true); setHistory([]); setHistoryAfter(null);
    } else if (response.ok && response.data.submission && typeof response.data.submission.version === 'number') {
      const value = response.data.submission as Submission;
      setSaved(value); setVersion(value.version); setAvailable(true);
      if (!preserveDraft) { setRepo(value.repoUrl); setReport(value.reportUrl || ''); setTag(value.releaseTag); setNotes(value.notes); }
      await readHistory();
    } else { setAvailable(false); setError(String(response.data.error || 'Could not load this submission.')); }
    if (isCurrent()) {
      setLoading(false);
      if (response.ok || response.data.code === 'SUBMISSION_NOT_FOUND') {
        setConflict(false);
        if (preserveDraft) setSuccess('Latest saved version loaded. Your typed draft is preserved; review it before submitting again.');
      }
    }
  }

  useEffect(() => {
    setSaved(null); setVersion(0); setRepo(''); setReport(''); setTag(''); setNotes('');
    setHistory([]); setHistoryAfter(null); setHistoryLoading(false); historyEpoch.current++;
    setAvailable(false); setSaving(false); savingRef.current = false; setSuccess(null); setConflict(false);
    void reload();
  }, [key]);

  const writable = props.userRole === 'STUDENT' && props.ownTeam?.id === props.teamId &&
    props.ownTeam.proposalStatus === 'APPROVED' && props.milestone.status === 'PUBLISHED';

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!writable || !available || loading || savingRef.current) return;
    savingRef.current = true; setSaving(true); setError(null); setSuccess(null); setConflict(false);
    try {
      const response = await request(base, { method: 'PUT', body: JSON.stringify({ expectedVersion: version,
        repoUrl: repo, reportUrl: report, releaseTag: tag, notes }) });
      if (!response || !isCurrent()) return;
      if (!response.ok) {
        setError(String(response.data.error || 'The submission was not saved.'));
        setConflict(response.data.code === 'SUBMISSION_VERSION_CONFLICT');
        return;
      }
      const value = response.data.submission as Submission | undefined;
      if (!value || typeof value.version !== 'number') { setError('The server did not confirm a saved submission. Reload before retrying.'); return; }
      setSaved(value); setVersion(value.version); setRepo(value.repoUrl); setReport(value.reportUrl || '');
      setTag(value.releaseTag); setNotes(value.notes); setSuccess(`Submission saved as version ${value.version}.`);
      await readHistory();
    } finally {
      if (isCurrent()) { savingRef.current = false; setSaving(false); }
    }
  }

  return <div data-testid="submission-detail">
    <h3 className="h5">Team submission</h3>
    {loading && <p role="status">Loading saved submission…</p>}
    {error && <div className="cpms-alert cpms-alert-error mb-3" role="alert" data-testid="submission-error">{error}
      {conflict && <button type="button" className="cpms-btn cpms-btn-secondary ms-2" data-testid="submission-reconcile-btn"
        disabled={loading || saving} onClick={() => void reload(true)}>Load latest and keep my draft</button>}</div>}
    {success && <div className="cpms-alert cpms-alert-success mb-3" role="status" data-testid="submission-success">{success}</div>}
    {saved && <SavedSubmission value={saved} />}
    {!loading && available && !saved && <p data-testid="submission-empty">No submission saved for this milestone yet.</p>}
    {props.userRole === 'STUDENT' && !writable && <p className="cpms-alert cpms-alert-info" data-testid="submission-prerequisite">
      Your team proposal must be approved and the milestone published before you can submit.</p>}
    {writable && available && <form onSubmit={save} data-testid="submission-form">
      <fieldset disabled={saving || loading}>
        <legend className="h6">{saved ? `Submit a new version (current v${version})` : 'Submit your deliverable'}</legend>
        <p className="small">Late submissions are accepted and labelled. A new version does not inherit a grade from earlier content.</p>
        <div className="row g-3">
          <div className="col-md-6"><label className="cpms-label" htmlFor="submission-repo">Repository URL</label>
            <input id="submission-repo" data-testid="submission-repo-input" className="cpms-input" type="url" required maxLength={2048}
              value={repo} onChange={e => setRepo(e.target.value)} /></div>
          <div className="col-md-6"><label className="cpms-label" htmlFor="submission-report">Report URL</label>
            <input id="submission-report" data-testid="submission-report-input" className="cpms-input" type="url" required maxLength={2048}
              value={report} onChange={e => setReport(e.target.value)} /></div>
          <div className="col-md-6"><label className="cpms-label" htmlFor="submission-tag">Release tag</label>
            <input id="submission-tag" data-testid="submission-tag-input" className="cpms-input" required maxLength={128}
              value={tag} onChange={e => setTag(e.target.value)} /></div>
          <div className="col-12"><label className="cpms-label" htmlFor="submission-notes">Notes (optional)</label>
            <textarea id="submission-notes" data-testid="submission-notes-input" className="cpms-textarea" maxLength={10000}
              value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
        <button className="cpms-btn cpms-btn-primary mt-3" type="submit" data-testid="submission-save-btn" disabled={saving || loading || historyLoading}>
          {saving ? 'Saving submission…' : 'Save submission'}</button>
      </fieldset>
    </form>}
    {!loading && available && <button className="cpms-btn cpms-btn-secondary mt-3" type="button" disabled={saving || historyLoading}
      data-testid="submission-refresh-btn" onClick={() => void reload(true)}>Refresh saved state</button>}
    {history.length > 0 && <section className="mt-4" aria-label="Submission history" data-testid="submission-history">
      <h4 className="h6">Version history</h4>
      {history.map(value => <SavedSubmission key={value.id} value={value} />)}
      {historyAfter !== null && <button className="cpms-btn cpms-btn-secondary" type="button"
        disabled={saving || historyLoading} onClick={() => void readHistory(historyAfter)}>Load more versions</button>}
    </section>}
  </div>;
}

function InstructorSubmissions(props: SubmissionWorkspaceProps) {
  const key = `${props.token}:${props.sessionGeneration}:${props.courseId}:${props.milestone.id}`;
  const { request, isCurrent } = useRequests(props, key);
  const [rows, setRows] = useState<Array<Submission & { team: { id: number; name: string } }>>([]);
  const [after, setAfter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  async function load(cursor?: number) {
    setLoading(true); setError(null);
    const response = await request(`/api/courses/${props.courseId}/milestones/${props.milestone.id}/submissions` +
      (cursor === undefined ? '' : `?afterId=${cursor}`));
    if (!response || !isCurrent()) return;
    if (response.ok && Array.isArray(response.data.submissions)) {
      setRows(previous => cursor === undefined ? response.data.submissions : [...previous,
        ...response.data.submissions.filter((s: Submission) => !previous.some(old => old.id === s.id))]);
      setAfter(typeof response.data.nextAfterId === 'number' ? response.data.nextAfterId : null);
    } else setError(String(response.data.error || 'Could not load submissions.'));
    setLoading(false);
  }
  useEffect(() => { setRows([]); setAfter(null); setTeamId(null); void load(); }, [key]);
  return <div>
    <h3 className="h5">Submitted team deliverables</h3>
    {error && <p role="alert">{error}</p>}
    {loading && <p role="status">Loading submissions…</p>}
    {!loading && !error && rows.length === 0 && <p>No teams have submitted this milestone yet.</p>}
    <div className="d-flex flex-column gap-2">
      {rows.map(row => <button type="button" className="cpms-btn cpms-btn-secondary text-start" key={row.id}
        data-testid={`submission-team-${row.team.id}`} onClick={() => setTeamId(row.team.id)}>
        {row.team.name} — version {row.version} — {row.lateStatus}</button>)}
    </div>
    {after !== null && <button type="button" className="cpms-btn cpms-btn-secondary mt-2" disabled={loading}
      onClick={() => void load(after)}>Load more submissions</button>}
    {teamId !== null && <div className="mt-3"><SubmissionDetail key={`${key}:${teamId}`} {...props} teamId={teamId} /></div>}
  </div>;
}

export default function SubmissionWorkspace(props: SubmissionWorkspaceProps) {
  return <section className="mt-4 p-3 border rounded" aria-label={`Submissions for ${props.milestone.title}`} data-testid="submission-workspace">
    <h2 className="h5">{props.milestone.title} — submissions</h2>
    {props.userRole === 'INSTRUCTOR' ? <InstructorSubmissions {...props} /> : props.ownTeam ?
      <SubmissionDetail key={`${props.token}:${props.sessionGeneration}:${props.courseId}:${props.milestone.id}:${props.ownTeam.id}`} {...props} teamId={props.ownTeam.id} /> :
      <p>Join a project team in this course before submitting a milestone.</p>}
  </section>;
}
