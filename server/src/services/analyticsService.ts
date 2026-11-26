import { Prisma, Role } from '@prisma/client';
import prisma from '../prisma';
import {
  formatGradebookCsv,
  GradebookMilestoneRowInput,
  GradebookSubmissionCellInput,
  GradebookTeamRowInput,
} from './gradebookExport';

type Actor = { id: number; role: Role };
type Failure = { ok: false; status: number; code: string; error: string };
type Result<T> = { ok: true; data: T } | Failure;
type Tx = Prisma.TransactionClient;

export type ProposalStateBucket = 'NONE' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
export type FlagReason = 'REVISION_REQUESTED' | 'OVERDUE_MISSING_SUBMISSION' | 'LATE_SUBMISSION';

export interface CourseAnalyticsDto {
  course: {
    id: number;
    code: string;
    name: string;
    term: string;
  };
  generatedAt: string;
  totals: {
    totalTeams: number;
    publishedMilestones: number;
    submittedDeliverables: number;
    gradedDeliverables: number;
    ungradedDeliverables: number;
    flaggedTeams: number;
  };
  proposalStates: Record<ProposalStateBucket, number>;
  milestoneProgress: Array<{
    milestoneId: number;
    title: string;
    dueDate: string;
    weightPercent: number | null;
    submittedTeams: number;
    totalTeams: number;
    completionRatePct: number | null;
    onTimeCount: number;
    lateCount: number;
    unknownLateCount: number;
    gradedCount: number;
    ungradedCount: number;
  }>;
  ungraded: Array<{
    submissionId: number;
    submissionVersion: number;
    teamId: number;
    teamName: string;
    milestoneId: number;
    milestoneTitle: string;
    submittedAt: string;
    lateStatus: 'ON_TIME' | 'LATE' | 'UNKNOWN';
    hasDraftEvaluation: boolean;
  }>;
  flaggedTeams: Array<{
    teamId: number;
    teamName: string;
    proposalStatus: ProposalStateBucket;
    reasons: FlagReason[];
    overdueMilestoneIds: number[];
    lateMilestoneIds: number[];
  }>;
}

const fail = (status: number, code: string, error: string): Failure => ({ ok: false, status, code, error });

async function withCoherentSnapshot<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code;
      const isSerializationConflict =
        code === 'P2034' || code === '40001' || msg.includes('40001') || msg.includes('could not serialize access');
      if (!isSerializationConflict || attempt === 3) {
        throw err;
      }
    }
  }
  throw new Error('Unreachable');
}

export function parseCourseIdParam(raw: unknown): number | null {
  if (typeof raw !== 'string' || !/^[1-9][0-9]*$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 2147483647 ? parsed : null;
}

export function computeCompletionRatePct(submittedTeams: number, totalTeams: number): number | null {
  if (totalTeams <= 0) return null;
  return Number(((100 * submittedTeams) / totalTeams).toFixed(2));
}

export function isMilestoneOverdue(dueDate: Date, now: Date): boolean {
  // At exact deadline equality a missing submission is not yet overdue; +1ms is.
  return now.getTime() > dueDate.getTime();
}

async function buildCourseSnapshot(tx: Tx, courseId: number, now: Date) {
  // Coordinate with in-flight milestone/submission/grading FOR UPDATE transactions
  // and read a coherent point-in-time snapshot.
  await tx.$queryRaw`SELECT "id" FROM "Course" WHERE "id" = ${courseId} FOR SHARE`;
  await tx.$queryRaw`SELECT "id" FROM "Milestone" WHERE "courseId" = ${courseId} FOR SHARE`;
  await tx.$queryRaw`
    SELECT s."id"
    FROM "MilestoneSubmission" s
    JOIN "ProjectTeam" t ON t."id" = s."teamId"
    WHERE t."courseId" = ${courseId}
    FOR SHARE
  `;

  const course = await tx.course.findUnique({
    where: { id: courseId },
    select: { id: true, code: true, name: true, term: true },
  });
  if (!course) return fail(404, 'COURSE_NOT_FOUND', 'Course not found.');

  // Strictly select only non-confidential fields (never passwordHash or PeerEvaluation).
  const teams = await tx.projectTeam.findMany({
    where: { courseId },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      proposal: {
        select: {
          status: true,
        },
      },
    },
  });

  const publishedMilestones = await tx.milestone.findMany({
    where: { courseId, status: 'PUBLISHED' },
    orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      title: true,
      dueDate: true,
      weightPercent: true,
    },
  });

  const publishedMilestoneIds = publishedMilestones.map((m) => m.id);
  const teamIds = teams.map((t) => t.id);

  const submissions =
    publishedMilestoneIds.length > 0 && teamIds.length > 0
      ? await tx.milestoneSubmission.findMany({
          where: {
            milestoneId: { in: publishedMilestoneIds },
            teamId: { in: teamIds },
          },
          orderBy: { id: 'asc' },
          select: {
            id: true,
            milestoneId: true,
            teamId: true,
            version: true,
            submittedAt: true,
            lateStatus: true,
            versions: {
              select: {
                version: true,
                submittedAt: true,
                lateStatus: true,
                evaluation: {
                  select: {
                    id: true,
                    submissionVersion: true,
                  },
                },
              },
            },
          },
        })
      : [];

  const submissionIds = submissions.map((s) => s.id);
  const publications =
    submissionIds.length > 0
      ? await tx.gradePublication.findMany({
          where: { submissionId: { in: submissionIds } },
          orderBy: [{ submissionId: 'asc' }, { submissionVersion: 'asc' }, { draftRevision: 'desc' }],
          select: {
            id: true,
            submissionId: true,
            submissionVersion: true,
            draftRevision: true,
            score: true,
            publishedAt: true,
          },
        })
      : [];

  // Map latest GradePublication strictly for (submissionId, submissionVersion)
  const latestPubBySubVersion = new Map<string, { score: number; publishedAt: Date }>();
  for (const pub of publications) {
    const key = `${pub.submissionId}:${pub.submissionVersion}`;
    if (!latestPubBySubVersion.has(key)) {
      latestPubBySubVersion.set(key, { score: pub.score, publishedAt: pub.publishedAt });
    }
  }

  // Index current submissions by "teamId:milestoneId"
  type ResolvedCurrentSub = {
    submissionId: number;
    teamId: number;
    milestoneId: number;
    currentVersion: number;
    submittedAt: Date;
    lateStatus: 'ON_TIME' | 'LATE' | 'UNKNOWN';
    hasDraftEvaluation: boolean;
    publishedScore: number | null;
    publishedAt: Date | null;
  };

  const subByTeamMilestone = new Map<string, ResolvedCurrentSub>();
  for (const sub of submissions) {
    const currentVerRow = sub.versions.find((v) => v.version === sub.version);
    const submittedAt = currentVerRow ? currentVerRow.submittedAt : sub.submittedAt;
    const lateStatus = currentVerRow ? currentVerRow.lateStatus : sub.lateStatus;
    const pub = latestPubBySubVersion.get(`${sub.id}:${sub.version}`) ?? null;
    const hasDraftEvaluation = Boolean(currentVerRow?.evaluation && !pub);
    subByTeamMilestone.set(`${sub.teamId}:${sub.milestoneId}`, {
      submissionId: sub.id,
      teamId: sub.teamId,
      milestoneId: sub.milestoneId,
      currentVersion: sub.version,
      submittedAt,
      lateStatus,
      hasDraftEvaluation,
      publishedScore: pub ? pub.score : null,
      publishedAt: pub ? pub.publishedAt : null,
    });
  }

  return {
    ok: true as const,
    data: {
      course,
      now,
      teams,
      publishedMilestones,
      subByTeamMilestone,
    },
  };
}

export async function getCourseAnalytics(
  courseId: number,
  actor: Actor,
  query: Record<string, unknown> = {}
): Promise<Result<CourseAnalyticsDto>> {
  if (actor.role !== 'INSTRUCTOR') {
    return fail(403, 'INSTRUCTOR_ROLE_REQUIRED', 'Only instructors may access course analytics.');
  }
  if (Object.keys(query).length > 0) {
    return fail(400, 'VALIDATION_ERROR', 'Unknown query parameter.');
  }

  const now = new Date(Date.now());
  return withCoherentSnapshot(async (tx) => {
      const snapResult = await buildCourseSnapshot(tx, courseId, now);
      if (!snapResult.ok) return snapResult;
      const { course, teams, publishedMilestones, subByTeamMilestone } = snapResult.data;

      const totalTeams = teams.length;
      const proposalStates: Record<ProposalStateBucket, number> = {
        NONE: 0,
        DRAFT: 0,
        SUBMITTED: 0,
        APPROVED: 0,
        REVISION_REQUESTED: 0,
      };

      const teamById = new Map<number, { id: number; name: string; proposalStatus: ProposalStateBucket }>();
      for (const team of teams) {
        const status: ProposalStateBucket = team.proposal?.status ?? 'NONE';
        proposalStates[status]++;
        teamById.set(team.id, { id: team.id, name: team.name, proposalStatus: status });
      }

      let submittedDeliverables = 0;
      let gradedDeliverables = 0;
      let ungradedDeliverables = 0;
      const ungraded: CourseAnalyticsDto['ungraded'] = [];

      const milestoneProgress: CourseAnalyticsDto['milestoneProgress'] = publishedMilestones.map((ms) => {
        let submittedTeams = 0;
        let onTimeCount = 0;
        let lateCount = 0;
        let unknownLateCount = 0;
        let gradedCount = 0;
        let ungradedCount = 0;

        for (const team of teams) {
          const sub = subByTeamMilestone.get(`${team.id}:${ms.id}`);
          if (!sub) continue;
          submittedTeams++;
          submittedDeliverables++;
          if (sub.lateStatus === 'ON_TIME') onTimeCount++;
          else if (sub.lateStatus === 'LATE') lateCount++;
          else unknownLateCount++;

          if (sub.publishedScore !== null) {
            gradedCount++;
            gradedDeliverables++;
          } else {
            ungradedCount++;
            ungradedDeliverables++;
            ungraded.push({
              submissionId: sub.submissionId,
              submissionVersion: sub.currentVersion,
              teamId: team.id,
              teamName: team.name,
              milestoneId: ms.id,
              milestoneTitle: ms.title,
              submittedAt: sub.submittedAt.toISOString(),
              lateStatus: sub.lateStatus,
              hasDraftEvaluation: sub.hasDraftEvaluation,
            });
          }
        }

        return {
          milestoneId: ms.id,
          title: ms.title,
          dueDate: ms.dueDate.toISOString(),
          weightPercent: ms.weightPercent,
          submittedTeams,
          totalTeams,
          completionRatePct: computeCompletionRatePct(submittedTeams, totalTeams),
          onTimeCount,
          lateCount,
          unknownLateCount,
          gradedCount,
          ungradedCount,
        };
      });

      const flaggedTeams: CourseAnalyticsDto['flaggedTeams'] = [];
      for (const team of teams) {
        const tInfo = teamById.get(team.id)!;
        const reasons: FlagReason[] = [];
        const overdueMilestoneIds: number[] = [];
        const lateMilestoneIds: number[] = [];

        if (tInfo.proposalStatus === 'REVISION_REQUESTED') {
          reasons.push('REVISION_REQUESTED');
        }

        for (const ms of publishedMilestones) {
          const sub = subByTeamMilestone.get(`${team.id}:${ms.id}`);
          if (!sub && isMilestoneOverdue(ms.dueDate, now)) {
            overdueMilestoneIds.push(ms.id);
          }
          if (sub && sub.lateStatus === 'LATE') {
            lateMilestoneIds.push(ms.id);
          }
        }

        if (overdueMilestoneIds.length > 0) {
          reasons.push('OVERDUE_MISSING_SUBMISSION');
        }
        if (lateMilestoneIds.length > 0) {
          reasons.push('LATE_SUBMISSION');
        }

        if (reasons.length > 0) {
          flaggedTeams.push({
            teamId: team.id,
            teamName: team.name,
            proposalStatus: tInfo.proposalStatus,
            reasons,
            overdueMilestoneIds,
            lateMilestoneIds,
          });
        }
      }

      return {
        ok: true as const,
        data: {
          course,
          generatedAt: now.toISOString(),
          totals: {
            totalTeams,
            publishedMilestones: publishedMilestones.length,
            submittedDeliverables,
            gradedDeliverables,
            ungradedDeliverables,
            flaggedTeams: flaggedTeams.length,
          },
          proposalStates,
          milestoneProgress,
          ungraded,
          flaggedTeams,
        },
      };
    });
}

export async function getCourseGradebookExport(
  courseId: number,
  actor: Actor,
  query: Record<string, unknown> = {}
): Promise<Result<{ csv: string; filename: string }>> {
  if (actor.role !== 'INSTRUCTOR') {
    return fail(403, 'INSTRUCTOR_ROLE_REQUIRED', 'Only instructors may export the course gradebook.');
  }
  if (Object.keys(query).length > 0) {
    return fail(400, 'VALIDATION_ERROR', 'Unknown query parameter.');
  }

  const now = new Date(Date.now());
  return withCoherentSnapshot(async (tx) => {
      const snapResult = await buildCourseSnapshot(tx, courseId, now);
      if (!snapResult.ok) return snapResult;
      const { course, teams, publishedMilestones, subByTeamMilestone } = snapResult.data;

      const teamRows: GradebookTeamRowInput[] = teams.map((t) => ({
        teamId: t.id,
        teamName: t.name,
        proposalStatus: t.proposal?.status ?? 'NONE',
      }));

      const milestoneRows: GradebookMilestoneRowInput[] = publishedMilestones.map((m) => ({
        milestoneId: m.id,
        milestoneTitle: m.title,
        dueDateUtc: m.dueDate.toISOString(),
        weightPercent: m.weightPercent,
      }));

      const submissionsByTeamAndMilestone = new Map<string, GradebookSubmissionCellInput>();
      for (const [key, sub] of subByTeamMilestone.entries()) {
        submissionsByTeamAndMilestone.set(key, {
          submissionId: sub.submissionId,
          submissionVersion: sub.currentVersion,
          submittedAtUtc: sub.submittedAt.toISOString(),
          lateStatus: sub.lateStatus,
          publishedScore: sub.publishedScore,
          publishedAtUtc: sub.publishedAt ? sub.publishedAt.toISOString() : null,
        });
      }

      return {
        ok: true as const,
        data: formatGradebookCsv({
          courseCode: course.code,
          generatedAtUtc: now.toISOString(),
          teams: teamRows,
          publishedMilestones: milestoneRows,
          submissionsByTeamAndMilestone,
        }),
      };
    });
}
