A delayed login can restore the previous identity after a cross-tab account switch. Private proposal-title banners also survive that switch, and adding a member discards unsaved proposal edits.

This follow-up builds on #72 and targets its fix branch, preserving the existing correction history. It guards delayed login responses, clears private banners and credential fields at identity boundaries, aborts dashboard loads on cleanup, preserves explicit request authorization, and preserves proposal input during roster refreshes. Five additional regressions exercise these cases, new-session pending state and saved-draft restoration after reload.

Related: #71, #55 and #56. Existing issue driver: @martinvadre. Codex prepared this follow-up under the authenticated @Magiciancat9 account. No human execution, approval or signature is asserted. The original driver must inspect the follow-up; the independent teammate must review the integrated latest head before #72 is merged.

Validation:
- Original RED replay at d3ea0116006c7338f6d7f54aaf7c7b3f4e9ffb63: 5 failed / 4 passed.
- Follow-up RED at 9834080: 3 failed / 11 passed against #72 head 2e3f22a.
- GREEN at 6de3c9a: 14 client tests passed, zero skipped; production build passed; 9 server domain tests passed.
- Full CI is enabled for stacked Lab 6 fix PRs using the existing workflow. Local Docker daemon/PostgreSQL are unavailable; current CI must verify integration/E2E and Docker build.

Original #72 CI run [43714404994](https://github.com/Magiciancat9/Course_management/actions/runs/43714404994) passed 32 server, 9 client and 3 E2E tests plus production/Docker builds. That result does not validate this follow-up.

Public read-only checks on 17 November still serve CoursePMS source 9c22735995c985aaa0622b6b179de1ac9c1f80ca with DB connected. The correction is not deployed. Both human acceptance decisions and independent fastTrack retest remain PENDING. Return-package records on this branch distinguish observed evidence, proposed assignments and illustrative simulation. No partner message is sent by this PR.
