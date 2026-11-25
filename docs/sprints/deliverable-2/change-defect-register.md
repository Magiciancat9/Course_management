# Lab 5–7 change and defect register — D2-01 v1.1

**Checked:** 22 Nov 2026. **Owner:** `Magiciancat9`; independent reviewer:
`martinvadre`. Work item: [#93](https://github.com/Magiciancat9/Course_management/issues/93).
This register distinguishes accepted history, current source verification,
and remaining work. A closed historical issue is not a new execution result.

## 1. Version and release identities

| Identity | Exact source / evidence | Meaning |
| --- | --- | --- |
| Original CoursePMS Sprint 1 | `v1.0.0-sprint1` → `5979f5870e8e28277996dc3045cbf4be5f7236ad` | Original accepted feature baseline; not the extra-hyphen fastTrack tag |
| Lab 5 reviewed release | `fa7f156aa782eea48c36be5f23eaa7336a582458`, [PR #36](https://github.com/Magiciancat9/Course_management/pull/36) | Cloud/CI delivery history |
| Lab 5 documentation release | `792f1ace9c5f8760e119ad61a3df3f6b7b6b29ac`, [PR #41](https://github.com/Magiciancat9/Course_management/pull/41) | Separate documentation promotion; later release history remains in Lab 5 evidence |
| Accepted Lab 6 / current main | `aeb804ea5bc667399b00cf54df10046a6ded46e0`, [PR #76](https://github.com/Magiciancat9/Course_management/pull/76) | Corrected Sprint 1 runtime; partner acceptance retained |
| D2 staging tested now | `8eea6f0a9820ad235b99548328394dabb86c6046`, merged [PR #107](https://github.com/Magiciancat9/Course_management/pull/107) | Reviewed contracts integrated; only 18 Markdown paths differ from accepted main |
| Current public service | [Health](https://course-pms-859617270560.asia-southeast1.run.app/api/health) reports `aeb804ea5bc667399b00cf54df10046a6ded46e0` | Fresh read-only observation at 19:45:40 Asia/Bangkok; not a D2 deployment |
| Accepted Sprint 2 / final D2 RC | Not yet available | Remains owned by #97/#103; no accepted tag/revision is invented |

The accepted serving revision `course-pms-00009-mk2` comes from the
[Lab 6 confirmation](https://github.com/Magiciancat9/Course_management/blob/6916f29bbd97b38e9a86a4284c2e0a0609f3ebbe/docs/labs/lab-06/coursepms-acceptance-confirmed.md).
The new public health check confirms a commit, not the Cloud Run revision
name; no console/revision lookup was performed during this task.

## 2. Accepted changes and resolved defects

All listed historical task/defect issues were CLOSED when inspected on
22 Nov 2026. The **owner** column records implementation/handoff responsibility,
not a claim that either student personally executed this task's automated tests.

| Entry / source | Type; requirement or feature | Owner / accepted disposition | Release and verification provenance | Remaining action |
| --- | --- | --- | --- | --- |
| [#19](https://github.com/Magiciancat9/Course_management/issues/19), [#23](https://github.com/Magiciancat9/Course_management/issues/23): GCP setup / provisioning | Infrastructure change; NFR-05 | Both members; existing cloud architecture retained | [Deployment inventory](../../labs/lab-05/deployment.md), Lab 5 C-04/C-06 in [evidence](../../labs/lab-05/evidence.md) | No new setup work in #93. Initial billing/IAM/budget checkboxes are a historical planning snapshot, not newly verified console evidence |
| [#20](https://github.com/Magiciancat9/Course_management/issues/20): runtime configuration, readiness and migration command | Infrastructure change; NFR-03/04/05 | Magiciancat9; accepted into Lab 5 release | Existing init migration and `prisma:migrate:deploy`; environment templates and readiness in deployment notes | For future schema work, #94–#96 owners add reviewed migrations and populated-upgrade checks; release driver martinvadre integrates them via #103 by 28 Nov |
| [#21](https://github.com/Magiciancat9/Course_management/issues/21): reproducible Docker build | Delivery change; NFR-05 | martinvadre; accepted | Lab 5 C-03 fresh-clone observation on `fa7f156...`; exact scope/limitations in evidence | New CI builds the image; it does not repeat fresh-clone Compose runtime or prove ≤10 s startup |
| [#22](https://github.com/Magiciancat9/Course_management/issues/22), [#25](https://github.com/Magiciancat9/Course_management/issues/25): PR CI / merge gate | Delivery change; NFR-05 | Magiciancat9; accepted | Passing [run 43146393669](https://github.com/Magiciancat9/Course_management/actions/runs/43146393669); deliberate failing [PR #38](https://github.com/Magiciancat9/Course_management/pull/38) / [run 43242578035](https://github.com/Magiciancat9/Course_management/actions/runs/43242578035), closed unmerged | The intentional failure is a gate exercise, not an unresolved product defect. Keep new CI source/result identities separate |
| [#26](https://github.com/Magiciancat9/Course_management/issues/26), [#27](https://github.com/Magiciancat9/Course_management/issues/27): release / durable data | Delivery and persistence change; NFR-04/05 | martinvadre release; both members persistence task; accepted history | Lab 5 C-05/C-06, [run 43362468746](https://github.com/Magiciancat9/Course_management/actions/runs/43362468746); saved team preserved across recorded redeploy | No restart/redeploy is performed now. New integrated-RC persistence remains #103 / D2-CONT-05 |
| [#24](https://github.com/Magiciancat9/Course_management/issues/24), [#40](https://github.com/Magiciancat9/Course_management/issues/40), [#42](https://github.com/Magiciancat9/Course_management/issues/42), [#44](https://github.com/Magiciancat9/Course_management/issues/44): evidence/document promotion | Documentation change; delivery provenance | Magiciancat9; #44 shared; accepted history | Lab 5 release trace and explicit screenshot/log limits | #100 corrects outdated setup claims via reviewed PR #107; final document reconciliation remains with Magiciancat9 by 28 Nov |
| [#71](https://github.com/Magiciancat9/Course_management/issues/71): stale private editor after account switch | Accepted Major defect; F-03 / BR-06 | martinvadre; resolved | Fix PRs #72/#73 → release #76 / `aeb804e`; accepted targeted RT-01–06/08–09 and bounded RT-07 replay | Current client session suites rerun in the new baseline CI; this is separate from historical deployed observations |
| [#74](https://github.com/Magiciancat9/Course_management/issues/74): foreign-team proposal metadata | Accepted Major defect; BR-06 | martinvadre; resolved under roster-only policy | Release #76 / `aeb804e`; recorded targeted RT-03/08 | Current API TEST-23, routing/privacy and client directory checks rerun; no private data in general team responses |
| [#75](https://github.com/Magiciancat9/Course_management/issues/75): protected API namespace served SPA | Accepted Minor defect; F-01 / AC-03 | martinvadre; resolved | Release #76 / `aeb804e`; recorded RT-09 | Current TEST-03 and routing/privacy checks rerun; unsupported APIs remain JSON 401/404, frontend routes retain HTML |

## 3. Open or explicitly retained items

| Item / current disposition | Owner / next action | Target or trigger / evidence rule |
| --- | --- | --- |
| [#85 CR-L7-01](https://github.com/Magiciancat9/Course_management/issues/85): proposed revision-feedback minimum 10→20; TA approval and user confirmation PENDING | Magiciancat9 records the actual TA response and user confirmation; subsequent contract/code work follows #86/#87 | Request target 23 Nov; actual TA response time is not promised. Keep BR-05 at 10 for both decisions until authorized. Pending Lab 7 does not block the current #93 baseline check |
| [#106](https://github.com/Magiciancat9/Course_management/issues/106): UI refresh / Quick Fill removal not implemented in the tested staging SHA | martinvadre implements; Magiciancat9 independently reviews, per user reassignment and [PR #108](https://github.com/Magiciancat9/Course_management/pull/108) | Proposed target 26 Nov, aligned with integrated feature availability; actual UIR tests/screenshots and accepted implementation still required |
| Historical missed pre-deployment notice / optional authenticated-smoke SKIP | Preserve the [Lab 6 release record](https://github.com/Magiciancat9/Course_management/blob/6916f29bbd97b38e9a86a4284c2e0a0609f3ebbe/docs/labs/lab-06/release-evidence.md); martinvadre follows the reviewed communication/check procedure at the next release | Retained process/evidence limitation; no retroactive notice or missing PASS is invented. Partner's recorded ACCEPTED decision remains unchanged |
| Integrated Sprint 2/3 RC continuity and populated-upgrade validation | Magiciancat9 owns #93 evidence; martinvadre supplies integrated RC/deployment via #103; feature owners provide real migrations | After #97 and actual Sprint 3 checkpoint integration; target 28 Nov. Re-execute D2-CONT-01–05 on that exact source, then record deployed checks as applicable |
| Startup timing and actual post-deploy access/persistence checks | martinvadre release driver; Magiciancat9 records matrix/evidence | #103 by 28 Nov. Docker build/HTTP readiness now is not the D2-SYS-T01 ≤10 s measurement or authenticated production workflow |

## 4. Fresh execution and closure rule

See [Sprint 1 continuity evidence](sprint1-continuity-evidence.md) for this
task's exact CI source, environment, commands, test counts, expected/actual
checks and live commit/readiness observations. Raw inspection data and logs
remain outside Git; only selected project evidence and source links are kept.

#93 can advance now without Lab 7 approval. Its final closure still requires
the actual integrated-RC continuity/upgrade evidence, independent review and
an updated disposition of any intervening change. Do not relabel this
pre-feature baseline as the completed Sprint 2–3 RC.
