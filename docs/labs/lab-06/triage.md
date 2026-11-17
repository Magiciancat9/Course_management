# Incoming finding triage — 17 November 2026

Latest continuation: the user's roster-only decision and versioned AC-03
resolve both former clarifications as corrected candidate defects #74/#75.
See [contract dispositions](contract-dispositions.md), [follow-up response](followup-response.md)
and [current acceptance record](acceptance-record.md). Human review, release
and independent deployed retest remain pending.

Prepared by Codex under authenticated GitHub account `Magiciancat9`. This records technical assessment and proposed team actions, not a human approval or delivered acknowledgement. Task [#55](https://github.com/Magiciancat9/Course_management/issues/55); correction task [#56](https://github.com/Magiciancat9/Course_management/issues/56).

## Receipt and provenance

The user supplied `FastTrack-to-CoursePMS-Lab6-20261117.zip` in this coding session. All 58 payload hashes in its manifest were verified locally. Originals remain privately under `artifacts/FastTrack-to-CoursePMS-Lab6-20261117/` in the primary checkout and are excluded from the return export. They have not been added to this branch. There is no confirmed partner chat receipt or retest appointment.

The incoming run is `CPMS-L6-20261114-155049`, source `9c22735995c985aaa0622b6b179de1ac9c1f80ca`, approximately 22:54–23:14 Asia/Bangkok on 14 November. Its operator was AI. The actual retained ledger contains **56 PASS / 1 FAIL / 57 assertions**, including **36 core passing assertions** across CPMS-UAT-01–08. The original report's 58-total narrative is preserved as a source discrepancy; no missing assertion is inferred. Browser Back in case 01 reached `about:blank`, followed by return/reload, so an exact browser-history procedure is not established.

## Dispositions

| Item | Technical assessment and requirement | Disposition / next action |
| --- | --- | --- |
| L6-OUT-EXP-001 | Account A's four private draft fields remain in B's editor after logout/login without reload. Violates SRS BR-06 ownership isolation and the Student privacy contract. The exposure is in client memory; no API authorization bypass or saved copying is established. Reload does not undo disclosure. | **Accepted defect, Major**, consistent with existing [#71](https://github.com/Magiciancat9/Course_management/issues/71). Existing owner: Pawarit / `martinvadre`; designated original reviewer: Tatchakorn / `Magiciancat9`. Human review of this disposition remains pending. Original fix [#72](https://github.com/Magiciancat9/Course_management/pull/72); additional review corrections [#73](https://github.com/Magiciancat9/Course_management/pull/73). Do not create a duplicate issue. |
| L6-OUT-EXP-002, bare `GET /api/proposals` | AC-03 explicitly protects `/api/proposals`; SDS specifies JSON and no collection-list feature. The production wildcard nevertheless returned HTML. | **Accepted defect / Minor**, [#75](https://github.com/Magiciancat9/Course_management/issues/75). Corrected candidate: proposal namespace auth, then JSON 404 for unsupported routes. No new collection endpoint or foreign-read exception. |
| Directory title summaries | Existing sanitizer exposed foreign proposal metadata despite SDS section 3.3 public-roster-only. The user explicitly selected roster-only privacy on 17 November. | **Accepted defect / Major**, [#74](https://github.com/Magiciancat9/Course_management/issues/74). Corrected candidate: foreign `proposal: null`, own/instructor details preserved; UI `PRIVATE`. |
| Original assertion count | Machine ledger and narrative disagree; 57 actual records, no CPMS-A-058 record. | Evidence-summary correction acknowledged; **not a CoursePMS product defect**. |

Version references: the assessment starts from PR #72 head `2e3f22a34faa53ec87070e61b49d6b35e438a92c`, based on `c2aa849f2c0a3301f47dd4c4342643ac42b038cd`; pre-contract-fix candidate `316abac98c721078154588c37ad9f0eda655d9d6` retains the cited SRS/SDS/AC text. The user policy decision and actual RED/GREEN are recorded in [contract dispositions](contract-dispositions.md). Formal peer review/release/retest are still required for closure.

## Reproduction and correction evidence

Historical UI-24/25/26 and CPMS-UI-022 document the live defect. A new isolated replay of original RED commit `d3ea0116006c7338f6d7f54aaf7c7b3f4e9ffb63` reproduced **5 failed / 4 passed** client tests. Review of #72 then found three further failing assertions: delayed login restores A after B loads; a private title banner survives a storage account switch; adding a teammate replaces unsaved edits with saved fields. All three fail on follow-up test commit `9834080` and pass with code commit `6de3c9a8b3404b831041a9b9fe855d1d52f9cac3`. See [follow-up verification](session-followup.md).

## Closure conditions

Pawarit inspects the follow-up; an eligible teammate reviews the integrated latest head, CI passes, and integration/release follow the existing no-self-merge rule. Only an authorized reviewed release may be deployed. fastTrack then independently retests that identified deployment and records its own decision. Until then, the Major finding and CoursePMS acceptance remain open. No release, external acknowledgement, retest or human signature is claimed here.
