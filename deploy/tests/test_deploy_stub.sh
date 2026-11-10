#!/usr/bin/env bash
# Offline regression checks for CoursePMS deploy/deploy.sh:
# Every gcloud and openssl call is a local stub; no real GCP calls or costs.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="${SCRIPT_DIR}/../deploy.sh"
export TEST_STATE_DIR
TEST_STATE_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_STATE_DIR"' EXIT
mkdir -p "$TEST_STATE_DIR/bin"

cat > "$TEST_STATE_DIR/bin/openssl" <<'STUB'
#!/usr/bin/env bash
if [ "$2" = "-hex" ]; then
  printf '%s\n' '0123456789abcdef0123456789abcdef0123456789abcdef'
else
  printf '%s\n' 'TESTONLYGENERATEDPASSWORD'
fi
STUB

cat > "$TEST_STATE_DIR/bin/gcloud" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
redacted=()
for arg in "$@"; do
  case "$arg" in
    --password=*)
      printf '%s' "${arg#--password=}" > "$TEST_STATE_DIR/sql-pass"
      redacted+=("--password=<REDACTED>") ;;
    *) redacted+=("$arg") ;;
  esac
done
printf '%s\n' "${redacted[*]}" >> "$GCLOUD_LOG"
if [ "${1:-} ${2:-}" = 'config get-value' ]; then
  echo stub-gcp-project
  exit 0
fi
if [ "${1:-} ${2:-}" = 'projects add-iam-policy-binding' ] && [ "$STUB_MODE" = iam-fail ]; then
  exit 1
fi
if [ "${1:-} ${2:-} ${3:-}" = 'run services describe' ]; then
  echo https://course-pms-stub.example.invalid
  exit 0
fi
if [ "${1:-} ${2:-} ${3:-}" = 'run jobs execute' ]; then
  [ "$STUB_MODE" != job-fail ]
  exit $?
fi
if [ "${1:-} ${2:-} ${3:-}" = 'secrets versions add' ]; then
  cat > "$TEST_STATE_DIR/payload-${4}"
  exit 0
fi
if [ "${1:-} ${2:-} ${3:-}" = 'sql users list' ]; then
  if [ "$STUB_MODE" = first_run ]; then
    echo postgres
  else
    printf 'postgres\ncoursepms\n'
  fi
  exit 0
fi
for word in "$@"; do
  if [ "$word" = describe ]; then
    case "$STUB_MODE" in
      first_run|iam-fail) exit 1 ;;
      partial)
        if [ "${1:-} ${3:-}" = 'secrets course-pms-database-url' ]; then
          exit 1
        fi ;;
    esac
  fi
done
STUB
chmod +x "$TEST_STATE_DIR/bin/openssl" "$TEST_STATE_DIR/bin/gcloud" "$DEPLOY_SCRIPT"
export PATH="$TEST_STATE_DIR/bin:$PATH"
export PROJECT_ID=stub-gcp-project
export DRY_RUN=0

# --- Missing REGION must fail fast with zero gcloud calls ---------------------
export GCLOUD_LOG="$TEST_STATE_DIR/no-region-calls"
no_region_exit=0
env -u REGION bash "$DEPLOY_SCRIPT" > "$TEST_STATE_DIR/no-region-output" 2>&1 || no_region_exit=$?
if [ "$no_region_exit" -eq 0 ]; then
  echo 'FAIL: script succeeded without explicit REGION'; exit 1
fi
if [ -f "$GCLOUD_LOG" ]; then
  echo 'FAIL: missing REGION called gcloud'; exit 1
fi
echo 'PASS: explicit REGION required (fails fast without gcloud calls)'

export REGION=stub-confirmed-region

for MODE in first_run rerun partial job-fail iam-fail demo; do
  export STUB_MODE="$MODE"
  [ "$MODE" != demo ] || export STUB_MODE=first_run
  export GCLOUD_LOG="$TEST_STATE_DIR/gcloud-$MODE.log"
  rm -f "$TEST_STATE_DIR/sql-pass" "$TEST_STATE_DIR"/payload-*
  args=()
  if [ "$MODE" = demo ]; then args+=(--demo); fi
  result=0
  bash "$DEPLOY_SCRIPT" ${args[@]+"${args[@]}"} > "$TEST_STATE_DIR/output" 2>&1 || result=$?
  expected=0
  if [ "$MODE" = job-fail ] || [ "$MODE" = iam-fail ]; then expected=1; fi
  if [ "$result" -ne "$expected" ]; then
    echo "FAIL $MODE: unexpected exit $result (wanted $expected)"
    exit 1
  fi
  if [ "$MODE" = iam-fail ]; then
    if grep -Eq '^(sql instances create|artifacts repositories create|run deploy) ' "$GCLOUD_LOG"; then
      echo 'FAIL: billable resources created when IAM permissions are missing'; exit 1
    fi
    echo "PASS: $MODE (blocks billable resource creation when IAM fails)"
    continue
  fi
  if [ "$MODE" = job-fail ]; then
    if grep -q '^run deploy ' "$GCLOUD_LOG"; then
      echo 'FAIL: service deployed after migration failure'; exit 1
    fi
  else
    grep -q '^run deploy course-pms ' "$GCLOUD_LOG"
    grep -q '^run deploy course-pms .*--service-account course-pms-runner@stub-gcp-project.iam.gserviceaccount.com' "$GCLOUD_LOG"
    grep -q -- '--port 8080' "$GCLOUD_LOG"
    grep -q -- '--min-instances 0' "$GCLOUD_LOG"
    if grep '^run deploy ' "$GCLOUD_LOG" | grep -q 'DEMO_USER_PASSWORD'; then
      echo 'FAIL: DEMO_USER_PASSWORD leaked to public Cloud Run service'; exit 1
    fi
  fi
  grep -q '^run jobs deploy course-pms-migrate .*--service-account course-pms-migrator@stub-gcp-project.iam.gserviceaccount.com' "$GCLOUD_LOG"
  if grep -q '^projects add-iam-policy-binding .*roles/secretmanager.secretAccessor' "$GCLOUD_LOG"; then
    echo 'FAIL: runtime has project-wide secret access'; exit 1
  fi
  # Public service identity: only DB URL and JWT secret, never DEMO_USER_PASSWORD
  for secret in course-pms-database-url course-pms-jwt-secret; do
    grep -q "^secrets add-iam-policy-binding $secret --member=serviceAccount:course-pms-runner@stub-gcp-project.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor" "$GCLOUD_LOG"
  done
  if grep -q '^secrets add-iam-policy-binding course-pms-demo-password --member=serviceAccount:course-pms-runner@' "$GCLOUD_LOG"; then
    echo 'FAIL: public service account granted access to demo-password secret'; exit 1
  fi
  # Migration job identity: DB URL (+ DEMO_USER_PASSWORD only in demo mode), never JWT secret
  grep -q '^secrets add-iam-policy-binding course-pms-database-url --member=serviceAccount:course-pms-migrator@stub-gcp-project.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor' "$GCLOUD_LOG"
  if grep -q '^secrets add-iam-policy-binding course-pms-jwt-secret --member=serviceAccount:course-pms-migrator@' "$GCLOUD_LOG"; then
    echo 'FAIL: migration service account granted access to JWT secret'; exit 1
  fi
  if [ "$MODE" = demo ]; then
    grep -q '^secrets add-iam-policy-binding course-pms-demo-password --member=serviceAccount:course-pms-migrator@stub-gcp-project.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor' "$GCLOUD_LOG"
  elif grep -q '^secrets add-iam-policy-binding course-pms-demo-password ' "$GCLOUD_LOG"; then
    echo 'FAIL: granted optional demo secret in non-demo mode'; exit 1
  fi
  case "$MODE" in
    first_run)
      # Assert IAM binding runs on an earlier line than Cloud SQL instance creation
      iam_line="$(grep -n '^projects add-iam-policy-binding ' "$GCLOUD_LOG" | head -n 1 | cut -d: -f1)"
      sql_line="$(grep -n '^sql instances create ' "$GCLOUD_LOG" | head -n 1 | cut -d: -f1)"
      if [ "$iam_line" -ge "$sql_line" ]; then
        echo 'FAIL: IAM policy binding did not run before Cloud SQL creation'; exit 1
      fi
      grep -q -- '--edition=enterprise' "$GCLOUD_LOG"
      grep -q '^sql users create ' "$GCLOUD_LOG" ;;
    partial) grep -q '^sql users set-password ' "$GCLOUD_LOG" ;;
    rerun)
      if grep -Eq '^(secrets create|sql users (create|set-password)) ' "$GCLOUD_LOG"; then
        echo 'FAIL: rerun replaced existing credentials'; exit 1
      fi ;;
  esac
  if [ -f "$TEST_STATE_DIR/sql-pass" ]; then
    db_pass="$(cat "$TEST_STATE_DIR/sql-pass")"
    db_url="$(cat "$TEST_STATE_DIR/payload-course-pms-database-url")"
    case "$db_url" in
      "postgresql://coursepms:${db_pass}@"*) ;;
      *) echo 'FAIL: DB password differs from secret'; exit 1 ;;
    esac
    if grep -Fq "$db_pass" "$TEST_STATE_DIR/output"; then
      echo 'FAIL: DB password leaked to output'; exit 1
    fi
  fi
  for secret_file in "$TEST_STATE_DIR"/payload-*; do
    [ -f "$secret_file" ] || continue
    secret_value="$(cat "$secret_file")"
    if [ -n "$secret_value" ] && grep -Fq "$secret_value" "$TEST_STATE_DIR/output"; then
      echo 'FAIL: secret payload leaked to output'; exit 1
    fi
  done
  echo "PASS: $MODE (exit, separate SAs, migration gate, credential handling, secret redaction)"
done

export GCLOUD_LOG="$TEST_STATE_DIR/dry-run-calls"
DRY_RUN=1 REGION=stub-confirmed-region bash "$DEPLOY_SCRIPT" --demo > "$TEST_STATE_DIR/dry-run-output"
if [ -f "$GCLOUD_LOG" ]; then
  echo 'FAIL: dry run called gcloud'; exit 1
fi
echo 'PASS: dry run makes no gcloud calls'
