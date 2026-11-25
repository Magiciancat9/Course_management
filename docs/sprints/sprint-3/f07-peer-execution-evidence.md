# F-07 peer evaluation - implementation and actual execution (#101)

**Date:** 25 November 2026, Asia/Bangkok. **Driver:** Magiciancat9.
**Independent code reviewer:** martinvadre, pending. This is candidate execution,
not reviewed integration, accepted main, deployment or personal student UAT.
The unchanged complete [F-07 contract/AC/STS](f07-collaboration.md) and shared
DD-S3-01/02 were independently reviewed in PR #107 before implementation.

## 1. Source, genuine RED and GREEN

| Boundary | Exact source / actual result |
| --- | --- |
| Reviewed starting staging | `e96374976f566ce462dca5c5d6de4f394e30c700`, PR #121; incorporates independently reviewed tasks #120 and S1/S2 baseline |
| Test-only RED | `bb32e5982cf916a1102c557087c15c02cf199c74`; [CI45619704492](https://github.com/Magiciancat9/Course_management/actions/runs/45619704492): 179 existing server tests PASS, seven new peer API tests FAIL on missing endpoint/behavior. This is behavioral RED, not compiler/setup failure |
| First runtime GREEN | `70beb09d0a190949ea4e914fc84a31195d828b4f`; [CI45621350347](https://github.com/Magiciancat9/Course_management/actions/runs/45621350347), 25 Nov20:13:15-20:16:03 Asia/Bangkok (13:13:15-13:16:03 UTC), workflow_dispatch at that exact commit: **192 server /63 client /9 browser PASS**; all six migrations, builds and Docker PASS |
| CI system measurement | Same exact runtime; D2-SYS-T01 **304.02ms <=10,000ms PASS**, at13:15:56.530688 UTC; image `sha256:10d3af1a0d2651f8f024dab03b98208106913a56cc7220a12f76f4eb348ad413`, health source/DB readiness/HTML PASS. CI container measurement, not Cloud Run cold-start timing |
| Follow-up candidate | Adds a UI retry when the initial milestone catalogue fails before selection, plus its regression case. Final PR-head CI is recorded separately; the earlier 63-client result is not relabelled 64 |

Local execution used Node, PostgreSQL on127.0.0.1:55432, dedicated disposable
`course_pms_f07_test`, and explicit test-only JWT configuration. Destructive
seed/reset guards remain unchanged; no existing developer/preview/production
DB was reset. The existing Sprint2 preview on5173 remained available; local
peer browser execution used a temporary config outside tracked files on5183
with API3000. CI uses PostgreSQL16 and its own disposable `course_pms_test`.
No dependency or lockfile change was needed.

Commands actually executed:

```text
npm --prefix server run prisma:migrate:deploy
npx prisma generate                      # working directory server
npm --prefix server test
npm --prefix client test
npm --prefix server run build
npm --prefix client run build
npx playwright test --config test-results/playwright.peer.local.config.cjs e2e/sprint3-peer-evaluation.spec.ts
```

The CI above additionally runs the complete browser suite, deployment-script
checks, six migrations, production application/Docker build and container
startup/source/readiness check. All evidence is Codex-operated automated
synthetic execution. No manual student UAT, GCP peer deployment or release
acceptance is inferred.

## 2. Implemented scope and confidentiality

- New additive `PeerEvaluation` model/migration, unique milestone/evaluator/
  evaluatee pair, server-derived author/time/version, DB rating1-5/no-self/
  positive-version constraints. No existing migration or legacy row rewritten.
- Published milestone, server time at/after dueDate, and this team's real
  submission are required for writes. A grade is not required. Author and
  target must be current team students; self-rating and foreign targets fail.
  This follows the reviewed peer contract; task/submission APPROVED rules
  are preserved without inventing an extra peer prerequisite.
- Rating integer1-5, optional comment trimmed <=2000 UTF-16 units, body
  allowlist, canonical int32 IDs, pagination limit1-100, expectedVersion0 on
  creation/current version on update. Omitted update comment preserves it;
  explicit empty comment clears it. Version conflicts write nothing.
- Team and milestone row locks serialize pair creation/update and deadline
  edits; two waiting writers with the same expectedVersion yield one success
  and one409, with one pair/current version. No peer-to-grade adjustment.
- `/me` returns only the authenticated student's outgoing records and server
  eligibility. There is no incoming-feedback route. The full collection is
  instructor-only; instructors cannot write or use student-only `/me`.
  Explicit DTO selection/no-store avoid credential fields or public peer
  embedding. No confidential payload is logged on failed operations.
- UI adds labelled team/milestone/other-teammate/rating/comment controls,
  server eligibility, pending/empty/error/success, own saved cards and
  read-only instructor pages. Own outgoing pages are loaded before choosing
  an existing pair. Conflict reload retains the typed draft and updates only
  expectedVersion; a second explicit save is required. Epoch/generation/token/
  team/milestone guards discard stale requests, including switch-away-and-back.

The reviewed API paths remain unchanged. `/me` and instructor GET additionally
return `{eligibility:{canEvaluate,reason,dueDate,serverTime}}`; client eligibility
is advisory, and every write rechecks the server prerequisites. Explicit
rating/comment errors and HTTP statuses follow the contract.

## 3. Final candidate AC mapping (all F-07 scope)

| AC | Actual executable check and result | Integration / release boundary |
| --- | --- | --- |
| S3-F07-AC01 | Existing `collaboration.integration.test.ts` T01 task creation/independent DB readback, PASS in runtime GREEN | Reviewed task #120; final combined release pending |
| S3-F07-AC02 | Existing task T02/unit and populated task SQL, PASS in runtime GREEN | Same task boundary |
| S3-F07-AC03 | Existing task T03 transitions/reopen/immutable event versions, PASS in runtime GREEN | Same task boundary |
| S3-F07-AC04 | Existing task T04 anonymous/foreign/role/removed-member denials with unchanged rows/events, PASS | Same task boundary |
| S3-F07-AC05 | Existing task T05/T06 lock-controlled concurrency/filter/cursor checks, PASS | Same task boundary |
| S3-F07-AC06 | Existing `Collaboration.test.tsx` T07 and `sprint3-collaboration.spec.ts` T08 keyboard lifecycle/reload/denial, PASS | Same task boundary; no residual task AC discovered |
| S3-F07-AC07 | `peer-evaluation.integration.test.ts` T09: due-1ms/equal/+1ms, draft/future/no own submission, rejected rows unchanged, historical read after extension; unit completion boundaries; SQL T09-M; PASS | Peer independent implementation review/staging integration/main acceptance pending |
| S3-F07-AC08 | Peer API T10 + unit trim/UTF-16, types/rating/comment/version/ID bounds, self/foreign/non-current target checks; PASS | Same peer boundary |
| S3-F07-AC09 | Peer API T11: normalized own pair create/update, immutable author/id/creation metadata, independent outgoing/DB read, duplicate0 conflict and no grade adjustment; pagination T11/T12; browser T15; PASS | Same peer boundary |
| S3-F07-AC10 | Peer API T12: all three methods/routes anonymous/role/foreign checks, removed membership, own-student full-collection denial, instructor read, general team/proposal/task/milestone DTO negatives; browser T15 direct teammate/foreign denials and unchanged saved rows; PASS | Same peer boundary |
| S3-F07-AC11 | Peer API T13, two barrier-controlled cases for initial0 and update1: observed two DB lock waiters, one winner/409, one unique pair, exact winner readback; PASS | Same peer boundary |
| S3-F07-AC12 | `PeerEvaluation.test.tsx` T14: eligibility/no-self UI, draft retention, duplicate guard, conflict reconcile, outgoing pages, identity/generation, team switch-back and delayed milestone response,401; `sprint3-peer-evaluation.spec.ts` T15: real keyboard save/update/reload, no incoming disclosure, instructor read; PASS. Follow-up retry case separately named in final PR CI | Same peer boundary; personal UAT/final accepted release not claimed |

Actual source files:

- [API/PostgreSQL tests](../../../server/tests/peer-evaluation.integration.test.ts)
- [Unit boundary tests](../../../server/tests/peer-evaluation.unit.test.ts)
- [Populated SQL migration test](../../../server/tests/peer-evaluation-migration.integration.test.ts)
- [UI state/session tests](../../../client/src/features/collaboration/PeerEvaluation.test.tsx)
- [Real browser/API workflow](../../../e2e/sprint3-peer-evaluation.spec.ts)
- [Service](../../../server/src/services/peerEvaluationService.ts),
  [routes](../../../server/src/routes/peerEvaluations.ts),
  [UI](../../../client/src/features/collaboration/PeerEvaluation.tsx),
  [additive SQL](../../../server/prisma/migrations/20261125040000_f07_peer_evaluations/migration.sql).

The new SQL test applies the actual init/F04/F05/F06/task migrations in an
isolated schema, inserts populated user/course/team/member/proposal/revoked
session/milestone/submission/content-version/draft/publication/task/event
fixtures, snapshots all13 old tables, applies the actual peer migration and
asserts identical snapshots/no invented evaluations. It then inserts a valid
peer record, verifies DB self/rating/unique/FK constraints through savepoints,
and verifies the old snapshots again. CI separately proves an empty database
can apply the full six-migration history.

Test design provenance: dedicated peer filenames split the original planned
collaboration test grouping while retaining T09-15/AC07-12. After GREEN began,
one newly written DTO-negative test was corrected from nonexistent GET
`/api/teams/:id` to existing protected GET `/api/teams/:id/proposal`; the
expected200 and no-private-peer-payload assertions remain. No baseline test
or contract expectation was weakened. The migration test strips SQL line
comments before statement splitting, preserving the executed migration SQL.

## 4. Selected evidence and remaining gates

[Runtime browser artifact](https://github.com/Magiciancat9/Course_management/actions/runs/45621350347/artifacts/15026435203)
contains synthetic task checkpoint, peer outgoing version2 and instructor
read-only screenshots. [Startup artifact](https://github.com/Magiciancat9/Course_management/actions/runs/45621350347/artifacts/15024323385)
contains the exact runtime measurement. Actions retention is90 days; final
selected evidence must be retained outside public Git before expiry.
Local visual inspection confirmed readable labelled fields/cards at1366x900;
no full-product mobile/200% zoom/rendered-contrast acceptance is claimed.

Remaining: martinvadre independently reviews the actual PR head, successful
exact-head CI, then teammate staging integration and accepted main/final UAT
evidence. #97's original accepted S2 identity must remain preserved before
S3 main promotion. #93/#103/#100/#104 retain their real release/reconciliation
gates. F-08 remains #102's unimplemented scope; this implementation does not
claim analytics/CSV acceptance or close #101 automatically.
