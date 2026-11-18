# CoursePMS acceptance confirmation — ACCEPTED

**Decision: ACCEPTED.** The user supplied the partner's private acceptance supplement confirming the joint fastTrack A/B decision recorded on **17 November 2026 at 22:30:56 Asia/Bangkok (UTC+07:00)**. This decision is now recorded for CoursePMS; it is no longer pending merely because individual evidence-review detail is incomplete.

## Accepted release and evidence

| Field | Recorded confirmation |
| --- | --- |
| Product / accepting independent team | CoursePMS / fastTrack (InfaCompany, EN-028, Section 31) |
| Accepted source | `aeb804ea5bc667399b00cf54df10046a6ded46e0` |
| Accepted serving revision | `course-pms-00009-mk2` |
| Service | <https://course-pms-859617270560.asia-southeast1.run.app/> |
| Evidence accepted | Existing completed targeted retest, 17 November 19:11–19:15 and 21:30–21:33 Asia/Bangkok |
| Deployed result | RT-01–06 and RT-08–09: eight targeted PASS |
| RT-07 mode | Evidence inspection and isolated replay PASS; 16 client and 19 selected/mocked server tests, separate sets |
| Confirming members | A and B; full names/student IDs are supplied in the private original and retained for the teams' report, not republished here |
| Confirmation method | Project representative expressly confirmed the current joint A/B acceptance in the working conversation; B's confirmation is relayed through that representative |
| Individual submissions/signatures | Two separately observed personal submissions or signatures were **not collected**; no direct signature is invented |

The original supplement is `CoursePMS_Acceptance_Confirmation_Supplement_20261117.md`, SHA-256 **762847b91b722011fe93d5cb6b08657f6f6a0f9bbf54fd6dc8b5a9a001a9e30a**. It contains private student identities and is held outside public Git. The [sanitized confirmation ledger](evidence/coursepms-closeout-20261117/acceptance-confirmation-summary.json) preserves provenance and scope. The supplied declaration time is not an AI test time, a newly invented personal review time, or a proved external delivery timestamp.

## Decision reason and limits

fastTrack accepts the identified corrected release because the completed evidence supports correction of the original no-refresh private-draft exposure. Recorded Student/Instructor directory privacy, access denial, logout replay, saved-state restoration and JSON/frontend routing pass within their stated scope. The authorized comparison remains unchanged, including Team 5 / three members / Proposal 3 APPROVED revision 2. No new confirmed product failure was observed in the bounded retest.

The confirmation adds **no additional product acceptance condition** beyond the recorded limits:

- It applies to the exact release and targeted plan, retaining original deviations/count reconciliation; it is not an exhaustive guarantee for later releases or every feature.
- RT-07 is evidence review/replay, not deployed race injection or a full backend/E2E rerun. Test and live-case denominators remain separate.
- Student review denial used invalid input against ID 0, returned 403 `BR06_INSTRUCTOR_ROLE_REQUIRED`, and did not target Proposal 3. One rejected endpoint POST occurred; no successful business write or fixture mutation is claimed.

The recorded decision is **ACCEPTED**, not a newly selected “Accepted with minor limitations” outcome. The documented evidence limits remain attached without changing the partner's actual decision label.

## Personal activity detail remains distinct

The supplement reports shared checking/support and representative-confirmed participation, but does not identify each person's historical case items and individual execution/review times. Its new A/B review allocation is prospective: completion/time is not yet attested. Do not turn those assignments, GitHub evidence-integration events, the common decision time or AI-run timestamps into completed personal case rows.

This is a **human-activity granularity limit**, not a pending product acceptance decision. Original browser/API/replay execution remains attributed to Codex AI for fastTrack. Any later personal review entry must use the actual evidence item and real time.

## CoursePMS-only task effect

The CoursePMS-facing collection requirement in #58 now has an actual recorded partner decision, exact version, reason, confirmation time and private identities. Record that component as received. The overall reciprocal #58 task stays open until its separate fastTrack-facing work is completed; no decision about fastTrack is selected here.

Correction #56 and resolved bugs #74/#75 were already technically closed. #55/#57 remain for reviewer `martinvadre` to inspect the current closeout and disposition the retained notification exception before closure. The ACCEPTED product decision does not fabricate a pre-deployment notice, remove historical diagnostic logs or supply an owner console screenshot. No new test, source change, release/deployment, message delivery or PDF is performed by this confirmation intake.
