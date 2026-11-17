The 17 November fastTrack follow-up asked CoursePMS to resolve bare `GET /api/proposals` returning SPA HTML. Source assessment at candidate 316abac98c721078154588c37ad9f0eda655d9d6 found a concrete existing contract: `docs/sprints/sprint-1/f01-auth-and-roles.md`, AC-03, explicitly lists `/api/proposals` among protected endpoints. The SDS endpoint table defines team-scoped proposal GET and proposal-ID review POST; it defines no collection-list capability.

Current implementation has no collection handler/auth boundary; the production wildcard GET returns SPA HTML, including for an unauthenticated request. Technical disposition: accepted defect, Minor (authentication/routing-contract mismatch; no observed private-data disclosure or authorization bypass).

Expected: `/api/proposals` and its unsupported paths require authentication; after valid authentication, an unsupported route returns JSON 404 `API_ROUTE_NOT_FOUND`. Unsupported API paths must not reach the SPA HTML fallback. Existing login/health/readiness endpoints and supported team/review routes retain their behavior. No collection-list endpoint or authorization exception is added.

Add regressions that load the real production Express routing with synthetic mocked repository fixtures and test unauthenticated, authenticated, unknown API and frontend-navigation behavior; real database regressions remain in CI. Preserve a genuine RED/GREEN trace.

Related: #55, #56, #73; incoming clarification L6-OUT-EXP-002. Proposed implementation driver @martinvadre; no personal execution or approval is implied. No deployment or acceptance is authorized by this issue.
