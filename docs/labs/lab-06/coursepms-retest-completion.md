# CoursePMS corrected-release retest — technical result received

**Scope: CoursePMS as the product under test only.** The user acknowledged the incoming technical result in the current chat on 17 November 2026 and requested that reciprocal testing of fastTrack be deferred. This is a product-side acknowledgement, not fastTrack's independent human acceptance decision or either student's personal case-execution signature.

Later confirmation update: the user has now supplied fastTrack's actual joint
A/B **ACCEPTED** declaration, recorded 17 November **22:30:56 Asia/Bangkok**
for this exact release. [Accepted record and limits](coursepms-acceptance-confirmed.md).
The earlier technical receipt and the later team declaration are distinct events;
neither is converted into separately observed signatures or historical case attendance.

## Receipt and integrity

Source: private `FastTrack_CoursePMS_Completed_Retest_20261117.zip` and companion `message (12).txt`, supplied by the user. All **34 payload hashes** in the ZIP manifest match. Original files, screenshots, earlier failures and initial runner diagnostics remain unchanged in the private local archive. No archived runner or executable was run by this intake. No screenshot, credentials or private proposal field values are published here.

[Sanitized provenance/result ledger](evidence/coursepms-closeout-20261117/partner-retest-summary.json) retains archive/message hashes, exact source, attribution and separate denominators. External message delivery time/channel and a named independent human decision are not supplied by the package; they are not invented from a draft or the current time.

## Exact tested release and execution windows

| Field | Actual retained record |
| --- | --- |
| Product / URL | CoursePMS / <https://course-pms-859617270560.asia-southeast1.run.app> |
| Tested deployed source | `aeb804ea5bc667399b00cf54df10046a6ded46e0` |
| Release identity | `course-pms-00009-mk2`, dated 100% traffic and immutable digest in [release evidence](release-evidence.md) |
| Original targeted execution | 17 November, **19:11–19:15 Asia/Bangkok** |
| Additional no-team/role-denial execution | 17 November, **21:30–21:33 Asia/Bangkok** |
| Operator | **Codex AI for fastTrack**, not either student's personal execution |
| Product-side receipt | User supplied the files and stated “ฉันรับผลเลย” in this chat; exact message timestamp was not supplied by the client |
| Formal fastTrack decision about CoursePMS | **ACCEPTED**, joint A/B declaration recorded 17 November 2026 22:30:56 Asia/Bangkok, relayed through the project representative; full private identities and method supplied in the later supplement |

## Current targeted case results

| Case | Retained technical result | Evidence scope |
| --- | --- | --- |
| RT-01 | PASS | Same-document A -> logout -> B without refresh clears all four fields/private text; earlier AUTH-01–03 |
| RT-02 | PASS | Reverse/own-proposal restoration and later R -> A preserve original saved fields; earlier AUTH-04–05 and ADD-04–05 |
| RT-03 | PASS | New no-team student has no stale editor/private strings; Instructor destination authorized; ADD-01–03 and earlier AUTH-06–07 |
| RT-04 | PASS | Saved draft reload/relogin persistence without saving; earlier AUTH-05 |
| RT-05 | PASS | Recorded temporary-session logout replays rejected; sessions/storage cleaned; earlier AUTH-02/08, ADD-02/08, GUARD-04 |
| RT-06 | PASS, bounded denial procedure | Foreign private GET denial plus Student review rejection with unchanged complete authorized directory; earlier AUTH-03 and GUARD-01–03 |
| RT-07 | PASS — evidence review and isolated replay | Exact-source inspection plus **16 client** and **19 selected/mocked server** passing tests; no deployed race injection |
| RT-08 | PASS | Assigned/own, foreign, unassigned and Instructor directory paths; earlier AUTH-01/03/07 and ADD-03/07 |
| RT-09 | PASS | Anonymous/authenticated JSON routing and frontend HTML; earlier PUB-03–07/AUTH-03 |

This is **eight deployed targeted case PASS plus one evidence-review/local-replay PASS**. It is not nine live-browser passes or exhaustive acceptance of all requirements. Earlier PARTIAL/BLOCKED results remain historical records and are superseded for these current technical subchecks, not erased.

The prior seven anonymous records, eight authenticated records and fourteen additional sanitized records are separate observation sets, not extra case assertions. Partner local replay is also separate from CoursePMS main CI (**41 backend / 16 frontend / 3 E2E**). Do not add these denominators together.

## RT-06 procedure assessment

The partner reports one Student request to `/api/proposals/0/review`, with invalid decision `NOT_A_DECISION` and empty feedback. ID 0 was absent from its Instructor-authorized directory baseline; no request targeted historical Proposal 3. The response was **403 `BR06_INSTRUCTOR_ROLE_REQUIRED`**, without a proposal. Complete authorized directory content before/after was identical, including Team 5 / three members / Proposal 3 APPROVED revision 2.

Inspection of the released `server/src/app.ts` confirms that the Student-role guard returns **before proposal lookup, proposal transaction or update**. This supports the bounded role-denial claim. The absence of a target record and deliberately invalid input are additional safeguards; this is not proof of successful Instructor review or a full database audit.

The procedure is technically suitable for this recorded negative-path observation. It was AI-selected under the partner user's continuation request; **prior external CoursePMS target agreement is not claimed retrospectively**. The current product-side acknowledgement does not manufacture a past agreement or a fastTrack human signature.

## Replay diagnostics and preservation

The unchanged client suite passed **16/16** under Node v20.20.2. Two earlier Node v26.13.0 attempts each had **9 PASS / 7 FAIL** because global localStorage was undefined before seven tests; logs are preserved as runner-compatibility diagnostics, not seven confirmed product defects.

The partner's separate server selection passed **19/19**: nine supplied domain, eight supplied mocked routing/privacy and two new independent mocked review-role tests. This is not the complete 41-test backend/database suite, build, Docker or E2E rerun. No new runtime compatibility fix or deployment is required by the reported bounded result.

The partner reports zero successful business writes, memberships, saves, submits, resets, seeds or deletes. Team 5 / Proposal 3 remains APPROVED revision 2 in its bounded authorized readback. That evidence now supplies the formerly missing authenticated retest/readback observations; it must not relabel the earlier optional pipeline login **SKIP** as a pipeline PASS or claim CoursePMS students personally ran them.

## Product-side completion and remaining boundary

The user accepts receipt of these CoursePMS technical results. The defect/correction/release/targeted-retest chain is ready for task closure review; [CoursePMS product closeout](coursepms-product-closeout.md) maps the evidence and reviewer actions. No new CoursePMS defect is confirmed in this bounded result.

The independent decision about CoursePMS is now recorded **ACCEPTED** from fastTrack's later supplement. Exact per-member historical activity detail is still not supplied; that is an activity-granularity limit, not a pending product decision. Reciprocal fastTrack execution, findings and CoursePMS's decision about fastTrack remain deferred and unchanged.
