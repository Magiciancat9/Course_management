import { readFileSync } from 'fs';
import path from 'path';
import { afterAll, expect, it } from 'vitest';
import prisma from '../src/prisma';
import { assertDisposableTestDatabase } from './helpers/disposableDatabase';

it('S3-F07-T02-M: actual additive task SQL preserves populated Sprint 1/2 records and grading publications', async () => {
  assertDisposableTestDatabase();
  const schema = `f07_upgrade_${process.pid}`;
  await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
    const apply = async (name: string) => {
      const sql = readFileSync(path.resolve(__dirname, '../prisma/migrations', name, 'migration.sql'), 'utf8');
      for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
    };
    for (const migration of ['20261110000000_init', '20261125000000_f04_milestone_status_version',
      '20261125010000_f05_submission_versions', '20261125020000_f06_grading_publications']) await apply(migration);
    await tx.$executeRaw`INSERT INTO "User" ("id","email","fullName","passwordHash") VALUES (1,'migration@example.org','Retained synthetic user','not-a-login-hash')`;
    await tx.$executeRaw`INSERT INTO "Course" ("id","code","name","term") VALUES (1,'F07-MIG','Retained course','1/2026')`;
    await tx.$executeRaw`INSERT INTO "ProjectTeam" ("id","name","courseId","createdById") VALUES (1,'Retained team',1,1)`;
    await tx.$executeRaw`INSERT INTO "TeamMember" ("teamId","userId","courseId") VALUES (1,1,1)`;
    await tx.$executeRaw`INSERT INTO "ProjectProposal" ("teamId","title","problemStatement","techStack","status","updatedAt") VALUES (1,'Retained proposal','Retained problem statement','React','APPROVED',CURRENT_TIMESTAMP)`;
    await tx.$executeRaw`INSERT INTO "RevokedToken" ("jti","expiresAt") VALUES ('retained-f07-session','2027-01-01Z')`;
    await tx.$executeRaw`INSERT INTO "Milestone" ("id","courseId","title","description","dueDate","status") VALUES (1,1,'Retained milestone','Retained description','2026-11-29T16:59:00Z','PUBLISHED')`;
    await tx.$executeRaw`INSERT INTO "MilestoneSubmission" ("id","milestoneId","teamId","artifactUrl","releaseTag","score","feedback") VALUES (1,1,1,'https://example.org/repo','retained-v1',77,'Retained legacy feedback')`;
    await tx.$executeRaw`INSERT INTO "SubmissionVersion" ("id","submissionId","version","repoUrl","releaseTag","submittedAt","lateStatus") VALUES (1,1,1,'https://example.org/repo','retained-v1',CURRENT_TIMESTAMP,'UNKNOWN')`;
    await tx.$executeRaw`INSERT INTO "SubmissionEvaluation" ("id","submissionId","submissionVersion","score","feedback","version","draftRevision","publishedDraftRevision","updatedById") VALUES (1,1,1,92,'Retained published feedback',2,1,1,1)`;
    await tx.$executeRaw`INSERT INTO "GradePublication" ("id","evaluationId","submissionId","submissionVersion","draftRevision","score","feedback","publishedById") VALUES (1,1,1,1,1,92,'Retained published feedback',1)`;
    const tables = ['User','Course','ProjectTeam','TeamMember','ProjectProposal','RevokedToken','Milestone',
      'MilestoneSubmission','SubmissionVersion','SubmissionEvaluation','GradePublication'];
    const snapshot = async () => Promise.all(tables.map(table => tx.$queryRawUnsafe(`SELECT row_to_json(t) AS data FROM "${table}" t`)));
    const before = await snapshot();
    await apply('20261125030000_f07_task_checkpoint');
    expect(await snapshot()).toEqual(before);
    expect(await tx.$queryRaw`SELECT * FROM "Task"`).toEqual([]);
    expect(await tx.$queryRaw`SELECT * FROM "TaskEvent"`).toEqual([]);
    await tx.$executeRaw`INSERT INTO "Task" ("teamId","title","sprintNumber","assigneeId","milestoneId","createdById","updatedById") VALUES (1,'New task after upgrade',3,1,1,1,1)`;
    await tx.$executeRaw`INSERT INTO "TaskEvent" ("taskId","actorId","version","changes") VALUES (1,1,1,'{"status":{"before":null,"after":"TODO"}}'::jsonb)`;
    expect(await tx.$queryRaw`SELECT "status","version","teamId" FROM "Task"`).toEqual([{ status: 'TODO', version: 1, teamId: 1 }]);
    expect(await snapshot()).toEqual(before);
    await tx.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  }, { timeout: 30000 });
});
afterAll(async () => { await prisma.$disconnect(); });
