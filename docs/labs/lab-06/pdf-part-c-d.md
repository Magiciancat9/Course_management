# CPE334 Lab 6 — Independent UAT Report

## PDF source: Part C, Part D, contributions, and AI-use declaration

**Assembly status:** This Markdown is the second half of the final PDF source.
Combine it after [Part A–B](pdf-part-a-b.md) during final PDF rendering. The
PDF and LEB2 receipt remain outside Git and are not claimed by this source.
The planned pagination below must be checked against the rendered PDF before
submission.

## Planned contents continuation

| Planned PDF pages | Section | Contents / evidence |
|---:|---|---|
| 12–13 | Part C — findings and disposition | Incoming triage, severity, outgoing findings, limitations |
| 14–17 | Part D — correction and release | RED/GREEN excerpts, review/CI, release, smoke, retest |
| 18 | Final decisions and version table | Both product directions; source/revision trace |
| 19 | Contributions, AI use, known limitations | Dated activity record and final assembly checklist |

---

# Part C — Findings, triage, severity, and disposition

## C.1 Received findings about CoursePMS

The independent fastTrack package identified one original client-side
account-switch exposure and two related contract/privacy/routing findings.
The original technical run was AI-operated and recorded **56 PASS / 1 FAIL /
57 assertions**; a separate 58-total narrative was an arithmetic discrepancy,
not an additional product defect. Findings below are the Product Team's
records for CoursePMS, distinct from our outgoing fastTrack findings.

| Finding / tested baseline | Classification and severity | Reason and disposition | Resolution status |
|---|---|---|---|
| `L6-OUT-EXP-001` / `9c22735995c985aaa0622b6b179de1ac9c1f80ca` | **Accepted defect — Major** | In a reused tab, Account B could see Account A's four draft editor fields after logout/login without reload. This was client-memory exposure under BR-06 ownership/privacy; it did not establish a server API authorization bypass. | Fixed through #71, reviewed correction chain #72/#73, released as `aeb804e…` / `course-pms-00009-mk2`; targeted retest recorded PASS in its stated modes. |
| Foreign directory proposal metadata | **Accepted defect — Major** | The roster-only contract did not permit foreign proposal title/summary metadata. User-selected policy was roster-only visibility; foreign proposal details must be private. | Fixed in #74: foreign `proposal: null`, own/instructor details retained; targeted privacy/retest checks PASS. |
| Bare `GET /api/proposals` returned SPA HTML | **Accepted defect — Minor** | AC-03 protects `/api/proposals`; unsupported API routes must remain JSON, not fall through to the frontend shell. | Fixed in #75: authenticated proposal namespace and JSON 404 fallback; targeted routing/retest checks PASS. |
| Original assertion total discrepancy | **Not a product defect** | The retained ledger has 57 records; no missing assertion is inferred from the 58-total narrative. | Recorded as evidence-summary discrepancy only. |

### C.2 Original severity rationale and evidence boundary

The Major draft-isolation finding exposed prior private proposal fields to the
next account before a reload. Reload clearing the fields was a workaround, not
a correction. The evidence showed a client-state boundary failure; it did not
show that Account B could read or persist Account A's data through an
unauthorized API request. The two additional accepted defects were resolved
without expanding the agreed Sprint 1 feature scope.

Historical screenshot/evidence identifiers for the original report include
`UI-24`, `UI-25`, `UI-26`, and `CPMS-UI-022`; private originals are retained
outside public Git. The sanitized triage record is [triage.md](triage.md).

## C.3 Outgoing findings about fastTrack

CoursePMS independently tested fastTrack Sprint 1 `8e637e537cd037d630a5fffc1b5672d1b44371a8`.
The dated technical run recorded UAT-01–08 as 8 PASS with zero reproducible
product defects. Therefore **no outgoing defect report was sent**. The
separate Section 3.5 exercise passed for its exact isolated scope and is not
substituted for the Sprint 1 result.

| Product / scope | Reproducible defects | Disposition | Evidence boundary |
|---|---:|---|---|
| fastTrack Sprint 1, UAT-01–08 | 0 | No outgoing defect report required | 18 November Codex technical run; later user-reported joint human decision has retained granularity limits |
| fastTrack Section 3.5 isolated exercise | 0 | PASS / Accepted for the isolated exercise | 3/3 observed cases and 16/16 snapshot comparisons; not a replacement Sprint 1 run |

See [outgoing defect reports](defects-outgoing.md) for case/evidence links.

## C.4 Known limitations retained in the record

- The CoursePMS pre-deployment notification to fastTrack was not sent before
  the automatic deployment. This historical process exception cannot be
  completed retrospectively or timestamped later.
- The release record has dated CLI identity/traffic evidence, but no separate
  owner console screenshot.
- The optional pipeline authenticated-login smoke was skipped; it is not
  presented as a pass. Later partner technical retest evidence is separately
  attributed.
- The fastTrack human-session declaration lacks individual case times,
  fixture IDs, Network captures, and separate personal screenshots. Codex
  technical screenshots remain machine evidence, not personal-action proof.
- The final decisions below apply only to identified versions and recorded
  scope; they are not a guarantee for later releases or untested features.

---

# Part D — RED/GREEN correction, release, retest, and acceptance

## D.1 Accepted-defect RED/GREEN chain

| Defect | RED evidence | GREEN evidence and correction | Final verified status |
|---|---|---|---|
| #71 / `L6-OUT-EXP-001` Major session isolation | At `d3ea0116`, `npm run test:client`: 5 failed / 4 passed. Follow-up stale-session test commit `9834080`: 3 failed / 11 passed. | At `3b7de940`, same initial suite: 9 passed. At `6de3c9a`, follow-up client suite: 14 passed. The client now clears session-scoped private state and guards stale loads/actions. | Integrated/reviewed correction; targeted RT-01–05 and RT-07 PASS in their stated modes. |
| #74 Major foreign proposal metadata | At `dd45d9e`, routing/privacy server suite: 6 failed / 2 passed (including privacy); directory client suite: 1 failed / 14 passed. | At `b29109d`, routing/privacy suite: 8 passed; with domain suite: 17 passed; directory client suite: 15 passed, later 16 with instructor regression. | Deployed roster-only privacy correction; targeted RT-03/08 PASS. |
| #75 Minor protected JSON routing | At `dd45d9e`, four unsupported/protected-routing failures were part of the 6 failed / 2 passed HTTP suite. | At `b29109d`, same HTTP suite: 8 passed. Unsupported API paths now return JSON 404 and protected proposal namespace rejects unauthenticated access. | Deployed; RT-09 PASS. |

### D.2 Readable regression-test excerpts

**Session-isolation RED command and result**

```text
Command: npm run test:client
Commit:  d3ea0116 (unfixed replay)
Result:  Test Files 1 failed | 1 passed (2)
         Tests 5 failed | 4 passed (9)
```

**Session-isolation GREEN command and result**

```text
Command: npm run test:client
Commit:  3b7de940 (corrected)
Result:  Test Files 2 passed (2)
         Tests 9 passed (9); 0 skipped
```

The later follow-up suite at `6de3c9a` passed 14 client tests. These are
local synthetic-fixture regression checks, not deployed independent UAT.
The original/follow-up RED and GREEN output is retained in
`evidence/session-followup/` and `evidence/followup-20261117/`.

### D.3 Relevant code correction

The correction in `client/src/App.tsx` established a session-scoped state
boundary. It clears proposal editor and related private workspace/review state
when identity changes, initializes all four proposal fields to either the
authorized current proposal or empty values, and guards dashboard loads and
mutation callbacks with a session generation plus abort handling. It preserves
same-session typing and non-401 logout-failure behaviour. The #74/#75 changes
sanitize foreign directory proposal data and protect/fallback API routing.

## D.4 Review, CI, release, and smoke evidence

| Stage | Actual record |
|---|---|
| Correction review / integration | #72 and #73; integrated correction head `ae6f3648460c950a2b592407102205f21a905813` |
| Release PR and approval | #76, release head `54ac5ee7678900bde9969b3c0aeac39635aea484`; independently approved by `martinvadre` before merge |
| Released main / revision | `aeb804ea5bc667399b00cf54df10046a6ded46e0` / `course-pms-00009-mk2` |
| Deployment | GitHub Actions run `44074859743`, SUCCESS; dated CLI traffic showed 100% `course-pms-00009-mk2` |
| Main CI | 41 backend, 16 frontend, 3 E2E passed; zero skipped; production/Docker builds passed |
| Public smoke | 8/8 anonymous checks passed: health/ready source and database, protected JSON 401, JSON 404 fallback, root/frontend HTML |
| Authenticated pipeline smoke | Skipped because optional credentials were not configured; not counted as PASS |

The reviewed release evidence, source/image identity, CI count excerpt, and
public smoke result are retained in [release evidence](release-evidence.md).

## D.5 Independent retest and final decisions

| Product / deciding UAT team | Exact version / evidence | Final recorded decision |
|---|---|---|
| CoursePMS / fastTrack | `aeb804e…` / `course-pms-00009-mk2`; eight targeted deployed PASS plus RT-07 evidence/isolated replay PASS | **ACCEPTED** — joint fastTrack A/B decision recorded 17 November 2026, 22:30:56 Asia/Bangkok; representative-relayed confirmation and activity-granularity limits retained |
| fastTrack Sprint 1 / CoursePMS | `8e637e5…`; UAT-01–08 technical 8/8 PASS, zero outgoing defects | **Accepted** — user-reported joint CoursePMS decision, 19 November 2026; human-session/evidence limitations retained |
| fastTrack Section 3.5 / CoursePMS | `1bbe187…` / partner-reported `fasttrack-lab6-00001-74k`; 3/3 PASS and 16/16 snapshot comparisons | **PASS / Accepted** for that isolated exercise only |

Only the relevant independent team makes each product decision. The two
directions, their source versions, and their evidence limitations remain
separate in [retest and acceptance](retest-and-acceptance.md).

## D.6 Version trace

| Stage | CoursePMS reference |
|---|---|
| Sprint 1 baseline | `v1.0.0-sprint1` / `5979f5870e8e28277996dc3045cbf4be5f7236ad` |
| Defective deployed baseline | `9c22735995c985aaa0622b6b179de1ac9c1f80ca` / historical `course-pms-00008-hbv` |
| Initial session-isolation RED / GREEN | `d3ea0116` / `3b7de940` |
| Follow-up session RED / GREEN | `9834080` / `6de3c9a` |
| Roster/routing RED / GREEN | `dd45d9e` / `b29109d` |
| Final correction / release head | `a309cea` / `54ac5ee` |
| Corrected main / Cloud Run revision | `aeb804ea5bc667399b00cf54df10046a6ded46e0` / `course-pms-00009-mk2` |

---

# Contributions, AI use, and final assembly controls

## Contribution record

| Work area | Recorded responsibility / contribution | Evidence boundary |
|---|---|---|
| CoursePMS product-side records | Tatchakorn (`Magiciancat9`) driver for #55/#57 documentation and release coordination; Pawarit (`martinvadre`) reviewer/merger under the issue workflow | Do not infer unrecorded personal execution from Git commits or AI runs. |
| fastTrack UAT | Reported allocation: Tatchakorn UAT-01–04; Pawarit UAT-05–08; joint review/testing reported 19 November | Detailed individual case times/actions were not retained. |
| Review and release | Pawarit recorded as #76 release reviewer/approver; Tatchakorn as release driver | Exact PR/release metadata is retained in `release-evidence.md`. |
| Section 3.5 | Joint file review reported by both members; Codex-assisted technical comparison | Technical browser/run timestamps are not personal action times. |

## AI-use declaration

Codex AI was used for code assistance, synthetic-fixture test execution,
evidence indexing, documentation drafting, and selected browser/API technical
observations. AI-operated observations are labelled as such and are not
presented as a student's personal execution, review, signature, or decision.
Human acceptance statements are recorded only as user-supplied/partner-supplied
declarations with their retained evidence limits. Students remain responsible
for reviewing the final PDF, verifying the cited records, and making the
actual LEB2 submission.

## Final assembly and submission checklist

- [ ] Render `pdf-part-a-b.md` followed by this file into one PDF.
- [ ] Reconcile the planned contents page ranges with actual rendered pages.
- [ ] Open the rendered PDF and verify tables, image captions, evidence IDs,
      readable screenshots, links/identifiers, and absence of secrets.
- [ ] Both students review the exact final PDF and record their real review.
- [ ] Submit the one PDF to LEB2 before 22 November 2026, 23:59 Asia/Bangkok.
- [ ] Save the real LEB2 receipt outside public Git; do not claim submission
      until the receipt exists.
- [ ] Keep repository and deployed services available through grading.
