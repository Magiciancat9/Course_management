#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# CoursePMS — Idempotent Google Cloud Run Provisioning & First Deployment Script
# ==============================================================================
# Usage:
#   ./deploy/deploy.sh [--demo]
#
# Environment Variables (Optional):
#   PROJECT_ID   GCP Project ID (defaults to active gcloud config project)
#   REGION       GCP Region (default: asia-southeast1)
#   DRY_RUN      Set DRY_RUN=1 to print all gcloud commands without executing
#
# WHAT THIS SCRIPT DOES (human-reviewed initial setup; idempotent on re-run):
#   1. Enable required GCP APIs
#   2. Create Artifact Registry Docker repository (course-pms)
#   3. Create Cloud SQL for PostgreSQL 16 instance (course-pms-pg, db-f1-micro)
#   4. Create PostgreSQL database (course_pms)
#   5. Create dedicated runtime service account (course-pms-runner) + cloudsql.client
#   6. Create DB user (coursepms) & store DATABASE_URL in Secret Manager
#   7. Create JWT_SECRET in Secret Manager
#   8. Optionally create DEMO_USER_PASSWORD in Secret Manager when --demo is passed
#      and grant per-secret secretAccessor bindings (never project-wide)
#   9. Build & push unified CoursePMS image via Cloud Build
#  10. Deploy & execute Cloud Run migration job (course-pms-migrate) BEFORE
#      updating the service; abort if migration/seed fails
#  11. Deploy public Cloud Run service (course-pms) on port 8080 with min-instances=0
# ==============================================================================

DRY_RUN="${DRY_RUN:-0}"
REGION="${REGION:-asia-southeast1}"
SEED_DEMO_DATA="false"

for arg in "$@"; do
  case "$arg" in
    --demo)
      SEED_DEMO_DATA="true"
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: $0 [--demo]" >&2
      exit 1
      ;;
  esac
done

run_cmd() {
  local arg
  if [ "$DRY_RUN" = "1" ]; then
    printf '[DRY_RUN] '
  else
    printf '+ '
  fi
  for arg in "$@"; do
    case "$arg" in
      --password=*) printf '%s ' '--password=<REDACTED>' ;;
      *) printf '%q ' "$arg" ;;
    esac
  done
  printf '\n'
  if [ "$DRY_RUN" != "1" ]; then
    "$@"
  fi
}

if [ "$DRY_RUN" = "1" ]; then
  PROJECT_ID="${PROJECT_ID:-example-gcp-project}"
else
  PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
  if [ -z "$PROJECT_ID" ]; then
    echo "Error: PROJECT_ID is not set and no active gcloud project was found." >&2
    echo "Run: gcloud config set project YOUR_PROJECT_ID" >&2
    exit 1
  fi
fi

# ------------------------------------------------------------------------------
# CoursePMS resource names (override via environment variables if needed)
# ------------------------------------------------------------------------------
REPO_NAME="${REPO_NAME:-course-pms}"
SQL_INSTANCE="${SQL_INSTANCE:-course-pms-pg}"
DB_NAME="${DB_NAME:-course_pms}"
DB_USER="${DB_USER:-coursepms}"
SERVICE_NAME="${SERVICE_NAME:-course-pms}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-course-pms-migrate}"
SA_NAME="${SA_NAME:-course-pms-runner}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SQL_CONN_NAME="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

# Secret Manager secret names (values are never stored in Git or printed)
SECRET_DB_URL="${SECRET_DB_URL:-course-pms-database-url}"
SECRET_JWT="${SECRET_JWT:-course-pms-jwt-secret}"
SECRET_DEMO_PASS="${SECRET_DEMO_PASS:-course-pms-demo-password}"

echo "=================================================================="
echo "CoursePMS Cloud Run Provisioning & Deployment"
echo "Project : ${PROJECT_ID}"
echo "Region  : ${REGION}"
echo "Demo    : ${SEED_DEMO_DATA}"
echo "Dry Run : ${DRY_RUN}"
echo "=================================================================="

# ==============================================================================
# 1. Enable required GCP APIs
# ==============================================================================
run_cmd gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  --project "$PROJECT_ID"

# ==============================================================================
# 2. Create Artifact Registry repository (idempotent)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud artifacts repositories describe "$REPO_NAME" --location "$REGION" --project "$PROJECT_ID"
  run_cmd gcloud artifacts repositories create "$REPO_NAME" --repository-format=docker --location "$REGION" --description="CoursePMS container repository" --project "$PROJECT_ID"
else
  if ! gcloud artifacts repositories describe "$REPO_NAME" --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud artifacts repositories create "$REPO_NAME" \
      --repository-format=docker \
      --location "$REGION" \
      --description="CoursePMS container repository" \
      --project "$PROJECT_ID"
  fi
fi

# ==============================================================================
# 3. Create Cloud SQL for PostgreSQL 16 instance (idempotent, db-f1-micro)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud sql instances describe "$SQL_INSTANCE" --project "$PROJECT_ID"
  run_cmd gcloud sql instances create "$SQL_INSTANCE" --database-version=POSTGRES_16 --edition=enterprise --tier=db-f1-micro --region="$REGION" --storage-size=10GB --storage-type=SSD --backup-start-time=03:00 --project "$PROJECT_ID"
else
  if ! gcloud sql instances describe "$SQL_INSTANCE" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud sql instances create "$SQL_INSTANCE" \
      --database-version=POSTGRES_16 \
      --edition=enterprise \
      --tier=db-f1-micro \
      --region="$REGION" \
      --storage-size=10GB \
      --storage-type=SSD \
      --backup-start-time=03:00 \
      --project "$PROJECT_ID"
  fi
fi

# ==============================================================================
# 4. Create Database (idempotent)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud sql databases describe "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID"
  run_cmd gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID"
else
  if ! gcloud sql databases describe "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE" --project "$PROJECT_ID"
  fi
fi

# ==============================================================================
# 5. Create Dedicated Runtime Service Account & Cloud SQL Client role
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT_ID"
  run_cmd gcloud iam service-accounts create "$SA_NAME" --display-name="CoursePMS Cloud Run Service Account" --project "$PROJECT_ID"
else
  if ! gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud iam service-accounts create "$SA_NAME" \
      --display-name="CoursePMS Cloud Run Service Account" \
      --project "$PROJECT_ID"
  fi
fi

run_cmd gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudsql.client" \
  --condition=None \
  --quiet

# ==============================================================================
# 6. Create DB User & Store DATABASE_URL in Secret Manager (idempotent)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud secrets describe "$SECRET_DB_URL" --project "$PROJECT_ID"
  run_cmd gcloud sql users list --instance="$SQL_INSTANCE" --project "$PROJECT_ID" --format="value(name)"
  run_cmd gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="<GENERATED_HEX_PASSWORD>" --project "$PROJECT_ID"
  run_cmd gcloud secrets create "$SECRET_DB_URL" --replication-policy="automatic" --project "$PROJECT_ID"
  run_cmd gcloud secrets versions add "$SECRET_DB_URL" --data-file=- --project "$PROJECT_ID"
else
  if ! gcloud secrets describe "$SECRET_DB_URL" --project "$PROJECT_ID" >/dev/null 2>&1; then
    DB_PASS="$(openssl rand -hex 24)"
    if gcloud sql users list --instance="$SQL_INSTANCE" --project "$PROJECT_ID" --format="value(name)" | grep -qx "$DB_USER"; then
      run_cmd gcloud sql users set-password "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASS" --project "$PROJECT_ID"
    else
      run_cmd gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASS" --project "$PROJECT_ID"
    fi
    DB_URL_VALUE="postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/cloudsql/${SQL_CONN_NAME}&schema=public&connection_limit=3"
    run_cmd gcloud secrets create "$SECRET_DB_URL" --replication-policy="automatic" --project "$PROJECT_ID"
    printf "%s" "$DB_URL_VALUE" | gcloud secrets versions add "$SECRET_DB_URL" --data-file=- --project "$PROJECT_ID"
  fi
fi

# ==============================================================================
# 7. Create JWT_SECRET in Secret Manager (idempotent)
# ==============================================================================
if [ "$DRY_RUN" = "1" ]; then
  run_cmd gcloud secrets describe "$SECRET_JWT" --project "$PROJECT_ID"
  run_cmd gcloud secrets create "$SECRET_JWT" --replication-policy="automatic" --project "$PROJECT_ID"
  run_cmd gcloud secrets versions add "$SECRET_JWT" --data-file=- --project "$PROJECT_ID"
else
  if ! gcloud secrets describe "$SECRET_JWT" --project "$PROJECT_ID" >/dev/null 2>&1; then
    GENERATED_JWT_SECRET="$(openssl rand -hex 32)"
    run_cmd gcloud secrets create "$SECRET_JWT" --replication-policy="automatic" --project "$PROJECT_ID"
    printf "%s" "$GENERATED_JWT_SECRET" | gcloud secrets versions add "$SECRET_JWT" --data-file=- --project "$PROJECT_ID"
  fi
fi

# ==============================================================================
# 8. Optional DEMO_USER_PASSWORD in Secret Manager when --demo is passed
#    Attached ONLY to the migration/seed job, never to the public web service.
# ==============================================================================
JOB_SECRETS="DATABASE_URL=${SECRET_DB_URL}:latest"
JOB_CMD="npm --prefix server run prisma:migrate:deploy"
if [ "$SEED_DEMO_DATA" = "true" ]; then
  if [ "$DRY_RUN" = "1" ]; then
    run_cmd gcloud secrets describe "$SECRET_DEMO_PASS" --project "$PROJECT_ID"
    run_cmd gcloud secrets create "$SECRET_DEMO_PASS" --replication-policy="automatic" --project "$PROJECT_ID"
    run_cmd gcloud secrets versions add "$SECRET_DEMO_PASS" --data-file=- --project "$PROJECT_ID"
  else
    if ! gcloud secrets describe "$SECRET_DEMO_PASS" --project "$PROJECT_ID" >/dev/null 2>&1; then
      GENERATED_DEMO_PASSWORD="$(openssl rand -base64 16 | tr -d '/+=' | cut -c1-14)Dd1!"
      run_cmd gcloud secrets create "$SECRET_DEMO_PASS" --replication-policy="automatic" --project "$PROJECT_ID"
      printf "%s" "$GENERATED_DEMO_PASSWORD" | gcloud secrets versions add "$SECRET_DEMO_PASS" --data-file=- --project "$PROJECT_ID"
    fi
  fi
  JOB_SECRETS="${JOB_SECRETS},DEMO_USER_PASSWORD=${SECRET_DEMO_PASS}:latest"
  JOB_CMD="npm --prefix server run prisma:migrate:deploy && npm --prefix server run prisma:seed"
fi

# Grant secretAccessor per-secret (never project-wide)
RUNTIME_SECRETS=("$SECRET_DB_URL" "$SECRET_JWT")
if [ "$SEED_DEMO_DATA" = "true" ]; then
  RUNTIME_SECRETS+=("$SECRET_DEMO_PASS")
fi
for secret in "${RUNTIME_SECRETS[@]}"; do
  run_cmd gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --project "$PROJECT_ID" --quiet
done

# ==============================================================================
# 9. Build & Push Unified Container Image via Cloud Build
# ==============================================================================
run_cmd gcloud builds submit \
  --tag "$IMAGE_URI" \
  --project "$PROJECT_ID"

# ==============================================================================
# 10. Create/Update & Execute Cloud Run Job for Additive Migration (+ Optional Seed)
# ==============================================================================
run_cmd gcloud run jobs deploy "$MIGRATE_JOB_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --set-cloudsql-instances "$SQL_CONN_NAME" \
  --set-secrets "$JOB_SECRETS" \
  --set-env-vars "NODE_ENV=production,TZ=Asia/Bangkok" \
  --command "sh" \
  --args "-c,${JOB_CMD}" \
  --max-retries 1 \
  --task-timeout 300s \
  --project "$PROJECT_ID"

if ! run_cmd gcloud run jobs execute "$MIGRATE_JOB_NAME" \
  --region "$REGION" \
  --wait \
  --project "$PROJECT_ID"; then
  printf '%s\n' "ERROR: Cloud Run migration job '${MIGRATE_JOB_NAME}' failed. Aborting service deployment." >&2
  printf '%s\n' "View job logs with:" >&2
  printf '%s\n' "  gcloud logging read \"resource.type=cloud_run_job AND resource.labels.job_name=${MIGRATE_JOB_NAME}\" --project \"${PROJECT_ID}\" --limit 50 --format=\"value(textPayload)\"" >&2
  exit 1
fi

# ==============================================================================
# 11. Deploy Public Cloud Run Service (port 8080, min-instances 0)
# ==============================================================================
run_cmd gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --service-account "$SA_EMAIL" \
  --add-cloudsql-instances "$SQL_CONN_NAME" \
  --set-secrets "DATABASE_URL=${SECRET_DB_URL}:latest,JWT_SECRET=${SECRET_JWT}:latest" \
  --set-env-vars "NODE_ENV=production,TZ=Asia/Bangkok" \
  --min-instances 0 \
  --max-instances 3 \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --project "$PROJECT_ID"

if [ "$DRY_RUN" = "1" ]; then
  SERVICE_URL="https://${SERVICE_NAME}-<hash>-as.a.run.app"
else
  SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')"
fi

printf '\n'
printf '%s\n' "=================================================================="
printf '%s\n' "CoursePMS Deployment Completed!"
printf '%s\n' "Service URL    : ${SERVICE_URL}"
printf '%s\n' "Health Check   : ${SERVICE_URL}/api/health"
printf '%s\n' "Readiness Check: ${SERVICE_URL}/api/ready"
printf '%s\n' "JWT Secret     : Stored in Secret Manager: ${SECRET_JWT} (not printed)."
if [ "$SEED_DEMO_DATA" = "true" ]; then
  printf '%s\n' "Demo Accounts  : instructor@kmutt.ac.th, pawarit@mail.kmutt.ac.th, tatchakorn@mail.kmutt.ac.th"
  printf '%s\n' "Demo Password  : Stored in Secret Manager: ${SECRET_DEMO_PASS} (not printed)."
fi
printf '%s\n' "=================================================================="
