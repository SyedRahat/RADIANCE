# 08 – Power Automate Flows (all automation)

Architecture slide lists these automation activities. Here is which flow does what:

| Activity from slide | Flow |
|---|---|
| SharePoint workspace creation | **F01** |
| Submission notification | **F01** |
| Missing information notification | **F02** |
| Funding approval routing | **F04** |
| Status change notifications | **F02** |
| Reminders & escalations (+ automatic cancellation) | **F05** |
| Exception remediation | **F08** pattern + Error Log |
| Completion notifications | **F07** |
| Generate PDF and store | **F06** |
| Audit trail capture | Dataverse auditing + Status History rows (app & flows) + Notification Log |
| Document upload from app | **F09** |

**General rules for every flow**
1. Create it **inside the solution** (Solution → New → Automation → Cloud flow).
2. Use **connection references** and **environment variables** (doc 02).
3. Owner = service account `svc-tvrms`.
4. Name format: `TVRMS - F01 - On Request Submitted`.
5. Use **Try / Catch scopes** (see F08).
6. Choice values in Dataverse are numbers. Write them down once, for example:

| Status | Value (example – check yours in the choice editor) |
|---|---|
| Draft | 100000000 |
| Submitted | 100000001 |
| Under APPG Review | 100000002 |
| More Info Required | 100000003 |
| Rejected | 100000004 |
| Internal Alignment 1 | 100000005 |
| Internal Alignment 2 | 100000006 |
| Pending Funding Approval | 100000007 |
| Funding Rejected | 100000008 |
| Funding Approved | 100000009 |
| In Execution | 100000010 |
| On Hold | 100000011 |
| Execution Completed | 100000012 |
| Closed | 100000013 |
| Cancelled | 100000014 |

---

## Common building block: "Send templated email + log it"

Used inside many flows (copy the steps, or make it a child flow `F00 - Send Notification`
with inputs: TemplateCode, TVRequestId, ToEmails, ExtraComments).

1. **List rows** (Dataverse) – table *Email Templates*, Filter rows:
   `tvr_templatecode eq 'REQ_SUBMITTED' and tvr_isactive eq true`, Row count 1.
2. **Compose – Subject**:
   ```
   replace(replace(first(outputs('List_template')?['body/value'])?['tvr_subject'],
     '{TVID}', triggerOutputs()?['body/tvr_tvid']),
     '{Title}', triggerOutputs()?['body/tvr_title'])
   ```
3. **Compose – Body**: same `replace(...)` for `{TVID}`, `{Title}`, `{RequesterName}`,
   `{Status}`, `{Comments}`, and `{Link}` =
   `concat(parameters('App URL (tvr_AppUrl)'), '?TVID=', triggerOutputs()?['body/tvr_tvid'])`.
4. **Send an email (V2)** (Office 365 Outlook) – To, Subject, Body (HTML).
   Tip: use **"Send an email from a shared mailbox (V2)"** with `tvrms-noreply@lam.com`.
5. **Add a new row** – *Notification Logs*: Subject, Template Code, Sent To,
   Sent On = `utcNow()`, Result = Sent, TV Request = `tvr_tvrequests(<id>)`.
6. If step 4 fails (Configure run after → *has failed*): add Notification Log with Result = Failed + error text.

**Sample email (REQ_SUBMITTED)**
```
Subject: [TVRMS] TV-2026-00015 submitted – Plasma etch uniformity test on 300mm wafers

Dear Priya Sharma,

Your Test Vehicle request TV-2026-00015 has been submitted successfully
and is now with the APPG team for review.

Request type : New
Required by  : 15-Dec-2026
Status       : Submitted

Open request: https://apps.powerapps.com/play/e/.../a/...?TVID=TV-2026-00015

Regards,
TV Request Management System (automatic email – please do not reply)
```

---

## F01 – On Request Submitted

**Purpose:** create SharePoint workspace, send acknowledgement, inform APPG.

**Trigger:** Dataverse – *When a row is added, modified or deleted*
- Change type: **Modified**
- Table: TV Requests
- Scope: Organization
- Select columns: `tvr_status`
- Filter rows: `tvr_status eq 100000001` (Submitted)

**Steps:**
1. **Scope – Try**
2. **Initialize variable** `FolderList` (Array):
   `["01-Request","02-Technical Documents","03-Feasibility & Quotes","04-Funding Approval","05-Execution","06-Final Report & Closure"]`
3. **Apply to each** `FolderList` → SharePoint **Create new folder**
   - Site: env var `tvr_SPSiteUrl`, List: `tvr_SPLibrary`
   - Folder path: `@{triggerOutputs()?['body/tvr_tvid']}/@{items('Apply_to_each')}`
4. **Update a row** – TV Requests: `SharePoint Folder URL` =
   `concat(parameters('SharePoint Site URL (tvr_SPSiteUrl)'), '/', parameters('SharePoint Library (tvr_SPLibrary)'), '/', triggerOutputs()?['body/tvr_tvid'])`
5. **Get a row by ID** – Users: requester (`_tvr_requester_value`) → email + full name.
6. *(Optional, stricter security)* SharePoint **Send an HTTP request** to break
   inheritance on the TVID folder and grant Edit to requester (see doc 04 §2).
7. Send templated email **REQ_SUBMITTED** → requester.
8. Send templated email **NEW_REQUEST_APPG** → env var `tvr_APPGEmail`.
9. **Scope – Catch** (run after Try *has failed / timed out*) → F08 pattern.

**Test with sample:** submit TV-2026-00015 → folder `TV Requests/TV-2026-00015/...` with 6
sub-folders exists, Priya gets email, APPG mailbox gets email, 2 Notification Log rows.

---

## F02 – Status Change Notifier

**Purpose:** one flow that sends the right email for every status change.

**Trigger:** Dataverse *When a row is modified* – TV Requests – Select columns `tvr_status`
(no filter).

**Steps:**
1. Get requester, APPG owner, and cost center owner emails (Get a row by ID ×3; use
   *Configure run after* to continue if a lookup is empty).
2. Get the latest comment (List rows *Request Comments*, filter on this request,
   order by `createdon desc`, top 1) → used as `{Comments}`.
3. **Switch** on `triggerOutputs()?['body/tvr_status']`:

| Case (status) | Template | To | CC |
|---|---|---|---|
| Under APPG Review | REVIEW_STARTED | Requester | – |
| More Info Required | MORE_INFO | Requester | APPG owner |
| Rejected | REJECTED | Requester | APPG team |
| Internal Alignment 1 / 2 | ALIGNMENT_UPDATE | Requester, stakeholders | APPG owner |
| Funding Approved | FUNDING_APPROVED | Requester, APPG owner | CCO |
| Funding Rejected | FUNDING_REJECTED | Requester, APPG owner | CCO |
| In Execution / On Hold | STATUS_UPDATE | Requester, stakeholders | – |
| Execution Completed | STATUS_UPDATE | Requester | – |
| Cancelled | CANCELLED | Requester | APPG owner |
| Submitted, Pending Funding Approval, Closed | *(do nothing – F01/F04/F07 handle these)* | | |

4. Send templated email + log (common block).

**Exception notification:** a second small trigger flow **F02b** on *Risk Issues*
"When a row is added" with filter `tvr_severity eq <High>` → email APPG owner + requester
with template EXCEPTION_RAISED.

---

## F04 – Funding Approval Routing

**Trigger:** TV Requests modified, Select columns `tvr_status`,
Filter `tvr_status eq 100000007` (Pending Funding Approval).

**Steps:**
1. **Get a row by ID** – Cost Centers (`_tvr_costcenter_value`) → Owner, Owner's Manager.
2. **Get a row by ID** – Users → CCO email, Manager email.
3. **Get a row by ID** – Feasibility Options (selected option) → quoted cost, institution.
4. **List rows** – App Settings, filter `tvr_name eq 'HighValueFundingLimit'` → limit (e.g. 50000).
5. **Perform an unbound action** `AddUserToRecordTeam` → add CCO to the request's access
   team (so CCO can open the record) – doc 05 §2.
6. **Add a new row** – Funding Approvals: Request, Cost Center, Approver = CCO, Level 1,
   Requested Amount = quoted cost, Decision = Pending, Requested On = `utcNow()`.
7. **Start and wait for an approval** (Approvals connector)
   - Type: **Approve/Reject – First to respond**
   - Title: `Funding approval: @{TVID} – USD @{formatNumber(QuotedCost,'N0')}`
   - Assigned to: CCO email
   - Details (markdown):
     ```
     **Request:** TV-2026-00015 – Plasma etch uniformity test
     **Requester:** Priya Sharma (Process Engineering)
     **Cost center:** CC-4100 Etch R&D
     **Selected option:** Stanford Nanofab Lab – USD 39,500 – 10 weeks
     **Justification:** Customer X reports 4% non-uniformity...
     ```
   - Item link: app deep link `?TVID=...`
8. **Update a row** – Funding Approval: Decision = outcome, Comments =
   `first(body('Start_and_wait_for_an_approval')?['responses'])?['comments']`,
   Decided On = `utcNow()`.
9. **Condition:** Outcome = "Approve" **and** amount > limit?
   - Yes → repeat steps 6–8 with **Level 2**, Approver = Owner's Manager.
10. **Condition:** final outcome = Approve?
    - **Yes:** Update TV Request → Status = Funding Approved, Approved Amount = quoted cost,
      Status Changed On = `utcNow()`; add Status History row (Changed By = approver).
    - **No:** Update TV Request → Status = Funding Rejected, Reason = approver comments;
      add Status History row.
11. F02 then sends FUNDING_APPROVED / FUNDING_REJECTED automatically.

> Note: a flow run can wait at most **30 days**. F05 sends reminders to the CCO while
> the approval is pending. If 30 days pass, the run ends; F05 flags it to the APPG owner.

**Sample:** quoted 39,500 ≤ 50,000 → only Maria Lopez approves → status Funding Approved.
Quoted 62,000 → Maria approves, then James Wilson approves → Funding Approved.

---

## F05 – Daily Reminders, Escalations and Auto-Cancellation

**Trigger:** Recurrence – every 1 day at 08:00, time zone = LAM local, on weekdays.

**Steps:**
1. Read settings: ReminderAfterDays (3), EscalationAfterDays (5), AutoCancelAfterDays (30).
2. **List rows** – TV Requests waiting for an action:
   ```
   (tvr_status eq 100000001 or tvr_status eq 100000002 or tvr_status eq 100000003
    or tvr_status eq 100000005 or tvr_status eq 100000006 or tvr_status eq 100000007)
   and tvr_statuschangedon le @{addDays(utcNow(), mul(-1, int(variables('ReminderDays'))))}
   ```
3. **Apply to each** request:
   - Compose `DaysWaiting` = `div(sub(ticks(utcNow()), ticks(items('Apply_to_each')?['tvr_statuschangedon'])), 864000000000)`
   - Decide **who must act**: More Info Required → requester; Pending Funding → CCO;
     other statuses → APPG owner (or APPG team if no owner).
   - **Condition A – auto-cancel:** status = More Info Required **and** DaysWaiting ≥ 30
     → Update row: Status = Cancelled, Reason = "Auto-cancelled: no response for 30 days";
     add Status History (Changed By = system). (F02 sends the CANCELLED email.)
   - **Condition B – escalate:** DaysWaiting ≥ 5 → Office 365 Users **Get manager (V2)** of
     the person who must act → send ESCALATION email to manager, CC the person.
   - **Else – reminder:** send REMINDER email to the person who must act.
4. **List rows** – Milestones where `tvr_plannedend lt @{utcNow()}` and status ne Completed
   → reminder to APPG owner ("Milestone overdue").
5. **List rows** – TV Requests In Execution where Expected Completion < today → email APPG owner.

**Sample run (12-Oct-2026):**
| TVID | Status | Days waiting | Action |
|---|---|---|---|
| TV-2026-00018 | Submitted | 3 | Reminder to APPG team |
| TV-2026-00016 | More Info Required | 6 | Escalation to Priya's manager |
| TV-2026-00009 | More Info Required | 31 | Auto-cancelled |
| TV-2026-00012 | Pending Funding Approval | 4 | Reminder to CCO |

> Working days only? (ASSUMPTION: calendar days). If the business wants working days,
> keep a *Holiday* table and count only Mon–Fri non-holiday days.

---

## F06 – Generate PDF and Store

Make two flows:
- **F06a – Build Request PDF (child flow)** – trigger *Manually trigger a flow* with input `TVID`.
- **F06 – Export PDF (from app)** – trigger *Power Apps (V2)* with input `TVID` → **Run a Child Flow** F06a → **Respond to a PowerApp or flow** with `fileurl`.

**F06a steps:**
1. List rows TV Requests `tvr_tvid eq '@{triggerBody()['text']}'` (expand requester, cost center).
2. List rows Feasibility Options, Funding Approvals, Milestones for this request.
3. **Create HTML table** for options / approvals / milestones.
4. **Compose** full HTML:
   ```html
   <html><body style="font-family:Segoe UI">
   <h1>TV Request Summary – TV-2026-00015</h1>
   <p><b>Title:</b> Plasma etch uniformity test ... <b>Status:</b> Closed</p>
   <h2>Feasibility Options</h2> @{body('Create_HTML_table_options')}
   <h2>Funding Approvals</h2>   @{body('Create_HTML_table_approvals')}
   <h2>Milestones</h2>          @{body('Create_HTML_table_milestones')}
   <h2>Closure</h2><p>Outcome: ... Lessons learned: ...</p>
   <p>Generated on @{formatDateTime(utcNow(),'dd-MMM-yyyy HH:mm')} UTC</p>
   </body></html>
   ```
5. OneDrive for Business **Create file** `/TVRMS-Temp/@{TVID}.html` with the HTML.
6. OneDrive **Convert file** (by Id) → Target type **PDF**.
7. SharePoint **Create file** → folder `/@{TVID}/06-Final Report & Closure` (or `01-Request`
   if not closed), name `@{TVID}_Summary_@{formatDateTime(utcNow(),'yyyyMMdd')}.pdf`.
8. Add a Request Document row (Type = Approval Evidence / Final Report).
9. OneDrive **Delete file** (temp HTML).
10. **Respond to a PowerApp or flow**: `fileurl` = SharePoint file link.

(Option: if LAM has a Word template, use *Populate a Microsoft Word template* (premium) instead of HTML.)

---

## F07 – On Request Closed (Completion Notification)

**Trigger:** TV Requests modified, Select `tvr_status`, Filter `tvr_status eq 100000013` (Closed).

**Steps:**
1. **Run a Child Flow** F06a → closure summary PDF saved in `06-Final Report & Closure`.
2. Find the final report link (List rows Request Documents, Type = Final Report, top 1).
3. Send templated email **COMPLETED** → requester, APPG owner, CCO, stakeholders, with
   links to the final report and the summary PDF ("Report Available Notification").
4. If Request Type = Recurring → send **NEXT_OCCURRENCE** reminder to requester:
   "Your next Quarterly TV request is due. Use 'Repeat' to create it."

---

## F08 – Error handling pattern (Exception Remediation)

Put every flow's steps inside **Scope – Try**. Then add **Scope – Catch** with
*Configure run after* = **has failed, has timed out**:

1. **Add a new row** – Error Logs:
   - Flow Name: `@{workflow()?['tags']?['flowDisplayName']}`
   - Error: `@{string(result('Try'))}`
   - Run URL:
     ```
     concat('https://make.powerautomate.com/environments/', workflow()?['tags']?['environmentName'],
            '/flows/', workflow()?['name'], '/runs/', workflow()?['run']?['name'])
     ```
   - TV Request: the trigger row id.
2. Send email to env var `tvr_AdminEmail`: "TVRMS flow failed – {Flow} – {TVID}" + Run URL.
3. **Terminate** – Status: Failed (so the run shows red in history).

Admin opens **Monitoring → Open Errors** in the model-driven app, fixes the cause, and
**resubmits** the failed run from flow run history. Then sets Error Log Status = Fixed.

Also set **Retry policy** (Settings of each action) for SharePoint/Outlook actions:
*Exponential, 4 retries*.

---

## F09 – Upload Document (called from the app)

**Trigger:** **Power Apps (V2)** with inputs:
| Input | Type | Sample |
|---|---|---|
| TVID | Text | TV-2026-00015 |
| DocType | Text | Technical Specification |
| Folder | Text | 02-Technical Documents |
| file | File | Etch_Test_Spec_v1.pdf |

**Steps:**
1. SharePoint **Create file**
   - Folder path: `/@{parameters('SharePoint Library (tvr_SPLibrary)')}/@{triggerBody()['text']}/@{triggerBody()['text_2']}`
   - File name: `@{triggerBody()?['file']?['name']}`
   - File content: `@{triggerBody()?['file']?['contentBytes']}`
   (If the folder does not exist yet, SharePoint creates it. Same file name again = new version.)
2. SharePoint **Update file properties** (Id = `outputs('Create_file')?['body/ItemId']`):
   TVID, DocumentType, Phase.
3. **List rows** TV Requests where `tvr_tvid eq '@{triggerBody()['text']}'`.
4. **Add a new row** – Request Documents: File Name, Document Type, Folder, SharePoint URL, TV Request.
5. **Respond to a PowerApp or flow** – `fileurl`.

App call (from doc 06):
```powerfx
'F09-UploadDocument'.Run(varNew.TVID, "Technical Specification", "02-Technical Documents",
    { file: { name: f.Name, contentBytes: f.Value } })
```

---

## F10 – Add Stakeholder (optional, from app)

Power Apps (V2) trigger: TVID, StakeholderEmail → Get user → `AddUserToRecordTeam`
(template "TVR Request Team") → email STAKEHOLDER_ADDED.

---

## Flow testing checklist

| Flow | How to test | Pass when |
|---|---|---|
| F01 | Submit a request | 6 folders created, 2 emails, URL saved |
| F02 | Change status to More Info Required | Requester gets MORE_INFO email with comment |
| F04 | Send for funding (amount 39,500) | CCO gets approval in Outlook/Teams; decision saved |
| F04 | Amount 62,000 | Two approvals in sequence |
| F05 | Set Status Changed On to 31 days ago on a More Info request; run flow manually | Request auto-cancelled |
| F06 | Click Export PDF | PDF opens; file in SharePoint |
| F07 | Close request | Completion email with links |
| F08 | Temporarily rename SharePoint library in env var; submit | Error Log row + admin email |
| F09 | Upload 2 files | Both in SharePoint + 2 Request Document rows |
