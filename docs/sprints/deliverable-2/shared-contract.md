# Shared Sprint 2–3 contract — D2-COMMON v1.0

**Original draft:** 22 Nov 2026; independently reviewed via PR #107 before code.
**25 Nov update:** F-04/F-05/F-06 implemented and reviewed via PR #116/#117/#118;
combined results and release gates: [Sprint 2 ledger](../sprint-2/accepted-release.md).
F-07/F-08 implementation remains Sprint 3 work.
Read the [package index](README.md) and per-feature AC/STS together.

## 1. Baseline, boundaries and proposed decisions

Accepted reference: `aeb804ea5bc667399b00cf54df10046a6ded46e0` after Lab 6.
Existing roles are STUDENT/INSTRUCTOR; current course access is not backed by
an instructor-assignment/enrolment model. Keep the existing global instructor
role authority over existing courses; do not silently add a new enrolment
subsystem. Private team operations always verify membership server-side.

| Decision | Proposed interpretation for review | Reason / affected contracts |
| --- | --- | --- |
| DD-S2-01 | Accept only absolute HTTP(S) artifact/report URLs; trim and validate, never fetch them server-side | F-05 links are references, not an upload/proxy subsystem |
| DD-S2-02 | Late submissions are permitted and flagged; equality to the deadline is on time | Existing SRS includes late flagging, not a blanket late-submission ban |
| DD-S2-03 | Immutable submission versions; a published grade belongs to exactly one version | Updating a deliverable must not silently retain a grade for different content |
| DD-S2-04 | Instructor role remains global within the existing course catalogue | Matches current access/data model; still check resource/course context |
| DD-S3-01 | A peer-evaluation milestone is completed when published, server time is at/after its due date, and this team has a saved submission | Makes FR-10's unspecified completion boundary explicit without requiring a grade first |
| DD-S3-02 | Peer rating is an integer 1–5; author sees own outgoing evaluations, instructor sees team evaluations; the evaluated student does not gain access | Concrete confidential evaluation contract; no self-rating |
| DD-S3-03 | Submission-rate denominator is all course teams; drafts excluded from milestones; no teams gives a null rate with numerator/denominator shown | Honest, reproducible analytics rather than a misleading zero or hidden eligibility denominator |
| DD-S3-04 | Export published current-version scores; spreadsheet-oriented quoted CSV with formula-risk neutralization | Unpublished/stale grades and spreadsheet formulas must not be misrepresented |

These design clarifications were reviewed in PR #107. Their review does not
claim implementation of the still-planned Sprint 3 workflows.
If a decision actually changes agreed product scope, record that separately
instead of presenting it as a silent clarification.

## 2. API and access contract

- Prefix `/api`; normal resources use JSON envelopes named in each contract.
  CSV is the sole documented alternate response. Unknown APIs remain JSON
  404 before SPA fallback; do not create an accidental public route.
- Mutations require a valid unrevoked session and the stated role. Never take
  caller identity, team membership, grade publisher or timestamps from a body.
- Validation order: authentication → role on role-only routes → resource and
  course context/ownership → domain prerequisites → payload validation →
  expected-version check and atomic write. Preserve the existing proposal
  endpoint's own error precedence; it is not refactored by this package.
- Instructor-only operations reject students with 403 before disclosing the
  private resource. Foreign-team private access is 403 without private data;
  an otherwise authorized request for a missing resource is 404.
- New-resource error envelope: `{ "error": "readable message", "code":
  "STABLE_CODE" }`. No SQL, stack, password/hash, token or private foreign
  fields in responses. 400 = payload/identifier validation; 401 = session;
  403 = role/ownership; 404 = missing/context-mismatched resource; 409 =
  prerequisite/state/version conflict. Unexpected failures remain safe 500.
- Body IDs and `expectedVersion` are nonnegative integers as applicable;
  resource IDs are positive. Reject NaN, fractions, numeric strings and wrong
  JSON types in bodies. Path/query values are strings on the wire: accept only
  canonical decimal integer syntax within JavaScript's safe integer range,
  then apply the field's positive/nonnegative bounds. Reject body keys outside
  the documented writable schema.
- Text is trimmed where specified; limits use JavaScript UTF-16 length.
  Return meaningful field errors; backend validation is authoritative.
- List endpoints are course/team scoped, deterministic and use `limit`
  (default 50, range 1–100) and optional positive `afterId`. Empty lists are
  200 with `[]`. Aggregate/export endpoints cover the complete filtered
  dataset rather than aggregating only one UI page.

## 3. Time, concurrency and state

- Input instants require an ISO-8601/RFC3339 date-time with `Z` or explicit
  offset; reject invalid dates and timezone-free values. Normalize stored and
  returned instants to UTC, millisecond precision. UI displays Asia/Bangkok
  explicitly; it must not change the instant using a local date-only parse.
- Server time is authoritative. A submission's `submittedAt`, deadline
  snapshot and late flag are captured consistently in its write transaction.
  `submittedAt > dueDateSnapshot` is late; equality is on time. Do not accept
  client `submittedAt`, `isLate` or deadline overrides.
- Every editable new resource has integer `version`, initially 1. Create
  submission/task/evaluation requests use `expectedVersion: 0`; updates use
  the current version. Missing/malformed version is 400; stale version is
  409 with no partial write. Successful writes increment exactly once.
- Use atomic transactions/conditional updates and existing uniqueness
  constraints. Concurrent stale submit/grade/task writes must not win twice
  or overwrite newer state. Serializable retry, if used, is bounded and must
  not duplicate externally visible writes.
- Do not automatically retry a mutation after uncertain network failure.
  Retrieve the resource/version and reconcile. Duplicate create/update with
  an obsolete expected version yields 409, not a duplicate version or grade.
- A milestone deadline edit affects future submissions; each earlier version
  retains the deadline and lateness observed at its own accepted write.

## 4. Planned data model and migration obligations

This is a logical design, not a generated Prisma migration. Implementers must
review the actual production schema/history and add a new additive migration.
The existing init migration is already present; do not edit it in place or
use `db push`/seed resets on production.

| Entity | Planned additions / constraints |
| --- | --- |
| Milestone | Existing fields plus `status: DRAFT/PUBLISHED`, nullable `publishedAt`, `version`; no deletion endpoint in this scope |
| MilestoneSubmission | Existing `(milestoneId, teamId)` uniqueness; add current `version` and `reportUrl`; existing artifact/tag/notes/timestamp fields remain a current-version projection |
| SubmissionVersion | Immutable `(submissionId, version)` unique; repo/artifact URL, report URL, tag, notes, server time, nullable historical deadline snapshot and `lateStatus: ON_TIME/LATE/UNKNOWN` |
| SubmissionEvaluation | Unique submission/version; draft score/feedback, resource version, draftRevision, publishedDraftRevision and publication pointer; FK to evaluated content version |
| GradePublication | Immutable evaluation/draftRevision snapshot of score/feedback, submission version, publisher and server publication time; unique evaluation/draftRevision |
| Task | Team, optional milestone in same course, sprint number, title/description/status, nullable eligible assignee, author/last actor, timestamps, version |
| TaskEvent | Immutable accepted task-version change/actor/time; unique task/version, including creation; supports FR-09 contribution history |
| PeerEvaluation | Team/milestone, evaluator/evaluatee, rating/comment, timestamps/version; unique `(milestoneId, evaluatorId, evaluateeId)`; self-evaluation rejected server-side |

For existing submission/grade data, preserve original IDs/content and history.
Backfill a clearly identified legacy version without inventing missing report
URLs, publication times or historical deadlines. Unknown lateness stays
UNKNOWN; an existing score does not become a newly published evaluation
without a verifiable publication record. Retain legacy values for authorized
review/mapping. New writes require the new complete schema. Document every
backfill/mapping decision and verify before/after row counts and references.

Test empty DB migration and upgrade from a populated accepted-baseline
fixture; verify unrelated users, teams, proposals and revoked sessions remain
intact. Production recovery must use reviewed backup/forward-fix procedures,
not an assumed destructive down migration.

## 5. Shared UI, sessions and permission boundaries

- [UI refresh spec](../../ui-refresh-spec.md) controls presentation. Feature
  screens appear only when genuinely implemented, with real server data.
- Show loading, empty, error, pending, stale/conflict and success states.
  Preserve entered data on a same-session validation/network failure; do not
  announce save success until the API confirms it. Disable duplicate writes.
- Preserve the Lab 6 session-generation/abort protections. Logout, 401 expiry
  or identity switch clears private data and drafts. A stale response must
  not populate the next user's screen or clear that user's pending action.
- Keep public foreign rosters only; do not put submissions, grades, task
  details or peer evaluations into general team/course DTOs. Instructor-only
  metrics and CSV cannot be made public by hiding a UI link.
- Preserve maintained main's approved Lab 7 BR-05: minimum 20 for revision,
  10 for approval after trim/UTF-16. The initial 10/10 draft preceded TA
  approval; [approval/source](../../labs/lab-07/approval-record.md) records the change.

## 6. Test design and common fixtures

Use synthetic Instructor I, students A1/A2 in approved Team A, B1 in Team B,
and U unassigned; Team D has DRAFT proposal. Include two existing courses to
test context mismatch, draft/published milestones, zero-data courses, and
old/current submission versions with draft/published grades.

Inject a fixed server clock for exact equality and ±1 ms cases. Integration
tests use real PostgreSQL, isolated fixtures and independent GET/DB readback;
mock-only tests do not establish persistence. Use barriers/transactions for
deterministic concurrency, not timing sleeps. Test API authorization directly
and select UI/E2E journeys for complete human workflows.

For NFR-01/02, parameterize authentication/role/ownership denials over **every
documented protected route and HTTP method**, including list/history/export
variants; a single representative endpoint is not 100% route coverage. Assert
both response serialization and unchanged database/event/publication state.
Private JSON/CSV responses must use `Cache-Control: no-store`.

All new test files/IDs in feature contracts are planned. Create them only in
the implementation phase, preserve an actual behavioral RED before code,
then run the same test GREEN; compiler/fixture failures are not RED evidence.
Record command, actual path/name, tested commit, counts and environment.

## 7. Definition of Done for each implementation

1. Concrete contract/AC/STS and policy decisions are versioned and receive
   substantive independent teammate review before implementation.
2. Every AC has relevant actual tests; important boundaries, negative paths,
   backend role/ownership, real persistence and concurrency are executed.
3. Meaningful RED/GREEN commits/output and justified expectation revisions
   are retained. Do not weaken unrelated regression tests.
4. Feature branch/Issue → teammate-reviewed PR → exact-head CI → sprint
   integration → identifiable accepted main release; driver does not merge
   their own PR. Planned test paths are replaced/mapped to actual names.
5. Build, relevant original Sprint 1 regression and cross-feature checks run
   on the candidate; failures/skips/defects/debt have explicit dispositions.
6. GCP version/CI/image/revision and selected changed/preserved/persistence
   checks are recorded at release; this documentation phase deploys nothing.
7. Completion/traceability tables and required assessed PDF evidence reflect
   real results, including incomplete work and the exact final finish plan.

## 8. Review record

| Revision | Review status |
| --- | --- |
| D2-COMMON v1.0, 22 Nov 2026 | Proposed by Magiciancat9; martinvadre review pending; no implementation/test execution |
