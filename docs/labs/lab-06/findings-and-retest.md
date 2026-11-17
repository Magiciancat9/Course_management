# Findings, corrections and independent retests

CoursePMS corrections #71/#74/#75 are now deployed and the completed partner
technical retest is received and product-side acknowledged. See [case results](coursepms-retest-completion.md)
and [product closeout](coursepms-product-closeout.md). Formal independent human
acceptance is still pending; reciprocal fastTrack work is deferred unchanged.

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
| CoursePMS `L6-OUT-EXP-001` (reported by fastTrack) | Original account-switch failure on `9c227359`; corrected source `aeb804e…` / `course-pms-00009-mk2` | Original UI-24–26 failure preserved; corrected RT-01–05 and RT-07 now PASS in stated modes | Accepted Major; #71, reviewed #72/#73, release #76; [fix chain](fix-evidence.md) | Completed partner AI-operated technical result received; current user acknowledges receipt; formal fastTrack human decision pending |
| CoursePMS foreign proposal metadata | SDS roster-only / BR-06; source `aeb804e…` | Own/Instructor data preserved, foreign/null and no-team PRIVATE; RT-03/08 PASS | Accepted Major; [#74](https://github.com/Magiciancat9/Course_management/issues/74), [contract rationale](contract-dispositions.md) | Technical retest passes; no separate human acceptance invented |
| CoursePMS bare proposal/unknown API routing | AC-03 and JSON contract; source `aeb804e…` | Expected auth/JSON routing and HTML; RT-09 PASS | Accepted Minor; [#75](https://github.com/Magiciancat9/Course_management/issues/75), [contract rationale](contract-dispositions.md) | Technical retest passes; original report count discrepancy remains separate, not a product bug |

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
