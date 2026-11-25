# Deliverable 2 verification register

**25 November 2026 reconciliation (#97):** Sprint 2 F-04/F-05/F-06 are
implemented and independently reviewed. Contract review: PR #107. Actual
feature and combined verification: [Sprint 2 release ledger](../sprint-2/accepted-release.md).
Main acceptance is a separate gate. F-07 task AC01-06 now have a checkpoint implementation; peer/F-08 remain planned;
a reviewed specification is not an executed test.

## 1. Complete AC implementation/execution ledger

Sprint 2 rows below are implemented and passed their independently reviewed
feature-head CI. [Sprint 2 release ledger](../sprint-2/accepted-release.md)
records combined regression, exact candidate/run identity and pending main/tag gates.
F-07 task AC01-06 have executed checkpoint results in the task ledger;
F-07 peer AC07-12 and F-08 implementation remain NOT IMPLEMENTED / NOT RUN.

### S2-F04 — [f04-milestones.md](../sprint-2/f04-milestones.md)

Owner `martinvadre`; contract reviewed in PR #107; code reviewed in PR #116/#118.

| AC | Planned test IDs | Implemented | Actual verification / version |
| --- | --- | --- | --- |
| S2-F04-AC01 | S2-F04-T01 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F04-AC02 | S2-F04-T02, S2-F04-T03 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F04-AC03 | S2-F04-T04 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F04-AC04 | S2-F04-T05, S2-F04-T06 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F04-AC05 | S2-F04-T07 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F04-AC06 | S2-F04-T08 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F04-AC07 | S2-F04-T09 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F04-AC08 | S2-F04-T10, S2-F04-T11 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |

### S2-F05 — [f05-submissions.md](../sprint-2/f05-submissions.md)

Owner `Magiciancat9`; contract reviewed in PR #107; code reviewed in PR #117.

| AC | Planned test IDs | Implemented | Actual verification / version |
| --- | --- | --- | --- |
| S2-F05-AC01 | S2-F05-T01, S2-F05-T11 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F05-AC02 | S2-F05-T02 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F05-AC03 | S2-F05-T03 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F05-AC04 | S2-F05-T04 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F05-AC05 | S2-F05-T05 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F05-AC06 | S2-F05-T06 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F05-AC07 | S2-F05-T07 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F05-AC08 | S2-F05-T08 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F05-AC09 | S2-F05-T09 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F05-AC10 | S2-F05-T10, S2-F05-T12 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |

### S2-F06 — [f06-grading.md](../sprint-2/f06-grading.md)

Owner `martinvadre`; contract reviewed in PR #107; code reviewed in PR #116/#118.

| AC | Planned test IDs | Implemented | Actual verification / version |
| --- | --- | --- | --- |
| S2-F06-AC01 | S2-F06-T01 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F06-AC02 | S2-F06-T02 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F06-AC03 | S2-F06-T03 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F06-AC04 | S2-F06-T04 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F06-AC05 | S2-F06-T05 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F06-AC06 | S2-F06-T06 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F06-AC07 | S2-F06-T07, S2-F06-T08 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F06-AC08 | S2-F06-T09 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |
| S2-F06-AC09 | S2-F06-T10, S2-F06-T11 | YES | Feature-head PASS; [actual files, combined results and accepted release](../sprint-2/accepted-release.md) |

### S3-F07 — [f07-collaboration.md](../sprint-3/f07-collaboration.md)

Owner `Magiciancat9`; full contract v1.0 reviewed in PR #107. Task checkpoint under #98; peer AC07-12 under #101.

| AC | Planned test IDs | Implemented | Actual verification / version |
| --- | --- | --- | --- |
| S3-F07-AC01 | S3-F07-T01 | YES (checkpoint candidate) | [Actual task tests/results and pending review](../sprint-3/f07-execution-evidence.md) |
| S3-F07-AC02 | S3-F07-T02 | YES (checkpoint candidate) | [Actual task tests/results and pending review](../sprint-3/f07-execution-evidence.md) |
| S3-F07-AC03 | S3-F07-T03 | YES (checkpoint candidate) | [Actual task tests/results and pending review](../sprint-3/f07-execution-evidence.md) |
| S3-F07-AC04 | S3-F07-T04 | YES (checkpoint candidate) | [Actual task tests/results and pending review](../sprint-3/f07-execution-evidence.md) |
| S3-F07-AC05 | S3-F07-T05, S3-F07-T06 | YES (checkpoint candidate) | [Actual task tests/results and pending review](../sprint-3/f07-execution-evidence.md) |
| S3-F07-AC06 | S3-F07-T07, S3-F07-T08 | YES (checkpoint candidate) | [Actual task tests/results and pending review](../sprint-3/f07-execution-evidence.md) |
| S3-F07-AC07 | S3-F07-T09 | NO | NOT RUN / no candidate |
| S3-F07-AC08 | S3-F07-T10 | NO | NOT RUN / no candidate |
| S3-F07-AC09 | S3-F07-T11 | NO | NOT RUN / no candidate |
| S3-F07-AC10 | S3-F07-T12 | NO | NOT RUN / no candidate |
| S3-F07-AC11 | S3-F07-T13 | NO | NOT RUN / no candidate |
| S3-F07-AC12 | S3-F07-T14, S3-F07-T15 | NO | NOT RUN / no candidate |

### S3-F08 — [f08-analytics-export.md](../sprint-3/f08-analytics-export.md)

Owner `martinvadre`; contract v1.0 / review pending.

| AC | Planned test IDs | Implemented | Actual verification / version |
| --- | --- | --- | --- |
| S3-F08-AC01 | S3-F08-T01 | NO | NOT RUN / no candidate |
| S3-F08-AC02 | S3-F08-T02 | NO | NOT RUN / no candidate |
| S3-F08-AC03 | S3-F08-T03 | NO | NOT RUN / no candidate |
| S3-F08-AC04 | S3-F08-T04 | NO | NOT RUN / no candidate |
| S3-F08-AC05 | S3-F08-T05 | NO | NOT RUN / no candidate |
| S3-F08-AC06 | S3-F08-T06 | NO | NOT RUN / no candidate |
| S3-F08-AC07 | S3-F08-T07, S3-F08-T08 | NO | NOT RUN / no candidate |
| S3-F08-AC08 | S3-F08-T09 | NO | NOT RUN / no candidate |
| S3-F08-AC09 | S3-F08-T10 | NO | NOT RUN / no candidate |
| S3-F08-AC10 | S3-F08-T11, S3-F08-T12 | NO | NOT RUN / no candidate |

### UIR — [ui-refresh-spec.md](../../ui-refresh-spec.md)

Implementation owner `martinvadre`; reviewer `Magiciancat9`. Original UIR v1.0
specification accepted through PR #107; UIR v1.1 records the user's 22 Nov 2026
ownership handoff. All UI implementation/execution statuses below remain pending.

| AC | Planned test IDs | Implemented | Actual verification / version |
| --- | --- | --- | --- |
| UIR-AC01 | UIR-T01 | UI implemented via PR #110 | Component/E2E subset exists; full visual/accessibility acceptance remains under #100/#103 |
| UIR-AC02 | UIR-T02, UIR-T03 | UI implemented via PR #110 | Component/E2E subset exists; full visual/accessibility acceptance remains under #100/#103 |
| UIR-AC03 | UIR-T04 | UI implemented via PR #110 | Component/E2E subset exists; full visual/accessibility acceptance remains under #100/#103 |
| UIR-AC04 | UIR-T05 | UI implemented via PR #110 | Component/E2E subset exists; full visual/accessibility acceptance remains under #100/#103 |
| UIR-AC05 | UIR-T06 | UI implemented via PR #110 | Component/E2E subset exists; full visual/accessibility acceptance remains under #100/#103 |
| UIR-AC06 | UIR-T07 | UI implemented via PR #110 | Component/E2E subset exists; full visual/accessibility acceptance remains under #100/#103 |
| UIR-AC07 | UIR-T08 | UI implemented via PR #110 | Component/E2E subset exists; full visual/accessibility acceptance remains under #100/#103 |
| UIR-AC08 | UIR-T09 | UI implemented via PR #110 | Component/E2E subset exists; full visual/accessibility acceptance remains under #100/#103 |
| UIR-AC09 | UIR-T10 | UI implemented via PR #110 | Component/E2E subset exists; full visual/accessibility acceptance remains under #100/#103 |
| UIR-AC10 | UIR-T11, UIR-T12 | UI implemented via PR #110 | Component/E2E subset exists; full visual/accessibility acceptance remains under #100/#103 |

## 2. Executable locations and remaining planned checks

U = unit; I = real API/PostgreSQL integration; UI = client component;
E = end-to-end; M = actual manual/consumer/visual check. Full inputs,
preconditions and expected outcomes are in the linked feature STS above.
Sprint 2 locations below exist and are executed; exact results are in the
release ledger. Sprint 3 locations remain proposals. UI-refresh rows retain
the original planned full visual/system checks; existing component/Sprint 1
browser checks do not establish every manual design criterion.

| Test ID | Level | Planned location(s), not execution evidence | Status |
| --- | --- | --- | --- |
| S2-F04-T01 | I | `server/tests/milestones.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F04-T02 | U+I | `server/tests/milestones.unit.test.ts`<br>`server/tests/milestones.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F04-T03 | U+I | `server/tests/milestones.unit.test.ts`<br>`server/tests/milestones.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F04-T04 | U+I | `server/tests/milestones.unit.test.ts`<br>`server/tests/milestones.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F04-T05 | I | `server/tests/milestones.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F04-T06 | I | `server/tests/milestones.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F04-T07 | I | `server/tests/milestones.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F04-T08 | I | `server/tests/milestones.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F04-T09 | I | `server/tests/milestones.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F04-T10 | UI | `client/src/features/milestones/MilestoneManager.test.tsx` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F04-T11 | E | `e2e/sprint2-milestones.spec.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T01 | I | `server/tests/submissions.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T02 | U+I | `server/tests/submissions.unit.test.ts`<br>`server/tests/submissions.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T03 | I | `server/tests/submissions.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T04 | U+I | `server/tests/submissions.unit.test.ts`<br>`server/tests/submissions.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T05 | U+I | `server/tests/submissions.unit.test.ts`<br>`server/tests/submissions.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T06 | I | `server/tests/submissions.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T07 | I | `server/tests/submissions.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T08 | I | `server/tests/submissions.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T09 | I | `server/tests/submissions.integration.test.ts`<br>`server/tests/submissions-migration.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T10 | UI | `client/src/features/submissions/SubmissionWorkspace.test.tsx` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T11 | E | `e2e/sprint2-submissions.spec.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F05-T12 | UI+E | `client/src/features/submissions/SubmissionWorkspace.test.tsx`<br>`e2e/sprint2-submissions.spec.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T01 | I | `server/tests/grading.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T02 | U+I | `server/tests/grading.unit.test.ts`<br>`server/tests/grading.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T03 | U+I | `server/tests/grading.unit.test.ts`<br>`server/tests/grading.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T04 | I | `server/tests/grading.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T05 | I | `server/tests/grading.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T06 | I | `server/tests/grading.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T07 | I | `server/tests/grading.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T08 | I | `server/tests/grading.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T09 | UI | `client/src/features/grading/GradingConsole.test.tsx` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T10 | E | `e2e/sprint2-grading.spec.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S2-F06-T11 | I | `server/tests/grading.integration.test.ts` | Feature-head and combined PASS; actual source/run in [S2 ledger](../sprint-2/accepted-release.md) |
| S3-F07-T01 | I | `server/tests/collaboration.integration.test.ts` | Implemented; [execution ledger](../sprint-3/f07-execution-evidence.md), peer tests remain planned |
| S3-F07-T02 | U+I | `server/tests/collaboration.unit.test.ts`<br>`server/tests/collaboration.integration.test.ts` | Implemented; [execution ledger](../sprint-3/f07-execution-evidence.md), peer tests remain planned |
| S3-F07-T03 | I | `server/tests/collaboration.integration.test.ts` | Implemented; [execution ledger](../sprint-3/f07-execution-evidence.md), peer tests remain planned |
| S3-F07-T04 | I | `server/tests/collaboration.integration.test.ts` | Implemented; [execution ledger](../sprint-3/f07-execution-evidence.md), peer tests remain planned |
| S3-F07-T05 | I | `server/tests/collaboration.integration.test.ts` | Implemented; [execution ledger](../sprint-3/f07-execution-evidence.md), peer tests remain planned |
| S3-F07-T06 | I | `server/tests/collaboration.integration.test.ts` | Implemented; [execution ledger](../sprint-3/f07-execution-evidence.md), peer tests remain planned |
| S3-F07-T07 | UI | `client/src/features/collaboration/Collaboration.test.tsx` | Implemented; [execution ledger](../sprint-3/f07-execution-evidence.md), peer tests remain planned |
| S3-F07-T08 | E | `e2e/sprint3-collaboration.spec.ts` | Implemented; [execution ledger](../sprint-3/f07-execution-evidence.md), peer tests remain planned |
| S3-F07-T09 | U+I | `server/tests/collaboration.unit.test.ts`<br>`server/tests/collaboration.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F07-T10 | U+I | `server/tests/collaboration.unit.test.ts`<br>`server/tests/collaboration.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F07-T11 | I | `server/tests/collaboration.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F07-T12 | I | `server/tests/collaboration.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F07-T13 | I | `server/tests/collaboration.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F07-T14 | UI | `client/src/features/collaboration/Collaboration.test.tsx` | NOT CREATED / NOT RUN |
| S3-F07-T15 | E | `e2e/sprint3-collaboration.spec.ts` | NOT CREATED / NOT RUN |
| S3-F08-T01 | I | `server/tests/analytics-export.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F08-T02 | U+I | `server/tests/analytics-export.unit.test.ts`<br>`server/tests/analytics-export.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F08-T03 | U+I | `server/tests/analytics-export.unit.test.ts`<br>`server/tests/analytics-export.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F08-T04 | I | `server/tests/analytics-export.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F08-T05 | U+I | `server/tests/analytics-export.unit.test.ts`<br>`server/tests/analytics-export.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F08-T06 | I | `server/tests/analytics-export.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F08-T07 | U+I | `server/tests/analytics-export.unit.test.ts`<br>`server/tests/analytics-export.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F08-T08 | I | `server/tests/analytics-export.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F08-T09 | U+I+M | `server/tests/analytics-export.unit.test.ts`<br>`server/tests/analytics-export.integration.test.ts`<br>`dated manual/consumer evidence record (not yet created)` | NOT CREATED / NOT RUN |
| S3-F08-T10 | I | `server/tests/analytics-export.integration.test.ts` | NOT CREATED / NOT RUN |
| S3-F08-T11 | UI | `client/src/features/analytics/AnalyticsDashboard.test.tsx` | NOT CREATED / NOT RUN |
| S3-F08-T12 | E | `e2e/sprint3-analytics.spec.ts` | NOT CREATED / NOT RUN |
| UIR-T01 | UI+E | `client/src/App.uiRefresh.test.tsx`<br>`e2e/ui-refresh.spec.ts` | NOT CREATED / NOT RUN |
| UIR-T02 | UI | `client/src/App.uiRefresh.test.tsx` | NOT CREATED / NOT RUN |
| UIR-T03 | E | `e2e/ui-refresh.spec.ts` | NOT CREATED / NOT RUN |
| UIR-T04 | E+M | `e2e/ui-refresh.spec.ts`<br>`dated manual/consumer evidence record (not yet created)` | NOT CREATED / NOT RUN |
| UIR-T05 | UI+E | `client/src/App.uiRefresh.test.tsx`<br>`e2e/ui-refresh.spec.ts` | NOT CREATED / NOT RUN |
| UIR-T06 | E | `e2e/ui-refresh.spec.ts` | NOT CREATED / NOT RUN |
| UIR-T07 | UI+E | `client/src/App.uiRefresh.test.tsx`<br>`e2e/ui-refresh.spec.ts` | NOT CREATED / NOT RUN |
| UIR-T08 | E+M | `e2e/ui-refresh.spec.ts`<br>`dated manual/consumer evidence record (not yet created)` | NOT CREATED / NOT RUN |
| UIR-T09 | UI | `client/src/App.uiRefresh.test.tsx` | NOT CREATED / NOT RUN |
| UIR-T10 | I+UI | `server/tests/api.integration.test.ts (existing file; new UIR case not added)`<br>`client/src/App.uiRefresh.test.tsx` | NOT CREATED / NOT RUN |
| UIR-T11 | E | `e2e/ui-refresh.spec.ts` | NOT CREATED / NOT RUN |
| UIR-T12 | M | `dated manual/consumer evidence record (not yet created)` | NOT CREATED / NOT RUN |

## 3. Cross-cutting NFR measurement gap

| ID / requirement | Planned method / expected result | Status |
| --- | --- | --- |
| D2-SYS-T01 / NFR-05 | `deploy/tests/test_startup_readiness.py` measures monotonic elapsed time before `docker run` to first valid health 200 (includes container creation; excludes build/download); limit 10,000ms. Also verifies source SHA, DB readiness and built HTML. Retains image/host/UTC/elapsed JSON. | Implemented; actual exact-source measurement in [S2 ledger](../sprint-2/accepted-release.md); not Cloud Run timing |

Existing health-response and Docker-build checks do not by themselves
measure the SRS startup-time target. Do not present them as that measurement.
NFR-01/02/04 span new feature tests as mapped in traceability; NFR-03 also
requires real credential/DTO/changed-source review rather than a generic green
icon. Do not create performance claims without measurements.

## 4. Evidence, release and completion rules

- Actual command, file/test name, setup/assertions, tested SHA, environment,
  counts and readable result are required. Keep meaningful test-only RED and
  subsequent same-test GREEN with versioned contract/code chronology.
- Real DB readback and direct backend denials are essential; mocks/UI alone
  do not prove persistence/authorization. Avoid production reset/seed.
- Candidate continuity, reviewed Sprint 2 acceptance, implemented Sprint 3
  progress and post-deploy checks remain in the [status/finish record](continuity-and-status.md).
- Update exact missing AC, owners, dependencies, next actions and final dates;
  a contract/STS document does not make a feature tested or accepted.
