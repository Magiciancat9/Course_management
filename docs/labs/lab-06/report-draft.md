# CoursePMS Lab 6 report draft — Parts A–D

Team EN-022_P6, Section 31: Tatchakorn Thamnimitr (67070503415), Pawarit Wongdaeng (67070503466). Partner: EN-028 InfaCompany / fastTrack. Prepared as Markdown on 17 November 2026. **Draft; unresolved human work and release/retest dependencies remain.** Submission deadline in supplied material: 22 November 2026, 23:59 Asia/Bangkok, LEB2.

| Part | Evidence location | PDF pages |
| --- | --- | --- |
| A. Preparation and handoff | Existing UAT cases, fixtures, handoff and version observations | Fill after student PDF export |
| B. Independent execution | Original private reciprocal evidence; bounded case/deviation assessment below | Fill after export |
| C. Findings and triage | `triage.md`, Issue #71 and correction PRs | Fill after export |
| D. Correction, release and independent retest | RED/GREEN outputs, CI, return package; pending release/retest | Fill after export |

## Part A — Preparation and handoff

CoursePMS Sprint 1 covers authentication/roles, project teams, and proposal submission/review. Eight ordered [UAT cases](uat-cases.md) cover normal journey, business rules/boundaries, ownership/role denial and saved-state persistence across AC-01–AC-10, with recorded coverage limits. [Partner handoff](partner-handoff.md) and [fixture/reset rules](uat-data-and-reset.md) provide the baseline instructions.

The partner's AI-operated 14 November CoursePMS run tested `9c22735995c985aaa0622b6b179de1ac9c1f80ca`. Fresh public read-only health/ready observations on 17 November still identify that source and connected DB. Serving revision/digest/traffic must be freshly captured by the authorized owner before the corrected-release retest. Current observations are preparation/readback, not new deployed UAT.

Retain Team 5 / proposal 3 APPROVED revision 2. No production reset, deletion, reseed or lifecycle rerun was performed for this correction. Passwords/tokens and original partner screenshots stay private.

## Part B — Independent execution

Two directions must remain separate:

| Direction | Observed evidence | Limitation / decision |
| --- | --- | --- |
| fastTrack testing CoursePMS | CPMS-L6-20261114-155049: 36 core PASS assertions across eight official paths; complete retained ledger 56 PASS / 1 FAIL / 57. Four private fields persisted across account switch. | AI-operated historical evidence; browser Back/return deviation; human participation and final acceptance PENDING. |
| CoursePMS testing fastTrack | Source `8e637e537cd037d630a5fffc1b5672d1b44371a8`; 97 main API assertions, 7 separate post-UI controls, 26 follow-up UI observations, 25 final controls, 11 saved-state comparisons. | Separate denominators; bounded checks and explicit procedural deviations; no confirmed fastTrack product defect in retained follow-up. Human case records and decision PENDING. |

Read [return package section E](return-to-fasttrack.md) for all remaining deviations from the original fastTrack procedures. Source snapshots and detailed ledgers remain in the private incoming archives. They were reviewed as source material; no archived runner or new live write was executed here.

The reciprocal archive preserves a user-reported statement that both members participated at 17:30 on 13 November. The assistant did not witness that session; individual cases/results were not supplied. Later AI-run evidence must not be relabelled as that earlier personal execution. [Member work plan](member-work-plan.md) provides assignments and real activity forms; the [simulation](simulation-example.md) supplies only explicitly fictional practice examples.

For final PDF, privately select readable original screenshots of a normal journey and forbidden access plus authorized unchanged-state evidence, include their original IDs/capture attribution, and record which evidence each student actually reviewed. A drafted paragraph or image alone is not a personal signature.

## Part C — Findings, impact and triage

L6-OUT-EXP-001 is an **accepted Major defect** under [#71](https://github.com/Magiciancat9/Course_management/issues/71): prior-account private editor content is visible after a no-refresh account switch. It violates ownership isolation even though reload clears it. Evidence establishes client memory leakage, not server authorization bypass or cross-account saved copying.

The original cause was missing editor resets on logout/empty-state loads and absent session-response guards. Review of the existing correction also exposed an unguarded delayed login, retained private title banners and lost unsaved edits during member refresh. All were reproduced with actual assertion failures and corrected in the follow-up candidate.

[Triage](triage.md) distinguishes the accepted defect from two unresolved contract questions (foreign title summaries and bare proposal-collection GET), and from the incoming report's arithmetic error. No extra product bug or invented assertion was created. Formal teammate disposition review and partner acknowledgement remain pending; [private reply](return-to-fasttrack.md) is drafted but unsent.

## Part D — Correction and independent retest

| Stage | Actual result |
| --- | --- |
| Original RED replay | `d3ea0116`: 5 failed / 4 passed / 0 skipped |
| Original fix | `3b7de940`, existing Draft PR #72 |
| Additional RED | `9834080`: 3 failed / 11 passed / 0 skipped |
| Follow-up GREEN | `6de3c9a8b3404b831041a9b9fe855d1d52f9cac3`: 14 passed / 0 skipped |
| Local production build | Passed |
| Local domain regression | 9 passed / 0 skipped |
| Full automated CI | Run 44026535153 at `5e11600`: 32 backend / 14 frontend / 3 E2E passed, production/Docker builds passed, zero skipped; [retained CI record](evidence/session-followup/ci-status.json). Later changed heads require fresh CI. |
| Substantive human review / integration | PENDING; original #56 owner is Pawarit, designated reviewer Tatchakorn; no self-approval or merge performed |
| Authorized fixed deployment / smoke | PENDING; public source still `9c227359…` |
| fastTrack independent correction retest / CoursePMS decision | PENDING, reserved for fastTrack |
| CoursePMS independent fastTrack decision | PENDING, reserved for actual CoursePMS student confirmation |

The source, test names, exact commands, retained output and limitations are in [follow-up verification](session-followup.md). [Return package](return-to-fasttrack.md) supplies safe independent retest steps and metadata requirements. The existing CI and reviewed-release rules remain intact.

## Contributions, AI use and remaining actions

Codex inspected the private ZIP and current GitHub state, verified 58 manifest entries, inspected existing PR #72, replayed original RED, added and ran synthetic regression tests, made follow-up code/CI changes, checked public read-only endpoints, and prepared Markdown/draft handoff. Those are AI-operated actions. The user requested simulated allocation; it is labelled separately and contributes no actual PASS, attendance, approval or signature.

Actual personal contributions and decisions must be completed by both students using the activity form. Follow [proposed allocation](member-work-plan.md) for reviewer/integration, policy decisions, release identity, retest coordination, report cross-review and student PDF submission. Page ranges, signatures, final decisions and LEB2 submission receipt remain pending. No PDF was generated, external partner message sent, live fixture changed or acceptance selected by the assistant.
