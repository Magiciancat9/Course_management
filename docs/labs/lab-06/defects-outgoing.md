# Outgoing Defect Reports (`fastTrack`) — Lab6-08

- **Issue:** [#54](https://github.com/Magiciancat9/Course_management/issues/54) (`[Lab6-08] Report reproducible defects to the partner team`)
- **UAT Team (`EN-022_P6`):** Pawarit Wongdaeng (`@martinvadre`, driver) and Tatchakorn Thamnimitr (`@Magiciancat9`, reviewer/merger)
- **Product Under Test:** `fastTrack` (`EN-028 InfaCompany`), <https://fasttrack-app-kpx7au3w2a-as.a.run.app>
- **Tested Sprint 1 Source:** `8e637e537cd037d630a5fffc1b5672d1b44371a8` (Cloud Run revision/traffic was not independently read back during the technical run; separate Section 3.5 controlled exercise tested `1bbe187c088b86d104a16e420058f17425f18828` / partner-reported `fasttrack-lab6-00001-74k`)
- **Outgoing Reproducible Defects Found:** **none** (`0` reproducible product defects)

## Summary

No reproducible product defects (`none`) were found in `fastTrack` Sprint 1 across the eight executed UAT cases (`UAT-01` through `UAT-08`) or in the separate isolated Section 3.5 controlled exercise.

- The `18 November 2026` (`14:37:42–14:50:33 Asia/Bangkok`) Codex technical run `L6-CPMS-AI-20261118-144203` recorded **8/8 PASS** across `UAT-01`–`UAT-08` with `18` active observations; one harness-count observation is retained as invalidated and is not a product defect.
- The `19 November 2026` (`~09:00–11:44 Asia/Bangkok`) user-reported joint human testing/review session (`Magiciancat9` responsible for `UAT-01`–`UAT-04`, `martinvadre` responsible for `UAT-05`–`UAT-08`) reported **8/8 PASS**, **0** outstanding defects, and **Accepted** (human-evidence/revision-readback limitations retained in [fastTrack closeout](fasttrack-closeout-20261119.md) and [execution log](execution-log.md)).
- Historical `14 November 2026` Batch 1 `BLOCKED` entries (`pending partner credentials and session confirmation`) remain preserved as historical records and are not rewritten as past passes.
- No passwords, bearer tokens, cookies, or private student IDs are included in this report.

## Executed Cases (`UAT-01` through `UAT-08`)

| Case | Requirement / AC | Result | Supporting Evidence |
|---|---|---|---|
| `UAT-01`: Create and read a milestone | FR-01/02/03; AC-01.1/01.5, AC-02.1 | PASS | [UAT-01 image](evidence/fasttrack-sprint1-20261118/UAT-01-student-normal.png); [observations](evidence/fasttrack-sprint1-20261118/observations.json) |
| `UAT-02`: Submit work and read append-only feedback | FR-04/05; BR-07; AC-03.1, AC-04.1/04.4 | PASS | [UAT-02 image](evidence/fasttrack-sprint1-20261118/UAT-02-student-two-feedback.png); [saved work ledger](evidence/fasttrack-sprint1-20261118/saved-work-ledger.json) |
| `UAT-03`: Enforce one shared submission per team per milestone | BR-05; AC-03.3 | PASS | [UAT-03 image](evidence/fasttrack-sprint1-20261118/UAT-03-existing-submission.png); [observations](evidence/fasttrack-sprint1-20261118/observations.json) |
| `UAT-04`: Reject late submission after milestone deadline | BR-04; AC-03.2 (late case) | PASS | [UAT-04 image](evidence/fasttrack-sprint1-20261118/UAT-04-stale-form-after-deadline.png); [deadline observation](evidence/fasttrack-sprint1-20261118/deadline-observation.json) |
| `UAT-05`: Forbidden ownership / disclosure | BR-02; AC-01.5/02.2/03.5/04.2 | PASS | [UAT-05 image](evidence/fasttrack-sprint1-20261118/UAT-05-foreign-submission.png); [observations](evidence/fasttrack-sprint1-20261118/observations.json) |
| `UAT-06`: Forbidden role and invalid input | Role & input validation | PASS | [UAT-06 image](evidence/fasttrack-sprint1-20261118/UAT-06-ftp-link.png); [observations](evidence/fasttrack-sprint1-20261118/observations.json) |
| `UAT-07`: Logout, anonymous access, and account switch | Session & auth isolation | PASS | [UAT-07 image](evidence/fasttrack-sprint1-20261118/UAT-07-same-profile-switched-to-SB.png); [observations](evidence/fasttrack-sprint1-20261118/observations.json) |
| `UAT-08`: Persistence / feedback association | Reload & relogin persistence | PASS | [UAT-08 image](evidence/fasttrack-sprint1-20261118/UAT-08-student-relogin.png); [persistence comparisons](evidence/fasttrack-sprint1-20261118/persistence-comparisons.json) |

## Defect-to-Case & Retest Traceability Table

| Report ID | Product / Tested Version | Linked Failing Case & AC | Severity & Reason | Supporting Evidence | Delivery & Partner Reply | Retest Result (`Lab6-12`) |
|---|---|---|---|---|---|---|
| **none** | `fastTrack` Sprint 1 (`8e637e537cd037d630a5fffc1b5672d1b44371a8`) | None (`UAT-01`–`UAT-08` all `PASS`; 0 failures) | N/A (`0` reproducible defects) | [case summary](evidence/fasttrack-sprint1-20261118/case-summary.json); [closeout](fasttrack-closeout-20261119.md) | No outgoing defect report was sent because no reproducible defect was found; separate coordination evidence only: acceptance record and Section 3.5 confirmation delivered, partner receipt recorded `2026-11-19 12:42:46 Asia/Bangkok` ([partner receipt](evidence/fasttrack-closeout-20261119/partner-receipt.json)) | Not required (`0` Sprint 1 failures; Sprint 1 **Accepted** and separate Section 3.5 exercise **PASS / Accepted** in [retest and acceptance](retest-and-acceptance.md) and [section 3.5 retest](fasttrack-section35-retest-20261119.md)) |
