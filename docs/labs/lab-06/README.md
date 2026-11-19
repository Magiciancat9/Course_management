# Lab 6: independent UAT

## Current report assembly — 19 November 2026

- **CoursePMS: Accepted**, under the retained 17 November partner declaration; [corrected-release acceptance](coursepms-acceptance-confirmed.md) is unchanged.
- **fastTrack Sprint 1: Accepted as jointly reported by the CoursePMS team.** User-declared human session and missing per-case artifacts are explicit; the separate 18 November Codex run provides dated technical support. Start with [19 November fastTrack closeout](fasttrack-closeout-20261119.md).
- **fastTrack simulated exercise section 3.5: PASS / Accepted for the exact retest.** Original database JSON matches the on-time 201 and two late 409 responses: [verified section 3.5 retest](fasttrack-section35-retest-20261119.md).
- **Partner receipt acknowledged**, via user-relayed confirmation recorded 19 November 12:42:46 Asia/Bangkok. fastTrack intends to include both records and preserve screenshot attribution; report integration/grading/submission is not inferred.
- [Report draft](report-draft.md), [evidence index](evidence/README.md) and [publication/privacy guide](evidence-publication.md) provide the current assembly path. Public Git uses GitHub accounts/synthetic aliases; private report identities and original packages stay local.

The reported human session has no separately retained screenshots, fixture IDs or individual case times. The 18 November images remain Codex captures, not newly created personal-action evidence. These documented limits are retained with the reported Accepted decision.

The 17 November continuation below is historical; its reciprocal fastTrack deferral is superseded by the dated 19 November records above.

## Historical 17 November continuation

**CoursePMS product-side technical result is now received and acknowledged.**
The completed partner package reports 8 deployed targeted PASS plus RT-07
evidence/isolated-replay PASS. Start with [CoursePMS product closeout](coursepms-product-closeout.md)
and [completed retest record](coursepms-retest-completion.md). At that time the user requested
one product at a time, so reciprocal fastTrack work was deferred. The dated
19 November continuation above supersedes that deferral. fastTrack's later joint A/B declaration
confirms **CoursePMS ACCEPTED** at **17 November 22:30:56 Asia/Bangkok**;
[actual confirmation](coursepms-acceptance-confirmed.md) and [CoursePMS-facing
acceptance record](retest-and-acceptance.md) retain its representative-relay
method and limits. Full private identities are kept outside public Git.

**Corrected release is now deployed.** [Release evidence](release-evidence.md)
identifies main `aeb804ea5bc667399b00cf54df10046a6ded46e0`, revision
`course-pms-00009-mk2`, 100% dated CLI traffic and successful public checks.
Use the [deployed-release handoff](deployed-release-handoff.md) for actual
notification and independent retest. Pre-deployment notification was not sent
in the retained record; the new draft is still unsent. Authenticated smoke,
fixture/readback limits and historical notification exceptions are retained;
the later partner technical retest/readback is now recorded in the closeout
above. The original pipeline login SKIP and actual human decision limits are
not rewritten as new pipeline passes or signatures.

Martin's latest integration review is addressed in [review response](review-73-martin.md):
an explicit shared instructor/own-team status guard, instructor UI coverage and
removal of the temporary integration helper. Use the current head and CI for
review; earlier exports remain dated snapshots.

The latest fastTrack follow-up is answered in [follow-up response](followup-response.md).
Both prior contract clarifications are now resolved and corrected in the candidate:
[dispositions](contract-dispositions.md). [Acceptance records](acceptance-record.md)
are reconciled with dated actual evidence. CoursePMS is now ACCEPTED under the
supplied declaration; the later reciprocal fastTrack decision is recorded in the 19 November continuation above.
Use [release readiness](release-readiness.md), [actual activity forms](member-activity.md)
and [proposed targeted retest](retest-request.md) for the remaining owner actions.

The earlier private fastTrack handoff has been inspected. Existing defect #71 / Draft
PR #72 is continued by [Draft PR #73](https://github.com/Magiciancat9/Course_management/pull/73),
which targets the existing fix branch. Start with the [return package](return-to-fasttrack.md),
[incoming triage](triage.md), [follow-up verification](session-followup.md),
[member allocation](member-work-plan.md), and [Parts A–D draft](report-draft.md).
The [simulation example](simulation-example.md) is fictional and is not actual
student participation or acceptance. The earlier preparation/status records
below are historical; the deployed CoursePMS retest and ACCEPTED declaration
above supersede their earlier pending status for CoursePMS only.

This package follows the partner team's seven-document structure and uses
CoursePMS Sprint 1 information. The two teams independently test each other's
product:

| Product team | Product | Independent UAT team |
|---|---|---|
| EN-022_P6: Tatchakorn Thamnimitr and Pawarit Wongdaeng | CoursePMS | EN-028 InfaCompany: A/B; full confirming identities retained privately |
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
