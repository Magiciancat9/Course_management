# Lab 7 Part A — CR-L7-01: revision-request feedback minimum

**Status: PROPOSED — instructor/TA approval pending.**

This is the versioned change request supporting [Issue #85][request]. It does
not revise the approved product baseline or claim implementation. The user
will submit the request to the instructor/TA and confirm the outcome before
implementation starts.

| Responsibility | Confirmed owner |
| --- | --- |
| Request driver / TA submission | Tatchakorn Thamnimitr (`Magiciancat9`) |
| Independent document reviewer | Pawarit Wongdaeng (`martinvadre`) |
| Project | [CoursePMS - Lab 7][project] |
| Relevant scope | F-03 / FR-05 / BR-05 / existing AC-09 |
| Assignment deadline | 29 November 2026, 23:59 Asia/Bangkok |

## 1. Accepted baseline and version boundaries

| Reference | Identity and meaning |
| --- | --- |
| Original CoursePMS Sprint 1 | [`v1.0.0-sprint1`][tag], commit `5979f5870e8e28277996dc3045cbf4be5f7236ad` |
| Accepted Sprint 1 after Lab 6 | [`aeb804ea5bc667399b00cf54df10046a6ded46e0`][baseline], released through [PR #76][release] |
| Accepted serving revision | `course-pms-00009-mk2`, as recorded in the [Lab 6 acceptance evidence][acceptance] |
| GitHub main inspected for this request | `aeb804ea5bc667399b00cf54df10046a6ded46e0` on 22 November 2026 |
| Documentation branch base | The accepted Lab 6 commit above; this request adds documentation only |
| Actual implementation pre-change SHA / serving revision | **Pending:** record immediately before implementing the approved request and explain any intervening changes |
| Maintained release / new deployed revision | **Pending:** no Lab 7 implementation, release or deployment has occurred |

The original tag and accepted Lab 6 correction are distinct. Lab 5 added
delivery/migration/health support; Lab 6 corrected session isolation,
roster-only foreign-proposal privacy and protected JSON routing. These
intervening changes did not introduce operational Sprint 2/3 workflows.
Historical acceptance applies to the identified release and recorded targeted
scope, not to a future maintained candidate.

Do not use local tag `v1.0.0-sprint-1` (an extra hyphen): that tag belongs to
the fastTrack product, not CoursePMS.

## 2. Existing, previously correct rule

An authenticated `INSTRUCTOR` may review only a `SUBMITTED` proposal through
`POST /api/proposals/:id/review`. Both `APPROVED` and `REVISION_REQUESTED`
require `reviewFeedback.trim().length >= 10`.

The accepted implementation normalizes feedback and rejects values below
the same minimum for both decisions:

```ts
const feedback = typeof reviewFeedback === 'string' ? reviewFeedback.trim() : '';
if (feedback.length < 10) {
  // 400 BR05_FEEDBACK_TOO_SHORT
}
```

Evidence at the accepted commit:

- [Domain validation, including the minimum at line 88][old-rule].
- [Review endpoint, role/state validation and saved review fields][old-endpoint].
- [Sprint 1 contract: BR-05, review workflow and AC-09][old-contract].
- [Existing domain tests][old-unit] and [API/DB lifecycle tests][old-api].

The old 10-character rule is correct under the existing specification. This
request changes a requirement; it is not another Lab 6 defect report.

## 3. Proposed new rule, reason and scope

| Review decision | Existing minimum | Proposed minimum |
| --- | ---: | ---: |
| `REVISION_REQUESTED` | 10 | **20** |
| `APPROVED` | 10 | **10, unchanged** |

All minima apply after `trim()` and use JavaScript `String.length` (UTF-16
code units), consistently in the UI and backend. This is not a definition of
user-perceived Unicode character count.

**Reason:** a request for revision should provide more detail for the team
to act on. Increasing only that decision's minimum is a bounded change to an
existing Sprint 1 rule; it does not add a subsystem or reserve unfinished
Sprint 2/3 work as maintenance.

**In scope:** review validation; decision-dependent UI hints; revised
relevant SRS/SDS/contract/AC/STS sections after approval; and affected tests.

**Preserve:** supported endpoint/response shape, decision enums,
authentication, instructor-only review, team ownership/privacy, state locks,
submission validation, revision/resubmission and downstream use of
`APPROVED` proposals.

Rejected requests must leave `status`, `reviewFeedback`, `reviewedAt` and
`reviewedById` unchanged. Successful requests store trimmed feedback and
remain retrievable through authorized reads after reload. Historical reviews
with 10–19 code units stay readable and are not rewritten or retroactively
invalidated.

No schema migration is expected: `ProjectProposal.reviewFeedback` remains
the same string field. Confirm and justify this in the approved impact
analysis; do not silently modify stored data.

## 4. Proposed acceptance criteria and test outline

These are proposed expectations for TA review, not an approved contract or
executed new-behavior tests. Except where stated otherwise, preconditions
are an authenticated instructor, a `SUBMITTED` proposal and valid payload.

| Proposed AC / test | Input and expected outcome | Planned level |
| --- | --- | --- |
| L7-AC01 / L7-T01 | `REVISION_REQUESTED`: trimmed ASCII length 19 returns `400 BR05_FEEDBACK_TOO_SHORT`; lengths 20 and 21 succeed and persist | Unit + API/DB |
| L7-AC02 / L7-T02 | Surrounding whitespace does not increase trimmed length. Blank, missing or non-string feedback is rejected with 400 for an otherwise valid request | Unit + API |
| L7-AC03 / L7-T03 | `APPROVED`: length 9 returns 400; length 10 succeeds. Invalid decision retains `400 VALIDATION_ERROR` | Unit + API |
| L7-AC04 / L7-T04 | Non-`SUBMITTED` retains `409 BR03_INVALID_STATUS_TRANSITION` before payload validation. Unauthenticated requests retain 401 and student review attempts retain 403 | API |
| L7-AC05 / L7-T05 | Rejected requests leave the saved row unchanged; successful status/feedback reads back after reload; historical valid reviews remain readable | API/DB + selected UI/E2E |
| L7-AC06 / L7-T06 | UI hints follow the decision; direct API requests enforce the rule independently of the UI; foreign-team feedback remains private | UI + API access |

## 5. Preliminary impact for approval review

| Area | Expected impact / reason for no change |
| --- | --- |
| FR-05 / BR-05 / F-03 / AC-09 | Revise the decision-specific feedback minimum in the SRS, feature review contract and acceptance criteria after approval |
| STS / traceability | Version the proposed cases above, inputs, expected results and AC mappings before implementation; retain review and commit chronology |
| System SDS / feature SDS / UI spec | Align review validation and instructor hints; permission/state matrix and supported endpoint shape remain the same |
| Backend | `server/src/utils/domainRules.ts`; inspect review callers and error/transaction handling in `server/src/app.ts` |
| Frontend | Review feedback input, hints and affected behavior in `client/src/App.tsx`; enforce the backend rule even if the UI is bypassed |
| Data / historical records | No data-shape change expected; preserve old feedback and prove rejected writes do not mutate the row |
| Migration | Not expected for a validation-only change; explicitly confirm in the reviewed impact analysis |
| Dependencies | Recheck revision/resubmission and the evolving F-05 prerequisite that consumes `APPROVED`; do not change deliverable eligibility |
| Preserved regression | BR-03 state locks; BR-04 completeness; BR-06 roles/ownership; auth/logout; team uniqueness/capacity; session isolation; roster privacy; protected JSON routing; persistence |

This preliminary table supports the approval request. The complete revised
engineering contract and STS, including teammate review before code, remain
the work of [Issue #86][contract-task] after the approved scope is known.

## 6. Preparation verification and evidence limits

On 22 November 2026, the existing domain suite was run without changing any
source or test:

```text
Directory: Course_management/server
Command: npx --no-install vitest run --config vitest.config.ts tests/domain.unit.test.ts
Execution HEAD: 81c5190738149b03d91b991a9b907c9e2360015d
Result: 1 test file passed; 9 tests passed; 0 failed; 0 skipped
```

That execution HEAD is the existing documentation worktree. Its domain
implementation and test files are byte-identical to the accepted Lab 6
baseline; this request's separate branch starts directly from that baseline:

| File | Identical Git blob at execution HEAD and accepted baseline |
| --- | --- |
| `server/src/utils/domainRules.ts` | `9fca6db7a18cc2abc088586782c88c50edb2d79d` |
| `server/tests/domain.unit.test.ts` | `b8683138d48a6ec275f9322595994b06488d88e8` |

The first sandboxed runner attempt stopped while loading configuration due
to an access-denied error. The successful rerun outside that restriction
produced the result above. That startup failure is not domain-test RED
evidence.

This is an AI-operated verification of existing domain behavior only. It is
not RED/GREEN for the proposed requirement, full regression, API/DB/E2E
execution, a current live-deployment check, teammate review or TA approval.

## 7. Approval record and next gates

| Required record | Current status |
| --- | --- |
| Instructor/TA approver | Pending |
| Approved request revision and conditions | Pending |
| Approval text/permalink and actual date/time | Pending |
| User confirmation to begin implementation | Pending |
| Independent review of this request document | Pending; to be recorded on its PR |
| Reviewed updated engineering contract / STS | Pending in #86, before implementation |
| New-behavior RED/GREEN | Pending in #87, after approval and contract review |

The user sends [Issue #85][request] to the instructor/TA. After approval is
recorded and the user confirms it, proceed to #86, then #87. Preserve the
sequence approved request → reviewed contract → genuine RED → GREEN →
relevant regression → reviewed integration/main release → GCP deployment →
changed and preserved post-deployment checks. Leave #85 open while approval
is pending; do not mark a dependency complete merely because this document
exists. Deliverable 2 contract/backlog work can continue during the wait.

### Short request message the user may send

> CoursePMS requests approval for Lab 7 CR-L7-01 (Issue #85): change the
> existing BR-05 feedback minimum for REVISION_REQUESTED from 10 to 20 after
> trimming, while keeping APPROVED at 10. The purpose is more actionable
> revision feedback. Roles, ownership, state rules and historical records
> stay unchanged. The Issue contains the accepted Sprint 1 baseline, scope
> and proposed boundary/access/persistence acceptance criteria. Please
> confirm approval or requested revisions before implementation.

## Revision history

| Revision | Date | Meaning |
| --- | --- | --- |
| CR-L7-01 v1.0 | 22 November 2026 | Prepared approval request and verified old-rule sources/existing domain suite; no TA approval or code change |

[request]: https://github.com/Magiciancat9/Course_management/issues/85
[contract-task]: https://github.com/Magiciancat9/Course_management/issues/86
[project]: https://github.com/users/Magiciancat9/projects/7
[tag]: https://github.com/Magiciancat9/Course_management/tree/v1.0.0-sprint1
[baseline]: https://github.com/Magiciancat9/Course_management/commit/aeb804ea5bc667399b00cf54df10046a6ded46e0
[release]: https://github.com/Magiciancat9/Course_management/pull/76
[acceptance]: https://github.com/Magiciancat9/Course_management/blob/6916f29bbd97b38e9a86a4284c2e0a0609f3ebbe/docs/labs/lab-06/coursepms-acceptance-confirmed.md
[old-rule]: https://github.com/Magiciancat9/Course_management/blob/aeb804ea5bc667399b00cf54df10046a6ded46e0/server/src/utils/domainRules.ts#L88
[old-endpoint]: https://github.com/Magiciancat9/Course_management/blob/aeb804ea5bc667399b00cf54df10046a6ded46e0/server/src/app.ts#L696
[old-contract]: https://github.com/Magiciancat9/Course_management/blob/aeb804ea5bc667399b00cf54df10046a6ded46e0/docs/sprints/sprint-1/f02-team-and-proposal-workflow.md
[old-unit]: https://github.com/Magiciancat9/Course_management/blob/aeb804ea5bc667399b00cf54df10046a6ded46e0/server/tests/domain.unit.test.ts
[old-api]: https://github.com/Magiciancat9/Course_management/blob/aeb804ea5bc667399b00cf54df10046a6ded46e0/server/tests/api.integration.test.ts
