# Lab 6 UAT cases: proposal, review, and access control

**Status: preparation only; none of these cases is a recorded UAT result.**
This companion sheet continues the authentication/team cases in
[UAT cases: authentication and team rules](uat-cases-auth-team.md) with
`UAT-06` through `UAT-10`. It covers Sprint 1 F-03 only: proposal drafts and
submission, instructor review, state validation, privacy, and saved-state
readback. Expected outcomes are specifications, not proof of a pass.

## Shared setup, sequence, and evidence

- **Run order:** the normal-proposal chain is `UAT-06`, `UAT-09`, `UAT-08`,
  then `UAT-10`. UAT-07 is an isolated boundary case on the dedicated Run 2
  cohort because a student already assigned to the normal team cannot create
  a second CPE334 team. UAT-08's approval becomes the saved state used by
  UAT-10.
- **Roles:** S1 is the leader/member of the newly created UAT team; S2 is
  another member; I is an instructor; F is a student in a different CPE334
  team. Use separate browser profiles. Private credentials are never stored
  in this document, screenshots, Git, or the final report.
- **Run-specific data:** use a new team/run ID and the complete values in
  [partner handoff](partner-handoff.md). The normal proposal title is
  `CoursePMS Independent UAT Proposal`; problem statement is `Student teams
  need a clear and private project proposal review workflow.`; technology
  stack is `React, Express, PostgreSQL`; repository URL is
  `https://example.com/coursepms-uat`.
- **Version gate:** immediately before the session, record tested URL, source
  commit, serving revision, time zone, course ID, and `maxTeamSize`. Stop and
  record BLOCKED if access, fixture state, or the release cannot be confirmed.
- **Evidence:** record tester/role, exact actions and inputs, expected and
  actual results, PASS/FAIL/BLOCKED, sanitized evidence ID, and any finding.
  A disabled UI control proves only the UI state. When a case requires an HTTP
  response, use a private authenticated API client and record only status and
  domain code—never a token, login body, cookie, or `Authorization` header.
- **Retention:** retain the new synthetic team and proposal for later cases,
  independent retest, and grading. Do not reset, seed, delete, or alter
  historical Lab 5 data as cleanup.

## UAT-06: save a draft and submit a complete proposal

- **Requirement / AC:** F-03, FR-03/FR-04, AC-07, NFR-04.
- **Category:** Normal journey.
- **Purpose:** Verify that an authorized team member can persist a draft and
  then submit a complete proposal exactly once.
- **Roles:** S1; S2 may independently read the saved team state.
- **Preconditions:** UAT-01 created the run's new team and UAT-02 added S2;
  no proposal has been submitted for that team. S1 is signed in as a member.
- **Synthetic inputs:** complete values from Shared setup above.

### Numbered user actions

1. As S1, open the new team's proposal editor and enter all four complete
   values. Select **Save Draft** once.
2. Confirm the visible proposal status is `DRAFT`; reload the browser and
   compare all four values with the entered values.
3. Select **Submit Proposal** once. Record the visible success/status result,
   then reload the page.
4. In S1's private API session, retrieve
   `GET /api/teams/<team-id>/proposal` only if the UI does not expose the
   required metadata. Record sanitized status, `submittedAt`, and
   `revisionCount`.
5. As S2 in a separate profile, open the same team and compare the authorized
   proposal status and content with S1's readback.

### Expected results

- Saving makes the same four values available after reload and displays
  `DRAFT`; it does not submit the proposal.
- The first complete submission succeeds, displays `SUBMITTED`, persists a
  non-empty submission time, and has `revisionCount = 1`.
- The authorized metadata read, if performed, returns HTTP 200 and agrees
  with the UI. S2 sees the same authorized team proposal state.

## UAT-07: validate completeness boundaries and submitted-state lock

- **Requirement / AC:** F-03, AC-08, BR-03, BR-04.
- **Category:** Business rule / boundary.
- **Purpose:** Verify incomplete proposals are rejected, exact lower
  boundaries are accepted, and a submitted proposal cannot be changed or
  submitted again.
- **Role:** R1 (the dedicated Run 2/retest leader).
- **Preconditions:** The Product Team provisioned the R1--R4 cohort described
  in [UAT data and reruns](uat-data-and-reset.md). R1 is eligible and
  unassigned in CPE334 and creates one separate boundary team, so UAT-06's
  submitted proposal remains available for UAT-09/UAT-08. If R1 or a safe
  equivalent fixture is unavailable, mark UAT-07 BLOCKED rather than reuse
  S1, who is already assigned to the normal UAT team.
- **Synthetic inputs:**
  - title length 4: `Test`; title length 5: `Tests`;
  - problem length 19: `1234567890123456789`; length 20:
    `12345678901234567890`;
  - valid stack: `React`; valid repository URL:
    `https://example.com/coursepms-uat-boundary`.

### Numbered user actions

1. As R1, create the run-specific boundary team. Save a draft with the
   4-character title, the 20-character problem,
   `React`, and the boundary URL. Attempt **Submit Proposal** once.
2. Replace the title with `Tests`, save/reload, and confirm the draft remains
   editable. Replace the problem with the 19-character value and attempt
   submission once.
3. Replace the problem with the 20-character value, save/reload, then submit
   once. Record `SUBMITTED`, the submission time, and revision count.
4. Attempt to edit one field and save. Attempt **Submit Proposal** again.
   If the UI disables either action, preserve that evidence and use R1's
   private API session to attempt the corresponding PUT or POST once.
5. Reload and compare the saved fields, status, submission time, and revision
   count with the state immediately after step 3.

### Expected results

- The 4-character title and 19-character problem submissions are rejected
  with `BR04_INCOMPLETE_PROPOSAL` (HTTP 400 when the request is observed).
  Neither attempt produces a submission timestamp or increments a revision.
- The exact boundary values (title 5, problem 20) submit successfully with
  `SUBMITTED`, a timestamp, and `revisionCount = 1`.
- A submitted proposal's edit and repeated submit are rejected with
  `BR03_INVALID_STATUS_TRANSITION` (HTTP 409 when observed). The persisted
  content and metadata remain exactly as recorded after step 3.

## UAT-08: instructor requests revision, team resubmits, instructor approves

- **Requirement / AC:** F-03, FR-05, AC-09, BR-03, BR-05.
- **Category:** Normal review lifecycle and business-rule validation.
- **Purpose:** Verify the complete instructor feedback workflow and its
  validation boundary.
- **Roles:** I and S1.
- **Preconditions:** UAT-06 completed with the normal proposal `SUBMITTED`,
  `revisionCount = 1`; I is a verified instructor in a separate profile.
- **Synthetic inputs:** short feedback `Short`; revision feedback `Please
  clarify the implementation and acceptance evidence.`; revised title
  `CoursePMS Independent UAT Proposal Revised`; approval feedback `The revised
  proposal scope is clear and suitable for the course.`

### Numbered user actions

1. As I, open the UAT-06 proposal. Enter `Short` and select **Request
   Revision** once. Reload and record proposal status, revision count, and
   feedback state.
2. Enter the full revision feedback and select **Request Revision** once.
   Reload the instructor view.
3. As S1, reload the proposal. Confirm `REVISION_REQUESTED` and the full
   feedback. Change only the title to the revised title, save, and submit
   once. Reload and record the new state.
4. As I, reload the same proposal, enter the approval feedback, and select
   **Approve Proposal** once. As S1, reload and compare the approved status
   and feedback.
5. Where the UI does not expose an error/status, use the correct private role
   API session to record only the sanitized response. Do not use an API call
   to bypass an already observed successful UI action.

### Expected results

- Feedback shorter than 10 characters is rejected with
  `BR05_FEEDBACK_TOO_SHORT` (HTTP 400 when observed); status remains
  `SUBMITTED`, revision remains 1, and no short feedback is saved.
- Valid revision feedback changes the proposal to `REVISION_REQUESTED` and is
  visible to S1 after reload.
- S1 can save the revised title and re-submit. Status returns to `SUBMITTED`,
  `revisionCount = 2`, and the resubmission has a persisted timestamp.
- Valid approval changes the same proposal to `APPROVED`; S1 sees the approval
  feedback after reload. There is no new team or duplicate proposal.

## UAT-09: deny cross-team proposal access and student review

- **Requirement / AC:** F-03, AC-10, BR-06, NFR-02.
- **Category:** Forbidden ownership and role.
- **Purpose:** Verify a foreign student cannot read or mutate the UAT team's
  private proposal, and a student cannot exercise instructor review.
- **Roles:** F, S1, and I for an authorized comparison.
- **Preconditions:** UAT-06 normal proposal is `SUBMITTED`; F is confirmed as
  a member of another CPE334 team and is signed in in a separate profile.
  Record S1's authorized baseline: title, status, revision, feedback, and
  proposal ID (through a private read only when the ID is not in the UI).
- **Synthetic input:** a complete changed proposal payload labelled with the
  current run ID; it must not be saved if the guard works.

### Numbered user actions

1. As F, open the UAT team's row and select **View Proposal**. Record the UI
   result, specifically whether any private title, problem statement, stack,
   URL, feedback, or proposal metadata is shown.
2. In F's private API session, attempt GET, PUT with the changed payload, and
   POST submit on `/api/teams/<uat-team-id>/proposal`. Record only HTTP status
   and domain code for each request.
3. As S1, attempt the instructor review action on the same proposal using
   `APPROVED` and `This student review must be rejected.` in a private API
   session. Record only sanitized status/code.
4. As S1 and then I, reload the authorized proposal and compare it with the
   baseline from before step 1.

### Expected results

- F is denied the foreign proposal: GET, PUT, and submit return HTTP 403 with
  `BR06_FORBIDDEN_TEAM_ACCESS` when observed. The foreign view does not expose
  the private proposal content or feedback.
- S1's student review is denied with HTTP 403
  `BR06_INSTRUCTOR_ROLE_REQUIRED` when observed.
- Authorized S1/I reads show the same title, status, revision, feedback, and
  submission state as the recorded baseline; neither denied write changed it.

## UAT-10: retain proposal history and state after reload and relogin

- **Requirement / AC:** F-03, AC-07, AC-09, NFR-04.
- **Category:** State / history / persistence.
- **Roles:** S1, S2, and I.
- **Preconditions:** UAT-08 completed; the normal proposal is `APPROVED` at
  `revisionCount = 2`, and no Product Team change is occurring during the
  comparison.

### Numbered user actions

1. As S1, record the complete authorized baseline: team name and roster,
   proposal title/content, `APPROVED` status, revision count 2, submission
   time, and latest instructor feedback.
2. Reload the page, then log out. Use browser Back and refresh to confirm no
   private workspace remains. Sign in again as S1 and compare every baseline
   field.
3. In separate profiles, sign in as S2 and I; open the same team/proposal and
   compare the authorized state to S1's baseline.
4. Retain the team/proposal identifiers and evidence references; do not reset
   the data.

### Expected results

- Reload and relogin preserve the same team and proposal: no duplicate
  proposal, no lost fields, no altered feedback, and `APPROVED` with
  `revisionCount = 2`.
- S2 and I see the same authorized saved state appropriate to their roles.
- After logout, Back/Refresh does not reveal the private workspace. This case
  verifies application/database readback only; it does not claim a restart or
  redeployment test.

## Scope and execution limits

These cases do not add Sprint 2/3 features or claim every automated contract
subcheck was manually executed. If a required account, separate boundary
fixture, release identity, or private API observation is unavailable, record
the affected subcheck as **BLOCKED**. The independent fastTrack team—not the
CoursePMS Product Team—records actual results and makes the acceptance
decision for CoursePMS.
