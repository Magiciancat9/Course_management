import React, { useEffect, useRef, useState } from 'react';

interface Team { id: number; name: string; courseId: number; members: { id: number; name: string }[] }
interface Milestone { id: number; title: string }
interface Evaluation { id: number; teamId: number; milestoneId: number; evaluatorId: number; evaluateeId: number;
  rating: number; comment: string; version: number; createdAt: string; updatedAt: string;
  evaluator: { id: number; fullName: string }; evaluatee: { id: number; fullName: string } }
interface Eligibility { canEvaluate: boolean; reason: string; dueDate: string; serverTime: string }
interface Props { token: string; userId: number; userRole: 'STUDENT' | 'INSTRUCTOR'; teams: Team[];
  sessionGeneration: number; getCurrentGeneration: () => number; onUnauthorized: (message: string, code?: string) => void }
const formatTime = (value: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok',
  year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value));

export default function PeerEvaluation(props: Props) {
  const { token, userId, userRole, teams, sessionGeneration, getCurrentGeneration, onUnauthorized } = props;
  const [teamId, setTeamId] = useState(teams[0]?.id ?? 0);
  const team = teams.find(t => t.id === teamId);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneId, setMilestoneId] = useState(0);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [targetId, setTargetId] = useState('');
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');
  const [expectedVersion, setExpectedVersion] = useState(0);
  const [loading, setLoading] = useState(true), [loadingMore, setLoadingMore] = useState(false);
  const [choicesLoading, setChoicesLoading] = useState(true), [pending, setPending] = useState(false);
  const [error, setError] = useState(''), [success, setSuccess] = useState(''), [conflict, setConflict] = useState(false);
  const [loadedContext, setLoadedContext] = useState('');
  const teamContext = `${token}:${userId}:${userRole}:${sessionGeneration}:${teamId}:${team?.courseId ?? 0}`;
  const context = `${teamContext}:${milestoneId}`;
  const current = useRef(context); current.current = context;
  const epoch = useRef(0), listSequence = useRef(0), mutation = useRef(false);
  const boundary = useRef(new AbortController());
  const listAbort = useRef<AbortController | null>(null);
  const valid = (captured: string, version: number) => current.current === captured && epoch.current === version &&
    getCurrentGeneration() === sessionGeneration && !boundary.current.signal.aborted;
  const base = `/api/teams/${teamId}/milestones/${milestoneId}/peer-evaluations`;
  const student = userRole === 'STUDENT';

  function resetDraft() { setTargetId(''); setRating(''); setComment(''); setExpectedVersion(0); setConflict(false); }
  async function api(path: string, captured: string, version: number, init: RequestInit = {}, signal = boundary.current.signal) {
    const response = await fetch(path, { ...init, signal, cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!valid(captured, version) || signal.aborted) return null;
    if (response.status === 401) { onUnauthorized(data.error || 'Your session has expired.', data.code); return null; }
    return { response, data };
  }

  async function load(append = false, reconcile = false) {
    const captured = context, version = epoch.current, sequence = ++listSequence.current;
    listAbort.current?.abort(); const controller = new AbortController(); listAbort.current = controller;
    if (append) setLoadingMore(true); else { setLoading(true); setLoadingMore(false); setCursor(null); }
    setError('');
    let after = append ? cursor : null;
    const records: Evaluation[] = [];
    try {
      let nextEligibility: Eligibility | null = null;
      do {
        const result = await api(`${base}${student ? '/me' : ''}${after ? `?afterId=${after}` : ''}`, captured, version, {}, controller.signal);
        if (!result || sequence !== listSequence.current) return;
        if (!result.response.ok) throw new Error(result.data.error || 'Unable to load peer evaluations.');
        if (!Array.isArray(result.data.evaluations) || !result.data.eligibility) throw new Error('Unexpected evaluation response. Refresh to retry.');
        records.push(...result.data.evaluations); nextEligibility = result.data.eligibility; after = result.data.nextAfterId;
        // Students need all their outgoing versions before choosing an existing pair.
      } while (student && after);
      if (!valid(captured, version) || sequence !== listSequence.current) return;
      setEvaluations(old => append ? [...old, ...records.filter(row => !old.some(saved => saved.id === row.id))] : records);
      setEligibility(nextEligibility); setCursor(after); setLoadedContext(captured);
      if (reconcile) {
        const saved = records.find(row => row.evaluateeId === Number(targetId));
        setExpectedVersion(saved?.version ?? 0); setConflict(false);
        setSuccess('Latest version loaded. Your draft is retained; review it before saving again.');
      }
    } catch (cause) {
      if (valid(captured, version) && sequence === listSequence.current && !controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Unable to load peer evaluations.');
        if (!append) { setEligibility(null); setLoadedContext(''); }
      }
    } finally { if (valid(captured, version) && sequence === listSequence.current) { setLoading(false); setLoadingMore(false); } }
  }

  useEffect(() => { if (!teams.some(t => t.id === teamId)) setTeamId(teams[0]?.id ?? 0); }, [teams, teamId]);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    setMilestones([]); setMilestoneId(0); setChoicesLoading(true);
    if (!team) { setChoicesLoading(false); return () => { active = false; controller.abort(); }; }
    const courseId = team.courseId;
    void (async () => {
      const records: Milestone[] = []; let after: number | null = null;
      try {
        do {
          const response = await fetch(`/api/courses/${courseId}/milestones?limit=100${after ? `&afterId=${after}` : ''}`, {
            signal: controller.signal, cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
          const data = await response.json();
          if (!active || getCurrentGeneration() !== sessionGeneration) return;
          if (response.status === 401) { onUnauthorized(data.error || 'Your session has expired.', data.code); return; }
          if (!response.ok || !Array.isArray(data.milestones)) throw new Error('Unable to load milestones.');
          records.push(...data.milestones); after = data.nextAfterId;
        } while (after);
        if (active) { setMilestones(records); setMilestoneId(records[0]?.id ?? 0); }
      } catch (cause) { if (active && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to load milestones.'); }
      finally { if (active) setChoicesLoading(false); }
    })();
    return () => { active = false; controller.abort(); };
  }, [teamContext]);
  useEffect(() => {
    epoch.current++; boundary.current = new AbortController(); mutation.current = false;
    setEvaluations([]); setEligibility(null); setCursor(null); setLoadedContext(''); resetDraft();
    setPending(false); setLoadingMore(false); setError(''); setSuccess('');
    if (team && milestoneId) void load(); else setLoading(false);
    return () => { epoch.current++; boundary.current.abort(); listAbort.current?.abort(); };
  }, [context]);

  function selectTarget(id: string) {
    const saved = evaluations.find(row => row.evaluateeId === Number(id));
    setTargetId(id); setRating(saved ? String(saved.rating) : ''); setComment(saved?.comment ?? '');
    setExpectedVersion(saved?.version ?? 0); setConflict(false); setError(''); setSuccess('');
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (mutation.current || !eligibility?.canEvaluate || conflict || loading) return;
    const captured = context, version = epoch.current;
    mutation.current = true; setPending(true); setError(''); setSuccess('');
    try {
      const result = await api(`${base}/${targetId}`, captured, version, { method: 'PUT',
        body: JSON.stringify({ expectedVersion, rating: Number(rating), comment }) });
      if (!result) return;
      if (!result.response.ok) {
        if (result.data.code === 'PEER_EVALUATION_VERSION_CONFLICT') setConflict(true);
        if (result.data.code === 'MILESTONE_NOT_COMPLETED') { setEligibility(null); setConflict(true); }
        throw new Error(result.data.error || 'Unable to save peer evaluation.');
      }
      const saved: Evaluation = result.data.evaluation;
      setExpectedVersion(saved.version); setRating(String(saved.rating)); setComment(saved.comment);
      setEvaluations(old => [...old.filter(row => row.id !== saved.id), saved].sort((a, b) => a.id - b.id));
      setSuccess('Peer evaluation saved. Only you and instructors can read your outgoing feedback.');
    } catch (cause) { if (valid(captured, version)) setError(cause instanceof Error ? cause.message : 'Unable to save peer evaluation.'); }
    finally { if (valid(captured, version)) { mutation.current = false; setPending(false); } }
  }

  const ready = loadedContext === context && !loading;
  return <section id="section-peer-evaluation" className="cpms-card mt-4" aria-labelledby="peer-heading" data-testid="peer-evaluation">
    <div className="cpms-card-header"><h2 id="peer-heading" className="h4 fw-bold mb-1">Peer evaluation</h2>
      <p className="cpms-muted mb-0">{student ? 'Reflect on your teammates’ contributions. Your feedback is confidential.' : 'Read confidential team feedback. Instructor access is read-only.'}</p></div>
    <div className="cpms-card-body">
      {!teams.length ? <p>Join a project team to access peer evaluation.</p> : <>
        <div className="row g-3 mb-3"><div className="col-md-6">
          <label className="cpms-label" htmlFor="peer-team">Peer evaluation team</label>
          <select id="peer-team" className="cpms-input" value={teamId} disabled={pending} onChange={e => setTeamId(Number(e.target.value))}>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="col-md-6"><label className="cpms-label" htmlFor="peer-milestone">Peer evaluation milestone</label>
            <select id="peer-milestone" className="cpms-input" value={milestoneId} disabled={pending || choicesLoading || !milestones.length}
              onChange={e => setMilestoneId(Number(e.target.value))}>
              {!milestones.length && <option value={0}>No milestones available</option>}
              {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div></div>
        {error && <div role="alert" className="alert alert-danger" data-testid="peer-error">{error}</div>}
        {success && ready && <p role="status" className="alert alert-success" data-testid="peer-success">{success}</p>}
        <button type="button" className="cpms-btn cpms-btn-secondary mb-3" disabled={pending || loading || loadingMore || !milestoneId}
          onClick={() => { setSuccess(''); void load(false, true); }}>Refresh peer evaluations</button>
        {conflict && <button type="button" className="cpms-btn cpms-btn-secondary mb-3 ms-2" disabled={pending || loading}
          onClick={() => void load(false, true)}>Load latest evaluation version</button>}
        {choicesLoading || loading ? <p role="status">Loading peer evaluations…</p> : !milestoneId ? <p>No published milestones are available for peer evaluation.</p> : ready && <>
          {eligibility && <p role="status" data-testid="peer-eligibility">{eligibility.reason} Due {formatTime(eligibility.dueDate)}.</p>}
          {student && <form data-testid="peer-form" onSubmit={event => void save(event)}>
            <fieldset disabled={pending || !eligibility?.canEvaluate || loadingMore}>
              <legend className="h5">Your outgoing feedback</legend>
              <label className="cpms-label" htmlFor="peer-target">Teammate to evaluate</label>
              <select id="peer-target" className="cpms-input mb-3" value={targetId} required onChange={e => selectTarget(e.target.value)}>
                <option value="">Choose a teammate</option>{team?.members.filter(member => member.id !== userId).map(member =>
                  <option key={member.id} value={member.id}>{member.name}</option>)}</select>
              <label className="cpms-label" htmlFor="peer-rating">Contribution rating (1–5)</label>
              <select id="peer-rating" className="cpms-input mb-3" value={rating} required onChange={e => setRating(e.target.value)}>
                <option value="">Choose a rating</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select>
              <label className="cpms-label" htmlFor="peer-comment">Confidential comment (optional)</label>
              <textarea id="peer-comment" className="cpms-input mb-2" rows={4} value={comment} aria-describedby="peer-comment-help"
                onChange={e => setComment(e.target.value)} />
              <p id="peer-comment-help" className="cpms-muted">Up to 2,000 characters after trimming. Teammates cannot read this feedback.</p>
              {expectedVersion > 0 && <p>Editing your saved evaluation · Version {expectedVersion}</p>}
              <button type="submit" className="cpms-btn cpms-btn-primary" data-testid="peer-save"
                disabled={!targetId || !rating || comment.trim().length > 2000 || conflict}>{pending ? 'Saving…' : 'Save peer evaluation'}</button>
            </fieldset></form>}
          <h3 className="h5 mt-4">{student ? 'Your saved outgoing evaluations' : 'Confidential team evaluations'}</h3>
          {!evaluations.length && <p data-testid="peer-empty">{student ? 'You have not saved any outgoing evaluations for this milestone.' : 'No evaluations have been saved for this milestone.'}</p>}
          <div className="row g-3">{evaluations.map(row => <div className="col-lg-6" key={row.id}>
            <article className="border rounded-3 p-3 h-100" data-testid={`peer-record-${row.id}`}>
              <h4 className="h6">{row.evaluatee.fullName}</h4>
              {!student && <p>Evaluator: {row.evaluator.fullName}</p>}
              <p>Rating: {row.rating} / 5 · Version {row.version}</p>
              <p className="text-break" style={{ whiteSpace: 'pre-wrap' }}>{row.comment || 'No comment provided.'}</p>
              <p className="cpms-muted mb-0">Updated {formatTime(row.updatedAt)}</p>
            </article></div>)}</div>
          {!student && cursor && <button type="button" className="cpms-btn cpms-btn-secondary mt-3" disabled={pending || loadingMore}
            onClick={() => void load(true)}>{loadingMore ? 'Loading more evaluations…' : 'Load more evaluations'}</button>}
        </>}
      </>}
    </div>
  </section>;
}
