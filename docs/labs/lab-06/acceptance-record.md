# Independent UAT acceptance records

Updated 17 November 2026 after the fastTrack follow-up. **Both human decisions remain PENDING.** The evidence tables below contain observed facts; the final decision forms are uncompleted templates. CI, code inspection and a preparation health check do not establish independent deployed acceptance.

## CoursePMS evidence — decision reserved for fastTrack

| Field | Verified evidence / limit |
| --- | --- |
| Product team | EN-022_P6, Tatchakorn Thamnimitr and Pawarit Wongdaeng |
| Independent team | EN-028 InfaCompany, planned Supapanya Yathip and Atip Infa-udom; personal case activity not supplied |
| Scope | Sprint 1 F-01–F-03 / AC-01–AC-10; CPMS-UAT-01–08 plus account-switch exploration |
| URL | <https://course-pms-859617270560.asia-southeast1.run.app> |
| Actual historical tested source | `9c22735995c985aaa0622b6b179de1ac9c1f80ca`, run CPMS-L6-20261114-155049, 14 November approximately 22:54–23:14 Asia/Bangkok, AI-operated |
| Results | 36 core PASS assertions; full ledger **56 PASS / 1 FAIL / 57**. Original report arithmetic corrected without changing source evidence. Browser Back/return deviation retained. |
| Finding | L6-OUT-EXP-001, Major, Issue #71. Additional contract findings #74 (roster privacy, Major) and #75 (API routing, Minor) are now resolved in the candidate, with independent release/retest still required. |
| Correction | Existing Draft #72 plus continued Draft #73; exact candidate/head/checks are in [release readiness](release-readiness.md) and its retained metadata |
| Serving revision | Historical owner observation: `course-pms-00008-hbv` at 100% on 15 November, not proof of current traffic or a corrected release |
| Fresh partner preflight | 17 November approximately 13:42 Asia/Bangkok: old source `9c227359…`, HTTP 200 / DB connected; supplied follow-up, not a correction retest |
| Current public readback | See [public preflight](evidence/followup-20261117/public-preflight.json); anonymous read-only preparation, not authenticated UAT |
| Corrected deployed retest | **BLOCKED** until reviewed release and matching serving metadata are supplied; no new retest PASS |
| Final decision | **PENDING**, reserved for fastTrack's actual human decision-makers |

The older `150dc5db3de5c829a7d9ef1adb545191cc37542d` selection was an earlier preparation baseline, not the later 14 November run. Earlier NOT RECORDED templates remain available in Git history; they do not override these dated observations.

## fastTrack evidence — decision reserved for actual CoursePMS students

| Field | Verified evidence / limit |
| --- | --- |
| Product / independent team | EN-028 InfaCompany / EN-022_P6 |
| URL | <https://fasttrack-app-kpx7au3w2a-as.a.run.app> |
| Recorded tested source | `8e637e537cd037d630a5fffc1b5672d1b44371a8` |
| Dated owner revision | `fasttrack-app-00003-rc7`, 100% traffic in the retained 14 November observation; reverify before a new session |
| AI-operated evidence | Separate denominators: 97 main API assertions; 7 post-UI controls; 26 follow-up UI observations; 25 final controls; 11 saved-state comparisons |
| Findings / deviations | No confirmed fastTrack product defect in the bounded follow-up. Sequential profiles, duplicate API procedure, deadline setup, validation fixture, session replay/history and other precision limits are retained in [member activity](member-activity.md). This is not exhaustive case acceptance. |
| Student participation | Original archive preserves an unwitnessed user-reported 13 November 17:30 session for both students. Actual individual case/actions/results were not supplied. New later AI work does not fill those fields. |
| Accepted minor limitations | None personally confirmed; actual decision-makers must record any conditions |
| Final exact-version decision | **PENDING**, to be selected and personally confirmed by actual CoursePMS students |

## Uncompleted final decision form — one per product

This is explicitly a **template**, not an actual decision or signature. Complete only from real independent evidence.

| Required final field | CoursePMS (fastTrack completes) | fastTrack (CoursePMS students complete) |
| --- | --- | --- |
| Exact tested source / serving revision / traffic | PENDING corrected release | PENDING reverified decision baseline |
| Actual decision-maker names / IDs | PENDING | PENDING |
| Actual decision date/time / timezone | PENDING | PENDING |
| Completed cases, actual results and evidence IDs | PENDING independent retest | PENDING personally confirmed scope/deviation review |
| Outstanding findings and explicit minor conditions | PENDING | PENDING |
| Decision and reason | PENDING; no option selected | PENDING; no option selected |
| Personal confirmation/channel | PENDING | PENDING |

Available final outcomes: Accepted; Accepted with explicitly documented minor limitations; Not Accepted. Required blocked cases or unresolved Critical/Major findings prevent acceptance. Fictional simulation is excluded from all actual results, activities, dates and signatures.
