# fastTrack reciprocal UAT closeout — 19 November 2026

The CoursePMS team reports **Accepted** for fastTrack Sprint 1. The public record separates a directly recorded Codex run, the later user-declared human review/testing window, and the section 3.5 controlled exercise.

## Sprint 1 source and actual technical execution

- Application: https://fasttrack-app-kpx7au3w2a-as.a.run.app/
- Source: `8e637e537cd037d630a5fffc1b5672d1b44371a8`.
- Codex run: `L6-CPMS-AI-20261118-144203`, 18 November 2026 **14:37:42–14:50:33 Asia/Bangkok**.
- UAT-01–08: **8 PASS**, with **18 active recorded observations**. One erroneous harness-count observation is retained as invalidated, not a product defect.
- Start/end health and readiness are HTTP 200, expected source and connected database. Current Cloud Run traffic/revision was not independently read back.
- Separate SA/A1/SB profiles were used; UAT-07 deliberately switched A1 to SB in one profile. Actual response codes and saved-state comparisons are in the linked JSON.

| Case | Recorded actual technical behavior | 18 November Codex image |
| --- | --- | --- |
| UAT-01 | สร้างผ่าน UI, reload, พบ NORMAL หนึ่งรายการ; นักศึกษาอ่านข้อมูลตรงกัน | [image](evidence/fasttrack-sprint1-20261118/UAT-01-student-normal.png) |
| UAT-02 | บันทึกงาน version 1; feedback สองข้อความคงอยู่ในมุมมอง Supervisor และ Student | [image](evidence/fasttrack-sprint1-20261118/UAT-02-student-two-feedback.png) |
| UAT-03 | UI แสดงงานเดิม; คำขอเสริมตอบ 409 ALREADY_SUBMITTED; ID และเนื้อหาไม่เปลี่ยน | [image](evidence/fasttrack-sprint1-20261118/UAT-03-existing-submission.png) |
| UAT-04 | กรอกฟอร์มก่อนหมดเวลา; รอ server dueAt + 60 วินาที; ตอบ 409 DEADLINE_PASSED และไม่มีงานบันทึก | [image](evidence/fasttrack-sprint1-20261118/UAT-04-stale-form-after-deadline.png) |
| UAT-05 | Supervisor B ไม่เห็นข้อมูล Team A; team/milestone/submission/feedback API ตอบ 404 NOT_FOUND | [image](evidence/fasttrack-sprint1-20261118/UAT-05-foreign-submission.png) |
| UAT-06 | Student สร้าง milestone/feedback ถูกปฏิเสธ 403 FORBIDDEN; ช่องว่างและ FTP ไม่บันทึกข้อมูล | [image](evidence/fasttrack-sprint1-20261118/UAT-06-ftp-link.png) |
| UAT-07 | Anonymous และหลัง logout ได้ 401; รหัสผิดหนึ่งครั้งเข้าไม่ได้; A1 สลับเป็น SB ใน profile เดิมได้ 404 | [image](evidence/fasttrack-sprint1-20261118/UAT-07-same-profile-switched-to-SB.png) |
| UAT-08 | เปรียบเทียบ ID, version, ผู้ส่ง, เวลา, เนื้อหา, link และ feedback สองข้อความตรงกันทุกครั้ง | [image](evidence/fasttrack-sprint1-20261118/UAT-08-student-relogin.png) |

[Actual observations](evidence/fasttrack-sprint1-20261118/observations.json), [fixtures](evidence/fasttrack-sprint1-20261118/fixture-ledger.json), [work/feedback](evidence/fasttrack-sprint1-20261118/saved-work-ledger.json), [persistence comparisons](evidence/fasttrack-sprint1-20261118/persistence-comparisons.json), [start](evidence/fasttrack-sprint1-20261118/preflight-start.json), [end](evidence/fasttrack-sprint1-20261118/session-closeout.json).

## Reported joint human work and decision

The user confirms joint testing/review by CoursePMS members `Magiciancat9` and `martinvadre` on **19 November, 09:00–approximately 11:44 Asia/Bangkok**, all eight cases PASS, no outstanding defects, and **Accepted**. Responsibility: Magiciancat9 UAT-01–04, martinvadre UAT-05–08. Decision confirmation was recorded **11:46:32**; the separate original decision time was not retained. Full names/student IDs remain in the private report.

This is a user-supplied declaration, not a newly instrumented browser run. No separate human-session screenshot, fixture ID, Network capture or per-case time was retained. Source observations at **11:24:56** and **11:45:02** match the expected source; neither is backdated to the reported 09:00 start. The earlier Codex images are technical support with their original attribution. [Sanitized declaration](evidence/fasttrack-closeout-20261119/reported-sprint1-acceptance.json).

## Section 3.5 and receipt

The independently compared original database files support **PASS / Accepted** for the separate [section 3.5 retest](fasttrack-section35-retest-20261119.md). Source `1bbe187c088b86d104a16e420058f17425f18828` and partner-reported revision `fasttrack-lab6-00001-74k` belong to that isolated exercise, not the Sprint 1 deployment above.

A partner acknowledgement relayed by the user was recorded **19 November, 12:42:46 Asia/Bangkok**. It confirms receipt of the Sprint 1 acceptance record and section 3.5 confirmation and states they will be included in fastTrack's report, with screenshots identified as the separate 18 November Codex run. The original message's send/receipt time is unknown. [Sanitized receipt](evidence/fasttrack-closeout-20261119/partner-receipt.json). This is intended report inclusion, not a confirmed instructor submission or evidence-rule waiver.
