# Lab 6 pairing, version identities and handoff status

Updated 19 November 2026. Earlier appointment/preparation details remain in Git history and [historical execution log](execution-log.md). Current result modes are explicit: technical Codex execution, supplied partner evidence, and user-reported human decisions.

## Teams and roles

| Team | Product | Public accounts / responsibility |
| --- | --- | --- |
| EN-022_P6, Section 31 | CoursePMS | Magiciancat9 and martinvadre; independent UAT team for fastTrack |
| EN-028 InfaCompany, Section 31 | fastTrack | zerotwobook and Atip-Infa; independent UAT team for CoursePMS |

Full student names/IDs, private account documents and original private exchanges remain in the local report packages. A responsibility assignment is not an individual native-UI action log.

## Current handoff and decision ledger

| Direction / item | Status and evidence |
| --- | --- |
| fastTrack → CoursePMS corrected CoursePMS retest | Completed bounded partner retest; 8 deployed targeted PASS and RT-07 evidence/isolated replay PASS; [completion](coursepms-retest-completion.md) |
| fastTrack decision about CoursePMS | Accepted, joint A/B declaration recorded 17 November 22:30:56 Asia/Bangkok; [method and limits](coursepms-acceptance-confirmed.md) |
| CoursePMS → fastTrack Sprint 1 | User reports joint human testing/review on 19 November 09:00–approximately 11:44, all eight PASS and Accepted; no separate human artifacts retained. Original Codex evidence is dated 18 November. [19 November fastTrack closeout](fasttrack-closeout-20261119.md) |
| CoursePMS → fastTrack section 3.5 | Original database JSON compared with 201/409/409 evidence; 3 cases PASS / 16 comparisons PASS; [verified section 3.5 retest](fasttrack-section35-retest-20261119.md) |
| fastTrack receipt | User relays acknowledgement of both returned records; recorded 19 November 12:42:46 Asia/Bangkok; partner will include them and identify 18 November Codex screenshots as supporting evidence. [Receipt](evidence/fasttrack-closeout-20261119/partner-receipt.json) |

## Version ledger

| Product / scope | Source / revision | Evidence limit |
| --- | --- | --- |
| CoursePMS accepted correction | `aeb804ea5bc667399b00cf54df10046a6ded46e0` / dated `course-pms-00009-mk2` | 17 November release/retest; [release proof](release-evidence.md), not a fresh 19 November deployment |
| fastTrack Sprint 1 | `8e637e537cd037d630a5fffc1b5672d1b44371a8` | Health at original 18 November start/end and 19 November 11:24/11:45 corroborates SHA; no saved check at reported 09:00 human start; current Cloud Run traffic not independently read back |
| fastTrack isolated section 3.5 | `1bbe187c088b86d104a16e420058f17425f18828` / partner-reported `fasttrack-lab6-00001-74k` | Original start/end health matches source; snapshot projection itself has no SHA/revision fields |

## Remaining report assembly

- Use the [public evidence index](evidence/README.md) and [report draft](report-draft.md) for the team report.
- Preserve original dates/operators and the human-session evidence gaps; partner receipt is not an instructor grading decision or proof of final report submission.
- Private report identities and screenshots of private conversations stay outside public Git.
- Any future deployment/retest requires fresh version confirmation and appropriate team coordination; no live environment is changed by this documentation update.
