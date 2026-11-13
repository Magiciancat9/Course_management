# Lab 6: Sprint 1 UAT Handoff

**Status: preparation in progress; not yet ready for partner handoff.** The
partner, UAT cases, accounts, test data, and communication channel still need
to be confirmed. This document identifies the intended test baseline, not an
acceptance decision.

## Product and release under test

| Item | Recorded value |
|---|---|
| Product | CoursePMS, Sprint 1 |
| Repository | <https://github.com/Magiciancat9/Course_management> |
| Sprint 1 reference tag | `v1.0.0-sprint1` |
| Tag commit | `5979f5870e8e28277996dc3045cbf4be5f7236ad` |
| Intended deployed baseline commit | `150dc5db3de5c829a7d9ef1adb545191cc37542d` |
| Public application URL | <https://course-pms-859617270560.asia-southeast1.run.app> |
| Revision recorded on deployment | `course-pms-00006-sbx` |
| Deployment evidence | [GitHub Actions run 43368602701](https://github.com/Magiciancat9/Course_management/actions/runs/43368602701) |

On 2026-11-13 (UTC+7), the deployment run reported that
`course-pms-00006-sbx` was serving 100% of traffic. A subsequent read-only
check of `/api/health` returned HTTP 200 and `commitSha` matching the intended
baseline; `/api/ready` returned HTTP 200 with the database connected. The
revision is a deployment-time observation, not a guarantee of the current
traffic configuration.

The deployed commit is newer than the Sprint 1 tag. The
[tag-to-baseline comparison](https://github.com/Magiciancat9/Course_management/compare/v1.0.0-sprint1...150dc5db3de5c829a7d9ef1adb545191cc37542d)
includes Lab 5 deployment and CI, Docker, documentation, production seed and
database migration changes, health/readiness endpoints, and a client release
badge and related test. It is not a documentation-only change. The runtime
diff adds no operational Sprint 2/3 UI or API workflows; the database
migration contains existing milestone/submission schema, which does not
expand the UAT scope.

### Verify immediately before testing

1. Open the public application URL in a browser.
2. Open `/api/health` on the same origin and compare `commitSha` with the full
   intended baseline commit above. Open `/api/ready` and confirm HTTP 200 and
   `db: connected`. Record the time and results in the UAT execution log.
3. Ask the Product Team to confirm the Cloud Run revision and its traffic
   allocation in Cloud Run or deployment evidence. The health endpoint
   identifies the commit, not the revision: a redeploy of the same commit can
   produce a new revision.
4. If the commit, revision, or readiness differs, stop and contact the Product
   Team. Record the test as blocked until the team identifies and agrees a
   release; never silently treat a different release as this baseline.

## Accepted Sprint 1 scope

The complete acceptance criteria and API outcomes are defined in the
[authentication contract](../../sprints/sprint-1/f01-auth-and-roles.md) and
[team and proposal contract](../../sprints/sprint-1/f02-team-and-proposal-workflow.md).
The [test specification](../../sprints/sprint-1/sts-and-dod.md) maps them to
automated tests. UAT cases will give the partner reproducible user-facing
steps, inputs, and expected results.

| Feature | UAT scope | Acceptance criteria |
|---|---|---|
| F-01: authentication and roles | Valid and invalid login, protected access, logout and revocation | AC-01, AC-02, AC-03 |
| F-02: team management | Create a team, add members, one team per course (BR-01), capacity (BR-02) | AC-04, AC-05, AC-06 |
| F-03: proposal and review | Draft, submit, validation and state locks, instructor review and feedback, team/role authorization | AC-07, AC-08, AC-09, AC-10 |

Sprint 2 and 3 features are **out of scope**. A request outside the agreed
Sprint 1 contract is not automatically a defect; a failed Sprint 1 requirement
must not be dismissed as an enhancement.

## Accounts and test data

Only the following account **labels and roles** are planned; actual account
availability and initial state have not yet been verified. No passwords or
tokens belong in this document, the repository, issues, or screenshots.

| Label | Role | Planned purpose |
|---|---|---|
| Student A | STUDENT | Member of Team Alpha; ownership and existing-team cases |
| Student B | STUDENT | Eligible teammate for member-addition cases |
| Student C | STUDENT | Unassigned student for team creation |
| Student D | STUDENT | Member of Team Beta for cross-team cases |
| Instructor | INSTRUCTOR | Proposal review cases |

The account set is preliminary; capacity and repeatability scenarios may
require additional eligible students and separate starting states. The owner
of [#50](https://github.com/Magiciancat9/Course_management/issues/50) must
confirm account labels, current team memberships, proposal states, setup,
safe reset, and live login before handoff. Use synthetic data only. Do not
run destructive seed or reset commands against the shared deployed database.
Send actual account identifiers and passwords to the partner through a
privately agreed channel, never through GitHub issues, the report PDF, or
screenshots.

## UAT case packet and test order

- Authentication and team cases: [#48](https://github.com/Magiciancat9/Course_management/issues/48)
  (pending).
- Proposal, review and access cases: [#49](https://github.com/Magiciancat9/Course_management/issues/49)
  (pending).
- Test account setup and reset: [#50](https://github.com/Magiciancat9/Course_management/issues/50)
  (pending).

Do not begin partner testing until the case authors specify each case's
preconditions, inputs, expected outcomes, and either independent data/reset
or an explicit sequence. Follow the finalized order in those cases; do not
assume a clean starting state after another case has changed the data.
Coordinate the partner, session dates, packet exchange, and notification
before deployment in [#51](https://github.com/Magiciancat9/Course_management/issues/51).

## Communication and defect handoff

Partner team and primary communication channel: **TBD in #51**. Confirm the
channel and an escalation contact with the partner before sending this
packet; do not put credentials in the public coordination record. Notify
the partner before a deployment that could affect a test session.

Agree where findings will be filed before testing. For each failure ask the
tester to provide a report ID, reporter, tested URL and commit/revision,
linked case and AC, preconditions and synthetic inputs, numbered reproduction
steps, expected and actual results, impact/severity with justification, and
redacted evidence ID. Acknowledge and triage every finding; the Product Team
records incoming triage in [#55](https://github.com/Magiciancat9/Course_management/issues/55).
The reciprocal reports we send for the partner's product are tracked in
[#54](https://github.com/Magiciancat9/Course_management/issues/54).

Record PASS, FAIL, and BLOCKED honestly. The independent partner UAT team,
not the Product Team, makes the acceptance decision for CoursePMS.
