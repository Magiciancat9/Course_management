# Lab 6 UAT data and non-destructive rerun plan

**Status: source prepared; production provisioning and login verification are
not yet recorded.** This document is a fixture plan, not independent UAT
evidence or acceptance. It contains no passwords, tokens, or other private
authentication material.

## Purpose and safety boundary

CoursePMS has no public self-registration or team-reset workflow. UAT writes
are intentionally retained for evidence and retest, so a new team name does
not make its members eligible for another full run. The Lab 6 cohort is added
to `server/prisma/seed.ts` solely to make future fixture creation reproducible.

`seedProductionDatabase` is additive: when `NODE_ENV=production`, it creates
only a missing user and does not delete data, overwrite an existing user's
password, or create a membership for the accounts below. It must never be
substituted with a non-production seed, `prisma db push`, a database reset,
or direct deletion of Lab 5/UAT data.

## Account aliases and required starting state

The account labels are safe to commit; passwords are generated/stored in the
approved secret path and delivered to the partner privately after successful
live verification.

| Run | Alias | Synthetic email | Role | Required state before the run |
|---|---|---|---|---|
| Run 1 | S1 | `niran@mail.kmutt.ac.th` | STUDENT | Eligible and unassigned in CPE334; creates the UAT team. Live login/state must be rechecked. |
| Run 1 | S2 | `tatchakorn@mail.kmutt.ac.th` | STUDENT | Eligible and unassigned in CPE334; added as the second member. Live login/state must be rechecked. |
| Run 1 | S3 | `uat.s3@mail.kmutt.ac.th` | STUDENT | New additive account; eligible and unassigned; added as the third member. |
| Run 1 | S4 | `uat.s4@mail.kmutt.ac.th` | STUDENT | New additive account; eligible and unassigned; remains unassigned after the expected full-team rejection. |
| Run 2 / retest | R1 | `uat.r1@mail.kmutt.ac.th` | STUDENT | New additive account; eligible and unassigned; retest-team leader. |
| Run 2 / retest | R2 | `uat.r2@mail.kmutt.ac.th` | STUDENT | New additive account; eligible and unassigned; second member. |
| Run 2 / retest | R3 | `uat.r3@mail.kmutt.ac.th` | STUDENT | New additive account; eligible and unassigned; third member. |
| Run 2 / retest | R4 | `uat.r4@mail.kmutt.ac.th` | STUDENT | New additive account; eligible and unassigned; expected capacity-rejection candidate. |

The seeded Lab 6 students use the synthetic student codes `L6UAT2026S3`,
`L6UAT2026S4`, and `L6UAT2026R1` through `L6UAT2026R4`. If an account already
exists in Cloud SQL, production seeding intentionally leaves it unchanged;
the owner must verify its identity, role, login, and lack of a CPE334
membership before treating it as eligible.

## Run sequence

### Run 1: primary independent UAT

1. In separate browser profiles, the independent testers verify S1/S2/S3/S4
   can sign in, display `STUDENT`, and are eligible for the active CPE334
   course. This is a session precondition, not a PASS result.
2. S1 creates exactly one uniquely named synthetic team; S2 joins it.
3. S1 adds S3, producing the expected `3 / 3` roster.
4. S1 attempts to add S4. The expected `BR02_MAX_TEAM_SIZE_EXCEEDED` rejection
   leaves S4 unassigned and the roster at three.
5. Keep the team, proposal, and evidence IDs for the remaining ordered UAT
   cases and for any independent retest.

### Run 2: isolated retest cohort

Use R1/R2/R3/R4 only if a correction or a complete rerun is agreed. Assign
them the same leader/second/third/rejected-candidate roles respectively, use
a new unique team name and run ID, and retain the new records. Do not reuse
Run 1 members merely by changing a team name.

If another full run is required after Run 2, the owner must approve a new
additive cohort (for example R5--R8) through a reviewed change before the
session. Do not reset Cloud SQL or remove existing memberships to recycle an
account.

## Approved production-provisioning procedure

The Product Team may prepare accounts, but only the independent UAT team
records UAT PASS/FAIL/BLOCKED results and acceptance. Before provisioning:

1. The Lab6-04 code change is peer-reviewed, merged into `lab6-staging`, and
   its required CI is green. The author does not merge their own PR.
2. Recheck the public `/api/health` and `/api/ready`. Stop if readiness is not
   HTTP 200 with `db: connected`; a health response alone is insufficient.
3. The authorized GCP owner runs a dedicated, one-off Cloud Run Job using the
   reviewed image with `NODE_ENV=production`, the production `DATABASE_URL`,
   and `DEMO_USER_PASSWORD` mounted only from Secret Manager. Its command is
   `npm --prefix server run prisma:seed`. Do not expose a secret in a command,
   log, source file, issue, screenshot, or report.
4. Record the job/release identity, time, sanitized success outcome and the
   fact that no reset/delete operation was run. The job is provisioning
   evidence only, not a UAT execution result.
5. Privately verify each new account's successful sign-in, `STUDENT` role,
   CPE334 starting membership, and ability to reach the unassigned team view.
   Deliver credentials only through the agreed private channel. Record only
   aliases and sanitized verification outcomes in repository documentation.

If the job, readiness check, or private verification cannot be completed,
mark the affected case/subcheck **BLOCKED**. A source declaration or a
successful build does not prove that an account exists or can sign in.

## Equivalent-fixture rule

No adaptation is pre-approved while the six-account cohort can be provisioned
as above. If S3/S4 or a complete four-account retest cohort cannot be made
available, keep the affected capacity/retest case BLOCKED and obtain written
partner agreement before using any equivalent fixture. That agreement must
state the exact pre-existing synthetic team, authorized member, unassigned
candidate, tested release, changed steps, and coverage limitation. It must
not repurpose Lab 5 evidence or conceal a missing prerequisite.
