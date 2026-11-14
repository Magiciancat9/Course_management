# Lab 6: independent UAT

This package follows the partner team's seven-document structure and uses
CoursePMS Sprint 1 information. The two teams independently test each other's
product:

| Product team | Product | Independent UAT team |
|---|---|---|
| EN-022_P6: Tatchakorn Thamnimitr and Pawarit Wongdaeng | CoursePMS | EN-028 InfaCompany: Supapanya Yathip and Atip Infa-udom |
| EN-028 InfaCompany | fastTrack | EN-022_P6 |

CoursePMS scope is F-01 authentication and roles, F-02 team management, and
F-03 proposal submission and review (AC-01--AC-10). Later-sprint features are
outside this handoff. The eight CoursePMS cases run in order and map to
AC-01--AC-10, but do not cover every contract subcheck; see the case sheet's
coverage limitations. The fastTrack team's own case IDs and instructions
apply when testing fastTrack.

## Package

| Document | What it contains |
|---|---|
| [Partner handoff](partner-handoff.md) | CoursePMS release, scope, private access, fixtures and inputs |
| [UAT cases](uat-cases.md) | Eight executable CoursePMS cases and expected outcomes |
| [Execution results](execution-results.md) | Preparation observations and actual UAT result records for both directions |
| [Findings and retest](findings-and-retest.md) | Reporting, triage, correction and independent retest |
| [Acceptance record](acceptance-record.md) | Separate independent decisions for each tested product |
| [Preparation verification](preparation-verification.md) | Verified observations, evidence and remaining prerequisites |
| [Partner and schedule](partner-and-schedule.md) | Members, release identities, communication and proposed appointments |
| [UAT data and reruns](uat-data-and-reset.md) | Synthetic-account aliases, non-destructive provisioning, and Run 1/Run 2 plan |

The separately shared `CoursePMS_Send_to_UAT_Team.zip` is the agreed original
packet. This repository case sheet adapts that packet, including a correction
to its course-selection instruction; the updated instructions must be sent to
and agreed with the partner. The [detailed baseline handoff](handoff.md)
and [proposal case draft](uat-cases-proposal.md) are included in this folder.
Authentication and fixture work in
[#48](https://github.com/Magiciancat9/Course_management/issues/48) and
[#50](https://github.com/Magiciancat9/Course_management/issues/50) still
requires owner review. Reconcile it with this case sheet before final handoff.

## Workflow

1. Both teams confirm the packet, access, fixtures, schedule and exact live
   source and serving revision; privately share credentials.
2. Both members independently test the other product and record real
   observations and sanitized evidence. Expected outcomes are not results.
3. Exchange findings through private chat, record acknowledgement, fix and
   independently retest as necessary.
4. Each UAT team records its own decision for the exact tested release.
   Never publish passwords, tokens, authorization headers or private data.

The person responsible for an issue must not merge their own PR. The other
teammate reviews the latest head and merges only after approval and green CI.
