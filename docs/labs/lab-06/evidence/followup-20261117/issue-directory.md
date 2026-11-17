The user confirmed on 17 November 2026 that CoursePMS must follow the existing roster-only rule: students may see other teams and members, but no proposal metadata or detail belonging to another team.

At candidate 316abac98c721078154588c37ad9f0eda655d9d6, `GET /api/teams` in `server/src/app.ts` includes another team's proposal title, id, status, revisionCount and updatedAt. This conflicts with `docs/system-sds.md` section 3.3 (foreign student: public roster only), SRS Student privacy and BR-06. This is the now-resolved directory clarification from fastTrack's 17 November follow-up; it is separate from the four-field client-memory bug #71.

Technical disposition: accepted defect, Major (cross-team private draft metadata exposure through the directory). This does not establish unauthorized private-body access or writes.

Expected: an authenticated student's own team keeps its complete proposal; every foreign team has `proposal: null`; instructor responses keep complete proposals. An unassigned student receives rosters with no proposals. Keep existing ownership/detail-route denials intact. Add focused mocked-repository HTTP regressions and real disposable-database coverage in CI. No production data changes are needed.

Related: #55, #56, #73. Proposed implementation driver remains @martinvadre; no personal execution or approval is implied. This issue remains open until the existing teammate-review/release/retest rules are satisfied.
