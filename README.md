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

---

## 3. Prerequisites & Local Setup

### 3.1. Dependencies
- **Node.js** `>= 20.x` & **npm** `>= 10.x`
- **PostgreSQL** `>= 15.x` running locally on port `5432`

### 3.2. Environment Configuration
Copy `.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```
Default local `server/.env` values:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/course_pms?schema=public"
CORS_ORIGIN="http://localhost:5173"
JWT_SECRET="<generated value>"
DEMO_USER_PASSWORD="Password123!"
```

Generate a signing secret with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Set `JWT_SECRET` to the generated value in `server/.env`.

### 3.3. Install, Migrate, and Seed Database
```bash
# 1. Install dependencies across root, server, and client
npm install
npm --prefix server install
npm --prefix client install

# 2. Push Prisma schema to PostgreSQL and generate Prisma Client
npm --prefix server run prisma:migrate

# 3. Seed reproducible synthetic demo data
npm --prefix server run prisma:seed
```

### 3.4. Seeded Local Test Accounts (Synthetic Demo Data)
All seeded local demo accounts use the password defined in `DEMO_USER_PASSWORD` (default: `Password123!`):

| Email | Role | Student ID | Initial Seed State |
| :--- | :--- | :--- | :--- |
| `instructor@kmutt.ac.th` | `INSTRUCTOR` | — | Course Instructor for `CPE334` |
| `pawarit@mail.kmutt.ac.th` | `STUDENT` | `67070503466` | Leader of **Team Alpha** (`DRAFT` proposal) |
| `tatchakorn@mail.kmutt.ac.th` | `STUDENT` | `67070503415` | Unassigned student (ready to join **Team Alpha**) |
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
