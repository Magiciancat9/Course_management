import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listPeerEvaluations, peerId, savePeerEvaluation } from '../services/peerEvaluationService';

const router = Router();
const base = '/teams/:teamId/milestones/:milestoneId/peer-evaluations';
router.use(base, (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
async function handle(req: Request, res: Response, operation: 'own' | 'all' | 'save') {
  const student = req.user!.role === 'STUDENT';
  if ((operation === 'all' && student) || (operation !== 'all' && !student)) {
    res.status(403).json({ code: 'ROLE_FORBIDDEN', error: 'This role cannot perform that peer-evaluation operation.' }); return;
  }
  const teamId = peerId(req.params.teamId), milestoneId = peerId(req.params.milestoneId);
  const evaluateeId = operation === 'save' ? peerId(req.params.evaluateeId) : null;
  if (!teamId || !milestoneId || (operation === 'save' && !evaluateeId)) {
    res.status(400).json({ code: 'VALIDATION_ERROR', error: 'Invalid team, milestone or student identifier.' }); return;
  }
  try {
    const result = operation === 'save'
      ? await savePeerEvaluation(teamId, milestoneId, evaluateeId!, req.user!, req.body)
      : await listPeerEvaluations(teamId, milestoneId, req.user!, req.query, operation === 'own');
    if (!result.ok) { res.status(result.status).json({ code: result.code, error: result.error }); return; }
    res.status('created' in result && result.created ? 201 : 200).json(result.data);
  } catch {
    // Do not log confidential feedback or Prisma request payloads.
    res.status(500).json({ code: 'INTERNAL_ERROR', error: 'Unable to process peer evaluation.' });
  }
}
router.get(`${base}/me`, requireAuth, (req, res) => { void handle(req, res, 'own'); });
router.get(base, requireAuth, (req, res) => { void handle(req, res, 'all'); });
router.put(`${base}/:evaluateeId`, requireAuth, (req, res) => { void handle(req, res, 'save'); });
export default router;
