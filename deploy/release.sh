#!/usr/bin/env bash
# ==============================================================================
# CoursePMS — release.sh (used by .github/workflows/deploy.yml)
# ==============================================================================
# WHAT THIS SCRIPT DOES
#   Update pre-provisioned resources only. Does not create SQL, IAM or secrets.
#   (Create those once with deploy/deploy.sh.)
#   Normal release : verify image -> update migration job to migration-only ->
#                    run migration job -> update service.
#   Rollback       : verify image -> update service (NO migration, NO seed).
#
# INPUT (environment variables)
#   PROJECT_ID, REGION, IMAGE_TAG   required (IMAGE_TAG = full 40-char commit SHA)
#   REPO_NAME                       optional (default: course-pms)
#   SERVICE_NAME, MIGRATE_JOB_NAME  optional (default: course-pms, course-pms-migrate)
#   SECRET_DB_URL                   optional (default: course-pms-database-url)
#   ROLLBACK                        true | false (default false)
#   GITHUB_ENV                      when set, SERVICE_URL / DEPLOYED_IMAGE are
#                                   appended so later workflow steps can use them
#
# IMPORTANT
#   - Normal releases explicitly reset the migration job command/args and
#     secrets to run additive migration ONLY (`prisma:migrate:deploy` with
#     `DATABASE_URL`), even if the job was originally provisioned with `--demo`.
#   - If the migration job fails, `set -e` stops the script BEFORE the service is
#     updated, so a broken migration never reaches users.
#   - The image is resolved to an immutable @sha256 digest so the job and the
#     service run exactly the same image.
#   - Sets APP_COMMIT_SHA=$IMAGE_TAG on the Cloud Run service so /api/health
#     reports the exact running commit SHA.
#   - Offline test: deploy/tests/test_release_stub.sh
# ==============================================================================
set -euo pipefail

# ------------------------------------------------------------------------------
# 1. Read and validate inputs (fail before any GCP call)
# ------------------------------------------------------------------------------
: "${PROJECT_ID:?Required}" "${REGION:?Required}" "${IMAGE_TAG:?Required}"
REPO_NAME="${REPO_NAME:-course-pms}"
SERVICE_NAME="${SERVICE_NAME:-course-pms}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-course-pms-migrate}"
SECRET_DB_URL="${SECRET_DB_URL:-course-pms-database-url}"
ROLLBACK="${ROLLBACK:-false}"
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid image tag.' >&2; exit 1; }
[[ "$ROLLBACK" == true || "$ROLLBACK" == false ]] || { echo 'Invalid rollback mode.' >&2; exit 1; }

# ------------------------------------------------------------------------------
# 2. Find the image and pin it by digest
# ------------------------------------------------------------------------------
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:$IMAGE_TAG"
DIGEST_IMAGE="$(gcloud artifacts docker images describe "$IMAGE" --project="$PROJECT_ID" --format='value(image_summary.fully_qualified_digest)')"
[[ "$DIGEST_IMAGE" == "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME@sha256:"* ]] || { echo 'Image digest not found.' >&2; exit 1; }

# ------------------------------------------------------------------------------
# 3. Database migration (normal release only; `--wait` blocks until it finishes)
#    Explicitly enforces migration-only command and secrets so a job previously
#    created with `deploy/deploy.sh --demo` does not re-run seeding on release.
#    IMPORTANT: a failure here aborts the release (set -e) — service untouched.
# ------------------------------------------------------------------------------
MIGRATE_ONLY_CMD="npm --prefix server run prisma:migrate:deploy"
if [[ "$ROLLBACK" == false ]]; then
  gcloud run jobs update "$MIGRATE_JOB_NAME" \
    --image="$DIGEST_IMAGE" \
    --command="sh" \
    --args="-c,${MIGRATE_ONLY_CMD}" \
    --set-secrets="DATABASE_URL=${SECRET_DB_URL}:latest" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --quiet
  gcloud run jobs execute "$MIGRATE_JOB_NAME" --wait --project="$PROJECT_ID" --region="$REGION" --quiet
else
  echo 'Rollback: reuse existing image; skip tests, build, migration and seed.'
fi

# ------------------------------------------------------------------------------
# 4. Point the Cloud Run service at the image, record APP_COMMIT_SHA, and send
#    100% of traffic to the new revision
# ------------------------------------------------------------------------------
gcloud run services update "$SERVICE_NAME" --image="$DIGEST_IMAGE" --update-env-vars="APP_COMMIT_SHA=$IMAGE_TAG" --project="$PROJECT_ID" --region="$REGION" --quiet
gcloud run services update-traffic "$SERVICE_NAME" --to-latest --project="$PROJECT_ID" --region="$REGION" --quiet

# ------------------------------------------------------------------------------
# 5. Report the URL (and hand it to the next workflow steps via GITHUB_ENV)
# ------------------------------------------------------------------------------
SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
echo "Service URL: $SERVICE_URL"
if [[ -n "${GITHUB_ENV:-}" ]]; then
  printf 'SERVICE_URL=%s\nDEPLOYED_IMAGE=%s\n' "$SERVICE_URL" "$DIGEST_IMAGE" >> "$GITHUB_ENV"
fi
