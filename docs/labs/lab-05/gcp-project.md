# Lab 5 GCP Project Setup Record

This page records the team's selected GCP project and the human verification steps for Lab 5. Values shown as confirmed below came from the project information screenshot shared by the team; they do not prove that billing, IAM access, or a budget is configured.

## Project identity

| Setting | Value | Status |
|---|---|---|
| Project name | `CPE334 Kingnine` | Reported from Cloud Console |
| Project ID | `cpe334-kingnine` | Reported from Cloud Console |
| Project number | `859617270560` | Reported from Cloud Console |
| Project owner / creator | Martin Wongdaeng (`martinvadre`) | Reported by the team; verify in IAM |
| Teammate / project Editor | Tatchakorn Thamnimitr (`Magiciancat9`) | Reported by the team; verify the granted role in IAM |
| Region | To be agreed by both teammates | Not verified |
| Billing account / Free Trial | To be checked by the project owner | Not verified |
| Alerts-only budget | To be created and checked before provisioning | Not verified |
| Teammate project access | Martin adds Tatchakorn as Editor; Tatchakorn confirms project access | Not verified |

Project IDs and numbers identify the team's project; they are not credentials. Never add passwords, service-account keys, database connection strings, or other secret values to this document.

## Human setup checklist

- [ ] Martin confirms that he owns the project and checks Free Trial credits/billing in Cloud Console. Do not pay a prepayment or click **Upgrade**.
- [ ] Martin creates an alerts-only budget before creating billable resources. Record the currency, threshold, and notification recipients in the team's evidence, without exposing payment details.
- [ ] Martin grants Tatchakorn the **Editor** role in project IAM; Tatchakorn confirms he can open the project and verifies the role. The project information screenshot showed **Add people to this project** disabled for the signed-in user, so Martin or another authorized administrator must perform the invitation.
- [ ] Martin handles project-owner/billing actions; Tatchakorn participates in setup and verification but must not be assumed to have owner or billing permissions just because he is an Editor.
- [ ] Agree on the GCP region before provisioning. `asia-southeast1` is an example in the course material, not a confirmed team decision.
- [ ] Record the actual resource names in `deployment.md` only after they are chosen/created.
- [ ] Save redacted evidence for the project, budget, and teammate access; keep screenshots free of secrets and unnecessary personal/billing information.

## Later release-pipeline identifiers

When Workload Identity Federation is configured, the project number is used to form the provider resource path, for example:

```text
projects/859617270560/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID
```

Replace `POOL_ID` and `PROVIDER_ID` with the actual values created by the team. Do not treat this example as evidence that federation is already configured. Never create or commit a service-account key.

## Tracking

- Setup Issue: [#19 - Set up GCP project, budget, and team access](https://github.com/Magiciancat9/Course_management/issues/19)
- This record should be reviewed in a pull request into `lab5-staging`.
- The Issue stays open until the human setup checklist and acceptance criteria are verified.
