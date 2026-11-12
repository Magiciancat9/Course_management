# Lab 5 Evidence Index

This index records the evidence available on 2026-11-12. Links to GitHub require the repository and workflow records to remain accessible. Do not include passwords, tokens, database URLs, or unredacted personal information in evidence.

## Team, system and release

- Team: Tatchakorn Thamnimitr (`Magiciancat9`, driver) and Pawarit Wongdaeng (`martinvadre`, reviewer).
- Repository: <https://github.com/Magiciancat9/Course_management>
- Sprint 1 tag: `v1.0.0-sprint1`; release commit: `fa7f156aa782eea48c36be5f23eaa7336a582458`.
- Recorded public URL: <https://course-pms-859617270560.asia-southeast1.run.app>
- Stack, configuration, commands, cloud resources, release and rollback: [deployment.md](deployment.md).
- Initial setup planning snapshot: [gcp-project.md](gcp-project.md). The latter's unchecked items describe its original planning state.
- Separate LEB2 evidence document: [draft PDF](lab5_sec31_EN-022_P6.pdf). Its submission filename is `lab5_sec31_EN-022_P6.pdf`; it must be updated after the outstanding evidence and review are complete.

## Acceptance evidence

| Criterion | Evidence and observed result | Limitation |
|---|---|---|
| C-01: passing PR CI | [PR #36](https://github.com/Magiciancat9/Course_management/pull/36) and its [passing PR CI run](https://github.com/Magiciancat9/Course_management/actions/runs/43146393669); `test-and-docker` includes backend, frontend and E2E tests, build and Docker build. | The deployment workflow also reran CI on `main`; that run is separate from the PR check. |
| C-02: failing test blocks merge | [PR #38](https://github.com/Magiciancat9/Course_management/pull/38) intentionally failed `test_lab5_c02_intentional_failure` in [run 43242578035](https://github.com/Magiciancat9/Course_management/actions/runs/43242578035). While open and not a draft, GitHub reported `mergeStateStatus=BLOCKED`; the [main ruleset](https://github.com/Magiciancat9/Course_management/rules) requires `test-and-docker`. The PR was closed without merging. | GitHub reported `mergeable=MERGEABLE`, meaning no content conflict; it does not mean the required-check gate passed. The earlier [PR #33](https://github.com/Magiciancat9/Course_management/pull/33) only demonstrated a missing check. |
| C-03: fresh clone build and run | [Fresh-clone verification](https://github.com/Magiciancat9/Course_management/issues/24#issuecomment-6827522107) records a no-cache Compose build and run from `fa7f156aa782eea48c36be5f23eaa7336a582458`, with `/api/health` and `/api/ready` returning HTTP 200 against a disposable PostgreSQL instance. See [Dockerfile](../../../Dockerfile), [Compose](../../../docker-compose.yml), and [environment template](../../../.env.example). | The test used temporary values copied from `.env.example` and a temporary loopback-only port override. It was an operator observation; no separate build-log screenshot was captured. `commitSha` was `local` because no build SHA was supplied. |
| C-04: public business flow | [Issue #23 deployment observation](https://github.com/Magiciancat9/Course_management/issues/23#issuecomment-6791438001) records public UI/API/database checks, sign-in, team and proposal actions, and BR-01/BR-06 rejection. | The linked business-flow result is a narrative observation, not an attached screenshot or an independent retest. |
| C-05: restart and redeploy persistence | [Baseline](https://github.com/Magiciancat9/Course_management/issues/27#issuecomment-6820053800), [restart](https://github.com/Magiciancat9/Course_management/issues/27#issuecomment-6820497731), [redeploy](https://github.com/Magiciancat9/Course_management/issues/27#issuecomment-6820846958), [teammate verification](https://github.com/Magiciancat9/Course_management/issues/27#issuecomment-6821146959), and [redacted post-deploy screenshot](https://github.com/user-attachments/assets/685d8a87-f715-48b4-a2fc-3b402aa3b4b1). | Before and restart observations are text, not saved before/after screenshots. The redeploy used the same source commit but a different image digest and revision. |
| C-06: reviewed release and running commit | [PR #36](https://github.com/Magiciancat9/Course_management/pull/36) contains the staging-to-main review; [main deployment run 43189078700](https://github.com/Magiciancat9/Course_management/actions/runs/43189078700) succeeded. [Issue #27](https://github.com/Magiciancat9/Course_management/issues/27#issuecomment-6820846958) records the later running commit and revision. | The later manual rebuild used the same source commit, not a new code change. |

## Release trace

1. Lab 5 tasks were tracked in labelled Issues [#19-#27](https://github.com/Magiciancat9/Course_management/issues?q=is%3Aissue+%22Lab+5%22); implementation PRs, including [#35](https://github.com/Magiciancat9/Course_management/pull/35), targeted `lab5-staging`.
2. The independently reviewed [PR #36](https://github.com/Magiciancat9/Course_management/pull/36) promoted staging into `main`. The merge commit `fa7f156aa782eea48c36be5f23eaa7336a582458` triggered [run 43189078700](https://github.com/Magiciancat9/Course_management/actions/runs/43189078700).
3. [Run 43196661493](https://github.com/Magiciancat9/Course_management/actions/runs/43196661493) later rebuilt that same commit and deployed digest `sha256:aec5f0178e7616bb5c039a6a0fca5f8e68356e412139942bd12e61550ce7fb04` as `course-pms-00003-b5t`. The previous digest was `sha256:e089ccd506bfeef8c04d7c24553488df238df6ba450354118feaec1bcb0eea7c`.
4. The documentation task is [Issue #24](https://github.com/Magiciancat9/Course_management/issues/24), with [draft PR #37](https://github.com/Magiciancat9/Course_management/pull/37) targeting `lab5-staging`. Its review and merge remain pending.

## Before submission

- Review the recorded C-02 and C-03 observations and add redacted visual evidence if required by the instructor.
- Review C-04's narrative evidence and add redacted visual evidence if required by the instructor.
- Update this index and the separate LEB2 PDF with the final documentation PR/release links after review; do not describe an unmerged PR as merged.
