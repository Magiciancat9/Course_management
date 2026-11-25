import { readFileSync } from 'fs';
import path from 'path';
import { afterAll, expect, it } from 'vitest';
import prisma from '../src/prisma';

it('S2-F06-T11/AC09 (SQL migration): actual additive F-06 SQL upgrades populated pre-F-06 data without inventing publications and enforces composite content-version FK', async () => {
  const url = new URL(process.env.DATABASE_URL || '');
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', 'postgres'].includes(url.hostname) ||
    !url.pathname.endsWith('_test')
  ) {
    throw new Error('Migration verification requires a disposable local/CI test database.');
  }

  const schema = `f06_mig_test_${process.pid}`;
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);

      async function applyMigration(name: string) {
        const sql = readFileSync(
          path.resolve(__dirname, '../prisma/migrations', name, 'migration.sql'),
          'utf8'
        );
        for (const statement of sql
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)) {
          await tx.$executeRawUnsafe(statement);
        }
      }

      // 1. Apply pre-F-06 migrations (init -> F-04 -> F-05)
      await applyMigration('20261110000000_init');
      await applyMigration('20261125000000_f04_milestone_status_version');
      await applyMigration('20261125010000_f05_submission_versions');

      // 2. Populate pre-F-06 baseline data including a legacy scored submission and version
      await tx.$executeRaw`
        INSERT INTO "User" ("id", "email", "fullName", "passwordHash", "role")
        VALUES
          (1, 'instr.mig@example.org', 'Migration Instructor', 'synthetic-hash', 'INSTRUCTOR'),
          (2, 'stu.mig@example.org', 'Migration Student', 'synthetic-hash', 'STUDENT')
      `;
      await tx.$executeRaw`
        INSERT INTO "Course" ("id", "code", "name", "term")
        VALUES (1, 'CPE334', 'Migration Course', '1/2026')
      `;
      await tx.$executeRaw`
        INSERT INTO "ProjectTeam" ("id", "name", "courseId", "createdById")
        VALUES (1, 'Team Migration', 1, 2)
      `;
      await tx.$executeRaw`
        INSERT INTO "TeamMember" ("teamId", "userId", "courseId")
        VALUES (1, 2, 1)
      `;
      await tx.$executeRaw`
        INSERT INTO "ProjectProposal" ("teamId", "title", "problemStatement", "techStack", "status", "updatedAt")
        VALUES (1, 'Retained Proposal', 'Retained problem statement for migration check.', 'React', 'APPROVED', CURRENT_TIMESTAMP)
      `;
      await tx.$executeRaw`
        INSERT INTO "RevokedToken" ("jti", "expiresAt")
        VALUES ('retained-jti-f06', '2027-01-01T00:00:00Z')
      `;
      await tx.$executeRaw`
        INSERT INTO "Milestone" ("id", "courseId", "title", "description", "dueDate", "weightPercent", "status", "version")
        VALUES (1, 1, 'Graded Milestone', 'Pre-F06 published milestone', '2026-11-29T16:59:00Z', 30, 'PUBLISHED', 2)
      `;
      await tx.$executeRaw`
        INSERT INTO "MilestoneSubmission" ("id", "milestoneId", "teamId", "artifactUrl", "reportUrl", "releaseTag", "notes", "score", "feedback", "submittedAt", "version", "dueDateSnapshot", "lateStatus")
        VALUES (11, 1, 1, 'https://example.org/repo-v1', null, 'v1.0', 'Legacy v1 notes', 77, 'Pre-F06 legacy feedback', '2026-11-20T10:00:00Z', 1, null, 'UNKNOWN')
      `;
      await tx.$executeRaw`
        INSERT INTO "SubmissionVersion" ("id", "submissionId", "version", "repoUrl", "reportUrl", "releaseTag", "notes", "submittedAt", "dueDateSnapshot", "lateStatus", "legacyScore", "legacyFeedback")
        VALUES (21, 11, 1, 'https://example.org/repo-v1', null, 'v1.0', 'Legacy v1 notes', '2026-11-20T10:00:00Z', null, 'UNKNOWN', 77, 'Pre-F06 legacy feedback')
      `;

      const snapshotBefore = await tx.$queryRaw`
        SELECT row_to_json(u) AS data FROM "User" u
        UNION ALL SELECT row_to_json(t) FROM "ProjectTeam" t
        UNION ALL SELECT row_to_json(p) FROM "ProjectProposal" p
        UNION ALL SELECT row_to_json(r) FROM "RevokedToken" r
        UNION ALL SELECT row_to_json(m) FROM "Milestone" m
        UNION ALL SELECT row_to_json(s) FROM "MilestoneSubmission" s
        UNION ALL SELECT row_to_json(v) FROM "SubmissionVersion" v
      `;

      // 3. Apply actual F-06 additive migration SQL
      await applyMigration('20261125020000_f06_grading_publications');

      // 4. Verify all pre-F-06 rows (including legacy score/feedback) are unchanged and no fake publications were invented
      const snapshotAfter = await tx.$queryRaw`
        SELECT row_to_json(u) AS data FROM "User" u
        UNION ALL SELECT row_to_json(t) FROM "ProjectTeam" t
        UNION ALL SELECT row_to_json(p) FROM "ProjectProposal" p
        UNION ALL SELECT row_to_json(r) FROM "RevokedToken" r
        UNION ALL SELECT row_to_json(m) FROM "Milestone" m
        UNION ALL SELECT row_to_json(s) FROM "MilestoneSubmission" s
        UNION ALL SELECT row_to_json(v) FROM "SubmissionVersion" v
      `;
      expect(snapshotAfter).toEqual(snapshotBefore);

      const evalCount = await tx.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) AS count FROM "SubmissionEvaluation"
      `;
      const pubCount = await tx.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) AS count FROM "GradePublication"
      `;
      expect(Number(evalCount[0].count)).toBe(0);
      expect(Number(pubCount[0].count)).toBe(0);

      // 5. Verify new v2 submission + evaluation + publication works and enforces composite FK
      await tx.$executeRaw`
        INSERT INTO "SubmissionVersion" ("id", "submissionId", "version", "repoUrl", "reportUrl", "releaseTag", "notes", "submittedAt", "dueDateSnapshot", "lateStatus")
        VALUES (22, 11, 2, 'https://example.org/repo-v2', 'https://example.org/report-v2.pdf', 'v2.0', 'New v2 notes', '2026-11-26T10:00:00Z', '2026-11-29T16:59:00Z', 'ON_TIME')
      `;
      await tx.$executeRaw`
        INSERT INTO "SubmissionEvaluation" ("id", "submissionId", "submissionVersion", "score", "feedback", "version", "draftRevision", "publishedDraftRevision", "updatedById")
        VALUES (31, 11, 2, 94, 'Verified F-06 published evaluation', 2, 1, 1, 1)
      `;
      await tx.$executeRaw`
        INSERT INTO "GradePublication" ("id", "evaluationId", "submissionId", "submissionVersion", "draftRevision", "score", "feedback", "publishedById")
        VALUES (41, 31, 11, 2, 1, 94, 'Verified F-06 published evaluation', 1)
      `;

      const pubs = await tx.$queryRaw<Array<Record<string, unknown>>>`
        SELECT "submissionId", "submissionVersion", "draftRevision", "score", "feedback"
        FROM "GradePublication"
        WHERE "submissionId" = 11
      `;
      expect(pubs).toEqual([
        {
          submissionId: 11,
          submissionVersion: 2,
          draftRevision: 1,
          score: 94,
          feedback: 'Verified F-06 published evaluation',
        },
      ]);

      await tx.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    },
    { timeout: 30000 }
  );
}, 30000);

afterAll(async () => {
  await prisma.$disconnect();
});
