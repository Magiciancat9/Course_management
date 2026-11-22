# Deliverable 2 continuity, status and finish record — v1.0

**Recorded:** 22 Nov 2026; documentation-only phase. Author/driver
`Magiciancat9`; independent review pending. Work: [#93](https://github.com/Magiciancat9/Course_management/issues/93)
and [#100](https://github.com/Magiciancat9/Course_management/issues/100).

This is the checkpoint record to update with actual candidate evidence, not a
claim that planned Sprint 2/3 features, tests, reviews or release exist.

## 1. Version register

| Identity | Verified meaning / gap |
| --- | --- |
| Original Sprint 1 | `v1.0.0-sprint1` / `5979f5870e8e28277996dc3045cbf4be5f7236ad`; CoursePMS F-01–03 |
| Accepted Lab 6 correction | `aeb804ea5bc667399b00cf54df10046a6ded46e0`, [release PR #76](https://github.com/Magiciancat9/Course_management/pull/76) |
| Accepted serving revision | `course-pms-00009-mk2` in [acceptance record](https://github.com/Magiciancat9/Course_management/blob/6916f29bbd97b38e9a86a4284c2e0a0609f3ebbe/docs/labs/lab-06/coursepms-acceptance-confirmed.md) |
| Main inspected for this draft | `aeb804ea5bc667399b00cf54df10046a6ded46e0`; no new D2 release inferred |
| Document branch | `docs/d2-sprint2-3-contracts`, based on accepted main; contract/UI plan source only |
| Accepted Sprint 2 release | NOT YET AVAILABLE; preserve its own reviewed main/tag when #97 completes |
| Submitted integrated RC / deployed revision | NOT YET AVAILABLE; fill from actual #103 source/CI/image/revision checks |

The local extra-hyphen tag `v1.0.0-sprint-1` belongs to fastTrack and is not
CoursePMS evidence. The later Lab 6 document staging and Lab 7 preparation
commits are not automatically the current runtime or the future submitted RC.

## 2. Part A change / defect register

| ID / source | Affected scope | Accepted decision / status | Fix/release and retest evidence |
| --- | --- | --- | --- |
| [#71](https://github.com/Magiciancat9/Course_management/issues/71), fastTrack Lab 6 | F-03 / BR-06, stale private editor across account switch | Accepted Major defect; CLOSED | #72/#73 → #76 / aeb804e; targeted retest and accepted declaration, with RT-07 replay boundary preserved |
| [#74](https://github.com/Magiciancat9/Course_management/issues/74), directory privacy | BR-06, foreign proposal metadata | Accepted Major defect; CLOSED; roster-only policy | aeb804e; targeted RT-03/08 PASS in recorded scope |
| [#75](https://github.com/Magiciancat9/Course_management/issues/75), protected API routing | F-01 / AC-03, unsupported API served SPA HTML | Accepted Minor defect; CLOSED | aeb804e; RT-09 PASS; unsupported protected collection remains JSON 401/404 |
| Lab 5 delivery/setup history | NFR-04/05, Docker/CI/GCP/migrations | Infrastructure exists; reconcile stale documentation | Existing init migration, migrate:deploy and delivery pipeline; no new D2 deploy/check executed in this phase |
| [CR-L7-01 / #85](https://github.com/Magiciancat9/Course_management/issues/85) | FR-05 / BR-05, revision feedback 10→20 | User reports sent to TA; actual approval PENDING | Preparation [PR #105](https://github.com/Magiciancat9/Course_management/pull/105), not implementation; existing minimum 10 remains for both decisions |
| UIR / [#106](https://github.com/Magiciancat9/Course_management/issues/106) | Presentation, Quick Fill removal | User requested design/removal; specifically deferred implementation | [UI plan](../../ui-refresh-spec.md) is proposed; no JSX/CSS/test changes or new rendered screen evidence |

Historical [release evidence](https://github.com/Magiciancat9/Course_management/blob/6916f29bbd97b38e9a86a4284c2e0a0609f3ebbe/docs/labs/lab-06/release-evidence.md)
retains the missed pre-deployment notice and optional authenticated-smoke
SKIP. RT-07 was evidence inspection/isolated replay, not a deployed race or
full suite rerun. Existing AI-operated observations are not personal student
execution. Do not erase these limitations or turn unrelated fastTrack
exercise totals into CoursePMS results.

## 3. Sprint 1 continuity demonstration to execute on the RC

| Check ID | Candidate journey / direct check | Required evidence / current status |
| --- | --- | --- |
| D2-CONT-01 | Real student/instructor login, current identity, logout and revoked-token denial | Existing TEST-01/02/03/14/19 plus selected E2E; candidate SHA/results NOT RUN |
| D2-CONT-02 | Own team create/add, one-team-per-course and capacity conflict | TEST-04/05/06/15/21/22 and real persisted roster; NOT RUN on RC |
| D2-CONT-03 | Draft save/retrieve, completeness, submit, revision/resubmit/approval | TEST-07/08/09 and `e2e/sprint1.spec.ts` TEST-11; exact candidate outcome PENDING |
| D2-CONT-04 | Student cannot review or read/write foreign proposal; roster-only and protected JSON routing | TEST-10/23, routing/privacy and session suites; direct API/saved-state evidence PENDING |
| D2-CONT-05 | Migration and cross-feature additions retain saved Sprint 1 data and session boundaries | Populated upgrade fixture, before/after IDs/counts/authorized readback; NOT RUN |

Use synthetic agreed fixtures and a disposable DB for resets. Capture role,
starting state, expected/actual, command/steps, time, exact SHA/revision and
pass/fail/skip. `server/tests/api.integration.test.ts`,
`server/tests/domain.unit.test.ts`, `server/tests/routing-privacy.unit.test.ts`,
the existing client session/privacy suites and `e2e/sprint1.spec.ts` are real
baseline files; planned new tests are a different claim.

Preparation CI [45001981946](https://github.com/Magiciancat9/Course_management/actions/runs/45001981946)
passed on Lab 7 document/CI-routing head `dfe5d25...` with the unchanged
baseline implementation. That supports preparation history only, not the
nonexistent new F-04–08 implementation or submitted D2 candidate.

## 4. Parts B/C feature completion status

| Feature / AC | Contract status | Implementation | Executed verification / accepted release | Next owner/action |
| --- | --- | --- | --- | --- |
| F-04 / S2-F04-AC01–08 | Proposed v1.0; review pending | No operational workflow | NOT RUN / NONE | martinvadre: accept/revise contract, tests-first implementation, #94 |
| F-05 / S2-F05-AC01–10 | Proposed v1.0; review pending | No operational workflow | NOT RUN / NONE | Magiciancat9: reviewed F-04 interface + contract, #95 |
| F-06 / S2-F06-AC01–09 | Proposed v1.0; review pending | No operational workflow | NOT RUN / NONE | martinvadre: F-05 + grading contract review, #96 |
| F-07 tasks / S3-F07-AC01–06 | Proposed v1.0; review pending | Not implemented | NOT RUN / NONE | Magiciancat9: first meaningful checkpoint workflow, #98 |
| F-07 peer / S3-F07-AC07–12 | Proposed v1.0; review pending | Not implemented | NOT RUN / NONE | Magiciancat9: completion/privacy/rating policy review, #101 |
| F-08 / S3-F08-AC01–10 | Proposed v1.0; review pending | Not implemented | NOT RUN / NONE | martinvadre: contract #99, implementation #102 |
| UIR / UIR-AC01–10 | Original spec accepted via PR #107; ownership-only update in UIR v1.1 | Existing Bootstrap/Quick Fill still present | New UIR checks NOT RUN | martinvadre: implement #106; Magiciancat9 independently reviews; user reassigned 22 Nov 2026 |

Prepared Milestone/MilestoneSubmission tables do not make F-04–06 complete.
The F-08 contract does not satisfy implemented Sprint 3 progress. Keep all
required Sprint 2 features; no scope transfer to Sprint 3 is approved here.

## 5. Parts D/E remaining gates and evidence

- Review complete feature/UI contracts and the shared decision table before
  implementation. Keep the actual PR reviewer/date/accepted revision.
- Convert the [verification register](verification-register.md) from planned
  IDs to actual files/test names/executed results as code arrives; list gaps.
- [#97](https://github.com/Magiciancat9/Course_management/issues/97): full
  reviewed Sprint 2 release, all AC, relevant regression and identifiable tag.
- [#103](https://github.com/Magiciancat9/Course_management/issues/103): coherent
  main RC with Sprint 1, complete Sprint 2 and tested Sprint 3 progress; Lab 7
  included only if approved/reviewed/tested. Source→CI→image→GCP revision and
  post-deploy critical journey/persistence/access checks are still pending.
- [#100](https://github.com/Magiciancat9/Course_management/issues/100) remains
  open for final document/matrix/finish-plan reconciliation; drafting this
  package is partial progress, not final acceptance.
- [#104](https://github.com/Magiciancat9/Course_management/issues/104): embed
  complete Parts A–E documents and selected real evidence in one PDF. Two
  meaningful Sprint 2 demonstrations, one implemented Sprint 3 workflow,
  original continuity, actual domain/access test excerpts and two substantive
  Issue/PR/staging/release chains are required. Both members inspect the exact
  PDF; user submits through LEB2 and keeps the real receipt outside Git.

## 6. Exact remaining-work / target plan

Targets are proposed scheduling, not assertions of completion. Update per AC
with actual achieved/tested SHA, missing work/defect and next action.

| Work / exact AC scope | Owner | Dependency / next action | Proposed target |
| --- | --- | --- | --- |
| F-04 AC01–08 | martinvadre | Reviewed contract → real milestone workflow/tests | 25 Nov |
| F-05 AC01–10 | Magiciancat9 | F-04 interface/integration + reviewed contract → versioned submission | 26 Nov |
| F-06 AC01–09 | martinvadre | F-05 + review → draft/published version-bound grading | 26 Nov |
| Sprint 2 acceptance | Magiciancat9 | All F-04–06 AC/CI/reviews and integration | 27 Nov |
| F-07 AC01–06 | Magiciancat9 | Reviewed complete F-07 contract/F-05 context → tested task lifecycle | 27 Nov |
| Full F-08 contract | martinvadre | Review this v1.0, including data/CSV policy | 24 Nov |
| UIR AC01–10 | martinvadre | Reviewed UI plan → implementation and preserved-behavior verification; Magiciancat9 reviews code/UI | 26 Nov / align with integrated feature availability |
| RC/traceability/readiness | martinvadre + Magiciancat9 | Integrated actual progress → full candidate checks, deploy and source reconciliation | 28 Nov |
| D2 assessed PDF/submission | Magiciancat9; martinvadre review | All required material + real exact-version evidence | 29 Nov, 23:59 Asia/Bangkok |
| F-07 AC07–12 and any unachieved task AC | Magiciancat9 | Completed milestone/submission + reviewed peer contract → confidential evaluation | 5 Dec |
| F-08 AC01–10 | martinvadre | F-03/05/06/07 integrated data + reviewed contract | 7 Dec |
| Final gaps/UAT retests/video/release | Both; martinvadre release driver | Exact missing AC/defect dispositions, full regression/acceptance and final evidence | By 13 Dec; reserve 1–11 Dec examination time for bounded work |

## 7. Review history

| Revision | Status |
| --- | --- |
| v1.0, 22 Nov 2026 | Baseline/status/finish-plan draft; independent review pending; no candidate execution, feature acceptance, deployment or submission claimed |
