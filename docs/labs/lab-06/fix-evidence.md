# Lab 6 Part D Fix Evidence — L6-OUT-EXP-001

> 17 November continuation: this document preserves the original #72 record.
> Review found three further failing cases, corrected in [Draft PR #73](https://github.com/Magiciancat9/Course_management/pull/73).
> See [new RED/GREEN evidence](session-followup.md) and [return package](return-to-fasttrack.md)
> for actual replay, 14 passing client tests, current CI and release limits.
> Original operator/member attribution is historical; this follow-up is
> AI-operated under authenticated account `Magiciancat9`, not a personal sign-off.

## 1. Defect Summary, Disposition, and Severity Rationale
- **Finding ID:** `L6-OUT-EXP-001` (GitHub Issue: [#71](https://github.com/Magiciancat9/Course_management/issues/71), linked to [#55](https://github.com/Magiciancat9/Course_management/issues/55) `[Lab6-09]` and [#56](https://github.com/Magiciancat9/Course_management/issues/56) `[Lab6-10]`)
- **Reported By:** EN-028 InfaCompany (fastTrack), AI-operated UAT run `CPMS-L6-20261114-155049` (`2026-11-14 ~22:54–23:14 Asia/Bangkok`)
- **Tested Baseline:** `https://course-pms-859617270560.asia-southeast1.run.app`, commit `9c22735995c985aaa0622b6b179de1ac9c1f80ca`, serving revision `course-pms-00008-hbv` (`100%` traffic, image digest `asia-southeast1-docker.pkg.dev/cpe334-kingnine/course-pms/course-pms@sha256:2405885ea9bb4b88158a0efd4ec3d72ec7d72012c69d4bcb46a9d356d1555aad`, verified read-only `2026-11-15T12:31:43Z` / `19:31:43 Asia/Bangkok`).
- **Triage Disposition:** **Accepted Defect** (awaiting formal teammate review by `@Magiciancat9` on `lab6-staging`).
- **Severity:** **Major** — client-side cross-account data exposure in a reused browser tab: after logging out of Account A (with a 4-field draft) and signing in as Account B (`NO_DRAFT`) without reloading, Account B's editor displays Account A's private proposal fields. This does not establish a server-side API authorization bypass, and page reload clears the fields, but reload is a workaround rather than a fix.
- **Note on Original Report Arithmetic:** `assertions.json` in fastTrack's package records `56 PASS / 1 FAIL / 57 total` (with `36` official core `PASS` assertions and `CPMS-A-046` `FAIL` for `L6-OUT-EXP-001`), whereas `report.md` summarized `57 PASS / 1 FAIL / 58 total`. This is an arithmetic discrepancy in the incoming report summary rather than a separate product defect.

## 2. Root Cause (`client/src/App.tsx`)
1. `propTitle`, `propProblem`, `propStack`, `propRepo` (and related workspace/review/form states such as `teams`, `courses`, `newTeamName`, `addMemberEmail`, `statusFilter`, `selectedTeamId`, `reviewFeedbackInput`) were not cleared when authentication transitioned or became invalid (`handleLogout`, `handleLogin`, or `401` responses).
2. `loadDashboardData` assigned `propTitle`/`propProblem`/`propStack`/`propRepo` only inside `if (myTeam?.proposal)`, leaving prior-account values intact when the next authenticated user had no proposal, had no team, or was an `INSTRUCTOR`.
3. Asynchronous dashboard loads and mutation/`finally` callbacks lacked a session generation and `AbortController` boundary, allowing late responses from an older session to overwrite the newer session's state or `pendingAction`/`loading` flags.

## 3. Changes Made
- `client/src/App.tsx`:
  - Added `sessionGenerationRef` and `dashboardAbortRef` plus `clearProposalEditorFields()`, `clearWorkspaceState()`, `invalidateSessionBoundary()`, and `handleActionFailure()`.
  - Cleared all prior-session proposal editor, team/course, and instructor review state on logout, login session transition, `401` responses, and `storage` token changes.
  - Explicitly cleared `propTitle`, `propProblem`, `propStack`, `propRepo` in `loadDashboardData` whenever the student has no team/proposal or the user is an `INSTRUCTOR`.
  - Guarded all async dashboard loads, `withPendingAction` `catch`/`finally` blocks, and action handlers against stale session generations and aborted requests, while preserving same-session unsaved typing on validation/save errors and preserving non-401 logout failure behavior (`503 LOGOUT_FAILED`).
- `client/src/App.sessionIsolation.test.tsx`:
  - Added 5 synthetic-fixture Vitest + Testing Library regression tests covering:
    1. Account A (4-field draft) -> logout -> Account B (no proposal) without reload.
    2. Reverse switching (B -> A), unassigned student (no team), instructor destination, and B with its own proposal.
    3. Delayed Account A dashboard response resolving after Account B loads.
    4. Delayed mutation/`finally` callback from a prior session not overwriting the new session.
    5. `401` session expiry clearing sensitive state and same-session failed `save-draft` (`400`) preserving unsaved typing.

## 4. Traceability & Attribution
- **Branch:** `fix/lab6-10-l6-out-exp-001-draft-isolation` (base: `lab6-staging`)
- **Driver / Implementer:** Pawarit Wongdaeng (`@martinvadre`, 67070503466) with AI coding/test execution assistance
- **Designated Reviewer / Merger:** Tatchakorn Thamnimitr (`@Magiciancat9`, 67070503415) — pending review
- **RED Commit:** `d3ea0116006c7338f6d7f54aaf7c7b3f4e9ffb63` (`test(lab6): add RED regression tests for L6-OUT-EXP-001 session-scoped draft isolation`)
- **GREEN Commit:** `3b7de94040f8944aae2db3b751f4c91cdf8907fb` (`fix(lab6): enforce session-scoped state boundary in client App (Closes #71)`)

## 5. Verification Commands & Outcomes (Local Automated Checks)
> **Scope distinction:** The commands below are local automated checks using synthetic fixtures; they are **not** the deployed independent UAT.

1. **RED (against unfixed `App.tsx` at `d3ea0116006c7338f6d7f54aaf7c7b3f4e9ffb63`):**
   - Command: `npm run test:client` (`vitest run --config vitest.config.ts`)
   - Result: **FAILED (exit 1)** — `Test Files 1 failed | 1 passed (2)`, `Tests 5 failed | 4 passed (9)` (`App.sessionIsolation.test.tsx`: 5/5 failed; `App.test.tsx`: 4/4 passed).
2. **GREEN (after fix at `3b7de94040f8944aae2db3b751f4c91cdf8907fb`):**
   - Command: `npm run test:client`
   - Result: **PASSED (exit 0)** — `Test Files 2 passed (2)`, `Tests 9 passed (9)`, `0` skipped.
3. **Production Build:**
   - Command: `npm run build` (`prisma generate && tsc` + `tsc && vite build`)
   - Result: **PASSED (exit 0)**.
4. **Server Unit & Integration Suite (disposable local PostgreSQL 16 container on port `55432`):**
   - Command: `DATABASE_URL="postgresql://coursepms:coursepms-ci-only@localhost:55432/course_pms_test?schema=public" JWT_SECRET="local-ci-test-secret" npm run test:server`
   - Result: **PASSED (exit 0)** — `Test Files 2 passed (2)` (`domain.unit.test.ts` 9 passed, `api.integration.test.ts` 23 passed), `Tests 32 passed (32)`, `0` skipped (includes `TEST-03`/`TEST-14` revoked-token rejection, `TEST-10` foreign-team denial and student review denial).
5. **Local Playwright E2E (`npm run test:e2e`):**
   - Command: `npm run test:e2e`
   - Result: **NOT RUN LOCALLY (exit 1)** — `Error: http://localhost:3000/api/health is already used` on the local workstation; deferred to GitHub Actions CI (`ci-docker.yml`).

## 6. Limitations, Deployment Status & Independent Retest Plan
- **Deployment / Retest Status:** **Pending.** The fix is on `fix/lab6-10-l6-out-exp-001-draft-isolation` (Draft PR targeting `lab6-staging`). It has **not** been reviewed, merged to `main`, or deployed to Cloud Run `course-pms`. Acceptance remains **PENDING**.
- **Retained Production Fixtures (Do Not Reset/Delete):**
  - Retain Team `5` (`CPMS-L6-20261114-155049-Team`) and Proposal `3` (`APPROVED`, revision `2`).
  - `S1–S3` are already assigned to Team `5`; `S4` remains unassigned; `R1–R4` were unused in `CPMS-L6-20261114-155049` and must be privately reverified before any future lifecycle run.
- **Independent Retest Steps (After Authorized Release & Deployment):**
  1. Confirm `/api/health` reports the new fixed commit SHA and `/api/ready` reports `{"status":"ready","db":"connected"}`, and confirm the new Cloud Run revision/traffic in `cpe334-kingnine` (`asia-southeast1`).
  2. In a reused browser tab, sign in as Account A (existing 4-field private draft) and verify its 4 fields load.
  3. Click Logout, then without refreshing sign in as Account B (`NO_DRAFT` team); verify all 4 editor fields are empty (`""`) and Account B's identity/team are displayed.
  4. Test the reverse direction (Account B -> Logout -> Account A without reload) and confirm Account A's fields populate cleanly.
  5. Verify reload behavior and run relevant session/authorization checks (`401` after logout, foreign-team access denial).
