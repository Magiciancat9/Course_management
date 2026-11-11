#!/usr/bin/env bash
# ==============================================================================
# Offline test for deploy/teardown.sh (fake `gcloud`, no GCP access, no cost)
# ==============================================================================
# WHAT THIS TEST CHECKS
#   1. explicit REGION required (fails before any gcloud call)
#   2. DRY_RUN=1 prints commands and makes no gcloud calls
#   3. confirmation mismatch aborts before any gcloud call
#   4. normal teardown deletes all CoursePMS resources and prints completion
#   5. genuinely absent resources (NOT_FOUND / 404) are skipped cleanly
#   6. permission/API failures exit non-zero and do NOT print "Teardown completed."
# HOW TO RUN (repo root, needs bash):  bash deploy/tests/test_teardown_stub.sh
# ==============================================================================
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TASK_TMP="$(mktemp -d)"
trap 'rm -rf "$TASK_TMP"' EXIT

export PROJECT_ID="teardown-test"
export CALL_LOG="$TASK_TMP/calls"
export PATH="$TASK_TMP:$PATH"

cat > "$TASK_TMP/gcloud" <<'STUB'
#!/usr/bin/env bash
echo "$*" >> "$CALL_LOG"
case "${TEARDOWN_MODE:-normal}" in
  not-found)
    echo "ERROR: (gcloud) NOT_FOUND: The requested resource was not found." >&2
    exit 1
    ;;
  perm-fail-sql)
    if [[ "$*" == "sql instances delete "* ]]; then
      echo "ERROR: (gcloud.sql.instances.delete) PERMISSION_DENIED: The caller does not have permission." >&2
      exit 1
    fi
    ;;
  api-fail-secret)
    if [[ "$*" == "secrets delete course-pms-jwt-secret "* ]]; then
      echo "ERROR: (gcloud.secrets.delete) INTERNAL: Backend API error 500." >&2
      exit 1
    fi
    ;;
  ambig-perm-not-found)
    if [[ "$*" == "run services delete "* ]]; then
      echo "ERROR: (gcloud.run.services.delete) Resource 'course-pms' was not found or you do not have permission to access it." >&2
      exit 1
    fi
    ;;
esac
STUB
chmod +x "$TASK_TMP/gcloud"

# 1. Explicit REGION required
: > "$CALL_LOG"
if REGION="" bash "$ROOT/deploy/teardown.sh" >/dev/null 2>&1; then
  echo "Expected missing REGION failure" >&2
  exit 1
fi
test ! -s "$CALL_LOG"
echo "PASS explicit REGION required (fails fast without gcloud calls)"

# 2. DRY_RUN=1 makes no gcloud calls
: > "$CALL_LOG"
DRY_OUT="$(DRY_RUN=1 REGION=asia-southeast1 bash "$ROOT/deploy/teardown.sh")"
test ! -s "$CALL_LOG"
printf '%s\n' "$DRY_OUT" | grep -q '\[DRY_RUN\] gcloud run services delete course-pms'
printf '%s\n' "$DRY_OUT" | grep -q 'Teardown completed.'
echo "PASS dry run prints commands and makes no gcloud calls"

# 3. Confirmation mismatch aborts before any gcloud call
: > "$CALL_LOG"
if printf 'wrong-project\n' | REGION=asia-southeast1 bash "$ROOT/deploy/teardown.sh" >"$TASK_TMP/out" 2>&1; then
  echo "Expected confirmation mismatch failure" >&2
  exit 1
fi
test ! -s "$CALL_LOG"
if grep -q 'Teardown completed.' "$TASK_TMP/out"; then
  echo "Printed completion on confirmation mismatch" >&2
  exit 1
fi
echo "PASS confirmation mismatch aborts before GCP calls"

# 4. Normal teardown deletes all resources
: > "$CALL_LOG"
printf 'teardown-test\n' | TEARDOWN_MODE=normal REGION=asia-southeast1 bash "$ROOT/deploy/teardown.sh" >"$TASK_TMP/out" 2>&1
grep -q 'run services delete course-pms' "$CALL_LOG"
grep -q 'run jobs delete course-pms-migrate' "$CALL_LOG"
grep -q 'sql instances delete course-pms-pg' "$CALL_LOG"
grep -q 'artifacts repositories delete course-pms' "$CALL_LOG"
grep -q 'secrets delete course-pms-database-url' "$CALL_LOG"
grep -q 'secrets delete course-pms-jwt-secret' "$CALL_LOG"
grep -q 'secrets delete course-pms-demo-password' "$CALL_LOG"
grep -q 'iam service-accounts delete course-pms-runner@teardown-test.iam.gserviceaccount.com' "$CALL_LOG"
grep -q 'iam service-accounts delete course-pms-migrator@teardown-test.iam.gserviceaccount.com' "$CALL_LOG"
grep -q 'Teardown completed.' "$TASK_TMP/out"
echo "PASS normal teardown deletes all resources"

# 5. Genuinely absent resources (NOT_FOUND) are skipped cleanly
: > "$CALL_LOG"
printf 'teardown-test\n' | TEARDOWN_MODE=not-found REGION=asia-southeast1 bash "$ROOT/deploy/teardown.sh" >"$TASK_TMP/out" 2>&1
grep -q 'already absent; skipping' "$TASK_TMP/out"
grep -q 'Teardown completed.' "$TASK_TMP/out"
echo "PASS absent resources (NOT_FOUND) are skipped cleanly"

# 6. Permission, ambiguous not-found/permission, and API failures abort and never print "Teardown completed."
for mode in perm-fail-sql api-fail-secret ambig-perm-not-found; do
  : > "$CALL_LOG"
  if printf 'teardown-test\n' | TEARDOWN_MODE="$mode" REGION=asia-southeast1 bash "$ROOT/deploy/teardown.sh" >"$TASK_TMP/out" 2>&1; then
    echo "Expected teardown failure for mode $mode" >&2
    exit 1
  fi
  grep -q 'Error: Failed to delete' "$TASK_TMP/out"
  if grep -q 'Teardown completed.' "$TASK_TMP/out"; then
    echo "Printed Teardown completed despite $mode failure" >&2
    exit 1
  fi
  echo "PASS $mode failure exits non-zero without claiming completion"
done
