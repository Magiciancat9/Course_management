# CoursePMS UI refresh — UIR v1.1

**Date:** 24 Nov 2026. **Phase:** specification accepted via PR #107; implementation merged into sprint-2-staging via PR #110. Combined Lab 7/UI verification is pending. **Implementation owner:** `martinvadre`; independent
implementation reviewer: `Magiciancat9`. **Original specification author:**
`Magiciancat9`; specification reviewed by `martinvadre` in
[PR #107](https://github.com/Magiciancat9/Course_management/pull/107).
**Issue:** [#106](https://github.com/Magiciancat9/Course_management/issues/106).

The user reassigned implementation to `martinvadre` on 22 Nov 2026. This v1.1
update changes ownership only; the reviewed UI/AC/STS and original authorship
remain intact. Reassignment does not indicate that implementation has begun.

The user requested a sharper, modern interface and clarified that the **demo
Quick Fill account box**, not email authentication, should be removed. The specification preceded implementation. PR #110 now contains the teammate-authored JSX/CSS/test implementation; this document records the accepted design and its maintenance compatibility revision.

Current implementation: responsive login and role-aware workspace in `client/src/App.tsx`, with Bootstrap plus `client/src/styles.css`. Quick Fill is removed. [Historical as-built UI](ui-spec.md) retains the earlier screen record; PR #110 supplies the refresh implementation. Full visual/AC acceptance still requires the evidence ledger.

## 1. Design direction and concrete tokens

Product character: calm academic workspace, crisp typography, strong
hierarchy, restrained indigo accents and actual course context. Use a dark
navy navigation shell and clean light workspace rather than dense developer
labels or competing bright panel headers. No decorative fake charts/data.

| Token | Proposed value / purpose |
| --- | --- |
| Sidebar / hero | `#111B32`; light foreground `#F8FAFF` |
| Workspace / surface | `#F5F7FB` / `#FFFFFF` |
| Primary text / secondary text | `#172238` / `#52627B` |
| Action | `#4F5BEA` with white text; verify actual contrast before implementation acceptance |
| Border | `#DEE5EF`; error/success use text/icon as well as color |
| Typography | System font stack (`Inter` if already available, then Segoe UI/system/sans-serif); no new remote font dependency required |
| Layout | Desktop sidebar 232px; content maximum 1440px; base spacing 8px, content gaps 24px, card padding 24px |
| Shape | 14–18px card corners; 10–12px controls; subtle shadow and clear borders, not heavy stacked shadows |
| Controls | ≥44px target height; labels above fields, visible focus, disabled/pending state with text |

Normal text/background pairs target ≥4.5:1 and large text ≥3:1 using the
[W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
These are test targets, not a claim that unimplemented CSS already complies.
Do not rely on color alone for proposal status or validation.

## 2. Screen-by-screen change plan

| Screen / current issue | Planned change | Preserved behavior |
| --- | --- | --- |
| Login: Quick Fill dominates the lower card and contains demo credentials | Remove the entire Quick Fill box, buttons and production hard-coded account/password filling. Use a clear branded two-panel layout on desktop and compact single-column form on mobile | Real email/password submit, backend bcrypt/JWT/revocation, empty/invalid/network/pending states and logout |
| Student header and workspace: dense labels and raw implementation explanations | Sidebar/compact header, course context, clear page title, own-team/proposal summary and useful next action; simplify text and spacing | Real data only; unassigned guidance, creation/invited membership and all pending/locked states |
| Team card and directory | Clean roster rows/avatar initials, capacity text and compact member form; responsive directory with honest PRIVATE foreign proposal state | Add-by-email functionality is not removed; roster-only privacy stays literal; direct API restrictions remain |
| Proposal editor | Group title/problem/stack/repository fields, clear supporting hints, status/revision/feedback and Save draft / Submit for review actions | BR-03 locks, BR-04 bounds, same-session unsaved text, server errors and real persistence |
| Instructor review | Clear team/filter list and focused selected-proposal detail; show real counts, readable feedback and explicit Approve/Request revision actions | Instructor-only backend review; approved BR-05 revision20/approval10; no hidden state-transition changes |
| Sprint 2 milestones/submissions/grading | Add role-aware pages only with the functioning F-04/F-05/F-06 implementations, using their contracts and real save/readback | No fake form completion, hardcoded progress or screenshot-only persistence claim |
| Sprint 3 tasks/peer/analytics/export | Extend the same shell for implemented features; private peer outgoing form, accessible task actions and instructor-only reports | Confidentiality and backend access; planned pages are not presented as complete features |

The request did **not** remove the university-email login field, password
field, authentication or the member-by-email workflow. It did not authorize
the approved Lab 7 BR-05 revision20/approval10 change. Avoid showing `(PUT)`, `(POST)`, BR/feature
IDs or database implementation details in ordinary user-facing instructions;
retain appropriate diagnostic codes in error details where useful.

## 3. Navigation and responsive wireframes

Conceptual layout only, not a screenshot or implemented feature:

```text
DESKTOP WORKSPACE
┌──────────────────┬──────────────────────────────────────────────┐
│ CoursePMS        │ Course / page context       Profile · Logout │
│ Course context   ├──────────────────────────────────────────────┤
│ Overview         │ Page title + meaningful next action          │
│ My team          │ Real own-team / proposal / course summaries  │
│ Proposal         ├─────────────────────┬────────────────────────┤
│ [live features]  │ Team / directory    │ Proposal or active form│
│                  │                     │ Clear save/state       │
└──────────────────┴─────────────────────┴────────────────────────┘

LOGIN
┌───────────────────────────┬────────────────────────────────────┐
│ Brand / short course      │ Welcome back                       │
│ workflow explanation      │ Email                              │
│ No fake metrics           │ Password                           │
│ No demo credential panel  │ [ Sign in ]                        │
└───────────────────────────┴────────────────────────────────────┘
```

- ≥1200px: desktop shell and two useful content columns; ≥768px and <1200px:
  compact navigation, sensible stacked details; <768px: single column with
  accessible menu and full-width primary actions. At 375px no body-level
  horizontal overflow; tables may use a labelled local scroll container.
- At 200% zoom, controls/text remain operable without clipped dialogs/actions.
- Nav items route/scroll to real content and indicate current page. Until a
  feature works, omit its navigation rather than offering a dead destination.
- Motion is short/subtle and respects prefers-reduced-motion. Mobile menus
  open/close with keyboard, correct focus and Escape behavior.

## 4. Shared states and data/privacy safety

| State | Expected behavior |
| --- | --- |
| Loading | Named section/form pending state; do not display synthetic zero metrics as loaded results |
| Empty | Explain no team/proposal/milestone/rows and offer only an authorized functioning next action |
| Validation/error | Label-associated field error plus clear alert; preserve input on same-session failure; no false success |
| Pending write | Disable duplicate mutation and show action-specific progress; restore correct current-session state afterward |
| Conflict | Show newer resource/version, preserve local text and offer reconcile/reload; do not silently overwrite |
| Success | Announce server-confirmed result and show saved state/version where relevant |
| Logout/401/identity change | Clear private forms/feedback/selection; abort/discard stale requests so user A cannot populate user B's workspace |
| Foreign-team directory | Public roster only; proposal data remains null/private, not a misleading NO_DRAFT or leaked summary |

Use semantic headings, explicit labels, keyboard navigation, visible focus,
accessible alerts/status and named icon-only actions. Avoid accessibility
claims based only on a screenshot. Do not invent data for visual polish.

## 5. Planned code and documentation impact

- `client/src/App.tsx`: responsive shell/components/copy and Quick Fill removal;
  preserve handlers, real auth, guards and session-generation boundary.
- `client/src/main.tsx`, `client/index.html`, proposed `client/src/styles.css`
  and reusable `client/src/components/`: tokens/layout/semantics only as
  needed; no extra UI framework or Sites/hosting migration is planned.
- Keep stable functional test IDs where practical. The existing Quick Fill
  component test must be **replaced with the user-approved absence/privacy
  expectation**, and helpers must fill real credentials explicitly. Preserve
  invalid-login, pending, revocation, privacy and session-regression checks;
  removing a test without equivalent required coverage is not completion.
- Update the as-built UI spec only after implementation; retain this planned
  version/history and the actual rendered desktop/mobile evidence afterward.
- No backend/schema/auth behavior needs change for the presentation refresh.
  New feature APIs/data are implemented under their own reviewed contracts.

## 6. Acceptance criteria

| AC ID | Criterion | Planned tests |
| --- | --- | --- |
| UIR-AC01 | Production login contains no Quick Fill controls, demo identities or hard-coded demo password filling | UIR-T01 |
| UIR-AC02 | Real email/password authentication, validation, pending, errors, logout/revocation and current-user identity remain functional | UIR-T02, UIR-T03 |
| UIR-AC03 | Desktop/compact/mobile layouts and 200% zoom remain readable and operable without body overflow | UIR-T04 |
| UIR-AC04 | Role-aware navigation points to real authorized content; user-visible copy avoids unnecessary API/BR implementation jargon | UIR-T05 |
| UIR-AC05 | Team creation/add-member/capacity and proposal save/submit/review flows retain their existing rules and real persistence | UIR-T06 |
| UIR-AC06 | Foreign-team/private/session isolation remains correct even with delayed responses or account switching | UIR-T07 |
| UIR-AC07 | Labels, focus, keyboard/menu/status semantics and measured contrast meet the planned targets | UIR-T08 |
| UIR-AC08 | Loading/empty/error/pending/conflict/success states use true server results and preserve appropriate drafts | UIR-T09 |
| UIR-AC09 | Preserve the separately approved/versioned Lab 7 feedback rule: revision minimum 20, approval minimum 10 after trim/UTF-16 count | UIR-T10 |
| UIR-AC10 | Integrated desktop/mobile visual and functional evidence identifies the actual commit and distinguishes implemented versus planned features | UIR-T11, UIR-T12 |

## 7. STS — PLANNED / NOT RUN

| Test ID | Level | Inputs / preconditions | Expected result | AC |
| --- | --- | --- | --- | --- |
| UIR-T01 | UI+E | Production login rendered; inspect visible/DOM controls and shipped login behavior | No Quick Fill/demo password controls or auto-population; normal labelled auth fields remain | UIR-AC01 |
| UIR-T02 | UI | Empty/invalid credentials, network error, deferred valid login | Existing structured validation/error; pending prevents duplicates; real success establishes current identity | UIR-AC02 |
| UIR-T03 | E | Valid synthetic account signs in/out; replay revoked token through API | Working login and successful logout; replay denied; no UI-only authentication bypass | UIR-AC02 |
| UIR-T04 | E+M | 1440×900, 1024×768, 375×812; 200% zoom | Usable layout/no body overflow/clipped actions; labelled table-local scrolling if needed | UIR-AC03 |
| UIR-T05 | UI+E | Student/instructor/unassigned users navigate all shown destinations | Real role-appropriate content; no dead feature pages or fabricated metrics; clear action copy | UIR-AC04 |
| UIR-T06 | E | Team create/add; capacity rejection; save/submit/review/reload | Same backend rules and persisted data; no lost action or privacy regression | UIR-AC05 |
| UIR-T07 | UI+E | Existing Lab 6 session/directory fixtures; delayed login/load/mutation across A→B; 401 | No A draft/feedback leak or stale B-state overwrite; foreign roster stays PRIVATE | UIR-AC06 |
| UIR-T08 | E+M | Keyboard only, focus/Escape menu, labelled forms/alerts, measured token/rendered text contrast | Operable/named controls and visible focus; actual contrast targets met; retain results | UIR-AC07 |
| UIR-T09 | UI | Real loading/empty/server error/409 and delayed mutation fixtures | Accurate state, draft retention/reconcile and no fake success/zero data | UIR-AC08 |
| UIR-T10 | I+UI | Approved Lab 7 BR-05: revision 19/20/21 and approval 9/10/11 after trim/UTF-16 count | Rule/hint remains revision20/approval10; preserve backend state/access precedence | UIR-AC09 |
| UIR-T11 | E | Existing working journeys on exact UI commit + selected implemented Sprint 2/3 journeys | Relevant tests run and saved states reconcile; planned features explicitly excluded from completion | UIR-AC10 |
| UIR-T12 | M | Actual desktop/mobile screenshots, labels/captions and final product inspection | Readable truthful UI evidence with role/steps/expected/actual/time/commit; reviewer acceptance recorded | UIR-AC10 |

Planned files: UI `client/src/App.uiRefresh.test.tsx` plus preserved/updated
existing session suites; I `server/tests/api.integration.test.ts` for unchanged
BR-05; E `e2e/ui-refresh.spec.ts`; M named visual/accessibility checklist.
This phase creates no tests, screenshots of a new UI or compatibility claims.

## 8. Implementation stages / DoD / history

1. Review this spec and feature contracts; agree actual changes and numbered
   verification before code. This is the current documentation phase.
2. Refresh working F-01–03 presentation and remove Quick Fill; preserve
   real authentication and all domain/privacy regression.
3. Add consistent working Sprint 2 then Sprint 3 pages only as their reviewed
   domain implementations become available. Keep ownership and dependencies.
4. Execute actual UI/API/E2E/manual checks, retain desktop/mobile evidence,
   substantive peer review/CI and update the as-built specification. Only
   then mark #106 Done; a planned token table is not implementation evidence.

| Revision | Decision / status |
| --- | --- |
| UIR v1.0, 22 Nov 2026 | User requested the redesign and specifically Quick Fill removal; implementation explicitly deferred. Concrete design/AC/STS proposed by Magiciancat9; teammate review pending |
| UIR v1.0 accepted, 22 Nov 2026 | martinvadre approved the pre-implementation specification in PR #107, subsequently merged into sprint-2-staging; implementation/tests remain outstanding |
| UIR v1.1, 22 Nov 2026 | User reassigned #106 implementation to martinvadre; Magiciancat9 independently reviews future UI/code changes. No AC/STS or application behavior changed |

| UIR v1.2, 24 Nov 2026 | PR #110 is merged into staging. Integrate maintained main b92b434; UIR-AC09/T10 now follow approved Lab 7 revision20/approval10. Existing review history and original boundaries remain dated history; combined tests and visual evidence remain separate gates. |
