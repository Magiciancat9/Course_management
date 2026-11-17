# Findings, corrections and independent retests

L6-OUT-EXP-001 is recorded below. See the dated [incoming triage](triage.md),
[follow-up verification](session-followup.md), and [return package](return-to-fasttrack.md)
for the 17 November continuation of #71 / #72 in Draft PR #73. Independent
retest and final acceptance remain pending.

## Report and triage

The independent UAT team reports an observed mismatch to the relevant
Product Team through **private chat**. Record a sanitized finding here, its
delivery time and acknowledgement; do not copy credentials or private messages.

| Field | Record for each actual finding |
|---|---|
| Finding ID, product and reporter | Unique ID, CoursePMS or fastTrack, independent tester |
| Baseline and time | URL, tested commit, serving revision, date/time and time zone |
| Traceability | Case ID, subcheck, requirement/AC and fixture |
| Reproduction | Numbered steps and synthetic input; expected versus actual |
| Impact and severity | User impact and Critical/Major/Minor assessment |
| Evidence and communication | Sanitized screenshot/response ID, delivery and acknowledgement |
| Triage | Accepted defect, duplicate with link, not-defect with contract reasoning, or out-of-scope enhancement |
| Owner and fix | Issue, reviewed PR, test and deployed source/revision |
| Independent retest | Tester, date/time, exact new release, steps, actual result and evidence |

Reproduce or clarify before dismissing. Do not call a failure of an agreed
requirement an enhancement. Record rejected-write before/after state and
actual HTTP status only if observed. Protect account identifiers and never
publish passwords, tokens or authorization headers.

| Direction / finding | Case / tested release | Actual result / evidence | Triage / owner | Independent retest |
|---|---|---|---|---|
| CoursePMS `L6-OUT-EXP-001` (reported by fastTrack) | Account-switch check (`CPMS-L6-20261114-155049`) on `9c227359` / `course-pms-00008-hbv` | Prior-account 4-field draft remained visible after Logout -> Suda login without reload; reload cleared fields (`CPMS-UI-022`, `UI-24`–`UI-26`) | Accepted Defect (Major), Issue [#71](https://github.com/Magiciancat9/Course_management/issues/71); fix on `fix/lab6-10-l6-out-exp-001-draft-isolation` (`@martinvadre` driver, `@Magiciancat9` reviewer); see [Fix evidence](fix-evidence.md) | Pending teammate review, authorized release, and independent fastTrack retest |

## Correction and retest workflow

1. The relevant Product Team acknowledges and triages the actual finding.
2. For an accepted defect, link its issue and add a meaningful regression
   test that fails before the fix (RED) and passes after it (GREEN). Record
   broader regression results and the reviewed PR/CI.
3. Record the deployed fix commit and serving revision; notify the
   independent team of the changed baseline.
4. The independent team repeats the failed case on the fixed release,
   records observations and evidence, and retains the original result.
5. Critical/major defects and required blocked work prevent acceptance.
   Minor limitations require explicit independent acceptance if not fixed.

If no genuine defect is found, record the actual UAT outcome and consult the
instructor/TA about any separate controlled exercise. Never invent a defect
or deliberately damage the assessed release.
