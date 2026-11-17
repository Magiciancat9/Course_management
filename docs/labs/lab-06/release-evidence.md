# Lab 6 corrected release evidence — 17 November 2026

**Corrected release deployed; later partner technical retest received and product-side acknowledged.** Eight deployed cases and RT-07 evidence/isolated replay pass on the released source; see [completed retest](coursepms-retest-completion.md). Formal independent human decisions remain pending. Original public/pipeline checks below retain their actual operators and limits; no new human signature or pipeline login PASS is inferred.

## Reviewed integration and deployment identity

| Field | Actual evidence |
| --- | --- |
| Release PR | [#76](https://github.com/Magiciancat9/Course_management/pull/76), `lab6-staging` -> `main` |
| Release head | `54ac5ee7678900bde9969b3c0aeac39635aea484` |
| Recorded independent release approval | `martinvadre`, exact head `54ac5ee…`, 17 November **18:30:53 Asia/Bangkok** |
| Main merge / deployed source | `aeb804ea5bc667399b00cf54df10046a6ded46e0`; release merged **18:31:58 Asia/Bangkok** |
| Reviewed-main verification | Deployment log: PASS commit `aeb804e…` via reviewed #76 head `54ac5ee…` before cloud authentication |
| Deployment run | [44074859743](https://github.com/Magiciancat9/Course_management/actions/runs/44074859743), **SUCCESS** |
| Project / region / service | `cpe334-kingnine` (859617270560) / `asia-southeast1` / `course-pms` |
| Immutable image | `asia-southeast1-docker.pkg.dev/cpe334-kingnine/course-pms/course-pms@sha256:e5cb29a0cf687cdda01110434528d627cd09057d94e9ab028510e5ad090a89e0` |
| Serving revision | **`course-pms-00009-mk2`** |
| Traffic observation | Actual Cloud Run CLI: **100% LATEST (currently course-pms-00009-mk2)**, **18:35:30 Asia/Bangkok**; not a latest-ready-only inference |
| Workflow completion | Deploy job completed **18:35:39 Asia/Bangkok**; actual step outcomes in retained JSON |
| Public URL | <https://course-pms-859617270560.asia-southeast1.run.app> |
| Workflow service URL alias | <https://course-pms-jjbynk5aja-as.a.run.app>; independently checked against the same source |
| Owner console screenshot | **PENDING**. Retained dated CLI workflow evidence is not a console screenshot or a new live cloud-console observation. |

[Release review/merge metadata](evidence/deployed-20261117/release-pr76.json), [deployment run/steps](evidence/deployed-20261117/deploy-run.json), [filtered CLI/smoke excerpt](evidence/deployed-20261117/deploy-log-excerpt.txt), [structured serving identity](evidence/deployed-20261117/serving-identity.json).

The staging and main commit trees were compared locally after merge and were identical (`git diff --quiet origin/lab6-staging origin/main`, exit 0). The distinct main merge SHA represents the same reviewed release tree; the workflow tags the image and sets `APP_COMMIT_SHA` to that main merge, not the older feature/staging SHA.

## Verification actually observed

| Check | Actual outcome | Limit |
| --- | --- | --- |
| Main-merge CI | **41 backend / 16 frontend / 3 E2E passed**, zero skipped; production and Docker builds passed | Automated CI with disposable/synthetic fixtures, not independent deployed UAT |
| Reviewed-main guard | PASS for main `aeb804e…` and independent approved release head `54ac5ee…` | Does not establish notification or personal student UAT |
| Migration/deploy step | SUCCESS; existing immutable-source release script runs migration-only, then service/traffic update | No seed/reset/delete was run by this coding session; historical fixture state has not been authenticated/read back here |
| Pipeline public smoke | PASS `/api/health`, `/api/ready`, `/` | Pipeline service URL alias; no no-refresh account switch |
| Pipeline authenticated smoke | **SKIPPED**, optional smoke credentials not configured | Not a login/team/proposal PASS |
| New anonymous public checks | **8/8 passed**, approximately **18:37–18:38 Asia/Bangkok** | Read-only public preparation checks, no login or protected data reads |

[Main CI count excerpt](evidence/deployed-20261117/main-ci-summary.txt) and [actual public checks](evidence/deployed-20261117/public-smoke.json).

The eight public checks were: both URLs' health source matches `aeb804e…`; both readiness endpoints return database connected; canonical bare `/api/proposals` returns JSON 401 `UNAUTHORIZED`; unknown API returns JSON 404 `API_ROUTE_NOT_FOUND`; root and a frontend-navigation path return HTML. These counts are separate from partner UAT assertions and CI denominators.

## Version trace

| Stage | Reference |
| --- | --- |
| Earlier Sprint 1 / defective deployment | `9c22735995c985aaa0622b6b179de1ac9c1f80ca`, original CPMS-L6-20261114-155049; older owner observation `course-pms-00008-hbv` remains historical |
| Original RED / GREEN | `d3ea0116006c7338f6d7f54aaf7c7b3f4e9ffb63` / `3b7de94040f8944aae2db3b751f4c91cdf8907fb` |
| Session follow-up RED / GREEN | `9834080` / `6de3c9a8b3404b831041a9b9fe855d1d52f9cac3` |
| Roster/routing RED / GREEN | `dd45d9e` / `b29109d531ca47eace1b13f55076dbcbb9509c14` |
| Final follow-up with instructor regression | `a309ceaabf426af507b8a4e73434db6c48da90f6`, #73; helper removed |
| Integrated correction head | `ae6f3648460c950a2b592407102205f21a905813`, #72, approved before staging merge |
| Staging release head | `54ac5ee7678900bde9969b3c0aeac39635aea484` |
| Released main/image identity | `aeb804ea5bc667399b00cf54df10046a6ded46e0` / digest / revision above |

## Notification exception and actual delivery record

Issue #57 required telling fastTrack **before** deployment. The user reported that no notification had been sent, after the release had already merged and automatic deployment was running. **The pre-deployment notification requirement was not fulfilled in the retained record.** It cannot be completed retrospectively by inserting the current time.

The current time may record preparation of a new after-deployment message only. Actual notification time/channel, recipient acknowledgement and an agreed retest appointment remain **PENDING**. The prepared [handoff draft](deployed-release-handoff.md) has not been sent by the assistant. Preserve this deviation for the reviewer/report rather than claim a pre-deployment notice.

## Current completion update and #57 review

The received private completion package supplies later authenticated login,
team/proposal readback, no-refresh switching, no-team destination, bounded role
denial and preserved-state evidence on the exact released source. These were
AI-operated for fastTrack, not a new CoursePMS Product Team execution or a
pipeline login rerun. The earlier optional pipeline login remains SKIPPED.

The user acknowledges receipt of that technical result in this chat and asks
for CoursePMS-only closeout. The returned peer artifacts evidence receipt/use
of release identity and retest instructions; actual external time/channel and
human acceptance are not supplied. [Product task map](coursepms-product-closeout.md).

Reviewer `martinvadre` must disposition the missing pre-deployment notice and
any remaining owner-evidence requirements before closing #57. The notification
exception is retained; it is not completed retrospectively. Dated CLI evidence
is retained while a console screenshot is still not supplied. This update does
not change reciprocal fastTrack records or sign the independent decision.

## Historical pre-completion #57 checklist

The following records what remained before the later completed partner retest.
Its NOT RUN/entry-pending wording is superseded for those technical observations
by the completion update above, without inventing pipeline/product-team execution.

- User sends the actual after-deployment notification and corrected version/evidence; record real delivery time/channel and response.
- Owner supplies dated console evidence and privately verifies eligible test accounts plus historical state using agreed read-only checks. No credentials or raw storage enter the record.
- Product-team authenticated smoke (login and safe team/proposal read) remains **NOT RUN** here. The original no-refresh failed case, foreign directory privacy and affected session/role cases require actual deployed execution/retest, not just CI.
- Preserve Team 5 / Proposal 3 APPROVED revision 2. No full ordered lifecycle, save/submit/review or reset/seed/delete is needed for targeted account switching. This session made no authenticated live data requests or writes; intact historical state has not been independently read back.
- fastTrack executes agreed [RT-01–09](retest-request.md), records real operator/version/time/results and its own CoursePMS decision. Both independent human decisions and real per-member activity remain pending.

Issue #57 is **not automatically closed** by this deployment or documentation PR. Its notification exception, missing authenticated checks/data verification, delivery and reviewer evidence checklist still need disposition. Issue #58's independent retest/decision work can now be arranged against the identified corrected deployment once safe entry conditions are confirmed.
