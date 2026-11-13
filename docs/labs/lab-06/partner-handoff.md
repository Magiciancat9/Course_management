# CoursePMS partner handoff index

**Status: in preparation.** This index points to the detailed handoff; it is
not proof that the partner has completed UAT or accepted the product.

## Product and scope

CoursePMS Sprint 1 covers authentication/roles (F-01), teams (F-02) and the
proposal and instructor review workflow (F-03), with AC-01 through AC-10.
Sprint 2 and 3 features are outside this UAT scope. See the accepted
[authentication contract](../../sprints/sprint-1/f01-auth-and-roles.md) and
[team and proposal contract](../../sprints/sprint-1/f02-team-and-proposal-workflow.md).

The selected application URL is
<https://course-pms-859617270560.asia-southeast1.run.app>. Its intended
source commit is `150dc5db3de5c829a7d9ef1adb545191cc37542d`; confirm the
running source and serving Cloud Run revision with the Product Team before
testing. A health response does not itself identify the serving revision.

## Packet and access

- Detailed release, account labels, case sequence and defect handoff:
  `handoff.md`, prepared in [PR #61](https://github.com/Magiciancat9/Course_management/pull/61).
  It is not yet merged into the staging branch.
- Case set and dependencies: [UAT cases](uat-cases.md).
- Partner identity, release observations and proposed appointments:
  [partner and schedule](partner-and-schedule.md).
- The Product Team reported that test credentials were sent through private
  chat. Confirm packet receipt, account-to-alias mapping and current fixture
  states with the partner before execution; do not publish secrets.

The UAT team must use synthetic data, retain evidence, and follow the agreed
case sequence. Do not reset the shared production database. Report failures
through the agreed private chat and record sanitized details and
acknowledgement.
