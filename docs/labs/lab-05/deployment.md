# CoursePMS Lab 5 Deployment Notes

This document records the current cloud-readiness contract. GCP resources have not yet been provisioned; values not confirmed by the team are marked **TBD**. This document does not authorize or perform billing, IAM, database, or deployment operations.

## Application and deployment shape

- **Application:** CoursePMS from the accepted Sprint 1 release.
- **Runtime:** Node.js 20; React/Vite static build served by the Express API in production.
- **Database:** PostgreSQL through Prisma. Teams, proposals, users, milestones, submissions, and revoked JWT identifiers are persisted in the database; no application uploads or other user data are stored on the container filesystem.
- **Local persistence:** Docker Compose stores PostgreSQL data in the named `pgdata` volume. Do not remove the volume if local data must be retained.
- **GCP target:** Cloud Run, Cloud SQL for PostgreSQL, Artifact Registry, and Secret Manager, following the Lab 5 reference architecture. Exact service, instance, database, region, and repository names are **TBD** until the project owner confirms them.
- **GCP project:** `CPE334 Kingnine` (`cpe334-kingnine`, number `859617270560`), reported by the team. Martin Wongdaeng (`martinvadre`) is the project owner/creator; Tatchakorn Thamnimitr (`Magiciancat9`) is the project Editor. Confirm both roles in Cloud IAM before provisioning. Project identity does not prove that billing, Free Trial credits, or the budget are active.
- **Region:** **TBD**. `asia-southeast1` is an example in course materials, not a confirmed team choice.

The application serves its built frontend and API from the same origin when `NODE_ENV=production`. The client uses relative API paths; Vite's `localhost:3000` proxy is for local development only. No `VITE_*` runtime variable is currently read by the client.

## Environment variables

The committed `.env.example` files contain placeholders only. Copy them locally and replace placeholders in ignored `.env` files; never commit a real `.env`, connection string, password, or key.

| Variable | Purpose | Secret? | Source |
|---|---|---|---|
| `PORT` | HTTP port. The server defaults to `3000`; Cloud Run supplies the runtime port. | No | Local `.env`; Cloud Run runtime environment |
| `NODE_ENV` | Selects development/test behavior or production static-file and seed behavior. | No | Local `.env`; set to `production` for Cloud Run |
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

In non-production modes the seed resets its target database and recreates the synthetic fixtures. **Never point non-production seeding at a developer database with wanted data or at Cloud SQL.** In production mode (`NODE_ENV=production`), `npm --prefix server run prisma:seed` requires `DEMO_USER_PASSWORD`, creates only missing demo users/course/teams/memberships/proposals, and does not delete or overwrite existing records. Existing account passwords are not changed by rerunning the production seed. `deploy/deploy.sh --demo` attaches `DEMO_USER_PASSWORD` from Secret Manager (`course-pms-demo-password`) **only** to the `course-pms-migrate` Cloud Run job and never passes it to the public `course-pms` web service.

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

| Resource | Planned default / placeholder | Status |
|---|---|---|
| Project | `cpe334-kingnine` / `859617270560` | Reported by team; verify in Console before provisioning |
| Project owner | Martin Wongdaeng (`martinvadre`) | Reported by team; verify in IAM |
| Project Editor | Tatchakorn Thamnimitr (`Magiciancat9`) | Reported by team; verify in IAM |
| Region | `<REGION>` (script default: `asia-southeast1`) | Team must confirm before running provisioning |
| Cloud Run service | `course-pms` (container port `8080`, `--min-instances 0`, `--max-instances 3`) | Planned in `deploy/deploy.sh`; not yet provisioned |
| Cloud Run migration job | `course-pms-migrate` (`prisma migrate deploy` + optional `--demo` seed) | Planned in `deploy/deploy.sh`; not yet provisioned |
| Cloud SQL instance / database / user | `course-pms-pg` (`POSTGRES_16`, `enterprise`, `db-f1-micro`, `10GB SSD`) / DB `course_pms` / user `coursepms` | Planned in `deploy/deploy.sh`; not yet provisioned |
| Artifact Registry repository | `course-pms` (Docker format) | Planned in `deploy/deploy.sh`; not yet provisioned |
| Runtime service account | `course-pms-runner@cpe334-kingnine.iam.gserviceaccount.com` | Planned in `deploy/deploy.sh`; least-privilege runtime SA |
| Secret Manager secret names | `course-pms-database-url`, `course-pms-jwt-secret`, `course-pms-demo-password` (when `--demo` is used) | Planned in `deploy/deploy.sh`; never record secret values here |
| GitHub OIDC/WIF pool, provider, deploy service account | **TBD** (Issue #25 / #26) | Configure later with least privilege; do not create or commit a JSON key |

## First GCP provisioning and deployment (`Lab5-05` / Issue #23)

### 1. Human pre-deployment checklist (Console & gcloud)

Before running any provisioning command, the human operators (**Pawarit** and **Tatchakorn**) must verify:

- [ ] Active account and project in Cloud Console and CLI (`gcloud config get-value account` and `gcloud config get-value project` match `cpe334-kingnine`).
- [ ] Free Trial / billing status is active on `cpe334-kingnine` (do **not** pay a prepayment or click **Upgrade**).
- [ ] An **alerts-only budget** is configured and saved as redacted evidence for Issue #19.
- [ ] Both teammates' IAM roles are verified (`martinvadre` Owner, `Magiciancat9` Editor) and the target `<REGION>` (e.g., `asia-southeast1`) is agreed.

### 2. Offline stub test and dry-run preview (safe, no GCP calls)

From the repository root in bash / Git Bash / Cloud Shell:

```bash
# Run offline regression stub tests (verifies first_run, rerun, partial, job-fail, demo, secret redaction, and dry-run)
bash deploy/tests/test_deploy_stub.sh

# Preview every gcloud command without executing anything against GCP
DRY_RUN=1 PROJECT_ID=cpe334-kingnine REGION=asia-southeast1 bash deploy/deploy.sh --demo
```

### 3. Human-reviewed first deployment command

After both teammates inspect the dry-run output and confirm the project, budget alert, and region, a human operator executes from the repository root:

```bash
PROJECT_ID=cpe334-kingnine REGION=asia-southeast1 bash deploy/deploy.sh --demo
```

What `deploy/deploy.sh` guarantees:
- **Idempotent resource & credential handling:** Existing Artifact Registry repositories, Cloud SQL instances/databases, service accounts, and Secret Manager secrets are reused without overwriting existing passwords or keys on re-run.
- **Least-privilege IAM:** Grants `roles/cloudsql.client` to `course-pms-runner` and grants `roles/secretmanager.secretAccessor` **per individual secret** (`course-pms-database-url`, `course-pms-jwt-secret`, and `course-pms-demo-password`), never project-wide.
- **Migration gate before service update:** Executes the `course-pms-migrate` Cloud Run job (`npm --prefix server run prisma:migrate:deploy && npm --prefix server run prisma:seed`) with `--wait` and aborts before `gcloud run deploy` if the migration/seed job fails.
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

## Release procedure

The intended team path is:

1. Start a task branch from `lab5-staging`.
2. Open a PR into `lab5-staging`; the teammate reviews it and CI passes before merge.
3. Open a release PR from `lab5-staging` into `main`; the teammate reviews it and required checks pass.
4. The eventual deploy workflow deploys accepted commits from `main` only, identifies the image/revision by commit SHA, and runs a read-only smoke check.
5. Record the PR, workflow run, commit SHA, Cloud Run revision, and public URL in the Lab 5 evidence index.

The deploy workflow, resource inventory, exact migration sequence, smoke test, and rollback commands remain pending the later deployment Issues. Do not claim a release has been deployed until the workflow run and active revision have been verified in GitHub and GCP.

## Related Issues

- [#19 - GCP project, budget, and team access](https://github.com/Magiciancat9/Course_management/issues/19)
- [#20 - Make CoursePMS cloud-ready and document configuration](https://github.com/Magiciancat9/Course_management/issues/20)
- [#21 - Verify reproducible Docker build](https://github.com/Magiciancat9/Course_management/issues/21)
- [#23 - Provision and deploy CoursePMS to GCP](https://github.com/Magiciancat9/Course_management/issues/23)
