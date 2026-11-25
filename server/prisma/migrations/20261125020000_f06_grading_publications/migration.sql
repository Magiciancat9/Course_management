-- Additive F-06 migration: version-bound evaluation aggregates and immutable grade publications.
-- Legacy MilestoneSubmission.score/feedback and SubmissionVersion.legacyScore/legacyFeedback
-- remain untouched; no unverifiable GradePublication rows are invented for legacy data.

CREATE TABLE "SubmissionEvaluation" (
  "id" SERIAL NOT NULL,
  "submissionId" INTEGER NOT NULL,
  "submissionVersion" INTEGER NOT NULL,
  "score" INTEGER NOT NULL,
  "feedback" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "draftRevision" INTEGER NOT NULL DEFAULT 1,
  "publishedDraftRevision" INTEGER,
  "updatedById" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubmissionEvaluation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SubmissionEvaluation_submissionId_fkey" FOREIGN KEY ("submissionId")
    REFERENCES "MilestoneSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SubmissionEvaluation_submissionId_submissionVersion_fkey"
    FOREIGN KEY ("submissionId", "submissionVersion")
    REFERENCES "SubmissionVersion"("submissionId", "version") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SubmissionEvaluation_updatedById_fkey" FOREIGN KEY ("updatedById")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SubmissionEvaluation_submissionId_submissionVersion_key"
  ON "SubmissionEvaluation"("submissionId", "submissionVersion");

CREATE TABLE "GradePublication" (
  "id" SERIAL NOT NULL,
  "evaluationId" INTEGER NOT NULL,
  "submissionId" INTEGER NOT NULL,
  "submissionVersion" INTEGER NOT NULL,
  "draftRevision" INTEGER NOT NULL,
  "score" INTEGER NOT NULL,
  "feedback" TEXT NOT NULL,
  "publishedById" INTEGER NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GradePublication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GradePublication_evaluationId_fkey" FOREIGN KEY ("evaluationId")
    REFERENCES "SubmissionEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GradePublication_submissionId_fkey" FOREIGN KEY ("submissionId")
    REFERENCES "MilestoneSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GradePublication_publishedById_fkey" FOREIGN KEY ("publishedById")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "GradePublication_evaluationId_draftRevision_key"
  ON "GradePublication"("evaluationId", "draftRevision");
