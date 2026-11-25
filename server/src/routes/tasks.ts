import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listTaskEvents, listTasks, saveTask } from '../services/taskService';

const router = Router();
async function handle(req: Request, res: Response, operation: 'create' | 'update' | 'list' | 'events') {
  res.set('Cache-Control', 'no-store');
  if ((operation === 'create' || operation === 'update') && req.user!.role !== 'STUDENT') {
    res.status(403).json({ error: 'Only team students may change tasks.', code: 'STUDENT_ROLE_REQUIRED' }); return;
  }
  const rawId = req.params.teamId ?? req.params.taskId;
  const id = /^[1-9][0-9]*$/.test(rawId) && Number.isSafeInteger(Number(rawId)) && Number(rawId) <= 2147483647 ? Number(rawId) : null;
  if (!id) { res.status(400).json({ error: 'Invalid task/team identifier.', code: 'VALIDATION_ERROR' }); return; }
  try {
    const outcome = operation === 'list' ? await listTasks(id, req.user!, req.query)
      : operation === 'events' ? await listTaskEvents(id, req.user!, req.query)
      : await saveTask(id, req.user!, req.body, operation === 'create');
    if (!outcome.ok) { res.status(outcome.status).json({ error: outcome.error, code: outcome.code }); return; }
    res.status(operation === 'create' ? 201 : 200).json(outcome.data);
  } catch (error) {
    console.error('Task operation failed:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
router.get('/teams/:teamId/tasks', requireAuth, (req, res) => { void handle(req, res, 'list'); });
router.post('/teams/:teamId/tasks', requireAuth, (req, res) => { void handle(req, res, 'create'); });
router.put('/tasks/:taskId', requireAuth, (req, res) => { void handle(req, res, 'update'); });
router.get('/tasks/:taskId/events', requireAuth, (req, res) => { void handle(req, res, 'events'); });
export default router;
