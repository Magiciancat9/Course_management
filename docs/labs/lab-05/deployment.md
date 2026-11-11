# CoursePMS Lab 5 Deployment Notes

This document records the CoursePMS cloud-readiness contract, provisioned GCP resource inventory, automated CI/CD release pipeline, and rollback procedures. It does not store any secret values or credentials.

## Application and deployment shape

- **Application:** CoursePMS from the accepted Sprint 1 release.
- **Runtime:** Node.js 20; React/Vite static build served by the Express API in production.
- **Database:** PostgreSQL through Prisma. Teams, proposals, users, milestones, submissions, and revoked JWT identifiers are persisted in the database; no application uploads or other user data are stored on the container filesystem.
- **Local persistence:** Docker Compose stores PostgreSQL data in the named `pgdata` volume. Do not remove the volume if local data must be retained.
- **GCP target:** Cloud Run (`course-pms` service + `course-pms-migrate` job), Cloud SQL for PostgreSQL 16 (`course-pms-pg`), Artifact Registry (`course-pms`), and Secret Manager, following the Lab 5 reference architecture.
- **GCP project:** `CPE334 Kingnine` (`cpe334-kingnine`, number `859617270560`). Martin Wongdaeng (`martinvadre`) is the project owner/creator; Tatchakorn Thamnimitr (`Magiciancat9`) is the project Editor.
- **Confirmed region:** `asia-southeast1`.
- **Live public URL:** `https://course-pms-859617270560.asia-southeast1.run.app` (also reachable via `https://course-pms-jjbynk5xja-as.a.run.app`).

The application serves its built frontend and API from the same origin when `NODE_ENV=production`. The client uses relative API paths; Vite's `localhost:3000` proxy is for local development only.

## Environment variables

The committed `.env.example` files contain placeholders only. Copy them locally and replace placeholders in ignored `.env` files; never commit a real `.env`, connection string, password, or key.

| Variable | Purpose | Secret? | Source |
|---|---|---|---|
| `PORT` | HTTP port. The server defaults to `3000`; Cloud Run supplies the runtime port (`8080`). | No | Local `.env`; Cloud Run runtime environment |
| `NODE_ENV` | Selects development/test behavior or production static-file and seed behavior. | No | Local `.env`; set to `production` for Cloud Run |
| `APP_COMMIT_SHA` | Full 40-character Git commit SHA of the running release, returned by `GET /api/health` (`commitSha`). Defaults to `local` in local development. | No | Set automatically at Docker build time (`--build-arg APP_COMMIT_SHA`) and Cloud Run update (`deploy/release.sh`) |
| `DATABASE_URL` | Prisma PostgreSQL connection string. | **Yes** | Local disposable PostgreSQL in ignored `.env`; production from Secret Manager, attached only to services/jobs that need database access |
| `CORS_ORIGIN` | Optional comma-separated browser origins accepted by the API. Same-origin production traffic normally does not require a separate client origin. | No | Local `.env`; set to the actual origin only if needed |
| `JWT_SECRET` | Signs and verifies authentication tokens. Production fails to start if missing or left at the example placeholder. | **Yes** | Generate a unique local value for development; production from Secret Manager |
| `DEMO_USER_PASSWORD` | Password used only when creating synthetic demo accounts with the Prisma seed. Production seeding requires it; existing users and data are preserved. | **Yes** | Local-only value in ignored `.env`; for a production seed job, inject from Secret Manager for that job only. Do not pass it to the public web service |
| `POSTGRES_PASSWORD` | Password for the local PostgreSQL service in Docker Compose. Not read by the application server. | **Yes** | Root ignored `.env` for local Compose only; use a different credential for Cloud SQL |
| `POSTGRES_PORT` | Optional host port override for the local Docker Compose PostgreSQL service (defaults to `5432`). | No | Local shell/`.env` override when host port `5432` is already in use |
| `APP_PORT` | Optional host port override for the local Docker Compose application service (defaults to `3000`, mapped to container port `8080`). | No | Local shell/`.env` override when host port `3000` is already in use |

Use unique, strong secrets. Never reuse a local demo password as a Cloud SQL password or JWT signing key. Do not print secret values in CI logs, deployment output, Issues, screenshots, or AI chats.

## Local setup and verification

Run these commands from the repository root in PowerShell. First copy `.env.example` to `.env` and `server/.env.example` to `server/.env`; replace all placeholders with local-only values. The native server's `DATABASE_URL` must point to a disposable local PostgreSQL database. The root `.env` supplies Compose interpolation.

```powershell
Copy-Item .env.example .env
Copy-Item server\.env.example server\.env
npm ci
npm --prefix server ci
npm --prefix client ci
npm run build
```

For local Docker Compose, ensure the root `.env` has URL-safe values for `POSTGRES_PASSWORD` and `JWT_SECRET`, then run:

```powershell
# PowerShell
docker build --no-cache -t course-pms:local .
docker compose up --build -d
docker compose ps
docker compose exec app npm --prefix server run prisma:migrate
docker compose exec -e DEMO_USER_PASSWORD="<local-demo-password>" app npm --prefix server run prisma:seed
Invoke-WebRequest http://localhost:3000/api/health
Invoke-WebRequest http://localhost:3000/api/ready
```

```bash
# macOS / Linux (bash / zsh)
cp .env.example .env
# Edit .env locally to set non-placeholder POSTGRES_PASSWORD and JWT_SECRET
docker build --no-cache -t course-pms:local .
docker compose up --build -d
docker compose ps
docker compose exec app npm --prefix server run prisma:migrate
docker compose exec -e DEMO_USER_PASSWORD="<local-demo-password>" app npm --prefix server run prisma:seed
curl -i http://localhost:3000/api/health
curl -i http://localhost:3000/api/ready
```

`/api/health` reports that the process is alive. `/api/ready` runs a database query and returns HTTP 200 with `{"status":"ready","db":"connected"}` only when PostgreSQL is reachable; otherwise it returns HTTP 503. Neither endpoint replaces the browser end-to-end business-flow check.

### Reproducible Docker build details (`C-03` / Issue #21)

- **Build context hygiene (`.dockerignore`):** Excludes `.git`, `.github`, `**/node_modules`, `**/dist`, `**/build`, `**/.env`, `**/.env.*`, `artifacts`, `docs`, `e2e`, `test-results`, `playwright-report`, `coverage`, and `server/tests` so local `.env` files, dependency caches, Git metadata, and test artifacts never enter the build context or production image.
- **Multi-stage `Dockerfile` (Node.js 20 Alpine):**
  - `client-build`: runs `npm ci` from committed `client/package-lock.json` and `npm run build` (`tsc && vite build`).
  - `server-build`: installs `openssl` for Prisma on Alpine, runs `npm ci` from committed `server/package-lock.json`, generates Prisma Client (`npx prisma generate`), and compiles TypeScript (`npm run build`).
  - `production`: installs `openssl`, sets `NODE_ENV=production` and `PORT=8080` (overridable by the platform `PORT` environment variable), and copies only `./server/package*.json`, `./server/tsconfig.json`, `./server/node_modules`, `./server/dist`, `./server/prisma`, and `./client/dist`.
- **External PostgreSQL (`docker-compose.yml`):** Keeps PostgreSQL 16 (`postgres:16-alpine`) in a separate `db` service with a `pg_isready` healthcheck and persistent named volume `pgdata`; `app` waits for `db` to report `service_healthy` and receives `DATABASE_URL` and `JWT_SECRET` via environment variables without hardcoded secrets.

### Schema and seed safety

For local disposable development/test databases, `npm --prefix server run prisma:migrate` invokes `prisma db push`:

```powershell
npm --prefix server run prisma:migrate
npm --prefix server run prisma:seed
```

For production and Cloud SQL, the repository includes a committed baseline Prisma migration (`server/prisma/migrations/20261110000000_init/migration.sql`) and the additive migration script `npm --prefix server run prisma:migrate:deploy` (`prisma migrate deploy`). The Cloud Run migration job (`course-pms-migrate`) runs `npm --prefix server run prisma:migrate:deploy` before the Cloud Run service is updated, and aborts the deployment if migration fails. Never run `prisma db push` against Cloud SQL or a database with data you need to keep.

In non-production modes the seed resets its target database and recreates the synthetic fixtures. **Never point non-production seeding at a developer database with wanted data or at Cloud SQL.** In production mode (`NODE_ENV=production`), `npm --prefix server run prisma:seed` requires `DEMO_USER_PASSWORD`, creates only missing demo users/course/teams/memberships/proposals, and does not delete or overwrite existing records. Existing account passwords are not changed by rerunning the production seed. `deploy/deploy.sh --demo` grants Secret Manager access for `course-pms-demo-password` **only** to the dedicated migration job service account (`course-pms-migrator`) and mounts `DEMO_USER_PASSWORD` only on the `course-pms-migrate` Cloud Run job, never on the public `course-pms` web service or its runtime service account (`course-pms-runner`).

Integration and Playwright tests can reset the database through the seed. Always set `DATABASE_URL` to a separate disposable test database before running them. Never run these tests against production or data you need to keep.

## Build, test, run

```powershell
# Production client and server builds
npm run build

# Backend integration tests (requires a separate disposable PostgreSQL database)
npm run test:server

# Frontend tests
npm run test:client

# All automated suites (backend, client, and Playwright; database is destructive)
npm test

# Native development servers
npm --prefix server run dev
npm --prefix client run dev
```

The repository's production image uses the root `Dockerfile` and `.dockerignore`; local Compose builds and runs the same image against the external `db` service (verified in Lab 5 Issue #21).

## Pull-request CI

`.github/workflows/ci-docker.yml` runs for every pull request targeting `lab5-staging` or `main`. Its stable required-check job name is **`test-and-docker`**. The workflow uses Node.js 20 and a temporary PostgreSQL 16 service with CI-only credentials, then installs from the three committed npm lockfiles and runs, in order:

1. `npm --prefix server run prisma:migrate` (the repository alias for Prisma `db push`) against the disposable CI database.
2. `npm run test:server` (backend integration and unit tests).
3. `npm run test:client` (frontend tests).
4. `npm run test:e2e` after installing Playwright Chromium.
5. `npm run build`.
6. `docker build --tag course-pms:ci .`.

Any failed command fails the required job. CI does not seed or deploy to a production database, does not run on `push`, and does not receive GCP credentials or production secrets. Database credentials and the JWT signing key in the workflow are throwaway test-only values. E2E seeding uses the repository's non-production fixture password; no demo password secret is supplied. The workflow file and a passing normal PR run are the evidence for C-01; the required-merge setting and deliberately failing PR for C-02 are tracked separately in Issue #25.

## GCP resource inventory

| Resource | Actual value / name | Status |
|---|---|---|
| Project | `cpe334-kingnine` / `859617270560` | Verified & active |
| Project owner | Martin Wongdaeng (`martinvadre`) | Verified in IAM (`roles/owner`) |
| Project Editor | Tatchakorn Thamnimitr (`Magiciancat9`) | Verified in IAM (`roles/editor`) |
| Region | `asia-southeast1` | Confirmed & provisioned (`REGION=asia-southeast1`) |
| Cloud Run service | `course-pms` (container port `8080`, `--min-instances 0`, `--max-instances 3`, initial revision `course-pms-00001-kqn`) | Provisioned & live (`https://course-pms-859617270560.asia-southeast1.run.app`) |
| Cloud Run migration job | `course-pms-migrate` (`prisma migrate deploy` + optional `--demo` seed) | Provisioned & executed (`course-pms-migrate-ztd7w` succeeded) |
| Cloud SQL instance / database / user | `course-pms-pg` (`POSTGRES_16`, `enterprise`, `db-f1-micro`, `10GB SSD`) / DB `course_pms` / user `coursepms` | Provisioned & connected (`/api/ready` HTTP 200) |
| Artifact Registry repository | `course-pms` (Docker format, `asia-southeast1-docker.pkg.dev/cpe334-kingnine/course-pms`) | Provisioned |
| Public service runtime SA | `course-pms-runner@cpe334-kingnine.iam.gserviceaccount.com` | Provisioned; accesses only `DATABASE_URL` and `JWT_SECRET` |
| Migration job runtime SA | `course-pms-migrator@cpe334-kingnine.iam.gserviceaccount.com` | Provisioned; accesses `DATABASE_URL` and (with `--demo`) `DEMO_USER_PASSWORD` |
| Secret Manager secret names | `course-pms-database-url`, `course-pms-jwt-secret`, `course-pms-demo-password` | Provisioned in Secret Manager; secret values are never recorded in Git |
| GitHub OIDC/WIF pool, provider, deploy service account | Configured via GitHub `demo` Environment variables `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` (`course-pms-deployer@cpe334-kingnine.iam.gserviceaccount.com`) | Keyless OIDC federation for `.github/workflows/deploy.yml` (no JSON key) |

## First GCP provisioning and deployment (`Lab5-05` / Issue #23)

### Environment and source-branch policy

- **Target environment:** Production (`NODE_ENV=production`) in the shared GCP project `cpe334-kingnine` (`859617270560`). CoursePMS uses one production Cloud Run service (`course-pms`) and one persistent Cloud SQL instance (`course-pms-pg`).
- **Allowed source branch/commit:** Per the Lab 5 release rule (*"Deploy only accepted changes merged into `main`"*), **all deployments—including the initial `Lab5-05` deployment—must be run from an accepted commit on `main`**, never from a feature branch or an unmerged `lab5-staging` branch.
  1. Merge reviewed task PRs (`#28`–`#32`) into `lab5-staging`.
  2. Open, review, and merge a release PR from `lab5-staging` into `main` (with `test-and-docker` passing).
  3. Check out the accepted `main` commit (`git checkout main && git pull`) before running `deploy/deploy.sh`.
- **Project Owner responsibility:** Because a GCP Project Editor may lack permission to modify project-level IAM policies (`resourcemanager.projects.setIamPolicy`), **the Project Owner (`martinvadre`) must execute the initial provisioning and IAM setup** (with `Magiciancat9` participating and verifying). `deploy/deploy.sh` creates the service accounts and applies project IAM bindings **before** creating Artifact Registry or the billable Cloud SQL instance, so any missing IAM permission fails fast before billable resources are created.

### 1. Human pre-deployment checklist (Console & gcloud)

Before running any provisioning command, the human operators (**Pawarit** as Project Owner and **Tatchakorn** as Project Editor) must verify:

- [ ] Active account and project in Cloud Console and CLI (`gcloud config get-value account` is the Project Owner `martinvadre` for initial provisioning, and `gcloud config get-value project` is `cpe334-kingnine`).
- [ ] Local checkout is on the accepted `main` commit (`git status` clean on `main`).
- [ ] Free Trial / billing status is active on `cpe334-kingnine` (do **not** pay a prepayment or click **Upgrade**).
- [ ] An **alerts-only budget** is configured and saved as redacted evidence for Issue #19.
- [ ] Both teammates' IAM roles are verified (`martinvadre` Owner, `Magiciancat9` Editor) and the team's target `<REGION>` is confirmed by both teammates.

### 2. Offline stub test and dry-run preview (safe, no GCP calls)

From the repository root in bash / Git Bash / Cloud Shell:

```bash
# Run offline regression stub tests (verifies missing-REGION rejection, IAM fail-fast before Cloud SQL,
# separate runner/migrator service accounts, first_run, rerun, partial, job-fail, demo, secret redaction, and dry-run)
bash deploy/tests/test_deploy_stub.sh

# Preview every gcloud command without executing anything against GCP (replace <REGION> with the team's confirmed region)
DRY_RUN=1 PROJECT_ID=cpe334-kingnine REGION=<REGION> bash deploy/deploy.sh --demo
```

### 3. Human-reviewed first deployment command (Project Owner from `main`)

After both teammates inspect the dry-run output, confirm the project, budget alert, and confirmed `<REGION>`, and verify the checkout is on the accepted `main` commit, the **Project Owner (`martinvadre`)** executes from the repository root:

```bash
PROJECT_ID=cpe334-kingnine REGION=<REGION> bash deploy/deploy.sh --demo
```

What `deploy/deploy.sh` guarantees:
- **Explicit region requirement:** Refuses to run if `REGION` is unset; does not assume an unconfirmed default region.
- **IAM fail-fast before billable resources:** Creates `course-pms-runner` and `course-pms-migrator` and binds `roles/cloudsql.client` in Step 2 **before** creating Artifact Registry or the billable Cloud SQL instance (`course-pms-pg`).
- **Separate least-privilege identities:**
  - `course-pms-runner` (public Cloud Run service): granted `roles/secretmanager.secretAccessor` **only** on `course-pms-database-url` and `course-pms-jwt-secret` (never on `course-pms-demo-password`).
  - `course-pms-migrator` (Cloud Run migration/seed job): granted `roles/secretmanager.secretAccessor` **only** on `course-pms-database-url` and (when `--demo` is passed) `course-pms-demo-password` (never on `course-pms-jwt-secret`).
  - No project-wide `secretAccessor` binding is ever created.
- **Idempotent resource & credential handling:** Existing Artifact Registry repositories, Cloud SQL instances/databases, service accounts, and Secret Manager secrets are reused without overwriting existing passwords or keys on re-run.
- **Migration gate before service update:** Executes the `course-pms-migrate` Cloud Run job (`npm --prefix server run prisma:migrate:deploy && npm --prefix server run prisma:seed`) as `course-pms-migrator` with `--wait` and aborts before `gcloud run deploy` if the migration/seed job fails.
- **Secret isolation & redaction:** Database passwords and generated secrets are piped via stdin to Secret Manager, `--password=<REDACTED>` is masked in command logs, and `DEMO_USER_PASSWORD` is mounted only on `course-pms-migrate`, never on the public `course-pms` service.
- **Cost controls:** Deploys Cloud Run with `--min-instances 0 --max-instances 3 --memory 512Mi --cpu 1` (scales to zero when idle) and Cloud SQL on the smallest `db-f1-micro` tier (`10GB SSD`). Note that Cloud SQL continues to incur charges while the instance exists; coordinate with your teammate before pausing or stopping any cloud resource needed for grading.

### 4. End-to-end public URL verification checklist (`C-04` / R-03)

After `deploy/deploy.sh` finishes and prints `SERVICE_URL`:

1. **Health & database readiness checks:**
   ```bash
   curl -i "${SERVICE_URL}/api/health"
   curl -i "${SERVICE_URL}/api/ready"
   ```
   Confirm both return `HTTP/2 200` and `/api/ready` returns `{"status":"ready","db":"connected"}`.
2. **Retrieve demo password safely (human terminal only — never paste into chat, Git, or Issues):**
   ```bash
   gcloud secrets versions access latest --secret=course-pms-demo-password --project=cpe334-kingnine
   ```
3. **Browser end-to-end journey on `${SERVICE_URL}` (`C-04`):**
   - Open `${SERVICE_URL}` (verify no `localhost` calls in DevTools Network).
   - Sign in as Student (`pawarit@mail.kmutt.ac.th`) and Instructor (`instructor@kmutt.ac.th`).
   - Complete the main CoursePMS Sprint 1 workflow: team roster management (`F-02`), proposal draft/submission (`F-03`), and Instructor review (`APPROVED` / `REVISION_REQUESTED`).
   - Verify at least one expected rule rejection / access restriction (e.g., duplicate team membership `409 BR01_DUPLICATE_TEAM_MEMBERSHIP` or cross-team private proposal access `403 BR06_FORBIDDEN_TEAM_ACCESS`).
   - Record the actual Cloud Run URL, active revision name, commit SHA, and redacted screenshots in Issue #23 and this document.

## Automated Release & Rollback Procedure (`Lab5-07` / Issue #26)

### 1. Branch & Release Flow (`lab5-staging` -> `main`)

1. Start every task branch from `lab5-staging`.
2. Open a PR into `lab5-staging`; the teammate reviews it and the `test-and-docker` check must pass before merge.
3. Open a release PR from `lab5-staging` into `main`; the teammate reviews and approves it, and the required `test-and-docker` check on `main` must pass.
4. Merging the release PR into `main` triggers `.github/workflows/deploy.yml` (`Deploy CoursePMS`), which:
   - Re-runs the full reusable CI workflow (`.github/workflows/ci-docker.yml`, job `test-and-docker`) on the accepted `main` commit.
   - Runs `python3 deploy/verify_reviewed_commit.py` to query the GitHub API and verify that `$IMAGE_TAG` belongs to a merged Pull Request targeting `main` with an independent `APPROVED` review (blocking direct pushes or unapproved merges before any GCP authentication or build).
   - Authenticates to GCP via keyless Workload Identity Federation (`google-github-actions/auth`, no JSON service-account key).
   - Builds the production image with `--build-arg APP_COMMIT_SHA="$IMAGE_TAG"` and pushes `asia-southeast1-docker.pkg.dev/cpe334-kingnine/course-pms/course-pms:<40-char-sha>`.
   - Runs `bash deploy/release.sh`:
     1. Resolves the image tag to an immutable `@sha256` digest (`DIGEST_IMAGE`).
     2. Updates `course-pms-migrate` to `$DIGEST_IMAGE` and executes it with `--wait` (aborting before the web service is updated if the migration fails).
     3. Updates the Cloud Run service `course-pms` to `$DIGEST_IMAGE` with `--update-env-vars="APP_COMMIT_SHA=$IMAGE_TAG"` and routes 100% of traffic to the latest revision.
   - Runs `python3 deploy/smoke_test.py "$SERVICE_URL"` (`EXPECTED_COMMIT_SHA=$IMAGE_TAG`) to verify `/api/health` (including exact `commitSha` match), `/api/ready` (`{"status":"ready","db":"connected"}`), `/` (HTML SPA), and optional authenticated `/api/auth/me` + `/api/courses` + `/api/auth/logout`.

### 2. Running-Commit & Revision Identification (`C-06`)

To verify which Git commit and Cloud Run revision are currently serving public traffic:

```bash
# 1. Inspect the live /api/health endpoint (returns status, service, commitSha, timestamp)
curl -s https://course-pms-859617270560.asia-southeast1.run.app/api/health

# 2. Inspect the active Cloud Run revision and image digest in GCP
gcloud run services describe course-pms \
  --region asia-southeast1 \
  --project cpe334-kingnine \
  --format="yaml(status.latestReadyRevisionName,status.traffic,spec.template.spec.containers[0].image)"
```

### 3. Rollback Procedure

If a deployed release needs to be rolled back to a previously built 40-character commit SHA image in Artifact Registry:

- **Option A — GitHub Actions manual rollback (`workflow_dispatch`):**
  1. Open **Actions -> Deploy CoursePMS -> Run workflow** on branch `main`.
  2. Enter `image_tag` = `<40-character-previous-commit-SHA>`.
  3. The workflow skips rebuild and migration (`ROLLBACK=true`), resolves the existing image's `@sha256` digest, updates `course-pms` with `APP_COMMIT_SHA=<rollback-sha>`, routes 100% traffic to the rolled-back revision, and runs `deploy/smoke_test.py`.

- **Option B — CLI rollback via `deploy/release.sh`:**
  ```bash
  PROJECT_ID=cpe334-kingnine \
  REGION=asia-southeast1 \
  IMAGE_TAG=<40-char-previous-commit-sha> \
  ROLLBACK=true \
  bash deploy/release.sh
  ```

- **Offline verification of release & smoke scripts (no GCP access):**
  ```bash
  bash -n deploy/deploy.sh deploy/teardown.sh deploy/release.sh
  bash deploy/tests/test_deploy_stub.sh
  bash deploy/tests/test_release_stub.sh
  bash deploy/tests/test_teardown_stub.sh
  python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
  ```

## Related Issues

- [#19 - GCP project, budget, and team access](https://github.com/Magiciancat9/Course_management/issues/19)
- [#20 - Make CoursePMS cloud-ready and document configuration](https://github.com/Magiciancat9/Course_management/issues/20)
- [#21 - Verify reproducible Docker build](https://github.com/Magiciancat9/Course_management/issues/21)
- [#22 - Add build and test CI for pull requests](https://github.com/Magiciancat9/Course_management/issues/22)
- [#23 - Provision and deploy CoursePMS to GCP](https://github.com/Magiciancat9/Course_management/issues/23)
- [#25 - Require passing CI and prove merge blocking](https://github.com/Magiciancat9/Course_management/issues/25)
- [#26 - Release reviewed changes from main through CI/CD](https://github.com/Magiciancat9/Course_management/issues/26)
