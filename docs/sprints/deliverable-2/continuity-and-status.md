# Deliverable 2 current status, release identity and finish plan

**Snapshot:** 25 November 2026, 19:09:52 Asia/Bangkok (12:09:52 UTC).
**Author:** Magiciancat9; independent documentation reviewer: martinvadre.
**Scope:** #100 reconciliation of reviewed source, actual verification and
remaining acceptance work. This source package is not a submitted assessed PDF.
Later releases must update the final snapshot instead of reusing these results.

## 1. Evidence keys and version boundaries

| Key | Exact source / integration | Actual evidence and limits |
| --- | --- | --- |
| S1-ORIGINAL | Tag `v1.0.0-sprint1` -> `5979f5870e8e28277996dc3045cbf4be5f7236ad` | Original F-01/F-02/F-03 release; distinguish the unrelated extra-hyphen fastTrack tag |
| L6-ACCEPTED | `aeb804ea5bc667399b00cf54df10046a6ded46e0`, PR #76 | Accepted roster-only/privacy/routing corrections; historical targeted RT-07 was isolated replay/evidence inspection, not deployed race injection |
| L7-MAIN | `b92b4349fb6c203d3f39ef966a89661a2959569e` | Reviewed/submitted maintained main before Sprint 2; TA-approved revision minimum 20, approval minimum 10; [dated Lab 7 records](../../labs/lab-07/readiness-and-retrospective.md) retain their original assessment dates |
| S2-MAIN | `07ffd8f31c3d61d8d13d5217a1fde39628c6649a`, [PR #119](https://github.com/Magiciancat9/Course_management/pull/119) | F-04/F-05/F-06 + refreshed UI + maintained Lab 7, independently approved by martinvadre and merged to main |
| S2-CI | [Run 45592525515](https://github.com/Magiciancat9/Course_management/actions/runs/45592525515), exact S2-MAIN | 163 server / 45 client / 7 browser tests PASS; four migrations, production builds and Docker PASS; D2-SYS-T01 1214.25ms PASS on CI Docker, not Cloud Run cold-start timing |
| S3-TASK | Head `a37ba4084fb84e2393b764950d1b6de61cd2d339`; [PR #120](https://github.com/Magiciancat9/Course_management/pull/120) -> `sprint-3-staging` merge `af47ec44db855859b49c82093066c36f3df4c920` | Independently approved by martinvadre at that head; merged 25 Nov 18:59:08 Asia/Bangkok. #98 closed; task AC01-06 complete at checkpoint, peer AC07-12 remain #101 |
| S3-CI | [Run 45607208227](https://github.com/Magiciancat9/Course_management/actions/runs/45607208227), branch head above; tested merge ref `965cb174e1baf17e775e187884f70eb1b7934cd0` | 179 server / 54 client / 8 browser tests PASS; five migrations, builds/Docker PASS; D2-SYS-T01 510.48ms PASS. The tested PR merge ref is separate from staging merge and future accepted main |
| DOC-SOURCE | This documentation branch starts at S3-TASK staging merge `af47ec44db855859b49c82093066c36f3df4c920` | Documentation changes have their own PR/CI. Runtime verification above remains attributed to its original exact source; it is not relabeled a new RC test |
| S2-ACCEPTED-TAG | `v1.1.0-sprint2` NOT FOUND at snapshot | #97 remains OPEN. Reviewed/deployed main exists; accepted-release preservation and authenticated post-deploy evidence remain incomplete |
| D2-RC | Sprint 1/2 + task progress on accepted/deployed main: NOT YET RECORDED | #103 owns integration/deployment; #93 owns final continuity evidence; #100 final reconciliation and #104 PDF depend on the actual RC |

All PASS entries above are Codex-operated automated synthetic checks, including
actual browser/API/PostgreSQL workflows. They are not personal student UAT.
Closed issues, contract review, mock-only tests and old green icons are not
substitutes for exact-source execution or production acceptance.

## 2. Current deployed main and bounded public observation

| Item | Recorded value / provenance |
| --- | --- |
| Main/deployment | S2-MAIN; SUCCESS [45592525515](https://github.com/Magiciancat9/Course_management/actions/runs/45592525515), 25 Nov 17:11:11-17:15:52 Asia/Bangkok |
| Artifact Registry image | `asia-southeast1-docker.pkg.dev/cpe334-kingnine/course-pms/course-pms@sha256:1e56d9031b41d9d82922bd27185609aed4c7f18bce9fb8475c5a01b27bf950f8` |
| Migration execution | `course-pms-migrate-6cd6s` completed in that run |
| Serving revision | `course-pms-00013-kt5`; workflow reports 100 percent traffic at 17:15:40 Asia/Bangkok |
| Public URL | [CoursePMS](https://course-pms-859617270560.asia-southeast1.run.app/) |
| Workflow public smoke | `/api/health` + source SHA, `/api/ready` + DB and HTML PASS |
| Authenticated deployment smoke | **SKIP**: optional credentials not configured in that run; never counted as PASS |
| Fresh public readback | At snapshot, GET `/api/health` returned S2-MAIN; GET `/api/ready` returned `ready` / `connected`. No authenticated business journey, restart or mutation performed |
| Environment metadata | `demo` contains GCP/WIF variable names; neither `SMOKE_EMAIL` variable nor `SMOKE_PASSWORD` secret name exists at snapshot. No secret values read |

S3-TASK has not been promoted/deployed to main. The public deployment therefore
does not prove the task checkpoint or the future combined RC. The service
revision/traffic/digest are workflow evidence; no new owner-console screenshot
or independent traffic measurement is claimed here.

## 3. Checkpoint feature/requirement status

| Scope | Current implementation / verification | Acceptance or uncovered scope |
| --- | --- | --- |
| F-01/F-02/F-03; FR-01-05; BR-01-06 | Maintained source and regression in S2-CI and S3-CI, including Lab 7 20/10 | Rerun original continuity on exact final D2-RC under #93 |
| F-04; S2-F04-AC01-08 | Implemented, independently reviewed #116, merged via #119; S2/S3 regression PASS | #97 accepted identity/tag/authenticated release evidence pending |
| F-05; S2-F05-AC01-10 | Implemented, reviewed #117, versioned persistence/BR-07/deadline checks PASS | Same #97 gate; F-06 handoff is now actually covered, not still null-only |
| F-06; S2-F06-AC01-09 | Implemented, reviewed #118, version-bound draft/publication/score/privacy/race tests PASS | Same #97 gate; old publications never grade new content |
| F-07 tasks; S3-F07-AC01-06 | Implemented, reviewed/merged #120, S3-CI PASS | Main RC integration/deployed evidence remain #103 |
| F-07 peer; S3-F07-AC07-12 | Full contract reviewed #107; code/models/API/UI/cases NOT IMPLEMENTED / NOT RUN | #101, Magiciancat9, target 5 Dec |
| F-08; S3-F08-AC01-10 | Full contract reviewed #107; #99 closed for contract checkpoint; operational analytics/export NOT IMPLEMENTED / NOT RUN | #102, martinvadre, target 7 Dec; depends on #101 as assigned |
| UI refresh; UIR-AC01-10 | Shell/Quick Fill removal implemented #110; many preserved/new component/browser checks PASS | Full mobile/compact/200% zoom, rendered contrast and final visual acceptance are not yet established; per-AC gaps in verification register |

The [complete verification register](verification-register.md) lists all 59
Sprint 2/3/UI AC individually. [Traceability](../../traceability.md) maps every
FR-01-12, BR-01-08 and NFR-01-05 to responsibility, sprint, planned/actual
verification and exact result/source. An existing test file does not mean a
planned peer/analytics case inside it exists or ran.

## 4. Part A continuity and change register

The [current change/defect register](change-defect-register.md) retains original
changes, approved rationale, release/retest links and explicit unresolved items.
[22 Nov staging execution](sprint1-continuity-evidence.md) remains historical.

| Check | Actual coverage now | Still required for #93 closure |
| --- | --- | --- |
| D2-CONT-01 auth/login/me/logout/revocation | TEST-01/02/03/14/19 plus TEST-11/20 in S2/S3 CI | Exact combined RC roles/start/steps/expected/actual/source and relevant deployed evidence |
| D2-CONT-02 own team/add/capacity/single-membership | TEST-04/05/06/15/21/22 + browser TEST-11/12 | Same final RC re-execution and persisted readback |
| D2-CONT-03 draft/submit/revision/resubmit/approve | TEST-07/08/09 + Lab 7 L7-T01-06, including real 19/20 and approval10 browser flow | Same final RC journey; preserve old rule/history separately |
| D2-CONT-04 role/foreign/privacy/routing/session | TEST-10/23, routing and client session suites, each new feature negative API case | Same RC backend denials; no leaked/mutated saved data |
| D2-CONT-05 populated upgrade | Actual init->F-04/F-05/F-06 SQL; F-07 upgrade preserves all 11 populated prior tables | Rerun on the actual final candidate; SQL fixture is not deployed-business readback |

#93 and #103 coordinate: preparing integration and continuity work can proceed
in parallel. Final #93 evidence uses #103's actual candidate; do not interpret
native blocking links as permission to substitute a pre-feature run or as a
reason to wait for both issues to close before preparing the candidate.

## 5. Exact remaining-work, risk and completion plan

Targets below are planning dates, not execution claims. All dates use
Asia/Bangkok; final product target is 13 Dec 2026, 23:59. Examinations run
1-11 Dec: bring dependency/interface review forward, reserve that interval
for bounded reviewed increments, and keep 12-13 Dec for final regression,
retest, video and release. Do not silently reduce scope if a target slips;
record the exact failed/missing AC, impact, owner and revised action.

| Remaining item / exact scope | Owner and dependency | Next action and target |
| --- | --- | --- |
| TD-01 / #97 authenticated release check | martinvadre config/release; Magiciancat9 records acceptance; existing S2-MAIN | Privately configure synthetic SMOKE_EMAIL/SMOKE_PASSWORD, execute login/me/courses/logout and retain actual SHA/time/result; by 27 Nov, before Sprint 3 main promotion |
| #97 immutable Sprint 2 preservation | Magiciancat9; peer acceptance and release checks | Record reviewed/deployed accepted main identity and create/verify annotated `v1.1.0-sprint2` once; never move it to a later Sprint 3 commit; by 27 Nov |
| #103 RC integration and deployment | martinvadre; accepted Sprint 2 + reviewed task checkpoint, #99 contract checkpoint, #100 draft | Integrate Sprint 1/2/tasks, full exact-source CI/migrations/build/system checks, deploy, retain source->image->migration->revision plus actual changed/preserved journeys; by 28 Nov |
| #93 continuity/register | Both; Magiciancat9 evidence, martinvadre RC | Rerun D2-CONT-01-05 on that candidate, record persistence/backend denials and all unresolved dispositions; by 28 Nov |
| UI UIR-AC03/04/07/10 incomplete acceptance | martinvadre UI/RC; Magiciancat9 independent inspection | Check 1440x900, 1024x768, 375x812 and 200% zoom; body overflow/table-local scrolling, keyboard/focus/copy/contrast and captioned desktop/mobile screenshots; per-test PASS/FAIL and exact source; by 28 Nov under #103/#100 |
| NFR-01/02/04 planned peer/analytics paths | Respective #101/#102 owners | Add actual new-route auth/ownership/persistence tests with their implementations; keep global coverage partial until then; by 5/7 Dec |
| #100 final reconciliation | Magiciancat9, martinvadre reviewer; #97/#93/#103 exact accepted evidence | Fill final snapshot identities/results, reconcile every actual gap and prepare full embeddable document source; by 28 Nov and before PDF freeze |
| #104 Parts A-E assessed PDF | Both; Magiciancat9 coordination/submission | Embed complete documents, two S2 workflows + task checkpoint + original continuity, actual domain/access excerpts and two substantive review chains; both inspect exact English PDF; user submits/retains receipt outside Git; 29 Nov 23:59 |
| S3-F07-AC07 | Magiciancat9 / #101; reviewed task/F-05 context | Completed published milestone + own saved submission and exact due-time eligibility tests; 5 Dec |
| S3-F07-AC08 | Magiciancat9 / #101 | Integer rating1-5, comment bounds, eligible teammate/no self-rating, backend no-write assertions; 5 Dec |
| S3-F07-AC09 | Magiciancat9 / #101 | Own outgoing create/update/read with immutable author and unique pair/version semantics; 5 Dec |
| S3-F07-AC10 | Magiciancat9 / #101 | Incoming/other-student confidentiality, instructor read and DTO-negative checks; 5 Dec |
| S3-F07-AC11 | Magiciancat9 / #101 | Real concurrent pair creates/updates, no partial/lost write; 5 Dec |
| S3-F07-AC12 | Magiciancat9 / #101 | Eligibility/pending/error/session UI and confidential real reload/E2E; 5 Dec |
| S3-F08-AC01/02 | martinvadre / #102; #99/#96/#101 | Coherent full-course as-of snapshot and exact NONE/proposal partitions, real persisted fixtures; 7 Dec |
| S3-F08-AC03/04 | martinvadre / #102 | Full denominator/null zero-rate, current submissions, ungraded/current published 0 and late/UNKNOWN rules; 7 Dec |
| S3-F08-AC05/06 | martinvadre / #102 | Unique flagged-team reasons/deadline boundaries, JSON/CSV auth/role/context/DTO denials; 7 Dec |
| S3-F08-AC07/08 | martinvadre / #102 | Complete CSV order/UTF-8 BOM/escaping/empty-vs-zero, formula neutralization and actual named consumer import; 7 Dec |
| S3-F08-AC09/10 | martinvadre / #102 | Snapshot/concurrent grade-version checks, actual dashboard/export states/session/E2E saved data; 7 Dec |
| Final defects, UAT/retests, video and reviewed release | Both; martinvadre release driver | Preserve severity/owner/fix/retest for every observed failure, full final regression and acceptance with explicit limits; 12-13 Dec |

### Exam-aware work windows (proposed, not executed)

| Window | Owner/action and dependency boundary |
| --- | --- |
| 26-29 Nov | Both finish checkpoint release/RC/evidence; Magiciancat9 reconciles documents and assembles PDF, martinvadre drives integration/deploy |
| By30 Nov | Magiciancat9 prepares peer eligibility/pair fixtures/RED cases; martinvadre prepares analytics denominator/CSV fixtures against reviewed interfaces. Interface drafting may overlap; integrated PASS waits for actual dependencies |
| 1-5 Dec exams | Bounded Magiciancat9 peer increments/reviews; prioritize backend eligibility/confidentiality/concurrency then UI/E2E and opposite review to target5 Dec. Record availability/blockers early, not a completion guarantee |
| 1-7 Dec exams | martinvadre may prepare pure analytics/CSV rules/tests against agreed fixtures; actual integration/authorization/coherent snapshot checks use the real #101 increment, targeting7 Dec |
| 8-11 Dec exams | Bounded defect triage/fixes and missed-AC recovery; retain exact owner/failing case/retest/source and escalate schedule risk without silently dropping scope |
| 12-13 Dec | Both final regression/acceptance/UAT retests/video; martinvadre reviewed release, Magiciancat9 final documentation/evidence reconciliation |

There is no newly discovered runtime defect declared solely from documentation
inspection. Existing process/evidence debt and unimplemented requirements above
remain explicit. A missing manual check is not a fabricated product failure.

## 6. Assessed Parts A-E and final snapshot gates

The original repository's D1 section letters are not the D2 report structure.
The 22 Nov work-plan PDF is a working plan, not the assessed submission.

| D2 part | Required complete source / evidence |
| --- | --- |
| A - continuity/changes | Current register plus actual original-journey final RC evidence, approved Lab 7 rationale/history and honest historical limitations |
| B - complete Sprint 2 | Full F-04/F-05/F-06 contracts/AC/STS/shared DoD, all actual mappings/results, independent reviews and accepted immutable Sprint 2 identity |
| C - Sprint 3 progress | Full F-07/F-08 contracts/STS, achieved task AC01-06 and explicit remaining peer/analytics AC/owner/action/date |
| D - complete documentation | Full current SRS, feature inventory, system SDS, all-requirement matrix and per-AC verification/finish plan; links alone do not replace embedding |
| E - integrated RC | Actual main/tag, CI, migrations, image/revision/traffic, changed/preserved/persistence/access journeys, setup/configuration/debt/readiness |

Final snapshot cannot be marked complete while accepted S2 tag/authenticated
release evidence or final integrated RC evidence is missing. Current #100
source is reviewable progress; its final Done-when reconciliation remains
pending those external release results. The user handles issue closure and
LEB2 submission; no approval, main promotion or receipt is inferred here.

## 7. Revision/review provenance

- Original 22 Nov plan/continuity/contract source remains in PR #107/#109 and
  Git history, including immutable [22 Nov register](https://github.com/Magiciancat9/Course_management/blob/93c39952d165477391548c8a1d89e49ace35ddef/docs/sprints/deliverable-2/change-defect-register.md).
- Reviewed runtime/source integrations: #110 UI, #116/#117/#118 S2, #119 main,
  #120 task checkpoint. Their historical test counts keep their exact scope.
- This #100 current-document reconciliation requires its own opposite-member
  review/PR CI. It changes document source, not application behavior/schema.
