import express from 'express';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import {
  requireAuth,
  requireRole,
  signAuthToken,
  revokeAuthToken,
} from './middleware/auth';
import {
  validateTeamCapacity,
  validateProposalSubmission,
  validateInstructorReview,
} from './utils/domainRules';

function isUniqueConstraintViolation(err: unknown, fields: string[]): boolean {
  if (
    typeof err !== 'object' ||
    err === null ||
    !('code' in err) ||
    err.code !== 'P2002' ||
    !('meta' in err) ||
    typeof err.meta !== 'object' ||
    err.meta === null ||
    !('target' in err.meta)
  ) {
    return false;
  }

  const target = err.meta.target;
  return Array.isArray(target)
    ? fields.every((field) => target.includes(field))
    : typeof target === 'string' && fields.every((field) => target.includes(field));
}

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
  })
);
app.use(express.json());

// ============================================================================
// Health Check (NFR-05, AC-01)
// ============================================================================
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'course-pms-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready', db: 'connected' });
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({ status: 'not_ready', db: 'disconnected' });
  }
});

// ============================================================================
// Feature F-01: Authentication, Session & Role Identity
// ============================================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({
        error: 'Email and password are required.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const token = signAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        studentCode: user.studentCode,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  res.status(200).json({ user: req.user });
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  if (!req.tokenJti || !req.tokenExpiresAt) {
    res.status(401).json({
      error: 'Invalid or expired authentication token.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  try {
    await revokeAuthToken(req.tokenJti, req.tokenExpiresAt);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// Courses Lookup
// ============================================================================
app.get('/api/courses', requireAuth, async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { id: 'asc' },
  });
  res.status(200).json({ courses });
});

// ============================================================================
// Feature F-02: Course Project Team Formation & Roster Management
// ============================================================================
app.get('/api/teams', requireAuth, async (req, res) => {
  try {
    const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
    const teams = await prisma.projectTeam.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        course: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                studentCode: true,
                role: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        proposal: {
          include: {
            reviewedBy: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const currentUser = req.user!;
    // Enforce BR-06 privacy on list: Students only receive full proposal details for their own team
    const sanitizedTeams = teams.map((team) => {
      const isMember = team.members.some((m) => m.userId === currentUser.id);
      if (currentUser.role === 'INSTRUCTOR' || isMember) {
        return team;
      }
      return {
        ...team,
        proposal: team.proposal
          ? {
              id: team.proposal.id,
              teamId: team.proposal.teamId,
              title: team.proposal.title,
              status: team.proposal.status,
              revisionCount: team.proposal.revisionCount,
              updatedAt: team.proposal.updatedAt,
            }
          : null,
      };
    });

    res.status(200).json({ teams: sanitizedTeams });
  } catch (err) {
    console.error('List teams error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

app.post('/api/teams', requireAuth, requireRole('STUDENT'), async (req, res) => {
  try {
    const { name, courseId } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      res.status(400).json({
        error: 'Team name must be at least 3 characters.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const course = courseId
      ? await prisma.course.findUnique({ where: { id: Number(courseId) } })
      : await prisma.course.findFirst({ orderBy: { id: 'asc' } });

    if (!course) {
      res.status(404).json({
        error: 'Target course not found.',
        code: 'COURSE_NOT_FOUND',
      });
      return;
    }

    // BR-01: Single Active Team Membership per Course
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: req.user!.id,
        },
      },
    });

    if (existingMembership) {
      res.status(409).json({
        error: 'Student is already a member of an active team in this course.',
        code: 'BR01_DUPLICATE_TEAM_MEMBERSHIP',
      });
      return;
    }

    const existingName = await prisma.projectTeam.findUnique({
      where: {
        courseId_name: {
          courseId: course.id,
          name: name.trim(),
        },
      },
    });

    if (existingName) {
      res.status(409).json({
        error: 'A team with this name already exists in the course.',
        code: 'DUPLICATE_TEAM_NAME',
      });
      return;
    }

    const createdTeam = await prisma.projectTeam.create({
      data: {
        name: name.trim(),
        courseId: course.id,
        createdById: req.user!.id,
        members: {
          create: [
            {
              userId: req.user!.id,
              courseId: course.id,
              memberRole: 'LEADER',
            },
          ],
        },
      },
      include: {
        course: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                studentCode: true,
                role: true,
              },
            },
          },
        },
        proposal: true,
      },
    });

    res.status(201).json({ team: createdTeam });
  } catch (err) {
    if (isUniqueConstraintViolation(err, ['courseId', 'userId'])) {
      res.status(409).json({
        error: 'Student is already a member of an active team in this course.',
        code: 'BR01_DUPLICATE_TEAM_MEMBERSHIP',
      });
      return;
    }
    console.error('Create team error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

app.post('/api/teams/:id/members', requireAuth, requireRole('STUDENT'), async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        error: 'Member email is required.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${teamId} FOR UPDATE`;

      const team = await tx.projectTeam.findUnique({
        where: { id: teamId },
        include: {
          course: true,
          members: true,
        },
      });

      if (!team) {
        return {
          error: 'Project team not found.',
          code: 'TEAM_NOT_FOUND',
          status: 404,
        };
      }

      const callerIsMember = team.members.some((m) => m.userId === req.user!.id);
      if (!callerIsMember) {
        return {
          error: 'Forbidden: only members of this team may add teammates.',
          code: 'BR06_FORBIDDEN_TEAM_ACCESS',
          status: 403,
        };
      }

      const capacityCheck = validateTeamCapacity(team.members.length, team.course.maxTeamSize);
      if (!capacityCheck.valid) {
        return {
          error: capacityCheck.error,
          code: capacityCheck.code,
          status: capacityCheck.status ?? 409,
        };
      }

      const targetUser = await tx.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (!targetUser || targetUser.role !== 'STUDENT') {
        return {
          error: 'Target student account not found.',
          code: 'STUDENT_NOT_FOUND',
          status: 404,
        };
      }

      const existingMembership = await tx.teamMember.findUnique({
        where: {
          courseId_userId: {
            courseId: team.courseId,
            userId: targetUser.id,
          },
        },
      });

      if (existingMembership) {
        return {
          error: 'Target student is already a member of an active team in this course.',
          code: 'BR01_DUPLICATE_TEAM_MEMBERSHIP',
          status: 409,
        };
      }

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: targetUser.id,
          courseId: team.courseId,
          memberRole: 'MEMBER',
        },
      });

      const updatedTeam = await tx.projectTeam.findUnique({
        where: { id: team.id },
        include: {
          course: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                  studentCode: true,
                  role: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          proposal: true,
        },
      });

      return { team: updatedTeam };
    });

    if ('error' in result) {
      res.status(result.status ?? 500).json({ error: result.error, code: result.code });
      return;
    }

    res.status(200).json({ team: result.team });
  } catch (err) {
    if (
      isUniqueConstraintViolation(err, ['courseId', 'userId']) ||
      isUniqueConstraintViolation(err, ['teamId', 'userId'])
    ) {
      res.status(409).json({
        error: 'Target student is already a member of an active team in this course.',
        code: 'BR01_DUPLICATE_TEAM_MEMBERSHIP',
      });
      return;
    }
    console.error('Add team member error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// Feature F-03: Project Proposal Drafting, Submission & Instructor Review
// ============================================================================
app.get('/api/teams/:id/proposal', requireAuth, async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const team = await prisma.projectTeam.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        proposal: {
          include: {
            reviewedBy: {
              select: { id: true, email: true, fullName: true, role: true },
            },
          },
        },
      },
    });

    if (!team) {
      res.status(404).json({ error: 'Project team not found.', code: 'TEAM_NOT_FOUND' });
      return;
    }

    // BR-06: Only members of this team or an INSTRUCTOR may access private proposal details
    const isMember = team.members.some((m) => m.userId === req.user!.id);
    if (req.user!.role !== 'INSTRUCTOR' && !isMember) {
      res.status(403).json({
        error: 'Forbidden: you do not have permission to view another team’s private proposal.',
        code: 'BR06_FORBIDDEN_TEAM_ACCESS',
      });
      return;
    }

    res.status(200).json({ proposal: team.proposal });
  } catch (err) {
    console.error('Get proposal error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

app.put('/api/teams/:id/proposal', requireAuth, requireRole('STUDENT'), async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const { title, problemStatement, techStack, repoUrl } = req.body || {};

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${teamId} FOR UPDATE`;

      const team = await tx.projectTeam.findUnique({
        where: { id: teamId },
        include: { members: true, proposal: true },
      });

      if (!team) {
        return {
          error: 'Project team not found.',
          code: 'TEAM_NOT_FOUND',
          status: 404,
        };
      }

      const isMember = team.members.some((m) => m.userId === req.user!.id);
      if (!isMember) {
        return {
          error: 'Forbidden: you cannot modify another team’s project proposal.',
          code: 'BR06_FORBIDDEN_TEAM_ACCESS',
          status: 403,
        };
      }

      if (
        team.proposal &&
        (team.proposal.status === 'SUBMITTED' || team.proposal.status === 'APPROVED')
      ) {
        return {
          error: `Proposal cannot be edited while in ${team.proposal.status} status.`,
          code: 'BR03_INVALID_STATUS_TRANSITION',
          status: 409,
        };
      }

      const proposal = await tx.projectProposal.upsert({
        where: { teamId: team.id },
        create: {
          teamId: team.id,
          title: typeof title === 'string' ? title.trim() : '',
          problemStatement: typeof problemStatement === 'string' ? problemStatement.trim() : '',
          techStack: typeof techStack === 'string' ? techStack.trim() : '',
          repoUrl: typeof repoUrl === 'string' ? repoUrl.trim() : '',
          status: 'DRAFT',
        },
        update: {
          title: typeof title === 'string' ? title.trim() : team.proposal?.title ?? '',
          problemStatement:
            typeof problemStatement === 'string'
              ? problemStatement.trim()
              : team.proposal?.problemStatement ?? '',
          techStack:
            typeof techStack === 'string' ? techStack.trim() : team.proposal?.techStack ?? '',
          repoUrl: typeof repoUrl === 'string' ? repoUrl.trim() : team.proposal?.repoUrl ?? '',
        },
        include: {
          reviewedBy: {
            select: { id: true, email: true, fullName: true, role: true },
          },
        },
      });

      return { proposal };
    });

    if ('error' in result) {
      res.status(result.status ?? 500).json({ error: result.error, code: result.code });
      return;
    }

    res.status(200).json({ proposal: result.proposal });
  } catch (err) {
    console.error('Save proposal draft error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

app.post('/api/teams/:id/proposal/submit', requireAuth, requireRole('STUDENT'), async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const { title, problemStatement, techStack, repoUrl } = req.body || {};

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${teamId} FOR UPDATE`;

      const team = await tx.projectTeam.findUnique({
        where: { id: teamId },
        include: { members: true, proposal: true },
      });

      if (!team) {
        return {
          error: 'Project team not found.',
          code: 'TEAM_NOT_FOUND',
          status: 404,
        };
      }

      const isMember = team.members.some((m) => m.userId === req.user!.id);
      if (!isMember) {
        return {
          error: 'Forbidden: you cannot submit another team’s project proposal.',
          code: 'BR06_FORBIDDEN_TEAM_ACCESS',
          status: 403,
        };
      }

      const currentStatus = team.proposal?.status || 'DRAFT';
      const effectiveTitle = typeof title === 'string' ? title : team.proposal?.title ?? '';
      const effectiveProblem =
        typeof problemStatement === 'string'
          ? problemStatement
          : team.proposal?.problemStatement ?? '';
      const effectiveStack =
        typeof techStack === 'string' ? techStack : team.proposal?.techStack ?? '';
      const effectiveRepo =
        typeof repoUrl === 'string' ? repoUrl : team.proposal?.repoUrl ?? '';

      const validation = validateProposalSubmission(currentStatus, {
        title: effectiveTitle,
        problemStatement: effectiveProblem,
        techStack: effectiveStack,
      });

      if (!validation.valid) {
        return {
          error: validation.error,
          code: validation.code,
          status: validation.status ?? 400,
        };
      }

      const nextRevisionCount = (team.proposal?.revisionCount || 0) + 1;
      const proposal = await tx.projectProposal.upsert({
        where: { teamId: team.id },
        create: {
          teamId: team.id,
          title: effectiveTitle.trim(),
          problemStatement: effectiveProblem.trim(),
          techStack: effectiveStack.trim(),
          repoUrl: effectiveRepo.trim(),
          status: 'SUBMITTED',
          submittedAt: new Date(),
          revisionCount: 1,
        },
        update: {
          title: effectiveTitle.trim(),
          problemStatement: effectiveProblem.trim(),
          techStack: effectiveStack.trim(),
          repoUrl: effectiveRepo.trim(),
          status: 'SUBMITTED',
          submittedAt: new Date(),
          revisionCount: nextRevisionCount,
        },
        include: {
          reviewedBy: {
            select: { id: true, email: true, fullName: true, role: true },
          },
        },
      });

      return { proposal };
    });

    if ('error' in result) {
      res.status(result.status ?? 500).json({ error: result.error, code: result.code });
      return;
    }

    res.status(200).json({ proposal: result.proposal });
  } catch (err) {
    console.error('Submit proposal error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

app.post('/api/proposals/:id/review', requireAuth, async (req, res) => {
  if (req.user!.role !== 'INSTRUCTOR') {
    res.status(403).json({
      error: 'Forbidden: only instructors may review proposals.',
      code: 'BR06_INSTRUCTOR_ROLE_REQUIRED',
    });
    return;
  }

  try {
    const proposalId = Number(req.params.id);
    const { decision, reviewFeedback } = req.body || {};

    const existing = await prisma.projectProposal.findUnique({
      where: { id: proposalId },
      select: { teamId: true },
    });

    if (!existing) {
      res.status(404).json({
        error: 'Project proposal not found.',
        code: 'PROPOSAL_NOT_FOUND',
      });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "ProjectTeam" WHERE "id" = ${existing.teamId} FOR UPDATE`;

      const currentProposal = await tx.projectProposal.findUnique({
        where: { id: proposalId },
      });

      if (!currentProposal) {
        return {
          error: 'Project proposal not found.',
          code: 'PROPOSAL_NOT_FOUND',
          status: 404,
        };
      }

      const validation = validateInstructorReview(
        currentProposal.status,
        decision,
        reviewFeedback
      );
      if (!validation.valid) {
        return {
          error: validation.error,
          code: validation.code,
          status: validation.status ?? 400,
        };
      }

      const updated = await tx.projectProposal.update({
        where: { id: proposalId },
        data: {
          status: decision,
          reviewFeedback: reviewFeedback.trim(),
          reviewedById: req.user!.id,
          reviewedAt: new Date(),
        },
        include: {
          reviewedBy: {
            select: { id: true, email: true, fullName: true, role: true },
          },
        },
      });

      return { proposal: updated };
    });

    if ('error' in result) {
      res.status(result.status ?? 500).json({ error: result.error, code: result.code });
      return;
    }

    res.status(200).json({ proposal: result.proposal });
  } catch (err) {
    console.error('Review proposal error:', err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Serve static frontend in production container
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

export default app;
