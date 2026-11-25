# F-08 — Instructor analytics and CSV grade export

**Contract:** S3-F08 v1.0, 22 Nov 2026; proposed / review pending.
**Owner:** `martinvadre`; draft author `Magiciancat9`; requested independent
contract reviewer `martinvadre`; future owner-authored code reviewer
`Magiciancat9`. **Issues:** [#99 contracts](https://github.com/Magiciancat9/Course_management/issues/99),
[#102 implementation](https://github.com/Magiciancat9/Course_management/issues/102).
**Links:** FR-11/12; NFR-01/02/04; F-03, F-05/F-06 and F-07 data contracts.
**Implemented / executed / accepted:** NO / NOT RUN / NONE.

## 1. Feature SDS, workflow and layers

Instructor selects an existing course, reads a real database snapshot of team
proposal states, milestone submission progress, ungraded work and flagged
teams, then optionally exports the current gradebook. Student UI and direct
student API access are denied; hiding navigation is not authorization.

Planned server `routes/analytics.ts`, `services/analyticsService.ts` and
`services/gradebookExport.ts`; client `features/analytics/AnalyticsDashboard.tsx`.
Read through parameterized course-scoped queries using the shared access
contract. Aggregate/export one consistent database snapshot; do not combine
the first page of teams with unrelated pages or race-prone version reads.

F-08 adds no domain write or new core data table. Query/index additions are
reviewed only if needed; no data migration is needed for a read-only projection
when the F-04–07 schema is already integrated. Authentication, proposal and
grading rules remain owned by their existing contracts.

## 2. UI and API contract

- Instructor Analytics: clearly named course/as-of time, real summary counts,
  proposal distribution, per-milestone progress with numerator/denominator,
  current-version ungraded queue and flagged-team reasons. Each row links to
  the authorized underlying workflow, not a dead placeholder.
- Empty course: zero counts, explicit "no teams/milestones" and rate shown as
  not applicable when denominator is zero. Loading is not displayed as zero
  progress. Error and retry do not replace real data with fabricated metrics.
- Export has a pending state and yields the actual server CSV. A session
  switch/401 aborts stale private fetch/download actions using the existing
  session-generation boundary; a file already downloaded cannot be recalled.

| API | Access / response |
| --- | --- |
| GET `/api/courses/:courseId/analytics` | Instructor; 200 `{course,generatedAt,totals,proposalStates,milestoneProgress,ungraded,flaggedTeams}` |
| GET `/api/courses/:courseId/gradebook.csv` | Instructor; 200 `text/csv; charset=utf-8`, attachment filename with sanitized course code/date, private/no-store |

Both reject anonymous 401 and student 403 before private results. Authorized
missing course is 404 `COURSE_NOT_FOUND`; invalid ID/query is 400. Error
responses remain JSON rather than success-shaped CSV/HTML. No peer comments,
evaluator identities, passwords/hashes or tokens appear in these DTOs/exports.

## 3. Exact aggregation definitions

All computations use the selected course; generatedAt identifies the snapshot.
Rates are derived from integer counts and rounded to two decimal percentage
places; return numerator/denominator as well as the rounded rate.

| Output | Definition |
| --- | --- |
| totalTeams | Every registered ProjectTeam in the course, not only approved teams |
| proposalStates | Mutually exclusive NONE/DRAFT/SUBMITTED/APPROVED/REVISION_REQUESTED counts summing to totalTeams |
| publishedMilestones | PUBLISHED milestones only; drafts excluded from progress/export |
| milestone submittedTeams | Number of course teams with a current logical submission for that milestone, counted once regardless of historical versions |
| completionRatePct | `100 * submittedTeams / totalTeams`, rounded to 2 decimals; null if totalTeams=0, with counts 0/0 retained |
| late / unknown counts | Current-version snapshot LATE / UNKNOWN counted separately; do not call unknown legacy lateness ON_TIME |
| ungraded | Current submitted content versions with no published evaluation for that same version; draft evaluation and old-version published grade do not count as graded |
| flaggedTeams | Unique teams with reason set: REVISION_REQUESTED; OVERDUE_MISSING_SUBMISSION for a published milestone when now>dueDate and no current submission; LATE_SUBMISSION for a current LATE snapshot |

At exact deadline equality a missing submission is not yet overdue; +1ms is.
Use the submitted version's captured deadline for late status, not the
currently edited schedule. A team with multiple reasons appears once with
all reasons. Do not infer quality, penalties or a final weighted course grade
that the baseline never specified. No automatic peer-score adjustment.

## 4. CSV schema and correctness

UTF-8 with BOM; CRLF records; one header. Quote every field and double embedded
quotes; embedded commas/newlines remain in the same cell/record. This is the
documented spreadsheet-oriented export, not an assertion of a universal
round-trip data-interchange format.

Columns, in order:

```text
courseCode,teamId,teamName,proposalStatus,milestoneId,milestoneTitle,
dueDateUtc,weightPercent,submissionId,submissionVersion,submittedAtUtc,
lateStatus,publishedScore,publishedAtUtc
```

One row for each course team × published milestone; missing submission/grade
cells are empty, never a fabricated score 0. If there are teams but no
published milestones, emit one row per team with milestone columns empty.
If there are no teams, emit the header only. Order by teamId, then milestone
dueDate/id. Times are UTC ISO strings. Only the latest published evaluation
for the current content version contributes score/time; a legitimate score
0 is exported as `0`, distinct from missing grade. Peer data and proposal
body/grade draft content are excluded.

For untrusted text fields, classify leading formula-risk characters after
whitespace/Unicode compatibility normalization, including `=`, `+`, `-`, `@`,
their full-width forms and leading tab/CR/LF. Prefix risky text with a tab
inside the correctly quoted CSV cell, retaining its original text thereafter.
Numeric ID/score columns come from typed server values. This deliberately
changes the exported cell's underlying text for spreadsheet safety, not the
stored data. Actual Excel/LibreOffice import checks are required before
claiming consumer compatibility; saving/reopening in arbitrary applications
is not a universal security guarantee.

References for the format and guard: [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180)
and [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection).
The proposed guard must be reviewed and tested; quoting alone is insufficient.

## 5. Acceptance criteria

| AC ID | Criterion | Planned tests |
| --- | --- | --- |
| S3-F08-AC01 | Existing-course analytics returns an internally consistent, correctly scoped snapshot and actual as-of time | S3-F08-T01 |
| S3-F08-AC02 | Proposal-state counts include NONE, partition teams exactly and exclude other courses | S3-F08-T02 |
| S3-F08-AC03 | Milestone rates use the specified full denominator and current logical submissions; zero denominator is null, not a misleading 0% | S3-F08-T03 |
| S3-F08-AC04 | Ungraded queue ignores drafts and superseded-version grades; late/unknown snapshots remain distinct | S3-F08-T04 |
| S3-F08-AC05 | Flag reasons and exact-deadline boundaries are correct, with each team counted once | S3-F08-T05 |
| S3-F08-AC06 | Anonymous/student access to analytics/export is denied; missing/invalid context is safe and no confidential fields leak | S3-F08-T06 |
| S3-F08-AC07 | CSV row/column/order/encoding/escaping and empty/missing/zero-grade behavior match the schema | S3-F08-T07, S3-F08-T08 |
| S3-F08-AC08 | Risky spreadsheet text is neutralized without mutating stored data; named consumer import checks support any compatibility claim | S3-F08-T09 |
| S3-F08-AC09 | Concurrent submission/grade updates cannot produce mixed-version grades or inconsistent aggregate/export snapshots | S3-F08-T10 |
| S3-F08-AC10 | Instructor dashboard/export UI uses real data with loading/empty/error/session safety and persisted cross-feature evidence | S3-F08-T11, S3-F08-T12 |

## 6. STS — PLANNED / NOT RUN

Fixtures include three teams, proposal NONE/DRAFT/APPROVED/REVISION_REQUESTED
variants, draft/published milestones, versioned submissions, draft/published
grades, late/UNKNOWN data and an unrelated course. Use a fixed injected clock.

| Test ID | Level | Inputs / preconditions | Expected result | AC |
| --- | --- | --- | --- | --- |
| S3-F08-T01 | I | Read populated and empty selected course, including >one UI page of records | Correct full-course totals/as-of; no page truncation or foreign rows | S3-F08-AC01 |
| S3-F08-T02 | U+I | Each proposal status plus missing proposal and other-course teams | Exclusive counts sum to selected total; NONE is explicit | S3-F08-AC02 |
| S3-F08-T03 | U+I | 1 of 3 submitted, repeated versions, draft milestones, zero teams | 33.33 with 1/3; no double count/draft denominator; 0/0 gives null | S3-F08-AC03 |
| S3-F08-T04 | I | Draft grade, v1 published then v2 current, current grade 0, late/UNKNOWN snapshots | Correct ungraded queue; current published 0 counts graded; late/unknown separate | S3-F08-AC04 |
| S3-F08-T05 | U+I | Missing work now=due / due+1ms; revision and late reasons overlap | Not overdue at equality; overdue after; unique team/reason set and correct provenance | S3-F08-AC05 |
| S3-F08-T06 | I | Anonymous and student JSON/CSV requests, missing/invalid course; inspect DTOs | 401/403/404/400; no private data, peer fields or credentials; failures JSON not CSV/HTML | S3-F08-AC06 |
| S3-F08-T07 | U+I | Thai names, commas/quotes/CRLF, published/draft/old grades, score 0 | UTF-8 BOM, correct header/order/quoted parse; published current grade only; empty differs from 0 | S3-F08-AC07 |
| S3-F08-T08 | I | No teams, teams/no published milestones, missing submissions, >one data page | Header-only / one team row / correct cross-product; all rows included deterministically | S3-F08-AC07 |
| S3-F08-T09 | U+I+M | Text starts =,+,-,@, full-width forms, whitespace/control then formula; separator/quote payload; actual named spreadsheet import | Guarded quoted text, no escaped new formula cell, DB unchanged; manual consumer result retained, not assumed | S3-F08-AC08 |
| S3-F08-T10 | I | Barrier-controlled current-version update and grade publish during read/export | One coherent valid snapshot; never old grade attached to new content or partial counts | S3-F08-AC09 |
| S3-F08-T11 | UI | Loading/empty/failed fetch, delayed export, logout/identity switch | Real data only; clear error/retry, no duplicate action or stale private render/download | S3-F08-AC10 |
| S3-F08-T12 | E | Integrated F-03→F-05→F-06 data and instructor analytics/export; student direct denial | Display/export reconciles with saved fixtures after reload; access enforced backend | S3-F08-AC10 |

Planned files: U `server/tests/analytics-export.unit.test.ts`; I
`server/tests/analytics-export.integration.test.ts`; UI
`client/src/features/analytics/AnalyticsDashboard.test.tsx`; E
`e2e/sprint3-analytics.spec.ts`; M records named spreadsheet version/date and
actual import outcome. No such test/measurement is executed by this draft.

## 7. DoD / checkpoint / history

Full F-08 contracts/AC/STS are required at 29 Nov; this document does not
satisfy the separate implemented Sprint 3 workflow requirement by itself.
#102 tracks implementation and all remaining AC (proposed target 7 Dec).
Final acceptance requires all AC/shared DoD, real fixture reconciliation,
negative backend tests, safe actual CSV, independent review/CI and accepted
final release. Exact remaining work must be in the finish plan by 13 Dec.

| Revision | Date / status |
| --- | --- |
| S3-F08 v1.0 | 22 Nov 2026; complete proposed metric/CSV contract, review pending; implementation/tests NOT RUN |
