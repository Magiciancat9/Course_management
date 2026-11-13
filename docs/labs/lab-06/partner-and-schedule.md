# Lab 6 partner coordination and schedule

**Status: coordination in progress.** Planned dates, historical releases and
templates are not evidence of UAT execution or an acceptance decision.

## Teams and product roles

| Team | Product | Members | Role in this exchange |
|---|---|---|---|
| EN-022_P6, Section 31 | CoursePMS | Tatchakorn Thamnimitr (`Magiciancat9`), Pawarit Wongdaeng (`martinvadre`) | Product Team for CoursePMS; independent UAT Team for fastTrack |
| EN-028, Section 31, InfaCompany | fastTrack | Supapanya Yathip (`zerotwobook`), Atip Infa-udom (`Atip-Infa`) | Product Team for fastTrack; independent UAT Team for CoursePMS |

The partner's [handoff](https://github.com/zerotwobook/fastTrack/blob/docs/s2-a-lab6-uat/docs/labs/lab-06/partner-handoff.md)
records both teams, member identifiers and the exchange. Both members of
each team must participate in testing the other team's product. Record actual
participants and actions during execution; a planned tester is not evidence
of a test.

## Packet exchange and access

- **fastTrack:** the partner's
  [UAT package](https://github.com/zerotwobook/fastTrack/tree/docs/s2-a-lab6-uat/docs/labs/lab-06)
  supplies its handoff, eight cases, execution workbook, findings and
  acceptance templates. Its case sheet covers Sprint 1 F-01--F-04. The
  partner must confirm the currently deployed release and the roles/team
  assignments of the SA, A1 and SB test accounts; receipt of their
  credentials by our team is not yet recorded.
- **CoursePMS:** the Product Team confirmed the agreed packet is
  `CoursePMS_Send_to_UAT_Team.zip`, with CPMS-UAT-01 through CPMS-UAT-08 in
  numerical order. The Product Team reports the accounts were checked and
  credentials sent to the partner through private chat. Confirm packet
  receipt, actual account-to-alias mapping, fixture state and safe rerun
  arrangements with the partner before execution.
- **Secrets:** share credentials only in private chat. Do not copy passwords,
  tokens, authentication responses or private messages containing them to
  Git, issues, screenshots or the final report.

## Release identities

| Product | Selected source | Deployed revision | Evidence / limitation |
|---|---|---|---|
| fastTrack | `8e637e537cd037d630a5fffc1b5672d1b44371a8` | Current revision not yet confirmed by its Product Team | At 17:42 Asia/Bangkok on 2026-11-13, `/api/health` and `/api/ready` returned HTTP 200 and this version. The partner handoff calls `fasttrack-app-00003-rc7` a historical revision, not a current traffic confirmation. |
| CoursePMS | `150dc5db3de5c829a7d9ef1adb545191cc37542d` | Product Team reported by 20:08 Asia/Bangkok on 2026-11-13 that `course-pms-00006-sbx` received 100% at 8:03 p.m.; check date, time zone and evidence not recorded | At approximately 19:43 Asia/Bangkok on 2026-11-13, `/api/health` returned this commit and `/api/ready` reported the database connected. Reconfirm traffic before the session. |

fastTrack's historical Sprint 1 tag is `v1.0.0-sprint-1`, commit
`ae7a60a6e3ed0a363dcee920ac1774a02f4f4ab8`; CoursePMS's tag is
`v1.0.0-sprint1`, commit `5979f5870e8e28277996dc3045cbf4be5f7236ad`.
The selected deployed commits above are distinct from those tags.

Before each session, recheck the selected product's health/readiness and ask
its Product Team to confirm the revision serving traffic. A health response
identifies source, not a Cloud Run revision. If the release differs, pause and
agree and record the actual tested baseline; do not silently transfer results
or acceptance to another version. Each Product Team should notify the testers
before a deployment that could affect a session.

## Schedule and communication

The shared coordination and defect-reporting channel is **private chat**, as
confirmed by the CoursePMS Product Team. Exchange sanitized finding IDs,
version, case/AC, steps, expected and actual results, impact and evidence;
record delivery and acknowledgement without publishing credentials.

| Event | Date/time (Asia/Bangkok) | Status |
|---|---|---|
| Initial UAT | 13 November 2026 from 17:30, listed in the partner handoff | Proposed; actual start, participation and completion not recorded |
| Defect-correction window | Not recorded | To agree with both teams |
| Retest | 14 November 2026 at 13:30, listed in the partner handoff | Proposed; partner confirmation pending |

Keep dated, redacted evidence of the final agreement and notify both teams of
any schedule or release changes. If a partner or service is unavailable,
record the actual blockage, notify the instructor/TA and retain proof; do not
replace independent testing with the Product Team's own tests.

## Before execution

1. Both teams confirm session times, evidence location, escalation contact,
   packet receipt and private account access.
2. Each Product Team confirms its live source, serving revision and approved
   synthetic fixture setup. Do not reset a shared database or alter historical
   evidence.
3. Each UAT Team records actual tester names, roles, date/time, inputs,
   results, PASS/FAIL/BLOCKED and evidence for the other product's cases.
4. Report failures through private chat, record acknowledgement, and agree
   corrections and retests. Only the independent UAT Team can make its
   product's acceptance decision.
