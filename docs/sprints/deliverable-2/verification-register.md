# Complete AC and verification register - current #100 plus #101 candidate

**25 November 2026.** Evidence keys S2-CI, S3-CI and their exact SHA/run,
roles/environment/counts/limits are defined in the
[current version register](continuity-and-status.md). PASS below means actual
executed checks on those named sources; it does not mean final deployed RC
acceptance or that every planned test ID exists. This ledger retains all
59 Sprint 2/3/UI AC individually, plus the original ten Sprint 1 AC.

All feature contracts and shared policy were reviewed in PR #107 before
implementation. F-04/F-05/F-06 code reviews are #116/#117/#118, integrated main
#119; F-07 task review/merge is #120 on Sprint 3 staging. Peer/analytics
contracts were reviewed before code. Peer AC07-12 now have actual #101
candidate execution in the [peer ledger](../sprint-3/f07-peer-execution-evidence.md);
independent peer code review/integration remains pending. Analytics is NOT RUN.

## 1. Sprint 1 maintained baseline and Lab 7

All ten AC have current regression in S2-CI and S3-CI. Original identifiers
are retained, not renumbered to new features. The final integrated RC must
rerun these under #93/#103. U=unit, I=real API/PostgreSQL, UI=component,
E=real browser/API/DB; a mock UI check alone does not prove backend persistence.

| AC / feature | Actual case name prefix and file | Result / exact source responsibility |
| --- | --- | --- |
| AC-01 / F-01 | [API/DB](../../../server/tests/api.integration.test.ts): `TEST-01 / AC-01: verifies health check, valid Student/Instructor login, current-user identity, and credential hygiene (no passwordHash)` | Implemented; PASS S2-CI/S3-CI; final RC #93 pending |
| AC-02 / F-01 | [API/DB](../../../server/tests/api.integration.test.ts): `TEST-02 / AC-02: rejects invalid credentials and missing login fields without issuing a token` | Implemented; PASS S2-CI/S3-CI; final RC #93 pending |
| AC-03 / F-01 | [API/DB](../../../server/tests/api.integration.test.ts): `TEST-03 / AC-03: rejects unauthenticated requests to protected endpoints and revokes token upon logout` | Implemented; PASS S2-CI/S3-CI; final RC #93 pending |
| AC-04 / F-02 | [API/DB](../../../server/tests/api.integration.test.ts): `TEST-04 / AC-04: allows an unassigned student to create a project team and add an eligible teammate` | Implemented; PASS S2-CI/S3-CI; final RC #93 pending |
| AC-05 / F-02 | [API/DB](../../../server/tests/api.integration.test.ts): `TEST-05 / AC-05: enforces BR-01 by preventing a student from creating or joining a second active team in the same course` | Implemented; PASS S2-CI/S3-CI; final RC #93 pending |
| AC-06 / F-02 | [API/DB](../../../server/tests/api.integration.test.ts): `TEST-06 / AC-06: enforces BR-02 by rejecting adding a 4th member when course maxTeamSize (3) is reached` | Implemented; PASS S2-CI/S3-CI; final RC #93 pending |
| AC-07 / F-03 | [API/DB](../../../server/tests/api.integration.test.ts): `TEST-07 & TEST-08 / AC-07 & AC-08: validates proposal completeness (BR-04), saves and submits proposal, and blocks edits while SUBMITTED (BR-03) (workflow)` | Implemented; PASS S2-CI/S3-CI; final RC #93 pending |
| AC-08 / F-03 | [API/DB](../../../server/tests/api.integration.test.ts): `TEST-08 / AC-08: checks each completeness threshold and locks repeated submission (validation)` | Implemented; PASS S2-CI/S3-CI; final RC #93 pending |
| AC-09 / F-03 | [API/DB](../../../server/tests/api.integration.test.ts): `TEST-09 / AC-09: enforces BR-05 on Instructor review feedback and completes REVISION_REQUESTED -> SUBMITTED -> APPROVED lifecycle (workflow)` | Implemented; PASS S2-CI/S3-CI; final RC #93 pending |
| AC-10 / F-01-03 | [API/DB](../../../server/tests/api.integration.test.ts): `TEST-10 / AC-10: enforces BR-06 role and cross-team ownership restrictions without leaking private data (authorization)` | Implemented; PASS S2-CI/S3-CI; final RC #93 pending |

Additional actual suites: [domain rules](../../../server/tests/domain.unit.test.ts),
[routing/privacy](../../../server/tests/routing-privacy.unit.test.ts),
[Lab 7 unit](../../../server/tests/lab7-review.unit.test.ts),
[Lab 7 API](../../../server/tests/lab7-review.integration.test.ts),
[Lab 7 UI](../../../client/src/App.lab7Review.test.tsx),
[Lab 7 browser](../../../e2e/lab7-review.spec.ts),
[Sprint 1 browser](../../../e2e/sprint1.spec.ts) TEST-11/12/20 and the client
session/directory suites. Approval9/10 and revision19/20 after trim/UTF-16
are maintained rules, not the old 10/10 staging snapshot.

## 2. All 59 Sprint 2/3/UI AC

The contract test column preserves the planned IDs. The actual column
identifies real file/case or suite-name prefixes. S3-CI reruns all implemented
S1/S2/task cases together; S2-CI independently tests the deployed S2 source.
Peer cases are now separate named executable files. S3-PEER evidence remains
distinct from old S3-TASK results and pending accepted main/RC evidence.

### S2-F04 - [full reviewed contract](../sprint-2/f04-milestones.md)

| AC / criterion | Contract test IDs | Implemented / actual file and name | Run/result/version; remaining gate |
| --- | --- | --- | --- |
| S2-F04-AC01: Instructor creates a version-1 draft persisted and retrievable by a later request | S2-F04-T01 | YES; [I](../../../server/tests/milestones.integration.test.ts) `S2-F04-T01` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F04-AC02: Invalid text/weight/date/type/unknown fields reject without a row or mutation | S2-F04-T02, S2-F04-T03 | YES; [I](../../../server/tests/milestones.integration.test.ts) `S2-F04-T02/T03`; [U](../../../server/tests/milestones.unit.test.ts) boundary cases | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F04-AC03: Draft publishes only with a strictly future due date; resulting status/time/version persist | S2-F04-T04 | YES; [I](../../../server/tests/milestones.integration.test.ts) `S2-F04-T04`; [U](../../../server/tests/milestones.unit.test.ts) boundary cases | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F04-AC04: Instructor edits draft/published fields with expected version; past/future corrections preserve historical submission snapshots | S2-F04-T05, S2-F04-T06 | YES; [I](../../../server/tests/milestones.integration.test.ts) `S2-F04-T05/T06` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F04-AC05: Anonymous access is 401; students cannot mutate, discover drafts or bypass server authorization | S2-F04-T07 | YES; [I](../../../server/tests/milestones.integration.test.ts) `S2-F04-T07` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F04-AC06: Concurrent stale edit/publish cannot overwrite newer state or publish twice | S2-F04-T08 | YES; [I](../../../server/tests/milestones.integration.test.ts) `S2-F04-T08` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F04-AC07: Lists are course-scoped, published-only for students, deterministic/paginated; empty is not an error | S2-F04-T09 | YES; [I](../../../server/tests/milestones.integration.test.ts) `S2-F04-T09` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F04-AC08: UI create/edit/publish and student readback honor pending/error/empty/conflict states | S2-F04-T10, S2-F04-T11 | YES; [UI](../../../client/src/features/milestones/MilestoneManager.test.tsx) `S2-F04-T10a-g`; [E](../../../e2e/sprint2-milestones.spec.ts) `S2-F04-T11` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |

### S2-F05 - [full reviewed contract](../sprint-2/f05-submissions.md)

| AC / criterion | Contract test IDs | Implemented / actual file and name | Run/result/version; remaining gate |
| --- | --- | --- | --- |
| S2-F05-AC01: Eligible own-team student creates one saved version and reads it on a later request/reload | S2-F05-T01, S2-F05-T11 | YES; [I](../../../server/tests/submissions.integration.test.ts) `S2-F05-T01`; [E](../../../e2e/sprint2-submissions.spec.ts) `S2-F05-T11/T12` persisted version readback | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F05-AC02: Non-APPROVED proposal cannot submit; rejection leaves all saved state unchanged | S2-F05-T02 | YES; [I](../../../server/tests/submissions.integration.test.ts) `S2-F05-T02` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F05-AC03: Only a published same-course milestone can receive the submission | S2-F05-T03 | YES; [I](../../../server/tests/submissions.integration.test.ts) `S2-F05-T03` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F05-AC04: Required URLs/tag and all type/length/extra-field rules are enforced server-side | S2-F05-T04 | YES; [I](../../../server/tests/submissions.integration.test.ts) `S2-F05-T04`; [U](../../../server/tests/submissions.unit.test.ts) validation/late boundary cases | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F05-AC05: Deadline equality is on time; after-deadline submission succeeds with LATE; client cannot forge timestamps/flag | S2-F05-T05 | YES; [I](../../../server/tests/submissions.integration.test.ts) `S2-F05-T05`; [U](../../../server/tests/submissions.unit.test.ts) validation/late boundary cases | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F05-AC06: Updates create immutable versions; prior content/grades remain historical and the new version is ungraded | S2-F05-T06 | YES; [I](../../../server/tests/submissions.integration.test.ts) `S2-F05-T06`; [F-06 I](../../../server/tests/grading.integration.test.ts) `S2-F06-T06/T07/T08` actual published-version handoff | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F05-AC07: Anonymous, instructor-write and foreign-team access are denied without data leakage/mutation | S2-F05-T07 | YES; [I](../../../server/tests/submissions.integration.test.ts) `S2-F05-T07` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F05-AC08: Concurrent/retried stale writes cannot create duplicate logical rows or overwrite versions | S2-F05-T08 | YES; [I](../../../server/tests/submissions.integration.test.ts) `S2-F05-T08` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F05-AC09: Historical deadline snapshots and legacy unknowns stay honest during migration/deadline edits | S2-F05-T09 | YES; [I](../../../server/tests/submissions.integration.test.ts) `S2-F05-T09`; [SQL](../../../server/tests/submissions-migration.integration.test.ts) `S2-F05-T09/AC09`; concurrent deadline snapshot case in API file | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F05-AC10: UI pending/error/conflict/session boundaries preserve own draft and prevent foreign/stale state exposure | S2-F05-T10, S2-F05-T12 | YES; [UI](../../../client/src/features/submissions/SubmissionWorkspace.test.tsx) `S2-F05-T10/T12`; [E](../../../e2e/sprint2-submissions.spec.ts) `S2-F05-T11/T12` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |

### S2-F06 - [full reviewed contract](../sprint-2/f06-grading.md)

| AC / criterion | Contract test IDs | Implemented / actual file and name | Run/result/version; remaining gate |
| --- | --- | --- | --- |
| S2-F06-AC01: Instructor saves a valid draft evaluation of actual current submitted content and retrieves it | S2-F06-T01 | YES; [I](../../../server/tests/grading.integration.test.ts) `S2-F06-T01` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F06-AC02: Score 0/100 accepted; out-of-range/fraction/string/null rejected without mutation | S2-F06-T02 | YES; [I](../../../server/tests/grading.integration.test.ts) `S2-F06-T02`; [U](../../../server/tests/grading.unit.test.ts) score/feedback validation | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F06-AC03: Feedback trim/type/length and unknown-field checks are enforced independently of UI | S2-F06-T03 | YES; [I](../../../server/tests/grading.integration.test.ts) `S2-F06-T03`; [U](../../../server/tests/grading.unit.test.ts) score/feedback validation | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F06-AC04: Explicit publication persists correct version, score, feedback, actor and time; duplicate publication is not duplicated | S2-F06-T04 | YES; [I](../../../server/tests/grading.integration.test.ts) `S2-F06-T04` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F06-AC05: Students see only their team's published data, never a draft or foreign grade; student writes and anonymous access denied | S2-F06-T05 | YES; [I](../../../server/tests/grading.integration.test.ts) `S2-F06-T05` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F06-AC06: A correction draft preserves the previous publication until republished; immutable history remains inspectable | S2-F06-T06 | YES; [I](../../../server/tests/grading.integration.test.ts) `S2-F06-T06` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F06-AC07: A new content version is ungraded and stale/concurrent publication cannot grade the wrong work | S2-F06-T07, S2-F06-T08 | YES; [I](../../../server/tests/grading.integration.test.ts) `S2-F06-T07/T08` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F06-AC08: UI draft/publish/error/conflict states prevent duplicate actions and false publication | S2-F06-T09 | YES; [UI](../../../client/src/features/grading/GradingConsole.test.tsx) `S2-F06-T09a-e` draft/publish, unsaved input and stale content reconciliation | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |
| S2-F06-AC09: End-to-end instructor publication and authorized student reload reflect actual persisted current-version grade | S2-F06-T10, S2-F06-T11 | YES; [I](../../../server/tests/grading.integration.test.ts) `S2-F06-T11`; [SQL](../../../server/tests/grading-migration.integration.test.ts) `S2-F06-T11/AC09`; [E](../../../e2e/sprint2-grading.spec.ts) `S2-F06-T10` | PASS S2-CI and S3-CI; reviewed/deployed S2-MAIN; #97 accepted tag/authenticated evidence pending |

### S3-F07 - [full reviewed contract](../sprint-3/f07-collaboration.md)

| AC / criterion | Contract test IDs | Implemented / actual file and name | Run/result/version; remaining gate |
| --- | --- | --- | --- |
| S3-F07-AC01: Approved-team member creates a task with eligible assignee/sprint and retrieves persisted state | S3-F07-T01 | YES; [I](../../../server/tests/collaboration.integration.test.ts) `S3-F07-T01` | PASS S3-CI; reviewed #120 / S3-TASK staging; final main RC pending |
| S3-F07-AC02: Task validation, same-course published context and non-approved write prerequisite are enforced | S3-F07-T02 | YES; [I](../../../server/tests/collaboration.integration.test.ts) `S3-F07-T02`; [U](../../../server/tests/collaboration.unit.test.ts) UTF-16 bounds; [SQL](../../../server/tests/collaboration-migration.integration.test.ts) `S3-F07-T02-M` | PASS S3-CI; reviewed #120 / S3-TASK staging; final main RC pending |
| S3-F07-AC03: Any allowed status transition/reopen persists and appends exactly one attributed event per accepted version | S3-F07-T03 | YES; [I](../../../server/tests/collaboration.integration.test.ts) `S3-F07-T03` | PASS S3-CI; reviewed #120 / S3-TASK staging; final main RC pending |
| S3-F07-AC04: Foreign-team task/event access, anonymous access and instructor task mutations are denied | S3-F07-T04 | YES; [I](../../../server/tests/collaboration.integration.test.ts) `S3-F07-T04` | PASS S3-CI; reviewed #120 / S3-TASK staging; final main RC pending |
| S3-F07-AC05: Stale/concurrent task updates cannot overwrite or duplicate events; filters/pagination are correct | S3-F07-T05, S3-F07-T06 | YES; [I](../../../server/tests/collaboration.integration.test.ts) `S3-F07-T05/T06` | PASS S3-CI; reviewed #120 / S3-TASK staging; final main RC pending |
| S3-F07-AC06: Accessible task create/assign/transition/reload works as meaningful checkpoint progress with session isolation | S3-F07-T07, S3-F07-T08 | YES; [UI](../../../client/src/features/collaboration/Collaboration.test.tsx) suite `S3-F07-T07/AC06: accessible task board and session boundaries`, including `reconciles conflict version while retaining all typed fields and explicitly saving again`; [E](../../../e2e/sprint3-collaboration.spec.ts) `S3-F07-T08/AC06` | PASS S3-CI; reviewed #120 / S3-TASK staging; final main RC pending |
| S3-F07-AC07: Peer writes require the defined completed milestone and own saved submission | S3-F07-T09 | YES; [API/DB](../../../server/tests/peer-evaluation.integration.test.ts) `S3-F07-T09/AC07`; [U](../../../server/tests/peer-evaluation.unit.test.ts) due-1/equal/+1; [SQL](../../../server/tests/peer-evaluation-migration.integration.test.ts) `S3-F07-T09-M` | PASS S3-PEER candidate (peer ledger); independent implementation review/staging integration and final accepted main/UAT pending |
| S3-F07-AC08: Rating/comment bounds and no-self-rating/eligible-teammate rules are enforced server-side | S3-F07-T10 | YES; [API/DB](../../../server/tests/peer-evaluation.integration.test.ts) `S3-F07-T10/AC08`; [U](../../../server/tests/peer-evaluation.unit.test.ts) rating/comment/UTF-16/ID bounds | PASS S3-PEER candidate (peer ledger); independent implementation review/staging integration and final accepted main/UAT pending |
| S3-F07-AC09: Author can save/update/read only their own outgoing pair; uniqueness and history metadata persist | S3-F07-T11 | YES; [API/DB](../../../server/tests/peer-evaluation.integration.test.ts) `S3-F07-T11/AC09`, `S3-F07-T11/T12`; [E](../../../e2e/sprint3-peer-evaluation.spec.ts) `S3-F07-T15/AC12` | PASS S3-PEER candidate (peer ledger); independent implementation review/staging integration and final accepted main/UAT pending |
| S3-F07-AC10: Other students cannot read incoming/others' peer details; instructor reads are authorized; no DTO leak | S3-F07-T12 | YES; [API/DB](../../../server/tests/peer-evaluation.integration.test.ts) `S3-F07-T12/AC10` all three route/method auth/role/ownership, removed membership, instructor and general DTO checks; [E](../../../e2e/sprint3-peer-evaluation.spec.ts) teammate/foreign denial | PASS S3-PEER candidate (peer ledger); independent implementation review/staging integration and final accepted main/UAT pending |
| S3-F07-AC11: Concurrent peer updates preserve one pair and expected-version semantics without partial writes | S3-F07-T13 | YES; [API/DB](../../../server/tests/peer-evaluation.integration.test.ts) `S3-F07-T13/AC11` barrier-controlled create/update (versions0/1), one winner/409 and independent readback | PASS S3-PEER candidate (peer ledger); independent implementation review/staging integration and final accepted main/UAT pending |
| S3-F07-AC12: Peer UI reflects actual eligibility/save/error states and reloads confidential persisted outgoing feedback | S3-F07-T14, S3-F07-T15 | YES; [UI](../../../client/src/features/collaboration/PeerEvaluation.test.tsx) `S3-F07-T14/AC12` nine initial-runtime cases plus follow-up initial-catalogue retry case; [E](../../../e2e/sprint3-peer-evaluation.spec.ts) `S3-F07-T15/AC12` real save/update/reload/role-denial/instructor read | PASS S3-PEER candidate (peer ledger); independent implementation review/staging integration and final accepted main/UAT pending |

### S3-F08 - [full reviewed contract](../sprint-3/f08-analytics-export.md)

| AC / criterion | Contract test IDs | Implemented / actual file and name | Run/result/version; remaining gate |
| --- | --- | --- | --- |
| S3-F08-AC01: Existing-course analytics returns an internally consistent, correctly scoped snapshot and actual as-of time | S3-F08-T01 | Planned I/U: `server/tests/analytics.integration.test.ts`, `analytics.unit.test.ts`; planned UI: `client/src/features/analytics/AnalyticsDashboard.test.tsx`; E per contract. These feature cases do not exist. | NOT IMPLEMENTED / NOT RUN; no actual test/name/result/accepted version. martinvadre, #102, 7 Dec; exact action in finish plan |
| S3-F08-AC02: Proposal-state counts include NONE, partition teams exactly and exclude other courses | S3-F08-T02 | Planned I/U: `server/tests/analytics.integration.test.ts`, `analytics.unit.test.ts`; planned UI: `client/src/features/analytics/AnalyticsDashboard.test.tsx`; E per contract. These feature cases do not exist. | NOT IMPLEMENTED / NOT RUN; no actual test/name/result/accepted version. martinvadre, #102, 7 Dec; exact action in finish plan |
| S3-F08-AC03: Milestone rates use the specified full denominator and current logical submissions; zero denominator is null, not a misleading 0% | S3-F08-T03 | Planned I/U: `server/tests/analytics.integration.test.ts`, `analytics.unit.test.ts`; planned UI: `client/src/features/analytics/AnalyticsDashboard.test.tsx`; E per contract. These feature cases do not exist. | NOT IMPLEMENTED / NOT RUN; no actual test/name/result/accepted version. martinvadre, #102, 7 Dec; exact action in finish plan |
| S3-F08-AC04: Ungraded queue ignores drafts and superseded-version grades; late/unknown snapshots remain distinct | S3-F08-T04 | Planned I/U: `server/tests/analytics.integration.test.ts`, `analytics.unit.test.ts`; planned UI: `client/src/features/analytics/AnalyticsDashboard.test.tsx`; E per contract. These feature cases do not exist. | NOT IMPLEMENTED / NOT RUN; no actual test/name/result/accepted version. martinvadre, #102, 7 Dec; exact action in finish plan |
| S3-F08-AC05: Flag reasons and exact-deadline boundaries are correct, with each team counted once | S3-F08-T05 | Planned I/U: `server/tests/analytics.integration.test.ts`, `analytics.unit.test.ts`; planned UI: `client/src/features/analytics/AnalyticsDashboard.test.tsx`; E per contract. These feature cases do not exist. | NOT IMPLEMENTED / NOT RUN; no actual test/name/result/accepted version. martinvadre, #102, 7 Dec; exact action in finish plan |
| S3-F08-AC06: Anonymous/student access to analytics/export is denied; missing/invalid context is safe and no confidential fields leak | S3-F08-T06 | Planned I/U: `server/tests/analytics.integration.test.ts`, `analytics.unit.test.ts`; planned UI: `client/src/features/analytics/AnalyticsDashboard.test.tsx`; E per contract. These feature cases do not exist. | NOT IMPLEMENTED / NOT RUN; no actual test/name/result/accepted version. martinvadre, #102, 7 Dec; exact action in finish plan |
| S3-F08-AC07: CSV row/column/order/encoding/escaping and empty/missing/zero-grade behavior match the schema | S3-F08-T07, S3-F08-T08 | Planned I/U: `server/tests/analytics.integration.test.ts`, `analytics.unit.test.ts`; planned UI: `client/src/features/analytics/AnalyticsDashboard.test.tsx`; E per contract. These feature cases do not exist. | NOT IMPLEMENTED / NOT RUN; no actual test/name/result/accepted version. martinvadre, #102, 7 Dec; exact action in finish plan |
| S3-F08-AC08: Risky spreadsheet text is neutralized without mutating stored data; named consumer import checks support any compatibility claim | S3-F08-T09 | Planned I/U: `server/tests/analytics.integration.test.ts`, `analytics.unit.test.ts`; planned UI: `client/src/features/analytics/AnalyticsDashboard.test.tsx`; E per contract. These feature cases do not exist. | NOT IMPLEMENTED / NOT RUN; no actual test/name/result/accepted version. martinvadre, #102, 7 Dec; exact action in finish plan |
| S3-F08-AC09: Concurrent submission/grade updates cannot produce mixed-version grades or inconsistent aggregate/export snapshots | S3-F08-T10 | Planned I/U: `server/tests/analytics.integration.test.ts`, `analytics.unit.test.ts`; planned UI: `client/src/features/analytics/AnalyticsDashboard.test.tsx`; E per contract. These feature cases do not exist. | NOT IMPLEMENTED / NOT RUN; no actual test/name/result/accepted version. martinvadre, #102, 7 Dec; exact action in finish plan |
| S3-F08-AC10: Instructor dashboard/export UI uses real data with loading/empty/error/session safety and persisted cross-feature evidence | S3-F08-T11, S3-F08-T12 | Planned I/U: `server/tests/analytics.integration.test.ts`, `analytics.unit.test.ts`; planned UI: `client/src/features/analytics/AnalyticsDashboard.test.tsx`; E per contract. These feature cases do not exist. | NOT IMPLEMENTED / NOT RUN; no actual test/name/result/accepted version. martinvadre, #102, 7 Dec; exact action in finish plan |

### UIR - [complete UI contract](../../ui-refresh-spec.md)

| AC / criterion | Contract test IDs | Implemented / actual file and case or gap | Run/result/version; remaining gate |
| --- | --- | --- | --- |
| UIR-AC01: Production login contains no Quick Fill controls, demo identities or hard-coded demo password filling | UIR-T01 | YES; [UI](../../../client/src/App.uiRefresh.test.tsx) `UIR-T01/T02`; real login in E2E suites | PASS scripted UI absence/auth checks, S2/S3-CI; final visual record remains AC10 |
| UIR-AC02: Real email/password authentication, validation, pending, errors, logout/revocation and current-user identity remain functional | UIR-T02, UIR-T03 | YES; [UI](../../../client/src/App.test.tsx) login pending/error; [API](../../../server/tests/api.integration.test.ts) TEST-01/02/03/14/19; [E](../../../e2e/sprint1.spec.ts) TEST-11/20 | PASS actual auth/logout/revocation; dedicated UIR-T03 filename not created; equivalent named cases identified |
| UIR-AC03: Desktop/compact/mobile layouts and 200% zoom remain readable and operable without body overflow | UIR-T04 | UI IMPLEMENTED; VERIFICATION PARTIAL; No actual UIR-T04 case/manual 1440/1024/375 + 200% zoom record found; existing desktop screenshots are narrower evidence | NOT VERIFIED for full viewport/zoom/body-overflow criterion; martinvadre + Magiciancat9, #103/#100, 28 Nov |
| UIR-AC04: Role-aware navigation points to real authorized content; user-visible copy avoids unnecessary API/BR implementation jargon | UIR-T05 | UI IMPLEMENTED; VERIFICATION PARTIAL; [UI](../../../client/src/App.uiRefresh.test.tsx) UIR-T05/T08; [task E](../../../e2e/sprint3-collaboration.spec.ts) real Team Tasks navigation | Role-aware implemented destinations PASS; whole-product user-copy/final navigation inspection pending #103/#100, 28 Nov |
| UIR-AC05: Team creation/add-member/capacity and proposal save/submit/review flows retain their existing rules and real persistence | UIR-T06 | YES; [E](../../../e2e/sprint1.spec.ts) TEST-11/12; [API](../../../server/tests/api.integration.test.ts) TEST-04-10/15-23; [L7 E](../../../e2e/lab7-review.spec.ts) L7-T05/T06 | PASS maintained real team/proposal persistence/rules on S2/S3-CI; dedicated UIR-T06 case name not created |
| UIR-AC06: Foreign-team/private/session isolation remains correct even with delayed responses or account switching | UIR-T07 | YES; [isolation](../../../client/src/App.sessionIsolation.test.tsx), [session reviews](../../../client/src/App.sessionReview.test.tsx), [directory privacy](../../../client/src/App.directoryPrivacy.test.tsx); API TEST-10/23; feature session cases | PASS scoped component-deferred response and backend-negative checks, S2/S3-CI; no new deployed race injection claim |
| UIR-AC07: Labels, focus, keyboard/menu/status semantics and measured contrast meet the planned targets | UIR-T08 | UI IMPLEMENTED; VERIFICATION PARTIAL; [UI](../../../client/src/App.uiRefresh.test.tsx) UIR-T05/T08 Escape/menu; [task E](../../../e2e/sprint3-collaboration.spec.ts) keyboard status actions | Named keyboard/focus/label checks PASS; full rendered contrast and whole-product keyboard/zoom inspection NOT RUN; #103/#100 by 28 Nov |
| UIR-AC08: Loading/empty/error/pending/conflict/success states use true server results and preserve appropriate drafts | UIR-T09 | YES for scripted state checks; [milestone UI](../../../client/src/features/milestones/MilestoneManager.test.tsx) S2-F04-T10a-g; [submission UI](../../../client/src/features/submissions/SubmissionWorkspace.test.tsx) S2-F05-T10/T12; [grading UI](../../../client/src/features/grading/GradingConsole.test.tsx) S2-F06-T09a-e; [task UI](../../../client/src/features/collaboration/Collaboration.test.tsx) S3-F07-T07 suite | PASS actual pending/empty/error/conflict/draft/session checks, S2/S3-CI; original UIR-T09 name not separately created |
| UIR-AC09: Preserve the separately approved/versioned Lab 7 BR-05 rule: approval minimum10, revision minimum20 after trim/UTF-16 (the original pre-approval design used 10 for both) | UIR-T10 | YES, separately approved maintenance; [UI](../../../client/src/App.lab7Review.test.tsx) L7-T06; [API](../../../server/tests/lab7-review.integration.test.ts) L7-T01/T05; [U](../../../server/tests/lab7-review.unit.test.ts); [E](../../../e2e/lab7-review.spec.ts) L7-T05/T06 | PASS approval10/revision20 trim/UTF-16 and state precedence, S2/S3-CI; pre-approval 10/10 history preserved, not restored |
| UIR-AC10: Integrated desktop/mobile visual and functional evidence identifies the actual commit and distinguishes implemented versus planned features | UIR-T11, UIR-T12 | UI IMPLEMENTED; VERIFICATION PARTIAL; Actual desktop F-05/F-06/F-07 artifacts in version/feature ledgers; original browser journeys plus current feature E2E | Desktop real-source evidence and functional regressions exist; full mobile/final visual acceptance NOT RUN, #103/#100 by 28 Nov |

## 3. NFR and system measurements

| Requirement/check | Actual executable/method | Actual result and boundary |
| --- | --- | --- |
| NFR-01 authentication | API TEST-03/14/19; each implemented feature's anonymous/expired-session cases; no private payload | Current implemented route checks PASS S2/S3-CI; peer routes PASS in S3-PEER; F-08 remains unimplemented/unverified |
| NFR-02 role/ownership | TEST-10/23; S2-F04-T07, S2-F05-T07/T12, S2-F06-T05, S3-F07-T04/T08; unchanged DB/event assertions | Current implemented routes PASS; this is not a global 100% claim for missing analytics routes; peer S3-F07-T12/T15 PASS in S3-PEER |
| NFR-03 credentials | API TEST-01/02/19 and auth bootstrap checks; bcrypt seed/auth source; UI Quick Fill absence and private env templates | Scoped hash/DTO/login/required-secret checks PASS. No full Git-history zero-secrets certification or production password disclosure is claimed |
| NFR-04 persistence | Original and feature API/DB readback, real browser reload, actual populated SQL upgrade and row/version/race assertions | Current implemented behavior PASS S2/S3-CI; final deployed RC persistence and missing F-08 remain explicit gaps; peer persistence/migration PASS in S3-PEER |
| NFR-05 / D2-SYS-T01 | [measurement](../../../deploy/tests/test_startup_readiness.py): monotonic before `docker run` to valid health200, includes creation overhead/excludes build/download; checks baked source, DB ready and built HTML | PASS S2-CI 1214.25ms and S3-CI 510.48ms <=10,000ms; exact image/host/UTC/source JSON retained in CI. These are CI images, not Cloud Run cold-start measurements |
| D2-CONT-05 / upgrade | [S2 full SQL](../../../server/tests/sprint2-release-migration.integration.test.ts); [task populated SQL](../../../server/tests/collaboration-migration.integration.test.ts) | PASS real isolated transactional-schema upgrade; 11 existing table snapshots retained after F-07 SQL. Not an API journey against that private schema or a live migration |
| Production post-deploy smoke | Main run45592525515 / fresh bounded public readback in version register | Public health/source/ready/HTML PASS; authenticated login/me/courses/logout SKIP/not configured. No authenticated business acceptance inferred |

## 4. Uncovered requirements and final gates

FR-10 / F-07 peer AC07-12 and BR-08 no-self-rating now have actual S3-PEER
candidate results; independent peer review/integration and final release/UAT
remain #101's acceptance gates (original target5 Dec). FR-11/12 /
F-08 AC01-10 (including CSV consumer compatibility/security and coherent
concurrent snapshots) remain #102, target7 Dec. UI AC03/04/07/10 have the
specific unverified portions above; they are not silently declared complete.

The [exact finish plan](continuity-and-status.md#5-exact-remaining-work-risk-and-completion-plan)
records each missing AC/measurement/debt, owner/dependency/next action/date,
including examinations1-11 Dec and final13 Dec. #97 authenticated release/tag,
#93 original critical journey and #103 actual integrated main/deployed RC
remain pending. #100's final snapshot must reconcile those real results before
#104 PDF freeze. Retain failures/SKIP and historical RT-07 limitations verbatim
in scope; contract drafting or documentation review does not execute a test.

Only F-08's ten AC remain unimplemented. Independent peer review/integration,
personal UAT and accepted final release are not claimed.
