# Lab 6 UAT Cases: Authentication and Team Rules (F-01, F-02)

This document defines the executable UI-first User Acceptance Test (UAT) cases for **F-01 (Authentication, Session & Role Access Control)** and **F-02 (Course Project Team Formation & Roster Management)** covering acceptance criteria **AC-01 through AC-06** and business rules **BR-01 / BR-02**.

- **Target Application:** CoursePMS Sprint 1 (<https://course-pms-859617270560.asia-southeast1.run.app>)
- **Contract References:** [F-01 Contract](../../sprints/sprint-1/f01-auth-and-roles.md), [F-02/F-03 Contract](../../sprints/sprint-1/f02-team-and-proposal-workflow.md), [STS & DoD](../../sprints/sprint-1/sts-and-dod.md)
- **Consolidated UAT Packet:** Reconciled with [uat-cases.md](uat-cases.md) (`CPMS-UAT-01`..`CPMS-UAT-03`) and [partner-handoff.md](partner-handoff.md).

## Account Labels and Test Order

Actual synthetic emails and passwords are provided privately to the partner team (never committed to Git or placed in screenshots/PDFs).

| Alias | Role | Starting State |
|---|---|---|
| `S1` | `STUDENT` | Unassigned student in `CPE334` (eligible to create a team) |
| `S2` | `STUDENT` | Unassigned student in `CPE334` (eligible 2nd member) |
| `S3` | `STUDENT` | Unassigned student in `CPE334` (eligible 3rd member) |
| `S4` | `STUDENT` | Unassigned student in `CPE334` (4th student used for capacity boundary) |
| `S_ASSIGNED` | `STUDENT` | Student already belonging to an existing `CPE334` team (or `S1` after `UAT-01`) |

### Declared Execution Sequence
- **`UAT-02`** (Invalid login & unauthenticated access) is **independent** and should be executed first in a signed-out browser profile.
- **`UAT-01` -> `UAT-05` -> `UAT-03` -> `UAT-04`** form a sequential chain sharing the same newly created synthetic team (`UAT-Team-<YYYYMMDD>-<HHMM>`), so each case's post-condition satisfies the next case's precondition without wiping the shared database.

---

## UAT-01: Valid Login, Team Creation, and Teammate Addition (Normal Journey)

- **Case ID:** `UAT-01`
- **Requirement / AC Reference:** `F-01`, `F-02`, `FR-01`, `FR-02`, `FR-03`, `AC-01`, `AC-04`
- **Purpose:** Verify that an unassigned student can sign in via the UI, create a new project team in `CPE334`, add an eligible teammate by university email, and observe the persisted 2-member roster.
- **Roles:** `S1` (primary), `S2` (secondary verification in a separate browser profile)
- **Preconditions:**
  1. `S1` and `S2` are unassigned students in active course `CPE334` (`Max Team Size: 3`).
  2. Browser is signed out on `https://course-pms-859617270560.asia-southeast1.run.app`.
- **Synthetic Inputs:**
  - `S1` email and password (from private handoff)
  - Team Name: `UAT-Team-<YYYYMMDD>-<HHMM>` (unique per run)
  - Teammate Email: `S2` email (from private handoff)

### Numbered User Actions
1. Open `https://course-pms-859617270560.asia-southeast1.run.app` and confirm the **Sign In to CoursePMS** screen is displayed.
2. Enter `S1`'s email and password, then click **Sign In**.
3. Confirm the top navigation bar shows `S1`'s name, email, `STUDENT` role badge, `CPE334 (1/2026)` course badge, and **Logout** button.
4. In the **My Project Team** panel (unassigned state), enter the unique Team Name (`UAT-Team-<YYYYMMDD>-<HHMM>`) and click **Create Team**.
5. Observe the **My Project Team** panel update to the assigned team view.
6. In the **Add Teammate by University Email** input, enter `S2`'s email and click **Add Member**.
7. Reload the browser page (`F5` / Refresh).
8. In a separate private/incognito browser profile, open the public URL and sign in as `S2`.

### Expected Results (Observable on Screen)
- After Step 2: Workspace loads without error alerts; `S1` identity and `STUDENT` badge appear in the header.
- After Step 4–5: The team card displays the team name `UAT-Team-<YYYYMMDD>-<HHMM>`, `Course: CPE334 — Max Team Size: 3 (BR-02)`, roster badge **`1 / 3 Members`**, and `S1` listed with badge **`LEADER`**.
- After Step 6–7: Roster badge updates to **`2 / 3 Members`**, listing `S1` (`LEADER`) and `S2` (`MEMBER`). The 2-member roster remains intact after full page reload.
- After Step 8: `S2`'s workspace shows the same team `UAT-Team-<YYYYMMDD>-<HHMM>` with **`2 / 3 Members`**.

---

## UAT-02: Invalid Login and Unauthenticated / Post-Logout Protection

- **Case ID:** `UAT-02`
- **Requirement / AC Reference:** `F-01`, `FR-01`, `NFR-01`, `NFR-03`, `AC-02`, `AC-03`
- **Purpose:** Verify that invalid or empty login attempts are rejected with an on-screen error without starting a session, and that logging out clears workspace access even after browser Back/Refresh.
- **Role:** Unauthenticated user / `S1`
- **Preconditions:**
  1. Browser is signed out (clean session / incognito window).
- **Synthetic Inputs:**
  - Empty email / empty password
  - Valid `S1` email + wrong password `WrongPassword999!`
  - Valid `S1` email + valid password (from private handoff)

### Numbered User Actions
1. Open `https://course-pms-859617270560.asia-southeast1.run.app`.
2. Leave **University Email** and **Password** blank and click **Sign In**.
3. Enter `S1`'s valid email and wrong password `WrongPassword999!`, then click **Sign In**.
4. Clear the password, enter `S1`'s valid password, and click **Sign In** to confirm authenticated workspace access.
5. Click **Logout** in the top-right header.
6. Click the browser **Back** button, then **Refresh** (`F5`) the page.

### Expected Results (Observable on Screen)
- After Step 2: Validation message or error alert appears on the **Sign In to CoursePMS** screen; user remains unauthenticated and no team/proposal workspace is rendered.
- After Step 3: An authentication error banner (`Invalid email or password` / `INVALID_CREDENTIALS`) is displayed; user remains on the login screen with no header role badge and no workspace data.
- After Step 5: View immediately returns to **Sign In to CoursePMS**; header identity and workspace panels disappear.
- After Step 6: Browser Back and Refresh keep the user on **Sign In to CoursePMS** and do not display protected team or proposal data. *(Note: Backend token revocation across server restarts is covered by automated integration test `TEST-14`.)*

---

## UAT-03: Single Active Team Membership per Course (BR-01)

- **Case ID:** `UAT-03`
- **Requirement / AC Reference:** `F-02`, `BR-01`, `AC-05`
- **Purpose:** Verify that a student who already belongs to an active team in `CPE334` cannot create a second team or be added to another team in the same course, and existing membership remains unchanged.
- **Roles:** `S1` (member of team from `UAT-01`), `S_ASSIGNED` (already in another `CPE334` team, e.g., Team Beta)
- **Preconditions:**
  1. `UAT-01` completed so `S1` is `LEADER` of `UAT-Team-<YYYYMMDD>-<HHMM>` (`2 / 3 Members`).
  2. `S_ASSIGNED` is already a member of another active team in `CPE334`.
- **Synthetic Inputs:**
  - Email of `S_ASSIGNED` (from private handoff)
  - Optional second team name for authenticated session check: `UAT-Duplicate-<HHMM>`

### Numbered User Actions
1. Sign in as `S1` and inspect the **My Project Team** panel.
2. Confirm that the **Create New Team** form is no longer presented while `S1` is already assigned to `UAT-Team-<YYYYMMDD>-<HHMM>`.
3. In the **Add Teammate by University Email** input on `S1`'s team, enter `S_ASSIGNED`'s email and click **Add Member**.
4. Observe the error alert and reload the page (`F5`) to confirm the roster did not change.
5. *(Optional API check using `S1`'s active browser/API session)* Submit `POST /api/teams` with `{"name":"UAT-Duplicate-<HHMM>","courseId":1}` while `S1` is already in a team, then refresh the UI.

### Expected Results (Observable on Screen)
- Step 2: The **Create Team** card is absent for `S1` (UI prevents duplicate creation for an already-assigned student).
- Step 3–4: A dismissible red danger alert banner appears: **`Operation Rejected [BR01_DUPLICATE_TEAM_MEMBERSHIP]`** explaining that the student is already a member of a team in this course. The roster count remains **`2 / 3 Members`** and `S_ASSIGNED` is not added.
- Step 5 (if executed): Request is rejected with HTTP `409` (`BR01_DUPLICATE_TEAM_MEMBERSHIP`), and refreshing the UI confirms `S1` remains in `UAT-Team-<YYYYMMDD>-<HHMM>` with no second team created.

---

## UAT-04: Maximum Team Capacity Enforcement (BR-02 Boundary)

- **Case ID:** `UAT-04`
- **Requirement / AC Reference:** `F-02`, `BR-02`, `AC-06`
- **Purpose:** Verify that a `CPE334` team (`Max Team Size: 3`) accepts a 3rd eligible member and rejects a 4th eligible member, keeping the roster at 3.
- **Roles:** `S1` (team `LEADER`), `S3` (unassigned 3rd student), `S4` (unassigned 4th student)
- **Preconditions:**
  1. `UAT-01` and `UAT-03` completed; `S1`'s team currently has **`2 / 3 Members`** (`S1`, `S2`).
  2. `S3` and `S4` are eligible unassigned students in `CPE334`.
- **Synthetic Inputs:**
  - `S3` email (from private handoff)
  - `S4` email (from private handoff)

### Numbered User Actions
1. Signed in as `S1`, verify the team roster badge reads **`2 / 3 Members`**.
2. Enter `S3`'s email in **Add Teammate by University Email** and click **Add Member**.
3. Reload the page (`F5`) and verify the roster count and members.
4. Attempt to add `S4` through the UI (check whether the **Add Teammate by University Email** control is disabled or rejects submission).
5. *(Backend boundary verification using `S1`'s authenticated session)* Send `POST /api/teams/<teamId>/members` with `{"email":"<S4-email>"}` (without logging or saving any auth token), then refresh the UI.

### Expected Results (Observable on Screen)
- After Step 2–3: Roster badge updates to **`3 / 3 Members`** listing `S1` (`LEADER`), `S2` (`MEMBER`), and `S3` (`MEMBER`). The **Course Teams Directory** row for this team also displays `3/3`.
- After Step 4: The UI indicates the team is at full capacity (`3 / 3 Members`) and disables adding a 4th member through the form.
- After Step 5: Backend rejects the 4th member with HTTP `409` (`BR02_MAX_TEAM_SIZE_EXCEEDED`). Refreshing the UI confirms the roster remains **`3 / 3 Members`** and `S4` is not added.

---

## UAT-05: Team and Roster State Persistence Across Logout/Login

- **Case ID:** `UAT-05`
- **Requirement / AC Reference:** `F-01`, `F-02`, `NFR-04`, `AC-03`, `AC-04`
- **Purpose:** Verify that team formation and roster changes persist in PostgreSQL across full logout and re-authentication.
- **Role:** `S1` (and optionally `S2`)
- **Preconditions:**
  1. `UAT-01` completed so `UAT-Team-<YYYYMMDD>-<HHMM>` has **`2 / 3 Members`** (`S1` and `S2`). *(Can also be re-verified after `UAT-04` at `3 / 3 Members`.)*
- **Synthetic Inputs:**
  - `S1` email and password (from private handoff)

### Numbered User Actions
1. Signed in as `S1`, note the exact team name, roster count (`2 / 3 Members`), member names, and roles.
2. Click **Logout** in the top navigation bar and confirm the **Sign In to CoursePMS** screen appears.
3. Close or refresh the browser tab, reopen `https://course-pms-859617270560.asia-southeast1.run.app`, and sign back in as `S1`.
4. Inspect the **My Project Team** panel and **Course Teams Directory** table.

### Expected Results (Observable on Screen)
- After Step 2: Session ends cleanly and workspace data is hidden.
- After Step 3–4: Signing back in displays the exact same team (`UAT-Team-<YYYYMMDD>-<HHMM>`), roster count (**`2 / 3 Members`**), `S1` (`LEADER`), `S2` (`MEMBER`), and matching directory row.

---

## Cleanup and Reset Notes (Coordinated with Lab6-04)

- **Do not run destructive seed/reset commands** or database wipes against the shared Cloud Run / Cloud SQL instance, as Lab 5 persistence evidence (`Lab5-Persistence-20261112`) and partner test records must remain intact. The only exception is the owner-approved, one-off provisioning job in `NODE_ENV=production` described in [UAT data and reruns](uat-data-and-reset.md); production seeding creates missing Lab 6 accounts only and must not be treated as UAT execution.
- **Repeatable runs:** Each UAT execution uses a unique timestamped team name (`UAT-Team-<YYYYMMDD>-<HHMM>`) and dedicated synthetic unassigned student accounts documented in `Lab6-04` (`docs/labs/lab-06/uat-data-and-reset.md`).
- **Evidence hygiene:** Redact or omit passwords, bearer tokens, and `Authorization` headers in all screenshots and execution logs (`docs/labs/lab-06/execution-results.md`).
