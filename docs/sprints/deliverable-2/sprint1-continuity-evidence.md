# Sprint 1 continuity execution evidence — D2-01 v1.1

**26 Nov final-RC addendum:** the22 Nov baseline below is historical and
does not substitute for the actual combined RC. Final verification is now
recorded on main `dd9d85ac9f0f6b21f9503c1031173992fb69ce35`,
[run 45759742341](https://github.com/Magiciancat9/Course_management/actions/runs/45759742341)
(192 server/64 client/9 browser, six migrations, builds/Docker and authenticated
smoke PASS). TEST-11/12 and L7-T05/T06 browser journeys, API/privacy/session
checks and populated S2/task/peer migration tests all passed on that main.
[Dated live checks](https://github.com/Magiciancat9/Course_management/issues/103#issuecomment-7183418289)
corroborate persisted records/denials on revision course-pms-00015-lrr;
live readback is not a full production DB snapshot comparison.
[Full D2-CONT-01–05 mapping](continuity-and-status.md#4-part-a-continuity-and-change-register)
and #93 checklist reconciliation retain original test/source/date boundaries.
Current Lab7 is approved revision 20/approval 10; pending10/10 statements below
are22 Nov history. No old SKIP/replay is promoted or new personal UAT claimed.

**Execution date:** 22 Nov 2026, Asia/Bangkok (UTC+07:00).
**Work:** [#93](https://github.com/Magiciancat9/Course_management/issues/93).
**Driver/evidence author:** `Magiciancat9`, assisted by Codex AI.
**Requested independent reviewer:** `martinvadre`; review of this new record
is pending. The tests were invoked by Codex and executed in GitHub Actions;
they are not claimed as either student's personally performed browser UAT.

## 1. Exactly what was tested

| Field | Actual identity / environment |
| --- | --- |
| Tested staging source | [`8eea6f0a9820ad235b99548328394dabb86c6046`](https://github.com/Magiciancat9/Course_management/commit/8eea6f0a9820ad235b99548328394dabb86c6046), `sprint-2-staging` after merged PR #107 |
| Comparison baseline | Accepted Lab 6/current main `aeb804ea5bc667399b00cf54df10046a6ded46e0` |
| Original Sprint 1 | `v1.0.0-sprint1` → `5979f5870e8e28277996dc3045cbf4be5f7236ad` |
| Fresh execution | [CI run 45023838662](https://github.com/Magiciancat9/Course_management/actions/runs/45023838662), attempt 1, `workflow_dispatch`, **SUCCESS** |
| Run interval | 12:44:28–12:46:18 UTC / **19:44:28–19:46:18 Asia/Bangkok** |
| Runner / tools | Ubuntu GitHub-hosted runner, Node.js 20, Python 3.14, PostgreSQL 16 Alpine service; Playwright Chromium |
| Database | Isolated disposable CI PostgreSQL; schema prepared with the existing `prisma db push` convenience script, synthetic seed resets only in CI |
| Source/config changes in this task | Evidence Markdown only; no new test, application, schema, workflow, domain-rule or deployment change |

This is a **pre-feature current-staging baseline check**. F-04–08 are not
implemented at this source. It does not satisfy final integrated-RC acceptance
or prove that an unimplemented feature works. The approved document contract
and the actual tested runtime are distinct identities.

The complete diff from accepted main contains **18 Markdown paths only**.
There is no diff in `server/src`, `server/tests`, `server/prisma`, `client/src`,
client/server/root manifests and lockfiles, `e2e`, `deploy`, Docker/Compose,
Playwright config or GitHub workflows. Both source identities and the tested
workflow are immutable links; a subsequent branch update is not this result.

## 2. Commands and observed suite results

The existing [workflow at the tested source](https://github.com/Magiciancat9/Course_management/blob/8eea6f0a9820ad235b99548328394dabb86c6046/.github/workflows/ci-docker.yml)
executes these commands. All listed steps completed successfully.

| Command / step | Actual result | Scope / practical limit |
| --- | --- | --- |
| `bash -n deploy/deploy.sh deploy/teardown.sh deploy/release.sh`; existing deploy/release/teardown stub suites | PASS | Simulated delivery checks; no GCP provisioning, teardown or release occurred |
| `python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'` | 10 tests, OK | Smoke-script unit checks; separate from application test counts |
| `npm ci`; `npm --prefix server ci`; `npm --prefix client ci` | PASS | Lockfile-based CI installation |
| `npm --prefix server run prisma:migrate` | PASS | `prisma db push` on disposable CI DB; not a populated-baseline migration upgrade |
| `npm run test:server` | **41 passed**, 3 files; 0 failed / 0 skipped | `api.integration.test.ts` 24; `routing-privacy.unit.test.ts` 8; `domain.unit.test.ts` 9 |
| `npm run test:client` | **16 passed**, 4 files; 0 failed / 0 skipped | App 4; sessionReview 5; sessionIsolation 5; directoryPrivacy 2; component/mocked-request checks |
| `npx playwright install chromium`; `npm run test:e2e` | **3 passed**, Chromium; 0 failed / 0 skipped | TEST-11, TEST-12 and TEST-20 against actual local server/client plus CI DB |
| `npm run build` | PASS | Production TypeScript/React build |
| `docker build --tag course-pms:ci .` | PASS | Image build; no container-start timing or new public deployment |

Application suites total **60 passing checks** across their different levels
(41 server + 16 component + 3 E2E). Keep their denominators separate from the
10 smoke-script tests and historical Lab 6 targeted/replay totals. This task
creates no new F-04–08/UIR test IDs and no maintenance RED/GREEN evidence.

Selected execution-log facts:

```text
19:45:10 +07  backend: 3 files / 41 tests passed
19:45:14 +07  frontend: 4 files / 16 tests passed
19:45:31 +07  TEST-11 full student -> instructor -> student journey passed
19:45:34 +07  TEST-12 business-rule / foreign-team denials passed
19:45:37 +07  TEST-20 invalid login / dismissible error passed
19:46:18 +07  complete CI run: SUCCESS
```

Full commands/output remain in the linked GitHub Actions run. Raw downloaded
logs and inspection JSON stay outside Git. E2E screenshots were generated on
the runner but the existing workflow does not upload them; no retained new
screenshot artifact or deployed visual proof is claimed.

## 3. Expected versus actual continuity checks

Source links below point to the **tested commit**, not a moving branch.
Names refer to real existing cases executed in this run, not planned STS IDs.

| Check | Roles / initial state / action | Expected | Actual at tested staging | Evidence and remaining scope |
| --- | --- | --- | --- | --- |
| D2-CONT-01 | Synthetic Student/Instructor; valid/invalid login, current identity, logout, reuse of revoked token and app re-import | Real credentials establish correct role; invalid input denied; revoked token remains denied | PASS in backend TEST-01/02/03/14/19; invalid-login UI/E2E checks passed | [API suite](https://github.com/Magiciancat9/Course_management/blob/8eea6f0a9820ad235b99548328394dabb86c6046/server/tests/api.integration.test.ts); repeat on integrated RC |
| D2-CONT-02 | Unassigned synthetic student plus existing seeded teams; create team/add eligible member; duplicate/capacity/concurrent attempts | Own roster persists; duplicate membership/capacity conflicts preserve invariants | PASS in TEST-04/05/06/15/21/22; browser TEST-11 adds member and TEST-12 verifies duplicate denial | API suite and [E2E suite](https://github.com/Magiciancat9/Course_management/blob/8eea6f0a9820ad235b99548328394dabb86c6046/e2e/sprint1.spec.ts); repeat after integration |
| D2-CONT-03 | Student saves/reads/submits Team Alpha proposal; Instructor requests revision; Student resubmits; Instructor approves; authorized student reads saved approval | Completeness/state rules hold, revision increments and approved state/feedback are persisted | PASS: API TEST-07/08/09 covers revision/resubmit; E2E TEST-11 covers submit/approve/logout/login/readback | Revision/resubmit was checked at API level; browser TEST-11 takes direct approval path. Do not claim a browser revision journey that was not executed |
| D2-CONT-04 | Anonymous, student, foreign-team and instructor contexts; direct forbidden calls, public directory, unsupported API routing, delayed identity/session responses | Backend 401/403 or JSON 404 as applicable; no private foreign proposal/session leak; frontend navigation remains HTML | PASS in TEST-03/10/23, 8 routing/privacy tests, 5 sessionIsolation + 5 sessionReview + 2 directoryPrivacy tests, E2E TEST-12 | [Server routing/privacy](https://github.com/Magiciancat9/Course_management/blob/8eea6f0a9820ad235b99548328394dabb86c6046/server/tests/routing-privacy.unit.test.ts) and [client suites](https://github.com/Magiciancat9/Course_management/tree/8eea6f0a9820ad235b99548328394dabb86c6046/client/src). Delayed-response cases are component fixtures, not deployed race injection |
| D2-CONT-05 | Future populated accepted-baseline DB upgraded by actual Sprint 2/3 migrations and integrated code | Existing users/teams/proposals/revoked sessions retain IDs, content and authorized readback; new workflows coexist | **NOT RUN**: no new feature migration/RC is available; current CI creates/resets a disposable schema | Magiciancat9 records continuity evidence, feature owners supply migrations and martinvadre integrates/releases; target 28 Nov via #97/#103 |

These results establish the named existing checks on the specified source.
They do not prove exhaustive route coverage, eliminate every race, or replace
the final unchanged/changed behavior and deployed persistence/access checks.

## 4. Read-only public health and readiness observation

No authentication, business mutation, reset, seed, restart, release, Cloud
Console edit or deployment was performed against the public service.

| Request | Observation time Asia/Bangkok | Actual response | Interpretation |
| --- | --- | --- | --- |
| GET `/api/health` | 22 Nov 2026, 19:45:40 +07 | HTTP 200; `status: ok`, `service: course-pms-api`, `commitSha: aeb804ea5bc667399b00cf54df10046a6ded46e0` | Current public commit matches accepted Lab 6 main; it is not staging `8eea6f0...` or a new D2 RC |
| GET `/api/ready` | 22 Nov 2026, 19:45:40 +07 | HTTP 200; `status: ready`, `db: connected` | Current readiness/DB connectivity only; no authenticated production business/persistence proof |

The health response's server timestamp was `2026-11-22T12:45:41.862Z`.
Observation times record client request start; subsecond difference/server
clock skew is not a startup-duration measurement. Health does not return a
Cloud Run revision name. The historical revision remains separately sourced
in the [change/defect register](change-defect-register.md).

## 5. Work completed now and remaining gate

- Baseline tag, main, tested staging and currently served commit are identified.
- The detailed Lab 5–7 register includes accepted decisions, owners,
  release/retest sources and explicit remaining actions/dates.
- Existing Sprint 1 automated journeys and important privacy/routing/session
  regression ran afresh, on a real disposable PostgreSQL-backed CI environment.
- Lab 7 #85 remains pending TA approval and user confirmation. The existing
  minimum 10 is preserved; Lab 7 does not prevent this execution.
- Remaining: actual F-04–06 plus meaningful F-07 checkpoint integration,
  populated upgrade D2-CONT-05, re-execution of D2-CONT-01–04 on that exact
  RC, relevant deployed checks, and teammate review of this evidence update.

Keep #93 open / In progress until the remaining final-RC criteria are met.
This is concrete completed progress, not a reason to leave all #93 work idle.
