# 10 – Testing and UAT

Slide 6: *"Validation of implemented functionality · UAT would be performed with limited
users · UAT feedback incorporation · Issues remediation."*
Slide 8: *"UAT will be performed by business users."*

## 1. Types of testing

| Type | Who | Where | When |
|---|---|---|---|
| Unit testing (each screen / flow alone) | Developer | DEV | During each sprint |
| System / integration testing (full process) | Developer + QA | TEST | End of each sprint |
| Security testing (each role) | Developer | TEST | Sprint 2 |
| UAT | 3–5 business users (ASSUMPTION) | TEST | Week 6–7 |
| Smoke test after deployment | Developer + 1 key user | PROD | Go-live day |

## 2. Test users (create in TEST, one per role)

| Test user | Role | Department / CC |
|---|---|---|
| test.requester1@lam.com (Priya) | TVR Requester | Process Engineering |
| test.requester2@lam.com (John) | TVR Requester | Metrology |
| test.appg@lam.com (David) | TVR APPG Reviewer | – |
| test.cco@lam.com (Maria) | TVR Cost Center Owner | CC-4100 |
| test.ccomgr@lam.com (James) | Manager of Maria | – |
| test.stakeholder@lam.com (Tom) | TVR Stakeholder | – |
| test.admin@lam.com | TVR Admin | – |

## 3. Test cases (with sample data)

| ID | Phase | Scenario | Steps (sample data) | Expected result |
|---|---|---|---|---|
| TC-01 | Initiation | Mandatory fields | Priya clicks Submit with Title empty | Error "Please fill all fields marked with *"; nothing saved |
| TC-02 | Initiation | Technical document mandatory | Fill all fields, no attachment, Submit | Error "attach at least one technical specification" |
| TC-03 | Initiation | Past date | Required By = yesterday | Error about future date |
| TC-04 | Initiation | Happy path New | Title "Plasma etch uniformity test", New, PE, Fremont, CC-4100, High, 15-Dec-2026, 42,000, attach Etch_Test_Spec_v1.pdf, Submit | TVID TV-2026-000xx created, status Submitted, 6 SP folders, file in 02-Technical Documents, ack email to Priya, email to APPG |
| TC-05 | Initiation | Repeat request | Type = Repeat, select TV-2026-00003 | Fields pre-filled; Previous Request saved |
| TC-06 | Initiation | Recurring without frequency | Type = Recurring, no frequency | Error, cannot submit |
| TC-07 | Initiation | Save Draft | Fill Title only → Save Draft | Saved as Draft; no email; no folder |
| TC-08 | APPG Review | Start review & assign owner | David opens TV, Start Review, owner = David | Status Under APPG Review; email REVIEW_STARTED to Priya; history row |
| TC-09 | APPG Review | More info | David: comment "Please attach the wafer map" → Request More Info | Status More Info Required; Priya gets email with comment |
| TC-10 | APPG Review | More info without comment | Click Request More Info with empty comment | Error; status unchanged |
| TC-11 | APPG Review | Requester responds | Priya uploads Wafer_Map.xlsx, Resubmit | Status Under APPG Review; APPG notified |
| TC-12 | APPG Review | Reject | David rejects with reason "Duplicate of TV-2026-00011" | Status Rejected; reason saved; Priya email |
| TC-13 | Alignment | Add 3 options | Options A/B/C (see doc 06 §10) | 3 rows; comparison visible |
| TC-14 | Alignment | Select option | Select Option A | Only A is selected; Estimated budget = 39,500 |
| TC-15 | Alignment | Move to Alignment 2 without option | Click Confirm option, none selected | Button disabled / error |
| TC-16 | Funding | Normal approval | Send for Funding (39,500) → Maria approves "OK from Q4 budget" | Funding row Approved; status Funding Approved; Approved Amount 39,500; emails |
| TC-17 | Funding | High value | Amount 62,000 → Maria approves → James approves | 2 funding rows (L1, L2); Funding Approved |
| TC-18 | Funding | Rejection | Maria rejects "No budget this quarter" | Status Funding Rejected; Priya gets reason |
| TC-19 | Execution | Milestones & progress | Add 4 milestones; set 2 to 100% | Overall Progress = 50% |
| TC-20 | Execution | Cost tracking | Add costs 18,000 + 12,000 | Actual 30,000; Utilization 76% |
| TC-21 | Execution | High issue | Add Issue "Lab tool down", severity High | EXCEPTION_RAISED email |
| TC-22 | Closure | Close without final report | Click Close | Error "upload the final report first" |
| TC-23 | Closure | Close | Fill outcome, lessons, reuse; upload Final_Report.pdf; Close | Status Closed; summary PDF in 06 folder; completion email to all |
| TC-24 | Automation | Reminder | Request Submitted 3 days ago (set date in TEST) → run F05 | Reminder email to APPG |
| TC-25 | Automation | Escalation | More Info Required 6 days | Email to requester's manager |
| TC-26 | Automation | Auto-cancel | More Info Required 31 days | Status Cancelled, reason "Auto-cancelled..." |
| TC-27 | Security | Requester isolation | John opens app | Cannot see Priya's requests |
| TC-28 | Security | CCO view | Maria opens link from approval email | Can view TV-2026-00015 read-only |
| TC-29 | Export | PDF | Click Export to PDF | PDF opens; saved in SharePoint |
| TC-30 | Audit | History | Open Audit History in admin app | Every field change with user & time |
| TC-31 | Admin | Change setting | ReminderAfterDays = 2 | Next F05 run uses 2 days |
| TC-32 | NFR | Browser | Open app in Microsoft Edge & Chrome | Works the same |
| TC-33 | Reports | Dashboard | Refresh Power BI after tests | Counts match Dataverse |

## 4. UAT process

1. **Prepare:** load master data + sample data into TEST; give testers the test-case sheet
   (export the table above to Excel with columns *Actual result*, *Pass/Fail*, *Comments*).
2. **Kick-off meeting (30 min):** show the app, explain how to log issues.
3. **Testers execute** for 3–5 days. Log defects in a list (Excel, Azure DevOps, or a SharePoint list):

| Defect ID | Test case | Description | Severity | Status | Fixed in |
|---|---|---|---|---|---|
| D-001 | TC-09 | Email shows `{Comments}` instead of the comment | High | Fixed | Build 1.0.0.5 |
| D-002 | TC-19 | Progress % not refreshing on screen | Medium | Fixed | 1.0.0.5 |
| D-003 | – | Want Department dropdown sorted A-Z | Low (enhancement) | Done | 1.0.0.6 |

4. **Fix → redeploy to TEST → retest.**
5. **UAT sign-off** email from business owner (slide 6: "Key stakeholders would need to approve and provide sign off for deployment").

Severity rules: **Critical** – blocks process (must fix); **High** – wrong result (must fix);
**Medium** – workaround exists (fix before go-live if possible); **Low** – cosmetic.
New ideas = **change request** (fixed price, slide 10).
