# Independent UAT execution results

The tables below preserve earlier preparation and unexecuted-case records.
The 17 November private handoff now supplies dated AI-operated evidence for
both directions: CoursePMS core 36 PASS assertions, full ledger 56 PASS / 1 FAIL / 57;
reciprocal fastTrack evidence has separate denominators and procedure deviations.
See [report Part B](report-draft.md) and [return package](return-to-fasttrack.md)
for the updated assessment. This does not retroactively change earlier NOT RUN
entries into personal student execution. CoursePMS is now **ACCEPTED** under the
later supplied joint A/B declaration; reciprocal fastTrack decision/state below
is unchanged. [Accepted record](coursepms-acceptance-confirmed.md).

## Preparation observations, not UAT

| Product and time (Asia/Bangkok) | Actual observation | Limitation |
|---|---|---|
| CoursePMS, 13 November 2026 approximately 17:29 | `/`, `/api/health` and `/api/ready` returned HTTP 200; health matched `150dc5db3de5c829a7d9ef1adb545191cc37542d`; readiness reported database connected. Unauthenticated `GET /api/teams` returned 401 `UNAUTHORIZED`; empty login returned 400 `VALIDATION_ERROR`. | Product-team preparation, not a partner test; no traffic revision proof. |
| CoursePMS, 13 November 2026 approximately 19:09 | `/api/health` returned HTTP 200 and the selected commit; `/api/ready` returned HTTP 200 and database connected. | Current serving revision and independent session remain unconfirmed. |
| CoursePMS, 13 November 2026 approximately 19:43 | `/api/health` returned HTTP 200 and the selected commit; `/api/ready` returned HTTP 200 and database connected. | Read-only preparation, not a UAT result or current revision confirmation. |
| fastTrack, 13 November 2026 approximately 17:42 | `/api/health` and `/api/ready` returned HTTP 200 and selected version `8e637e537cd037d630a5fffc1b5672d1b44371a8`. | Historical preparation observation, not a session or current revision confirmation. |

[Public CoursePMS banner](evidence/coursepms-public-banner.png) is a cropped
preparation image, not evidence that any UAT case passed.

## CoursePMS tested by EN-028 InfaCompany

Current CoursePMS product-side technical outcome: completed partner retest received
and acknowledged by the user. Operator was Codex AI for fastTrack; no student's
personal attendance is inferred. The later supplied joint A/B declaration records
**CoursePMS ACCEPTED at 17 November 22:30:56 Asia/Bangkok**, with representative
relay and activity-granularity limits retained. [Confirmation](coursepms-acceptance-confirmed.md).

| Historical official case | Actual core assertions on 14 November, source 9c227359 | Limit |
| --- | --- | --- |
| CPMS-UAT-01 | 7 PASS | Back reached about:blank then return/reload; deviation retained |
| CPMS-UAT-02 | 2 PASS | Original team creation/membership; no new write rerun claimed |
| CPMS-UAT-03 | 3 PASS | Original duplicate/capacity checks; no membership recycling |
| CPMS-UAT-04 | 2 PASS | Original incomplete-submit observations |
| CPMS-UAT-05 | 2 PASS | Original complete-submit/lock observations |
| CPMS-UAT-06 | 6 PASS | Original ownership/role observations |
| CPMS-UAT-07 | 8 PASS | Original review/revise/approve lifecycle, not repeated in read-only retest |
| CPMS-UAT-08 | 6 PASS | Original persistence observations |

The original full ledger is **56 PASS / 1 FAIL / 57**, including these 36 core
PASS assertions. The separate original client-state failure remains retained.
These are bounded AI observations, not each student's personal execution.

| Corrected-release retest | Actual result / version |
| --- | --- |
| Deployed source | aeb804ea5bc667399b00cf54df10046a6ded46e0 / dated course-pms-00009-mk2, 100% |
| Original targeted execution | 17 November 19:11-19:15 Asia/Bangkok, Codex AI for fastTrack |
| Additional execution | 17 November 21:30-21:33 Asia/Bangkok, no-team and bounded Student review denial |
| RT-01-06 and RT-08-09 | **8 deployed targeted case PASS** in stated bounded procedures |
| RT-07 | **PASS evidence inspection + isolated replay**, 16 client / 19 selected server, separate sets; no live-race claim |
| Preservation | Partner authorized directory unchanged; Team 5 / 3 members / Proposal 3 APPROVED revision 2 |
| Formal decision | **ACCEPTED**, supplied joint fastTrack A/B declaration at 17 November 22:30:56 Asia/Bangkok; representative relay and private identities retained |

The prior seven anonymous, eight authenticated and fourteen additional records
are separate observation sets. Node 26 runner diagnostics remain historical;
the unchanged client suite passed 16/16 on Node 20. They are not seven new
confirmed product bugs. No lifecycle write/reset/account creation was performed
by this intake. Private originals remain local; [sanitized provenance](evidence/coursepms-closeout-20261117/partner-retest-summary.json).

## fastTrack tested by EN-022_P6

| Session field | Record |
|---|---|
| Planned independent testers | Tatchakorn Thamnimitr and Pawarit Wongdaeng; actual participation not recorded |
| Application | <https://fasttrack-app-kpx7au3w2a-as.a.run.app> |
| Selected source | `8e637e537cd037d630a5fffc1b5672d1b44371a8`; source at session not yet recorded |
| Serving revision, date/time and environment | Not confirmed for an actual session |
| Cases | Use the IDs and steps in the partner's [UAT package](https://github.com/zerotwobook/fastTrack/tree/docs/s2-a-lab6-uat/docs/labs/lab-06); Batch 1 (`UAT-01`--`UAT-04`) is recorded as `BLOCKED` in [execution log](execution-log.md). Unblock requires: (1) private credential delivery (`SA`, `A1`) from `fastTrack`, and (2) `fastTrack` confirmation of session date/time and serving Cloud Run revision/traffic. |

| Case | Expected coverage | Result | Actual observation / evidence / finding |
|---|---|---|---|
| UAT-01 | Create and read a milestone (Normal) | BLOCKED | `2026-11-14T19:34+07:00`: anonymous `/api/health` and `/api/ready` returned `HTTP 200` (`version: 8e637e537cd037d630a5fffc1b5672d1b44371a8`), but private `SA`/`A1` credentials and partner session/revision confirmation have not been delivered by `fastTrack`. See [execution log](execution-log.md). |
| UAT-02 | Submit work and read append-only feedback (Normal) | BLOCKED | Blocked by `UAT-01` and missing private `SA`/`A1` credentials from `fastTrack`. See [execution log](execution-log.md). |
| UAT-03 | Enforce one shared submission (Business rule) | BLOCKED | Blocked by `UAT-02` and missing private `A1` credentials from `fastTrack`. See [execution log](execution-log.md). |
| UAT-04 | Reject late submission after deadline (Boundary) | BLOCKED | Missing private `SA`/`A1` credentials and partner session/revision confirmation from `fastTrack`. See [execution log](execution-log.md). |

## How to record a real case

For each case and required subcheck record product, case/AC, tester and role,
date/time and time zone, tested URL/source/revision, fixture and actual input,
steps, expected result, actual result, PASS/FAIL/BLOCKED and reason, evidence
ID and finding link. PASS requires all required subchecks; a disabled UI
control is not an observed API status. For rejected writes compare authorized
before/after state. Redact personal data, credentials, login responses, tokens
and authorization headers before sharing evidence.
