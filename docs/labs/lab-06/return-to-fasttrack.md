# CoursePMS return package — 17 November 2026

**Review candidate, not a release or a sent message.** Both independent acceptance decisions remain **PENDING**. Prepared by Codex using actual source/test evidence. Human signatures and activities are not supplied by this record.

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
| Bare collection GET | Contract clarification pending; no collection GET in SDS endpoint table or implementation; SPA fallback explains HTML |
| Title summaries | Policy clarification pending: sanitizer returns foreign title/status metadata; SDS roster-only wording needs explicit team reconciliation |

Full rationale: [triage](triage.md).

## B. Correction and delivery traceability

| Stage | Actual evidence |
| --- | --- |
| Original RED | `d3ea0116006c7338f6d7f54aaf7c7b3f4e9ffb63`, replay: 5 failed / 4 passed |
| Original GREEN/PR | `3b7de94040f8944aae2db3b751f4c91cdf8907fb`; [#72](https://github.com/Magiciancat9/Course_management/pull/72), still Draft |
| Review follow-up RED | `9834080`: 3 failed / 11 passed |
| Follow-up GREEN | `6de3c9a8b3404b831041a9b9fe855d1d52f9cac3`: 14 passed / 0 skipped |
| Branch / PR | `fix/lab6-10-session-boundary-followup`; [#73](https://github.com/Magiciancat9/Course_management/pull/73), Draft into #72's branch |
| Broader checks | Production build and 9 domain unit tests passed locally. CI run 44026535153 at `5e11600` passed 32 backend, 14 frontend and 3 E2E tests, production and Docker builds, zero skipped. See [verification](session-followup.md). |
| Human review | PENDING; no approval submitted or invented |
| Integration / reviewed main | PENDING; no merge performed |
| Fixed deployment / deployed smoke | PENDING; live source remains the original `9c227359…` |

Readable command output and exact version chain: [follow-up verification](session-followup.md). Current-head CI is required; an earlier green run cannot validate later commits.

## C. Serving identity and independent retest

| Field | Actual record / required owner action |
| --- | --- |
| Candidate code | `6de3c9a8b3404b831041a9b9fe855d1d52f9cac3`; not yet integrated/released |
| Public URL | <https://course-pms-859617270560.asia-southeast1.run.app> |
| Public observation | 17 November, approximately 12:43 Asia/Bangkok; HTTP 200 health source `9c22735995c985aaa0622b6b179de1ac9c1f80ca`; ready `db: connected` |
| Fixed serving revision / image digest / traffic | PENDING after authorized release; current service metadata not independently retrieved |
| Owner console evidence | PENDING; release owner must capture dated console view without secrets |
| Safe fixtures | Historical Team 5, proposal 3, APPROVED revision 2 retained. S1–S3 assigned, S4 unassigned and R1–R4 unused in original run; privately reverify current eligibility. Credentials stay outside package. |
| Retest appointment/channel | PENDING agreement with fastTrack; draft below is unsent |

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

Use [proposed allocation and activity form](member-work-plan.md); [illustrative simulation](simulation-example.md) is excluded from actual results.

## E. CoursePMS independent decision about fastTrack

**PENDING — no option selected or signed.** Recorded source `8e637e537cd037d630a5fffc1b5672d1b44371a8`; 14 November owner observation records revision `fasttrack-app-00003-rc7`, 100% traffic. Current public health/ready still match that source; no new cloud revision/traffic confirmation was obtained.

Reviewed source evidence separately contains 97 main API assertions, 7 post-UI controls, 26 follow-up UI observations, 25 final controls and 11 saved-state comparisons. These are separate denominators. No confirmed fastTrack product defect was established in the bounded follow-up. This is not exhaustive procedural completion or a student decision.

Before deciding, both members review `06-case-coverage-and-deviations.md` in the private original follow-up archive: sequential profiles; API duplicate control outside browser DevTools; deadline setup approximately 4m10s; SB same-profile denials; validation on NORMAL rather than separate VALIDATION milestone; Back/reload after SB; no fresh browser cookie replay or 8-hour expiry check; and missing per-member confirmation. Record whether the team and partner require additional exact-path execution. Do not manufacture a fastTrack defect or transfer CoursePMS's defect into the opposite product.

Actual decision-maker(s), exact serving revision, real decision time, covered case results, conditions and personal confirmations remain PENDING. Available outcomes are Accepted, Accepted with documented minor limitations, or Not Accepted, selected by the actual independent students.

## F. Reserved for fastTrack

Corrected-version retester/time, actual outcome of L6-OUT-EXP-001, affected checks and final CoursePMS decision remain PENDING for fastTrack. Local GREEN and teammate approval cannot complete this section.

## G. Draft private reply — UNSENT

> We received your 17 November handoff in our local coding session and acknowledge the corrected 56 PASS / 1 FAIL / 57-assertion ledger, including 36 core PASS assertions. We retain L6-OUT-EXP-001 as an accepted Major client-session isolation defect under Issue #71, subject to teammate review. Existing Draft PR #72 has a tested follow-up in Draft PR #73: original RED replay 5 failed/4 passed, follow-up RED 3 failed/11 passed, then GREEN 14 passed. Production build and 9 backend domain tests passed locally; current CI/review status is in the attached records. The public service still serves 9c227359…; no corrected release or independent retest is claimed. We will provide the reviewed release's exact source, digest, serving revision and traffic before requesting your no-refresh account-switch retest. We have preserved your historical fixtures. Please agree a retest appointment after release identity is supplied. Title-summary visibility and bare collection-GET contract questions remain open. Both independent acceptance decisions remain pending.

This package has not been sent. Share privately after checking the current CI/review/release records; do not include credentials or original private screenshots in a public repository.
