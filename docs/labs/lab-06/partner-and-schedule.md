# Lab 6 partner pairing, packet exchange, and schedule

**Status: coordination record; independent execution and acceptance remain
pending.** This document distinguishes material received from the partner,
anonymous read-only observations, user-supplied arrangements, and facts that
still require a direct confirmation. A prepared packet, CI result, API check,
or AI-assisted observation is not a substitute for two students' independent
UAT execution.

## Teams and reciprocal roles

| Team | Product | Members | Lab 6 responsibility |
|---|---|---|---|
| EN-022_P6, Section 31 | CoursePMS | Tatchakorn Thamnimitr, 67070503415 (`Magiciancat9`); Pawarit Wongdaeng, 67070503466 (`martinvadre`) | Product Team for CoursePMS; independent UAT Team for fastTrack |
| EN-028, Section 31, InfaCompany | fastTrack | Supapanya Yathip, 67070503443 (`zerotwobook`); Atip Infa-udom, 67070503446 (`Atip-Infa`) | Product Team for fastTrack; independent UAT Team for CoursePMS |

Both members of each UAT Team must participate in testing the other team's
product. Planned names, repository history, and AI-assisted checks do not
prove attendance or independently tested outcomes; record actual participation
in [execution results](execution-results.md).

## Packet exchange ledger

| Direction / material | What is available | Status and boundary |
|---|---|---|
| fastTrack → CoursePMS | Partner package at [fastTrack Lab 6](https://github.com/zerotwobook/fastTrack/tree/docs/s2-a-lab6-uat/docs/labs/lab-06); supplied local archive `coursepms-fasttrack-lab6-20261113.zip` was read without extraction or script execution. | Packet/source reference received. The archive identifies prepared-packet source commit `749e5676a44b014b8c070ee2c5ba1bf4b03b245f` and includes cases, handoff, templates, contracts, and an evidence inventory. Its historical templates retain `NOT RUN`/`PENDING`; archive contents do not establish student participation, acceptance, or credential delivery. |
| fastTrack → CoursePMS | Eight fastTrack cases covering delivered Sprint 1 F-01--F-04; account labels SA, A1, SB (plus optional A2/B1); setup/cleanup and finding/retest templates. | Cases and alias labels are available in the received packet. Private passwords, current assignment, and actual delivery to EN-022_P6 require direct confirmation from fastTrack. |
| CoursePMS → fastTrack | CoursePMS packet: [handoff](handoff.md), [auth/team cases](uat-cases-auth-team.md), [proposal/review cases](uat-cases-proposal.md), [consolidated cases](uat-cases.md), fixture plan, execution/finding/acceptance templates. | Packet is ready to share. Partner packet receipt, private credential delivery, and current starting-state confirmation must be recorded separately; no receipt is inferred from a repository link. |
| Both directions | Credentials and any raw login responses. | Private chat only. Never place passwords, tokens, cookies, authorization headers, or private chat screenshots in Git, public issues, or the final PDF. |

## Release identities and session gate

| Product under test | Repository / public URL | Selected source | Current read-only observation | Revision / traffic status |
|---|---|---|---|---|
| fastTrack | [repository](https://github.com/zerotwobook/fastTrack); <https://fasttrack-app-kpx7au3w2a-as.a.run.app> | `8e637e537cd037d630a5fffc1b5672d1b44371a8`; historical Sprint 1 tag `v1.0.0-sprint-1` points to `ae7a60a6e3ed0a363dcee920ac1774a02f4f4ab8`. | On 14 November 2026, anonymous `/api/health` returned `status: ok`, `version: 8e637e537cd037d630a5fffc1b5672d1b44371a8`; `/api/ready` returned `status: ready`, `database: connected`. | `fasttrack-app-00003-rc7` is historical only. Product Team must confirm current Cloud Run revision/traffic and that this exact source is accepted for the session. |
| CoursePMS | [repository](https://github.com/Magiciancat9/Course_management); <https://course-pms-859617270560.asia-southeast1.run.app> | `9c22735995c985aaa0622b6b179de1ac9c1f80ca`; historical Sprint 1 tag `v1.0.0-sprint1` points to `5979f5870e8e28277996dc3045cbf4be5f7236ad`. | Production provisioning record documents a successful deploy and readiness check for this source; see [UAT data and reruns](uat-data-and-reset.md). | Product Team must reconfirm the serving Cloud Run revision/traffic immediately before the independent session. Health identifies source, not Cloud Run traffic allocation. |

Before each session, both Product Teams must record the exact source,
revision/traffic, URL, time zone, and health/readiness result. If the serving
source differs, stop the affected test and agree a new baseline. Results and
acceptance never silently transfer to another release. Each Product Team must
notify the other through private chat before a deployment that could affect an
active test or retest.

## Appointments and coordination

| Event | Date/time (Asia/Bangkok) | Current record |
|---|---|---|
| Initial UAT | 13 November 2026, from 17:30 | User-supplied plan retained by the partner packet. Actual start, both testers' participation, and completion are not recorded here. |
| Defect-correction window | Not agreed | Product Teams must agree an owner, target corrected source/revision, and notification when a finding is accepted. |
| Retest | 14 November 2026, 13:30 | Proposed in the partner packet; direct partner confirmation and actual attendance are not recorded. If the time has passed without a recorded session, agree a replacement appointment rather than backdating execution. |
| Defect channel | Private chat | Use a sanitized finding ID, product/version, case/AC, preconditions, steps, expected/actual result, impact/severity, evidence ID, owner, and acknowledgement time. Record the acknowledgement without copying credentials. |
| Evidence location | To confirm privately | Both teams must agree where redacted screenshots/records are retained and who may access them before execution. |

## Pre-session checklist

- [x] Partner identity, repositories, product URLs, planned roles, selected
  source identities, and both case packets are available as preparation
  material.
- [x] Current anonymous fastTrack health/readiness returns the selected source
  and connected database; this is not authenticated UAT or revision evidence.
- [ ] fastTrack Product Team confirms the serving revision/traffic, accepted
  scope, SA/A1/SB assignment, and private credential delivery to both CoursePMS
  testers.
- [ ] CoursePMS Product Team confirms packet receipt by fastTrack, current
  serving revision/traffic, private credential delivery, and S1--S4/R1--R4
  starting state for the actual session.
- [ ] Both teams confirm a replacement/actual session time, correction window,
  retest time, escalation contact, and evidence location through private chat.
- [ ] Both UAT Teams record actual testers, tested release, inputs, results,
  evidence, and findings in their own execution records.

If the partner is unavailable or the application is unavailable, retain
sanitized evidence, notify the instructor/TA promptly, and record the
dependency. Do not replace the independent partner with Product Team testing
or convert preparation observations into UAT results.
