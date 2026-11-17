# Corrected CoursePMS release for fastTrack — 17 November 2026

**Prepared handoff, UNSENT. Independent retest NOT RUN; both human decisions PENDING.** Deployment is verified below; this does not fabricate a prior notification, authenticated smoke or personal activity.

| Release fact | Actual verified value |
| --- | --- |
| URL | <https://course-pms-859617270560.asia-southeast1.run.app> |
| Main/deployed source | `aeb804ea5bc667399b00cf54df10046a6ded46e0` |
| Reviewed release PR/head | [#76](https://github.com/Magiciancat9/Course_management/pull/76) / `54ac5ee7678900bde9969b3c0aeac39635aea484`; approved by `martinvadre` on that head, merged to main |
| Image | `asia-southeast1-docker.pkg.dev/cpe334-kingnine/course-pms/course-pms@sha256:e5cb29a0cf687cdda01110434528d627cd09057d94e9ab028510e5ad090a89e0` |
| Serving revision/traffic | `course-pms-00009-mk2`, **100%**, actual dated Cloud Run CLI output at 18:35:30 Asia/Bangkok |
| Deploy run | [44074859743](https://github.com/Magiciancat9/Course_management/actions/runs/44074859743), SUCCESS, 17 November |
| Public verification | Source-matching health and connected DB on both service URLs; expected JSON auth/404 routing and HTML; 8/8 anonymous checks at approximately 18:37–18:38 Asia/Bangkok |
| Authenticated/no-refresh retest | NOT RUN by this preparation; optional pipeline login smoke was SKIPPED for missing configuration |
| Fixed findings | #71 Major session-state isolation; #74 Major roster-only privacy; #75 Minor protected JSON routing |

See [full release evidence and notification exception](release-evidence.md), [actual public observations](evidence/deployed-20261117/public-smoke.json), and [CLI/guard/smoke excerpt](evidence/deployed-20261117/deploy-log-excerpt.txt). The retained traffic output is dated workflow CLI evidence; a new owner console screenshot remains pending.

## Independent retest request

1. Agree actual tester/witness roles/time and privately reverify eligible aliases/fixtures. Existing membership snapshots are historical, not proof of present eligibility.
2. Load the corrected frontend freshly once **before starting** the reproduction and confirm health matches `aeb804e…`; then perform the A -> logout -> B switch in the same tab **without refreshing between those account sessions**. Capture all four empty B editor fields and correct identity/team, with no prior private banner/review/form data.
3. Execute reverse/own-proposal/no-team/instructor and saved-state checks, plus agreed affected auth/directory/routing checks [RT-01–09](retest-request.md). Review race/unsaved-edit CI separately from deployed tests. Unavailable fixtures or unsafe/unagreed write-denial targets stay BLOCKED.
4. Preserve Team 5 / CPMS-L6-20261114-155049-Team and Proposal 3 / APPROVED revision 2. Do not save leaked fields, rerun the full ordered lifecycle, reset/seed/delete, or perform historical proposal mutations for this targeted retest.
5. Record actual executor/team/date/time/source/revision/actions/results/evidence/deviations. Only actual fastTrack decision-makers record CoursePMS acceptance. CoursePMS separately completes its own real fastTrack decision; no human signature or outcome is selected here.

The previous proposed slot of **20 November 19:00–19:45 Asia/Bangkok** remains a proposal only, **not booked or confirmed**. Agree a suitable slot with the actual team; no invitation/message was sent by this preparation.

## Draft reply — UNSENT

> CoursePMS release PR #76 has merged through the independently reviewed pipeline, and the corrected release is now deployed. Source aeb804ea5bc667399b00cf54df10046a6ded46e0, revision course-pms-00009-mk2, 100% traffic, immutable digest and dated evidence are attached. Public health reports that source and readiness reports DB connected. Main CI passed 41 backend, 16 frontend and 3 E2E tests; anonymous post-deployment checks passed 8/8. Optional authenticated pipeline smoke was skipped because credentials were not configured, so we do not claim the no-refresh browser retest or account eligibility is already complete. This is the actual after-deployment notification; no earlier notice is recorded. Please acknowledge receipt and agree a time/safe fixtures for independent RT-01–09, starting with the original same-tab no-refresh account switch. Team 5 and Proposal 3 must remain unchanged. Both final human decisions remain pending.
