import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getEvaluation,
  parsePositiveIntParam,
  publishEvaluation,
  saveEvaluationDraft,
} from '../services/gradingService';

const router = Router();

router.get('/submissions/:id/evaluation', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const submissionId = parsePositiveIntParam(req.params.id);
  if (submissionId === null) {
    res.status(400).json({ error: 'Invalid submission id.', code: 'VALIDATION_ERROR' });
    return;
  }

  let submissionVersion: number | undefined;
  if (req.query.submissionVersion !== undefined) {
    const parsedVer = parsePositiveIntParam(req.query.submissionVersion);
    if (parsedVer === null) {
      res.status(400).json({ error: 'Invalid submissionVersion query parameter.', code: 'VALIDATION_ERROR' });
      return;
    }
    submissionVersion = parsedVer;
  }

  try {
    const outcome = await getEvaluation({
      submissionId,
      submissionVersion,
      actor: req.user!,
    });
    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error, code: outcome.code });
      return;
    }
    res.status(200).json(outcome.data);
  } catch (err) {
    console.error('Get evaluation error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.put('/submissions/:id/evaluation', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.user!.role !== 'INSTRUCTOR') {
    res.status(403).json({
      error: 'Forbidden: only instructors may grade submissions.',
      code: 'INSTRUCTOR_ROLE_REQUIRED',
    });
    return;
  }

  const submissionId = parsePositiveIntParam(req.params.id);
  if (submissionId === null) {
    res.status(400).json({ error: 'Invalid submission id.', code: 'VALIDATION_ERROR' });
    return;
  }

  try {
    const outcome = await saveEvaluationDraft({
      submissionId,
      actor: req.user!,
      body: req.body,
    });
    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error, code: outcome.code });
      return;
    }
    res.status(outcome.created ? 201 : 200).json(outcome.data);
  } catch (err) {
    console.error('Save evaluation draft error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

router.post('/submissions/:id/evaluation/publish', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.user!.role !== 'INSTRUCTOR') {
    res.status(403).json({
      error: 'Forbidden: only instructors may publish grades.',
      code: 'INSTRUCTOR_ROLE_REQUIRED',
    });
    return;
  }

  const submissionId = parsePositiveIntParam(req.params.id);
  if (submissionId === null) {
    res.status(400).json({ error: 'Invalid submission id.', code: 'VALIDATION_ERROR' });
    return;
  }

  try {
    const outcome = await publishEvaluation({
      submissionId,
      actor: req.user!,
      body: req.body,
    });
    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error, code: outcome.code });
      return;
    }
    res.status(200).json(outcome.data);
  } catch (err) {
    console.error('Publish evaluation error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

export default router;
