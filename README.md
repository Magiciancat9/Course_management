# CoursePMS — Course Project Management System

**25 Nov current snapshot:** reviewed/deployed main contains Sprint 1/Lab 7
and complete Sprint 2. Reviewed `sprint-3-staging` additionally contains the
F-07 task checkpoint; peer evaluation and analytics/CSV remain planned.
[Current source/release/results and remaining-work plan](docs/sprints/deliverable-2/continuity-and-status.md)
distinguishes CI PASS, production smoke SKIP and pending accepted-main/tag/RC gates.

**Course:** CPE 334 Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Deliverable:** Project Deliverable 1 — Engineering Baseline and Working Sprint 1  
**Current planning:** Sprint 2–3 contracts were reviewed in PR #107; UI refresh and F-04 merged into staging via #110/#116. F-05 is implemented on its feature branch for independent review; accepted Sprint 2/main deployment remains pending. See [F-05 evidence](docs/sprints/sprint-2/f05-execution-evidence.md).
**Team Members:**
- **Pawarit Wongdaeng** (`67070503466`, GitHub: `martinvadre`)
- **Tatchakorn Thamnimitr** (`67070503415`, GitHub: `Magiciancat9`)

---

## 1. Overview & Sprint 1 Vertical Slice

**CoursePMS** is a full-stack web application for managing university course project teams, project proposals, instructor reviews, and milestone deliverables.

**Sprint 1 (`v1.0.0-sprint1`) implements:**
- **`F-01` Authentication, Session & Role Access Control:** Real `bcrypt` password verification, JWT issuance (`POST /api/auth/login`), current-user profile retrieval (`GET /api/auth/me`), server-enforced token revocation on logout (`POST /api/auth/logout`), and backend `STUDENT` / `INSTRUCTOR` role guards.
- **`F-02` Course Project Team Formation & Roster Management:** Create project teams in an active course (`CPE334`), add student teammates by email, and enforce **single active team membership per student per course (`BR-01`)** and **maximum team capacity (`BR-02`, max 3 members)**.
- **`F-03` Project Proposal Drafting, Submission & Instructor Review:** Draft and submit team project proposals (`DRAFT` → `SUBMITTED`), enforce content completeness (`BR-04`), state-lock validation (`BR-03`), cross-team ownership isolation (`BR-06`), and Instructor review (`APPROVED` / `REVISION_REQUESTED`) with mandatory feedback (`BR-05`).

---

## 2. Engineering Documentation Index (`docs/`)

| Part | Deliverable Section | Repository Artifact |
| :---: | :--- | :--- |
| **Part A** | SRS and Product Scope | [`docs/srs.md`](docs/srs.md) |
| **Part B** | Feature Inventory & Traceability Matrix | [`docs/features.md`](docs/features.md), [`docs/traceability.md`](docs/traceability.md) |
| **Part C** | System-Level SDS | [`docs/system-sds.md`](docs/system-sds.md) |
| **Part D** | Three-Sprint Plan | [`docs/sprints/plan.md`](docs/sprints/plan.md) |
| **Part E** | Sprint 1 Engineering Contracts & STS/DoD | [`docs/sprints/sprint-1/f01-auth-and-roles.md`](docs/sprints/sprint-1/f01-auth-and-roles.md), [`docs/sprints/sprint-1/f02-team-and-proposal-workflow.md`](docs/sprints/sprint-1/f02-team-and-proposal-workflow.md), [`docs/sprints/sprint-1/sts-and-dod.md`](docs/sprints/sprint-1/sts-and-dod.md) |
| **Lab 5** | Cloud deployment configuration and GCP project record | [`docs/labs/lab-05/deployment.md`](docs/labs/lab-05/deployment.md), [`docs/labs/lab-05/gcp-project.md`](docs/labs/lab-05/gcp-project.md) |
| **Sprint 2 release** | Integration source, all 27 AC, actual verification and accepted-main/tag gates | [`docs/sprints/sprint-2/accepted-release.md`](docs/sprints/sprint-2/accepted-release.md) |
| **Deliverable 2** | Reviewed Sprint 2-3 contracts and current Sprint 2 release/AC verification ledger | [`docs/sprints/deliverable-2/README.md`](docs/sprints/deliverable-2/README.md) |
| **UI refresh** | Modern layout, Quick Fill removal and responsive/accessibility criteria; implemented via PR #110 | [`docs/ui-refresh-spec.md`](docs/ui-refresh-spec.md) |
| **Lab 7** | Approved BR-05 maintenance, release readiness and retrospective | [`docs/labs/lab-07/revised-contract.md`](docs/labs/lab-07/revised-contract.md), [`docs/labs/lab-07/readiness-and-retrospective.md`](docs/labs/lab-07/readiness-and-retrospective.md) |


---

## 3. Prerequisites & Local Setup

### 3.1. Dependencies
- **Node.js** `>= 20.x` & **npm** `>= 10.x`
- **PostgreSQL** `>= 15.x` running locally on port `5432`

### 3.2. Environment Configuration
Copy `.env.example` to `.env` for Docker Compose and to `server/.env` for native server commands. Replace each placeholder locally; never commit either `.env` file:
```bash
cp .env.example .env
cp server/.env.example server/.env
```
Set these local development values in `server/.env` (and the Compose-specific values in the root `.env`):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/course_pms?schema=public"
CORS_ORIGIN="http://localhost:5173"
JWT_SECRET="<generated value>"
DEMO_USER_PASSWORD="<choose a local-only demo password>"
POSTGRES_PASSWORD="<choose a local-only PostgreSQL password>"
```

Generate a signing secret with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Set `JWT_SECRET` to the generated value in `server/.env`. `POSTGRES_PASSWORD` is only used by local Docker Compose. In production, store `DATABASE_URL` and `JWT_SECRET` in Secret Manager. `DEMO_USER_PASSWORD` is only for the separate seed job; do not expose it to the web service.

### 3.3. Install, Apply Schema, and Seed Database
```bash
# 1. Install dependencies across root, server, and client
npm ci
npm --prefix server ci
npm --prefix client ci

# 2. Apply all committed migrations to the configured fresh local DB
npm --prefix server run prisma:migrate:deploy

# 3. Generate Prisma Client and compile the server
npm --prefix server run build

# 4. Seed reproducible synthetic demo data (development/test databases only)
npm --prefix server run prisma:seed
```
The local `prisma:migrate` script runs `prisma db push` for a disposable development database. The repository also contains versioned Prisma migrations; the production release job uses `npm --prefix server run prisma:migrate:deploy` (`prisma migrate deploy`), as described in the [deployment instructions](docs/labs/lab-05/deployment.md).


The local/test seed resets its target database and must only be run against a disposable database. In `NODE_ENV=production`, the seed requires `DEMO_USER_PASSWORD` and only creates missing demo users/data; it does not delete or overwrite existing records. Supply the password to a one-time seed job from Secret Manager, never from committed source or the public web service. Do not run `prisma db push` against production; the production schema/migration procedure must be reviewed and documented before deployment.

### 3.4. Seeded Local Test Accounts (Synthetic Demo Data)
All seeded local demo accounts use the password you set in the local `DEMO_USER_PASSWORD` variable. The placeholder in `.env.example` is not a usable password:

| Email | Role | Student ID | Initial Seed State |
| :--- | :--- | :--- | :--- |
| `instructor@kmutt.ac.th` | `INSTRUCTOR` | — | Course Instructor for `CPE334` |
| `pawarit@mail.kmutt.ac.th` | `STUDENT` | `67070503466` | Leader of **Team Alpha** (`DRAFT` proposal) |
| `tatchakorn@mail.kmutt.ac.th` | `STUDENT` | `67070503415` | Unassigned student (can be added to **Team Alpha** by a current member) |
| `somchai@mail.kmutt.ac.th` | `STUDENT` | `67070503499` | Leader of **Team Beta** (`SUBMITTED` private proposal) |
| `suda@mail.kmutt.ac.th` | `STUDENT` | `67070503488` | Unassigned student (for team creation & capacity tests) |

---

## 4. Running the Application & Automated Tests

```bash
# Start backend API server (http://localhost:3000)
npm --prefix server run dev

# Start frontend Vite dev server (http://localhost:5173)
npm --prefix client run dev

# Build production bundles (TypeScript + Vite)
npm run build

# Run all automated tests (Backend Unit + API/DB Integration + Client UI + Playwright E2E)
npm test

# Run individual test suites
npm run test:server   # Vitest Unit + Supertest API/DB Integration
npm run test:client   # Vitest + React Testing Library UI tests
npm run test:e2e      # Playwright End-to-End browser tests
```

> **Test database safety:** Server integration tests reset the database through `seedDatabase`, and each Playwright test runs the Prisma seed script. Set `DATABASE_URL` to a separate, disposable PostgreSQL test database before running `test:server` or `test:e2e`; the name must end `_test` on localhost/CI and NODE_ENV must not be production. Never point these suites at a non-disposable development or production database.

## 5. F-03 Proposal Drafting, Submission & Instructor Review

F-03 uses the existing `ProjectProposal` Prisma model; no additional migration or
environment variable is required. Apply the current schema to a local database
with `npm --prefix server run prisma:migrate:deploy` in Section 3.3.

| Method | Endpoint | Access | Result |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teams/:id/proposal` | Team member or `INSTRUCTOR` | Returns `{ proposal }` |
| `PUT` | `/api/teams/:id/proposal` | Team member (`STUDENT`) | Saves draft fields: `title`, `problemStatement`, `techStack`, `repoUrl` |
| `POST` | `/api/teams/:id/proposal/submit` | Team member (`STUDENT`) | Validates and submits the saved proposal |
| `POST` | `/api/proposals/:id/review` | `INSTRUCTOR` | Body: `{ "decision": "APPROVED" \| "REVISION_REQUESTED", "reviewFeedback": "..." }` |

Proposal state transitions:

```text
DRAFT ──submit──> SUBMITTED ──approve──> APPROVED
                       └──request revision──> REVISION_REQUESTED
                                                  └──edit and resubmit──> SUBMITTED
```

Editing or submitting a `SUBMITTED` or `APPROVED` proposal returns
`409 BR03_INVALID_STATUS_TRANSITION`. Submission requires a trimmed title of at
least 5 characters, problem statement of at least 20 characters, and tech stack
of at least 3 characters; otherwise it returns `400 BR04_INCOMPLETE_PROPOSAL`.
Instructor review requires a valid decision. Under the TA-approved Lab 7 change,
`REVISION_REQUESTED` requires at least **20**, while `APPROVED` requires at least
**10**, JavaScript UTF-16 code units after `trim()`
(`400 BR05_FEEDBACK_TOO_SHORT` below the selected minimum). Existing historical
reviews remain readable without rewriting stored feedback; an invalid decision returns
`400 VALIDATION_ERROR`. A proposal not in `SUBMITTED` returns
`409 BR03_INVALID_STATUS_TRANSITION`. Review status is checked before review
payload validation, so a non-submitted proposal returns 409 even when its
feedback is also incomplete. Students accessing another team's proposal receive
`403 BR06_FORBIDDEN_TEAM_ACCESS`; student review attempts receive
`403 BR06_INSTRUCTOR_ROLE_REQUIRED`. Forbidden responses do not include proposal
data.

## 6. Known Limitations

- The legacy `prisma:migrate` alias uses `prisma db push`; the recommended fresh setup and production procedure use committed migrations through `prisma:migrate:deploy`. Never use the local schema-sync or test reset commands on production.
- Students cannot self-join an existing team. A current team member adds an eligible student by university email; self-service joining remains outside the implemented baseline under approved CHG-05.
- PostgreSQL integration and E2E suites are destructive to their configured database and must only run against a disposable test database.


## 7. Current migration and deployment boundaries

Main S2 has four ordered migrations; Sprint 3 staging adds
`20261125030000_f07_task_checkpoint` as the fifth. Existing populated data must
follow the reviewed migration-history procedure in the Lab 5 deployment notes;
do not reset it or mark init applied without verifying the actual schema.
Docker Compose starts the app/database services but does not automatically run
migration or seed commands; provision schema explicitly before using a fresh DB.

The deployed service identity, image digest, migration/revision, bounded public
readback and actual authenticated-smoke SKIP are in the current snapshot above.
Do not count a local demo password/login as proof of the production smoke.
The native environment examples contain placeholders only. Final PDFs/private
credentials/receipts and temporary inspection files remain outside public Git.
