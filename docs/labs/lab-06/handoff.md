# Lab 6: Sprint 1 UAT Handoff

**Status: preparation in progress; not yet cleared for independent UAT.**
The Product Team identified the partner, private communication channel and
case packet, and reported checking accounts and sending credentials. Current
traffic, individual account/fixture states, packet receipt and the test
window remain to be confirmed. This is not an acceptance decision.

## Partner team

The independent UAT partner for CoursePMS is the fastTrack team, InfaCompany
(Section 31, EN-028): Supapanya Yathip (`zerotwobook`) and Atip Infa-udom
(`Atip-Infa`). Their [partner handoff](https://github.com/zerotwobook/fastTrack/blob/docs/s2-a-lab6-uat/docs/labs/lab-06/partner-handoff.md)
identifies CoursePMS as their partner product. Our team independently tests
their fastTrack product; their team independently tests CoursePMS.

The partner's document proposes a retest on 14 November 2026 at 13:30
Asia/Bangkok, but explicitly says partner confirmation is pending. Confirm
the initial session, retest, and contact channel with both teams in
[#51](https://github.com/Magiciancat9/Course_management/issues/51).

## Product and release under test

| Item | Recorded value |
|---|---|
| Product | CoursePMS, Sprint 1 |
| Repository | <https://github.com/Magiciancat9/Course_management> |
| Sprint 1 reference tag | `v1.0.0-sprint1` |
| Tag commit | `5979f5870e8e28277996dc3045cbf4be5f7236ad` |
| Intended deployed baseline commit | `150dc5db3de5c829a7d9ef1adb545191cc37542d` |
| Public application URL | <https://course-pms-859617270560.asia-southeast1.run.app> |
| Revision at deployment, not confirmed current | `course-pms-00006-sbx`; 100% traffic at that deployment |
| Current serving revision and traffic | Not confirmed; Product Team must verify before the session |
| Deployment evidence | [GitHub Actions run 43368602701](https://github.com/Magiciancat9/Course_management/actions/runs/43368602701) |

On 2026-11-13 (UTC+7), the deployment run reported that
`course-pms-00006-sbx` was serving 100% of traffic. A subsequent read-only
checks on 13 November 2026 at approximately 19:43 Asia/Bangkok returned
HTTP 200 from `/api/health`, with `commitSha` matching the intended baseline,
and HTTP 200 from `/api/ready`, with the database connected. These are
preparation observations, not independent UAT. The revision is a
deployment-time observation, not a guarantee of current traffic.

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
3. Ask the authorized Product Team to confirm the current Cloud Run service
   traffic in the Google Cloud console, or use its authenticated read-only
   CLI with the correct project:

   ```text
   gcloud run services describe course-pms --region asia-southeast1 --project PROJECT_ID --format="yaml(status.url,status.traffic)"
   ```

   Replace `PROJECT_ID` with the owner's actual project ID. Record the time,
   revision names, percentages and sanitized evidence. The health endpoint
   identifies the commit, not the revision: a redeploy of the same commit can
   produce a new revision. Historical deployment evidence alone is not
   confirmation of current traffic.
4. If the commit, revision, or readiness differs, stop and contact the Product
   Team. Record the test as blocked until the team identifies and agrees a
   release; never silently treat a different release as this baseline.

## Accepted Sprint 1 scope

The complete acceptance criteria and API outcomes are defined in the
[authentication contract](../../sprints/sprint-1/f01-auth-and-roles.md) and
[team and proposal contract](../../sprints/sprint-1/f02-team-and-proposal-workflow.md).
The [test specification](../../sprints/sprint-1/sts-and-dod.md) maps them to
automated tests. The [UAT cases](uat-cases.md) give the partner reproducible
user-facing steps, inputs, and expected results; their documented coverage
limitations still apply.

| Feature | UAT scope | Acceptance criteria |
|---|---|---|
| F-01: authentication and roles | Valid and invalid login, protected access, logout and revocation | AC-01, AC-02, AC-03 |
| F-02: team management | Create a team, add members, one team per course (BR-01), capacity (BR-02) | AC-04, AC-05, AC-06 |
| F-03: proposal and review | Draft, submit, validation and state locks, instructor review and feedback, team/role authorization | AC-07, AC-08, AC-09, AC-10 |

Sprint 2 and 3 features are **out of scope**. A request outside the agreed
Sprint 1 contract is not automatically a defect; a failed Sprint 1 requirement
must not be dismissed as an enhancement.

## Accounts and test data

The Product Team confirmed on 13 November 2026 that the test accounts were
checked and their credentials sent to the partner through private chat. No
passwords or tokens belong in this document, the repository, issues, or
screenshots. The agreed case packet uses the following aliases:

| Label | Role | Planned purpose |
|---|---|---|
| I | INSTRUCTOR | Proposal review cases |
| S1 | STUDENT | Unassigned student who creates the UAT team |
| S2 | STUDENT | Eligible unassigned teammate |
| S3 | STUDENT | Eligible unassigned third team member |
| S4 | STUDENT | Eligible unassigned fourth candidate for the capacity denial |
| F | STUDENT | Member of another team for cross-team cases |

The account-to-alias mapping, each actual login and current membership have
not been independently recorded. Confirm them privately with the partner,
including an eligible unassigned S4 and the course's actual ID and
`maxTeamSize`. The original seed describes only three initially unassigned
students; do not assume a fourth exists. If an eligible S4 or the required
capacity is unavailable, the capacity subcheck is BLOCKED until an agreed,
safe fixture is available. Record non-secret setup, starting memberships,
proposal states, and a safe repeat-run arrangement in
[#50](https://github.com/Magiciancat9/Course_management/issues/50), which
remains open. Use synthetic data only. Do not run destructive seed or reset
commands against the shared deployed database. A new team name does not
release existing memberships. Retain the synthetic run's records for retest.

## UAT case packet and test order

The Product Team confirmed that the agreed packet is
`CoursePMS_Send_to_UAT_Team.zip`, containing `01_Partner_Handoff.md`,
`02_UAT_Cases.md`, and `03_Execution_Workbook.md`. The agreed sequence is
**CPMS-UAT-01 through CPMS-UAT-08 in numerical order**. The first cases set
up the team and draft used by the later proposal, review and persistence
cases; use the preconditions and steps in the packet, not an assumed clean
state. The [repository case sheet](uat-cases.md) corrects the packet's
course-selection instruction: the UI selects the first course automatically,
so confirm that it displays CPE334 rather than looking for a course picker.
Send this correction to the partner and confirm receipt. Agree a new safe
fixture arrangement before repeating the run.

The packet is shared outside this repository; confirm its receipt through
private chat. Authentication/team preparation remains tracked in
[#48](https://github.com/Magiciancat9/Course_management/issues/48),
proposal/review cases in
[#49](https://github.com/Magiciancat9/Course_management/issues/49), and
account setup/reset in
[#50](https://github.com/Magiciancat9/Course_management/issues/50). These
issues remain open; the agreed packet does not itself close their checklists.
Coordinate session dates and packet exchange in
[#51](https://github.com/Magiciancat9/Course_management/issues/51).

## Communication and defect handoff

The Product Team confirmed **private chat** as the coordination and
bug-reporting channel. Confirm the escalation contact and session dates in
#51. Do not put credentials in the public coordination record. Notify the
partner before a deployment that could affect a test session.

Send findings to the Product Team through that private chat. For each failure
ask the tester to provide a report ID, reporter, tested URL and commit/revision,
linked case and AC, preconditions and synthetic inputs, numbered reproduction
steps, expected and actual results, impact/severity with justification, and
redacted evidence ID. Acknowledge and triage every finding; the Product Team
records incoming triage in [#55](https://github.com/Magiciancat9/Course_management/issues/55).
The reciprocal reports we send for the partner's product are tracked in
[#54](https://github.com/Magiciancat9/Course_management/issues/54).

Record PASS, FAIL, and BLOCKED honestly. The independent partner UAT team,
not the Product Team, makes the acceptance decision for CoursePMS.

The partner has reported that proposal fields may remain visible after
switching accounts without reloading. This is a reported finding, not yet
reproduced or triaged in this record. Investigate it separately before
determining impact, any correction and the release for independent retest;
do not treat this handoff as evidence that the finding is resolved.
