# CoursePMS Sprint 1 executable UAT cases

**Preparation only: all eight cases are NOT RUN in this record.** This sheet
adapts the agreed `CoursePMS_Send_to_UAT_Team.zip`; it does not change the
copy already sent. Send the course-selection correction in
[the handoff](partner-handoff.md) to the partner and confirm receipt. This
sheet is the intended consolidated repository reference; reconcile it with
[#48](https://github.com/Magiciancat9/Course_management/issues/48) and the
[proposal draft](uat-cases-proposal.md) before final handoff. The draft's
proposed isolated exact-boundary checks require separate partner agreement
and a safe fixture; they are not part of the agreed eight cases.

## Common setup and recording

Use the aliases, synthetic values and safety instructions in the
[handoff](partner-handoff.md). Verify the selected source, serving revision,
actual course ID, capacity, roles and membership states before execution.
Use separate profiles for I, S1 and F. Record tester, time and time zone,
actual actions/inputs, expected and actual results, status, evidence ID,
finding and tested release in [execution results](execution-results.md).
Evidence may use `CPMS-L6-IN-<case>-<sequence>` identifiers.

For private API checks, authenticate with the appropriate account in a local
API client and keep the bearer token private. Never save a login response,
password, token or Authorization header in evidence. Record sanitized
responses and compare authorized state before/after rejected writes. A
disabled control does not prove an HTTP response. Mark a required subcheck
BLOCKED if it cannot be performed; PASS requires every required subcheck.

| Case | Coverage | Depends on |
|---|---|---|
| CPMS-UAT-01 | F-01, AC-01--03: authentication and session | Verified accounts |
| CPMS-UAT-02 | F-02, AC-04: create team and add member | Unassigned S1/S2 |
| CPMS-UAT-03 | F-02, AC-05--06, BR-01/02: membership and capacity | Case 02; eligible S3/S4 |
| CPMS-UAT-04 | F-03, AC-08, BR-04: incomplete proposal | New team |
| CPMS-UAT-05 | F-03, AC-07/08, BR-03: submission and lock | Case 04 draft |
| CPMS-UAT-06 | F-03, AC-10, BR-06: ownership and role denial | Case 05; foreign student F |
| CPMS-UAT-07 | F-03, AC-09, BR-03/05: review lifecycle | Submitted proposal |
| CPMS-UAT-08 | F-02/F-03, AC-04/07/09, NFR-04: persistence | Approved proposal and roster |

The case mapping is not a claim of exhaustive contract coverage. The agreed
packet does not test logout revocation after server restart or startup without
`JWT_SECRET` (AC-03), the attempt to add an already assigned student to
another team (AC-05), or an instructor review of a DRAFT proposal (AC-09).
Agree any additional checks and safe fixtures with the partner before
execution; do not restart or reconfigure the shared service without approval.

## CPMS-UAT-01: authentication and session

**Roles:** S1 and I. **Preconditions:** verified private credentials, isolated
profiles and reachable application.

1. In a signed-out profile, attempt one incorrect password for a supplied
   test account; record the generic error and absence of private workspace.
2. Sign in as S1, verify STUDENT identity and reload; separately sign in as I
   and verify INSTRUCTOR. Compare each authorized `GET /api/auth/me` result
   with the displayed identity, recording sanitized fields only.
3. Request `GET /api/teams` without authorization. Record the actual status.
4. Log S1 out in the UI; use Back and reload. Separately log in through the
   private API client, call `POST /api/auth/logout`, then repeat
   `GET /api/auth/me` with the revoked token. Sign S1 back in for case 02.

**Expected:** correct credentials and identities match; incorrect credentials
return 401 `INVALID_CREDENTIALS`; `/me` does not expose `passwordHash`.
Anonymous and revoked-token reads return 401, and private UI data is
unavailable after logout. This does not test token expiry or server restart.
**Evidence:** redacted role views, rejection and logout/anonymous observations.

## CPMS-UAT-02: create team and add a member

**Roles:** S1, S2. **Preconditions:** both eligible and unassigned; course
ID and maximum size confirmed.

1. As S1, confirm the automatically selected course is CPE334 and the account
   has no team. Create the run-specific synthetic team once.
2. Record the team name, leader and roster count 1; reload and compare. Use
   authorized `GET /api/teams?courseId=<actual-course-id>` for the ID and
   saved roster where needed.
3. Add S2 by the privately provided email. Record the two-member roster and
   roles. In S2's separate profile, sign in and read the same team.

**Expected:** a single persistent team with S1 as LEADER and S2 as MEMBER;
creation is 201 and member addition 200 when responses are actually
observed. **Evidence:** creation, roster after reload and both role views.
Keep this team for later cases.

## CPMS-UAT-03: duplicate membership and capacity

**Roles:** S1, S3, S4. **Preconditions:** case 02 left S1/S2 in the team;
S3/S4 eligible and unassigned; confirmed maximum is 3.

1. Record the existing roster and membership. As S1, use a private API
   session to `POST /api/teams` with a different synthetic name and the
   actual course ID. Confirm no second team/membership was created.
2. Add S3 by email through the UI; reload and record the 3/3 roster.
3. Attempt to add S4 in the UI. If the control is disabled, record that and
   use S1's API session to `POST /api/teams/<new-team-id>/members` with
   `{"email":"<private-S4-email>"}`. Do not publish the actual email.
4. Compare the authorized roster and S4's membership before and after.

**Expected:** duplicate creation returns 409
`BR01_DUPLICATE_TEAM_MEMBERSHIP`; S3 joins; eligible S4 is rejected with
409 `BR02_MAX_TEAM_SIZE_EXCEEDED`. Roster remains 3 and S4 unassigned.
If the eligible fourth account or capacity is unconfirmed, mark the affected
subcheck BLOCKED. **Evidence:** actual sanitized denials and before/after
state.

## CPMS-UAT-04: incomplete proposal

**Role:** S1. **Precondition:** new team proposal is absent or DRAFT.

1. Enter `Test`, `Too short`, `TS` and the synthetic repository URL from the
   handoff. Save Draft and reload; record the draft and revision.
2. Submit once. If the UI prevents the request, use S1's private session to
   `POST /api/teams/<new-team-id>/proposal/submit` without a body.
3. Read the authorized proposal and compare fields, status, `submittedAt`
   and `revisionCount` with the saved draft.

**Expected:** incomplete draft saves; submission returns 400
`BR04_INCOMPLETE_PROPOSAL` and leaves the DRAFT without a successful
submission timestamp or revision increment. **Evidence:** draft, actual
rejection and unchanged state. Keep the draft for case 05.

## CPMS-UAT-05: submit and enforce state lock

**Role:** S1. **Precondition:** case 04 left a DRAFT at revision 0.

1. Replace the draft with the complete synthetic values from the handoff;
   save, reload and verify all fields.
2. Submit once. Record proposal ID, status, `submittedAt` and revision
   through an authorized read and reload.
3. Record any disabled editor. With S1's API session, `PUT
   /api/teams/<new-team-id>/proposal` with a complete but different synthetic
   payload, then `POST` to the same route's `/submit` endpoint again.
4. Read the authorized proposal and compare fields, status, submission time
   and revision with step 2.

**Expected:** complete proposal is SUBMITTED at revision 1 with a timestamp;
both attempted writes return 409 `BR03_INVALID_STATUS_TRANSITION` and leave
saved state unchanged. **Evidence:** saved draft, submission, actual lock
responses and before/after read.

## CPMS-UAT-06: cross-team and student review denial

**Roles:** F, S1, and I for an authorized control. **Preconditions:** case 05
submitted the proposal; F belongs to a different course team.

1. As S1 record the proposal's authorized baseline. As F select View Proposal
   on the new team and record the UI response without private content.
2. As F, use the API to GET and PUT
   `/api/teams/<new-team-id>/proposal` with complete synthetic changed
   fields, and POST to its `/submit` endpoint. Record sanitized responses.
3. As S1, `POST /api/proposals/<new-proposal-id>/review` with
   `{"decision":"APPROVED","reviewFeedback":"This student review must be rejected."}`.
4. As S1 or I, compare the authorized proposal, status, revision and review
   fields to the baseline.

**Expected:** F's GET/PUT/submit return 403
`BR06_FORBIDDEN_TEAM_ACCESS` without private proposal details; S1's review
returns 403 `BR06_INSTRUCTOR_ROLE_REQUIRED`; saved state is unchanged.
**Evidence:** actual sanitized denials and authorized before/after state.

## CPMS-UAT-07: review, revise, resubmit and approve

**Roles:** I and S1. **Precondition:** case 06 left the proposal SUBMITTED at
revision 1.

1. As I, request revision with feedback `Short`; record rejection and compare
   saved state.
2. Request revision with the full revision feedback in the handoff. Record
   REVISION_REQUESTED, reviewer, feedback and review time through authorized
   reads; reload as S1.
3. As S1, change the title to the revised title in the handoff, save and
   submit once; record SUBMITTED at revision 2 and its submission time.
4. As I approve with the full approval feedback; reload as S1 and compare
   APPROVED status and review data.
5. Using appropriate I/S1 API sessions, attempt another valid review, edit
   and submit on the APPROVED proposal. Compare authorized state.

**Expected:** short feedback returns 400 `BR05_FEEDBACK_TOO_SHORT` without
changing state. Valid feedback enables revision and resubmission increments
the count from 1 to 2; approval persists. Review, edit and resubmit after
approval return 409 `BR03_INVALID_STATUS_TRANSITION`, without changes.
**Evidence:** validation response, revision, resubmission, approval and
terminal-state denials. Do not claim append-only review history.

## CPMS-UAT-08: persistence after reload and relogin

**Roles:** S1, S2, I. **Precondition:** case 07 completed; no owner edits
during comparison.

1. Record authorized team ID/name, roster, proposal ID and fields, APPROVED
   status, revision 2, submission time and latest review data.
2. Reload as S1, then log out and back in; compare the saved state.
3. Read the same team and proposal as S2 and I and compare with step 1.
4. Log out of temporary profiles; retain synthetic record IDs for retest.

**Expected:** authorized saved roster and proposal values match after reload
and relogin, without a duplicate team or proposal. **Evidence:** sanitized
before/after ledger and role views with tester, time and release. This is
not a restart, redeployment or token-expiry test.
