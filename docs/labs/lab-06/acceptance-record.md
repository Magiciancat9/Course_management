# Independent UAT acceptance records

Updated 17 November 2026 after the supplied partner confirmation: **CoursePMS is ACCEPTED** for `aeb804e…` / `course-pms-00009-mk2`, joint fastTrack A/B declaration recorded **22:30:56 Asia/Bangkok**. The source explicitly identifies representative-relayed confirmation, with no separately observed personal signatures. [Confirmation and limits](coursepms-acceptance-confirmed.md). The reciprocal fastTrack team decision was subsequently reported as Accepted on 19 November; its separate user-declaration/evidence limits are recorded below.

## CoursePMS evidence — decision reserved for fastTrack

| Field | Verified evidence / limit |
| --- | --- |
| Product team | EN-022_P6, Tatchakorn Thamnimitr and Pawarit Wongdaeng |
| Independent team / confirmers | EN-028 InfaCompany / fastTrack; joint A/B confirmation. Full names/student IDs are supplied in the private original and retained privately for report assembly. Exact per-member historical case details remain unitemized. |
| Scope | Sprint 1 F-01–F-03 / AC-01–AC-10; CPMS-UAT-01–08 plus account-switch exploration |
| URL | <https://course-pms-859617270560.asia-southeast1.run.app> |
| Actual historical tested source | `9c22735995c985aaa0622b6b179de1ac9c1f80ca`, run CPMS-L6-20261114-155049, 14 November approximately 22:54–23:14 Asia/Bangkok, AI-operated |
| Results | 36 core PASS assertions; full ledger **56 PASS / 1 FAIL / 57**. Original report arithmetic corrected without changing source evidence. Browser Back/return deviation retained. |
| Finding | #71 Major session isolation, #74 Major roster privacy and #75 Minor API routing are corrected/deployed; completed targeted retest passes in its stated modes. The separate supplied team decision is now ACCEPTED for this release and scope. |
| Correction/release | #72/#73 merged and reviewed; release #76 independently approved on `54ac5ee…` and merged as `aeb804ea5bc667399b00cf54df10046a6ded46e0`. See [release evidence](release-evidence.md). |
| Corrected serving revision | `course-pms-00009-mk2`, 100% per dated Cloud Run CLI output at 17 November 18:35:30 Asia/Bangkok; owner console screenshot remains pending. Old `course-pms-00008-hbv` is historical only. |
| Fresh partner preflight | 17 November approximately 13:42 Asia/Bangkok: old source `9c227359…`, HTTP 200 / DB connected; supplied follow-up, not a correction retest |
| Corrected public readback | [Post-deployment checks](evidence/deployed-20261117/public-smoke.json), approximately 18:37–18:38 Asia/Bangkok: matching source/DB, expected auth/JSON routing and HTML, 8/8; anonymous checks, not authenticated UAT |
| Corrected deployed retest | **Technical result received and product-side acknowledged:** 8 deployed PASS + RT-07 evidence/isolated replay PASS; 17 November 19:11–19:15 and 21:30–21:33 Asia/Bangkok, Codex AI for fastTrack. Includes actual no-team, bounded role denial and preserved-state readback. [Result/mode/limits](coursepms-retest-completion.md). The earlier optional pipeline login smoke remains SKIPPED; it is not relabelled PASS. |
| Product-side user acknowledgement | Current chat: user stated “ฉันรับผลเลย” and requested CoursePMS-only closeout. Recorded as technical receipt, not a named independent fastTrack decision or personal case-execution signature. |
| Final decision | **ACCEPTED**, recorded joint fastTrack A/B declaration, **17 November 2026 22:30:56 Asia/Bangkok**; no additional product acceptance condition beyond documented scope/procedure limits. |
| Confirmation method / limit | Project representative expressly relays the current A/B decision; B is representative-confirmed. No two separately observed personal submissions/signatures collected. This is not an AI test time or an invented earlier case-review time. |
| Source record | Private CoursePMS_Acceptance_Confirmation_Supplement_20261117.md; SHA-256 `762847b91b722011fe93d5cb6b08657f6f6a0f9bbf54fd6dc8b5a9a001a9e30a`; [sanitized ledger](evidence/coursepms-closeout-20261117/acceptance-confirmation-summary.json) |

The older `150dc5db3de5c829a7d9ef1adb545191cc37542d` selection was an earlier preparation baseline, not the later 14 November run. Earlier NOT RECORDED templates remain available in Git history; they do not override these dated observations.

## fastTrack — CoursePMS reported decision and technical evidence

| Field | Current record / limitation |
| --- | --- |
| Product / independent team | EN-028 InfaCompany / EN-022_P6 |
| Sprint 1 source | `8e637e537cd037d630a5fffc1b5672d1b44371a8` |
| Directly recorded browser evidence | 18 November 14:37:42–14:50:33 Asia/Bangkok; Codex operator; UAT-01–08 8 PASS, 18 active checks |
| Reported human review/testing | Magiciancat9 and martinvadre jointly, 19 November 09:00–approximately 11:44 Asia/Bangkok; source of this statement is the user |
| Reported case results / findings | All eight PASS; no outstanding defects, explicitly user-confirmed |
| Decision | **Accepted**, reported joint CoursePMS decision |
| Decision date / confirmation | 19 November 2026; confirmation recorded 11:46:32 Asia/Bangkok, not an invented exact earlier decision time |
| Evidence limitations | Separate human-session screenshots, fixture IDs and per-case times were not retained; no saved source check at 09:00; current traffic/revision not independently read back |
| Supporting images | Original 18 November Codex captures; attribution/date unchanged |
| Section 3.5 | Separate isolated source `1bbe187…`; 3 PASS and 16 database/HTTP comparisons PASS; exact retest Accepted; [verified section 3.5 retest](fasttrack-section35-retest-20261119.md) |
| Delivery | Partner receipt of both records relayed by user, recorded 19 November 12:42:46; intended report inclusion stated, not instructor approval |
| Evidence | [19 November fastTrack closeout](fasttrack-closeout-20261119.md); [case summary](evidence/fasttrack-sprint1-20261118/case-summary.json); [reported decision](evidence/fasttrack-closeout-20261119/reported-sprint1-acceptance.json) |

## Product-specific final decision records

Both columns record the supplied decisions with their evidence modes and limits. User-reported joint human work is not inferred from Codex screenshots, and no separate personal signature is generated.

| Required final field | CoursePMS (fastTrack completes) | fastTrack (CoursePMS students complete) |
| --- | --- | --- |
| Exact tested source / serving revision / traffic | Accepted `aeb804e…` / dated `course-pms-00009-mk2` / 100%, for recorded targeted scope | Sprint 1 `8e637e5…`; current revision/traffic unknown; separate section 3.5 `1bbe187…` / partner-reported `fasttrack-lab6-00001-74k` |
| Actual decision-maker names / IDs | Joint A/B; full identities supplied and retained in the private supplement | Magiciancat9 and martinvadre; private full identities retained outside Git |
| Actual decision date/time / timezone | 17 November 2026, 22:30:56 Asia/Bangkok (UTC+07:00) | 19 November 2026; confirmation 11:46:32 Asia/Bangkok, earlier exact decision time not retained |
| Completed cases, actual results and evidence IDs | RT-01–06 and RT-08–09 deployed PASS; RT-07 evidence/isolated-replay PASS; completed evidence accepted in the supplied declaration | User reports UAT-01–08 PASS; original 18 November Codex technical evidence separately published |
| Outstanding findings and explicit minor conditions | No new confirmed failure in bounded retest; existing scope/procedure limits retained; no additional product acceptance condition added | No outstanding defects reported; absent human-session artifacts/source-start evidence retained as documentation limits |
| Decision and reason | ACCEPTED: corrected original exposure; bounded privacy/access/logout/persistence/routing evidence passes with preserved authorized data | Accepted, as explicitly reported by user; separate section 3.5 technical acceptance corroborated by original snapshots |
| Personal confirmation/channel | Current joint declaration relayed by representative, including B; no two separately observed submissions/signatures. Exact per-member historical case review details remain unitemized. | User-relayed joint declaration and partner receipt; no independently observed personal action times or signatures |

Available final outcomes: Accepted; Accepted with explicitly documented minor limitations; Not Accepted. Required blocked cases or unresolved Critical/Major findings prevent acceptance. The earlier fictional practice example is excluded from actual participation and decision records. The executed isolated section 3.5 exercise retains its actual dates, source and operator.
