# Complete requirements-to-implementation-and-verification traceability

**Current reconciliation:** 25 Nov 2026, issue #100. Evidence keys and exact
source/run/deployment boundaries are in the [version register](sprints/deliverable-2/continuity-and-status.md).
Every FR-01-12, BR-01-08 and NFR-01-05 is mapped below. Mapping is allocation,
not a coverage percentage or a claim that planned paths were implemented.

The [per-AC verification register](sprints/deliverable-2/verification-register.md)
expands all 59 Sprint 2/3/UI AC and the original ten Sprint 1 AC to actual
file/case names, U/I/UI/E level, implemented/run/result/source and explicit
gaps. The full numbered contracts/STS remain embedded-source documents, not
replaced by a short matrix. All reported execution is Codex-operated synthetic
automation; independent human reviews are identified separately.

## 1. Complete baseline matrix

| Requirement | Responsibility / feature / owner | Sprint | AC or measurement | Planned test IDs | Actual file / case-name prefix or planned gap | Implementation / executed result | Tested version / accepted-release boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FR-01 | F-01 auth/session; original S1 ownership | S1 | AC-01-03 | TEST-01/02/03/11/13/14/19 | [API/DB](../server/tests/api.integration.test.ts) `TEST-01/02/03/13/14/19`; [S1 browser](../e2e/sprint1.spec.ts) `TEST-11/20` | YES / PASS named API/E checks | S2-CI + S3-CI; maintained main; final exact-RC continuity #93 pending |
| FR-02 | F-02 team/member capacity; original S1 ownership | S1 | AC-04-06 | TEST-04/05/06/11/15/21/22 | [API/DB](../server/tests/api.integration.test.ts) `TEST-04/05/06/15/21/22`; [S1 browser](../e2e/sprint1.spec.ts) `TEST-11/12` | YES / PASS; current-member email add, not self-join | S2-CI + S3-CI; maintained main; final exact-RC continuity #93 pending |
| FR-03 | F-02/F-03 roster/private proposal | S1 | AC-04/07/10 | TEST-04/07/10/11/23 | [API/DB](../server/tests/api.integration.test.ts) `TEST-23 / AC-10: exposes only rosters for foreign teams`; [directory UI](../client/src/App.directoryPrivacy.test.tsx) | YES / PASS scoped visibility | S2-CI + S3-CI; maintained main; final exact-RC continuity #93 pending |
| FR-04 | F-03 draft/submit/revise; Magiciancat9 | S1 | AC-07/08 | TEST-07/08/11/16/17 | [API/DB](../server/tests/api.integration.test.ts) `TEST-07 / AC-07` persisted draft; `TEST-08 / AC-08` completeness/state; [S1 browser](../e2e/sprint1.spec.ts) | YES / PASS save/transition/readback | S2-CI + S3-CI; maintained main; final exact-RC continuity #93 pending |
| FR-05 | F-03 instructor review; Magiciancat9 | S1 + maintenance | AC-09 | TEST-09/11/18; L7-T01-06 | [API/DB](../server/tests/api.integration.test.ts) `TEST-09 / AC-09`; [L7 API](../server/tests/lab7-review.integration.test.ts) `L7-T01/T05`; [L7 E](../e2e/lab7-review.spec.ts) `L7-T05/T06` | YES / PASS approval10/revision20, state precedence | S2-CI + S3-CI; maintained main; final exact-RC continuity #93 pending |
| FR-06 | F-04 milestones; martinvadre | S2 | S2-F04-AC01-08 | S2-F04-T01-11 | [I](../server/tests/milestones.integration.test.ts) `S2-F04-T01..T09`; [UI](../client/src/features/milestones/MilestoneManager.test.tsx) `S2-F04-T10a-g`; [E](../e2e/sprint2-milestones.spec.ts) `S2-F04-T11` | YES / PASS; all 8 AC mapped in [per-AC register](sprints/deliverable-2/verification-register.md) | S2-CI + S3-CI; reviewed/deployed S2-MAIN; #97 acceptance gates remain |
| FR-07 | F-05 submissions; Magiciancat9 | S2 | S2-F05-AC01-10 | S2-F05-T01-12 | [I](../server/tests/submissions.integration.test.ts) `S2-F05-T01..T09`; [UI](../client/src/features/submissions/SubmissionWorkspace.test.tsx) `S2-F05-T10/T12`; [E](../e2e/sprint2-submissions.spec.ts) `S2-F05-T11/T12` | YES / PASS; real F-06 published-grade handoff also covered | S2-CI + S3-CI; reviewed/deployed S2-MAIN; #97 acceptance gates remain |
| FR-08 | F-06 grading; martinvadre | S2 | S2-F06-AC01-09 | S2-F06-T01-11 | [I](../server/tests/grading.integration.test.ts) `S2-F06-T01..T08/T11`; [UI](../client/src/features/grading/GradingConsole.test.tsx) `S2-F06-T09a-e`; [E](../e2e/sprint2-grading.spec.ts) `S2-F06-T10` | YES / PASS current-content-bound grade/publication | S2-CI + S3-CI; reviewed/deployed S2-MAIN; #97 acceptance gates remain |
| FR-09 | F-07 tasks; Magiciancat9 | S3 checkpoint | S3-F07-AC01-06 | S3-F07-T01-08 | [I](../server/tests/collaboration.integration.test.ts) `S3-F07-T01..T06`; [UI](../client/src/features/collaboration/Collaboration.test.tsx) `S3-F07-T07/AC06` suite; [E](../e2e/sprint3-collaboration.spec.ts) `S3-F07-T08/AC06` | YES / PASS 6 checkpoint AC; task/event persistence and negative access | S3-CI; reviewed #120/S3-TASK staging; main/deployed RC #103 pending |
| FR-10 | F-07 confidential peer; Magiciancat9 | S3 final | S3-F07-AC07-12 | S3-F07-T09-15 | No actual peer case/model/API/UI yet; planned locations and exact missing AC in [per-AC register](sprints/deliverable-2/verification-register.md) | NOT IMPLEMENTED / NOT RUN | #101; full contract reviewed #107; target5 Dec; no accepted version |
| FR-11 | F-08 analytics; martinvadre | S3 final | S3-F08-AC01-06/09/10 | S3-F08-T01-06/10-12 | No actual analytics case/service/UI; planned `analytics.integration.test.ts` and dashboard/E2E in [per-AC register](sprints/deliverable-2/verification-register.md) | NOT IMPLEMENTED / NOT RUN; existing proposal cards are not F-08 | #102, depends #99/#96/#101; contract reviewed #107; target7 Dec |
| FR-12 | F-08 CSV; martinvadre | S3 final | S3-F08-AC06-10 | S3-F08-T06-12 | No actual export/consumer test; planned analytics unit/API/UI/E and named CSV import measurement in [per-AC register](sprints/deliverable-2/verification-register.md) | NOT IMPLEMENTED / NOT RUN; no compatibility claim | #102; target7 Dec; actual CSV consumer/security evidence required |
| BR-01 | F-02 membership + DB uniqueness | S1 | AC-05 | TEST-05/12/21/22 | [API/DB](../server/tests/api.integration.test.ts) `TEST-05/21/22`; [S1 browser](../e2e/sprint1.spec.ts) `TEST-12`; TeamMember unique(courseId,userId) | YES / PASS including real concurrent membership | S2-CI + S3-CI; maintained main; final exact-RC continuity #93 pending |
| BR-02 | F-02 capacity + transaction | S1 | AC-06 | TEST-06/12/15 | [API/DB](../server/tests/api.integration.test.ts) `TEST-06/15`; [U](../server/tests/domain.unit.test.ts) `TEST-06 / AC-06` suite | YES / PASS max capacity and concurrent adds | S2-CI + S3-CI; maintained main; final exact-RC continuity #93 pending |
| BR-03 | F-03 proposal state lifecycle | S1 | AC-08/09 | TEST-08/09/16/17/18 | [API/DB](../server/tests/api.integration.test.ts) state/concurrent TEST-16/17/18; [U](../server/tests/domain.unit.test.ts) TEST-08/09; L7 E revision/resubmit | YES / PASS; revision allowed, APPROVED remains locked | S2-CI + S3-CI; maintained main; final exact-RC continuity #93 pending |
| BR-04 | F-03 completeness | S1 | AC-08 | TEST-08/12 | [API/DB](../server/tests/api.integration.test.ts) `TEST-08 / AC-08: checks each completeness threshold`; [U](../server/tests/domain.unit.test.ts); [S1 browser](../e2e/sprint1.spec.ts) TEST-12 | YES / PASS title5/problem20/stack3 after trim | S2-CI + S3-CI; maintained main; final exact-RC continuity #93 pending |
| BR-05 | F-03 maintained review rule | S1 + Lab7 | AC-09 + L7 revised contract | TEST-09; L7-T01-06 | [L7 U](../server/tests/lab7-review.unit.test.ts); [I](../server/tests/lab7-review.integration.test.ts); [UI](../client/src/App.lab7Review.test.tsx); [E](../e2e/lab7-review.spec.ts) actual L7 case prefixes | YES / PASS approved revision20/approval10, trim/UTF-16; old10/10 only historical | S2-CI + S3-CI; maintained main; final exact-RC continuity #93 pending |
| BR-06 | F-01-08 backend private-resource authorization | All | AC-03/10; S2-F04-AC05; S2-F05-AC07/10; S2-F06-AC05; F07-AC04/10; S3-F08-AC06 | TEST-03/10/23; S2-F04-T07; S2-F05-T07/T12; S2-F06-T05; S3-F07-T04/T12; S3-F08-T06 | [API/DB](../server/tests/api.integration.test.ts) TEST-10/23; implemented feature I/E negatives above; peer/analytics cases absent | PARTIAL PRODUCT: implemented paths PASS; future peer/F08 NOT RUN | S2/S3-CI for implemented paths; #101/#102 complete new-path coverage by5/7 Dec |
| BR-07 | F-05 APPROVED prerequisite | S2 | S2-F05-AC02 | S2-F05-T02 | [I](../server/tests/submissions.integration.test.ts) parameterized `S2-F05-T02/AC02` DRAFT/SUBMITTED/REVISION_REQUESTED and unchanged DB/history | YES / PASS all three 409 prerequisites | S2-CI + S3-CI; reviewed/deployed S2-MAIN; #97 acceptance gates remain |
| BR-08 | F-06 grade bounds + F-07 no-self-peer | S2 + S3 final | S2-F06-AC02; S3-F07-AC08 | S2-F06-T02; S3-F07-T10 | [grade U](../server/tests/grading.unit.test.ts), [I](../server/tests/grading.integration.test.ts) `S2-F06-T02`; peer `S3-F07-T10` not created | PARTIAL: integer score0-100 PASS; no-self-peer NOT IMPLEMENTED | Grade S2/S3-CI; peer #101 target5 Dec |
| NFR-01 | F-01 auth middleware + every protected feature | All | AC-03 + route authentication checks | TEST-03/14/19 + each feature negative auth cases | [API/DB](../server/tests/api.integration.test.ts) TEST-03/14/19; implemented feature I anonymous cases; [routing U](../server/tests/routing-privacy.unit.test.ts) | Current implemented routes PASS; missing peer/F08 paths NOT RUN | S2/S3-CI; #101/#102 new paths before full-product claim |
| NFR-02 | Backend role/current membership + private DTOs | All | AC-10; S2/S3 ownership AC | TEST-10/23; S2-F04-T07; S2-F05-T07/T12; S2-F06-T05; S3-F07-T04/T08 | [API/DB](../server/tests/api.integration.test.ts) TEST-10/23; all implemented feature API negatives; [session UI](../client/src/App.sessionIsolation.test.tsx) | Current implemented paths PASS; future peer/CSV access not yet verified | S2/S3-CI; no global 100% coverage claim before #101/#102 |
| NFR-03 | F-01 hashes/DTO/env; presentation | All | AC-01/02/03; UIR-AC01/06 | TEST-01/02/13/19; UIR-T01/T02; source/config inspection | [API/DB](../server/tests/api.integration.test.ts) credential/hash/DTO/bootstrap cases; [UI](../client/src/App.uiRefresh.test.tsx) `UIR-T01/T02`; private env templates | Scoped checks PASS; no global Git-history zero-secrets certification | S2/S3-CI; final changed-source/config review #103/#104; no secret values in report |
| NFR-04 | Persistent API/DB/version transactions | All | AC-04/07/09 + all new save/read/history/race AC | TEST-04/07/09/15-18/21/22; feature I/E; actual migration cases | [API/DB](../server/tests/api.integration.test.ts) persistence and races; [S2 SQL](../server/tests/sprint2-release-migration.integration.test.ts) D2-CONT-05; [task SQL](../server/tests/collaboration-migration.integration.test.ts) S3-F07-T02-M | Implemented paths PASS; no invented legacy fields; peer/F08 and deployed RC remain | S2/S3-CI; actual final RC persistence #93/#103; #101/#102 future paths |
| NFR-05 | Build/container/health/readiness/deployment | S1-3 system | NFR-05 / D2-SYS-T01 | TEST-01; build/Docker CI; D2-SYS-T01 | [startup executable](../deploy/tests/test_startup_readiness.py), monotonic before docker run to valid health, source/DB/HTML, retained image/host/UTC JSON | PASS CI startup <=10,000ms; real main public smoke PASS; authenticated smoke SKIP | S2-CI1214.25ms; S3-CI510.48ms; main deployment45592525515; not Cloud Run cold-start timing |

## 2. Coverage boundaries and exact remaining work

- FR-01-09 have implemented workflows and named executable checks. All 27
  Sprint 2 AC and six F-07 task AC have actual results/reviews; Sprint 3 tasks
  are on staging, not deployed main. No required S2 feature moved to S3.
- FR-10/F-07 peer AC07-12 (including BR-08 no-self-rating) and FR-11/12/
  F-08 AC01-10 remain unimplemented/unexecuted. Their reviewed contracts are
  not test results. Existing proposal-state cards are not the F-08 feature.
- UIR-AC03/04/07/10 retain unverified full viewport/zoom/copy/contrast/final
  mobile-visual portions; supported scripted checks are named separately.
- NFR-01/02/04 span future routes; current passing negative/persistence tests
  cannot verify absent peer/analytics endpoints. NFR-03 scoped tests do not
  certify all Git history or disclose private deployment credentials.
- NFR-05 has real CI-container timing and metadata; it is not an unmeasured
  target anymore, but it is also not a Cloud Run cold-start measurement.
- S2 authenticated release/tag (#97), exact combined RC original continuity
  (#93/#103), final document reconciliation (#100) and assessed PDF/submission
  (#104) remain explicit gates. Historical RT-07 and authenticated-smoke SKIP
  retain their limitations; fresh anonymous health does not replace them.

Every missing AC/debt/measurement has an owner, dependency, concrete next action
and target in the [finish plan](sprints/deliverable-2/continuity-and-status.md#5-exact-remaining-work-risk-and-completion-plan),
including bounded work during examinations1-11 Dec and final13 Dec verification.

## 3. Approved Changes Log

| Change ID | Date | Affected IDs | Description of Change & Rationale | Approved By |
| :--- | :--- | :--- | :--- | :--- |
| **CHG-01** | 2026-11-05 | `BR-03`, `F-03` | Replaced terminal `REJECTED` state with `REVISION_REQUESTED` so teams whose proposals are rejected by an Instructor can revise and re-submit (`REVISION_REQUESTED` → `SUBMITTED`) without creating orphaned team records. | Pawarit & Tatchakorn |
| **CHG-02** | 2026-11-05 | `F-01`, `AD-02` | Added server-side token revocation tracking on `POST /api/auth/logout` in addition to client token removal, ensuring that reusing a logged-out JWT against protected backend endpoints is immediately rejected with `401 Unauthorized`. | Pawarit & Tatchakorn |
| **CHG-03** | 2026-11-06 | `F-01`, `AC-03`, `AD-02`, `NFR-03` | Require an explicitly configured JWT secret and persist logged-out token identifiers in PostgreSQL, so startup fails safely and revocation survives server restarts. | Pawarit & Tatchakorn |
| **CHG-04** | 2026-11-06 | `NFR-01`, `NFR-04` | Replaced unverified timing targets with observable authentication rejection and PostgreSQL persistence requirements; timing targets had no measuring test. | Pawarit & Tatchakorn |
| **CHG-05** | 2026-11-08 | `FR-02`, `F-02` UI | Approved deferring self-service team joining from Sprint 1. Students join an existing team when a current team member adds them by university email, matching the implemented ownership-guarded API and UI. | Tatchakorn Thamnimitr |
| **CHG-06** | 2026-11-22 | F-01 UI / shared presentation | User requested modern UI and removal of the demo Quick Fill box; real email/password auth remains. Direction recorded before code; specification reviewed in PR #107 and UI implemented/reviewed via PR #110, integrated main via #119. Real auth/team/proposal semantics retained; detailed manual visual acceptance remains scoped separately. | Tatchakorn (user direction); martinvadre specification review #107; opposite-member implementation review #110 |
| **CR-L7-01** | 2026-11-22, 20:18 Asia/Bangkok | FR-05 / BR-05 / F-03 | TA-approved revision feedback minimum 10 to 20 after trim (UTF-16); approval remains 10. Contract and code independently reviewed before maintained main release. | P'Tik (TA); teammate review/source in [approval record](labs/lab-07/approval-record.md) and [readiness](labs/lab-07/readiness-and-retrospective.md) |

## 4. Review, interpretation and history

PR #107 reviewed the shared DD-S2-01-04 / DD-S3-01-04 clarifications before
code: HTTP(S) links, permitted/flagged lateness, version-bound publications,
global instructor catalogue scope, peer completion/privacy/rating and coherent
CSV/analytics policy. Review of a future design is not implementation.

PR #110 implemented the refreshed shell; #116/#117/#118 reviewed F-04/F-05/F-06;
#119 integrated/deployed them with maintained Lab 7; #120 reviewed task progress
on Sprint 3 staging. TA CR-L7-01 approval, original pre-change lock and review
history remain in dated Lab 7 source. This #100 reconciliation retains all
baseline identifiers and approved rationale; it neither changes scope nor
approves/creates an accepted release, closing decision or submission receipt.
