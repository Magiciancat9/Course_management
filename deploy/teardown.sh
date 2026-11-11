#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# CoursePMS — Google Cloud Run & Cloud SQL Teardown Script
# ==============================================================================
# Usage:
#   REGION=<confirmed-region> ./deploy/teardown.sh
#
# Environment Variables:
#   REGION       Required. GCP Region matching deploy/deploy.sh.
#   PROJECT_ID   Optional. GCP Project ID (defaults to active gcloud project,
#                or example-gcp-project when DRY_RUN=1).
#   DRY_RUN      Optional. Set DRY_RUN=1 to print all gcloud commands without
#                executing any real GCP calls.
#
# WHAT THIS SCRIPT DOES
#   Deletes everything deploy/deploy.sh created (Cloud Run service + job, Cloud
#   SQL instance, Artifact Registry repo, Secret Manager secrets, and service
#   accounts) to stop billing after grading is complete.
#   - Resources that are genuinely absent (NOT_FOUND / 404) are skipped cleanly.
#   - Permission, authentication, or API failures abort the script with a
#     non-zero exit code instead of claiming teardown completed.
#
# DESTRUCTIVE: all Cloud SQL data is permanently lost. You must type the
# project ID to confirm. Preview first with:
#   DRY_RUN=1 REGION=asia-southeast1 ./deploy/teardown.sh
# ==============================================================================

DRY_RUN="${DRY_RUN:-0}"
REGION="${REGION:-}"

if [ -z "$REGION" ]; then
  echo "Error: REGION is required and has no implicit default." >&2
  echo "Usage: REGION=<confirmed-region> $0" >&2
  exit 1
fi

delete_if_exists() {
  local label="$1"
  shift
  if [ "$DRY_RUN" = "1" ]; then
    echo "[DRY_RUN] $*"
    return 0
  fi
  echo "+ $*"
  local stderr_file
  stderr_file="$(mktemp)"
  local rc=0
  "$@" 2>"$stderr_file" || rc=$?
  if [ "$rc" -eq 0 ]; then
    if [ -s "$stderr_file" ]; then
      cat "$stderr_file" >&2
    fi
    rm -f "$stderr_file"
    return 0
  fi
  local err_msg
  err_msg="$(cat "$stderr_file")"
  if [ -n "$err_msg" ]; then
    printf '%s\n' "$err_msg" >&2
  fi
  rm -f "$stderr_file"
  if printf '%s' "$err_msg" | grep -Eiq '(NOT_FOUND|not found|was not found|does not exist|Cannot find|HTTPError 404|code[=: ]+404)'; then
    echo "Info: ${label} is already absent; skipping."
    return 0
  fi
  echo "Error: Failed to delete ${label} (exit ${rc})." >&2
  return "$rc"
}

if [ "$DRY_RUN" = "1" ]; then
  PROJECT_ID="${PROJECT_ID:-example-gcp-project}"
else
  PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
  if [ -z "$PROJECT_ID" ]; then
    echo "Error: PROJECT_ID is not set and no active gcloud project was found." >&2
    exit 1
  fi
fi

# ------------------------------------------------------------------------------
# Resource names (must match deploy/deploy.sh)
# ------------------------------------------------------------------------------
REPO_NAME="${REPO_NAME:-course-pms}"
SQL_INSTANCE="${SQL_INSTANCE:-course-pms-pg}"
SERVICE_NAME="${SERVICE_NAME:-course-pms}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-course-pms-migrate}"
SA_NAME="${SA_NAME:-course-pms-runner}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
MIGRATE_SA_NAME="${MIGRATE_SA_NAME:-course-pms-migrator}"
MIGRATE_SA_EMAIL="${MIGRATE_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

SECRET_DB_URL="${SECRET_DB_URL:-course-pms-database-url}"
SECRET_JWT="${SECRET_JWT:-course-pms-jwt-secret}"
SECRET_DEMO_PASS="${SECRET_DEMO_PASS:-course-pms-demo-password}"

echo "=================================================================="
echo "WARNING: This will permanently delete CoursePMS resources in:"
echo "  Project : ${PROJECT_ID}"
echo "  Region  : ${REGION}"
echo "Resources to be deleted:"
echo "  - Cloud Run Service : ${SERVICE_NAME}"
echo "  - Cloud Run Job     : ${MIGRATE_JOB_NAME}"
echo "  - Cloud SQL Instance: ${SQL_INSTANCE} (ALL DATABASE DATA WILL BE LOST)"
echo "  - Artifact Registry : ${REPO_NAME}"
echo "  - Secrets           : ${SECRET_DB_URL}, ${SECRET_JWT}, ${SECRET_DEMO_PASS}"
echo "  - Service Accounts  : ${SA_EMAIL}, ${MIGRATE_SA_EMAIL}"
echo "=================================================================="

# ------------------------------------------------------------------------------
# Safety confirmation (skipped only in DRY_RUN)
# ------------------------------------------------------------------------------
if [ "$DRY_RUN" != "1" ]; then
  read -r -p "Type the project ID (${PROJECT_ID}) to confirm deletion: " CONFIRM_PROJECT
  if [ "$CONFIRM_PROJECT" != "$PROJECT_ID" ]; then
    echo "Aborted: confirmation did not match ${PROJECT_ID}."
    exit 1
  fi
fi

# ------------------------------------------------------------------------------
# Delete resources (skips genuinely absent resources; fails on permission/API errors)
# ------------------------------------------------------------------------------
delete_if_exists "Cloud Run service ${SERVICE_NAME}" \
  gcloud run services delete "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --quiet
delete_if_exists "Cloud Run job ${MIGRATE_JOB_NAME}" \
  gcloud run jobs delete "$MIGRATE_JOB_NAME" --region "$REGION" --project "$PROJECT_ID" --quiet
delete_if_exists "Cloud SQL instance ${SQL_INSTANCE}" \
  gcloud sql instances delete "$SQL_INSTANCE" --project "$PROJECT_ID" --quiet
delete_if_exists "Artifact Registry repository ${REPO_NAME}" \
  gcloud artifacts repositories delete "$REPO_NAME" --location "$REGION" --project "$PROJECT_ID" --quiet
delete_if_exists "Secret ${SECRET_DB_URL}" \
  gcloud secrets delete "$SECRET_DB_URL" --project "$PROJECT_ID" --quiet
delete_if_exists "Secret ${SECRET_JWT}" \
  gcloud secrets delete "$SECRET_JWT" --project "$PROJECT_ID" --quiet
delete_if_exists "Secret ${SECRET_DEMO_PASS}" \
  gcloud secrets delete "$SECRET_DEMO_PASS" --project "$PROJECT_ID" --quiet
delete_if_exists "Service account ${SA_EMAIL}" \
  gcloud iam service-accounts delete "$SA_EMAIL" --project "$PROJECT_ID" --quiet
delete_if_exists "Service account ${MIGRATE_SA_EMAIL}" \
  gcloud iam service-accounts delete "$MIGRATE_SA_EMAIL" --project "$PROJECT_ID" --quiet

echo "Teardown completed."
