# Lab 6: independent UAT

This folder organizes the CoursePMS Lab 6 work. The CoursePMS team prepares
its Sprint 1 product for independent testing by the fastTrack team; the same
two teams also exchange roles so that CoursePMS testers independently test
fastTrack. An expected result, a template or a CI run is not an actual UAT
result.

## Documents

| Document | Purpose | Status |
|---|---|---|
| [Partner handoff](partner-handoff.md) | Scope, release, account and packet handoff | In preparation; detailed handoff is in PR [#61](https://github.com/Magiciancat9/Course_management/pull/61) |
| [UAT cases](uat-cases.md) | Agreed case set and its source files | Eight cases agreed; case documentation and walkthrough pending |
| [Execution results](execution-results.md) | Actual results for testing in both directions | Template; no execution is claimed |
| [Findings and retest](findings-and-retest.md) | Report, triage, correction and retest records | Template; no findings are claimed |
| [Acceptance record](acceptance-record.md) | Independent decision for each product and tested release | Pending |
| [Preparation verification](preparation-verification.md) | Verified preparation, remaining prerequisites and evidence | In progress |
| [Partner and schedule](partner-and-schedule.md) | Teams, coordination, releases and appointments | In progress |

The existing detailed files are retained rather than duplicated:
`handoff.md` in PR #61, `uat-cases-proposal.md` in PR
[#62](https://github.com/Magiciancat9/Course_management/pull/62), and the
authentication/team and fixture work tracked in
[#48](https://github.com/Magiciancat9/Course_management/issues/48) and
[#50](https://github.com/Magiciancat9/Course_management/issues/50).
These documents are not all merged into `lab6-staging` yet.

## Working sequence

1. Finish and peer-review the handoff, cases, account/fixture instructions
   and partner coordination. Confirm release and private access before testing.
2. Both teams execute the other product's agreed cases and record actual
   results and evidence.
3. Exchange and triage actual findings; fix, review, release and independently
   retest where required.
4. Record each UAT Team's independent acceptance decision and assemble the
   final self-contained report.

Never put credentials, tokens or unredacted authentication data in these
documents, issues, screenshots or the final PDF.
