# CoursePMS — Course Project Management System

**Course:** CPE 334 Software Engineering in the Age of AI Agents (Semester 1/2026)  
**Deliverable:** Project Deliverable 1 — Engineering Baseline and Working Sprint 1  
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
npm install
npm --prefix server install
npm --prefix client install

# 2. Apply the Sprint 1 schema with prisma db push and generate Prisma Client
npm --prefix server run prisma:migrate

# 3. Seed reproducible synthetic demo data (development/test databases only)
npm --prefix server run prisma:seed
```
The Sprint 1 `prisma:migrate` script runs `prisma db push` and does not maintain a migration history. Real Prisma migrations are planned for Sprint 2.

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

> **Test database safety:** Server integration tests reset the database through `seedDatabase`, and each Playwright test runs the Prisma seed script. Set `DATABASE_URL` to a separate, disposable PostgreSQL test database before running `test:server` or `test:e2e`; never point these suites at a development or production database.

## 5. F-03 Proposal Drafting, Submission & Instructor Review

F-03 uses the existing `ProjectProposal` Prisma model; no additional migration or
environment variable is required. Apply the current schema to a local database
with the existing `npm --prefix server run prisma:migrate` command in Section 3.3.

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
Instructor review requires a valid decision and feedback of at least 10 trimmed
characters (`400 BR05_FEEDBACK_TOO_SHORT`); an invalid decision returns
`400 VALIDATION_ERROR`. A proposal not in `SUBMITTED` returns
`409 BR03_INVALID_STATUS_TRANSITION`. Review status is checked before review
payload validation, so a non-submitted proposal returns 409 even when its
feedback is also incomplete. Students accessing another team's proposal receive
`403 BR06_FORBIDDEN_TEAM_ACCESS`; student review attempts receive
`403 BR06_INSTRUCTOR_ROLE_REQUIRED`. Forbidden responses do not include proposal
data.

## 6. Known Limitations

- Sprint 1 applies the Prisma schema with `prisma db push`; it does not yet have a Prisma migration history.
- Students cannot self-join an existing team. A current team member adds an eligible student by university email; a self-service join workflow remains a proposed scope change pending team approval.
- PostgreSQL integration and E2E suites are destructive to their configured database and must only run against a disposable test database.
