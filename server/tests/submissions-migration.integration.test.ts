import { readFileSync } from 'fs';
import path from 'path';
import { afterAll, expect, it } from 'vitest';
import prisma from '../src/prisma';

it('S2-F05-T09/AC09: actual additive SQL upgrades populated legacy data without inventing metadata', async () => {
  const url = new URL(process.env.DATABASE_URL || '');
  if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', 'postgres'].includes(url.hostname) || !url.pathname.endsWith('_test')) {
    throw new Error('Migration verification requires a disposable local/CI test database.');
  }
  // All DDL is confined to this private schema inside a transaction. The test
  // never resets the public schema or uses production migration/seed commands.
  const schema = `f05_mig_test_${process.pid}`;
  await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
    async function migrate(name: string) {
      const sql = readFileSync(path.resolve(__dirname, '../prisma/migrations', name, 'migration.sql'), 'utf8');
      for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
    }
    await migrate('20261110000000_init');
    await migrate('20261125000000_f04_milestone_status_version');
    await tx.$executeRaw`INSERT INTO "User" ("id","email","fullName","passwordHash") VALUES (1,'migration@example.org','Synthetic migration fixture','synthetic-not-a-login-hash')`;
    await tx.$executeRaw`INSERT INTO "Course" ("id","code","name","term") VALUES (1,'MIG','Migration course','1/2026')`;
    await tx.$executeRaw`INSERT INTO "ProjectTeam" ("id","name","courseId","createdById") VALUES (1,'Retained team',1,1)`;
    await tx.$executeRaw`INSERT INTO "TeamMember" ("teamId","userId","courseId") VALUES (1,1,1)`;
    await tx.$executeRaw`INSERT INTO "ProjectProposal" ("teamId","title","problemStatement","techStack","updatedAt") VALUES (1,'Retained proposal','Unchanged original problem','React',CURRENT_TIMESTAMP)`;
    await tx.$executeRaw`INSERT INTO "RevokedToken" ("jti","expiresAt") VALUES ('retained-session','2027-01-01T00:00:00Z')`;
    await tx.$executeRaw`INSERT INTO "Milestone" ("id","courseId","title","description","dueDate","weightPercent") VALUES (1,1,'Legacy milestone','Original milestone','2026-11-29T16:59:00Z',25)`;
    await tx.$executeRaw`INSERT INTO "MilestoneSubmission" ("id","milestoneId","teamId","artifactUrl","releaseTag","notes","score","feedback","submittedAt") VALUES (7,1,1,'https://example.org/legacy','legacy-v1','Retained notes',88,'Legacy review','2026-11-20T10:00:00Z')`;
    const before = await tx.$queryRaw`SELECT row_to_json(u) AS data FROM "User" u UNION ALL SELECT row_to_json(t) FROM "ProjectTeam" t UNION ALL SELECT row_to_json(p) FROM "ProjectProposal" p UNION ALL SELECT row_to_json(r) FROM "RevokedToken" r`;
    await migrate('20261125010000_f05_submission_versions');
    const current = await tx.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "MilestoneSubmission" WHERE "id" = 7`;
    expect(current).toHaveLength(1);
    expect(current[0]).toMatchObject({ id: 7, artifactUrl: 'https://example.org/legacy', score: 88, feedback: 'Legacy review',
      version: 1, reportUrl: null, dueDateSnapshot: null, lateStatus: 'UNKNOWN' });
    const versions = await tx.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "SubmissionVersion"`;
    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({ submissionId: 7, version: 1, repoUrl: current[0].artifactUrl, reportUrl: null,
      releaseTag: 'legacy-v1', notes: 'Retained notes', submittedAt: current[0].submittedAt,
      dueDateSnapshot: null, lateStatus: 'UNKNOWN', legacyScore: 88, legacyFeedback: 'Legacy review' });
    expect(await tx.$queryRaw`SELECT row_to_json(u) AS data FROM "User" u UNION ALL SELECT row_to_json(t) FROM "ProjectTeam" t UNION ALL SELECT row_to_json(p) FROM "ProjectProposal" p UNION ALL SELECT row_to_json(r) FROM "RevokedToken" r`).toEqual(before);
    await tx.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  }, { timeout: 30000 });
});

afterAll(async () => { await prisma.$disconnect(); });
