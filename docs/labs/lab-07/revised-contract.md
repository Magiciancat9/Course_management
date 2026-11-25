# Lab 7 revised contract, impact and STS — L7-CONTRACT v1.1

**Scope approved:** P'Tik (TA), 22 Nov 2026, 20:18 Asia/Bangkok;
[L7-E01 approval](approval-record.md). **Contract author/driver:**
`Magiciancat9`. **Independent reviewer:** `martinvadre`.
**Contract review status:** APPROVED by martinvadre on 22 Nov 2026 at 21:22:38 Asia/Bangkok, reviewed source `947b914`; merged PR #105. Work: [#86](https://github.com/Magiciancat9/Course_management/issues/86)
/ [PR #105](https://github.com/Magiciancat9/Course_management/pull/105).
The contract was approved before implementation. Current candidate results and unchanged RED/GREEN test proof are in [L7-E05–E08](implementation-evidence.md); code review/release remain separate gates.

## 1. Version and exact old/new rule

Accepted reference and actual implementation checkpoint are distinct:
`aeb804ea5bc667399b00cf54df10046a6ded46e0` and
`dfe5d25ec8934161d3ece5726d7611d64c044c52`, respectively. See
[L7-E02 pre-change record](pre-change-baseline.md), including later-sprint
differences and immutable source blobs. Original Sprint 1 tag is
`v1.0.0-sprint1` / `5979f5870e8e28277996dc3045cbf4be5f7236ad`.

Old assessed excerpt, implemented at the checkpoint:

```ts
const feedback = typeof reviewFeedback === 'string' ? reviewFeedback.trim() : '';
if (feedback.length < 10) { /* reject BR05_FEEDBACK_TOO_SHORT */ }
```

New assessed contract, approved scope / awaiting teammate contract review:

| Decision | Before | Required after implementation |
| --- | --- | --- |
| REVISION_REQUESTED | At least 10 | At least **20** after trim |
| APPROVED | At least 10 | At least **10** after trim, unchanged |

Normalization uses JavaScript `String.prototype.trim()` and `String.length`
(UTF-16 code units), matching the approved issue. Do not substitute Unicode
code points, grapheme count, untrimmed length or a global minimum of 20.
Non-string feedback is invalid; no new maximum-length rule is introduced.

## 2. API, access, state and data contract

- Keep `POST /api/proposals/:id/review`, request `{decision,reviewFeedback}`,
  existing success `{proposal}` and error `{error,code}` shapes unchanged.
- Preserve current precedence: auth → INSTRUCTOR role → resource lookup →
  current state inside the existing transaction → supported decision →
  feedback normalization/decision-specific minimum → write.
- Anonymous remains 401; a student review attempt remains 403
  `BR06_INSTRUCTOR_ROLE_REQUIRED`, even with invalid feedback. An instructor
  request for a missing proposal retains existing 404 behavior.
- Non-SUBMITTED state remains 409 `BR03_INVALID_STATUS_TRANSITION` before
  decision/feedback checks. Unsupported decision remains 400
  `VALIDATION_ERROR`. Feedback below its decision's threshold remains 400
  `BR05_FEEDBACK_TOO_SHORT`; error copy identifies the actual threshold.
- Rejected review leaves status, feedback, reviewedById, reviewedAt,
  submittedAt, revisionCount and existing stored fields unchanged.
- Successful review atomically stores the selected state, trimmed feedback,
  authenticated instructor ID and server review time. Authorized GET/reload
  retrieves the same values. Keep existing row lock/transaction and reject
  stale competing decisions; do not change team/proposal ownership rules.
- Student foreign-team proposal/feedback remains private and denied by the
  backend. Instructor access and authorized own-team read remain unchanged.
- Existing 10–19-unit APPROVED or REVISION_REQUESTED reviews remain readable
  as valid historical records. No retrospective rewrite/revalidation, schema
  change, migration or seed reset is needed for this validation-only change.

## 3. UI and dependency contract

The existing instructor panel uses one feedback textarea and two actions.
Display explicit action-specific guidance: **Approve: minimum 10 after trim;
Request revision: minimum 20 after trim**. The backend is authoritative;
direct API calls must enforce the same rule. A 10-unit approval must remain
usable; do not disable both actions through a shared minimum-20 constraint.

Keep feedback input on a same-session rejected review and display the real
API error; clear/show success only for a confirmed successful write. Preserve
session-generation/abort checks, identity-boundary clearing, current test IDs,
state-disabled decisions and student private-feedback visibility. The current
Bootstrap panel is the locked implementation; the separate #106 modern UI
requires reconciliation/retest if it is later integrated, not silent assumption.

Revision/resubmission flow and approval's downstream F-05 eligibility stay
unchanged. Sprint 2/3 implementations are not prerequisites for this bounded
change; if later-sprint code enters the actual candidate, document and test
its affected dependency on that exact version.

## 4. Compact impact and traceability

| Requirement / feature | Revised specification section | AC / tests | Code / callers / reason |
| --- | --- | --- | --- |
| FR-05 / BR-05 / F-03 | [SRS §5](../../srs.md); [F-03 §2.1/2.2](../../sprints/sprint-1/f02-team-and-proposal-workflow.md) | Existing AC-09 elaborated by L7-AC01–03; L7-T01–03 | `validateInstructorReview` in `server/src/utils/domainRules.ts`; direct domain caller and endpoint |
| BR-03 / F-03 | F-03 state diagram / API; [System SDS §3.2](../../system-sds.md) and this contract §2 | L7-AC04; L7-T04; retained TEST-16/17/18 | Existing review route in `server/src/app.ts`; state/transaction ordering unchanged |
| BR-06 / NFR-01/02 | F-03 authorization; System SDS role/DTO rules | L7-AC04/06; L7-T04/06; TEST-03/10/14/19/23 | `requireAuth`, INSTRUCTOR guard, authorized proposal GET and roster serialization; no new access policy |
| NFR-04 / F-03 | F-03 data/write contract; this contract §2 | L7-AC05; L7-T05; TEST-07/09/18 | ProjectProposal fields / transaction; historical reads preserved, no schema or migration change |
| FR-05 / UI | [UI specification](../../ui-spec.md), instructor feedback section; System SDS §3.1 | L7-AC06; L7-T06; session/privacy regression | `client/src/App.tsx`, `handleInstructorDecision`, common textarea/action hints; retain auth/session boundary |
| AC/STS / assessment | [STS addendum](../../sprints/sprint-1/sts-and-dod.md); [traceability](../../traceability.md) | All L7-AC01–06 → L7-T01–06 | Actual tests/files/commands/results are mapped in [implementation evidence](implementation-evidence.md); no release/deployed result is inferred |
| F-05 / BR-07 downstream | Existing approved-proposal prerequisite | L7-AC03/05; regression on actual integrated scope if present | APPROVED enum/eligibility unchanged; no operational F-05 at locked baseline |
| Data migration / infrastructure | N/A to rule change | L7-T05 historical-data assertions | Same string/state columns and delivery process; no migration, new subsystem, auth refactor or deployment now |

## 5. Approved-scope acceptance criteria

The criteria below were versioned and independently approved before tests/code.
The #87 candidate now implements them with executed unit/API/DB/UI/E2E evidence
in [L7-E05–E08](implementation-evidence.md); independent code review/merge and
release verification remain pending.

| AC | Required observable behavior | STS |
| --- | --- | --- |
| L7-AC01 | Submitted revision-request feedback: trimmed 19 units rejected; 20/21 accepted and stored | L7-T01 |
| L7-AC02 | Trim/count/type semantics match the issue; blank/missing/non-string feedback rejected without a write | L7-T02 |
| L7-AC03 | Approval remains 9 rejected / 10 and 11 accepted; invalid decision rejected | L7-T03 |
| L7-AC04 | Existing auth/role/resource/state precedence and competing-decision protection preserved | L7-T04 |
| L7-AC05 | Rejections preserve the stored row; valid trimmed results survive authorized read/reload; legacy feedback is retained | L7-T05 |
| L7-AC06 | Action-specific UI guidance/error handling and direct API enforcement agree; foreign/private/session behavior stays correct | L7-T06 |

## 6. STS: concrete inputs, expected results and planned locations

Fixtures: synthetic Instructor I/I2; Student A in Team A and Student B in
Team B; Team A proposal P in SUBMITTED. Reset only a verified disposable
test DB between independent boundary examples. Read the persisted row before
and after; do not derive expected results from the implementation function.

| Test / level | Inputs and setup | Expected result / AC | Planned actual location |
| --- | --- | --- | --- |
| L7-T01 / unit + API/DB | I reviews SUBMITTED P, decision REVISION_REQUESTED; ASCII `r` repeated 19, 20 and 21, independent fixture per case | 19 → invalid/HTTP 400 BR05_FEEDBACK_TOO_SHORT with row unchanged; 20/21 → valid/200, trimmed feedback/state persisted; L7-AC01 | `server/tests/lab7-review.unit.test.ts`, `server/tests/lab7-review.integration.test.ts` |
| L7-T02 / unit + API/DB | Revision feedback `spaces + r×19 + tab/newline` and NBSP padding; `spaces + r×20 + spaces`; missing/null/number/boolean/array/object/blank values. Unicode: nine surrogate-pair emoji plus ASCII `a` = 19 units, ten such emoji = 20 units | Padding cannot rescue 19; trimmed 20 accepted. Invalid types/blank 400. Unicode follows UTF-16 length, not code-point count. Zero-width space is not removed by JS trim and counts as a unit; preserve exact method. L7-AC02 | Same new unit and real API/DB suites; rejected-row assertions shared with L7-T05 |
| L7-T03 / unit + API/DB | I + SUBMITTED P; APPROVED with ASCII lengths 9/10/11 and padded 10; unsupported decision with otherwise valid feedback | 9 rejected; 10/11 accepted and trimmed. Invalid decision 400 VALIDATION_ERROR; do not apply revision minimum to approval. L7-AC03 | Same new unit/API suites; preserved TEST-09 lifecycle |
| L7-T04 / unit + API/DB | DRAFT/APPROVED/REVISION_REQUESTED P with invalid decision or short feedback; anonymous and student review with invalid payload; instructor missing ID; existing two-instructor decision race | State 409 before decision/length, anonymous 401, student 403 before payload; authorized missing proposal retains 404; no rejected write. Existing TEST-18 permits only one accepted competing decision. L7-AC04 | New unit/API checks plus retained `server/tests/api.integration.test.ts` TEST-03/09/10/18 |
| L7-T05 / API/DB + selected E2E | Snapshot all P fields; rejected 19-unit revision, accepted padded 20-unit revision, own-team/instructor GET then reload. Seed previously valid 10–19-unit historical APPROVED and REVISION_REQUESTED rows directly in disposable fixture | Rejection preserves full stored row; success stores trimmed feedback, correct actor/time/state and reads back. Legacy rows remain readable/unmodified; no production seed/migration. L7-AC05 | New real API/DB suite; planned `e2e/lab7-review.spec.ts` for changed/preserved UI journey |
| L7-T06 / component + API + E2E | Instructor sees both action thresholds; sends revision with 19 then 20; retains rejected text, sees real error, valid result after reload. Approval with 10; student/foreign-team and delayed A→B session fixtures | Explicit 20 revision / 10 approval guidance, correct backend rejection independent of UI, no false success/draft loss/private leakage; unauthorized requests denied. L7-AC06 | Planned `client/src/App.lab7Review.test.tsx`, new API/E2E suites; retained session/directory suites |

The named Lab 7 test paths now exist, created only after actual contract review.
See [execution evidence](implementation-evidence.md) for exact files/cases,
versions and results; the inputs/expected outcomes above remain unchanged.
Existing unchanged files are distinguished from new cases.

## 7. RED/GREEN, regression and delivery sequence

1. Retain L7-E01 approval and L7-E02 pre-change tag; peer accepts this contract
   revision with reviewer, actual date/time, review permalink and commit.
2. Reverify checkpoint blobs. Commit only the new behavioral test first;
   run the 19-unit revision rejection assertion against old runtime. Old code
   must fail that assertion because it accepts 19, not from a compiler/DB
   setup error. Record test-only SHA, unchanged runtime SHA, command and counts.
3. Only then implement the bounded validator/UI change; run the same test
   GREEN plus all named boundaries, access/persistence and UI checks.
4. Preserve old unaffected tests. Explain any legitimately revised expectation
   (e.g. old common-minimum UI hint), with both old/new contract provenance.
5. Run `npm run test:server`, `npm run test:client`, `npm run test:e2e`,
   `npm run build` and normal CI/Docker checks on the identified candidate.
   Existing TEST-03–10/14–19/21–23, domain, routing/privacy, session and
   directory suites protect the traced dependencies; include FAIL/SKIP counts.
6. Teammate reviews code/evidence before lab7-staging integration and reviewed
   main release through the Lab 5 pipeline. Record source → CI → image →
   revision; run changed 19/20 and preserved approval-10/domain/access checks
   after deployment using agreed synthetic fixtures. #88/#89 retain ownership.
7. Final metrics/readiness/report #90–92 use the actual maintained release,
   embedded source/result summaries and current limitations. They are not
   completed by this contract. This update deploys nothing.

## 8. Required independent review record

| Field | Actual status |
| --- | --- |
| Reviewer | martinvadre, actual APPROVED review before implementation |
| Contract revision / commit | L7-CONTRACT v1.1 / `947b914dc6b7915b6d825e52f18299191ffe6cb0`; merge `6429479316f7f156ecb49bb106630ab80fa6096c` |
| Review permalink / actual time | [Review 6012714738](https://github.com/Magiciancat9/Course_management/pull/105#pullrequestreview-6012714738), 22 Nov 2026 21:22:38 Asia/Bangkok; reviewer merged at 22:16:10 |
| Required substance | Confirm 20-only revision / 10 approval, trim/UTF-16 boundaries, API precedence, unchanged data/access, complete AC/STS mapping, pre-change source and regression selection |
| Implementation authorization condition | Satisfied before #87 test/code: TA approval, user go-ahead, pre-change lock and actual teammate review recorded. PR #111 implementation still awaits its own independent code review and merge |

Keep the review as an actual GitHub review/comment, not an AI-created claim
on the teammate's behalf. Later accepted amendments get their own revision.
