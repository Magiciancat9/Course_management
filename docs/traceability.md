# Complete requirements-to-verification traceability — D2 draft v1.0

**22 Nov 2026; documentation-only phase.** Complete baseline scope comes from
[SRS](srs.md) and [feature inventory](features.md). Sprint 1 AC/TEST identifiers
are retained. New contract IDs are planned, not executed coverage. No new
domain/UI feature or accepted D2 release is created by this matrix.

## 1. Full baseline matrix

S1/S2/S3 mean Sprint 1/2/3. Ranges refer to the explicit numbered tables in
the linked contracts, not a claim that a test file exists. The [verification
register](sprints/deliverable-2/verification-register.md) lists each new AC,
its test IDs, levels and proposed actual locations separately.

| Requirement | Feature / sprint | AC / verification responsibility | Planned test IDs | Actual file / source or planned location | Result and version status |
| --- | --- | --- | --- | --- | --- |
| FR-01 | F-01 / S1 | AC-01–03 | TEST-01/02/03/11/13/14/19 | [API/DB](../server/tests/api.integration.test.ts); [E2E](../e2e/sprint1.spec.ts) | Implemented baseline; historical verification exists; new D2 RC NOT RUN |
| FR-02 | F-02 / S1 | AC-04–06 | TEST-04/05/06/15/21/22 | [API/DB](../server/tests/api.integration.test.ts) | Implemented baseline; historical verification exists; new D2 RC NOT RUN |
| FR-03 | F-02/F-03 / S1 | AC-04/07/10 | TEST-04/07/10/23 | [API/DB](../server/tests/api.integration.test.ts); [routing/privacy](../server/tests/routing-privacy.unit.test.ts) | Implemented baseline; historical verification exists; new D2 RC NOT RUN |
| FR-04 | F-03 / S1 | AC-07/08 | TEST-07/08/11/16/17 | [API/DB](../server/tests/api.integration.test.ts); [E2E](../e2e/sprint1.spec.ts) | Implemented baseline; historical verification exists; new D2 RC NOT RUN |
| FR-05 | F-03 / S1 | AC-09 | TEST-09/11/18 | [API/DB](../server/tests/api.integration.test.ts); [domain unit](../server/tests/domain.unit.test.ts); [E2E](../e2e/sprint1.spec.ts) | Implemented baseline; historical verification exists; new D2 RC NOT RUN |
| FR-06 | F-04 / S2 | S2-F04-AC01–08 | S2-F04-T01–11 | [F-04 STS](sprints/sprint-2/f04-milestones.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| FR-07 | F-05 / S2 | S2-F05-AC01–10 | S2-F05-T01–12 | [F-05 STS](sprints/sprint-2/f05-submissions.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| FR-08 | F-06 / S2 | S2-F06-AC01–09 | S2-F06-T01–11 | [F-06 STS](sprints/sprint-2/f06-grading.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| FR-09 | F-07 tasks / S3 | S3-F07-AC01–06 | S3-F07-T01–08 | [F-07 STS](sprints/sprint-3/f07-collaboration.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| FR-10 | F-07 peer / S3 | S3-F07-AC07–12 | S3-F07-T09–15 | [F-07 STS](sprints/sprint-3/f07-collaboration.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| FR-11 | F-08 analytics / S3 | S3-F08-AC01–06/09/10 | S3-F08-T01–06/10–12 | [F-08 STS](sprints/sprint-3/f08-analytics-export.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| FR-12 | F-08 CSV / S3 | S3-F08-AC06–10 | S3-F08-T06–12 | [F-08 STS](sprints/sprint-3/f08-analytics-export.md); actual new case: none | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| BR-01 | F-02 / S1 | AC-05 | TEST-05/12/21/22 | [API/DB](../server/tests/api.integration.test.ts); [E2E](../e2e/sprint1.spec.ts) | Implemented baseline; historical verification exists; new D2 RC NOT RUN |
| BR-02 | F-02 / S1 | AC-06 | TEST-06/15 | [API/DB](../server/tests/api.integration.test.ts); [domain unit](../server/tests/domain.unit.test.ts) | Implemented baseline; historical verification exists; new D2 RC NOT RUN |
| BR-03 | F-03 / S1 | AC-08/09 | TEST-08/09/16/17/18 | [API/DB](../server/tests/api.integration.test.ts); [domain unit](../server/tests/domain.unit.test.ts) | Implemented baseline; historical verification exists; new D2 RC NOT RUN |
| BR-04 | F-03 / S1 | AC-08 | TEST-08 | [API/DB](../server/tests/api.integration.test.ts); [domain unit](../server/tests/domain.unit.test.ts) | Implemented baseline; historical verification exists; new D2 RC NOT RUN |
| BR-05 | F-03 / S1 maintenance | AC-09 / L7-AC01?06, revision minimum 20 / approval minimum 10 after trim (UTF-16) | TEST-09; L7-T01?06 | [Lab 7 unit](../server/tests/lab7-review.unit.test.ts), [API/DB](../server/tests/lab7-review.integration.test.ts), [UI](../client/src/App.lab7Review.test.tsx), [browser](../e2e/lab7-review.spec.ts) | Approved/reviewed/released on main b92b434; [Lab 7 execution](labs/lab-07/implementation-evidence.md); combined D2 RC NOT RUN |
| BR-06 | F-01–08 / all sprints | Existing AC-03/10; S2-F04-AC05; S2-F05-AC07/10; S2-F06-AC05; S3-F07-AC04/10; S3-F08-AC06 | TEST-03/10/23; new feature negative/session tests | [API/DB](../server/tests/api.integration.test.ts); [routing/privacy](../server/tests/routing-privacy.unit.test.ts); [client privacy/session](../client/src/App.sessionIsolation.test.tsx); new locations in register | Existing protection implemented; new access paths NOT RUN |
| BR-07 | F-05 / S2 | S2-F05-AC02 | S2-F05-T02 | [F-05 STS](sprints/sprint-2/f05-submissions.md) | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| BR-08 | F-06 grading / S2; F-07 peer / S3 | S2-F06-AC02; S3-F07-AC08 | S2-F06-T02; S3-F07-T10 | [F-06](sprints/sprint-2/f06-grading.md) / [F-07](sprints/sprint-3/f07-collaboration.md) | Proposed contract; not implemented; test IDs NOT CREATED / NOT RUN; no accepted release |
| NFR-01 | Auth + every protected new route / all sprints | AC-03; all new route authentication cases | TEST-03/14/19; S2-F04-T07; S2-F05-T07; S2-F06-T05; S3-F07-T04/12; S3-F08-T06 | [API/DB](../server/tests/api.integration.test.ts); [routing/privacy](../server/tests/routing-privacy.unit.test.ts); [new locations](sprints/deliverable-2/verification-register.md) | Baseline verified historically; new routes NOT RUN |
| NFR-02 | Role/ownership + private DTOs / all sprints | AC-10; every new role/ownership path | TEST-10/23; S2-F04-T07; S2-F05-T07/12; S2-F06-T05; S3-F07-T04/12; S3-F08-T06 | [API/DB](../server/tests/api.integration.test.ts); [routing/privacy](../server/tests/routing-privacy.unit.test.ts); client directory/session suites; new tests planned | Existing protection retained; every new route still requires direct backend negative checks |
| NFR-03 | Credential handling / serializers / UI | AC-01/02; UIR-AC01/06 | TEST-01/02/19; UIR-T01/07; explicit changed-source/DTO review | [API/DB](../server/tests/api.integration.test.ts); [UIR STS](ui-refresh-spec.md) | Baseline credential checks exist; Quick Fill removal NOT implemented; no global zero-secrets claim from a green test |
| NFR-04 | Persistence/version transactions / F-02–08 | AC-04/07/09 + new feature save/readback/history/race AC | TEST-04/07/09/15–18/21/22; per-feature I/E checks | [API/DB](../server/tests/api.integration.test.ts); [E2E](../e2e/sprint1.spec.ts); new planned paths in register | Historical persistence verified; new migrations/transactions/candidate NOT RUN |
| NFR-05 | Build/container/GCP/health / system | Existing AC-01 + timed startup measurement | TEST-01; production/Docker CI; D2-SYS-T01 | [API/DB](../server/tests/api.integration.test.ts); [CI workflow](../.github/workflows/ci-docker.yml); planned startup record | Historical health/build checks; ≤10s startup NOT MEASURED here; new RC/deployment pending |

### Existing baseline results and their limits

Accepted source: `aeb804ea5bc667399b00cf54df10046a6ded46e0` after Lab 6.
[Preparation CI 45001981946](https://github.com/Magiciancat9/Course_management/actions/runs/45001981946)
passed on `dfe5d25...` (Lab 7 request/CI-routing changes, domain unchanged).
That is historical preparation evidence, not an implemented F-04–08 or
submitted D2 candidate result. Do not reuse an unrelated green check for a
new AC. Existing client files also include `App.directoryPrivacy.test.tsx`,
`App.sessionReview.test.tsx` and `App.sessionIsolation.test.tsx`.

## 2. Allocation versus executable coverage gaps

- Every FR-01–12, BR-01–08 and important NFR-01–05 is allocated above.
  This is not “zero untested requirements”: FR-06–12, BR-07, new BR-08
  behavior and new access/persistence paths remain unimplemented/unexecuted.
- New F-04?08 feature AC remain NO implementation / NOT RUN in the
  register. Their proposed STS is not a substituted executable test.
- Original Sprint 1 continuity must rerun on the integrated candidate,
  including migration/version effects, roles/ownership and session privacy.
- NFR-05's ≤10s startup goal needs actual timed evidence; a health 200 or
  Docker build alone does not measure it. Planned D2-SYS-T01 records it.
- Contract review is recorded in PR #107. New-feature genuine RED/GREEN, accepted Sprint 2 main/tag,
  implemented/tested Sprint 3 progress, current RC/CI/GCP checks and final
  assessed PDF/receipt are still pending. See [continuity and finish plan](sprints/deliverable-2/continuity-and-status.md).

## 3. Approved Changes Log

| Change ID | Date | Affected IDs | Description of Change & Rationale | Approved By |
| :--- | :--- | :--- | :--- | :--- |
| **CHG-01** | 2026-11-05 | `BR-03`, `F-03` | Replaced terminal `REJECTED` state with `REVISION_REQUESTED` so teams whose proposals are rejected by an Instructor can revise and re-submit (`REVISION_REQUESTED` → `SUBMITTED`) without creating orphaned team records. | Pawarit & Tatchakorn |
| **CHG-02** | 2026-11-05 | `F-01`, `AD-02` | Added server-side token revocation tracking on `POST /api/auth/logout` in addition to client token removal, ensuring that reusing a logged-out JWT against protected backend endpoints is immediately rejected with `401 Unauthorized`. | Pawarit & Tatchakorn |
| **CHG-03** | 2026-11-06 | `F-01`, `AC-03`, `AD-02`, `NFR-03` | Require an explicitly configured JWT secret and persist logged-out token identifiers in PostgreSQL, so startup fails safely and revocation survives server restarts. | Pawarit & Tatchakorn |
| **CHG-04** | 2026-11-06 | `NFR-01`, `NFR-04` | Replaced unverified timing targets with observable authentication rejection and PostgreSQL persistence requirements; timing targets had no measuring test. | Pawarit & Tatchakorn |
| **CHG-05** | 2026-11-08 | `FR-02`, `F-02` UI | Approved deferring self-service team joining from Sprint 1. Students join an existing team when a current team member adds them by university email, matching the implemented ownership-guarded API and UI. | Tatchakorn Thamnimitr |
| **CHG-06** | 2026-11-22 | F-01 UI / shared presentation | User requested modern UI and removal of the demo Quick Fill box; real email/password auth remains. Detailed [UIR plan](ui-refresh-spec.md) reviewed via PR #107; UI implementation merged via PR #110. This is approved direction, not an implemented/reviewed design claim. | Tatchakorn (user instruction); PR #107/#110 review history |

| **CR-L7-01** | 2026-11-22, 20:18 Asia/Bangkok | `FR-05`, `BR-05`, `F-03`, `AC-09` | Increase only REVISION_REQUESTED feedback minimum from 10 to 20 after trim/UTF-16 count; APPROVED stays 10. [Approval image/transcript](labs/lab-07/approval-record.md), [pre-change lock](labs/lab-07/pre-change-baseline.md) and [revised contract](labs/lab-07/revised-contract.md) record rationale, scope and conditions. Implemented and released through PR #113; Lab 7 evidence retains real RED/GREEN and release results. | P'Tik (TA), user-supplied identity/date; user confirms progress. Teammate contract review completed in PR #105 before code; implementation/release in PR #111/#113; maintained main b92b434 |

## 4. Reviewed policies and remaining verification

| Item | Scope / current decision |
| --- | --- |
| CR-L7-01 / [#85](https://github.com/Magiciancat9/Course_management/issues/85) | Approved and released: revision20/approval10; Lab 7 #92 closed Completed and user confirms LEB2 submission. Final D2 candidate regression remains required. |
| DD-S2-01–04 / DD-S3-01–04 | Concrete proposed contract clarifications in [shared contract](sprints/deliverable-2/shared-contract.md): URL/late/version/role, peer completion/rating and metric/CSV policies. Reviewed/merged in PR #107; preserve justified revisions before implementation. |
| UIR v1.0 detailed design | Specification reviewed in PR #107; implementation merged in PR #110. Combined Lab 7/UI tests are required on this integration. |

No instructor/TA approval, independent teammate review, test run, feature
completion or release is inferred from document authorship. Keep all
approved baseline change rationale/history; do not rewrite it after code.
