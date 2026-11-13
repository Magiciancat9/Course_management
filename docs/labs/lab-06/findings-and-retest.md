# Findings, corrections and independent retests

**No findings or retests are recorded in this document yet.** An empty list
does not establish that the products have no defects.

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
| No finding recorded | Not recorded | Not observed | Not assessed | Not run |

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
