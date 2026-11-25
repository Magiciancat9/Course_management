# F-05 implementation and executed verification — 25 November 2026

**25 Nov integration update (#97):** feature implementations were independently
reviewed and merged in PR #116/#117/#118. The feature-head history below retains
its original scope; [accepted-release.md](accepted-release.md) records the
combined maintained-main candidate, all Sprint 2 AC and pending release gates.

Work: [#95](https://github.com/Magiciancat9/Course_management/issues/95).
Driver: `Magiciancat9`, assisted by Codex. Independent reviewer: `martinvadre`
(pending). Code/tests and checks were AI-assisted; GitHub Actions executed the
PostgreSQL/browser/build jobs. No personal student UAT or production deployment
is claimed. Times below use Asia/Bangkok unless an explicit UTC suffix appears.

## 1. Versioned contract and real test-first history

| Stage | Source / execution | Observed outcome |
| --- | --- | --- |
| Reviewed contract | PR #107 / `8eea6f0`; existing F-05/shared AC/STS | Review preceded F-05 test/code changes |
| F-04 integration base | PR #116 / `1b2f487c2c83103055fa3017e3a353befa2eba3f` | Milestone management dependency merged into Sprint 2 staging |
| Test-only RED | `06b9ca9528814cfa282a2f410fcaa550d3bf1b4e`; [run 45563770304](https://github.com/Magiciancat9/Course_management/actions/runs/45563770304) | Backend: 13 expected F-05 failures (missing routes / 404), 54 existing passes; subsequent frontend/E2E/build steps SKIPPED because backend failed |
| First implementation attempt | `cbeb85b`; [run 45564370439](https://github.com/Magiciancat9/Course_management/actions/runs/45564370439) | Backend: 76 passed / 3 failed. The deadline fixture advanced time beyond its JWT's 8h expiry, causing 401. The actual populated SQL migration check passed. Downstream steps SKIPPED |
| First full GREEN | `daaf6d3`; [run 45565196403](https://github.com/Magiciancat9/Course_management/actions/runs/45565196403) | Backend 79/79, frontend 36/36, Chromium 5/5, production and Docker builds PASS; empty DB migrate deploy PASS |
| Final runtime/evidence check | `e3a7d0b430e4dec1d4be7123a1c5f63a54d7cf55`; [run 45565663950](https://github.com/Magiciancat9/Course_management/actions/runs/45565663950), 14:07:18–14:09:15 | SUCCESS: backend 80/80, frontend 36/36, Chromium 5/5; 121 application checks, 0 failed/skipped. Empty migrate deploy, populated upgrade, production/Docker builds and screenshot retention PASS |

The deadline fixture correction reissues the real session at simulated server
time; it retains the original -1ms/equality/+1ms assertions. It does not bypass
authentication, mock persistence or weaken the business expectation. The RED
commit and the failed intermediate run remain in history.

## 2. Commands, environment and scope

CI uses Ubuntu, Node.js 20, Python 3.14, PostgreSQL 16 Alpine and Chromium.
The synthetic disposable DB is `course_pms_test`; no production seed/reset,
GCP authentication, migration job, release or live write is performed.

```text
npm ci
npm --prefix server ci
npm --prefix client ci
# server working directory: apply real versioned migrations, then generate
npm run prisma:migrate:deploy
npx prisma generate
npm run test:server
npm run test:client
npx playwright install chromium
npm run test:e2e
npm run build
docker build --tag course-pms:ci .
```

The backend count includes the actual populated-migration test. Smoke-script
unit tests (10) and shell delivery stubs are separate from application totals.
The feature branch's previous local frontend build/test and server build also
passed; the CI links, rather than local assertions, establish real DB/E2E results.

## 3. Selected running workflow and persistence/access evidence

`e2e/sprint2-submissions.spec.ts` executes `S2-F05-T11/T12` against real local
Express/React plus PostgreSQL in CI:

1. Student Team Alpha submits its original proposal; instructor approves it.
2. Instructor creates and publishes a milestone using the actual F-04 UI.
3. Approved student opens that milestone, sends repository/report/tag/notes,
   and receives confirmed version 1. A browser reload retrieves the saved tag
   and ON_TIME status from the backend.
4. Student submits version 2; both old and new tags appear in persisted history.
5. Instructor signs in, opens the team submission and reads version 2 without a
   student mutation form.
6. Foreign Team Beta student directly GETs Team Alpha's submission: 403
   `BR06_FORBIDDEN_TEAM_ACCESS`, with no report URL in the denied payload.

Roles and data are synthetic seed fixtures, not personal student execution.
API `S2-F05-T02` additionally demonstrates BR-07 denial for each non-approved
state and compares the entire retained current row plus history counts.

The follow-up CI stores `test-results/f05-submission-v2.png` as artifact
`f05-program-<full tested SHA>` for 90 days. It is a browser screenshot of the
synthetic version-2 workflow, not production evidence. Download it outside
public Git for the assessed PDF and retain the exact source/run caption.
The final runtime run retained [artifact 14999228151](https://github.com/Magiciancat9/Course_management/actions/runs/45565663950/artifacts/14999228151).

## 4. Migration, immutability and cross-feature checks

- Fresh CI DB: all three actual migration files apply with `prisma migrate deploy`.
- Populated legacy fixture: `submissions-migration.integration.test.ts` applies
  the real init/F-04 SQL in a private transactional test schema, inserts existing
  users/team/membership/proposal/revoked session/milestone/submission, then applies
  F-05 SQL. It verifies IDs/content and old grading are retained; report/deadline
  remain NULL and lateness UNKNOWN. The unrelated row snapshots remain identical.
- New writes: one `(milestoneId, teamId)` current row plus immutable unique
  `(submissionId, version)` content rows. Server timestamp and deadline are
  captured together after the same milestone row lock used by F-04 edits.
- `S2-F05-T08` uses real parallel API creates/updates and stale retries: one
  winner per expected version, loser 409 and no duplicated logical row.
- `S2-F05-T09` verifies retained historical deadlines after edits, and the
  additional simultaneous F-04/F-05 case accepts only a coherent old-or-new
  deadline/late snapshot.

## 5. Honest remaining gates and F-06 handoff

- Independent feature review/merge and accepted Sprint 2 release #97 remain pending.
- F-06 / #96 must implement actual version-bound evaluations/publications and
  verify published v1 grading remains historical after v2, including stale
  publication rejection. F-05 never exposes unproven legacy scores to students;
  the current `publishedEvaluation` response slot is intentionally null.
- This branch is based on F-04 staging, which has not yet integrated maintained
  Lab 7 main `b92b434`. It does not edit the proposal feedback rule. Reviewed
  integration must preserve **revision20/approval10** and rerun Lab 7 plus F-04/F-05
  before main/RC acceptance. These test totals are not the prior Lab 7 124-test run.
- Final RC continuity/populated upgrade/deployment/post-deploy and report evidence
  remain #93/#103/#104. No accepted D2 release, production readiness or submission
  receipt is created by this feature PR. Keep #95 open until the user handles closure.
