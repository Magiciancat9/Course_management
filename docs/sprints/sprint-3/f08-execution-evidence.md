# F-08 instructor analytics and CSV grade export - implementation and actual execution (#102)

**Date:** 26 November 2026, Asia/Bangkok. **Driver:** martinvadre.
**Independent code reviewer:** Magiciancat9, pending. This is candidate execution
on `feat/102-f08-analytics-export`, not reviewed integration, accepted main,
deployment or personal student UAT. The unchanged complete
[F-08 contract/AC/STS](f08-analytics-export.md) and shared DD-S3-03/04 were
independently reviewed in PR #107 before implementation.

## 1. Source, genuine RED and GREEN

| Boundary | Exact source / actual result |
| --- | --- |
| Reviewed starting baseline | `dd9d85ac9f0f6b21f9503c1031173992fb69ce35` (PR #123 merged to `main`, fast-forward descendant of `sprint-3-staging` `c35714dc7e9d7ca4e88ae5ab1d65fd3a8707c312` with S1/Lab 7, accepted S2 `v1.1.0-sprint2`, and reviewed F-07 tasks + peer evaluation) |
| Test-only RED | `1950b765defd62464206e67613e13cce4fc25823`; [CI 45762211090](https://github.com/Magiciancat9/Course_management/actions/runs/45762211090): 192 existing server tests PASS, 10 new F-08 API/PostgreSQL tests (`S3-F08-T01`–`T10`) FAIL on missing `/api/courses/:courseId/analytics` and `/api/courses/:courseId/gradebook.csv` routes. Genuine behavioral RED, not compiler/setup failure |
| First runtime GREEN | `fa5e3f107d59644395e03ac3f8309a488b955164`; [CI 45763416780](https://github.com/Magiciancat9/Course_management/actions/runs/45763416780), 26 Nov 12:43:14–12:46:09 Asia/Bangkok (05:43:14–05:46:09 UTC), `workflow_dispatch` at that exact commit: **207 server / 70 client / 10 browser PASS**; all six migrations, production builds and Docker PASS |
| CI system measurement | Same exact runtime `fa5e3f107d59644395e03ac3f8309a488b955164`; `D2-SYS-T01` **1167.01ms <= 10,000ms PASS**, at `05:46:02.212840 UTC`; image `sha256:0c498bb1cc61cdecf8a29c902246917e42c219994bc1cd2ad57ee578c11a57c9` ([Artifact 15090598041](https://github.com/Magiciancat9/Course_management/actions/runs/45763416780/artifacts/15090598041)), health source/DB readiness/HTML PASS. CI container measurement, not Cloud Run cold-start timing |

Local execution used Node, PostgreSQL on `localhost:5432`, dedicated disposable
`course_pms_test`, and explicit test-only JWT configuration. Destructive
seed/reset guards remain unchanged; no existing developer/preview/production
DB was reset. F-08 is a read-only projection over integrated F-03..F-07 tables
and adds no schema migration or dependency/lockfile changes.

Commands actually executed:

```text
DATABASE_URL="postgresql://martin@localhost:5432/course_pms_test?schema=public" npm --prefix server run prisma:migrate:deploy
npx --prefix server prisma generate --schema server/prisma/schema.prisma
DATABASE_URL="postgresql://martin@localhost:5432/course_pms_test?schema=public" JWT_SECRET=local-test-secret npm --prefix server test
NODE_OPTIONS='--no-experimental-webstorage' npm --prefix client test
npm --prefix server run build
npm --prefix client run build
```

All evidence is AI-agent-operated automated synthetic execution. No manual
student UAT, GCP F-08 deployment or final release acceptance is inferred.

## 2. Implemented scope, snapshot coherence and CSV safety

- **Routes (`server/src/routes/analytics.ts`):**
  - `GET /api/courses/:courseId/analytics` (Instructor-only JSON snapshot, `Cache-Control: no-store`).
  - `GET /api/courses/:courseId/gradebook.csv` (Instructor-only `text/csv; charset=utf-8` attachment, `Cache-Control: no-store`).
  - Rejects anonymous requests with `401` JSON and student requests with `403 INSTRUCTOR_ROLE_REQUIRED` JSON before checking course existence. Invalid `courseId` or unknown query parameters return `400 VALIDATION_ERROR` JSON; nonexistent course returns `404 COURSE_NOT_FOUND` JSON (never CSV/HTML on error).
- **Coherent snapshot & concurrency (`server/src/services/analyticsService.ts`):**
  - Executes inside a `RepeatableRead` PostgreSQL transaction with `SELECT ... FOR SHARE` on the course's `Course`, `Milestone`, and `MilestoneSubmission` rows and bounded retry on serialization conflict (`40001` / `P2034`).
  - Prevents mixed-version grades or partial aggregates during concurrent submission updates or grade publications (`S3-F08-T10`).
  - Excludes `PeerEvaluation` and user credentials at query level (`select`); no automatic peer-to-grade adjustment.
- **Aggregation rules (`DD-S3-03`):**
  - `totalTeams` counts all registered `ProjectTeam` rows in the course.
  - `proposalStates` partitions `totalTeams` into mutually exclusive `NONE`, `DRAFT`, `SUBMITTED`, `APPROVED`, and `REVISION_REQUESTED`.
  - `milestoneProgress` includes only `PUBLISHED` milestones (`DRAFT` excluded), counting each team with a current logical submission once (`submittedTeams / totalTeams`), rounded to 2 decimal places (`completionRatePct: null` when `totalTeams === 0`), and separating `ON_TIME`, `LATE`, and legacy `UNKNOWN` counts.
  - `ungraded` includes only current submitted content versions without a `GradePublication` for that same version (`submissionVersion === submission.version`); unpublished drafts and superseded v1 published grades do not count as graded, while a current-version published score `0` counts as graded.
  - `flaggedTeams` lists unique teams ordered by `teamId ASC` with combined unique reasons (`REVISION_REQUESTED`, `OVERDUE_MISSING_SUBMISSION` when `now > dueDate` and no current submission, and `LATE_SUBMISSION` from the current version's captured `lateStatus`). Exact deadline equality (`now === dueDate`) is not overdue; `+1ms` is overdue.
- **CSV gradebook & formula neutralization (`server/src/services/gradebookExport.ts`, `DD-S3-04`):**
  - Emits UTF-8 BOM (`\uFEFF`), `CRLF` (`\r\n`) records, and quotes every header and data cell (`"..."`), doubling embedded quotes (`""`).
  - 14 columns in exact contract order: `courseCode,teamId,teamName,proposalStatus,milestoneId,milestoneTitle,dueDateUtc,weightPercent,submissionId,submissionVersion,submittedAtUtc,lateStatus,publishedScore,publishedAtUtc`.
  - Emits header-only when `totalTeams === 0`; one row per team with empty milestone/submission/grade cells when `publishedMilestones.length === 0`; full `team × publishedMilestone` cross-product ordered by `teamId ASC, dueDate ASC, milestoneId ASC`. Legitimate published score `0` is exported as `"0"`, distinct from missing grade `""`.
  - Untrusted text fields (`courseCode`, `teamName`, `milestoneTitle`) with leading formula-risk characters after leading whitespace/control-character trim and Unicode NFKC normalization (`=`, `+`, `-`, `@`, full-width `＝`, `＋`, `－`, `＠`, or leading `\t`/`\r`/`\n`) are prefixed with `\t` inside the quoted cell without mutating stored database records.
- **Accessible UI & session safety (`client/src/features/analytics/AnalyticsDashboard.tsx`, `client/src/features/milestones/MilestoneManager.tsx`, `client/src/features/submissions/SubmissionWorkspace.tsx`, `client/src/App.tsx`):**
  - Shows loading without fabricated zeros, `Asia/Bangkok` snapshot timestamp, summary cards, proposal state distribution, focusable responsive tables (`tabIndex={0}`, `role="region"`, `aria-labelledby`), actionable workflow navigation buttons (`Open in Milestones`, `Grade submission`, `Inspect workflow`), error/retry, pending CSV export guard, raw-byte UTF-8 BOM preservation (`0xEF 0xBB 0xBF` via `arrayBuffer()`/`blob()`), post-`response.json()` stale-401 session-boundary recheck before `onUnauthorized`, and multi-course resource context handoff so `"Grade submission"` switches `MilestoneManager` to the selected course (resetting any previous course's milestone editing draft/state and aborting in-flight milestone mutations) and opens the targeted milestone and team submission in `GradingConsole`.

## 3. Final candidate AC mapping (all F-08 scope)

| AC | Actual executable check and result | Integration / release boundary |
| --- | --- | --- |
| S3-F08-AC01 | `analytics-export.integration.test.ts` `S3-F08-T01`: 55-team (>1 UI page) full-course snapshot, unrelated-course exclusion, empty-course snapshot, injected clock `generatedAt`, `Cache-Control: no-store`; PASS | Independently reviewed #124 at688e552; merged staging 14178f1; main/deployed acceptance pending |
| S3-F08-AC02 | `analytics-export.integration.test.ts` `S3-F08-T02`: mutually exclusive `NONE`/`DRAFT`/`SUBMITTED`/`APPROVED`/`REVISION_REQUESTED` summing to `totalTeams` and excluding other courses; PASS | Same F-08 boundary |
| S3-F08-AC03 | `analytics-export.integration.test.ts` `S3-F08-T03` + `analytics-export.unit.test.ts` `S3-F08-T03`: `1/3 -> 33.33%`, multi-version logical submission counted once, `DRAFT` milestones excluded, `0/0 -> null` rate; PASS | Same F-08 boundary |
| S3-F08-AC04 | `analytics-export.integration.test.ts` `S3-F08-T04`: ungraded queue ignores unpublished draft and superseded v1 published grade, counts current published score `0` as graded, separates `ON_TIME`/`LATE`/`UNKNOWN`; PASS | Same F-08 boundary |
| S3-F08-AC05 | `analytics-export.integration.test.ts` `S3-F08-T05` + `analytics-export.unit.test.ts` `S3-F08-T05`: exact `dueDate` equality not overdue, `+1ms` overdue, captured `lateStatus` preserved after schedule edit, unique team with combined reasons; PASS | Same F-08 boundary |
| S3-F08-AC06 | `analytics-export.integration.test.ts` `S3-F08-T06` + `analytics-export.unit.test.ts` `S3-F08-T06`: anonymous `401` and student `403` JSON on both analytics and CSV before course lookup, `400`/`404` JSON validation, zero peer/credential leakage; PASS | Same F-08 boundary |
| S3-F08-AC07 | `analytics-export.integration.test.ts` `S3-F08-T07`, `S3-F08-T08` + `analytics-export.unit.test.ts` `S3-F08-T07 / T08`: UTF-8 BOM, CRLF, quoted 14-column schema, Thai text, embedded commas/quotes/CRLF, header-only / no-published-milestone / 60-row cross-product, `"0"` vs `""`; PASS | Same F-08 boundary |
| S3-F08-AC08 | `analytics-export.integration.test.ts` `S3-F08-T09` + `analytics-export.unit.test.ts` `S3-F08-T07 / T09` + Python 3.14.7 `csv.reader(..., dialect='excel')` consumer import check: `\t` neutralization for ASCII/full-width/whitespace/control/breakout payloads and unchanged DB rows PASS; manual desktop GUI Excel/LibreOffice import not claimed from headless CLI | Same F-08 boundary; manual desktop GUI spreadsheet check noted explicitly |
| S3-F08-AC09 | `analytics-export.integration.test.ts` `S3-F08-T10`: barrier-controlled concurrent v1->v2 submission update with observed `pg_stat_activity` lock waiters yields coherent v2 ungraded snapshot in both analytics and CSV, never attaching v1's published grade to v2; PASS | Same F-08 boundary |
| S3-F08-AC10 | `AnalyticsDashboard.test.tsx` `S3-F08-T11` (9 component/integration cases: loading/populated/navigation with resource target, empty `0/0` null rate, error/retry, pending CSV export duplicate guard, session/role switch abort isolation, `401` delegation, delayed CSV `401` error-body identity-switch isolation, downloaded `Blob` leading UTF-8 BOM bytes `EF BB BF`, and multi-course `<App />` `"Grade submission"` handoff to Course B's `GradingConsole`) + `e2e/sprint3-analytics.spec.ts` `S3-F08-T12` real browser/API/DB workflow (including downloaded file `EF BB BF` byte verification and `"Grade submission"` navigation); PASS | Same F-08 boundary |

Actual source files:

- [API/PostgreSQL tests](../../../server/tests/analytics-export.integration.test.ts)
- [Unit boundary tests](../../../server/tests/analytics-export.unit.test.ts)
- [UI state/session tests](../../../client/src/features/analytics/AnalyticsDashboard.test.tsx)
- [Real browser/API workflow](../../../e2e/sprint3-analytics.spec.ts)
- [Analytics service](../../../server/src/services/analyticsService.ts),
  [CSV export service](../../../server/src/services/gradebookExport.ts),
  [routes](../../../server/src/routes/analytics.ts),
  [UI](../../../client/src/features/analytics/AnalyticsDashboard.tsx).

## 4. Selected evidence and remaining gates

- [Runtime browser artifact 15091032015](https://github.com/Magiciancat9/Course_management/actions/runs/45763416780/artifacts/15091032015)
  retains `f08-analytics-dashboard.png` alongside `f07-task-checkpoint.png`,
  `f07-peer-outgoing.png`, and `f07-peer-instructor.png`.
- [Startup artifact 15090598041](https://github.com/Magiciancat9/Course_management/actions/runs/45763416780/artifacts/15090598041)
  retains `D2-SYS-T01` (`1167.01ms <= 10,000ms PASS`).
- Named CSV consumer check (`S3-F08-T09` `M`): executed with Python `3.14.7`
  standard library `csv.reader(..., dialect='excel')` (and SQLite `3.53.1`
  available on host) on 26 Nov 2026 against UTF-8 BOM + CRLF exported rows
  containing `=CMD|' /C calc'!A0`, `＠FullwidthAtMilestone`, Thai text with
  embedded comma/double-quotes/CRLF, published score `"0"`, and empty grade
  `""`; confirmed 3 rows × 14 columns parsed with leading `\t` preserved and
  zero column shifting. Manual desktop GUI Excel/LibreOffice Calc opening is
  not claimed from headless CLI execution.
- **Independent approval/integration26 Nov:** Magiciancat9 approved head
  `688e5523f797fc19c6b4fed3303ea38d2fd16e0b` with AI assistance after four
  findings/fixes and six independent reviewer regressions;
  [review](https://github.com/Magiciancat9/Course_management/pull/124#pullrequestreview-3474967312).
  #124 merged20:49:32 Asia/Bangkok to staging
  `14178f162e037a4bee8f2ec85c57bdc726e8fa58`.
- **Exact approved-head CI:** [45830829000](https://github.com/Magiciancat9/Course_management/actions/runs/45830829000)
  PASS207 server/74 client/10 browser, six migrations/builds/Docker,
  startup 1116.61 ms/source/DB/HTML. Tested merge ref
  `bd2bdb876951bbc16155b2e1cb942f7e69e1ef0d` differs from head/staging merge.
- Remaining: martinvadre owns reviewed main promotion, exact-source
  deployment/live instructor analytics/CSV/current-version handoff and backend
  anonymous/student denials, plus named/versioned desktop spreadsheet GUI
  import evidence by 7 Dec. This documentation audit performs none of those
  checks and never attributes staging results to deployed main dd9d85a.
