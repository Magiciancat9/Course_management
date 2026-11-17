# Concrete release prerequisites and owner actions

Updated 17 November 2026. **Candidate ready for human inspection; release not authorized or performed.** The full correction already includes original #72 plus #73's follow-up and the contract fixes in #74/#75. There is no need to duplicate or recreate those changes.

## Exact references

| Item | Actual reference |
| --- | --- |
| Repository / authenticated coding account | Magiciancat9/Course_management / `Magiciancat9`; operator Codex |
| Existing correction | [Draft #72](https://github.com/Magiciancat9/Course_management/pull/72), driver `martinvadre`, head `2e3f22a34faa53ec87070e61b49d6b35e438a92c`, target `lab6-staging` |
| Continued integrated candidate | [Draft #73](https://github.com/Magiciancat9/Course_management/pull/73), branch `fix/lab6-10-session-boundary-followup`, target #72's fix branch |
| Staging base | `c2aa849f2c0a3301f47dd4c4342643ac42b038cd` |
| Original session fix / follow-up code | `3b7de94040f8944aae2db3b751f4c91cdf8907fb` / `6de3c9a8b3404b831041a9b9fe855d1d52f9cac3` |
| Contract correction code | `b29109d531ca47eace1b13f55076dbcbb9509c14` |
| Code-head full CI | [44037614365](https://github.com/Magiciancat9/Course_management/actions/runs/44037614365), success: 41 backend / 15 client / 3 E2E, build and Docker passed |
| Final current-head check | Latest #73 head/status on GitHub; sendable `candidate.json` and `ci-final-head.json` bind the completed export to its exact final head |
| Review / protected-branch integration | No substantive human review or merge at the retained preflight; not performed by this coding session |
| Serving source | Fresh 17 November 14:20 Asia/Bangkok public readback still `9c22735995c985aaa0622b6b179de1ac9c1f80ca`, DB connected |

[PR #72 snapshot](evidence/followup-20261117/pr72-preflight.json), [PR #73 snapshot](evidence/followup-20261117/pr73-preflight.json) are dated preflight snapshots; later documentation commits change #73's head. Use live metadata or export final-head records for an integration decision. The original correction head is an ancestor of the candidate, verified locally without modifying the original branch.

## Owner actions in order

1. **Pawarit (`martinvadre`)** personally inspects #73, the complete diff, regression outputs and the user's roster-only decision. Record only real review activity. After that decision, incorporate the follow-up into the original feature branch using the manual steps below. The temporary integration helper was never executed and has been **removed from the candidate** in response to Martin's review before staging integration.
2. **Tatchakorn (`Magiciancat9`)** personally reviews the complete integrated latest #72 head after new #72 CI, records a substantive current-head approval and merges only when the issue checklists satisfy the existing rule. Pawarit must not merge his #56 correction. #73 remains a proposed patch/evidence reference until handled by the team; do not self-approve or use a self-merge to bypass ownership.
3. Prepare the **release PR `lab6-staging` -> `main`** after actual reviewed staging integration. Designated #57 driver Tatchakorn prepares it; Pawarit reviews the exact release head and merges only after green CI and the real release decision. No release PR is opened from an unchanged/unintegrated staging baseline here. Reviewable release content is the existing candidate plus the current staging ancestry, not a fabricated main commit.
4. Let the existing reviewed-main workflow test/build/migrate/deploy normally after that authorized merge. Do not weaken `deploy/verify_reviewed_commit.py`, change IAM/secrets, seed/reset data or manually bypass the approval check. No database schema change is required by these fixes.
5. Record the actual main/source merge, exact image digest, traffic-serving revision(s)/percentages, dated owner console evidence and matching health/ready/smoke results. Notify fastTrack and agree the retest before changing any identified tested release.

Manual integration by the original implementation owner, after personal inspection:

```powershell
gh api user --jq .login
git status --short
git fetch origin
gh pr view 72 --repo Magiciancat9/Course_management --json headRefOid,headRefName,baseRefName
gh pr view 73 --repo Magiciancat9/Course_management --json headRefOid,headRefName,baseRefName,statusCheckRollup
```

Continue only as `martinvadre` in a clean intended CoursePMS checkout, after
verifying that the actual #72/#73 heads match the versions personally inspected,
the PR targets are unchanged, and the current #73 head has successful full CI.
If a head changed, inspect it again before proceeding. Then fast-forward only
the original feature branch; do not push directly to staging/main:

```powershell
git switch fix/lab6-10-l6-out-exp-001-draft-isolation
git merge --ff-only origin/fix/lab6-10-session-boundary-followup
git push origin HEAD:refs/heads/fix/lab6-10-l6-out-exp-001-draft-isolation
```

Stop on any command failure; never force-push. These owner steps were not
executed by this coding session. They do not approve or merge a PR. Human
review of the resulting latest #72 head and its fresh CI are still required.
The retained older `integration-helper-check.json` is historical syntax-only
evidence for the removed helper, not a current release prerequisite.

## Deployment evidence to fill after the real release

| Field | Actual value |
| --- | --- |
| Reviewed main/source commit / release PR | PENDING |
| Image digest | PENDING |
| Traffic-serving revision(s) / percentage(s) | PENDING |
| Dated owner console evidence | PENDING |
| Observation time / timezone | PENDING |
| `/api/health` matching fixed source | PENDING |
| `/api/ready` database-connected result | PENDING |
| Post-deployment smoke / exact command and outcomes | PENDING |

No gcloud executable was found in PATH at the current check. The owner can obtain filtered metadata from project `cpe334-kingnine` (859617270560), region `asia-southeast1`, service `course-pms`, after authorized release:

```sh
gcloud run services describe course-pms --project cpe334-kingnine --region asia-southeast1 --format='json(status.url,status.latestReadyRevisionName,status.traffic)'
gcloud run revisions describe ACTUAL_TRAFFIC_REVISION --project cpe334-kingnine --region asia-southeast1 --format='json(metadata.name,status.imageDigest,status.conditions)'
```

A latest-ready revision is not sufficient traffic proof. Do not dump full environment configuration. The earlier `course-pms-00008-hbv` record remains historical and cannot identify a corrected deployment.

## Retained data and decisions

Team 5 / CPMS-L6-20261114-155049-Team and proposal 3 / APPROVED revision 2 remain untouched. No authenticated live writes or fixture reset occurred. Private fixture eligibility remains **unverified** until the owners agree safe account access. Both actual member records and the exact-version fastTrack decision remain pending. fastTrack's corrected-deployment retest and CoursePMS decision are separately blocked until the entry conditions in [retest request](retest-request.md) are met.
