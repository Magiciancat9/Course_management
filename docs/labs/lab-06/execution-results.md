# Independent UAT execution results

**No independent execution has been recorded here.** Preparation checks
below are not UAT passes. Add actual results for each direction without
overwriting an earlier failure or blocked attempt.

## Preparation observations, not UAT

| Product and time (Asia/Bangkok) | Actual observation | Limitation |
|---|---|---|
| CoursePMS, 13 November 2026 approximately 17:29 | `/`, `/api/health` and `/api/ready` returned HTTP 200; health matched `150dc5db3de5c829a7d9ef1adb545191cc37542d`; readiness reported database connected. Unauthenticated `GET /api/teams` returned 401 `UNAUTHORIZED`; empty login returned 400 `VALIDATION_ERROR`. | Product-team preparation, not a partner test; no traffic revision proof. |
| CoursePMS, 13 November 2026 approximately 19:09 | `/api/health` returned HTTP 200 and the selected commit; `/api/ready` returned HTTP 200 and database connected. | Current serving revision and independent session remain unconfirmed. |
| fastTrack, 13 November 2026 approximately 17:42 | `/api/health` and `/api/ready` returned HTTP 200 and selected version `8e637e537cd037d630a5fffc1b5672d1b44371a8`. | Historical preparation observation, not a session or current revision confirmation. |

[Public CoursePMS banner](evidence/coursepms-public-banner.png) is a cropped
preparation image, not evidence that any UAT case passed.

## CoursePMS tested by EN-028 InfaCompany

| Session field | Record |
|---|---|
| Planned independent testers | Supapanya Yathip and Atip Infa-udom; actual participation not recorded |
| Application | <https://course-pms-859617270560.asia-southeast1.run.app> |
| Selected source | `150dc5db3de5c829a7d9ef1adb545191cc37542d`; source at session not yet recorded |
| Serving revision, date/time and environment | Not confirmed for an actual session |
| Packet and fixtures | Eight cases in [UAT cases](uat-cases.md); partner receipt and starting fixture not yet confirmed |

| Case | Expected coverage | Result | Actual observation / evidence / finding |
|---|---|---|---|
| CPMS-UAT-01 | Authentication, identity and logout | NOT RUN | Not recorded |
| CPMS-UAT-02 | Team creation and second member | NOT RUN | Not recorded |
| CPMS-UAT-03 | Duplicate membership and capacity | NOT RUN | Not recorded |
| CPMS-UAT-04 | Incomplete submission | NOT RUN | Not recorded |
| CPMS-UAT-05 | Complete submission and lock | NOT RUN | Not recorded |
| CPMS-UAT-06 | Cross-team and role denial | NOT RUN | Not recorded |
| CPMS-UAT-07 | Review, revise and approve | NOT RUN | Not recorded |
| CPMS-UAT-08 | Readback after reload/relogin | NOT RUN | Not recorded |

## fastTrack tested by EN-022_P6

| Session field | Record |
|---|---|
| Planned independent testers | Tatchakorn Thamnimitr and Pawarit Wongdaeng; actual participation not recorded |
| Application | <https://fasttrack-app-kpx7au3w2a-as.a.run.app> |
| Selected source | `8e637e537cd037d630a5fffc1b5672d1b44371a8`; source at session not yet recorded |
| Serving revision, date/time and environment | Not confirmed for an actual session |
| Cases | Use the IDs and steps in the partner's [UAT package](https://github.com/zerotwobook/fastTrack/tree/docs/s2-a-lab6-uat/docs/labs/lab-06); actual execution not recorded |

## How to record a real case

For each case and required subcheck record product, case/AC, tester and role,
date/time and time zone, tested URL/source/revision, fixture and actual input,
steps, expected result, actual result, PASS/FAIL/BLOCKED and reason, evidence
ID and finding link. PASS requires all required subchecks; a disabled UI
control is not an observed API status. For rejected writes compare authorized
before/after state. Redact personal data, credentials, login responses, tokens
and authorization headers before sharing evidence.
