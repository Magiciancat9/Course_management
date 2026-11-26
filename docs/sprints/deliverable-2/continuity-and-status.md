# Deliverable 2 current status, release identity and finish plan

**Reconciliation:** 26 November 2026, 22:00 Asia/Bangkok (15:00 UTC).
**Author:** Magiciancat9 with Codex assistance; independent reviewer: martinvadre.
**Scope:** #100 records existing accepted releases and actual verification.
This documentation task performs no deployment or new business test. Its own
independent PR review/integration is pending. The user handles issue closure;
the assessed PDF/submission remain separate work under #104.

The [25 November snapshot](https://github.com/Magiciancat9/Course_management/blob/c35714dc7e9d7ca4e88ae5ab1d65fd3a8707c312/docs/sprints/deliverable-2/continuity-and-status.md)
is history. Its pending acceptance/release statements are superseded below;
old SKIP, planned tests and limited replay are never relabeled as new PASS.

## 1. Evidence keys and version boundaries

| Key | Exact source / integration | Actual evidence and limits |
| --- | --- | --- |
| S1-ORIGINAL | `v1.0.0-sprint1` -> `5979f5870e8e28277996dc3045cbf4be5f7236ad` | Original F-01/F-02/F-03; unrelated extra-hyphen tag is not this baseline |
| L6-ACCEPTED | `aeb804ea5bc667399b00cf54df10046a6ded46e0`, PR #76 | Accepted #71/#74/#75 privacy/routing fixes; historical RT-07 was isolated replay/evidence inspection, not deployed race injection |
| L7-MAIN | `b92b4349fb6c203d3f39ef966a89661a2959569e` | Approved/reviewed CR-L7-01: revision minimum 20, approval minimum 10 after trim/UTF-16; dated [Lab7 history](../../labs/lab-07/readiness-and-retrospective.md) retained |
| S2-MAIN / S2-ACCEPTED-TAG | `v1.1.0-sprint2` -> `07ffd8f31c3d61d8d13d5217a1fde39628c6649a`, PR #119 | Reviewed complete F04/05/06; annotated tag preserved before S3 promotion; [#97 acceptance](https://github.com/Magiciancat9/Course_management/issues/97#issuecomment-7166980735) |
| S2-CI | [45645149796](https://github.com/Magiciancat9/Course_management/actions/runs/45645149796), exact S2-MAIN | 163 server /45 client /7 browser PASS; four migrations, builds/Docker, startup 306.2 ms and public/authenticated smoke PASS. Earlier45592525515 authenticated SKIP remains historical |
| S3-TASK / S3-CI | PR #120 head `a37ba4084fb84e2393b764950d1b6de61cd2d339`, staging merge `af47ec44db855859b49c82093066c36f3df4c920`; [45607208227](https://github.com/Magiciancat9/Course_management/actions/runs/45607208227) | Reviewed AC01-06; 179 server /54 client /8 browser PASS; five migrations; startup 510.48 ms. Tested merge ref `965cb174e1baf17e775e187884f70eb1b7934cd0` is separate from accepted main |
| DOC-SOURCE | PR #121 head `7ffadb22b6636d313a3d4874952fe36c0bc472b8`, staging merge `e96374976f566ce462dca5c5d6de4f394e30c700` | martinvadre approved complete SRS/SDS/matrix; [45615053374](https://github.com/Magiciancat9/Course_management/actions/runs/45615053374) passed179/54/8. This final reconciliation needs its own review |
| S3-PEER | PR #122 head `57045b5f3490ff55e181c1ac0e8db9cdaacb69b9`, staging merge `c35714dc7e9d7ca4e88ae5ab1d65fd3a8707c312` | martinvadre APPROVED; [45622442379](https://github.com/Magiciancat9/Course_management/actions/runs/45622442379) passed192/64/9 and six migrations; startup 1096.2 ms; [peer ledger](../sprint-3/f07-peer-execution-evidence.md) retains RED/GREEN |
| D2-RC / RC-CI | Reviewed PR #123 head `2f530ab9a4fa5076a44bf2c7c8737c7d20311d3f` -> main `dd9d85ac9f0f6b21f9503c1031173992fb69ce35`; [45759742341](https://github.com/Magiciancat9/Course_management/actions/runs/45759742341) | Accepted/deployed S1/Lab7/S2/F07 tasks+peer. 192 server /64 client /9 browser PASS, six migrations, builds/Docker/startup 1165.96 ms and public/authenticated smoke PASS; [dated live checks](https://github.com/Magiciancat9/Course_management/issues/103#issuecomment-7183418289) |
| S3-F08 / F08-CI | PR #124 head `688e5523f797fc19c6b4fed3303ea38d2fd16e0b`, staging merge `14178f162e037a4bee8f2ec85c57bdc726e8fa58`; [45830829000](https://github.com/Magiciancat9/Course_management/actions/runs/45830829000) | Magiciancat9 APPROVED with AI assistance after four findings/fixes and six reviewer regressions. 207 server /74 client /10 browser PASS; six migrations/builds/Docker/startup 1116.61 ms PASS. Tested merge ref `bd2bdb876951bbc16155b2e1cb942f7e69e1ef0d`; main promotion/deployment NOT YET DONE |

Counts are separate source-specific automated synthetic results, not personal
student UAT or new execution by this task. CI startup is not Cloud Run
cold-start timing. Latest staging results must not be attributed to older main.

## 2. Current deployed main and bounded public observation

| Item | Recorded value / provenance |
| --- | --- |
| Accepted RC / review | PR #123 approved by Magiciancat9; merged26 Nov 12:09:36 Asia/Bangkok to `dd9d85ac9f0f6b21f9503c1031173992fb69ce35` |
| Main CI/deployment | [45759742341](https://github.com/Magiciancat9/Course_management/actions/runs/45759742341),26 Nov 12:09:39–12:14:52 Asia/Bangkok, SUCCESS |
| Artifact Registry image | `asia-southeast1-docker.pkg.dev/cpe334-kingnine/course-pms/course-pms@sha256:415e3e41e9d9bce39db1f63f77eb69dfa3b4cfd2228140619d4f885605b45ac8` |
| Migration | `course-pms-migrate-zt7vg`, SUCCESS; additive task/peer SQL on Cloud SQL PostgreSQL16 |
| Serving revision | `course-pms-00015-lrr`; 100% traffic reported by release record |
| Public URL | [CoursePMS](https://course-pms-jjbynk5aja-as.a.run.app) |
| Public/authenticated smoke | Health + exact SHA, readiness + DB, HTML, login/me/courses/logout PASS; no smoke SKIP in this run |
| Dated live verification | martinvadre's AI-assisted synthetic checks26 Nov 12:20:06–12:20:16 Asia/Bangkok; [steps/fixtures/expected/actual](https://github.com/Magiciancat9/Course_management/issues/103#issuecomment-7183418289) cover continuity, S2 readbacks/denials, tasks and confidential peer |
| Setup/configuration | GitHub demo contains SMOKE_EMAIL variable and SMOKE_PASSWORD secret; values not exposed. Runtime/migrator use separate identities/Secret Manager. Reproducible setup: [README](../../../README.md), [system SDS](../../system-sds.md) |
| Retained artifacts | [Sprint2 15089761463](https://github.com/Magiciancat9/Course_management/actions/runs/45759742341/artifacts/15089761463), [F07 15090190270](https://github.com/Magiciancat9/Course_management/actions/runs/45759742341/artifacts/15090190270), [startup 15090195347](https://github.com/Magiciancat9/Course_management/actions/runs/45759742341/artifacts/15090195347); retain selected evidence outside Git before90-day expiry |

No fresh authenticated test, deployment, production write/reset or traffic
measurement occurred during this reconciliation. This RC already provides
D2's combined-release boundary. F08 staging is additional progress; its
production acceptance remains open.

## 3. Checkpoint feature/requirement status

| Scope | Current implementation / verification | Acceptance or uncovered scope |
| --- | --- | --- |
| F01/02/03; FR01-05; BR01-06 | Original journeys, Lab7 20/10, persistence/access PASS RC-CI; dated live continuity corroborates | #93 checklist reconciliation complete; RT-07 retains historical limits |
| F04; S2-F04-AC01-08 | Reviewed #116/#119; all named tests PASS S2-CI and RC-CI | Accepted S2 tag/authenticated release recorded; no required feature deferred |
| F05; S2-F05-AC01-10 | Reviewed #117/#119; version history, APPROVED/deadline/late rules and grade handoff PASS | Accepted S2; RC live submission/grade readbacks and foreign denial recorded |
| F06; S2-F06-AC01-09 | Reviewed #118/#119; version-bound draft/publication/privacy PASS | Accepted S2; old publications never grade new content |
| F07 tasks; S3-F07-AC01-06 | Reviewed #120; main RC-CI and live task/events/readback/denials PASS | Accepted combined main/deployment recorded |
| F07 peer; S3-F07-AC07-12 | Reviewed #122, promoted #123; U/I/SQL/UI/E PASS RC-CI; live eligibility/no-self/privacy/readback/conflict PASS | #101 checklist reconciliation complete; personal December UAT remains planned |
| F08; S3-F08-AC01-10 | Reviewed/merged #124; U/I/UI/E PASS F08-CI, downloaded BOM and cross-course handoff regressions PASS | NOT deployed main. martinvadre owns promotion/deployed checks and named desktop spreadsheet import; Python excel-dialect parsing is not GUI evidence |
| UIR-AC01-10 | #110/#119 implemented; named component/browser checks PASS | UIR-AC03/04/07/10 full viewport/zoom/copy/contrast/final visual inspection remain partial |

[Verification register](verification-register.md): all 59 Sprint2/3/UI AC
and10 original AC. [Traceability](../../traceability.md): all 25 FR/BR/NFR,
owner/sprint/planned/actual case/result/version. Automated PASS does not
complete separate manual acceptance or certify exhaustive product coverage.

## 4. Part A continuity and change register

The [current findings register](change-defect-register.md) retains accepted
decisions, fixes/retests and owned remaining actions. The
[22 Nov baseline](sprint1-continuity-evidence.md) remains history; its RC
addendum and [#93 reconciliation](https://github.com/Magiciancat9/Course_management/issues/93)
record the actual release.

| Check | Roles / expected behavior | Actual RC result and source |
| --- | --- | --- |
| D2-CONT-01 | Student/instructor login/me; anonymous and revoked token rejected | PASS RC-CI TEST-01/02/03/14/19, TEST-11/20; live login/me/logout/replay401 |
| D2-CONT-02 | Owning student creates/adds roster; capacity/single-membership; persisted readback | PASS RC-CI TEST-04/05/06/15/21/22, browser TEST-11/12; live Alpha/Beta retained, assigned-member/duplicate-team409, foreign proposal null |
| D2-CONT-03 | Student draft/submit; instructor revision; student resubmit; approve/reload | PASS RC-CI TEST-07/08/09, TEST-11 and L7-T05/T06 browser19/20/revision/resubmit/approval 10; live owning APPROVED revisionCount2 readback200 |
| D2-CONT-04 | Anonymous/role/foreign denial; private data/saved state retained | PASS RC-CI API/routing/session/directory suites and TEST-12; live foreign proposal GET/PUT403, no private roster payload |
| D2-CONT-05 | Actual populated SQL retains prior rows; deployed migration succeeds, saved records readable | PASS RC-CI sprint2-release/collaboration/peer migration tests on isolated populated fixtures; separate live migration SUCCESS and teams/proposal/submission/grade readbacks. Live readback is not a full DB snapshot comparison |

Actual RC browser cases ran26 Nov 12:11:06–12:11:46 Asia/Bangkok within
45759742341. Roles/fixtures/assertions are in those exact-source tests;
deployed expected/actuals are in #103. No new deployed race injection or
personally performed student UAT is claimed.

## 5. Exact remaining-work, risk and completion plan

Original feature targets5/7 Dec remain history; implementations arrived early.
Examinations1–11 Dec constrain capacity. Product deadline 13 Dec 2026,23:59
Asia/Bangkok. Unexecuted checks remain pending. New defects need severity,
owner, exact fix/source and actual retest evidence.

| Item / exact scope | Owner and dependency | Current outcome / next action and target |
| --- | --- | --- |
| #97 / TD-01 / S2 tag | martinvadre release; Magiciancat9 record | DONE 25 Nov: authenticated S2-CI and preserved tag. Never move tag to S3 |
| #103 / D2 combined RC | martinvadre; reviewed S2/tasks/peer | DONE 26 Nov: PR123/main RC-CI/deployment/live checks. Future F08 promotion is a separate release |
| #93 / original continuity/findings | Both; actual D2-RC | Checklist reconciliation complete26 Nov; RC-CI + dated live record; all findings resolved or explicitly owned |
| #101 / F07 AC01-12 | Magiciancat9; martinvadre review/release | Reviewed/deployed/tested, checklist reconciliation complete26 Nov; original5 Dec implementation target achieved early; personal December UAT planned |
| #100 / document snapshot | Magiciancat9 author; martinvadre reviewer | This update reconciles S2/RC/F08 and remaining checks. Its independent review/CI/staging integration still required before closure; target 28 Nov |
| F08 AC01-06/09/10 production acceptance | martinvadre; reviewed staging 14178f1 | Code/tests/review complete. Reviewed main promotion, exact-source CI/deploy, live instructor analytics/current-version handoff and anonymous401/student403, retain source/digest/migration/revision; target 7 Dec or earlier |
| F08 AC07/08 desktop consumer | martinvadre export; Magiciancat9 inspection; downloaded CSV | Automated BOM/CRLF/14-column/quoting/formula/zero-vs-empty + Python3.14.7 excel-dialect PASS. Open/import in named/versioned Excel or LibreOffice GUI; record Thai/comma/quote/CRLF, risk neutralization,0-vs-empty expected/actual; target 7 Dec |
| UIR-AC03 full layout/zoom | martinvadre UI; Magiciancat9 inspection; selected final source | Execute1440x900,1024x768,375x812 and200% zoom; readable controls/body overflow/table-local scroll; retain actual results/screenshots; target 28 Nov under #104 |
| UIR-AC04 navigation/copy | Same owners; new and preserved screens | Inspect role-aware destinations/user-facing copy; retain named browser checks, record whole-product inspection; target 28 Nov under #104 |
| UIR-AC07 keyboard/contrast | Same owners; rendered selected source | Inspect focus/tab order/labels/keyboard and measure rendered contrast incl. errors/disabled controls; record tool/results; target 28 Nov under #104 |
| UIR-AC10 visual acceptance | Both; desktop/mobile render | Retain captioned desktop/mobile images, exact source/date and explicit approval/outstanding defects; target 28 Nov under #104 |
| #104 / English Parts A–E PDF | Both; Magiciancat9 coordination/user submission; reviewed #100 | Embed full SRS/features/SDS/contracts/matrix/plan plus actual continuity/two meaningful S2 workflows/S3 progress/reviews/deployment. Both inspect PDF; user submits/retains receipt outside Git by 29 Nov 23:59. No PDF/receipt claimed |
| Final UAT/defects/video/release | Both; martinvadre release; complete source | Bounded triage/retests1–11 Dec; actual personal UAT/full regression/video/independently reviewed release12–13 Dec, due13 Dec 23:59 |

### Exam-aware work windows (planned, not executed)

| Window | Action |
| --- | --- |
| 26–29 Nov | Review/integrate this snapshot; inspect remaining UI; assemble/inspect assessed PDF; user submission29 Nov |
| By30 Nov | Plan F08 main promotion and spreadsheet GUI inspection; retain selected artifacts before expiry |
| 1–7 Dec exams | Bounded reviewed release/checks for F08 acceptance; report blockers/availability; no fabricated PASS if dates slip |
| 8–11 Dec exams | Bounded defect triage/fixes/missed-check recovery with exact owner/case/retest/source |
| 12–13 Dec | Both execute final regression/personal UAT/retests/video and reviewed release; reconcile actual outcomes |

## 6. Assessed Parts A-E and final snapshot gates

Legacy D1 section letters and the22 Nov work-plan PDF are not D2's assessed
report. D2 requires complete S2 plus meaningful S3 progress, not every
December acceptance check before documenting this snapshot.

| D2 part | Complete source / actual evidence boundary |
| --- | --- |
| A continuity/changes | Register, approved Lab7 rationale/history and RC D2-CONT-01–05; RT-07 limits retained |
| B complete Sprint2 | Full F04/05/06 contracts/AC/STS/DoD, actual mappings/results/reviews, immutable S2 tag/authenticated acceptance |
| C Sprint3 progress | Full F07/F08 contracts/STS; reviewed/deployed/tested F07, reviewed/tested F08 staging; remaining production/GUI/manual acceptance with owner/action/date |
| D complete documentation | Current SRS/features/SDS/all-requirement matrix/per-AC ledger/plan, independently reviewed before PDF freeze; links alone do not replace embedding |
| E integrated RC | Main dd9d85a, CI/migrations/digest/revision/traffic record, changed/preserved/persistence/access journeys and setup/config/debt/readiness |

Missing external S2/RC evidence now exists and is reconciled here. #100 needs
independent review/integration of this update; it does not wait for F08
deployment, December UAT or PDF submission. Those outcomes stay explicitly
tracked and unexecuted checks are not marked passed. The user handles closure
and LEB2 submission.

## 7. Revision/review provenance

- Original contracts #107 and22 Nov register #109 remain immutable history;
  policy decisions were reviewed before code.
- #110 UI, #116/#117/#118 S2, #119 acceptance, #120 tasks, #121 docs,
  #122 peer, #123 main RC and #124 F08 retain actual review/CI/source.
- #93/#101 26 Nov reconciliation combines exact-main regression and dated
  martinvadre live evidence without changing original execution timestamps.
- This #100 update changes documentation only; review/CI/merge are recorded
  on its own PR. No self-approval/merge, automatic closure, new deployment,
  assessed PDF or submission receipt is inferred.
