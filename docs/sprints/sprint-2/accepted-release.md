# Sprint 2 reviewed release ledger - D2-05 / #97

**25 Nov #97 acceptance completed:** #119 was independently approved and
merged to main `07ffd8f31c3d61d8d13d5217a1fde39628c6649a`; after initial main
deployment 45592525515, `martinvadre` privately configured synthetic
`SMOKE_EMAIL` (variable) and `SMOKE_PASSWORD` (secret) in GitHub environment
`demo` (resolving TD-01), ran normal deployment
[45645149796](https://github.com/Magiciancat9/Course_management/actions/runs/45645149796)
with all public and authenticated smoke checks (`login`, `/api/auth/me`,
`/api/courses`, `logout`) passing on revision `course-pms-00014-28n`, and
preserved `07ffd8f31c3d61d8d13d5217a1fde39628c6649a` with immutable annotated
tag `v1.1.0-sprint2` before Sprint 3 main promotion.

**Prepared:** 25 November 2026, Asia/Bangkok. Driver: Magiciancat9;
independent release reviewer/verifier: martinvadre.
**Decision:** ACCEPTED Sprint 2 main release (`v1.1.0-sprint2` -> `07ffd8f31c3d61d8d13d5217a1fde39628c6649a`).
No planned Sprint 2 feature is deferred to Sprint 3.
Reviewable main promotion: [PR #119](https://github.com/Magiciancat9/Course_management/pull/119).

## 1. Source and independent review

| Scope | Reviewed source / accepted staging identity | Evidence |
| --- | --- | --- |
| Contract before implementation | `8eea6f0` | [PR #107](https://github.com/Magiciancat9/Course_management/pull/107) |
| F-04 milestones | head `62c78847`; staging merge `1b2f487c2c83103055fa3017e3a353befa2eba3f` | [PR #116](https://github.com/Magiciancat9/Course_management/pull/116), [CI 45562339654](https://github.com/Magiciancat9/Course_management/actions/runs/45562339654): 54 server / 26 client / 4 browser PASS |
| F-05 submissions | head `b013cde58`; staging merge `88fb036be3c8edc8cf3613be87b2074b3fd546c9` | [PR #117](https://github.com/Magiciancat9/Course_management/pull/117), [CI 45566259505](https://github.com/Magiciancat9/Course_management/actions/runs/45566259505): 80 server / 36 client / 5 browser PASS |
| F-06 grading | head `31eadb7c7785c57722becbc76080b79ff0ad3685`; staging merge `11ff1a449d8d19721aa1e4ca9cc473d7fb6e6dd2` | [PR #118](https://github.com/Magiciancat9/Course_management/pull/118), [CI 45584765161](https://github.com/Magiciancat9/Course_management/actions/runs/45584765161): 93 server / 41 client / 6 browser PASS |
| Maintained Sprint 1 / Lab 7 | main `b92b4349fb6c203d3f39ef966a89661a2959569e` | [Lab 7 readiness/history](../../labs/lab-07/readiness-and-retrospective.md); revision20/approval10 retained |
| Current integration | branch `release/97-sprint2-acceptance`, based on the above staging merge and merged maintained main | [Main promotion PR #119](https://github.com/Magiciancat9/Course_management/pull/119); exact combined CI source/run recorded below; no acceptance inferred from branch existence |

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
| S2-F04-AC01 | Instructor creates a version-1 draft persisted and retrievable by a later request | S2-F04-T01; [API](../../../server/tests/milestones.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F04-AC02 | Invalid text/weight/date/type/unknown fields reject without a row or mutation | S2-F04-T02, S2-F04-T03; [API](../../../server/tests/milestones.integration.test.ts), [unit](../../../server/tests/milestones.unit.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F04-AC03 | Draft publishes only with a strictly future due date; resulting status/time/version persist | S2-F04-T04; [API](../../../server/tests/milestones.integration.test.ts), [unit](../../../server/tests/milestones.unit.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F04-AC04 | Instructor edits draft/published fields with expected version; past/future corrections preserve historical submission snapshots | S2-F04-T05, S2-F04-T06; [API](../../../server/tests/milestones.integration.test.ts), [unit](../../../server/tests/milestones.unit.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F04-AC05 | Anonymous access is 401; students cannot mutate, discover drafts or bypass server authorization | S2-F04-T07; [API](../../../server/tests/milestones.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F04-AC06 | Concurrent stale edit/publish cannot overwrite newer state or publish twice | S2-F04-T08; [API](../../../server/tests/milestones.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F04-AC07 | Lists are course-scoped, published-only for students, deterministic/paginated; empty is not an error | S2-F04-T09; [API](../../../server/tests/milestones.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F04-AC08 | UI create/edit/publish and student readback honor pending/error/empty/conflict states | S2-F04-T10, S2-F04-T11; [API](../../../server/tests/milestones.integration.test.ts), [component](../../../client/src/features/milestones/MilestoneManager.test.tsx), [browser](../../../e2e/sprint2-milestones.spec.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F05-AC01 | Eligible own-team student creates one saved version and reads it on a later request/reload | S2-F05-T01, S2-F05-T11; [API](../../../server/tests/submissions.integration.test.ts), [browser](../../../e2e/sprint2-submissions.spec.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F05-AC02 | Non-APPROVED proposal cannot submit; rejection leaves all saved state unchanged | S2-F05-T02; [API](../../../server/tests/submissions.integration.test.ts), [unit](../../../server/tests/submissions.unit.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F05-AC03 | Only a published same-course milestone can receive the submission | S2-F05-T03; [API](../../../server/tests/submissions.integration.test.ts), [unit](../../../server/tests/submissions.unit.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F05-AC04 | Required URLs/tag and all type/length/extra-field rules are enforced server-side | S2-F05-T04; [API](../../../server/tests/submissions.integration.test.ts), [unit](../../../server/tests/submissions.unit.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F05-AC05 | Deadline equality is on time; after-deadline submission succeeds with LATE; client cannot forge timestamps/flag | S2-F05-T05; [API](../../../server/tests/submissions.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F05-AC06 | Updates create immutable versions; prior content/grades remain historical and the new version is ungraded | S2-F05-T06; [API](../../../server/tests/submissions.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F05-AC07 | Anonymous, instructor-write and foreign-team access are denied without data leakage/mutation | S2-F05-T07; [API](../../../server/tests/submissions.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F05-AC08 | Concurrent/retried stale writes cannot create duplicate logical rows or overwrite versions | S2-F05-T08; [API](../../../server/tests/submissions.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F05-AC09 | Historical deadline snapshots and legacy unknowns stay honest during migration/deadline edits | S2-F05-T09; [API](../../../server/tests/submissions.integration.test.ts), [SQL migration](../../../server/tests/submissions-migration.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F05-AC10 | UI pending/error/conflict/session boundaries preserve own draft and prevent foreign/stale state exposure | S2-F05-T10, S2-F05-T12; [API](../../../server/tests/submissions.integration.test.ts), [component](../../../client/src/features/submissions/SubmissionWorkspace.test.tsx) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F06-AC01 | Instructor saves a valid draft evaluation of actual current submitted content and retrieves it | S2-F06-T01; [API](../../../server/tests/grading.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F06-AC02 | Score 0/100 accepted; out-of-range/fraction/string/null rejected without mutation | S2-F06-T02; [API](../../../server/tests/grading.integration.test.ts), [unit](../../../server/tests/grading.unit.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F06-AC03 | Feedback trim/type/length and unknown-field checks are enforced independently of UI | S2-F06-T03; [API](../../../server/tests/grading.integration.test.ts), [unit](../../../server/tests/grading.unit.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F06-AC04 | Explicit publication persists correct version, score, feedback, actor and time; duplicate publication is not duplicated | S2-F06-T04; [API](../../../server/tests/grading.integration.test.ts), [unit](../../../server/tests/grading.unit.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F06-AC05 | Students see only their team's published data, never a draft or foreign grade; student writes and anonymous access denied | S2-F06-T05; [API](../../../server/tests/grading.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F06-AC06 | A correction draft preserves the previous publication until republished; immutable history remains inspectable | S2-F06-T06; [API](../../../server/tests/grading.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F06-AC07 | A new content version is ungraded and stale/concurrent publication cannot grade the wrong work | S2-F06-T07, S2-F06-T08; [API](../../../server/tests/grading.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F06-AC08 | UI draft/publish/error/conflict states prevent duplicate actions and false publication | S2-F06-T09; [API](../../../server/tests/grading.integration.test.ts), [component](../../../client/src/features/grading/GradingConsole.test.tsx) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |
| S2-F06-AC09 | End-to-end instructor publication and authorized student reload reflect actual persisted current-version grade | S2-F06-T10, S2-F06-T11; [API](../../../server/tests/grading.integration.test.ts), [browser](../../../e2e/sprint2-grading.spec.ts), [SQL migration](../../../server/tests/grading-migration.integration.test.ts) | Feature + combined PASS; accepted main/tag/authenticated release recorded in section5 |

F-05 AC06's formerly pending F-06 handoff is now covered by F-06 T06/T07/T08:
immutable prior publications survive a new content version; the current
version is ungraded, and stale grading cannot attach to different content.
F-04 pagination/course-switch and F-06 unsaved/stale-evaluation review fixes
remain covered by their component regression tests.

## 3. Combined regression and populated upgrade

**Combined runtime source:** `b19f014aba69ee558b0366791ddb11979d73dc0d`.
[CI 45587893951](https://github.com/Magiciancat9/Course_management/actions/runs/45587893951)
**PASS**, 25 Nov 2026, 09:42:10-09:44:31 UTC (16:42:10-16:44:31 Asia/Bangkok).
Codex-operated GitHub Actions Ubuntu/Node20/PostgreSQL16 synthetic environment:

| Check | Actual result |
| --- | --- |
| Actual fresh `prisma migrate deploy` | All four migration files applied |
| Backend unit/API/real PostgreSQL | 15 files / 163 tests PASS (includes Lab 7 and D2-CONT-05/06) |
| Client component/session/privacy/UI | 9 files / 45 tests PASS |
| Real browser/API/DB workflows | 7 Playwright tests PASS, including maintained Lab 7 and F-04/F-05/F-06 |
| Production server/client + Docker | PASS |
| Existing deployment stub/smoke checks | PASS; stubbed authenticated checks are not live checks |
| Program evidence | [Artifact 15008858335](https://github.com/Magiciancat9/Course_management/actions/runs/45587893951/artifacts/15008858335), both synthetic screenshots inspected |

The subsequent container timing/readiness instrumentation has its own current
exact-head CI and retained measurement JSON in [PR #119 checks/results](https://github.com/Magiciancat9/Course_management/pull/119).
The source/run above does not claim a startup measurement it did not perform.
A later source change requires its own affected/full required checks; green
feature-head runs are not substitutes for combined verification.

Commands: `npm ci`, server/client `npm ci`, server `prisma:migrate:deploy`,
`prisma generate`, `npm run test:server`, `npm run test:client`,
`npm run test:e2e`, `npm run build`, and `docker build` via CI.
CI uses PostgreSQL 16 and a disposable `course_pms_test` database, not Cloud SQL.
D2-SYS-T01 measures before container start to valid health within 10 seconds,
then checks the baked source SHA, PostgreSQL readiness and built HTML. The
CI artifact `sprint2-startup-<tested SHA>` retains its UTC/host/image/elapsed JSON.
This measures the CI image, not Cloud Run cold-start latency.

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

These are Codex-operated synthetic automated CI demonstrations, not personal
student execution or live deployment evidence. Download
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

After recording the accepted full main SHA, the maintainer can preserve it
with the following PowerShell commands. Replace the placeholder from the
verified main deployment; an unreviewed branch head is not an accepted SHA.

```powershell
$acceptedSprint2Sha = '<verified full accepted main SHA>'
if ($acceptedSprint2Sha -notmatch '^[0-9a-f]{40}$') { throw 'Expected full accepted SHA' }
git fetch origin main --tags
git merge-base --is-ancestor $acceptedSprint2Sha origin/main
if ($LASTEXITCODE -ne 0) { throw 'Accepted SHA is not on main' }
# Stop if the name already exists; inspect its target instead of replacing it.
if (git tag --list v1.1.0-sprint2) { throw 'Tag exists: verify it; never move it' }
git tag -a v1.1.0-sprint2 $acceptedSprint2Sha -m 'Accepted reviewed complete Sprint 2; issue #97'
git push origin refs/tags/v1.1.0-sprint2
git rev-parse 'v1.1.0-sprint2^{commit}'
```

**External gate resolved25 Nov:** demo SMOKE_EMAIL variable and
SMOKE_PASSWORD secret were privately configured; actual authenticated smoke
passed45645149796. The earlier missing configuration/SKIP is historical.
The tag-creation commands above describe the original acceptance procedure;
the tag already exists and must not be recreated or moved.

| Accepted identity | Current recorded value |
| --- | --- |
| Independent integration review | martinvadre APPROVED exact head `2b8e23973389784255d3bdc9d65b7f69d5c64f87` in #119 before main merge |
| Reviewed main SHA / main CI | `07ffd8f31c3d61d8d13d5217a1fde39628c6649a` / initial run [45592525515](https://github.com/Magiciancat9/Course_management/actions/runs/45592525515) PASS; full authenticated acceptance run [45645149796](https://github.com/Magiciancat9/Course_management/actions/runs/45645149796) PASS (163 server / 45 client / 7 browser, D2-SYS-T01 306.2ms, artifact 15037196864) |
| Deployment / digest / migration / revision | Run 45645149796 (25 Nov 22:26:16–22:30:25 Asia/Bangkok): digest `asia-southeast1-docker.pkg.dev/cpe334-kingnine/course-pms/course-pms@sha256:ebe8b4a5d06e088b302afd9a61ceefed27bd2cfd4ac2a6ae239874f6d8069591`, migration job `course-pms-migrate-r86x2` SUCCESS, revision `course-pms-00014-28n` at 100% traffic |
| Authenticated post-deploy smoke | **PASS** in run 45645149796 (`PASS /api/health`, `PASS /api/ready`, `PASS /`, `PASS login, authenticated /api/auth/me, and /api/courses`, `PASS logout`) after privately configuring `SMOKE_EMAIL` variable and `SMOKE_PASSWORD` secret in `demo` (TD-01 resolved) |
| Immutable `v1.1.0-sprint2` target | Created and pushed before Sprint 3 main promotion: `git rev-parse 'v1.1.0-sprint2^{commit}'` -> `07ffd8f31c3d61d8d13d5217a1fde39628c6649a` ([issue #97 record](https://github.com/Magiciancat9/Course_management/issues/97#issuecomment-7166980735)) |

All technical acceptance and immutable tag gates for #97 are recorded. Issue #93
and the combined Sprint 1/2/3 RC (#103) and PDF (#104) proceed on top of this
frozen Sprint 2 baseline.
