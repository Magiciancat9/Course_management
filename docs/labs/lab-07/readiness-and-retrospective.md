# Lab 7 maintained-scope readiness and retrospective — L7-E11 / L7-07

**Assessment date:** 23 November 2026, Asia/Bangkok (UTC+07:00).

**Public-readback window:** `2026-11-23T07:40:24Z`–`07:41:21Z` (14:40:24–14:41:21 Asia/Bangkok); GitHub records checked in the same review session.

**Author/driver:** Tatchakorn Thamnimitr (`Magiciancat9`).

**Independent reviewer:** Pawarit Wongdaeng (`martinvadre`); review of this document is **PENDING**.

**Work:** [#91](https://github.com/Magiciancat9/Course_management/issues/91) · [Lab 7 board](https://github.com/users/Magiciancat9/projects/7).

## 1. Readiness decision and assessed scope

**READY for the maintained Sprint 1 functionality, including CR-L7-01**, on
the deployed release identified below. This is the author's technical
assessment for teammate review, based on passing release tests, recorded
changed/preserved-behavior checks, source continuity and fresh public readback.
The optional authenticated deployment smoke remains SKIPPED and has a named
follow-up; it is not counted as a passing check.

Scope is F-01 authentication/session/roles, F-02 team membership/capacity and
F-03 proposal drafting, submission and instructor review. The approved change
requires `REVISION_REQUESTED` feedback of at least **20** JavaScript UTF-16
code units after `trim()`; `APPROVED` remains at **10**. State precedence,
backend access control, atomic writes, historical feedback and session/privacy
protections remain part of the maintained scope.

Deliverable 2 F-04–F-08 and the separate UI refresh are outside this assessment.
The assessed Parts A–D PDF and submission are **NOT READY**: [#92](https://github.com/Magiciancat9/Course_management/issues/92)
remains open. Issue #91 stays open / **In review** after this draft is posted
until the teammate accepts and merges its PR; this document is not a recorded
peer approval or submission receipt.

## 2. Version and deployment identity

| Identity | Exact reference and evidence |
| --- | --- |
| Repository | [Magiciancat9/Course_management](https://github.com/Magiciancat9/Course_management) |
| Original Sprint 1 | `v1.0.0-sprint1` → `5979f5870e8e28277996dc3045cbf4be5f7236ad` |
| Accepted Lab 6 reference | `aeb804ea5bc667399b00cf54df10046a6ded46e0`, PR #76; accepted serving revision `course-pms-00009-mk2` |
| Actual pre-change checkpoint | `lab7-pre-change-20261122` → `dfe5d25ec8934161d3ece5726d7611d64c044c52`; [L7-E02](pre-change-baseline.md) |
| Reviewed maintenance release | [PR #113](https://github.com/Magiciancat9/Course_management/pull/113) → `80c9a88d65f098e42bfecfbc538de4a5ff89ea94`; recorded changed/preserved live checks on `course-pms-00010-47x` |
| Current deployed main snapshot | [PR #114](https://github.com/Magiciancat9/Course_management/pull/114) → `d16e7a773334fb90b8dfc11301385d966fb0e1c7`; merged 23 Nov at 00:23:12 Asia/Bangkok (`2026-11-22T17:23:12Z`) |
| Current deployment | [Run 45049155638](https://github.com/Magiciancat9/Course_management/actions/runs/45049155638), **SUCCESS**, completed 23 Nov 00:27:07 Asia/Bangkok (`2026-11-22T17:27:07Z`) |
| Cloud Run revision / traffic | `course-pms-00011-dtc`; the deployment log reports **100%** traffic at `2026-11-22T17:27:00Z`. This is workflow evidence, not a newly captured owner-console screenshot |
| Container digest | `asia-southeast1-docker.pkg.dev/cpe334-kingnine/course-pms/course-pms@sha256:1ce025058af8c75a9f69478605c8980deae9822e45db5314d609672245e9c2e8` |
| Migration execution | `course-pms-migrate-z8hkc`, successfully completed in the same deploy run; the Lab 7 rule change itself requires no schema/data migration |
| Public URL | [CoursePMS](https://course-pms-859617270560.asia-southeast1.run.app/) |

`git diff --name-status 80c9a88 d16e7a7` contains only the added
`docs/labs/lab-07/metrics-and-action.md`. Application code, tests, dependencies,
schema, container definition and deployment scripts are unchanged. The new
image/commit/revision identities still differ and are recorded separately.

The six authenticated business-check groups below were executed on `80c9a88` /
`00010-47x`; they were **not rerun on `d16e7a7` / `00011-dtc` in this task**.
The readiness judgment uses that explicit source-continuity check, the new
release's full CI/public smoke and fresh read-only checks. Any subsequent
runtime change requires affected business checks again.

## 3. Release readiness checklist

| Check | Recorded result and basis | Outstanding owner/action |
| --- | --- | --- |
| TA approval and contract before implementation | **PASS:** P'Tik approved 22 Nov 20:18 Asia/Bangkok; pre-change source recorded; `martinvadre` reviewed contract source `947b914` at 21:22:38 before test/code changes. [Approval](approval-record.md), [contract](revised-contract.md), [PR #105](https://github.com/Magiciancat9/Course_management/pull/105) | Preserve screenshot, provenance, review and exact sequence in #92; `Magiciancat9` |
| Genuine test-first behavior change | **PASS:** test-only `6281634` on old behavior produced 3 expected failures / 32 passes; the unchanged 35-case test passed after implementation `7aae232`. [L7-E05–E08](implementation-evidence.md) | Historical expected RED failures are not current release defects |
| Current automated application tests | **PASS:** on `d16e7a7`, `npm run test:server`: 100/100; `npm run test:client`: 20/20; `npm run test:e2e`: 4/4. **124 passed / 0 failed / 0 skipped** in [test job 137290215166](https://github.com/Magiciancat9/Course_management/actions/runs/45049155638/job/137290215166) | Separate optional login smoke SKIP from this application-test denominator |
| Regression and packaging | **PASS:** retained domain/API/PostgreSQL, session isolation, roster privacy and Chromium journeys; production build and Docker build pass in that job. [Independent regression signoff](regression-signoff.md), merged [PR #112](https://github.com/Magiciancat9/Course_management/pull/112) | No original test was weakened or disabled for this change |
| Reviewed integration and release | **PASS:** contract #105, implementation #111, regression #112 and release #113 merged; the latest metrics PR #114 was approved by `Magiciancat9` and merged by `martinvadre`. The current deploy's reviewed-commit guard passed | #91 document review/merge remains pending; `martinvadre` |
| Current deploy and public smoke | **PASS:** migration/deploy succeeded; `/api/health` matched `d16e7a7`, `/api/ready` reported DB connected, `/` served HTML in [deploy job 137290744649](https://github.com/Magiciancat9/Course_management/actions/runs/45049155638/job/137290744649) | Reconfirm the final submitted version in #92; `Magiciancat9` |
| Fresh public checks | **PASS:** 23 Nov 14:40:24–14:41:21 Asia/Bangkok: health 200 with full `d16e7a7` SHA, ready 200 / DB connected, HTML 200, anonymous teams 401 and proposal namespace 401 / JSON `UNAUTHORIZED` | Read-only, Codex-operated checks; no login or business-state mutation |
| Selected authenticated user-path checks | **PASS in the recorded prior revision:** six groups on `00010-47x`; embedded below and linked to #89 | No fresh human UAT or replay on `00011-dtc` is claimed; retain version attribution in #92 |
| Optional automated login smoke | **SKIP:** `SMOKE_EMAIL` variable and `SMOKE_PASSWORD` secret are absent from GitHub environment `demo`; public smoke passes without them | `martinvadre`: configure a synthetic account and both entries, then demonstrate login/me/courses/logout PASS before Sprint 2 release #97 (TD-01) |
| Configuration and secrets | **PASS for deployed operation:** workflow WIF settings validate, reviewed-commit guard passes, app serves and DB connects. Production `DATABASE_URL` / `JWT_SECRET` use Secret Manager per [deployment instructions](../lab-05/deployment.md) | Names/metadata only were inspected; secret values, rotation and a broader IAM audit were not inspected. Optional smoke setup remains TD-01 |
| Documentation and safe run instructions | **PASS for this draft:** [README](../../../README.md) identifies the current 20/10 rule and separates local `db push` from production `prisma migrate deploy`; deployment/rollback instructions exist | Historical Lab 6/early Lab 7 documents retain their original dated pending states; use this snapshot and the later acceptance confirmation for current interpretation |
| Defects and technical debt | **No recorded open Critical/Major/Minor maintained-scope defects** at snapshot; closed defect list and deferred engineering work are below | Reopen a bug if an actual failure is observed; debt is not reported as a failing feature |
| Report and delivery | **PENDING:** final self-contained Parts A–D PDF, both students' details, evidence inclusion and LEB2 receipt | `Magiciancat9`: #92 after #91 review/merge; `martinvadre` reviews the final report |

### Recorded post-deploy business evidence (L7-E09)

Source: `martinvadre`'s [#89 deployment/check record](https://github.com/Magiciancat9/Course_management/issues/89#issuecomment-7082567142),
`2026-11-22T17:04:33Z`–`17:04:34Z` (23 Nov 00:04:33–00:04:34 Asia/Bangkok),
source `80c9a88`, revision `course-pms-00010-47x`. Synthetic accounts, Team Alpha
and the recorded proposal fixtures were used; the operator was AI-assisted.
These are **six check groups**, not six individual HTTP requests or a personal
student-UAT count.

| Group | Expected / actual observed result | Result |
| --- | --- | --- |
| 1. Serving version / DB | Health and readiness 200; expected `80c9a88` commit and connected DB | PASS |
| 2. Preserved access boundaries | Anonymous teams 401; student foreign-team proposal GET 403 `BR06_FORBIDDEN_TEAM_ACCESS`; student review POST 403 `BR06_INSTRUCTOR_ROLE_REQUIRED` | PASS |
| 3. Submission / revision lower boundary | Own-team draft submitted; instructor revision feedback length 19 rejected with 400 `BR05_FEEDBACK_TOO_SHORT` | PASS |
| 4. Revision accepted boundary / persistence | Length 20 accepted, `REVISION_REQUESTED` saved and owning-student GET readback matched | PASS |
| 5. Resubmission / preserved approval boundary | Student resubmitted, revision count 2; approval length 10 accepted and approved feedback read back | PASS |
| 6. Logout / token revocation | Logout 200, replay `/api/auth/me` 401 `TOKEN_REVOKED` | PASS |

## 4. Defect status and retained Lab 6 limits

The repository's open issues and the three original bug records were checked
at the snapshot. No open bug issue was present; this records the known defect
inventory and observed checks, not proof of absence of every possible bug.

| Defect | Severity / status | Disposition and evidence |
| --- | --- | --- |
| [#71 / L6-OUT-EXP-001](https://github.com/Magiciancat9/Course_management/issues/71), cross-account stale private proposal state | Major / CLOSED | Corrected in accepted Lab 6 source; current session-isolation suites retained. Historical deployed-race limitation below still applies |
| [#74](https://github.com/Magiciancat9/Course_management/issues/74), foreign-team proposal metadata in student directory | Major / CLOSED | Roster-only contract restored; directory/privacy regression retained |
| [#75](https://github.com/Magiciancat9/Course_management/issues/75), proposal namespace falls through to SPA HTML | Minor / CLOSED | Auth/JSON routing restored; current anonymous namespace check returns 401 JSON |
| New confirmed Lab 7 failures | None recorded at snapshot | Expected pre-implementation RED failures are resolved; optional smoke SKIP is the configuration/coverage gap TD-01 |

The [later Lab 6 acceptance confirmation](https://github.com/Magiciancat9/Course_management/blob/6916f29bbd97b38e9a86a4284c2e0a0609f3ebbe/docs/labs/lab-06/coursepms-acceptance-confirmed.md)
records **ACCEPTED** for `aeb804e` / `course-pms-00009-mk2` on 17 Nov
22:30:56 Asia/Bangkok. It supersedes older pending-decision templates for
that exact product decision; it does not grant independent partner acceptance
to the new Lab 7 release.

Preserve these historical limitations in #92: RT-07 was evidence inspection
and isolated replay, not deployed race injection; member-by-member historical
case/timing detail and two separately witnessed signatures were not collected.
Acceptance was representative-confirmed, and the original browser/API/replay
execution was attributed to AI. Do not convert later CI results, this readiness
assessment or shared decision times into missing personal UAT activity.

## 5. Technical debt and remaining owner actions

Deferred engineering work is listed separately from known incorrect behavior.
P1 means address before the next release gate; P2 means planned hardening or
integration work before Final Delivery. These priorities apply to this table.

| ID / item | Impact | Priority | Owner / concrete disposition and gate |
| --- | --- | --- | --- |
| TD-01: optional authenticated smoke unconfigured | A green deployment verifies public endpoints but can miss broken real login/session configuration | P1 | `martinvadre`: set `demo` variable `SMOKE_EMAIL` and secret `SMOKE_PASSWORD` for a synthetic account; verify login, me, courses and logout in a normal deployment before [#97](https://github.com/Magiciancat9/Course_management/issues/97). Release owner `Magiciancat9` checks that evidence; do not publish credentials |
| TD-02: reset safety differs between old/new test suites | New Lab 7 DB/browser suites enforce an `_test` target; older reset-based integration/E2E depend on correct database selection and can destroy the wrong fixtures if misconfigured | P1 | `Magiciancat9`: carry a shared disposable-test-DB guard into all reset entry points and verify it before #97; until then follow the README test-DB warning and CI's isolated `course_pms_test` configuration |
| TD-03: 20/10 rule and UI copy live in separate modules | A later UI merge can drift from backend enforcement even when each branch passed independently | P2 | `martinvadre` implements the UI handoff in [#106](https://github.com/Magiciancat9/Course_management/issues/106); `Magiciancat9` reviews the 20/10 contract. Preserve Lab 6 session guards and rerun the combined UI/API/E2E suites in [#103](https://github.com/Magiciancat9/Course_management/issues/103) before the integrated final release |

The Quick Fill removal / UI refresh remains the existing #106 enhancement,
owned by `martinvadre`; [PR #110](https://github.com/Magiciancat9/Course_management/pull/110)
was open against `sprint-2-staging` at this snapshot. It is not included in the
current Lab 7 deployment and is not claimed as completed maintenance evidence.

Remaining evidence work: `martinvadre` reviews/merges this #91 draft;
`Magiciancat9` then completes #92 with embedded Parts A–D, the real review text,
dated release evidence and submission details. Before freezing the PDF, recheck
the actual main SHA, deployment run, serving version and affected checks if a
new deployment occurred. No new screenshot, personal attestation or submission
receipt is invented to fill a missing record.

## 6. Retrospective (one or two sentences each)

**What helped?** Recording the pre-change commit and reviewing the contract
before implementation kept the change bounded to revision20/approval10.
Keeping the same failing test through RED/GREEN and retaining the session/API
regressions made the behavior change and preserved access paths traceable.

**What hurt?** The production workflow's optional login check still skipped,
so public deployment success needed separate authenticated business evidence.
The later metrics-only merge also created a new deployed revision, requiring
explicit source/version reconciliation rather than reusing the older revision
label as if it were current.

**What will change for the final release?** `martinvadre` will configure and
prove authenticated smoke before #97, while `Magiciancat9` carries the common
test-database safety guard into the release preparation. During #103 integration
and #92 report assembly, the team will preserve the 20/10 contract, rerun affected
checks and bind the report to the actual final deployed SHA.

These are evidence-based draft engineering reflections prepared with Codex,
for the two students to review; they are not invented personal quotations or
claims that either student manually executed the AI-operated checks.

## 7. Contributions, AI use and evidence boundaries

| Contributor | Traceable contribution |
| --- | --- |
| Tatchakorn / `Magiciancat9` | Supplied the TA approval evidence and authorized scope; drove #85/#86 contract/request and #87 tests/implementation in PRs #105/#111 with Codex assistance; reviewed the teammate's regression/release/metrics PRs #112/#113/#114; authors this #91 draft and owns #92 |
| Pawarit / `martinvadre` | Reviewed contract/implementation PRs #105/#111; drove #88 regression, #89 release/post-deploy record and #90 metrics through PRs #112/#113/#114; is the independent reviewer requested for this document and the owner of TD-01 |
| Codex / AI assistance | Inspected repository/GitHub records, drafted contracts/code/tests/documents and review text, reconciled workflow logs, and performed the explicitly labelled read-only checks in this #91 task. Prior live business checks are attributed to the AI-assisted #89 operator; their timestamps/results are not new executions here |

The recorded PR identities and actions establish collaboration history; they
do not establish how much unaided work each person performed. This task ran no
new local application suite, authenticated live workflow, seed/reset, migration
or deployment, and changed no runtime/configuration/secrets. The existing
GitHub Actions runs are the source for application execution results.

The [Part C metrics](metrics-and-action.md) retain their original observation
window ending `2026-11-22T17:05:13Z`: 5/8 issues, 4/4 PRs and 8/8 runs are
historical values, not recalculated totals at this later snapshot. #90 is now
closed after merged #114; do not rewrite that earlier window silently. Raw
inspection exports, temporary validation scripts, credentials, final PDFs and
private submission/identity evidence remain outside public Git.
