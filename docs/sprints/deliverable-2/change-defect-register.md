# Lab 5-7 change/defect register - current #100 reconciliation

**Current snapshot:** 25 Nov 2026; owners Magiciancat9 and martinvadre.
[Exact version/run/deployment register](continuity-and-status.md) defines
S2-MAIN/S2-CI and S3-TASK/S3-CI. Historical Lab records below remain dated;
this current disposition supersedes old pending-status text without turning
historical SKIP or limited replay into new PASS. #93 final RC remains open.

## 1. Current approved changes, fixes and retest disposition

| Finding/change / requirement | Current disposition and approval/release provenance | Actual verification / remaining owner/action |
| --- | --- | --- |
| #71 stale private editor / F-03, BR-06 | Resolved via #72/#73 -> reviewed Lab 6 #76 / aeb804e; roster/session policy preserved | S2/S3-CI reruns App.sessionIsolation/sessionReview plus API/E2E negatives. Historical RT-07 remains isolated replay/evidence inspection, not deployed race injection; final RC continuity Magiciancat9 + martinvadre under #93/#103 by28 Nov |
| #74 foreign proposal metadata / BR-06 | Resolved under accepted roster-only foreign-team policy, Lab 6 #76 | API TEST-23, routing/privacy and App.directoryPrivacy rerun S2/S3-CI; current-source backend denial/readback PASS; repeat final RC #93 |
| #75 protected API SPA fallback / F-01, NFR-01 | Resolved in aeb804e; unsupported proposal API stays protected JSON before frontend fallback | routing-privacy.unit.test.ts and TEST-03 rerun S2/S3-CI; final RC #93 |
| CR-L7-01 / #85, BR-05 | TA P'Tik approval 22 Nov20:18 Asia/Bangkok, user confirmation, reviewed contract #105 before code; revision minimum20/approval10 after trim/UTF-16 implemented and released through #113 and maintained main | [Approval](../../labs/lab-07/approval-record.md), [locked baseline](../../labs/lab-07/pre-change-baseline.md), [implementation chronology](../../labs/lab-07/implementation-evidence.md); Lab7 U/I/UI/E suites pass S2/S3-CI. Old10/10 behavior remains history, not current policy |
| UI refresh / #106 | User direction22 Nov; full specification review #107, ownership handoff #108, implementation/review #110, current main integration #119 | Quick Fill removed; real auth/team/proposal preserved by actual component/E2E. Full compact/mobile/zoom/contrast acceptance remains explicit #103/#100 work by28 Nov |
| Versioned migrations / NFR-04 | Original init already existed; reviewed F-04/F-05/F-06 added actual SQL, then F-07 task migration on staging | Fresh migrate:deploy and populated SQL checks PASS S2/S3-CI; legacy fields/grades/session records retained. Production job course-pms-migrate-6cd6s completed for S2-MAIN; F-07 production upgrade not yet performed |
| TD-02 disposable DB reset guard | Addressed/reviewed in #119, common guard applied before resetting server/browser tests | disposable-database.unit.test.ts10 and full guarded S2/S3 suites PASS; source/test changes now reviewed. No production-reset run inferred |
| TD-03 maintained rule across refreshed UI/features | Addressed/reviewed in #119 and preserved in #120 | App.lab7Review + App.uiRefresh, Lab7 unit/API/browser and combined S2/S3 regression PASS; final RC rerun still #93/#103 |
| Startup measurement / NFR-05 | Previous measurement gap addressed by D2-SYS-T01 in reviewed #119 | Actual CI Docker1214.25ms on S2-MAIN and510.48ms on S3 tested merge, with image/source/UTC/DB/HTML; not Cloud Run cold-start timing |

## 2. Explicit remaining debt, evidence limitations and requirements

| Item / severity or kind | Owner / dependency | Concrete next action / target |
| --- | --- | --- |
| TD-01 authenticated deployed smoke / retained P1 evidence debt | martinvadre config/release; Magiciancat9 acceptance record / #97 | **Resolved on 25 Nov:** `SMOKE_EMAIL` variable and `SMOKE_PASSWORD` secret privately configured in `demo`; normal main deployment [run 45645149796](https://github.com/Magiciancat9/Course_management/actions/runs/45645149796) on `07ffd8f31c3d61d8d13d5217a1fde39628c6649a` (`course-pms-00014-28n`) passed public and authenticated login/me/courses/logout smoke checks |
| Accepted Sprint 2 tag / release gate | martinvadre + Magiciancat9 / #97 | **Resolved on 25 Nov:** immutable annotated tag `v1.1.0-sprint2` created and pushed on `07ffd8f31c3d61d8d13d5217a1fde39628c6649a` before Sprint 3 main promotion ([issue #97 record](https://github.com/Magiciancat9/Course_management/issues/97#issuecomment-7166980735)) |
| Final integrated RC / continuity | martinvadre #103; Magiciancat9 + martinvadre #93 | Main integration of preserved S1/S2 and reviewed tasks, exact-source full CI/SQL/build/system checks and actual deployed changed/original/persistence/backend-denial evidence; target28 Nov |
| Full UI visual/accessibility evidence | martinvadre UI/RC, Magiciancat9 independent verification / #103/#100 | Specific UIR-AC03/04/07/10 gaps: 1440/1024/375 widths, 200% zoom/overflow, copy/keyboard/rendered contrast and final captioned mobile/desktop evidence; target28 Nov |
| Peer/analytics remaining scope / requirement gaps, not newly observed defects | Magiciancat9 #101; martinvadre #102 | Per-AC actions for F07-AC07-12 and F08-AC01-10 in finish plan; targets5/7 Dec, final13 Dec. Reviewed design is not implementation |
| Final document/PDF snapshot | Magiciancat9 #100/#104; martinvadre reviews | Reconcile actual #97/#93/#103 identities/results before both members inspect the English Parts A-E PDF; user submits29 Nov23:59, receipt/PDF private |
| Historical missed deployment notice/authenticated SKIP/RT-07 limit | Both retain original Lab6 process record | Do not fabricate retrospective notice/PASS/deployed race. Follow reviewed notice/check procedure for the next release; historical accepted decision and bounded evidence remain unchanged |

## 3. Historical Lab 5/6 disposition and original rationale (22 Nov record)

All listed historical task/defect issues were CLOSED when inspected on
22 Nov 2026. The **owner** column records implementation/handoff responsibility,
not a claim that either student personally executed this task's automated tests.

| Entry / source | Type; requirement or feature | Owner / accepted disposition | Release and verification provenance | Remaining action |
| --- | --- | --- | --- | --- |
| [#19](https://github.com/Magiciancat9/Course_management/issues/19), [#23](https://github.com/Magiciancat9/Course_management/issues/23): GCP setup / provisioning | Infrastructure change; NFR-05 | Both members; existing cloud architecture retained | [Deployment inventory](../../labs/lab-05/deployment.md), Lab 5 C-04/C-06 in [evidence](../../labs/lab-05/evidence.md) | No new setup work in #93. Initial billing/IAM/budget checkboxes are a historical planning snapshot, not newly verified console evidence |
| [#20](https://github.com/Magiciancat9/Course_management/issues/20): runtime configuration, readiness and migration command | Infrastructure change; NFR-03/04/05 | Magiciancat9; accepted into Lab 5 release | Existing init migration and `prisma:migrate:deploy`; environment templates and readiness in deployment notes | For future schema work, #94–#96 owners add reviewed migrations and populated-upgrade checks; release driver martinvadre integrates them via #103 by 28 Nov |
| [#21](https://github.com/Magiciancat9/Course_management/issues/21): reproducible Docker build | Delivery change; NFR-05 | martinvadre; accepted | Lab 5 C-03 fresh-clone observation on `fa7f156...`; exact scope/limitations in evidence | New CI builds the image; it does not repeat fresh-clone Compose runtime or prove ≤10 s startup |
| [#22](https://github.com/Magiciancat9/Course_management/issues/22), [#25](https://github.com/Magiciancat9/Course_management/issues/25): PR CI / merge gate | Delivery change; NFR-05 | Magiciancat9; accepted | Passing [run 43146393669](https://github.com/Magiciancat9/Course_management/actions/runs/43146393669); deliberate failing [PR #38](https://github.com/Magiciancat9/Course_management/pull/38) / [run 43242578035](https://github.com/Magiciancat9/Course_management/actions/runs/43242578035), closed unmerged | The intentional failure is a gate exercise, not an unresolved product defect. Keep new CI source/result identities separate |
| [#26](https://github.com/Magiciancat9/Course_management/issues/26), [#27](https://github.com/Magiciancat9/Course_management/issues/27): release / durable data | Delivery and persistence change; NFR-04/05 | martinvadre release; both members persistence task; accepted history | Lab 5 C-05/C-06, [run 43362468746](https://github.com/Magiciancat9/Course_management/actions/runs/43362468746); saved team preserved across recorded redeploy | No restart/redeploy is performed now. New integrated-RC persistence remains #103 / D2-CONT-05 |
| [#24](https://github.com/Magiciancat9/Course_management/issues/24), [#40](https://github.com/Magiciancat9/Course_management/issues/40), [#42](https://github.com/Magiciancat9/Course_management/issues/42), [#44](https://github.com/Magiciancat9/Course_management/issues/44): evidence/document promotion | Documentation change; delivery provenance | Magiciancat9; #44 shared; accepted history | Lab 5 release trace and explicit screenshot/log limits | #100 corrects outdated setup claims via reviewed PR #107; final document reconciliation remains with Magiciancat9 by 28 Nov |
| [#71](https://github.com/Magiciancat9/Course_management/issues/71): stale private editor after account switch | Accepted Major defect; F-03 / BR-06 | martinvadre; resolved | Fix PRs #72/#73 → release #76 / `aeb804e`; accepted targeted RT-01–06/08–09 and bounded RT-07 replay | Current client session suites rerun in the new baseline CI; this is separate from historical deployed observations |
| [#74](https://github.com/Magiciancat9/Course_management/issues/74): foreign-team proposal metadata | Accepted Major defect; BR-06 | martinvadre; resolved under roster-only policy | Release #76 / `aeb804e`; recorded targeted RT-03/08 | Current API TEST-23, routing/privacy and client directory checks rerun; no private data in general team responses |
| [#75](https://github.com/Magiciancat9/Course_management/issues/75): protected API namespace served SPA | Accepted Minor defect; F-01 / AC-03 | martinvadre; resolved | Release #76 / `aeb804e`; recorded RT-09 | Current TEST-03 and routing/privacy checks rerun; unsupported APIs remain JSON 401/404, frontend routes retain HTML |

## 4. Fresh execution and final closure rule

The original [22 Nov staging execution](sprint1-continuity-evidence.md) and
[immutable register source](https://github.com/Magiciancat9/Course_management/blob/93c39952d165477391548c8a1d89e49ace35ddef/docs/sprints/deliverable-2/change-defect-register.md)
remain preparation history. Current implemented-feature regression and
migration results are the named S2/S3 runs, not relabeled historical Lab6 UAT.

Every current finding is resolved with source/retest or explicitly remaining
with owner/action/target above. This document update does not complete #93's
actual final integrated-RC journey. Record new failures with severity/owner/
fix/retest, update the exact candidate identities, and obtain independent
review. The user handles closure; no new production mutation, reset, release
acceptance, secret-value read or personal student UAT is claimed.
