# fastTrack simulated exercise section 3.5 — verified retest

**Technical result: PASS; decision: Accepted for this exact retest.** This is the isolated controlled exercise requested by fastTrack, not a new naturally discovered Sprint 1 defect or a replacement for the existing CoursePMS correction history.

| Identity / time | Recorded value |
| --- | --- |
| Run | `20261119-103240-7a83` |
| Application | https://fasttrack-lab6-970128017651.asia-southeast1.run.app |
| Source at original browser start/end | `1bbe187c088b86d104a16e420058f17425f18828` |
| Revision | `fasttrack-lab6-00001-74k`, supplied by fastTrack; independent control-plane readback not performed |
| Original browser/API operator | Codex AI, on behalf of CoursePMS |
| Session | 19 November 2026, 10:32:39–10:49:46 Asia/Bangkok |
| Joint file review | Magiciancat9 and martinvadre, approximately 11:23 Asia/Bangkok, user-confirmed, with Codex assistance |
| Exact technical file comparison | 2026-11-19T04:23:18.044Z (11:23:18 Asia/Bangkok) |
| BEFORE snapshot database time | 10:42:36.820 Asia/Bangkok |
| AFTER snapshot database time | 10:51:57.192 Asia/Bangkok |

| Fixture | ID | Deadline, 19 November Asia/Bangkok |
| --- | --- | --- |
| BEFORE | `337e85e9-f190-42fb-a231-ceee30030a28` | 11:03:00 |
| LATE | `1343a467-89fa-4969-b6ce-eb54cc1b0340` | 10:38:00 |
| Preserved on-time submission | `e464cfe7-3c6e-4a9d-835c-310fe20b4ede` | Version 1, submitted 10:33:06.911 |

| Case | Actual result | Status / evidence |
| --- | --- | --- |
| CPMS-S35-01 | On-time native UI POST returned 201; same ID, version 1 and content after reload | PASS; [HTTP](evidence/fasttrack-s35-20261119/redacted-network.json), [reload image](evidence/fasttrack-s35-20261119/S35-01-same-work-after-reload.png) |
| CPMS-S35-02 | Form opened/filled before deadline, held open; real late UI POST returned 409 DEADLINE_PASSED and retained draft | PASS; [pre-deadline form](evidence/fasttrack-s35-20261119/S35-02-filled-before-deadline.png), [rejection](evidence/fasttrack-s35-20261119/S35-02-stale-form-late-409.png) |
| CPMS-S35-03 | One authenticated retry also returned 409 DEADLINE_PASSED; two late-list reads remained empty; exact on-time control unchanged | PASS; [API comparison](evidence/fasttrack-s35-20261119/saved-state-comparisons.json), [empty supervisor view](evidence/fasttrack-s35-20261119/S35-03-supervisor-late-empty.png) |

## Original database comparison

Both [BEFORE](evidence/fasttrack-s35-20261119/coursepms-before-database-snapshot.json) and [AFTER](evidence/fasttrack-s35-20261119/coursepms-after-database-snapshot.json) identify `fasttrack_lab6` on `fasttrack-lab6-db`. LATE has **zero submissions in both**. BEFORE has the same single version-1 submission, ID `e464cfe7-3c6e-4a9d-835c-310fe20b4ede`; title, URL and submittedAt match the saved 201 response.

All **16 comparisons PASS** in the [comparison record](evidence/fasttrack-s35-20261119/snapshot-comparison.json). The baseline database time follows the on-time save and precedes the late POST; the after time follows both rejected attempts and the final saved-list read. No database write or timestamp was fabricated from UI text.

## Provenance and limits

- The original files were supplied by fastTrack through the user; Codex compared the retained bytes locally. [Manifest](evidence/fasttrack-evidence-manifest-20261119.json) records original and published hashes.
- Database projections do not encode deployment source/revision; source is corroborated by original health at session start/end, while revision remains partner-supplied. Cloud log retrieval was not independently repeated.
- Snapshot projection omits description/author; their original UI/API observations remain separate evidence.
- Browser POSTs were forwarded once through Playwright interception to retain the actual response before app navigation. The retry was one authenticated fetch, with credentials kept in memory and omitted from published output.
- Human file-review time is approximate and user-confirmed. Original Codex browser actions are not attributed as personal human UI clicks.
- This publication performs no new live test, database mutation, deployment, reset, seed or clock change.

Reference: [pinned partner runbook](https://github.com/zerotwobook/fastTrack/blob/2b1a1f61b8c1d18adcdbc3d4219033627840604d/docs/labs/lab-06/simulation-3.5/coursepms-retest.md). Owner-side RED/GREEN, code review and deployment proof are separate from CoursePMS's retest; no new review/CI approval is claimed here.
