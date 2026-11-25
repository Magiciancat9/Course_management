# Complete requirements-to-verification traceability

**Current reconciliation: 25 November 2026 (Asia/Bangkok), issue #97.**
The [Sprint 2 release ledger](sprints/sprint-2/accepted-release.md) identifies
reviewed F-04/F-05/F-06 source, all 27 AC, combined verification and the
remaining main-review/release gates. An implemented AC is separate from an
accepted main release. Sprint 3 remains planned. Original Sprint 1 identifiers
and historical Lab 5-7 records retain their original scope and dates.

## 1. Full baseline matrix

| Requirement | Feature / sprint | AC / verification responsibility | Planned test IDs | Actual file / source or planned location | Result and version status |
| --- | --- | --- | --- | --- | --- |
| FR-01 | F-01 / S1 | AC-01–03 | TEST-01/02/03/11/13/14/19 | [API/DB](../server/tests/api.integration.test.ts); [E2E](../e2e/sprint1.spec.ts) | Implemented maintained baseline; combined Sprint 1/Lab 7 regression is recorded in S2 release ledger |
| FR-02 | F-02 / S1 | AC-04–06 | TEST-04/05/06/15/21/22 | [API/DB](../server/tests/api.integration.test.ts) | Implemented maintained baseline; combined Sprint 1/Lab 7 regression is recorded in S2 release ledger |
| FR-03 | F-02/F-03 / S1 | AC-04/07/10 | TEST-04/07/10/23 | [API/DB](../server/tests/api.integration.test.ts); [routing/privacy](../server/tests/routing-privacy.unit.test.ts) | Implemented maintained baseline; combined Sprint 1/Lab 7 regression is recorded in S2 release ledger |
| FR-04 | F-03 / S1 | AC-07/08 | TEST-07/08/11/16/17 | [API/DB](../server/tests/api.integration.test.ts); [E2E](../e2e/sprint1.spec.ts) | Implemented maintained baseline; combined Sprint 1/Lab 7 regression is recorded in S2 release ledger |
| FR-05 | F-03 / S1 | AC-09 | TEST-09/11/18 | [API/DB](../server/tests/api.integration.test.ts); [domain unit](../server/tests/domain.unit.test.ts); [E2E](../e2e/sprint1.spec.ts) | Implemented maintained baseline; combined Sprint 1/Lab 7 regression is recorded in S2 release ledger |
| FR-06 | F-04 / S2 | S2-F04-AC01–08 | S2-F04-T01–11 | [API/DB](../server/tests/milestones.integration.test.ts); [unit](../server/tests/milestones.unit.test.ts); [S2 AC ledger](sprints/sprint-2/accepted-release.md) | Implemented and independently reviewed via PR #116/#117/#118; combined release verification and accepted-main gates in S2 ledger |
| FR-07 | F-05 / S2 | S2-F05-AC01–10 | S2-F05-T01–12 | [API/DB](../server/tests/submissions.integration.test.ts); [unit](../server/tests/submissions.unit.test.ts); [S2 AC ledger](sprints/sprint-2/accepted-release.md) | Implemented and independently reviewed via PR #116/#117/#118; combined release verification and accepted-main gates in S2 ledger |
| FR-08 | F-06 / S2 | S2-F06-AC01–09 | S2-F06-T01–11 | [API/DB](../server/tests/grading.integration.test.ts); [unit](../server/tests/grading.unit.test.ts); [S2 AC ledger](sprints/sprint-2/accepted-release.md) | Implemented and independently reviewed via PR #116/#117/#118; combined release verification and accepted-main gates in S2 ledger |
| FR-09 | F-07 tasks / S3 | S3-F07-AC01–06 | S3-F07-T01–08 | [F-07 STS](sprints/sprint-3/f07-collaboration.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| FR-10 | F-07 peer / S3 | S3-F07-AC07–12 | S3-F07-T09–15 | [F-07 STS](sprints/sprint-3/f07-collaboration.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| FR-11 | F-08 analytics / S3 | S3-F08-AC01–06/09/10 | S3-F08-T01–06/10–12 | [F-08 STS](sprints/sprint-3/f08-analytics-export.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| FR-12 | F-08 CSV / S3 | S3-F08-AC06–10 | S3-F08-T06–12 | [F-08 STS](sprints/sprint-3/f08-analytics-export.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| BR-01 | F-02 / S1 | AC-05 | TEST-05/12/21/22 | [API/DB](../server/tests/api.integration.test.ts); [E2E](../e2e/sprint1.spec.ts) | Implemented maintained baseline; combined Sprint 1/Lab 7 regression is recorded in S2 release ledger |
| BR-02 | F-02 / S1 | AC-06 | TEST-06/15 | [API/DB](../server/tests/api.integration.test.ts); [domain unit](../server/tests/domain.unit.test.ts) | Implemented maintained baseline; combined Sprint 1/Lab 7 regression is recorded in S2 release ledger |
| BR-03 | F-03 / S1 | AC-08/09 | TEST-08/09/16/17/18 | [API/DB](../server/tests/api.integration.test.ts); [domain unit](../server/tests/domain.unit.test.ts) | Implemented maintained baseline; combined Sprint 1/Lab 7 regression is recorded in S2 release ledger |
| BR-04 | F-03 / S1 | AC-08 | TEST-08 | [API/DB](../server/tests/api.integration.test.ts); [domain unit](../server/tests/domain.unit.test.ts) | Implemented maintained baseline; combined Sprint 1/Lab 7 regression is recorded in S2 release ledger |
| BR-05 | F-03 / S1 | AC-09; revision minimum 20, approval minimum 10 after trim/UTF-16 | TEST-09; L7-T01-T06 | [Lab 7 API](../server/tests/lab7-review.integration.test.ts); [unit](../server/tests/lab7-review.unit.test.ts); [browser](../e2e/lab7-review.spec.ts) | Approved and implemented on maintained main; integrated UI preserves both decision-specific minima; combined release checks in S2 ledger |
| BR-06 | F-01–08 / all sprints | Existing AC-03/10; S2-F04-AC05; S2-F05-AC07/10; S2-F06-AC05; S3-F07-AC04/10; S3-F08-AC06 | TEST-03/10/23; new feature negative/session tests | [API/DB](../server/tests/api.integration.test.ts); [routing/privacy](../server/tests/routing-privacy.unit.test.ts); [client privacy/session](../client/src/App.sessionIsolation.test.tsx); new locations in register | Baseline and Sprint 2 checks implemented; actual combined results in S2 ledger; Sprint 3 paths remain planned |
| BR-07 | F-05 / S2 | S2-F05-AC02 | S2-F05-T02 | [API/DB](../server/tests/submissions.integration.test.ts); [unit](../server/tests/submissions.unit.test.ts); [S2 AC ledger](sprints/sprint-2/accepted-release.md) | Implemented and independently reviewed via PR #116/#117/#118; combined release verification and accepted-main gates in S2 ledger |
| BR-08 | F-06 grading / S2; F-07 peer / S3 | S2-F06-AC02; S3-F07-AC08 | S2-F06-T02; S3-F07-T10 | [API/DB](../server/tests/grading.integration.test.ts); [unit](../server/tests/grading.unit.test.ts); [S2 AC ledger](sprints/sprint-2/accepted-release.md) | Implemented and independently reviewed via PR #116/#117/#118; combined release verification and accepted-main gates in S2 ledger; peer-rating part remains Sprint 3 / NOT IMPLEMENTED |
| NFR-01 | Auth + every protected new route / all sprints | AC-03; all new route authentication cases | TEST-03/14/19; S2-F04-T07; S2-F05-T07; S2-F06-T05; S3-F07-T04/12; S3-F08-T06 | [API/DB](../server/tests/api.integration.test.ts); [routing/privacy](../server/tests/routing-privacy.unit.test.ts); [new locations](sprints/deliverable-2/verification-register.md) | Baseline and Sprint 2 checks implemented; actual combined results in S2 ledger; Sprint 3 paths remain planned |
| NFR-02 | Role/ownership + private DTOs / all sprints | AC-10; every new role/ownership path | TEST-10/23; S2-F04-T07; S2-F05-T07/12; S2-F06-T05; S3-F07-T04/12; S3-F08-T06 | [API/DB](../server/tests/api.integration.test.ts); [routing/privacy](../server/tests/routing-privacy.unit.test.ts); client directory/session suites; new tests planned | Baseline and Sprint 2 checks implemented; actual combined results in S2 ledger; Sprint 3 paths remain planned |
| NFR-03 | Credential handling / serializers / UI | AC-01/02; UIR-AC01/06 | TEST-01/02/19; UIR-T01/07; explicit changed-source/DTO review | [API/DB](../server/tests/api.integration.test.ts); [UIR STS](ui-refresh-spec.md) | Baseline and Sprint 2 checks implemented; actual combined results in S2 ledger; Sprint 3 paths remain planned |
| NFR-04 | Persistence/version transactions / F-02–08 | AC-04/07/09 + new feature save/readback/history/race AC | TEST-04/07/09/15–18/21/22; per-feature I/E checks | [API/DB](../server/tests/api.integration.test.ts); [E2E](../e2e/sprint1.spec.ts); new planned paths in register | Baseline and Sprint 2 checks implemented; actual combined results in S2 ledger; Sprint 3 paths remain planned |
| NFR-05 | Build/container/GCP/health / system | Existing AC-01 + timed startup measurement | TEST-01; production/Docker CI; D2-SYS-T01 | [API/DB](../server/tests/api.integration.test.ts); [CI workflow](../.github/workflows/ci-docker.yml); planned startup record | Historical health/build checks; ≤10s startup NOT MEASURED here; new RC/deployment pending |

## 2. Coverage and remaining release gates

- FR-01-08, BR-01-07 and the grading part of BR-08 have executable tests.
  Full combined results and exact source/run links belong in the release ledger.
- FR-09-12 and the peer-rating part of BR-08 remain Sprint 3 work. Contract
  review is recorded in PR #107; this does not claim their implementation.
- NFR-05's 10-second startup target still needs a timed measurement. A green
  build or health response alone is insufficient. Main deployment, authenticated
  smoke and the immutable Sprint 2 tag must be recorded before release acceptance.
- Final Sprint 2/3 RC, continuity and assessed PDF are separate #93/#100/#103/#104 gates.

## 3. Approved Changes Log

| Change ID | Date | Affected IDs | Description of Change & Rationale | Approved By |
| :--- | :--- | :--- | :--- | :--- |
| **CHG-01** | 2026-11-05 | `BR-03`, `F-03` | Replaced terminal `REJECTED` state with `REVISION_REQUESTED` so teams whose proposals are rejected by an Instructor can revise and re-submit (`REVISION_REQUESTED` → `SUBMITTED`) without creating orphaned team records. | Pawarit & Tatchakorn |
| **CHG-02** | 2026-11-05 | `F-01`, `AD-02` | Added server-side token revocation tracking on `POST /api/auth/logout` in addition to client token removal, ensuring that reusing a logged-out JWT against protected backend endpoints is immediately rejected with `401 Unauthorized`. | Pawarit & Tatchakorn |
| **CHG-03** | 2026-11-06 | `F-01`, `AC-03`, `AD-02`, `NFR-03` | Require an explicitly configured JWT secret and persist logged-out token identifiers in PostgreSQL, so startup fails safely and revocation survives server restarts. | Pawarit & Tatchakorn |
| **CHG-04** | 2026-11-06 | `NFR-01`, `NFR-04` | Replaced unverified timing targets with observable authentication rejection and PostgreSQL persistence requirements; timing targets had no measuring test. | Pawarit & Tatchakorn |
| **CHG-05** | 2026-11-08 | `FR-02`, `F-02` UI | Approved deferring self-service team joining from Sprint 1. Students join an existing team when a current team member adds them by university email, matching the implemented ownership-guarded API and UI. | Tatchakorn Thamnimitr |
| **CHG-06** | 2026-11-22 | F-01 UI / shared presentation | User requested modern UI and removal of the demo Quick Fill box; real email/password auth remains. Detailed [UIR plan](ui-refresh-spec.md) awaits review; implementation explicitly deferred. This is approved direction, not an implemented/reviewed design claim. | Tatchakorn (user instruction); teammate design review pending |

| **CR-L7-01** | 2026-11-22, 20:18 Asia/Bangkok | FR-05 / BR-05 / F-03 | TA-approved revision feedback minimum 10 to 20 after trim (UTF-16); approval remains 10. Contract and code independently reviewed before maintained main release. | P'Tik (TA); teammate review/source in [approval record](labs/lab-07/approval-record.md) and [readiness](labs/lab-07/readiness-and-retrospective.md) |

## 4. Decision provenance

PR #107 reviewed the shared contracts and UI specification before feature
implementation. PR #110 implemented the refreshed shell and Quick Fill removal.
PR #116/#117/#118 independently reviewed F-04/F-05/F-06 respectively.
The main Lab 7 baseline is `b92b4349fb6c203d3f39ef966a89661a2959569e`.
No historical SKIP or limited replay is promoted to a new PASS.
