# CoursePMS Sprint 1 UAT: proposal and review

**Status: draft; not executed.** These cases describe the proposal portion
of the agreed `CoursePMS_Send_to_UAT_Team.zip`, using its case IDs and order.
The authentication and team cases CPMS-UAT-01 through CPMS-UAT-03 precede
these cases. See the [consolidated case sheet](uat-cases.md) for all eight
cases and [execution results](execution-results.md) for recorded outcomes.
Expected results here are not evidence of a pass.

The Product Team and partner must confirm the tested version, packet receipt,
test accounts, current assignments and safe fixture setup before execution.
Use only a newly created synthetic UAT team and data; do not modify historical
Lab 5 evidence or reset the shared database. If any prerequisite is missing,
record BLOCKED rather than invent a result.

## Shared setup and recording

- **Roles:** S1 is a member of the new UAT team, S2 another member, I an
  instructor, and F a student in a different team. Account identifiers and
  credentials are delivered separately through private chat.
- **Inputs:** use the run-specific team name and values in the
  [partner handoff](partner-handoff.md): title `CoursePMS Independent UAT Proposal`,
  problem statement `Student teams need a clear and private project proposal review workflow.`,
  stack `React, Express, PostgreSQL`, and synthetic repository URL
  `https://example.com/coursepms-uat`. Use a new run suffix and approved
  eligible accounts for repeat runs.
- **Order:** CPMS-UAT-04 saves a new incomplete draft; 05 submits it;
  06 checks access without changing it; 07 reviews and approves it; 08
  compares the approved state. Do not start a later case when its prerequisite
  failed or was blocked.
- **Recording:** for each case record tester, role, time and time zone,
  version/revision, actual inputs, actions, results, PASS/FAIL/BLOCKED,
  evidence IDs and any finding. Compare authorized state before and after a
  denied write. Never include credentials, tokens or authorization headers.
- **API observations:** the UI is the primary test surface. Where the UI
  hides or disables an action, an authorized tester may use a private API
  client with the correct account to verify the server guard. Record actual
  sanitized status and error code; do not infer HTTP responses from disabled
  controls. If the subcheck cannot be performed, record it as BLOCKED.

## CPMS-UAT-04: incomplete proposal

**AC-08 / BR-04; business-rule validation.** Role: S1. Precondition: the
new UAT team exists and its proposal is absent or DRAFT.

1. Enter title `Test`, problem statement `Too short`, stack `TS`, and the
   synthetic repository URL. Save Draft and reload.
2. Record the saved values, status and revision. Select Submit Proposal.
3. If the UI prevents the request, use the authorized S1 API session to
   `POST /api/teams/<new-team-id>/proposal/submit` without a body.
4. Reload the authorized proposal and compare its content, status,
   `submittedAt` and `revisionCount` with the saved draft.

**Expected:** the incomplete draft can be saved and read. Submission is
rejected with HTTP 400 / `BR04_INCOMPLETE_PROPOSAL` when a response is
observed. It remains DRAFT with no successful submission timestamp or
revision increment. Keep this draft for CPMS-UAT-05.

## CPMS-UAT-05: submit and lock

**AC-07, AC-08 / BR-03; normal journey and state lock.** Role: S1.
Precondition: CPMS-UAT-04 left the new proposal in DRAFT at revision 0.

1. Replace the draft with the shared complete inputs. Save and reload; check
   all fields.
2. Submit once. Record the visible SUBMITTED status and revision 1. Use an
   authorized `GET /api/teams/<new-team-id>/proposal` to record proposal ID,
   `submittedAt`, content and revision, then reload.
3. Confirm the editor/actions are locked. With S1's API session attempt
   `PUT /api/teams/<new-team-id>/proposal` with synthetic changed fields,
   then `POST /api/teams/<new-team-id>/proposal/submit` again.
4. Read the proposal as S1 and compare fields, status, timestamp and revision
   with step 2.

**Expected:** the complete proposal is SUBMITTED at revision 1 with a
submission timestamp. Both attempted writes are HTTP 409 /
`BR03_INVALID_STATUS_TRANSITION` if observed; saved state is unchanged.
The UI does not itself display every ID or timestamp.

## CPMS-UAT-06: cross-team and role denial

**AC-10 / BR-06; forbidden ownership and role.** Roles: F and S1; I may
inspect the authorized control. Precondition: CPMS-UAT-05 is complete and F
is a member of another team.

1. As S1, record the new proposal's ID, content, status, revision and review
   fields. In F's separate profile select View Proposal on the UAT team's row.
2. As F, use the API to GET, PUT synthetic changed content to, and POST submit
   to `/api/teams/<new-team-id>/proposal`; use the `/submit` suffix for the
   POST. Record each sanitized response.
3. As S1, attempt `POST /api/proposals/<new-proposal-id>/review` with decision
   `APPROVED` and feedback `This student review must be rejected.`
4. Read the proposal as S1 or I and compare the saved state with step 1.

**Expected:** foreign GET/PUT/submit return HTTP 403 /
`BR06_FORBIDDEN_TEAM_ACCESS` without disclosing private proposal details.
Student review returns HTTP 403 / `BR06_INSTRUCTOR_ROLE_REQUIRED`. The
authorized proposal remains unchanged. Record the actual UI and API results
separately.

## CPMS-UAT-07: review and resubmission

**AC-09 / BR-03, BR-05; normal review lifecycle.** Roles: I and S1.
Precondition: CPMS-UAT-06 leaves the proposal SUBMITTED at revision 1.

1. As I, select the UAT proposal, enter feedback `Short`, and request a
   revision. Record the rejection and compare saved state.
2. Enter `Please clarify the implementation and acceptance evidence.`;
   request revision. Reload as S1 and record REVISION_REQUESTED and feedback.
3. As S1, change the title to `CoursePMS Independent UAT Proposal Revised`,
   save, and submit again. Record SUBMITTED and revision 2.
4. As I, approve with feedback
   `The revised proposal scope is clear and suitable for the course.` Reload
   as S1 and compare APPROVED status and feedback.
5. Using the appropriate private I/S1 API sessions, attempt another review,
   edit and submission on the APPROVED proposal. Read the authorized saved
   proposal again.

**Expected:** short feedback is rejected with HTTP 400 /
`BR05_FEEDBACK_TOO_SHORT` without a state change. Valid feedback permits
revision and resubmission increases revision 1 to 2; valid approval persists.
Review, edit and resubmit after approval return HTTP 409 /
`BR03_INVALID_STATUS_TRANSITION` if observed, without changing saved data.
Record reviewer and timestamps through authorized API reads where needed.

## CPMS-UAT-08: saved-state persistence

**AC-04, AC-07, AC-09; state/persistence.** Roles: S1, S2 and I.
Precondition: CPMS-UAT-07 completed; no owner edits during comparison.

1. Record the authorized team/roster and proposal ID, content, APPROVED
   status, revision 2, submission time and latest review data.
2. Reload as S1, then log out and back in; compare the saved state.
3. Read the same team/proposal as S2 and as I; compare with step 1.
4. Log out of temporary profiles and retain synthetic record IDs for retest.

**Expected:** the same authorized saved state is visible after reload and
relogin, without duplicate team or proposal. This does not claim to test a
server restart or redeployment.

## Additional boundary coverage for issue #49

The agreed packet's CPMS-UAT-04 uses several short fields at once; it does
not isolate each exact minimum. Before adding the following to the independent
session, agree it with the partner and prepare a **separate** synthetic team
and eligible fixture. Do not alter the sequential CPMS-UAT-04--08 record:

1. Save and attempt to submit drafts with title lengths 4 then 5, while the
   problem statement and stack meet their minimums. A 4-character title is
   rejected. Do not submit a complete 5-character draft yet.
2. With a 5-character title and valid stack, attempt submission with problem
   statement length 19, then save length 20. The 19-character statement is
   rejected.
3. Submit the draft with title length 5, statement length 20 and a stack of at
   least 3 characters. It is accepted and becomes SUBMITTED. Count trimmed
   characters and record inputs, results and version.

The additional fixture and this boundary test have not been performed or
approved by the independent team. A successful boundary submission changes
that separate proposal's state and cannot be undone through the UI.
