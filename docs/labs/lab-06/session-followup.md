# Session isolation follow-up verification

This preserves the original #71 proof chain. The later fastTrack reply is
handled in [follow-up response](followup-response.md); [contract dispositions](contract-dispositions.md)
record the additional #74/#75 correction and 41-backend/15-client/3-E2E CI.
Use the latest #73/export metadata for the final candidate head.

Date: 17 November 2026, Asia/Bangkok. Operator: Codex. Human reviewer approval: **PENDING**.

## Version chain

| Stage | Version | Evidence |
| --- | --- | --- |
| Reported live baseline | `9c22735995c985aaa0622b6b179de1ac9c1f80ca` | Incoming private run CPMS-L6-20261114-155049, UI-24–26 |
| Original RED | `d3ea0116006c7338f6d7f54aaf7c7b3f4e9ffb63` | [New replay output](evidence/session-followup/original-red-replay.txt): 5 failed / 4 passed / 0 skipped |
| Existing correction | `3b7de94040f8944aae2db3b751f4c91cdf8907fb` | Existing [PR #72](https://github.com/Magiciancat9/Course_management/pull/72), head `2e3f22a34faa53ec87070e61b49d6b35e438a92c` |
| Follow-up RED | `9834080` | [Output](evidence/session-followup/red.txt): 3 failed / 11 passed / 0 skipped; five new tests against unchanged #72 implementation |
| Follow-up GREEN code | `6de3c9a8b3404b831041a9b9fe855d1d52f9cac3` | [Output](evidence/session-followup/green.txt): 14 passed / 0 skipped |
| Follow-up CI routing | `5e116003ce9db71e844a6a3a23fed64d0d277ef1` | Enables the existing CI for PRs into `fix/lab6-10-*`; no gate removed |
| Review candidate | `fix/lab6-10-session-boundary-followup` | [Draft PR #73](https://github.com/Magiciancat9/Course_management/pull/73), target is #72's branch |

Use the latest PR head and CI record for final review; later documentation commits do not change the GREEN code version. Exact current heads are available through `git rev-parse HEAD` and PR metadata, avoiding a self-referential commit hash in this document.

## Review findings and final behavior

1. `handleLogin` lacked the generation guard used by mutations. A delayed A login could replace B's token and identity after a storage switch. Capture and verify the generation before processing either success or failure.
2. `invalidateSessionBoundary` left banners and credential inputs intact. A prior successful proposal inspection exposes the private title in the next session. Clear banners and login fields together with workspace state; set only the new transition's success/error afterwards.
3. Adding a member reloaded saved proposal fields and discarded unrelated unsaved edits. That roster refresh now skips editor hydration within the same session. Initial login, save/submit refreshes and no-proposal initialization still hydrate normally; identity changes always clear first.
4. Preserve explicitly supplied Authorization headers; avoid replacing an explicit request identity with a closure's token.
5. Abort dashboard requests during effect cleanup and invalidate outstanding action/login generations on unmount.

New test file: `client/src/App.sessionReview.test.tsx`. Tests exercise delayed login, private banner/credential cleanup, all four unsaved fields during roster refresh, a genuinely pending B mutation while A finishes, and all four saved fields after unmount/remount. Existing tests retain no-refresh A/B switching, reverse/no-team/instructor destinations, own proposal, delayed dashboard responses, 401 invalidation, 400 error recovery and failed logout behavior.

## Commands actually executed

| Check | Command | Actual local result |
| --- | --- | --- |
| Original RED replay | `npm run test:client` in separate snapshot of original RED commit | Exit 1; 5 failed / 4 passed, expected assertion failures |
| Follow-up RED | `npm run test:client` at `9834080` | Exit 1; 3 failed / 11 passed |
| GREEN | `npm run test:client` after follow-up implementation | Exit 0; 14 passed, 3 files, 0 skipped |
| Production build | `npm run build` | Exit 0; server Prisma/TypeScript and client TypeScript/Vite passed; [output](evidence/session-followup/build.txt) |
| Domain unit regression | `npm --prefix server run test -- tests/domain.unit.test.ts` | Exit 0; 9 passed, 0 skipped; [output](evidence/session-followup/server-unit.txt) |
| Local integration/E2E/Docker | Environment inspection, `docker ps` | Not run locally: Docker engine pipe absent; disposable PostgreSQL unavailable. Never substitute a live database or seed production. Current-head CI runs these checks. |

An initial sandbox-only attempt could not resolve directories through esbuild; the actual recorded RED/GREEN runs succeeded in starting outside that sandbox. The product RED claims are assertion failures, not environment startup failures. Output was normalized to UTF-8/LF and ANSI color sequences removed for readability; original partner evidence was not changed.

## CI and review

Historical [run 43714404994](https://github.com/Magiciancat9/Course_management/actions/runs/43714404994) validates #72 head, not #73: backend 32 passed, frontend 9 passed, E2E 3 passed, production and Docker builds passed. No substantive reviews were present on #72 when checked on 17 November.

Follow-up run [44026535153](https://github.com/Magiciancat9/Course_management/actions/runs/44026535153) **passed** for head `5e11600`: backend **32 passed**, frontend **14 passed**, E2E **3 passed**, production build and Docker build passed. The job completed on 17 November at 12:49:15 Asia/Bangkok. See [retained run metadata](evidence/session-followup/ci-status.json) and [readable count excerpt](evidence/session-followup/ci-summary.txt). No tests were skipped. Any later changed head requires its own passing checks before review/integration.

## Deployment and retest limits

[Public readback](evidence/session-followup/public-readiness.json) on 17 November shows CoursePMS still serving `9c22735995c985aaa0622b6b179de1ac9c1f80ca`, HTTP 200 health and database-connected readiness. This is the unfixed baseline. It does not identify Cloud Run revision, digest or traffic. The previously recorded `course-pms-00008-hbv` metadata is historical, not a fresh cloud readback.

No gcloud executable was found in PATH or the checked standard installation locations. Authorized release owner must capture filtered current metadata, revision, image digest, traffic and console evidence as specified in [return package](return-to-fasttrack.md). No merge, deploy, seed, live mutation, acceptance or partner retest occurred in this follow-up.
