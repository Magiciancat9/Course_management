#!/usr/bin/env bash
# ==============================================================================
# Offline test for deploy/release.sh (fake `gcloud`, no GCP access, no cost)
# ==============================================================================
# WHAT THIS TEST CHECKS
#   1. normal release : image resolved to @sha256 digest, existing `--demo`
#                       migration job explicitly overwritten to run migration
#                       ONLY (`prisma:migrate:deploy`, no `prisma:seed`, no
#                       `DEMO_USER_PASSWORD`), migration awaited (`--wait`),
#                       service updated with APP_COMMIT_SHA, SERVICE_URL exported
#   2. rollback       : service updated, migration job NOT touched
#   3. image missing / migration fails : service is NOT updated
#   4. invalid tag    : rejected before any gcloud call
# HOW TO RUN (repo root, needs bash):  bash deploy/tests/test_release_stub.sh
# ==============================================================================
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TASK_TMP="$(mktemp -d)"
trap 'rm -rf "$TASK_TMP"' EXIT
export PROJECT_ID=release-test REGION=asia-southeast1
export IMAGE_TAG=1111111111111111111111111111111111111111
export CALL_LOG="$TASK_TMP/calls" GITHUB_ENV="$TASK_TMP/env" JOB_STATE="$TASK_TMP/job_state"
export PATH="$TASK_TMP:$PATH"

# Simulate an existing Cloud Run job initially created by `deploy/deploy.sh --demo`
cat > "$JOB_STATE" <<'EOF'
ARGS=-c,npm --prefix server run prisma:migrate:deploy && npm --prefix server run prisma:seed
SECRETS=DATABASE_URL=course-pms-database-url:latest,DEMO_USER_PASSWORD=course-pms-demo-password:latest
EOF

cat > "$TASK_TMP/gcloud" <<'STUB'
#!/usr/bin/env bash
echo "$*" >> "$CALL_LOG"
case "$*" in
  'artifacts docker images describe '*)
    [[ "${FAIL_AT:-}" != image ]] || exit 1
    echo 'asia-southeast1-docker.pkg.dev/release-test/course-pms/course-pms@sha256:abcdef' ;;
  'run jobs update '*)
    for arg in "$@"; do
      case "$arg" in
        --args=*) sed -i.bak "s|^ARGS=.*|ARGS=${arg#--args=}|" "$JOB_STATE" ;;
        --set-secrets=*) sed -i.bak "s|^SECRETS=.*|SECRETS=${arg#--set-secrets=}|" "$JOB_STATE" ;;
      esac
    done ;;
  'run jobs execute '*)
    [[ "${FAIL_AT:-}" != migration ]] || exit 1
    if grep -q 'prisma:seed' "$JOB_STATE" || grep -q 'DEMO_USER_PASSWORD' "$JOB_STATE"; then
      echo 'ERROR: Existing --demo seed configuration was not cleared before executing migration job!' >&2
      exit 1
    fi ;;
  'run services describe '*) echo 'https://course-pms.example.test' ;;
esac
STUB
chmod +x "$TASK_TMP/gcloud"
export ROLLBACK=false
bash "$ROOT/deploy/release.sh"
grep -q 'run jobs update course-pms-migrate .*--command=sh --args=-c,npm --prefix server run prisma:migrate:deploy --set-secrets=DATABASE_URL=course-pms-database-url:latest' "$CALL_LOG"
grep -qx 'ARGS=-c,npm --prefix server run prisma:migrate:deploy' "$JOB_STATE"
grep -qx 'SECRETS=DATABASE_URL=course-pms-database-url:latest' "$JOB_STATE"
grep -q 'run jobs execute .*--wait' "$CALL_LOG"
grep -q 'run services update .*@sha256:abcdef' "$CALL_LOG"
grep -q 'APP_COMMIT_SHA=1111111111111111111111111111111111111111' "$CALL_LOG"
grep -q 'SERVICE_URL=https://course-pms.example.test' "$GITHUB_ENV"
echo 'PASS normal release overwrites --demo job to migration-only, uses digest, and waits for migration'

: > "$CALL_LOG"
export ROLLBACK=true
bash "$ROOT/deploy/release.sh"
if grep -q 'run jobs' "$CALL_LOG"; then echo 'Rollback ran migration' >&2; exit 1; fi
grep -q 'run services update ' "$CALL_LOG"
echo 'PASS rollback reuses image without touching migration job'

for failure in image migration; do
  : > "$CALL_LOG"
  if ROLLBACK=false FAIL_AT="$failure" bash "$ROOT/deploy/release.sh"; then
    echo "Expected $failure failure" >&2; exit 1
  fi
  if grep -q 'run services update' "$CALL_LOG"; then
    echo "Service changed after $failure failure" >&2; exit 1
  fi
  echo "PASS $failure failure blocks service update"
done

: > "$CALL_LOG"
if IMAGE_TAG='invalid;tag' bash "$ROOT/deploy/release.sh"; then exit 1; fi
test ! -s "$CALL_LOG"
echo 'PASS invalid tag rejected before GCP calls'
