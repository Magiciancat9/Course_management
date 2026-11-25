# F-07 task checkpoint execution evidence - #98

**Prepared:** 25 November 2026, Asia/Bangkok. Driver: Magiciancat9 (Codex-assisted).
Independent code reviewer: martinvadre; review/integration are pending.
This checkpoint implements task AC01-06 only. Full F-07 is NOT complete;
peer evaluation AC07-12 is explicitly owned by [#101](https://github.com/Magiciancat9/Course_management/issues/101).

## 1. Reviewed contract and exact chronology

- Full task/peer contract and STS: [F-07](f07-collaboration.md), independently
  reviewed in [PR #107](https://github.com/Magiciancat9/Course_management/pull/107)
  and merged as `8eea6f0a9820ad235b99548328394dabb86c6046`, before new code/tests.
- Actual implementation base: maintained Sprint 1/Lab 7 plus reviewed Sprint 2,
  main `07ffd8f31c3d61d8d13d5217a1fde39628c6649a` (PR #119).
- Test-only RED: `c03ff7733719a5cda5af1acfd34ac707133661b0`. Local dedicated PostgreSQL execution:
  9 new tests failed behaviorally because task routes returned 404.
  [RED CI 45604381552](https://github.com/Magiciancat9/Course_management/actions/runs/45604381552)
  independently records the same missing-route failures, separate from retained baseline tests.
  RED is expected evidence, never relabeled PASS.
- GREEN task implementation: branch `feat/98-f07-tasks`; current exact source,
  full CI and review identity are recorded in its PR/checks. The original nine
  RED tests are retained; they passed locally after implementing the routes.

Sprint 3 staging (`sprint-3-staging`) starts from the exact main SHA above.
Task work remains isolated from main. This does not create or move the
accepted Sprint 2 tag. #97's accepted release/tag and #93/#103's final combined
RC gates remain separate; this branch is not a main deployment.

## 2. Achieved checkpoint AC and actual files

| AC | Implementation / expected behavior | Executable verification | Result scope |
| --- | --- | --- | --- |
| S3-F07-AC01 | Approved owning-team student creates and assigns a normalized version-1 task; later GET/DB matches | S3-F07-T01, [API/PostgreSQL](../../../server/tests/collaboration.integration.test.ts) | PASS on GREEN source/run below; peer review pending |
| S3-F07-AC02 | Trim/UTF-16 bounds, enum/sprint/types/unknown fields, current member assignment and same-course published milestone; non-approved writes rejected | S3-F07-T02, [unit](../../../server/tests/collaboration.unit.test.ts), API tests; S3-F07-T02-M [actual populated migration](../../../server/tests/collaboration-migration.integration.test.ts) | Local PASS; rejected writes leave rows/events unchanged |
| S3-F07-AC03 | TODO -> IN_PROGRESS -> DONE -> TODO or direct defined transitions; actor/time/change/version events stored atomically | S3-F07-T03, API GET/DB/event history | Local PASS; old events remain identical |
| S3-F07-AC04 | Anonymous 401; foreign-team 403; removed member denied; instructor reads only | S3-F07-T04, API tests and unchanged persisted row/event assertions | Local PASS; no private payload in denials |
| S3-F07-AC05 | Two writers held behind a real PostgreSQL team-row barrier, one accepted version/event; stale retry 409; deterministic filtered task/event pages | S3-F07-T05/T06, API tests | Local PASS; no overwritten task or duplicate event |
| S3-F07-AC06 | Accessible create/assignment/status controls, persisted reload, pending/conflict and session isolation | S3-F07-T07 [component](../../../client/src/features/collaboration/Collaboration.test.tsx); S3-F07-T08 [browser/API/DB](../../../e2e/sprint3-collaboration.spec.ts) | Component + real browser PASS on GREEN source/run below |

Backend modules: [routes](../../../server/src/routes/tasks.ts),
[service](../../../server/src/services/taskService.ts), Prisma Task/TaskEvent,
[additive SQL](../../../server/prisma/migrations/20261125030000_f07_task_checkpoint/migration.sql).
UI: [TaskBoard](../../../client/src/features/collaboration/TaskBoard.tsx),
role-aware Team Tasks navigation and session-keyed integration in App.

Task events are server-attributed and have one unique `(taskId, version)`.
Their `changes` stores per-field `before`/`after` values; timestamps and actor
are server-derived. Creation records the initial values. A team-row lock
serializes accepted task writes; task update and event append share a DB
transaction. There is no task deletion endpoint or peer payload in task DTOs.

## 3. Executed environment, commands and limits

Local Codex-operated automated checks: Windows/Node, portable PostgreSQL 16.16,
dedicated disposable `course_pms_f07_test` on localhost. It is distinct from
the user's preview database and Cloud SQL; no production/reset operation.
The existing disposable-DB guard runs before every resetting integration case.

- `npm ci`, `npm --prefix server ci`, `npm --prefix client ci`.
- Dedicated test DB: `prisma migrate deploy` applied the baseline four
  migrations then the new additive `20261125030000_f07_task_checkpoint`.
- Local full server regression: **18 files / 179 tests PASS** (new API,
  UTF-16 unit checks, populated migration, retained Sprint 1/Lab 7/Sprint 2).
- Local client regression: **10 files / 54 tests PASS**, including nine task
  component cases: failed saves, pending actions, conflict reconciliation,
  session and team-switch pagination isolation, stale activity and read-only roles.
- Production builds and full CI/browser/Docker/startup outcomes are recorded
  by exact source in the PR; no unexecuted browser/system check is marked PASS here.

The SQL migration test builds a private transactional schema with actual
Sprint 1 -> F-04 -> F-05 -> F-06 migrations and populated users/team/member,
proposal, revoked session, milestone, saved submission/content version,
evaluation and publication. Before/after snapshots of all 11 existing tables
are identical after the task migration; no tasks/events are invented. New
Task/Event inserts work afterward. This is actual SQL, not an API journey
against that private upgraded schema; normal API tests use the full schema.

### Full GREEN source and retained CI

Runtime source `7df32f0a2fd10d8518360d2515163539e42edff2`:
[CI 45606339649](https://github.com/Magiciancat9/Course_management/actions/runs/45606339649)
**SUCCESS**, 25 Nov 2026, starting 11:38:42 UTC (18:38:42 Asia/Bangkok).

| Check | Actual result |
| --- | --- |
| Backend real DB/unit/migration regression | 18 files / 179 tests PASS |
| Frontend regression | 10 files / 54 tests PASS |
| Browser/API/DB | 8 Playwright workflows PASS, including S3-F07-T08 |
| Production server/client and Docker build | PASS |
| D2-SYS-T01 built-container health | PASS, 1164.56ms within 10,000ms; exact source identity + DB readiness + HTML PASS |
| F-07 screenshot | [Artifact 15017239188](https://github.com/Magiciancat9/Course_management/actions/runs/45606339649/artifacts/15017239188), downloaded outside Git and visually inspected |
| Startup JSON | [Artifact 15017961324](https://github.com/Magiciancat9/Course_management/actions/runs/45606339649/artifacts/15017961324) |

RED CI recorded 9 new failures and 163 retained baseline passes. GREEN keeps
the original nine API assertions and adds six UTF-16 and one actual populated
migration checks. No RED failure was hidden by dropping/skipping a case.

[PR #120](https://github.com/Magiciancat9/Course_management/pull/120) targets
`sprint-3-staging`. Its check results identify the latest head/tested merge ref,
including subsequent presentation/documentation edits. A pull-request merge
ref is separate from branch head and any future accepted main SHA. Container
timing is measured on CI Docker, not as Cloud Run cold-start timing.

## 4. Meaningful task workflow and selected evidence

S3-F07-T08 uses the real browser/API/DB: owning student adds teammate before
proposal approval, instructor approves, then owning student creates/assigns
a Sprint 3 task and uses keyboard buttons for TODO -> IN_PROGRESS -> DONE.
Reload retains assignee/status/version; activity shows the actual author and
version history. Direct foreign-team list/event/update requests must be 403,
with unchanged authorized saved state afterward.

CI retains `f07-program-<tested SHA>` / `f07-task-checkpoint.png` for 90 days.
It is synthetic, Codex-operated automated evidence, not personal student UAT
or production proof. Download outside public Git for the English assessed PDF;
record actual source/run/date/caption and preserve before artifact expiry.
Failed/skipped checks remain explicit in the PR/CI, not promoted to success.

## 5. Exact remaining F-07 work and release gates

| Remaining AC | Owner / item | Required next action / target |
| --- | --- | --- |
| S3-F07-AC07 | Magiciancat9 / #101 | Completed published milestone + own saved submission eligibility, due boundary tests; 5 Dec 2026 |
| S3-F07-AC08 | Magiciancat9 / #101 | Rating/comment bounds, no-self-rating and eligible teammate checks; 5 Dec 2026 |
| S3-F07-AC09 | Magiciancat9 / #101 | Own outgoing create/update/read, server author and unique pair persistence; 5 Dec 2026 |
| S3-F07-AC10 | Magiciancat9 / #101 | Confidentiality, direct other-student denials and instructor-only collection; 5 Dec 2026 |
| S3-F07-AC11 | Magiciancat9 / #101 | Real concurrent peer writes and unchanged data on rejected versions; 5 Dec 2026 |
| S3-F07-AC12 | Magiciancat9 / #101 | Peer UI eligibility/session states and confidential real persisted reload; 5 Dec 2026 |

Peer models/API/UI/tests are NOT IMPLEMENTED / NOT RUN in this checkpoint.
The reviewed full scope remains in F-07; no peer grade adjustment is invented.
If any task AC fails final verification/review, retain it as unresolved under
#98/#101 with a named action; do not claim full checkpoint completion.

Opposite-member review and merge to Sprint 3 staging remain required. The
driver does not self-approve/self-merge. #103 later integrates tested progress
with preserved Sprint 1/2 and records exact-main deployment/acceptance evidence.
Issue #98 remains open for review; the user handles closure. #97/#93 are not
closed or accepted by this task.
