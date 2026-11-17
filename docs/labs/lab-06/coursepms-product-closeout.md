# CoursePMS Product Team closeout

**Current focus: finish CoursePMS product-side technical records only.** The user acknowledged the supplied retest and explicitly deferred the reciprocal fastTrack work. This document completes the reviewable evidence chain; it does not sign for fastTrack, invent personal activity, or claim the whole Lab 6 submission is complete.

## Product-side outcome

CoursePMS's original Major draft isolation defect and the roster/API contract corrections are implemented, reviewed, integrated and deployed. fastTrack's supplied AI-operated targeted retest now reports **eight deployed PASS plus RT-07 evidence/isolated-replay PASS** on the exact released source. The user acknowledged receipt of that technical result. [Detailed retest and procedure assessment](coursepms-retest-completion.md).

The independent human acceptance field for CoursePMS is **PENDING fastTrack**, even though the product-side technical result is acknowledged. The reciprocal fastTrack outcome is not selected or advanced here.

## A — CoursePMS preparation and baseline

- Original scope: Sprint 1 F-01–F-03 / AC-01–AC-10; eight ordered [CoursePMS cases](uat-cases.md), [fixture rules](uat-data-and-reset.md) and [handoff](partner-handoff.md).
- Incoming 14 November run CPMS-L6-20261114-155049 tested `9c22735995c985aaa0622b6b179de1ac9c1f80ca`. Core official case assertions: **36 PASS**; actual full ledger: **56 PASS / 1 FAIL / 57**. The old 58-total narrative discrepancy and browser Back deviation are preserved.
- Historical source evidence and private images remain retained locally; no credential or private screenshot is published in this closeout.

## C — Incoming triage and resolution

| Finding / issue | Disposition | Actual resolution/retest |
| --- | --- | --- |
| L6-OUT-EXP-001 / #71 | Accepted defect, Major — prior private draft persisted across identity | Session boundaries and stale-response guards; RT-01–05 and RT-07 now pass in their stated modes |
| Directory proposal summaries / #74 | Accepted defect, Major — user's confirmed existing roster-only policy | Foreign proposals null/PRIVATE; own and Instructor access preserved; RT-03/08 pass |
| L6-OUT-EXP-002 / #75 | Accepted defect, Minor — versioned AC-03/JSON routing mismatch | Protected unsupported proposal namespace and JSON 404 before SPA; RT-09 pass |
| Report arithmetic | Evidence-summary discrepancy, not a product defect | Corrected to 56/1/57 without altering the original report |

[Triage](triage.md), [contract rationale](contract-dispositions.md), [fix chain](fix-evidence.md), [retained sanitized retest summary](evidence/coursepms-closeout-20261117/partner-retest-summary.json). Labels/owner links must remain traceable; no artificial CoursePMS defect or TA-controlled exercise is needed to substitute for its real correction chain.

## D — Correction, reviewed release and independent technical retest

| Stage | Actual evidence |
| --- | --- |
| Original RED / GREEN | `d3ea0116` (5 failed / 4 passed) -> `3b7de940` (9 passed) |
| Session follow-up RED / GREEN | `9834080` (3 failed / 11 passed) -> `6de3c9a` (14 client passed) |
| Roster/routing RED / GREEN | `dd45d9e` (HTTP 6 failed / 2 passed; UI 1 failed / 14 passed) -> `b29109d` (local HTTP/domain 17 passed; client 15 passed) |
| Final correction/review | #73 final `a309cea` with Instructor regression and helper removal; integrated #72 head `ae6f364`, substantive exact-head teammate approval |
| Release | #76 approved on staging `54ac5ee`; actual main merge/source **`aeb804ea5bc667399b00cf54df10046a6ded46e0`** |
| Deployment | [44074859743](https://github.com/Magiciancat9/Course_management/actions/runs/44074859743), SUCCESS; `course-pms-00009-mk2`, dated 100% traffic, immutable digest in [release evidence](release-evidence.md) |
| Main CI | 41 backend / 16 frontend / 3 E2E passed; zero skipped; production/Docker builds passed |
| Public post-deploy | 8/8 anonymous checks passed; optional pipeline login smoke remained SKIPPED |
| Incoming deployed retest | 17 November 19:11–19:15 and 21:30–21:33 Asia/Bangkok, Codex AI for fastTrack; 8 deployed case PASS, 1 exact-source review/isolated-replay PASS |
| Bounded preservation | Partner Instructor-authorized before/after directory unchanged, Team 5 / 3 members / Proposal 3 APPROVED revision 2; no successful business writes reported |

The staged/main merge SHA difference is explained in [release evidence](release-evidence.md); the deployed source must remain the main SHA above. This closeout changes no runtime/schema/workflow or deployment. No new live login, business write, reset or seed is performed by this intake.

## Tracker actions and actual limits

| Task | Product-side assessment / correct actor |
| --- | --- |
| #55 triage | Technical classifications, linked defect issues, merged triage and partner-returned acknowledgement evidence exist. Driver `Magiciancat9`; **reviewer `martinvadre`** reviews the current closeout/receipt trace and closes the task if its checklist is satisfied. Do not invent external chat timestamps. |
| #56 correction | RED/GREEN, regressions, contract/test documentation and reviewed correction merge are evidenced. **Reviewer `Magiciancat9`** may update/close the technical correction task based on those existing records at the user's request; that tracker action is not a new human PR approval or independent acceptance. |
| #57 release | Reviewed release, deployed identity, merged #77 release evidence, public smoke and later partner authenticated retest/readback are evidenced. **Reviewer `martinvadre`** must disposition the notification exception and remaining evidence requirements before closing the task. |
| #58 CoursePMS-facing portion | The technical partner retest is received and product-side acknowledged. **Formal fastTrack human decision remains pending.** The combined reciprocal task cannot be marked wholly complete from this side alone. |

Issue #57's requirement to notify **before** deployment was missed in the retained record. A later artifact proves the partner received release information sufficiently to test the identified source, but it does not prove a pre-deployment notice or an external message time/channel. That historical exception remains explicit. A dated owner console screenshot is still not supplied; dated Cloud Run CLI traffic/digest evidence is retained. No checkbox for a missed historical notice is changed to complete.

## Ready reply for the user — UNSENT

> We acknowledge your completed CoursePMS technical retest on aeb804ea5bc667399b00cf54df10046a6ded46e0: RT-01–06 and RT-08–09 deployed PASS, and RT-07 exact-source evidence/isolated-replay PASS with 16 client and 19 selected/mocked server tests as separate sets. We reviewed the bounded ID-0 Student-denial procedure against the released role guard and retained unchanged-directory evidence; it supports the stated negative-path claim without touching Proposal 3. The earlier runner diagnostics remain historical and are not classified as new product defects. We accept receipt of these technical results on the product side. Please return your actual human exact-version CoursePMS decision, deciding names/date/rationale/conditions when available; we have not signed for your team. We will handle our reciprocal fastTrack work separately in the next phase.

This draft has not been sent by the assistant. Actual reply time/channel/receipt are recorded only after real delivery. No acceptance outcome, signature, student attendance or prior appointment is fabricated.

## Scope boundary

Issues #53/#54, `execution-log.md`, outgoing fastTrack findings, personal fastTrack case forms and the reciprocal fastTrack decision are **left unchanged**. They remain deferred under the current user instruction, not completed by the CoursePMS retest. The final combined Parts A–D report/PDF and whole-course submission are not claimed complete.
