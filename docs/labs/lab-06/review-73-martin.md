# PR #73 response to Martin's integration review

Source: [Martin's 17 November comment](https://github.com/Magiciancat9/Course_management/pull/73#issuecomment-6942019815), reviewed against head `ef45bcee95c736b51b603361b7556f4d529e3be0`. Codex prepared this response and changes; no new human approval or external comment is asserted.

## Instructor proposal status visibility

Added the explicit shared authorization predicate requested in the review:

```tsx
function canViewTeamProposalStatus(teamId: number) {
  return user?.role === 'INSTRUCTOR' || teamId === myTeam?.id;
}
```

Both student and instructor directory renderers now use this predicate for
status text and badge color. Instructors do not need team membership; own-team
student statuses remain visible and foreign student statuses remain `PRIVATE`.
Existing empty labels are preserved: student `NO_DRAFT`, instructor `NONE`.

The cited directory at the reviewed head was rendered only inside the
`STUDENT` workspace. The separate instructor console already rendered its
authorized statuses. The new instructor regression passed on that baseline
(2 directory tests passed); no original runtime failure or RED result is
claimed for this review concern. Sharing the explicit predicate makes the
requested role rule consistent and testable in both actual views.

The new test in `client/src/App.directoryPrivacy.test.tsx` uses an instructor
with no team membership and checks all four proposal statuses, their badge
colors, authorized titles, the no-proposal state, absence of `PRIVATE`, and
the SUBMITTED filter. Existing student-private/own-empty coverage remains.
After the change, `npm run test:client` passed **16 tests / 4 files / 0 skipped**
on 17 November at approximately 14:53 Asia/Bangkok. Final-head CI must also pass.

## Temporary integration helper

**Removed `tools/lab6-integrate-followup.ps1` from the candidate before staging
integration.** It was never executed. `release-readiness.md` now gives manual
owner-only identity/head/CI checks and a feature-branch fast-forward workflow.
No integration automation needs to ship with the application.

The earlier syntax-check JSON and earlier exports remain historical records
of the removed helper. They are not current instructions or release gates.
No source history was rewritten. The original implementation owner still
personally inspects/incorporates the proposal; the integrated latest #72 head
still requires fresh CI and substantive teammate review before staging/main.

## Draft reply for the user to post — UNSENT

> Addressed both items in the latest head. Both directory renderers now use an explicit `INSTRUCTOR || own team` status-visibility predicate for badge text and color. Added a no-membership instructor UI test covering DRAFT, SUBMITTED, APPROVED, REVISION_REQUESTED, badge colors, no-proposal state and filtering; all 16 client tests pass locally. The cited student table and actual instructor console were separate at the previous head, so no instructor runtime failure was reproduced there; the shared guard now makes the intended authorization explicit in both views. Removed the temporary integration helper before staging integration and replaced its instructions with manual owner steps. Please recheck the latest head and its CI before incorporating into #72.

No reply was posted, review approved, branch integrated, PR merged or service
deployed by this change. The independent retest and actual acceptance decisions
remain pending under the existing workflow.
