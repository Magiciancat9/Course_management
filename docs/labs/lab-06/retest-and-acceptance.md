# Retest and acceptance — Final records (Lab6-12)

This document records both teams' final acceptance records for Issue [#58](https://github.com/Magiciancat9/Course_management/issues/58):

1. **CoursePMS-facing record** (independent decision collected from `fastTrack` — preserved verbatim in scope/method/limits).
2. **fastTrack-facing record** (`EN-022_P6` independent retest and Sprint 1 + Section 3.5 acceptance records).

## 1. CoursePMS-facing record (fastTrack decision on CoursePMS)

This record completes collection of the independent team's decision about **CoursePMS** in Issue #58. The reciprocal fastTrack decision in Section 2 below does not change the CoursePMS acceptance record.

| CoursePMS-facing field | Actual record |
| --- | --- |
| Independent decision | **ACCEPTED**, recorded joint fastTrack A/B confirmation |
| Source / serving revision | `aeb804ea5bc667399b00cf54df10046a6ded46e0` / `course-pms-00009-mk2` |
| Decision time | **17 November 2026, 22:30:56 Asia/Bangkok** |
| Deciding identities | A/B full names/student IDs supplied in the private supplement; retained privately for report assembly |
| Confirmation mode | Representative relays current joint acceptance; B is representative-confirmed; no two separately observed submissions/signatures claimed |
| Evidence / reason | 8 deployed targeted PASS plus RT-07 evidence/isolated-replay PASS; corrected original exposure and bounded privacy/auth/routing/persistence checks; no new confirmed failure in this scope |
| Limits / conditions | Existing scope, RT-07 mode and bounded ID-0 denial limits retained; no new product acceptance condition added |
| Human contribution granularity | Shared checking confirmed; exact per-member historical case items/times not supplied; prospective review assignments not marked complete |

[Full sanitized acceptance record](coursepms-acceptance-confirmed.md), [technical retest](coursepms-retest-completion.md), [release identity/proof](release-evidence.md), [product closeout](coursepms-product-closeout.md).

## 2. fastTrack-facing record (CoursePMS UAT Team decision on fastTrack)

### 2.1 fastTrack Sprint 1 acceptance

| fastTrack Sprint 1 field | Actual record |
| --- | --- |
| Final decision | **Accepted** (user-reported joint CoursePMS decision; `0` outgoing reproducible defects in [outgoing defect reports](defects-outgoing.md)) |
| Product / URL | `fastTrack` Sprint 1 (`EN-028 InfaCompany`) / <https://fasttrack-app-kpx7au3w2a-as.a.run.app/> |
| Tested source / revision | `8e637e537cd037d630a5fffc1b5672d1b44371a8` (Cloud Run revision/traffic not independently read back during the technical run) |
| Deciding members | `Magiciancat9` (UAT-01–04) and `martinvadre` (UAT-05–08); full names/student IDs retained privately for report assembly |
| Decision & session timing | User-declared joint testing/review on **19 November 2026, 09:00–~11:44 Asia/Bangkok**; decision confirmation recorded **11:46:32 Asia/Bangkok** (separate original decision time not retained) |
| Technical execution evidence | Codex run `L6-CPMS-AI-20261118-144203` (**18 November 2026, 14:37:42–14:50:33 Asia/Bangkok**): `UAT-01`–`UAT-08` **8/8 PASS**, `18` active observations (`1` invalidated harness-count observation, not a product defect) |
| Reason & conditions | All eight Sprint 1 cases passed with `0` reproducible product defects; historical `14 November 2026` Batch 1 `BLOCKED` entries remain preserved separately |
| Evidence & confirmation limits | User-supplied declaration; no separate human-session screenshot, fixture ID, Network capture, or per-case time was retained. Partner receipt of the Sprint 1 acceptance record and Section 3.5 confirmation was recorded **19 November 2026, 12:42:46 Asia/Bangkok** ([partner receipt](evidence/fasttrack-closeout-20261119/partner-receipt.json)). |

### 2.2 fastTrack isolated Section 3.5 controlled retest

| Section 3.5 retest field | Actual record |
| --- | --- |
| Technical result & decision | **PASS / Accepted** (for this isolated controlled exercise only; separate from Sprint 1) |
| Application / source / revision | <https://fasttrack-lab6-970128017651.asia-southeast1.run.app> / `1bbe187c088b86d104a16e420058f17425f18828` / partner-reported `fasttrack-lab6-00001-74k` (no independent control-plane readback) |
| Run & joint review timing | Codex AI run `20261119-103240-7a83` (**19 November 2026, 10:32:39–10:49:46 Asia/Bangkok**); joint file review by `Magiciancat9` and `martinvadre` (~`11:23 Asia/Bangkok`, user-confirmed; exact technical comparison `11:23:18 Asia/Bangkok`) |
| Executed cases & proof | `CPMS-S35-01` (on-time `201` + reload), `CPMS-S35-02` (stale form after deadline `409 DEADLINE_PASSED`), `CPMS-S35-03` (retry `409 DEADLINE_PASSED` + empty late view): **3/3 PASS**; **16/16** database snapshot comparisons PASS ([snapshot comparison](evidence/fasttrack-s35-20261119/snapshot-comparison.json)) |
| Supporting records | [Section 3.5 verified retest](fasttrack-section35-retest-20261119.md), [fastTrack closeout](fasttrack-closeout-20261119.md), [acceptance ledger](acceptance-record.md) |

Issue #58 is not automatically closed by this documentation update. Original evidence files, timestamps, and attribution limits remain intact.
