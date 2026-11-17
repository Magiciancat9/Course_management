# Resolved contract dispositions — 17 November 2026

The user selected the existing **roster-only** contract in this coding session: students see other teams and members, but no foreign proposal metadata or detail. Codex records and implements that instruction as a review candidate; no teammate approval, deployment or independent acceptance is implied.

## Directory proposal summaries — accepted defect, Major, Issue #74

Versioned evidence at pre-fix candidate `316abac98c721078154588c37ad9f0eda655d9d6`:

- `docs/srs.md`, Student responsibilities and BR-06: private proposals belong to their team; authorized instructors retain access.
- `docs/system-sds.md` section **3.3**, permission matrix: foreign student gets **Public roster only** from `GET /api/teams`.
- `server/src/app.ts`, directory sanitizer: nevertheless returned foreign `id`, `teamId`, `title`, `status`, `revisionCount` and `updatedAt`.

The versioned contract plus the user's explicit policy decision resolve the earlier ambiguity. [Issue #74](https://github.com/Magiciancat9/Course_management/issues/74) records an accepted Major privacy defect. This is separate from #71's client-memory exposure. It does not establish foreign-body access or writes.

Candidate behavior: own-team and instructor proposals remain complete; foreign teams have `proposal: null`, including for unassigned students. Teams and member rosters remain visible. The UI displays **PRIVATE** for foreign proposal state, avoiding the false inference that `null` means no draft exists. The negative-inspection control remains available and existing private detail/review endpoints retain authorization checks.

## Bare proposal collection GET — accepted routing defect, Minor, Issue #75

The same pre-fix version's `docs/sprints/sprint-1/f01-auth-and-roles.md`, **AC-03**, explicitly names `/api/proposals` among protected endpoints. SDS section 3.2 specifies JSON APIs. SDS section 3.3 defines team-scoped proposal GET and proposal-ID review POST; it defines **no bare collection-list capability**. Before the correction, production wildcard GET served the SPA HTML for the unsupported collection path, including without authentication.

[Issue #75](https://github.com/Magiciancat9/Course_management/issues/75) records an accepted **Minor** authentication/routing-contract defect. No private-data disclosure was observed on that path; the absence of a collection-list feature is not itself a defect.

Candidate behavior:

| Request | Result |
| --- | --- |
| Unsupported `/api/proposals` route without a valid session | JSON 401; existing auth rejection codes apply |
| Unsupported `/api/proposals` route after valid authentication | JSON 404 `API_ROUTE_NOT_FOUND` |
| Other unknown `/api` path | JSON 404 `API_ROUTE_NOT_FOUND`; never SPA HTML |
| Existing supported API routes | Existing handlers and authorization unchanged |
| Frontend navigation outside `/api` | Existing SPA HTML fallback retained |

No proposal collection endpoint or foreign-read exception is introduced. This resolves L6-OUT-EXP-002's contract question using existing criteria; the changed routing contract is explicit in the candidate documents and tests.

## Actual proof and limits

RED test commit `dd45d9e`: production-routing/privacy mocked-repository HTTP tests **6 failed / 2 passed**; client directory tests **1 failed / 14 passed**. Failures were real behavioral assertions against pre-fix code, not startup errors.

GREEN code commit `b29109d531ca47eace1b13f55076dbcbb9509c14`: local HTTP/domain tests **17 passed**, client **15 passed**, production build passed. Full [CI 44037614365](https://github.com/Magiciancat9/Course_management/actions/runs/44037614365) passed **41 backend / 15 client / 3 E2E**, zero skipped, plus production and Docker builds. Backend count includes **24 real database integration + 9 domain + 8 mocked-repository routing tests**. [CI summary](evidence/followup-20261117/code-ci-summary.txt), [CI metadata](evidence/followup-20261117/code-ci-status.json), [RED HTTP](evidence/followup-20261117/contract-red.txt), [RED UI](evidence/followup-20261117/directory-ui-red.txt), [GREEN HTTP/domain](evidence/followup-20261117/contract-green.txt), [GREEN UI](evidence/followup-20261117/client-green.txt).

The correction is on continued [Draft PR #73](https://github.com/Magiciancat9/Course_management/pull/73), not the live service. Human review, integration, authorized release and affected independent retest remain pending. Real student contributions and either product's acceptance are not supplied by these technical dispositions.
