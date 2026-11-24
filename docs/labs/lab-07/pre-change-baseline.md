# Lab 7 pre-change checkpoint — L7-E02

**Recorded:** 22 Nov 2026, 20:55:09 Asia/Bangkok. This checkpoint was created
after TA approval and before the revised contract, new tests or implementation.
No runtime, schema or test source was changed when it was recorded.

| Identity | Exact reference / interpretation |
| --- | --- |
| Original CoursePMS Sprint 1 | `v1.0.0-sprint1` → `5979f5870e8e28277996dc3045cbf4be5f7236ad` |
| Accepted Sprint 1 after Lab 6 / inspected main | `aeb804ea5bc667399b00cf54df10046a6ded46e0`, released through PR #76 |
| Actual Lab 7 pre-change source | [`dfe5d25ec8934161d3ece5726d7611d64c044c52`](https://github.com/Magiciancat9/Course_management/commit/dfe5d25ec8934161d3ece5726d7611d64c044c52) |
| Published annotated checkpoint tag | [`lab7-pre-change-20261122`](https://github.com/Magiciancat9/Course_management/tree/lab7-pre-change-20261122), points to `dfe5d25ec8934161d3ece5726d7611d64c044c52` |
| Lab 7 integration branch at lock | `lab7-staging` → `aeb804ea5bc667399b00cf54df10046a6ded46e0` |
| Separate Sprint 2 staging at lock | `e9696bb3508933998860871fd70037ff880ec906`; D2 specifications and UI-ownership documents, not merged into this maintenance baseline |
| Separate UI implementation | PR #110 / `beb7fa1536da22b8ec396b219d934391e413b686` was approved but OPEN when inspected; its modern UI is not part of this checkpoint |
| Accepted historical serving revision | `course-pms-00009-mk2`, from the [Lab 6 acceptance record](https://github.com/Magiciancat9/Course_management/blob/6916f29bbd97b38e9a86a4284c2e0a0609f3ebbe/docs/labs/lab-06/coursepms-acceptance-confirmed.md) |
| Fresh public version at checkpoint | Not queried in this lock operation. Historical revision above is not presented as a new live observation |

The actual source differs from accepted main only by the prepared Part A
request and addition of `lab7-staging` to the PR CI branch filter. The normal
CI test steps and main deployment trigger are unchanged. Runtime, existing
test, migration, Docker and deployment code are identical to accepted main.
Thus the old rule still accepts 10–19 trimmed units for REVISION_REQUESTED;
that previously correct behavior is what the future RED test must expose.

## Immutable source blobs

These Git blobs match the accepted main and locked actual pre-change source.

| Source | Git blob |
| --- | --- |
| `server/src/utils/domainRules.ts` | `9fca6db7a18cc2abc088586782c88c50edb2d79d` |
| `server/src/app.ts` | `b91f5a6eef025580f845a0e9b20db5d50e347347` |
| `client/src/App.tsx` | `aa6beb4222d6f34ebb28f0e2c8305a165f602e8b` |
| `server/prisma/schema.prisma` | `6bb9bd30f4fd08c459515983aff8ebaa50b91366` |
| `server/tests/domain.unit.test.ts` | `b8683138d48a6ec275f9322595994b06488d88e8` |
| `server/tests/api.integration.test.ts` | `7040cbb9dbe83c322e79f40da5d655c2c0853460` |

## Reproduction and intervening-change rule

```text
git rev-parse lab7-pre-change-20261122^{}
git diff aeb804ea5bc667399b00cf54df10046a6ded46e0 lab7-pre-change-20261122 -- server client e2e deploy Dockerfile docker-compose.yml package.json package-lock.json playwright.config.ts
git show lab7-pre-change-20261122:server/src/utils/domainRules.ts
```

Expected now: the first command yields `dfe5d25...`; the code/test/delivery
diff is empty; `validateInstructorReview` uses minimum 10 for both decisions.
These are source-identity checks, not a new behavioral test execution.

The later contract-only commit is expected to differ in documentation and
selected approval evidence only. Before test-only RED / implementation,
verify the code/test blobs still match this lock. If another runtime change
is integrated meanwhile, record its exact source/deployed identity and
intervening differences, establish a new named checkpoint without moving
this historical tag, and recheck impact/contract review before code.
