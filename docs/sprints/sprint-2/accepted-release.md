# Sprint 2 reviewed release ledger - D2-05 / #97

**Prepared:** 25 November 2026, Asia/Bangkok. Driver: Magiciancat9;
required independent release reviewer: martinvadre.
**Decision:** integration candidate, NOT YET an accepted main release.
No planned Sprint 2 feature is deferred to Sprint 3.

## 1. Source and independent review

| Scope | Reviewed source / accepted staging identity | Evidence |
| --- | --- | --- |
| Contract before implementation | `8eea6f0` | [PR #107](https://github.com/Magiciancat9/Course_management/pull/107) |
| F-04 milestones | head `62c78847`; staging merge `1b2f487c2c83103055fa3017e3a353befa2eba3f` | [PR #116](https://github.com/Magiciancat9/Course_management/pull/116), [CI 45562339654](https://github.com/Magiciancat9/Course_management/actions/runs/45562339654): 54 server / 26 client / 4 browser PASS |
| F-05 submissions | head `b013cde58`; staging merge `88fb036be3c8edc8cf3613be87b2074b3fd546c9` | [PR #117](https://github.com/Magiciancat9/Course_management/pull/117), [CI 45566259505](https://github.com/Magiciancat9/Course_management/actions/runs/45566259505): 80 server / 36 client / 5 browser PASS |
| F-06 grading | head `31eadb7c7785c57722becbc76080b79ff0ad3685`; staging merge `11ff1a449d8d19721aa1e4ca9cc473d7fb6e6dd2` | [PR #118](https://github.com/Magiciancat9/Course_management/pull/118), [CI 45584765161](https://github.com/Magiciancat9/Course_management/actions/runs/45584765161): 93 server / 41 client / 6 browser PASS |
| Maintained Sprint 1 / Lab 7 | main `b92b4349fb6c203d3f39ef966a89661a2959569e` | [Lab 7 readiness/history](../../labs/lab-07/readiness-and-retrospective.md); revision20/approval10 retained |
| Current integration | branch `release/97-sprint2-acceptance`, based on the above staging merge and merged maintained main | Exact combined CI source/run recorded below; no acceptance inferred from branch existence |

The refreshed UI is retained from reviewed staging (PR #110). The integration
resolves the old/new layout conflict by keeping the refreshed component and
applying Lab 7 guidance to its actual instructor review form. It does not
insert the old instructor form into the student's proposal editor.

Feature-level RED/GREEN history remains in the feature contracts/execution
records and the linked PRs. Combined regression below is new verification;
it is separate from the historical 124-test Lab 7 run.

## 2. All Sprint 2 acceptance criteria

Every row is implemented and passed its reviewed feature-head run above.
The final column identifies the release acceptance gate, not a feature gap.
Actual API cases are named with the listed S2 test IDs in the linked files.

| AC | Required behavior | Actual test IDs / files | Verification / release |
| --- | --- | --- | --- |
| S2-F04-AC01 | Instructor creates a version-1 draft persisted and retrievable by a later request | S2-F04-T01; [API](../../../server/tests/milestones.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F04-AC02 | Invalid text/weight/date/type/unknown fields reject without a row or mutation | S2-F04-T02, S2-F04-T03; [API](../../../server/tests/milestones.integration.test.ts), [unit](../../../server/tests/milestones.unit.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F04-AC03 | Draft publishes only with a strictly future due date; resulting status/time/version persist | S2-F04-T04; [API](../../../server/tests/milestones.integration.test.ts), [unit](../../../server/tests/milestones.unit.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F04-AC04 | Instructor edits draft/published fields with expected version; past/future corrections preserve historical submission snapshots | S2-F04-T05, S2-F04-T06; [API](../../../server/tests/milestones.integration.test.ts), [unit](../../../server/tests/milestones.unit.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F04-AC05 | Anonymous access is 401; students cannot mutate, discover drafts or bypass server authorization | S2-F04-T07; [API](../../../server/tests/milestones.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F04-AC06 | Concurrent stale edit/publish cannot overwrite newer state or publish twice | S2-F04-T08; [API](../../../server/tests/milestones.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F04-AC07 | Lists are course-scoped, published-only for students, deterministic/paginated; empty is not an error | S2-F04-T09; [API](../../../server/tests/milestones.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F04-AC08 | UI create/edit/publish and student readback honor pending/error/empty/conflict states | S2-F04-T10, S2-F04-T11; [API](../../../server/tests/milestones.integration.test.ts), [component](../../../client/src/features/milestones/MilestoneManager.test.tsx), [browser](../../../e2e/sprint2-milestones.spec.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F05-AC01 | Eligible own-team student creates one saved version and reads it on a later request/reload | S2-F05-T01, S2-F05-T11; [API](../../../server/tests/submissions.integration.test.ts), [browser](../../../e2e/sprint2-submissions.spec.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F05-AC02 | Non-APPROVED proposal cannot submit; rejection leaves all saved state unchanged | S2-F05-T02; [API](../../../server/tests/submissions.integration.test.ts), [unit](../../../server/tests/submissions.unit.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F05-AC03 | Only a published same-course milestone can receive the submission | S2-F05-T03; [API](../../../server/tests/submissions.integration.test.ts), [unit](../../../server/tests/submissions.unit.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F05-AC04 | Required URLs/tag and all type/length/extra-field rules are enforced server-side | S2-F05-T04; [API](../../../server/tests/submissions.integration.test.ts), [unit](../../../server/tests/submissions.unit.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F05-AC05 | Deadline equality is on time; after-deadline submission succeeds with LATE; client cannot forge timestamps/flag | S2-F05-T05; [API](../../../server/tests/submissions.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F05-AC06 | Updates create immutable versions; prior content/grades remain historical and the new version is ungraded | S2-F05-T06; [API](../../../server/tests/submissions.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F05-AC07 | Anonymous, instructor-write and foreign-team access are denied without data leakage/mutation | S2-F05-T07; [API](../../../server/tests/submissions.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F05-AC08 | Concurrent/retried stale writes cannot create duplicate logical rows or overwrite versions | S2-F05-T08; [API](../../../server/tests/submissions.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F05-AC09 | Historical deadline snapshots and legacy unknowns stay honest during migration/deadline edits | S2-F05-T09; [API](../../../server/tests/submissions.integration.test.ts), [SQL migration](../../../server/tests/submissions-migration.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F05-AC10 | UI pending/error/conflict/session boundaries preserve own draft and prevent foreign/stale state exposure | S2-F05-T10, S2-F05-T12; [API](../../../server/tests/submissions.integration.test.ts), [component](../../../client/src/features/submissions/SubmissionWorkspace.test.tsx) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F06-AC01 | Instructor saves a valid draft evaluation of actual current submitted content and retrieves it | S2-F06-T01; [API](../../../server/tests/grading.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F06-AC02 | Score 0/100 accepted; out-of-range/fraction/string/null rejected without mutation | S2-F06-T02; [API](../../../server/tests/grading.integration.test.ts), [unit](../../../server/tests/grading.unit.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F06-AC03 | Feedback trim/type/length and unknown-field checks are enforced independently of UI | S2-F06-T03; [API](../../../server/tests/grading.integration.test.ts), [unit](../../../server/tests/grading.unit.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F06-AC04 | Explicit publication persists correct version, score, feedback, actor and time; duplicate publication is not duplicated | S2-F06-T04; [API](../../../server/tests/grading.integration.test.ts), [unit](../../../server/tests/grading.unit.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F06-AC05 | Students see only their team's published data, never a draft or foreign grade; student writes and anonymous access denied | S2-F06-T05; [API](../../../server/tests/grading.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F06-AC06 | A correction draft preserves the previous publication until republished; immutable history remains inspectable | S2-F06-T06; [API](../../../server/tests/grading.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F06-AC07 | A new content version is ungraded and stale/concurrent publication cannot grade the wrong work | S2-F06-T07, S2-F06-T08; [API](../../../server/tests/grading.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F06-AC08 | UI draft/publish/error/conflict states prevent duplicate actions and false publication | S2-F06-T09; [API](../../../server/tests/grading.integration.test.ts), [component](../../../client/src/features/grading/GradingConsole.test.tsx) | Feature PASS; combined result below; main acceptance PENDING |
| S2-F06-AC09 | End-to-end instructor publication and authorized student reload reflect actual persisted current-version grade | S2-F06-T10, S2-F06-T11; [API](../../../server/tests/grading.integration.test.ts), [browser](../../../e2e/sprint2-grading.spec.ts), [SQL migration](../../../server/tests/grading-migration.integration.test.ts) | Feature PASS; combined result below; main acceptance PENDING |

F-05 AC06's formerly pending F-06 handoff is now covered by F-06 T06/T07/T08:
immutable prior publications survive a new content version; the current
version is ungraded, and stale grading cannot attach to different content.
F-04 pagination/course-switch and F-06 unsaved/stale-evaluation review fixes
remain covered by their component regression tests.

## 3. Combined regression and populated upgrade

**Combined candidate CI: PENDING.** Replace with actual full source SHA, run
URL and results after execution; a feature-head PASS is not a combined PASS.

Commands: `npm ci`, server/client `npm ci`, server `prisma:migrate:deploy`,
`prisma generate`, `npm run test:server`, `npm run test:client`,
`npm run test:e2e`, `npm run build`, and `docker build` via CI.
CI uses PostgreSQL 16 and a disposable `course_pms_test` database, not Cloud SQL.

- Sprint 1 original login/team/proposal/review/resubmit, persistence and backend
  denial cases rerun alongside all Sprint 2 suites and maintained Lab 7 tests.
- `sprint2-release-migration.integration.test.ts` (D2-CONT-05) inserts populated
  Sprint 1 users/team/member/proposal/revoked session/milestone/scored submission
  BEFORE applying actual F-04/F-05/F-06 SQL in one isolated transactional schema.
  Original values/IDs are retained; legacy milestone becomes DRAFT/version1
  with no publication time, historical lateness stays UNKNOWN, old grade is
  retained as legacy evidence and no evaluation/publication is invented.
  This is a real SQL migration check; it is not a production migration or
  an API test against the upgraded private schema.
- Existing F-05/F-06 migration cases check each populated feature boundary;
  normal API tests use the freshly migrated full schema and real PostgreSQL.
- D2-CONT-06 unifies the disposable-DB guard before every server/browser reset
  (Lab 7 TD-02). No production reset, seed or live mutation is part of CI.
- Integrated UI guidance and browser checks preserve revision20/approval10
  (Lab 7 TD-03). Historical limited RT-07 replay and skipped authenticated
  deployment smoke retain their original limitations.

## 4. Selected meaningful program evidence

CI retains `sprint2-program-<full source SHA>` for 90 days:

1. `f05-submission-v2.png`: approved owning team saves/reloads version 2 and
   history through the real browser/API/database workflow (F-05 T11/T12).
2. `f06-published-grade.png`: instructor saves a hidden draft, explicitly
   publishes, then the owning student reloads and sees persisted 91/100
   (F-06 T10). The same test directly verifies foreign-team denial.

These are synthetic CI demonstrations, not live deployment evidence. Download
artifacts outside public Git for the English assessed PDF, caption the exact
source/run and retain them before expiry. Credentials/tokens/PDFs stay out of Git.

## 5. Main acceptance and immutable release preservation

The release driver must not approve or merge their own PR. Required sequence:

1. martinvadre independently reviews this integration PR and exact-head full CI,
   then merges the complete Sprint 2 candidate into main after resolving findings.
2. Record the full resulting main SHA and passing main reusable CI/deployment
   run, container digest, migration result and Cloud Run revision. Verify health
   commitSha, ready DB and authenticated login/me/courses/logout on that release.
3. Preserve that exact accepted main commit with annotated tag `v1.1.0-sprint2`
   BEFORE adding Sprint 3. Confirm its target with `git rev-parse <tag>^{commit}`.
   Create/push this one tag only after acceptance; never move, force-push or
   reuse it for a later Sprint 3 commit. A branch name alone is insufficient.
4. Add a dated issue #97 acceptance record with main SHA, review/CI/deployment
   links, tag target and all gate results. The user handles issue closure.

**Current external gate (25 Nov):** environment `demo` has neither SMOKE_EMAIL
variable nor SMOKE_PASSWORD secret. Owner martinvadre must privately configure
a working synthetic account and run authenticated deployment smoke before
acceptance (existing Lab 7 TD-01). Public smoke SKIP is not PASS. No credential
values are requested in chat or committed. The deploy workflow already supports
these names; this PR does not rotate accounts or deploy unreviewed code.

| Accepted identity | Current recorded value |
| --- | --- |
| Independent integration review | PENDING |
| Accepted main SHA / main CI | PENDING |
| Deployment / digest / migration / revision | PENDING |
| Authenticated post-deploy smoke | PENDING; demo configuration missing |
| Immutable `v1.1.0-sprint2` target | NOT CREATED; reserved name only |

Issue #97 stays open until these gates are recorded. Issue #93 and the final
Sprint 2/3 RC/PDF keep their own remaining scope after Sprint 2 acceptance.
