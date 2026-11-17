# Independent UAT acceptance records

Updated 17 November 2026 after receipt of the completed CoursePMS technical retest. The user acknowledges the product-side result: **8 deployed targeted PASS plus RT-07 evidence/isolated-replay PASS** on `aeb804e…`. **Formal independent human decisions remain PENDING.** The user acknowledgement does not sign for fastTrack. Reciprocal fastTrack records below are unchanged and deferred by the current user instruction. [CoursePMS completion](coursepms-retest-completion.md).

## CoursePMS evidence — decision reserved for fastTrack

| Field | Verified evidence / limit |
| --- | --- |
| Product team | EN-022_P6, Tatchakorn Thamnimitr and Pawarit Wongdaeng |
| Independent team | EN-028 InfaCompany, planned Supapanya Yathip and Atip Infa-udom; personal case activity not supplied |
| Scope | Sprint 1 F-01–F-03 / AC-01–AC-10; CPMS-UAT-01–08 plus account-switch exploration |
| URL | <https://course-pms-859617270560.asia-southeast1.run.app> |
| Actual historical tested source | `9c22735995c985aaa0622b6b179de1ac9c1f80ca`, run CPMS-L6-20261114-155049, 14 November approximately 22:54–23:14 Asia/Bangkok, AI-operated |
| Results | 36 core PASS assertions; full ledger **56 PASS / 1 FAIL / 57**. Original report arithmetic corrected without changing source evidence. Browser Back/return deviation retained. |
| Finding | #71 Major session isolation, #74 Major roster privacy and #75 Minor API routing are corrected/deployed; completed targeted technical retest now reports PASS in its stated modes. No new product failure is confirmed in the bounded retest. Formal independent acceptance remains separate. |
| Correction/release | #72/#73 merged and reviewed; release #76 independently approved on `54ac5ee…` and merged as `aeb804ea5bc667399b00cf54df10046a6ded46e0`. See [release evidence](release-evidence.md). |
| Corrected serving revision | `course-pms-00009-mk2`, 100% per dated Cloud Run CLI output at 17 November 18:35:30 Asia/Bangkok; owner console screenshot remains pending. Old `course-pms-00008-hbv` is historical only. |
| Fresh partner preflight | 17 November approximately 13:42 Asia/Bangkok: old source `9c227359…`, HTTP 200 / DB connected; supplied follow-up, not a correction retest |
| Corrected public readback | [Post-deployment checks](evidence/deployed-20261117/public-smoke.json), approximately 18:37–18:38 Asia/Bangkok: matching source/DB, expected auth/JSON routing and HTML, 8/8; anonymous checks, not authenticated UAT |
| Corrected deployed retest | **Technical result received and product-side acknowledged:** 8 deployed PASS + RT-07 evidence/isolated replay PASS; 17 November 19:11–19:15 and 21:30–21:33 Asia/Bangkok, Codex AI for fastTrack. Includes actual no-team, bounded role denial and preserved-state readback. [Result/mode/limits](coursepms-retest-completion.md). The earlier optional pipeline login smoke remains SKIPPED; it is not relabelled PASS. |
| Product-side user acknowledgement | Current chat: user stated “ฉันรับผลเลย” and requested CoursePMS-only closeout. Recorded as technical receipt, not a named independent fastTrack decision or personal case-execution signature. |
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
| Exact tested source / serving revision / traffic | Technical retest on `aeb804e…` / dated `course-pms-00009-mk2` / 100%; formal human decision pending | PENDING reverified decision baseline |
| Actual decision-maker names / IDs | PENDING | PENDING |
| Actual decision date/time / timezone | PENDING | PENDING |
| Completed cases, actual results and evidence IDs | RT-01–06 and RT-08–09 deployed PASS; RT-07 evidence/isolated-replay PASS; detailed technical report received. Human decision remains pending. | PENDING personally confirmed scope/deviation review |
| Outstanding findings and explicit minor conditions | PENDING | PENDING |
| Decision and reason | PENDING; no option selected | PENDING; no option selected |
| Personal confirmation/channel | PENDING | PENDING |

Available final outcomes: Accepted; Accepted with explicitly documented minor limitations; Not Accepted. Required blocked cases or unresolved Critical/Major findings prevent acceptance. Fictional simulation is excluded from all actual results, activities, dates and signatures.
