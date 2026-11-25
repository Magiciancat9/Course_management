import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createMilestone,
  getMilestoneById,
  listMilestonesForCourse,
  parseCanonicalPositiveInt,
  publishMilestone,
  updateMilestone,
  validateCreateMilestoneBody,
  validateListMilestonesQuery,
  validatePublishMilestoneBody,
  validateUpdateMilestoneBody,
} from '../services/milestoneService';

const router = Router();

function sendNoStoreError(res: Response, status: number, error: string, code: string): void {
  res.set('Cache-Control', 'no-store');
  res.status(status).json({ error, code });
}

function requireInstructor(req: Request, res: Response): boolean {
  if (req.user!.role !== 'INSTRUCTOR') {
    sendNoStoreError(
      res,
      403,
      'Forbidden: only instructors may manage milestones.',
      'INSTRUCTOR_ROLE_REQUIRED'
    );
    return false;
  }
  return true;
}

router.get('/courses/:courseId/milestones', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const courseId = parseCanonicalPositiveInt(req.params.courseId);
  if (courseId === null) {
    res.status(400).json({ error: 'Invalid courseId.', code: 'VALIDATION_ERROR' });
    return;
  }

  const queryRes = validateListMilestonesQuery(req.query as Record<string, unknown>);
  if (!queryRes.valid) {
    res.status(queryRes.status).json({ error: queryRes.error, code: queryRes.code });
    return;
  }

  try {
    const outcome = await listMilestonesForCourse({
      courseId,
      role: req.user!.role,
      query: queryRes.data,
    });
    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error, code: outcome.code });
      return;
    }
    res.status(200).json(outcome.data);
  } catch (err) {
    console.error('List milestones error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.post('/courses/:courseId/milestones', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!requireInstructor(req, res)) return;

  const courseId = parseCanonicalPositiveInt(req.params.courseId);
  if (courseId === null) {
    res.status(400).json({ error: 'Invalid courseId.', code: 'VALIDATION_ERROR' });
    return;
  }

  const bodyRes = validateCreateMilestoneBody(req.body);
  if (!bodyRes.valid) {
    res.status(bodyRes.status).json({ error: bodyRes.error, code: bodyRes.code });
    return;
  }

  try {
    const outcome = await createMilestone({ courseId, input: bodyRes.data });
    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error, code: outcome.code });
      return;
    }
    res.status(201).json(outcome.data);
  } catch (err) {
    console.error('Create milestone error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.get('/milestones/:id', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const id = parseCanonicalPositiveInt(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Invalid milestone id.', code: 'VALIDATION_ERROR' });
    return;
  }

  try {
    const outcome = await getMilestoneById({ id, role: req.user!.role });
    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error, code: outcome.code });
      return;
    }
    res.status(200).json(outcome.data);
  } catch (err) {
    console.error('Get milestone error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.put('/milestones/:id', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!requireInstructor(req, res)) return;

  const id = parseCanonicalPositiveInt(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Invalid milestone id.', code: 'VALIDATION_ERROR' });
    return;
  }

  const bodyRes = validateUpdateMilestoneBody(req.body);
  if (!bodyRes.valid) {
    res.status(bodyRes.status).json({ error: bodyRes.error, code: bodyRes.code });
    return;
  }

  try {
    const outcome = await updateMilestone({ id, input: bodyRes.data });
    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error, code: outcome.code });
      return;
    }
    res.status(200).json(outcome.data);
  } catch (err) {
    console.error('Update milestone error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.post('/milestones/:id/publish', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!requireInstructor(req, res)) return;

  const id = parseCanonicalPositiveInt(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Invalid milestone id.', code: 'VALIDATION_ERROR' });
    return;
  }

  const bodyRes = validatePublishMilestoneBody(req.body);
  if (!bodyRes.valid) {
    res.status(bodyRes.status).json({ error: bodyRes.error, code: bodyRes.code });
    return;
  }

  try {
    const outcome = await publishMilestone({
      id,
      expectedVersion: bodyRes.data.expectedVersion,
    });
    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error, code: outcome.code });
      return;
    }
    res.status(200).json(outcome.data);
  } catch (err) {
    console.error('Publish milestone error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.use('/milestones', requireAuth);

export default router;
