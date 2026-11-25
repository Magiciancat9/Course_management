import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getSubmission, listCourseSubmissions, listSubmissionVersions, parseSubmissionPaging, saveSubmission } from '../services/submissionService';

const router = Router();
const id = (value: string) => /^[1-9][0-9]*$/.test(value) && Number.isSafeInteger(Number(value)) &&
  Number(value) <= 2147483647 ? Number(value) : null;
const error = (res: Response, status: number, code: string, message: string) => res.status(status).json({ error: message, code });
const teamPath = '/teams/:teamId/milestones/:milestoneId/submission';

async function handle(req: Request, res: Response, operation: 'read' | 'save' | 'versions') {
  res.set('Cache-Control', 'no-store');
  if (operation === 'save' && req.user!.role !== 'STUDENT') {
    error(res, 403, 'STUDENT_ROLE_REQUIRED', 'Only owning-team students may submit.'); return;
  }
  const teamId = id(req.params.teamId);
  const milestoneId = id(req.params.milestoneId);
  if (!teamId || !milestoneId) { error(res, 400, 'VALIDATION_ERROR', 'Invalid team or milestone identifier.'); return; }
  const params = { teamId, milestoneId, actor: req.user! };
  try {
    let outcome;
    if (operation === 'save') outcome = await saveSubmission({ ...params, body: req.body });
    else if (operation === 'versions') {
      const paging = parseSubmissionPaging(req.query);
      if (!paging.ok) { error(res, paging.status, paging.code, paging.error); return; }
      outcome = await listSubmissionVersions({ ...params, ...paging.data });
    } else outcome = await getSubmission(params);
    if (!outcome.ok) { error(res, outcome.status, outcome.code, outcome.error); return; }
    res.status('created' in outcome && outcome.created ? 201 : 200).json(outcome.data);
  } catch (cause) {
    console.error('Submission operation failed:', cause);
    error(res, 500, 'INTERNAL_ERROR', 'Internal server error');
  }
}

router.get(teamPath, requireAuth, (req, res) => { void handle(req, res, 'read'); });
router.put(teamPath, requireAuth, (req, res) => { void handle(req, res, 'save'); });
router.get(teamPath + '/versions', requireAuth, (req, res) => { void handle(req, res, 'versions'); });
router.get('/courses/:courseId/milestones/:milestoneId/submissions', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.user!.role !== 'INSTRUCTOR') { error(res, 403, 'INSTRUCTOR_ROLE_REQUIRED', 'Only instructors may list course submissions.'); return; }
  const courseId = id(req.params.courseId);
  const milestoneId = id(req.params.milestoneId);
  if (!courseId || !milestoneId) { error(res, 400, 'VALIDATION_ERROR', 'Invalid course or milestone identifier.'); return; }
  const paging = parseSubmissionPaging(req.query);
  if (!paging.ok) { error(res, paging.status, paging.code, paging.error); return; }
  try {
    const outcome = await listCourseSubmissions({ courseId, milestoneId, actor: req.user!, ...paging.data });
    if (!outcome.ok) { error(res, outcome.status, outcome.code, outcome.error); return; }
    res.json(outcome.data);
  } catch (cause) {
    console.error('Submission list failed:', cause);
    error(res, 500, 'INTERNAL_ERROR', 'Internal server error');
  }
});

export default router;
