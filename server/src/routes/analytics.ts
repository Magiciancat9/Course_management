import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getCourseAnalytics,
  getCourseGradebookExport,
  parseCourseIdParam,
} from '../services/analyticsService';

const router = Router();

router.get('/courses/:courseId/analytics', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.user!.role !== 'INSTRUCTOR') {
    res.status(403).json({
      error: 'Only instructors may access course analytics.',
      code: 'INSTRUCTOR_ROLE_REQUIRED',
    });
    return;
  }

  const courseId = parseCourseIdParam(req.params.courseId);
  if (courseId === null) {
    res.status(400).json({
      error: 'Invalid course identifier.',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  try {
    const result = await getCourseAnalytics(courseId, req.user!, req.query as Record<string, unknown>);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error, code: result.code });
      return;
    }
    res.status(200).json(result.data);
  } catch {
    res.status(500).json({ error: 'Unable to load course analytics.', code: 'INTERNAL_ERROR' });
  }
});

router.get('/courses/:courseId/gradebook.csv', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.user!.role !== 'INSTRUCTOR') {
    res.status(403).json({
      error: 'Only instructors may export the course gradebook.',
      code: 'INSTRUCTOR_ROLE_REQUIRED',
    });
    return;
  }

  const courseId = parseCourseIdParam(req.params.courseId);
  if (courseId === null) {
    res.status(400).json({
      error: 'Invalid course identifier.',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  try {
    const result = await getCourseGradebookExport(courseId, req.user!, req.query as Record<string, unknown>);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error, code: result.code });
      return;
    }
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="${result.data.filename}"`);
    res.status(200).send(result.data.csv);
  } catch {
    res.status(500).json({ error: 'Unable to export course gradebook.', code: 'INTERNAL_ERROR' });
  }
});

export default router;
