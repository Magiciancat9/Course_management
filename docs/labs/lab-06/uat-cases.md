# CoursePMS Sprint 1 UAT case index

**Status: case preparation and peer walkthrough pending.** The agreed packet
is `CoursePMS_Send_to_UAT_Team.zip`; execute CPMS-UAT-01 through CPMS-UAT-08
in order using that packet's written preconditions and steps. Confirm receipt
with the partner. The ZIP is shared separately and is not stored in this
repository.

| Case | Sprint 1 coverage | Main dependency |
|---|---|---|
| CPMS-UAT-01 | AC-01--AC-03: authentication and session | Verified accounts |
| CPMS-UAT-02 | AC-04: create team and add member | Unassigned S1/S2 |
| CPMS-UAT-03 | AC-05--AC-06: membership and capacity | New team and eligible S3/S4 |
| CPMS-UAT-04 | AC-08: incomplete proposal | New team |
| CPMS-UAT-05 | AC-07--AC-08: submit and state lock | Draft from case 04 |
| CPMS-UAT-06 | AC-10: role and cross-team denial | Submitted proposal and foreign student |
| CPMS-UAT-07 | AC-09: review and resubmission | Submitted proposal |
| CPMS-UAT-08 | AC-04, AC-07, AC-09: saved-state readback | Approved proposal and roster |

Authentication/team documentation is tracked in
[#48](https://github.com/Magiciancat9/Course_management/issues/48); proposal,
review and access documentation is in
[PR #62](https://github.com/Magiciancat9/Course_management/pull/62) for
[#49](https://github.com/Magiciancat9/Course_management/issues/49). These
are not yet merged. Reconcile the original issue case numbers with the agreed
packet without dropping required coverage. PR #62 separately proposes exact
boundary checks that need a safe fixture and partner agreement.

The current packet instructs a tester to select CPE334, but the inspected
CoursePMS UI uses the first course rather than a course picker. Clarify that
step before handoff. Some record IDs and timestamps require an authorized API
read; do not claim a UI-only observation of those fields.

For each real run, record the tester, time, tested source/revision, inputs,
actual observations, PASS/FAIL/BLOCKED and evidence in
[execution results](execution-results.md). Never infer a backend response
from a disabled UI control or record credentials.
