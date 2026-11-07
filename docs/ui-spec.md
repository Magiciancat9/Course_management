This document describes the Sprint 1 UI as implemented in PR #8 (as-built). UI behavior contracts are in the F-01 to F-03 feature contracts and docs/system-sds.md section 3.1; this file adds visual conventions and records where the implementation differs from them.

# Sprint 1 As-Built UI Specification

Evidence is limited to `client/src/App.tsx`, `client/src/main.tsx`, `client/index.html`, the screenshots in `artifacts/sprint-1/`, and the existing SRS, feature inventory, system SDS, and Sprint 1 feature contracts. Screens and behaviors not shown by that evidence are marked not implemented or not verified.

## 1. Design tokens

The client entry point imports Bootstrap's stylesheet (`client/src/main.tsx`); the document body uses `bg-light` (`client/index.html`). The UI uses Bootstrap 5.3.3 defaults and no custom CSS. `App.tsx` has one inline width limit for the login container (`maxWidth: 540px`).

| Role | Bootstrap classes used | Hex value |
|---|---|---|
| Navbar | `bg-dark`, `navbar-dark` | `#212529` |
| Page background | `bg-light` | `#f8f9fa` |
| Primary | `bg-primary`, `text-primary`, `btn-primary`, `btn-outline-primary` | `#0d6efd` |
| Success | `bg-success`, `text-success`, `btn-success`, `alert-success` | `#198754` |
| Warning | `bg-warning`, `text-warning`, `btn-warning`, `alert-warning` | `#ffc107` |
| Info | `bg-info`, `text-info`, `alert-info` | `#0dcaf0` |
| Danger | `text-danger`, `alert-danger` | `#dc3545` |
| Secondary | `bg-secondary`, `text-secondary`, `btn-outline-secondary`, `alert-secondary` | `#6c757d` |

Typography uses Bootstrap's default system font stack. Heading tags used are `<h4>`, `<h5>`, and `<h6>`; the navbar brand also uses `.h1`. Text-size utilities used include `.small`, `.fs-3`, and `.fs-6`. Other font-weight and text-transform utilities do not change the font size.

## 2. Layout and navigation

- **Unauthenticated navbar:** `CoursePMS`, a `CPE 334 Sprint 1` badge, and the subtitle `Course Project Management System`. Its content is not role-specific.
- **Authenticated navbar:** `CoursePMS`, a badge showing the first course's code and term (fallback `CPE334 (1/2026)`), the user's full name, student code when present, email, role badge, and Logout. It has no additional role-specific navigation links.
- **Containers:** The login content uses Bootstrap `.container` with an inline `maxWidth: 540px`. The authenticated screen uses `.container py-4`; Bootstrap's responsive `.container` widths apply. The authenticated navbar uses `.container-fluid`.
- **Student layout:** `.row g-4` with a `.col-lg-5` left column (team card, then course team directory) and `.col-lg-7` right column (proposal editor). The tech-stack and repository fields use `.col-md-6` each.
- **Instructor layout:** Four metric cards use `.col-md-3`. The teams table and review panel use `.col-lg-6` each.
- **Below breakpoints:** Bootstrap's grid classes imply the `col-lg-*` columns stack below the `lg` breakpoint, and `col-md-*` columns stack below the `md` breakpoint. This responsive behavior is **not tested visually** in the supplied screenshots.

## 3. Screens

### Login

**Purpose:** Authenticate a seeded student or instructor.

**Components, in layout order:** Unauthenticated navbar; optional authentication error or success alert; centered sign-in card with email and password fields and Sign In button; divider; three local demo quick-fill buttons.

**Requirements:** `FR-01`; related `BR-06`; F-01 acceptance criteria `AC-01`–`AC-03`.

**`data-testid` values:** `auth-error`, `auth-success`, `login-email`, `login-password`, `login-submit`, `quickfill-pawarit`, `quickfill-suda`, `quickfill-instructor`.

### Student workspace

**Purpose:** View the student's project team and course team directory, and edit/save/submit the team's proposal.

**Components, in layout order:**

1. Authenticated navbar and any shared loading, error, or success alert.
2. **My Project Team** card in the left column. If assigned, it shows team name, course/capacity, roster and member roles, add-member email field and Add Member button. Whether assigned or not, the card includes the create-team form; the unassigned state also displays explanatory text.
3. **Course Teams Directory & Access Check** table below the team card. It lists teams, member counts, proposal status and a `View Proposal API` button.
4. **Team Project Proposal & Review Lifecycle** card in the right column. With a team, it shows proposal status and revision number if a proposal exists, any recorded instructor feedback, title/problem/stack/repository fields, Save Draft and Submit Proposal actions. Without a team, the editor area displays an explanatory alert.

**Requirements:** Team area: `FR-02`, `FR-03`, `BR-01`, `BR-02`, `BR-06`, `AC-04`–`AC-06`, `AC-10`. Proposal area: `FR-03`–`FR-05`, `BR-03`, `BR-04`, `BR-06`, `AC-07`, `AC-08`, `AC-10`.

**`data-testid` values:** Shared authenticated screen values `current-user-info`, `current-user-role`, `logout-btn`, `error-banner`, `success-banner`; team values `team-capacity-badge`, `my-team-name`, `team-roster-list`, `add-member-email`, `add-member-btn`, `create-team-name`, `create-team-btn`, and the per-team pattern `inspect-proposal-${t.id}`; proposal values `proposal-status`, `proposal-revision`, `review-feedback-box`, `proposal-title`, `proposal-problem`, `proposal-stack`, `proposal-repo`, `save-draft-btn`, `submit-proposal-btn`.

### Instructor console

**Purpose:** Summarize course team/proposal counts, filter and inspect teams, and record a proposal decision with feedback.

**Components, in layout order:** Authenticated navbar and any shared loading, error, or success alert; four stat cards (Total Registered Teams, Submitted/Pending Review, Approved Proposals, Revision Requested); two-column section with an All Course Project Teams table and status filter on the left, and Instructor Proposal Review Panel on the right. The panel shows selected proposal details, prior feedback when present, feedback textarea, Approve Proposal and Request Revision buttons. When no selected team has a proposal, the panel instead says `Select a team with a proposal to inspect.`

**Requirements:** `FR-03`, `FR-05`, `BR-03`, `BR-05`, `BR-06`, `AC-09`, `AC-10`.

**`data-testid` values:** Shared authenticated screen values `current-user-info`, `current-user-role`, `logout-btn`, `error-banner`, `success-banner`; console values `instructor-status-filter`, the per-team pattern `select-team-${t.id}`, `review-panel-team`, `review-panel-status`, `review-feedback-input`, `approve-proposal-btn`, `revision-proposal-btn`.

## 4. Component conventions

- **Proposal status badges:** `DRAFT` and unknown/missing status use `bg-secondary`; `SUBMITTED` uses `bg-primary`; `APPROVED` uses `bg-success`; `REVISION_REQUESTED` uses `bg-warning text-dark`.
- **Role badges:** `STUDENT` uses `bg-success`; `INSTRUCTOR` uses `bg-warning text-dark`. Roster member-role badges use `bg-secondary`; the team-capacity badge uses `bg-dark`.
- **Button styles by action:** Sign In and Submit Proposal use `btn-primary`; Add Member uses `btn-outline-primary`; Create Team uses `btn-dark`; Save Draft and View Proposal API use `btn-outline-secondary`; Inspect / Review uses `btn-outline-primary`; Approve Proposal uses `btn-success`; Request Revision uses `btn-warning`; Logout uses `btn-outline-light`. Quick-fill controls use `btn-outline-secondary` (student accounts) and `btn-outline-dark` (instructor).
- **Visible field hints:** Project Title says `* (min 5 chars, BR-04)`; Problem Statement & Scope says `* (min 20 chars, BR-04)`; Selected Tech Stack says `* (BR-04)` but does not show the three-character minimum; Instructor Review Feedback says `* (min 10 chars, BR-05)`. The repository URL has no required marker.
- **Required marker and validation:** The asterisk is visible text, not an HTML `required` attribute. Login has an explicit empty-value check and the email controls use `type="email"`. The proposal and review minimums are not checked in client code before the action; submission/review requests are sent and rejection is presented through the error banner. Team name and feedback controls also have no HTML `required` attribute.
- **Action availability:** Buttons are not disabled based on a pending request, team capacity, proposal lock state, or proposal status in the UI code. The backend remains responsible for rejecting invalid operations.

## 5. Shared UI states

- **Login validation:** An empty email or password sets the error string `Email and password are required.` The login alert renders `Request Rejected (VALIDATION_ERROR)` above that text. Invalid nonempty email syntax is subject to browser email-input validation; its browser-specific message is not verified.
- **Loading:** While `loadDashboardData` is running, the exact markup is `<div className="alert alert-info py-2">Loading latest course data from PostgreSQL...</div>`. It is an informational alert, not a spinner; mutation handlers do not set this loading state.
- **Empty/unassigned:** Without a team, the team card says `You are not currently assigned to a team in {course}. Create a new project team below.` The proposal card says `Create or join a project team first to draft and submit a Project Proposal.` The instructor panel says `Select a team with a proposal to inspect.` These are explanatory text, not a dedicated empty-state placeholder card.
- **Empty lists:** The student directory and instructor table render rows only for available teams; when their arrays are empty, **no empty state implemented**. An instructor row with no proposal uses `No proposal` and status `NONE`; this is not a no-teams state.
- **Error:** Login uses a danger alert with `Request Rejected (${code})` when a code exists, followed by the error. The authenticated alert uses `Operation Rejected [${code}]`, followed by the error. These alerts have `role="alert"`. There is no dismiss/close control.
- **Success:** Successful login sets `Authenticated as ${fullName} (${role})`, which is shown in the authenticated success banner after the view changes. The login-view success alert can display `Logged out successfully. Session token revoked.` after logout. Other authenticated success messages include `Proposal draft saved to PostgreSQL.`, `Created project team "${teamName}" successfully.`, `Added member to ${teamName} (${memberCount}/${maxTeamSize} members).`, `Proposal submitted for Instructor review (Status: ${status}, Revision #${revisionCount}).`, `Loaded proposal for Team #${teamId}: "${title}"`, or `Proposal #${proposalId} transitioned to ${status} with recorded feedback.` Success alerts have `role="alert"`.

## 6. Accessibility and testability

- The login email and password labels use `htmlFor` values matching their input IDs. Other visible labels are adjacent to their controls but are neither linked with `htmlFor`/`id` nor wrapping labels; the instructor status select also has no label element.
- Authentication and authenticated error/success alerts use `role="alert"`. The loading and proposal feedback alerts do not set that role. No additional ARIA labels or live-region attributes are present in `App.tsx`.
- Login, create-team and add-member controls are inside forms with `onSubmit`; login uses a submit button. Other proposal/review actions are native buttons with `type="button"`. The status filter is a native `select`. Keyboard behavior from browser-native controls is implied by the markup but was not separately keyboard-tested.
- `data-testid` inventory in `App.tsx` (the inventory's use by individual automated tests is not verified here): `auth-error`, `auth-success`, `login-email`, `login-password`, `login-submit`, `quickfill-pawarit`, `quickfill-suda`, `quickfill-instructor`, `current-user-info`, `current-user-role`, `logout-btn`, `error-banner`, `success-banner`, `team-capacity-badge`, `my-team-name`, `team-roster-list`, `add-member-email`, `add-member-btn`, `create-team-name`, `create-team-btn`, `inspect-proposal-${t.id}` (dynamic per team), `proposal-status`, `proposal-revision`, `review-feedback-box`, `proposal-title`, `proposal-problem`, `proposal-stack`, `proposal-repo`, `save-draft-btn`, `submit-proposal-btn`, `instructor-status-filter`, `select-team-${t.id}` (dynamic per team), `review-panel-team`, `review-panel-status`, `review-feedback-input`, `approve-proposal-btn`, `revision-proposal-btn`.

## 7. Observed gaps

- **Developer-facing action wording is visible:** `Save Draft (PUT)`, `Submit Proposal for Review (POST)`, `View Proposal API`, and the directory heading `Course Teams Directory & Access Check (BR-06)` expose implementation/API terminology.
- **Quick-fill accounts are visible to users:** the login card is headed `Seeded Local Test Accounts (Quick Fill):` and contains buttons for a team leader student, an unassigned student, and an instructor.
- **No-team joining is not offered:** the student directory has `View Proposal API` buttons; it has no join-team action. The no-team message directs the student to create a team.
- **No conditional disabled controls or mutation loading UI are implemented:** team/proposal action buttons remain rendered without a loading/disabled state; Add Member is not disabled when capacity is reached or proposal state changes.
- **Empty lists have no placeholder row/card:** no student-directory or instructor-team-table empty message is implemented.
- **Review controls are not status-gated in the UI:** when a selected team has any proposal, the feedback field and both decision buttons are rendered; the UI does not disable/hide them based on the proposal status.
- **Screenshot comparison:** `00_github_repo_main.png` shows a GitHub repository page, not a CoursePMS screen. `01_login_screen.png` shows populated credentials, while the initial state in `App.tsx` is blank; the visible quick-fill controls can populate them, but the screenshot alone does not verify how those values were entered. Screenshots `02`–`06` show the implemented student proposal, instructor review, and rejection states. No supplied screenshot verifies responsive layout, a loading state, a zero-team list, or the initial unassigned state.
- **Later-sprint UI is not implemented in this Sprint 1 client:** milestone management, deliverable submission/grading, task board/peer evaluation, analytics, and grade export are scoped to Sprints 2–3 in `docs/features.md` and are not present in the inspected `App.tsx`.

## 8. Doc-vs-implementation check

This table checks UI claims in `docs/system-sds.md` section 3.1 and the UI sections of the F-01 and F-02/F-03 contracts against the inspected code and screenshots. `MATCHES` means the visible UI claim is present; `DIFFERS` means only part of the described behavior is present or implemented differently; `NOT IMPLEMENTED` means the described UI behavior is absent.

| Doc claim (file and quote) | What the code actually does (file and line) | Status |
|---|---|---|
| `docs/system-sds.md:159`: "Displays application branding (`CoursePMS`), active course badge (`CPE334`), current authenticated user's full name, email, and role badge (`STUDENT` or `INSTRUCTOR`), and a **Logout** button." | Unauthenticated navbar has branding and a Sprint 1 badge; authenticated navbar shows the first course code/term (or fallback), user name/email/role, and Logout (`client/src/App.tsx:338-344`, `467-494`). | MATCHES |
| `docs/system-sds.md:160`: "Email and password form, demo quick-fill buttons for local testing, client validation for empty fields, and clear error alert on `401 Invalid credentials`." F-01 `f01-auth-and-roles.md:35` also specifies login input/button test IDs and quick-fill. | Inputs, buttons and quick-fill handlers are present; empty values produce `VALIDATION_ERROR`; request failures use an alert (`client/src/App.tsx:159-180`, `348-444`). | MATCHES |
| F-01 `f01-auth-and-roles.md:36`: "Displays `user.fullName`, role badge (`STUDENT` or `INSTRUCTOR`), and Logout button (`data-testid="logout-btn"`)." | Header shows name, role and Logout, and additionally email/student code (`client/src/App.tsx:471-494`). | MATCHES |
| `docs/system-sds.md:162`: "If unassigned, shows "Create New Team" form and available teams to join." | Create form is present, but the directory only offers `View Proposal API`; there is no join-team action (`client/src/App.tsx:587-618`, `624-660`). | DIFFERS |
| F-02/F-03 `f02-team-and-proposal-workflow.md:20`: "Student Workspace shows either the "Create Team" card (when unassigned) or the "My Team Roster" card showing `members.length / course.maxTeamSize` badge, member list, and "Add Member by Email" input (`data-testid="add-member-email"`)." | One My Project Team card is always rendered; it includes the create form in both states and conditionally renders roster or unassigned explanatory text (`client/src/App.tsx:522-620`). | DIFFERS |
| `docs/system-sds.md:162`: "If assigned, shows team name, course capacity indicator (e.g., `2 / 3 members`), member roster, and an "Add Teammate by Email" control." | Team name, `members.length / maxTeamSize`, roster and email control are rendered for an assigned team (`client/src/App.tsx:527-584`). | MATCHES |
| `docs/system-sds.md:162`: "(disabled when full or if proposal is locked)." | Add Member button has no `disabled` condition; no capacity/proposal-lock gating is implemented (`client/src/App.tsx:562-582`). | NOT IMPLEMENTED |
| `docs/system-sds.md:163`: "Displays current status badge (`DRAFT`, `SUBMITTED`, `APPROVED`, `REVISION_REQUESTED`), revision counter, and instructor review feedback banner (if reviewed). Provides the Proposal Editor (`title`, `problemStatement`, `techStack`, `repoUrl`) with **Save Draft** and **Submit Proposal for Review** actions." | Status/revision appear when a proposal exists; review feedback appears when present; fields and both actions are rendered for a team (`client/src/App.tsx:667-790`). | MATCHES |
| F-02/F-03 `f02-team-and-proposal-workflow.md:60`: "Inputs for `title`, `problemStatement`, `techStack`, `repoUrl`, status badge (`data-testid="proposal-status"`), **Save Draft** button (`data-testid="save-draft-btn"`), **Submit Proposal** button (`data-testid="submit-proposal-btn"`), and Instructor Feedback alert (`data-testid="review-feedback-box"`)." | All four inputs, status badge, actions and feedback alert are present (`client/src/App.tsx:679-787`). | MATCHES |
| `docs/system-sds.md:165`: "Summary metrics bar (Total Teams, Submitted Pending Review, Approved, Revision Requested)." | Four corresponding stat cards are rendered with counts (`client/src/App.tsx:800-830`). | MATCHES |
| `docs/system-sds.md:166`: "All Course Teams & Proposals table with status filter (`ALL`, `SUBMITTED`, `APPROVED`, `REVISION_REQUESTED`, `DRAFT`)." | Table and all five filter options are present (`client/src/App.tsx:835-899`). | MATCHES |
| `docs/system-sds.md:167`: "Instructor Proposal Review Modal/Panel: Displays full proposal details and provides the decision form (`APPROVED` or `REVISION_REQUESTED`) + mandatory `reviewFeedback` textarea (minimum 10 characters)." | A panel (not a modal) shows proposal fields, textarea label `* (min 10 chars, BR-05)`, and both decision buttons. There is no client-side `required` or minimum-length check (`client/src/App.tsx:902-995`). | DIFFERS |
| F-02/F-03 `f02-team-and-proposal-workflow.md:61`: "Table of all teams and proposals, filter by status, and Review Panel (`data-testid="review-feedback-input"`, **Approve Proposal** button `data-testid="approve-proposal-btn"`, **Request Revision** button `data-testid="revision-proposal-btn"`)." | The table, filter, panel, input and both actions are present (`client/src/App.tsx:835-995`). | MATCHES |
| `docs/system-sds.md:169`: "Spinner and disabled submit buttons during in-flight API requests." | Dashboard loading is shown as the text alert `Loading latest course data from PostgreSQL...`; it is not a spinner, and action buttons are not disabled. Mutation handlers do not set `loading` (`client/src/App.tsx:98-146`, `498-501`). | DIFFERS |
| `docs/system-sds.md:170`: "Informative placeholder card when a student has not yet joined a team or created a proposal." | Unassigned state shows explanatory text and the no-team proposal area shows an alert; no dedicated empty-state placeholder card is implemented. Empty list states are also absent (`client/src/App.tsx:586-593`, `691-699`, `638-660`). | DIFFERS |
| `docs/system-sds.md:171`: "Dismissible Bootstrap danger alert rendering the backend's structured `{ error, code }` message whenever a business rule (`400`/`403`/`409`) rejects an action." | Danger alerts display the error and code with `role="alert"`, but have no dismiss control (`client/src/App.tsx:348-352`, `503-508`). | DIFFERS |
