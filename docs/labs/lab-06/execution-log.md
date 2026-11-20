# Lab 6 independent UAT execution log (`fastTrack`)

**19 November update:** the Batch 1 block below is historical. Later authenticated Codex UAT-01–08 evidence, the user-reported joint human acceptance and partner receipt are now recorded in [current fastTrack closeout](fasttrack-closeout-20261119.md). No old blocked entry is rewritten as a past personal pass.


> Historical batch record below. On 17 November, the supplied reciprocal
> archives were reviewed and their later AI-operated API/UI observations and
> deviations are summarized in [report Part B](report-draft.md) and
> [return package section E](return-to-fasttrack.md). Earlier BLOCKED entries
> remain historical; the new evidence is not personal execution by the named
> students. Real per-case participation and exact-version decision are pending.

**Status: Batch 1 recorded as BLOCKED pending partner credentials and session
confirmation.** `BLOCKED` is not a pass; do not replace partner-provided UAT
accounts or independent student execution with unauthenticated or synthetic
substitutes.

## Unblock conditions (before `UAT-01` through `UAT-04` can start)

1. `fastTrack` delivers private test-account credentials (`SA` and `A1`, plus
   `SB` for Batch 2) and confirms `SA`/`A1` Team A assignment via private chat.
2. `fastTrack` confirms the agreed session date/time (`Asia/Bangkok`) and the
   active serving Cloud Run revision/traffic matching
   `8e637e537cd037d630a5fffc1b5672d1b44371a8`.

## Session metadata (Batch 1)

| Field | Recorded value |
|---|---|
| Product under test | `fastTrack` (`EN-028, Section 31, InfaCompany`) |
| Application URL | <https://fasttrack-app-kpx7au3w2a-as.a.run.app> |
| Partner UAT package | [fastTrack Lab 6 UAT cases](https://github.com/zerotwobook/fastTrack/tree/docs/s2-a-lab6-uat/docs/labs/lab-06) |
| Selected source | `8e637e537cd037d630a5fffc1b5672d1b44371a8` |
| Anonymous pre-check (`2026-11-14T19:07+07:00`, `Asia/Bangkok`) | `GET /api/health` returned `HTTP 200` (`{"status":"ok","version":"8e637e537cd037d630a5fffc1b5672d1b44371a8"}`); `GET /api/ready` returned `HTTP 200` (`{"status":"ready","database":"connected","version":"8e637e537cd037d630a5fffc1b5672d1b44371a8"}`). |
| Serving Cloud Run revision / traffic | Unconfirmed by `fastTrack` Product Team at check time |
| Planned UAT Team (`EN-022_P6`) | Pawarit Wongdaeng (`martinvadre`, Batch 1 driver), Tatchakorn Thamnimitr (`Magiciancat9`, observer/co-tester) |

## Batch 1: `UAT-01` through `UAT-04` (Lab6-06)

All four Batch 1 cases require authenticated sessions as `fastTrack` accounts
`SA` (supervisor) and `A1` (student), plus confirmed Team A assignment and
session revision/traffic confirmation from the `fastTrack` Product Team (see
[partner pairing and schedule](partner-and-schedule.md)).

### `UAT-01`: Create and read a milestone

- **Requirement / AC:** FR-01/02/03; AC-01.1/01.5, AC-02.1
- **Category:** Normal journey
- **Testers & roles:** Pawarit Wongdaeng (`SA`/`A1` driver), Tatchakorn Thamnimitr (observer)
- **Date / time (`Asia/Bangkok`):** `2026-11-14T19:34+07:00`
- **Tested version:** `https://fasttrack-app-kpx7au3w2a-as.a.run.app` (`version: 8e637e537cd037d630a5fffc1b5672d1b44371a8`; Cloud Run revision unconfirmed by partner)
- **Inputs used:** None executed (no `SA`/`A1` credentials delivered)
- **Actual result:** Could not sign in as `SA` or `A1` because `fastTrack` has not delivered private `SA`/`A1` credentials, confirmed `SA`/`A1` Team A assignment, or confirmed the active serving Cloud Run revision for this session. Anonymous `/api/health` and `/api/ready` both returned `HTTP 200` with `version: 8e637e537cd037d630a5fffc1b5672d1b44371a8`.
- **Result:** **BLOCKED**
- **Reason / dependency:** Missing private `SA` and `A1` credentials and partner session/revision confirmation from `fastTrack`.
- **Evidence / finding:** Preparation health/readiness check only; no authenticated UI/API execution possible yet.

### `UAT-02`: Submit work and read append-only feedback

- **Requirement / AC:** FR-04/05; BR-07; AC-03.1, AC-04.1/04.4
- **Category:** Normal journey and exact-version feedback
- **Testers & roles:** Pawarit Wongdaeng (`A1`/`SA` driver), Tatchakorn Thamnimitr (observer)
- **Date / time (`Asia/Bangkok`):** `2026-11-14T19:34+07:00`
- **Tested version:** `https://fasttrack-app-kpx7au3w2a-as.a.run.app` (`version: 8e637e537cd037d630a5fffc1b5672d1b44371a8`; Cloud Run revision unconfirmed by partner)
- **Inputs used:** None executed
- **Actual result:** Not executed because `UAT-02` requires an active `NORMAL_MILESTONE_ID` from `UAT-01` and authenticated `A1` and `SA` sessions, which are unavailable without `fastTrack` private credentials.
- **Result:** **BLOCKED**
- **Reason / dependency:** Blocked by `UAT-01` and missing private `SA`/`A1` credentials from `fastTrack`.
- **Evidence / finding:** None (blocked on `UAT-01` prerequisite).

### `UAT-03`: Enforce one shared submission per team per milestone

- **Requirement / AC:** BR-05; AC-03.3
- **Category:** Business rule (one shared submission)
- **Testers & roles:** Pawarit Wongdaeng (`A1` driver), Tatchakorn Thamnimitr (observer)
- **Date / time (`Asia/Bangkok`):** `2026-11-14T19:34+07:00`
- **Tested version:** `https://fasttrack-app-kpx7au3w2a-as.a.run.app` (`version: 8e637e537cd037d630a5fffc1b5672d1b44371a8`; Cloud Run revision unconfirmed by partner)
- **Inputs used:** None executed
- **Actual result:** Not executed because `UAT-03` depends on saved work from `UAT-02` and an authenticated `A1` session.
- **Result:** **BLOCKED**
- **Reason / dependency:** Blocked by `UAT-02` and missing private `A1` credentials from `fastTrack`.
- **Evidence / finding:** None (blocked on `UAT-02` prerequisite).

### `UAT-04`: Reject late submission after milestone deadline

- **Requirement / AC:** BR-04; AC-03.2 (late case)
- **Category:** Business rule / boundary (deadline)
- **Testers & roles:** Pawarit Wongdaeng (`SA`/`A1` driver), Tatchakorn Thamnimitr (observer)
- **Date / time (`Asia/Bangkok`):** `2026-11-14T19:34+07:00`
- **Tested version:** `https://fasttrack-app-kpx7au3w2a-as.a.run.app` (`version: 8e637e537cd037d630a5fffc1b5672d1b44371a8`; Cloud Run revision unconfirmed by partner)
- **Inputs used:** None executed
- **Actual result:** Not executed because creating the `DEADLINE` milestone and attempting submission require authenticated `SA` and `A1` sessions, which are unavailable without `fastTrack` private credentials.
- **Result:** **BLOCKED**
- **Reason / dependency:** Missing private `SA` and `A1` credentials and partner session/revision confirmation from `fastTrack`.
- **Evidence / finding:** None (blocked on missing partner credentials).

## Batch 2: `UAT-05` through `UAT-08` (Lab6-07)

**Status: recorded from the retained 18 November technical run and the 19
November user-reported joint human session.** This section does not claim that
this PR ran a new session, and it does not relabel the historical 14 November
Batch 1 blocks as personal passes.

### Recorded-session metadata

| Field | Recorded value |
|---|---|
| Product under test | `fastTrack` Sprint 1 |
| Application / source | <https://fasttrack-app-kpx7au3w2a-as.a.run.app> / `8e637e537cd037d630a5fffc1b5672d1b44371a8` |
| Technical evidence | Codex run `L6-CPMS-AI-20261118-144203`, 18 November 2026 14:37:42--14:50:33 Asia/Bangkok |
| Reported joint human work | User-declared 19 November 2026, approximately 09:00--11:44 Asia/Bangkok; `martinvadre` responsible for UAT-05--08, with both CoursePMS members jointly participating |
| Human-evidence limitation | No separate human-session screenshot, fixture ID, Network capture, or per-case time was retained. The dated screenshots below are Codex technical evidence, not personal-action screenshots. |
| Release limitation | Health/readiness were recorded as HTTP 200 with the expected source; Cloud Run revision/traffic was not independently read back for the technical run. |

The full provenance, including the separate user declaration and its limits, is
retained in [fastTrack closeout](fasttrack-closeout-20261119.md). All evidence
references below are sanitized and contain no credentials, tokens, or headers.

| Case | Actual recorded result | Result | Evidence |
|---|---|---|---|
| UAT-05: forbidden ownership / disclosure | Supervisor B could not access Team A data. The Team A, milestone, submission, and feedback API reads returned generic `404 NOT_FOUND`; the authorized Team A record remained unchanged. | PASS | [foreign-submission image](evidence/fasttrack-sprint1-20261118/UAT-05-foreign-submission.png); [observation ledger](evidence/fasttrack-sprint1-20261118/observations.json) |
| UAT-06: forbidden role and invalid input | Student milestone creation and feedback writes were rejected with `403 FORBIDDEN`. Whitespace-only fields and an `ftp://` work link did not create saved records; authorized state remained unchanged. | PASS | [validation image](evidence/fasttrack-sprint1-20261118/UAT-06-ftp-link.png); [observation ledger](evidence/fasttrack-sprint1-20261118/observations.json) |
| UAT-07: logout, anonymous access, and account switch | Anonymous and post-logout reads returned `401`; one incorrect-password attempt created no session; switching the same profile from A1 to SB could not reveal Team A content and returned generic `404`. | PASS | [account-switch image](evidence/fasttrack-sprint1-20261118/UAT-07-same-profile-switched-to-SB.png); [observation ledger](evidence/fasttrack-sprint1-20261118/observations.json) |
| UAT-08: persistence / feedback association | The saved ID, version, author, time, work content, link, and two feedback messages matched after reload and relogin in the permitted views. | PASS | [relogin image](evidence/fasttrack-sprint1-20261118/UAT-08-student-relogin.png); [persistence comparisons](evidence/fasttrack-sprint1-20261118/persistence-comparisons.json) |

### Batch 2 summary

| Total cases | PASS | FAIL | BLOCKED |
|---:|---:|---:|---:|
| 4 | 4 | 0 | 0 |

There are no Batch 2 FAIL cases to hand to Lab6-08. Evidence coverage for the
lab's normal-journey screenshot requirement is retained for UAT-01 in the
[same technical run](fasttrack-closeout-20261119.md); Batch 2 supplies the
required negative/access evidence through UAT-05 and UAT-06. If any of these
cases is re-run against a later release, record it as a new session with its
own release identity and do not overwrite this dated record.
