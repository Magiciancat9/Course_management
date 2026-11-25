-- Additive F-05 upgrade. Missing historical reports, deadlines and publication
-- provenance stay unknown. Existing score/feedback is retained, not published.
CREATE TYPE "SubmissionLateStatus" AS ENUM ('ON_TIME', 'LATE', 'UNKNOWN');

ALTER TABLE "MilestoneSubmission"
ADD COLUMN "reportUrl" TEXT,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "dueDateSnapshot" TIMESTAMP(3),
ADD COLUMN "lateStatus" "SubmissionLateStatus" NOT NULL DEFAULT 'UNKNOWN';

CREATE TABLE "SubmissionVersion" (
  "id" SERIAL NOT NULL,
  "submissionId" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "repoUrl" TEXT NOT NULL,
  "reportUrl" TEXT,
  "releaseTag" TEXT NOT NULL,
  "notes" TEXT NOT NULL DEFAULT '',
  "submittedAt" TIMESTAMP(3) NOT NULL,
  "dueDateSnapshot" TIMESTAMP(3),
  "lateStatus" "SubmissionLateStatus" NOT NULL DEFAULT 'UNKNOWN',
  "legacyScore" INTEGER,
  "legacyFeedback" TEXT,
  CONSTRAINT "SubmissionVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SubmissionVersion_submissionId_fkey" FOREIGN KEY ("submissionId")
    REFERENCES "MilestoneSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SubmissionVersion_submissionId_version_key" ON "SubmissionVersion"("submissionId", "version");

INSERT INTO "SubmissionVersion" ("submissionId", "version", "repoUrl", "reportUrl", "releaseTag", "notes",
  "submittedAt", "dueDateSnapshot", "lateStatus", "legacyScore", "legacyFeedback")
SELECT "id", 1, "artifactUrl", NULL, "releaseTag", "notes", "submittedAt", NULL, 'UNKNOWN', "score", "feedback"
FROM "MilestoneSubmission";
