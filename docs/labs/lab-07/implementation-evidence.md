# Lab 7 implementation and test-first evidence — L7-E05–E08

**Recorded:** 22 Nov 2026, Asia/Bangkok. Work: [#87](https://github.com/Magiciancat9/Course_management/issues/87), [implementation PR #111](https://github.com/Magiciancat9/Course_management/pull/111).
Driver/author `Magiciancat9`, assisted by Codex AI. Local tests were invoked
by Codex; CI tests ran in GitHub Actions. Independent **code** review by
`martinvadre`, integration and deployment remain pending. The actual earlier
contract review is a separate completed event, not code approval.

## 1. Approval, contract and immutable sequence

| Event | Actual identity / result |
| --- | --- |
| L7-E01 TA approval | P'Tik (TA), 22 Nov 2026 20:18 +07; [original image/transcript](approval-record.md); user confirmed continuation |
| L7-E02 locked old implementation | `lab7-pre-change-20261122` → `dfe5d25ec8934161d3ece5726d7611d64c044c52`; [source identities](pre-change-baseline.md) |
| L7-E03 contract approval | martinvadre APPROVED contract `947b914dc6b7915b6d825e52f18299191ffe6cb0`, 21:22:38 +07; [actual review](https://github.com/Magiciancat9/Course_management/pull/105#pullrequestreview-6012714738) |
| L7-E04 reviewed staging base | PR #105 merged by martinvadre at 22:16:10 +07 → `6429479316f7f156ecb49bb106630ab80fa6096c`; runtime/test/schema still match pre-change |
| L7-E05 test-only RED | [`6281634c31cc8d02e82e39e7bce40e13ee8640f6`](https://github.com/Magiciancat9/Course_management/commit/6281634c31cc8d02e82e39e7bce40e13ee8640f6), started `2026-11-22T22:34:20.322971+07:00`; 3 failed / 32 passed / 0 skipped |
| Additional test-only coverage | `e2f29887ab85766990eb3edada16d43935c3aec9`: API/DB, component and E2E cases committed before runtime code |
| L7-E06 implementation / GREEN | [`7aae232b83f97062cc5d03dbc448eddc909ac00e`](https://github.com/Magiciancat9/Course_management/commit/7aae232b83f97062cc5d03dbc448eddc909ac00e), started `2026-11-22T22:39:29.532920+07:00`; same unit file 35 passed / 0 failed / 0 skipped |
| Explicit API invalid-value fixture update | `133061e705ca4c2ab1ce1c8788a20f6a8d16e95b`; array feedback wrapped as one explicit API fixture rather than being unpacked as a test row |
| L7-E07 full candidate CI | [Run 45039794731](https://github.com/Magiciancat9/Course_management/actions/runs/45039794731) **SUCCESS** on `133061e705ca4c2ab1ce1c8788a20f6a8d16e95b`; full runtime/test candidate before this evidence-only commit |
| Current PR / release distinction | PR #111 awaits actual code review/merge. The code-head CI above and this later evidence-only revision differ only in documentation; latest exact-head results are linked in #87/PR #111. No maintained main release or GCP revision exists yet |

## 2. L7-E05: new behavior fails on old code

Working directory: the isolated feature worktree's `server` folder.
Node.js 24.14.0 / Vitest 2.1.9, Windows. Runtime at test-only commit matches
locked `dfe5d25`; no implementation change was present. Command:

```text
node node_modules/vitest/vitest.mjs run --config vitest.config.ts tests/lab7-review.unit.test.ts --reporter=verbose --reporter=json --outputFile=<outside-Git>/red-unit.json
```

Actual unchanged test setup/assertions (the first case in the committed file):

```ts
const result = validateInstructorReview('SUBMITTED', 'REVISION_REQUESTED', 'r'.repeat(19));
expect(result.valid).toBe(false);
expect(result.status).toBe(400);
expect(result.code).toBe('BR05_FEEDBACK_TOO_SHORT');
```

Readable selected actual RED output:

```text
FAIL tests/lab7-review.unit.test.ts
L7-T01: rejects 19-unit REVISION_REQUESTED feedback on a SUBMITTED proposal
AssertionError: expected true to be false // Object.is equality
Expected: false
Received: true
expect(result.valid).toBe(false)  // line 7

Test Files  1 failed (1)
Tests       3 failed | 32 passed (35)
Exit code: 1; skipped: 0
```

The other two failures are padded 19-unit feedback and Unicode feedback of
19 UTF-16 units. All three fail because the old minimum-10 implementation
accepts feedback that the approved new requirement must reject. These are
assertion failures, not compilation, fixture, database or startup failures.
Existing valid 10-unit approvals remain passing in that same test-only run.

## 3. L7-E06: same tests pass after bounded code

The identical command/file ran against committed implementation
`7aae232b83f97062cc5d03dbc448eddc909ac00e`, using `green-unit.json` as the output filename.

```text
Test Files  1 passed (1)
Tests       35 passed (35)
Exit code: 0; failed: 0; skipped: 0
```

The entire unit test file was unchanged between RED and GREEN:

- Git blob: `382ed92ac21a2a5dd0adafc86b2252ac36c3ab38` at both commits.
- Same local-file SHA-256: `6716b1a0f5968057b9cdf4e66bef43c45bac959516c5d20aac6c59f927e97b38`.
- No failing assertion was weakened, disabled, deleted or conditionally skipped.

Actual runtime change, in `server/src/utils/domainRules.ts` after existing
state and decision checks:

```ts
const feedback = typeof reviewFeedback === 'string' ? reviewFeedback.trim() : '';
const minimumFeedbackLength = decision === 'REVISION_REQUESTED' ? 20 : 10;
if (feedback.length < minimumFeedbackLength) {
  // Existing 400 / BR05_FEEDBACK_TOO_SHORT; error text reports this decision's minimum.
}
```

The review endpoint/transaction is unchanged. The existing guarded caller
persists trimmed feedback only after validation. No schema/migration, old-data
rewrite, auth policy, team-ownership change or deployment-workflow edit occurs.

The instructor UI retains both actions and shows **Approve: minimum 10 after
trim. Request revision: minimum 20 after trim.** Label/input and action hints
are associated accessibly. Backend enforcement is authoritative: no common
minimum-20 control prevents valid approval at 10, and server rejection keeps
the same-session feedback text without announcing success.

## 4. L7-E07: actual suite execution and environment

Full CI: Ubuntu hosted runner, Node.js 20, Python 3.14, disposable PostgreSQL
16 Alpine, Playwright Chromium. Database setup/seed resets are isolated in CI.
The new real-DB suite and browser test explicitly require a local/CI database
whose name ends in `_test` and reject production execution.

| Command / named suite | Actual result on `133061e` | Scope |
| --- | --- | --- |
| `npm run test:server` | **100 passed / 0 failed / 0 skipped**, 5 files | Existing API 24 + routing/privacy 8 + domain 9; new Lab 7 domain 35 + real API/PostgreSQL 24 |
| `npm run test:client` | **20 passed / 0 failed / 0 skipped**, 5 files | Existing App/session/directory 16 plus new Lab 7 UI 4; request mocks are component fixtures, not DB proof |
| `npm run test:e2e` | **4 passed / 0 failed / 0 skipped**, Chromium | Existing Sprint 1 TEST-11/12/20 plus the real Lab 7 changed/preserved workflow |
| `npm run build` | PASS | Backend TypeScript/Prisma client and frontend TypeScript/Vite production build |
| `docker build --tag course-pms:ci .` | PASS | Image build; not a deployment, container-start timing measurement or production smoke |

Application tests total **124 passing checks** across distinct levels; do not
mix that denominator with deployment-stub/Python smoke unit checks or earlier
Lab 6 targeted/replay totals. Separately, local client regression was 20/20
on implementation `7aae232`, using `NODE_OPTIONS=--no-experimental-webstorage`
for Node 24's test environment; CI uses Node 20 without that local flag.

The local Docker engine was not running, so real DB/E2E were not run locally;
the linked CI is their actual execution source. Raw local JSON/logs and CI
downloads stay outside Git. No retained new screenshot artifact is claimed;
the browser persistence assertions and named CI result are actual evidence.

## 5. AC → actual tests and relevant preserved behavior

| Approved AC | Real executable coverage / observed result |
| --- | --- |
| L7-AC01 | `server/tests/lab7-review.unit.test.ts` L7-T01 and real `lab7-review.integration.test.ts`: revision 19 rejected / 20 and 21 saved. PASS |
| L7-AC02 | Unit/API L7-T02: JS trim including NBSP, missing/blank/wrong types, 19-unit surrogate boundary, ten surrogate pairs =20, zero-width-space semantics. PASS; API fixtures pass array as an explicit value |
| L7-AC03 | Unit/API L7-T03: approval 9 rejected, 10/11 accepted; invalid decision keeps VALIDATION_ERROR; component/browser approve with10. PASS |
| L7-AC04 | New unit/API L7-T04 preserves non-SUBMITTED precedence, anonymous401, student403, missing404 and unchanged rows; existing TEST-18 competing-decision test retained. PASS |
| L7-AC05 | New API L7-T05 compares full rejected row, trimmed saved state/actor/time and owning/instructor GET; both historical review states retain 10–19-unit feedback. `e2e/lab7-review.spec.ts` reads saved revision20 then final approval10 after reload. PASS |
| L7-AC06 | `client/src/App.lab7Review.test.tsx` checks hints, request body, rejection-text retention, truthful success; new API enforces roles/foreign privacy; browser follows revision/resubmit/approval. Existing delayed-session/directory/routing suites retained. PASS on CI scope |

The full existing suites protect BR-01/02 membership/capacity, BR-03/04
state/completeness, BR-06 access, authentication/logout, persisted drafts,
concurrent writes, session isolation, roster-only privacy and JSON routing.
Original tests were not modified or removed. Component mocks and CI browser
checks are not deployed race injection or personal student UAT.

## 6. Outstanding review/release gates

- Actual independent implementation review and merge of PR #111 remain
  pending; keep #87 open / In review until they occur, even with passing CI.
- #88 remains the teammate's regression/signoff task; this execution is an
  available candidate input, not a claim of completed independent signoff.
- #89 retains reviewed main/GCP release and changed 19/20 plus preserved
  approval10/domain/access/persistence post-deploy checks. No deployment now.
- The separate #106 modern UI / PR #110 is not in this Lab 7 source. When
  integrating it, reconcile the same panel/hint expectations and rerun the
  affected UI/session/browser suites; retain both reviewed scopes.
- #90–92 use actual maintained-release metrics/readiness and final assessed
  Parts A–D assembly; this record supplies RED/GREEN and candidate evidence.
