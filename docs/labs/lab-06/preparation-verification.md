# UAT preparation verification

This ledger records preparation, not independent test execution or acceptance.
Times are Asia/Bangkok.

| Item | Evidence and status |
|---|---|
| Reciprocal teams | EN-022_P6 tests fastTrack; EN-028 InfaCompany tests CoursePMS. Members and coordination: [partner and schedule](partner-and-schedule.md). |
| CoursePMS scope and cases | Sprint 1 F-01--F-03 and AC-01--AC-10; the agreed ZIP contains eight ordered cases. [Repository cases](uat-cases.md) adapt the packet; peer walkthrough and partner receipt of the corrected course step remain to be confirmed. |
| CoursePMS selected source | `150dc5db3de5c829a7d9ef1adb545191cc37542d`; Sprint 1 tag `v1.0.0-sprint1` points to `5979f5870e8e28277996dc3045cbf4be5f7236ad`. These are distinct. |
| CoursePMS health and readiness | On 13 November 2026 approximately 17:29 and 19:09, health and readiness returned HTTP 200; health reported the selected source and readiness database connected. |
| CoursePMS public access checks | At approximately 17:29, anonymous `GET /api/teams` returned 401 `UNAUTHORIZED`; empty login returned 400 `VALIDATION_ERROR`. These do not replace role or session UAT. |
| Public screenshot | [Cropped CoursePMS banner](evidence/coursepms-public-banner.png), captured from the public application during preparation. It contains no case outcome and does not prove a revision. |
| CoursePMS deployment revision | Deployment run `43368602701` reported `course-pms-00006-sbx` with 100% traffic then. Product Team must confirm the revision serving the actual UAT session. |
| Accounts | Product Team reported checks and private credential delivery; independent per-account checks and current alias/fixture states are not recorded. Original seed has only three initially unassigned students; verify a fourth eligible account or agree an alternative. |
| fastTrack source and endpoints | At 17:42 on 13 November 2026, health and readiness returned 200 and selected source `8e637e537cd037d630a5fffc1b5672d1b44371a8`. Its historical Sprint 1 tag is `v1.0.0-sprint-1` at `ae7a60a6e3ed0a363dcee920ac1774a02f4f4ab8`. |
| fastTrack revision | `fasttrack-app-00003-rc7` is described by the partner as historical; current traffic needs Product Team confirmation. |
| Schedule and receipt | Initial UAT and retest appointments are proposed, not proof of attendance. Actual session times and packet receipt are not fully confirmed. |
| Independent execution and decisions | No independent results or acceptance decisions are recorded in this folder. |

## Before starting

1. Recheck each selected application's health and readiness and obtain the
   Product Team's current serving revision; record the exact session baseline.
2. Confirm both participants, appointment, packet receipt, course/fixture
   state, private access, evidence location and defect channel.
3. Walk through case dependencies and the corrected CoursePMS course step.
   If a prerequisite cannot be met, record the affected case/subcheck BLOCKED.
4. Retain synthetic records for retest; do not reset or seed the shared
   database. Store no passwords, tokens or authorization headers in evidence.

The consolidated handoff and cases remain under peer review in
[PR #61](https://github.com/Magiciancat9/Course_management/pull/61);
authentication and fixture review remains tracked in
[#48](https://github.com/Magiciancat9/Course_management/issues/48) and
[#50](https://github.com/Magiciancat9/Course_management/issues/50).
