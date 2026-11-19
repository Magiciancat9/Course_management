# CoursePMS Lab 6 report assembly draft — Parts A–D

Updated 19 November 2026 for EN-022_P6, Section 31 (public accounts: Magiciancat9 and martinvadre). Add required full identities privately when assembling the course PDF. This is a report source draft, not a submission receipt or a claim that all evidence requirements are independently established.

## Current decision/evidence map

| Product / scope | Decision / result | Evidence mode |
| --- | --- | --- |
| CoursePMS corrected Sprint 1 | Accepted, fastTrack A/B joint declaration on 17 November 22:30:56 Asia/Bangkok | [Retained confirmation](coursepms-acceptance-confirmed.md), representative-relayed; bounded partner retest and correction history unchanged |
| fastTrack Sprint 1 | Accepted as jointly reported by CoursePMS on 19 November | [Closeout](fasttrack-closeout-20261119.md): user reports all eight PASS; personal-session artifacts not retained; original 18 November Codex evidence attached as technical support |
| fastTrack section 3.5 | Exact retest Accepted; 3 case PASS / 16 file/HTTP comparisons PASS | [Verified retest](fasttrack-section35-retest-20261119.md): actual Codex browser operation, original supplied database projections, user-confirmed joint file review |

## Part A — Preparation, independent teams and exact versions

CoursePMS covers F-01 authentication/roles, F-02 teams and F-03 proposal submission/review across the eight ordered [cases](uat-cases.md). The independent partner is fastTrack / EN-028. [Pairing and handoff](partner-and-schedule.md) separates private access, actual versions, reported participation and receipt.

CoursePMS's corrected accepted source is `aeb804ea5bc667399b00cf54df10046a6ded46e0`, dated revision `course-pms-00009-mk2`; [release evidence](release-evidence.md) retains traffic/digest/CI and smoke limitations. fastTrack Sprint 1 uses `8e637e537cd037d630a5fffc1b5672d1b44371a8`. The section 3.5 simulation uses a different isolated service/source `1bbe187c088b86d104a16e420058f17425f18828`, partner-reported `fasttrack-lab6-00001-74k`. Never combine their versions as one acceptance target.

## Part B — Independent testing, actual observations and reported work

The historical fastTrack check of CoursePMS on `9c227359…` retains **36 core PASS assertions**, full ledger **56 PASS / 1 FAIL / 57**, including the original no-refresh stale-draft defect. Codex operated those checks; the historical Back/return deviation is retained. [Case assessment](execution-results.md) and [original return assessment](return-to-fasttrack.md) preserve the evidence.

The 18 November Codex browser/API run of fastTrack has **8 cases PASS / 18 active observations**, separate role contexts, real 409/403/404/401 checks and unchanged-state controls. The [dated case ledger](evidence/fasttrack-sprint1-20261118/case-summary.json), actual [observations](evidence/fasttrack-sprint1-20261118/observations.json) and selected images are public technical support. Older 13 November denominators remain separate and are not summed into this run.

The user reports that both CoursePMS members jointly tested/reviewed on 19 November **09:00–approximately 11:44**, all eight PASS, no outstanding defects, Accepted. Responsibility: Magiciancat9 UAT-01–04, martinvadre UAT-05–08. No separate human-session screenshots, fixture IDs, individual case times or 09:00 source observation were retained. Later source observations at 11:24/11:45 are not backdated. [Reported decision and limitations](evidence/fasttrack-closeout-20261119/reported-sprint1-acceptance.json).

## Part C — Findings, severity and disposition

CoursePMS `L6-OUT-EXP-001` / [#71](https://github.com/Magiciancat9/Course_management/issues/71) is the actual accepted Major defect: previous-account private editor fields remain after a no-refresh account switch. It establishes client memory exposure, not a server-authorization bypass. The correction also addresses Major foreign proposal metadata disclosure [#74](https://github.com/Magiciancat9/Course_management/issues/74) and Minor API routing [#75](https://github.com/Magiciancat9/Course_management/issues/75). [Triage](triage.md), [contract dispositions](contract-dispositions.md) and [fix evidence](fix-evidence.md) retain actual RED/GREEN and scope.

No new natural fastTrack defect is claimed in the bounded 18 November evidence. The isolated section 3.5 late-submission exercise is labelled as a simulation and is not substituted for the real CoursePMS findings. Earlier fictional [practice examples](simulation-example.md) remain fictional and are not actual participation evidence.

## Part D — Correction, review, deployment and retest

CoursePMS corrections [#72](https://github.com/Magiciancat9/Course_management/pull/72)/[#73](https://github.com/Magiciancat9/Course_management/pull/73), approved release [#76](https://github.com/Magiciancat9/Course_management/pull/76), RED/GREEN history, final **41 backend / 16 frontend / 3 E2E** CI and dated deployment identity are retained in [release evidence](release-evidence.md). The original optional pipeline authenticated smoke was SKIPPED and is not relabelled PASS. Partner's completed correction retest has **8 deployed targeted PASS**, plus RT-07 evidence/isolated replay PASS (**16 client / 19 selected server**, separate observation sets), with actual no-team and bounded role denial controls. [Completion](coursepms-retest-completion.md). Original failures, runner diagnostics and procedure limits remain historical.

The section 3.5 retest has: on-time UI POST **201** with same saved version 1 after reload; stale pre-deadline form POST after expiry **409 DEADLINE_PASSED**; one retry **409 DEADLINE_PASSED**; empty late lists and unchanged on-time control. BEFORE database time **10:42:36.820** and AFTER **10:51:57.192** Asia/Bangkok correctly bracket the rejected attempts. Both supplied JSON projections have zero late submissions and the same on-time submission ID/version/title/URL/submittedAt; all **16 comparisons PASS**. [Report and originals](fasttrack-section35-retest-20261119.md). Owner-side code review/RED-GREEN proof is distinct from this CoursePMS retest and is not newly certified here.

## Return receipt and final assembly

fastTrack receipt of the Sprint 1 acceptance record and section 3.5 confirmation was relayed by the user and recorded **19 November 12:42:46 Asia/Bangkok**. The partner intends report inclusion and will identify screenshots as supporting evidence from the separate 18 November Codex run. [Receipt](evidence/fasttrack-closeout-20261119/partner-receipt.json). This does not itself prove instructor approval or final report submission.

| Assembly item | Status / remaining work |
| --- | --- |
| Reciprocal product decisions | Recorded with their evidence modes and limits; see [acceptance ledger](acceptance-record.md) |
| Technical retest evidence | Publicly indexed, versioned and hashed; [index](evidence/README.md) |
| Private identities / original exchanges | Retained locally; add required identities to private course report only |
| Human-session evidence gap | Explicitly documented; not cured by copying Codex images or by receipt acknowledgement |
| PDF layout/page ranges | Assemble with teammate from this source and permitted evidence |
| Course rubric/deadline/portal | Verify against actual course handout; this update does not infer a new submission requirement |
| Final student review / submission receipt | Not recorded as completed by this documentation publication |

[Publication guide](evidence-publication.md) explains what belongs in public Git and what remains private. No runtime code, workflow, schema, live fixture, deployment or teacher submission is changed by this documentation update.
