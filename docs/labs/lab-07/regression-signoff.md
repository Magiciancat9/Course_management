# Lab 7 Preserved Sprint 1 & Dependent Regression Signoff — L7-04

**Recorded:** 22 Nov 2026, Asia/Bangkok.  
**Work item:** [#88](https://github.com/Magiciancat9/Course_management/issues/88)  
**Regression owner:** `martinvadre` · **Independent PR reviewer:** `Magiciancat9`  
**Candidate SHA:** `c09ff337f3cecd597402cf6fed1e3b5d6c3d9dea` (`lab7-staging`, merge of PR #111 / `5829a1c`)

This document records independent regression verification for the maintained
Lab 7 candidate (`BR-05`: `REVISION_REQUESTED` ≥ 20 trimmed UTF-16 units,
`APPROVED` ≥ 10). It does not claim `#89` production release/GCP deployment or
`#90` metrics completion.

---

## 1. Regression Suite Selection & Impact Rationale

| Scope / Requirement | Selected Suites | Why It Covers Lab 7 Impact |
| --- | --- | --- |
| `BR-01`–`BR-05`, `FR-02`–`FR-05` domain logic | `server/tests/domain.unit.test.ts` (9), `server/tests/lab7-review.unit.test.ts` (35) | Verifies proposal completeness, state transitions, and decision-specific 10/20 trimmed UTF-16 feedback rules without weakening existing checks. |
| `BR-06`, `NFR-01`–`NFR-02` privacy & routing | `server/tests/routing-privacy.unit.test.ts` (8) | Confirms foreign-team roster-only serialization and JSON `401`/`404` responses before SPA fallback remain intact. |
| `FR-01`–`FR-05`, `NFR-04` real API + PostgreSQL | `server/tests/api.integration.test.ts` (24), `server/tests/lab7-review.integration.test.ts` (24) | Executes against a disposable `_test` PostgreSQL DB; covers auth/logout revocation, team capacity, proposal lifecycle, competing review (`TEST-18`), rejected-row equality, and legacy 10–19-unit historical reviews. |
| `FR-01`–`FR-05` UI, session isolation & privacy | `client/src/App.test.tsx` (4), `App.sessionIsolation.test.tsx` (5), `App.sessionReview.test.tsx` (5), `App.directoryPrivacy.test.tsx` (2), `App.lab7Review.test.tsx` (4) | Verifies delayed-response/401 draft isolation, foreign directory privacy, and Lab 7 10/20 guidance + draft retention on server rejection. |
| End-to-end browser & persistence journeys | `e2e/sprint1.spec.ts` (`TEST-11`, `TEST-12`, `TEST-20`), `e2e/lab7-review.spec.ts` (`L7-T05/T06`) (4) | Verifies full browser login, team formation, proposal submit/review/resubmit, reload persistence, and `BR-01`/`BR-04`/`BR-06` rejections on a `_test` DB. |
| Build & container packaging (`NFR-05`) | `npm run build`, `docker build --tag course-pms:ci .` | Verifies Prisma client generation, server/client TypeScript compilation, Vite bundle, and multi-stage Docker build. |

No existing Sprint 1 test was weakened, disabled, or removed.

---

## 2. Observed Execution Results

### 2.1 Local Verification on `c09ff33` (`2026-11-22`, Asia/Bangkok)

Environment: macOS, Node.js `v26.0.0` (with `NODE_OPTIONS='--no-experimental-webstorage'` for jsdom `localStorage` compatibility in client Vitest).

| Command | Result | Scope |
| --- | --- | --- |
| `NODE_OPTIONS='--no-experimental-webstorage' npm --prefix client test -- --run` | **20 passed / 0 failed / 0 skipped** (5 files) | `App.test.tsx`, `App.sessionIsolation.test.tsx`, `App.sessionReview.test.tsx`, `App.directoryPrivacy.test.tsx`, `App.lab7Review.test.tsx` |
| `cd server && npx vitest run --config vitest.config.ts tests/domain.unit.test.ts tests/routing-privacy.unit.test.ts tests/lab7-review.unit.test.ts` | **52 passed / 0 failed / 0 skipped** (3 files) | `domain.unit.test.ts`, `routing-privacy.unit.test.ts`, `lab7-review.unit.test.ts` |
| `npm run build` | **PASS** | `prisma generate && tsc` (server) + `tsc && vite build` (client) |

Local PostgreSQL/Docker was not started for local integration/E2E runs; those
suites are verified via GitHub Actions CI on a disposable `_test` PostgreSQL 16
database (Section 2.2) and on this PR's CI run.

### 2.2 GitHub Actions CI on Identical Runtime/Test Source (`5829a1c`)

- **Run:** [45040280957](https://github.com/Magiciancat9/Course_management/actions/runs/45040280957) — **SUCCESS** (`CI and Docker Build`, Ubuntu runner, Node.js 20, PostgreSQL 16 `_test` DB, Playwright Chromium).
- **Coverage:** 100 server tests (5 files) + 20 client tests (5 files) + 4 Playwright E2E tests (2 specs) = **124 application checks passed / 0 failed / 0 skipped**, plus `npm run build` and `docker build --tag course-pms:ci .`.

---

## 3. Dependent Integration Notes & Next Gates

- **Sprint 2 UI refresh (`#106` / PR #110):** Lives on `sprint-2-staging`, separate from `lab7-staging`. When integrating Lab 7 with `sprint-2-staging`, preserve the Lab 7 `Approve: minimum 10 after trim. Request revision: minimum 20 after trim.` guidance and rerun the combined client/E2E suites.
- **Remaining Lab 7 gates:** `#89` (maintained release & GCP post-deploy verification) and `#90` (dated metrics & engineering action) remain open and gated on this signoff PR.
