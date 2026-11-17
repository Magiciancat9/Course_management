# CoursePMS return package — 17 November 2026

**Review candidate, not a release or a sent message.** Both independent acceptance decisions remain **PENDING**. Prepared by Codex using actual source/test evidence. Human signatures and activities are not supplied by this record.

For the latest second exchange, start with [follow-up response](followup-response.md),
[resolved contracts](contract-dispositions.md), [reconciled acceptance](acceptance-record.md)
and [concrete release actions](release-readiness.md). The new sendable follow-up
excludes fictional simulation and internal report drafts.

## A. Receipt and triage

| Field | Actual record |
| --- | --- |
| Receipt channel/time | User supplied the 17 November ZIP in the local coding session; exact partner chat delivery time/acknowledgement not supplied |
| Authenticated developer context | GitHub account `Magiciancat9`; AI operated this follow-up. Existing implementation PR author is `martinvadre`. Neither is credited with personally executing AI tests. |
| Run/source acknowledged | CPMS-L6-20261114-155049 / `9c22735995c985aaa0622b6b179de1ac9c1f80ca` |
| Totals acknowledged | 56 PASS / 1 FAIL / 57 actual assertions; 36 official core PASS. Original 58-total narrative retained as a discrepancy. |
| Actual defect issue | [#71](https://github.com/Magiciancat9/Course_management/issues/71); triage #55 and correction #56 |
| Reproduction | Historical no-refresh UI evidence; original RED replay and three follow-up failures reproduced by AI on 17 November using synthetic local fixtures |
| Disposition/severity | Accepted defect / Major: client-private draft exposure across identities; no established server authorization bypass; human disposition review pending |
| Root cause | Editor empty-state/logout omissions plus missing session guards; review additionally found late-login and private-banner gaps |
| Owner/reviewer | Existing #56 allocation: Pawarit implements, Tatchakorn reviews. Follow-up from Tatchakorn's account needs Pawarit's inspection before independent integrated-head review. See [work allocation](member-work-plan.md). |
| Bare collection GET | Resolved: #75 accepted Minor auth/JSON-routing defect under versioned AC-03. Candidate returns JSON 401 before auth, JSON 404 after valid auth for unsupported collection GET. No collection-list feature added. |
| Title summaries | Resolved: user confirmed existing roster-only policy. #74 accepted Major: candidate returns foreign `proposal: null` / UI `PRIVATE`, retaining own/instructor detail. |

Full rationale: [triage](triage.md).

## B. Correction and delivery traceability

| Stage | Actual evidence |
| --- | --- |
| Original RED | `d3ea0116006c7338f6d7f54aaf7c7b3f4e9ffb63`, replay: 5 failed / 4 passed |
| Original GREEN/PR | `3b7de94040f8944aae2db3b751f4c91cdf8907fb`; [#72](https://github.com/Magiciancat9/Course_management/pull/72), still Draft |
| Review follow-up RED | `9834080`: 3 failed / 11 passed |
| Follow-up GREEN | `6de3c9a8b3404b831041a9b9fe855d1d52f9cac3`: 14 passed / 0 skipped |
| Branch / PR | `fix/lab6-10-session-boundary-followup`; [#73](https://github.com/Magiciancat9/Course_management/pull/73), Draft into #72's branch |
| Broader checks | Latest contract code-head CI 44037614365 at `b29109d` passed 41 backend, 15 frontend and 3 E2E tests, production and Docker builds, zero skipped. Earlier RED/GREEN remains in [session verification](session-followup.md); newest evidence in [contract dispositions](contract-dispositions.md). |
| Human review | PENDING; no approval submitted or invented |
| Integration / reviewed main | PENDING; no merge performed |
| Fixed deployment / deployed smoke | PENDING; live source remains the original `9c227359…` |

Readable command output and exact version chain: [follow-up verification](session-followup.md). Current-head CI is required; an earlier green run cannot validate later commits.

## C. Serving identity and independent retest

| Field | Actual record / required owner action |
| --- | --- |
| Candidate code | `b29109d531ca47eace1b13f55076dbcbb9509c14` includes the prior session corrections; not yet integrated/released |
| Public URL | <https://course-pms-859617270560.asia-southeast1.run.app> |
| Public observation | Latest 17 November, approximately 14:20 Asia/Bangkok; HTTP 200 health source `9c22735995c985aaa0622b6b179de1ac9c1f80ca`; ready `db: connected`. Earlier 12:43 and partner 13:42 readings remain historical. |
| Fixed serving revision / image digest / traffic | PENDING after authorized release; current service metadata not independently retrieved |
| Owner console evidence | PENDING; release owner must capture dated console view without secrets |
| Safe fixtures | Historical Team 5, proposal 3, APPROVED revision 2 retained. S1–S3 assigned, S4 unassigned and R1–R4 unused in original run; privately reverify current eligibility. Credentials stay outside package. |
| Retest appointment/channel | Proposed 20 November 19:00–19:45 Asia/Bangkok; not booked, conditional on reviewed release and eligible fixtures; [request](retest-request.md) unsent |

Owner read-only commands after release, with `gcloud` installed/authenticated:

```sh
gcloud run services describe course-pms --project cpe334-kingnine --region asia-southeast1 --format='json(status.url,status.latestReadyRevisionName,status.traffic)'
gcloud run revisions describe FIXED_SERVING_REVISION --project cpe334-kingnine --region asia-southeast1 --format='json(metadata.name,status.imageDigest,status.conditions)'
```

Record the reviewed fixed source, digest, actual traffic split, observation time and public health/ready checks together. A latest-ready revision is not automatically the traffic-serving revision. The workflow's reviewed merge commit may differ from the code commit; explain ancestry.

Independent fastTrack retest after release:

1. Confirm health matches the agreed corrected source, readiness is database-connected, and owner metadata proves serving revision/digest/traffic.
2. In the same tab, load A's existing four-field private draft. Logout; sign in as B with no proposal, without refreshing. Verify B identity/team and all four empty fields. Do not save leaked historical values.
3. Switch back without refresh; verify only A's saved fields. Check own-proposal, no-team and instructor destinations using agreed eligible accounts.
4. Check reload/relogin persistence, logout token rejection, foreign-team and student-review denials using the agreed safe procedure. Capture actual results, identity/version/time and sanitized evidence.
5. Keep Team 5 / proposal 3 APPROVED revision 2 unchanged. Do not rerun the entire ordered lifecycle or reset/seed/delete historical data for this retest.

## D. Actual member activity

The reciprocal follow-up archive contains a **user-reported**, unwitnessed statement that both members participated on 13 November at 17:30 Asia/Bangkok. Per-case actions/results were not supplied. Original API/UI runs were AI operated at their recorded later times. The current user requested simulated allocation; it is provided separately and does not supply real activity.

| Member | Actual personal case/actions/time/evidence | Personal confirmation |
| --- | --- | --- |
| Tatchakorn Thamnimitr / 67070503415 | PENDING actual per-case record; authenticated account alone is not personal execution | PENDING |
| Pawarit Wongdaeng / 67070503466 | PENDING actual per-case record; original PR author alone is not personal execution | PENDING |

Use [actual activity forms](member-activity.md). The internal fictional illustration is excluded from actual results and the new partner follow-up export.

## E. CoursePMS independent decision about fastTrack

**PENDING — no option selected or signed.** Recorded source `8e637e537cd037d630a5fffc1b5672d1b44371a8`; 14 November owner observation records revision `fasttrack-app-00003-rc7`, 100% traffic. Current public health/ready still match that source; no new cloud revision/traffic confirmation was obtained.

Reviewed source evidence separately contains 97 main API assertions, 7 post-UI controls, 26 follow-up UI observations, 25 final controls and 11 saved-state comparisons. These are separate denominators. No confirmed fastTrack product defect was established in the bounded follow-up. This is not exhaustive procedural completion or a student decision.

Before deciding, both members review `06-case-coverage-and-deviations.md` in the private original follow-up archive: sequential profiles; API duplicate control outside browser DevTools; deadline setup approximately 4m10s; SB same-profile denials; validation on NORMAL rather than separate VALIDATION milestone; Back/reload after SB; no fresh browser cookie replay or 8-hour expiry check; and missing per-member confirmation. Record whether the team and partner require additional exact-path execution. Do not manufacture a fastTrack defect or transfer CoursePMS's defect into the opposite product.

Actual decision-maker(s), exact serving revision, real decision time, covered case results, conditions and personal confirmations remain PENDING. Available outcomes are Accepted, Accepted with documented minor limitations, or Not Accepted, selected by the actual independent students.

## F. Reserved for fastTrack

Corrected-version retester/time, actual outcome of L6-OUT-EXP-001, affected checks and final CoursePMS decision remain PENDING for fastTrack. Local GREEN and teammate approval cannot complete this section.

## G. Draft private reply — UNSENT

> We acknowledge your original and follow-up evidence and the corrected 56 PASS / 1 FAIL / 57 ledger, including 36 core PASS assertions. L6-OUT-EXP-001 remains accepted Major under #71. Continued Draft #73 also resolves roster-only directory privacy (#74, Major) and protected JSON routing (#75, Minor), with genuine RED/GREEN and code-head CI passing 41 backend, 15 frontend and 3 E2E tests plus production/Docker builds. The public service still serves 9c227359…; no corrected release or independent retest is claimed. The reconciled acceptance record and actual activity forms keep human decisions/signatures pending. We propose 20 November 19:00–19:45 Asia/Bangkok, conditional on identified reviewed release and privately reverified fixtures. See the latest follow-up response for the exact remaining owner actions and request. No historical fixture was changed.

This package has not been sent. Share privately after checking the current CI/review/release records; do not include credentials or original private screenshots in a public repository.
