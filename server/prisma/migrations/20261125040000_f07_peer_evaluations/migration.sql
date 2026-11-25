-- Additive confidential peer records; no backfill or invented evaluations.
CREATE TABLE "PeerEvaluation" (
  "id" SERIAL NOT NULL,
  "teamId" INTEGER NOT NULL,
  "milestoneId" INTEGER NOT NULL,
  "evaluatorId" INTEGER NOT NULL,
  "evaluateeId" INTEGER NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL DEFAULT '',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PeerEvaluation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PeerEvaluation_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
  CONSTRAINT "PeerEvaluation_no_self_check" CHECK ("evaluatorId" <> "evaluateeId"),
  CONSTRAINT "PeerEvaluation_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "PeerEvaluation_milestoneId_evaluatorId_evaluateeId_key" ON "PeerEvaluation"("milestoneId", "evaluatorId", "evaluateeId");
CREATE INDEX "PeerEvaluation_teamId_milestoneId_id_idx" ON "PeerEvaluation"("teamId", "milestoneId", "id");
ALTER TABLE "PeerEvaluation" ADD CONSTRAINT "PeerEvaluation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "ProjectTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerEvaluation" ADD CONSTRAINT "PeerEvaluation_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PeerEvaluation" ADD CONSTRAINT "PeerEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PeerEvaluation" ADD CONSTRAINT "PeerEvaluation_evaluateeId_fkey" FOREIGN KEY ("evaluateeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
