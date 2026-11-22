# Lab 7 Dated Metrics & Evidence-Based Engineering Action — L7-06

**Recorded:** 23 Nov 2026, 00:07 Asia/Bangkok (`2026-11-22T17:07Z`)  
**Work item:** [#90](https://github.com/Magiciancat9/Course_management/issues/90) · **Owner:** `martinvadre` · **Reviewer:** `Magiciancat9`  
**Scope:** `Magiciancat9/Course_management` Lab 7 maintenance (`lab7-staging` → `main` `80c9a88d65f098e42bfecfbc538de4a5ff89ea94`, Cloud Run `course-pms-00010-47x`). Excludes `fastTrack` and Deliverable 2 `sprint-2-staging` branches.  
**Observation window:** `2026-11-22T07:44:33Z` – `2026-11-22T17:05:13Z` (`2026-11-22 14:44` – `2026-11-23 00:05 Asia/Bangkok`).

---

## 1. Five Verifiable, Dated Metrics

| # | Metric | Value & Denominator | Observation Window / Scope |
| --- | --- | --- | --- |
| 1 | **Completed Lab 7 Issues** | **5 / 8 (62.5%)** closed | `lab7`-labeled issues `#85`–`#92` (`#85`–`#89` closed; `#90`–`#92` open for metrics/readiness/PDF) |
| 2 | **Merged Lab 7 PRs** | **4 / 4 (100.0%)** merged | PRs `#105`, `#111`, `#112`, `#113` into `lab7-staging` / `main` |
| 3 | **Named Automated-Suite Outcomes** | **124 / 124 (100.0%)** PASS (`0` fail, `0` skip) | `Deploy CoursePMS` Run `45046826573` on `main` `80c9a88`: Server `100` + Client `20` + E2E `4` (+ `npm run build` & `docker build`) |
| 4 | **UAT & Post-Deploy Defect Status** | **0** open Lab 7 defects (`3 / 3` Lab 6 closed; `6 / 6` live checks PASS) | Lab 6 defects `#71`, `#74`, `#75` remain `CLOSED`; 6 live checks on `course-pms-00010-47x` at `2026-11-22T17:04Z` PASS |
| 5 | **Lab 7 CI & Deploy Workflow Outcomes** | **8 / 8 (100.0%)** `success` | All `CI and Docker Build` (7) and `Deploy CoursePMS` (1) runs on Lab 7 branches & `main` |

---

## 2. Compact Reconcilable Source Lists

### Issues (`#85`–`#92`, label `lab7`)
- **Closed (5):** `#85` (`2026-11-22T15:16:37Z`), `#86` (`15:28:52Z`), `#87` (`16:04:30Z`), `#88` (`16:40:12Z`), `#89` (`17:05:13Z`)
- **Open (3):** `#90` (this PR), `#91` (readiness/retrospective), `#92` (Parts A–D PDF)

### Merged PRs (4)
- `#105` `[Lab7-01/02] Record TA approval and review revised BR-05 contract` → `lab7-staging` (`mergedAt: 2026-11-22T15:16:10Z`)
- `#111` `[L7-03] Enforce revision feedback 20 with test-first RED/GREEN` → `lab7-staging` (`mergedAt: 2026-11-22T16:03:13Z`)
- `#112` `[L7-04] Verify preserved Sprint 1 and dependent regression (#88)` → `lab7-staging` (`mergedAt: 2026-11-22T16:34:12Z`)
- `#113` `[L7-05] Release maintained Lab 7 BR-05 change to main (#89)` → `main` (`mergedAt: 2026-11-22T16:58:59Z`)

### Automated Suites on `main` `80c9a88` (Run `45046826573`)
- **Server (`npm run test:server`, 100):** `api.integration.test.ts` (24), `domain.unit.test.ts` (9), `routing-privacy.unit.test.ts` (8), `lab7-review.unit.test.ts` (35), `lab7-review.integration.test.ts` (24)
- **Client (`npm run test:client`, 20):** `App.test.tsx` (4), `App.sessionIsolation.test.tsx` (5), `App.sessionReview.test.tsx` (5), `App.directoryPrivacy.test.tsx` (2), `App.lab7Review.test.tsx` (4)
- **E2E (`npm run test:e2e`, 4, Chromium):** `e2e/sprint1.spec.ts` (3: `TEST-11`, `TEST-12`, `TEST-20`), `e2e/lab7-review.spec.ts` (1: `L7-T05/T06`)

### CI & Deploy Runs (8)
- `docs/lab7-01-change-request`: `45001981946` (`08:15:49Z`), `45030553775` (`14:01:34Z`) — `success`
- `feat/lab7-03-review-feedback`: `45039794731` (`15:42:34Z`), `45039980904` (`15:44:38Z`), `45040280957` (`15:47:56Z`) — `success`
- `docs/lab7-04-regression-signoff`: `45042831104` (`16:15:46Z`) — `success`
- `lab7-staging` (PR #113): `45045322234` (`16:42:22Z`) — `success`
- `main` (`Deploy CoursePMS`): `45046826573` (`16:59:02Z`) — `success`

---

## 3. Interpretation & Evidence-Based Engineering Action (≤100 words)

All 4 Lab 7 PRs merged with 8/8 CI/deploy runs passing and 124/124 automated checks green on `main` (`80c9a88`), with 0 open defects across 6 live post-deploy checks (`course-pms-00010-47x`). One operational gap surfaced: `Deploy CoursePMS` skipped its automated authenticated smoke test because `SMOKE_EMAIL` and `SMOKE_PASSWORD` are unset in the `demo` GitHub environment. **Concrete action:** `martinvadre` will configure synthetic `SMOKE_EMAIL` and `SMOKE_PASSWORD` in the `demo` environment before the Sprint 2 release (`#97`) so every future deployment verifies authenticated login automatically.
