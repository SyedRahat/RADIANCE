# 06 – Canvas App (for end users)

Architecture slide: Canvas App covers **Request Intake / APPG Review / Feasibility
Assessment / Funding Approval / Execution Tracking / Closure**, plus **Validation &
Error Handling** and **Export to PDF**.

## 1. Create the app

1. make.powerapps.com → `LAM-TVRMS-DEV` → **Solutions → TVRMS → New → App → Canvas app**.
2. Name: **`TV Request Management`**, Format: **Tablet** (works well in Edge on laptop).
3. **Data** pane → Add data → Dataverse tables: TV Requests, Feasibility Options,
   Funding Approvals, Milestones, Risk Issues, Cost Entries, Request Comments,
   Request Documents, Status Histories, Departments, Cost Centers, Locations,
   Research Institutions, App Settings, Users.
4. Settings → turn ON **"Formula-level error management"** and **"Named formulas"**.

> Naming convention for controls: `scr` screen, `gal` gallery, `frm` form, `btn`
> button, `txt` text input, `dd` dropdown, `cmb` combo box, `dp` date picker,
> `lbl` label, `att` attachment. Example: `btnSubmit`, `galMyRequests`.

## 2. Global choices used below

Create these as **global choices** (Solution → New → Choice) so formulas are readable:
`TVR Status`, `TVR Phase`, `TVR Request Type`, `TVR Priority`.
In Power Fx you write them like: `'TVR Status'.Submitted`.

## 3. App start-up

```powerfx
// App.Formulas
gblAppColorPrimary = ColorValue("#3B2BB3");
CurrentUserRecord  = LookUp(Users, 'Primary Email' = User().Email);
IsAPPG  = !IsEmpty(Filter(LookUp(Teams, 'Team Name' = "TVRMS APPG").'Users (teammembership_association)', 'Primary Email' = User().Email));
IsAdmin = !IsEmpty(Filter(LookUp(Teams, 'Team Name' = "TVRMS Admins").'Users (teammembership_association)', 'Primary Email' = User().Email));

// App.OnStart  (deep link support: open a request directly from an email link)
If(
    !IsBlank(Param("TVID")),
    Set(varSelectedRequest, LookUp('TV Requests', TVID = Param("TVID")));
    Navigate(scrRequestDetail)
)
```
Every email link looks like: `{AppUrl}?TVID=TV-2026-00015` → opens the request directly.

## 4. Screens (list)

| # | Screen | Who uses it | Purpose |
|---|---|---|---|
| 1 | `scrHome` | Everyone | My requests, counters, "New Request" button |
| 2 | `scrNewRequest` | Requester | 3-step wizard to create & submit |
| 3 | `scrRequestDetail` | Everyone (content depends on role) | All information about one TVID in tabs |
| 4 | `scrAPPGQueue` | APPG | Work queue of requests to review |
| 5 | `scrFeasibility` | APPG | Compare research institutions / options |
| 6 | `scrFunding` | APPG / CCO | Send for funding, see approval history |
| 7 | `scrExecution` | APPG | Milestones, risks/issues, costs, progress |
| 8 | `scrClosure` | APPG | Final outcome, lessons learned, close request |

## 5. Screen 1 – Home (`scrHome`)

**Layout:** header bar (logo, title, user name), 4 counter tiles, a filter row, a gallery.

Counter tiles (labels):
```powerfx
// lblMyOpen.Text
CountRows(Filter('TV Requests', Requester.'Primary Email' = User().Email,
    !('Request Status' in ['TVR Status'.Closed, 'TVR Status'.Cancelled, 'TVR Status'.Rejected, 'TVR Status'.'Funding Rejected'])))

// lblNeedsMyAction.Text  (requests waiting for my answer)
CountRows(Filter('TV Requests', Requester.'Primary Email' = User().Email,
    'Request Status' = 'TVR Status'.'More Info Required'))
```

Gallery `galMyRequests.Items`:
```powerfx
SortByColumns(
    Filter(
        'TV Requests',
        (IsAPPG || Requester.'Primary Email' = User().Email),
        IsBlank(txtSearch.Text) || StartsWith(TVID, txtSearch.Text) || StartsWith('Request Title', txtSearch.Text),
        IsBlank(ddStatusFilter.Selected.Value) || 'Request Status' = ddStatusFilter.Selected.Value
    ),
    "createdon", SortOrder.Descending
)
```
(Dataverse security already limits rows; the filter just makes the list cleaner.)

Inside the gallery show: TVID, Title, Status (coloured pill), Required By, Phase.
Status colour:
```powerfx
// lblStatusPill.Fill
Switch(ThisItem.'Request Status',
    'TVR Status'.'More Info Required', ColorValue("#F4B400"),
    'TVR Status'.Rejected,             ColorValue("#D93025"),
    'TVR Status'.'Funding Rejected',   ColorValue("#D93025"),
    'TVR Status'.Closed,               ColorValue("#188038"),
    ColorValue("#1A73E8"))
```
`galMyRequests.OnSelect`: `Set(varSelectedRequest, ThisItem); Navigate(scrRequestDetail)`

`btnNewRequest.OnSelect`: `NewForm(frmRequest); Set(varStep, 1); Navigate(scrNewRequest)`

## 6. Screen 2 – New Request wizard (`scrNewRequest`)

Use **one Edit Form** `frmRequest` (DataSource = 'TV Requests') and show fields
step by step using `varStep`.

| Step | Fields | Sample input |
|---|---|---|
| 1 – Basic | Title*, Request Type*, Previous Request (if Repeat), Frequency (if Recurring), Department*, Location*, Cost Center*, Priority*, Required By*, Estimated Budget* | "Plasma etch uniformity test", New, –, –, Process Engineering, Fremont CA, CC-4100, High, 15-Dec-2026, 42000 |
| 2 – Details | Business Justification*, Technical Description*, Expected Outcome* | text |
| 3 – Documents & Submit | Attachment control (technical docs*), other docs, Review summary, **Save as Draft** / **Submit** | Etch_Test_Spec_v1.pdf |

Show/hide data cards:
```powerfx
// DataCard "Previous Request".Visible
ddRequestType.Selected.Value = 'TVR Request Type'.Repeat
// DataCard "Recurrence Frequency".Visible
ddRequestType.Selected.Value = 'TVR Request Type'.Recurring
```

**Repeat request – copy data from old TVID** (Previous Request combo `cmbPrevious.OnChange`):
```powerfx
If(!IsBlank(cmbPrevious.Selected),
    Set(varCopyFrom, cmbPrevious.Selected);
    Notify("Details copied from " & varCopyFrom.TVID & ". Please review.", NotificationType.Information)
)
// then each text input Default = If(!IsBlank(varCopyFrom), varCopyFrom.'Business Justification', Parent.Default)
```

**Attachment control:** Dataverse forms don't give a free attachment control, so
add a SharePoint/Dataverse form once, copy its Attachments card's control, paste
it into `scrNewRequest`, rename it `attTechDocs`. Set `MaxAttachments = 10`,
`MaxAttachmentSize = 25` (MB).

### Validation + Submit (`btnSubmit.OnSelect`)

```powerfx
// 1. Validation (mandatory fields + technical document)
If(
    !frmRequest.Valid,
        Notify("Please fill all fields marked with *", NotificationType.Error),
    CountRows(attTechDocs.Attachments) = 0,
        Notify("Please attach at least one technical specification document.", NotificationType.Error),
    dpRequiredBy.SelectedDate <= Today(),
        Notify("'Required By' date must be a future date.", NotificationType.Error),
    ddRequestType.Selected.Value = 'TVR Request Type'.Repeat && IsBlank(cmbPrevious.Selected),
        Notify("Please select the previous request for a Repeat request.", NotificationType.Error),

    // 2. All good -> save the request as Draft first (gets a TVID)
    Set(varNew,
        Patch('TV Requests',
            If(IsBlank(varDraft), Defaults('TV Requests'), varDraft),
            frmRequest.Updates,
            { Requester: CurrentUserRecord, 'Request Status': 'TVR Status'.Draft, 'Current Phase': 'TVR Phase'.Initiation }
        )
    );
    IfError(varNew, Notify("Could not save: " & FirstError.Message, NotificationType.Error); Exit());

    // 3. Upload each file to SharePoint through flow F09
    ForAll(attTechDocs.Attachments As f,
        'F09-UploadDocument'.Run(varNew.TVID, "Technical Specification", "02-Technical Documents",
            { file: { name: f.Name, contentBytes: f.Value } })
    );

    // 4. Change status to Submitted (this triggers flow F01)
    Patch('TV Requests', varNew, { 'Request Status': 'TVR Status'.Submitted, 'Current Phase': 'TVR Phase'.'APPG Review', 'Submitted On': Now(), 'Status Changed On': Now() });
    Patch('Status Histories', Defaults('Status Histories'),
        { Name: varNew.TVID & ": Draft → Submitted", 'TV Request': varNew,
          'From Status': 'TVR Status'.Draft, 'To Status': 'TVR Status'.Submitted,
          'Changed On': Now(), Remarks: "Submitted by requester" });

    Notify("Request " & varNew.TVID & " submitted successfully.", NotificationType.Success);
    Reset(attTechDocs); Set(varDraft, Blank());
    Navigate(scrHome)
)
```

`btnSaveDraft.OnSelect` = same Patch with `'Request Status': 'TVR Status'.Draft` and **no** validation
except Title. Store result in `varDraft` so the next save updates the same record.

## 7. Reusable "change status" pattern

Many screens change status. Use one hidden button `btnDoStatusChange` on the detail screen:

```powerfx
// btnDoStatusChange.OnSelect   (inputs: varNewStatus, varRemarks)
With({ oldStatus: varSelectedRequest.'Request Status' },
    Set(varSelectedRequest,
        Patch('TV Requests', varSelectedRequest,
            { 'Request Status': varNewStatus, 'Status Changed On': Now(),
              'Current Phase': Switch(varNewStatus,
                  'TVR Status'.'Internal Alignment 1',     'TVR Phase'.'Internal Alignment',
                  'TVR Status'.'Internal Alignment 2',     'TVR Phase'.'Internal Alignment',
                  'TVR Status'.'Pending Funding Approval', 'TVR Phase'.'Funding Approval',
                  'TVR Status'.'Funding Approved',         'TVR Phase'.'Funding Approval',
                  'TVR Status'.'In Execution',             'TVR Phase'.Execution,
                  'TVR Status'.'On Hold',                  'TVR Phase'.Execution,
                  'TVR Status'.'Execution Completed',      'TVR Phase'.Closure,
                  'TVR Status'.Closed,                     'TVR Phase'.Closure,
                  varSelectedRequest.'Current Phase') })   // other statuses keep the same phase
    );
    Patch('Status Histories', Defaults('Status Histories'),
        { Name: varSelectedRequest.TVID & ": " & Text(oldStatus) & " → " & Text(varNewStatus),
          'TV Request': varSelectedRequest,
          'From Status': oldStatus, 'To Status': varNewStatus,
          'Changed On': Now(), Remarks: varRemarks });
    If(!IsBlank(varRemarks),
        Patch('Request Comments', Defaults('Request Comments'),
            { Comment: varRemarks, 'TV Request': varSelectedRequest, Stage: varSelectedRequest.'Current Phase' }))
)
```
Any button then does:
```powerfx
Set(varNewStatus, 'TVR Status'.'More Info Required');
Set(varRemarks, txtReviewComment.Text);
Select(btnDoStatusChange)
```
Flow **F02** sees the status change and sends the right email.

## 8. Screen 3 – Request Detail (`scrRequestDetail`)

Top: TVID, Title, Status pill, Phase **progress bar** (6 chevrons; current phase highlighted).
Tabs (use a horizontal gallery of tab names + `varTab`):

| Tab | Content | Edit allowed for |
|---|---|---|
| Summary | Display form of the request | Requester (only in Draft / More Info Required) |
| Comments | Gallery of Request Comments + add box | Everyone with access |
| Documents | Gallery of Request Documents (click opens SharePoint link) + upload | Requester, APPG |
| Feasibility | Options gallery (read-only for requester) | APPG |
| Funding | Funding Approvals history | APPG (send), CCO (read) |
| Execution | Milestones, Risks/Issues, Costs | APPG |
| Closure | Final outcome, lessons learned, reuse | APPG |
| History | Status Histories, newest first | read only |

Action buttons (visible by role and status):

| Button | Visible when | Sets status to |
|---|---|---|
| Start Review | `IsAPPG && 'Request Status' = Submitted` | Under APPG Review (and APPG Owner = me) |
| Request More Info | `IsAPPG && 'Request Status' = Under APPG Review` | More Info Required (comment mandatory) |
| Reject | `IsAPPG && 'Request Status' in [Under APPG Review, Internal Alignment 1]` | Rejected (reason mandatory) |
| Resubmit | `Requester = me && 'Request Status' = More Info Required` | Under APPG Review |
| Move to Internal Alignment | `IsAPPG && 'Request Status' = Under APPG Review` | Internal Alignment 1 |
| Confirm Option (Alignment 2) | `IsAPPG && 'Request Status' = Internal Alignment 1 && an option is selected` | Internal Alignment 2 |
| Send for Funding Approval | `IsAPPG && 'Request Status' = Internal Alignment 2` | Pending Funding Approval (flow F04 starts) |
| Start Execution | `IsAPPG && 'Request Status' = Funding Approved` | In Execution |
| Put On Hold / Resume | `IsAPPG` | On Hold / In Execution |
| Complete Execution | `IsAPPG && 'Request Status' = In Execution` | Execution Completed |
| Close Request | `IsAPPG && 'Request Status' = Execution Completed && Final Report uploaded` | Closed (flow F07) |
| Cancel | `(Requester = me && 'Request Status' in [Draft, Submitted, More Info Required]) \|\| IsAPPG` | Cancelled |
| Export to PDF | everyone | calls flow F06 |

Example "Reject" with mandatory reason:
```powerfx
// btnReject.OnSelect
If(IsBlank(txtReviewComment.Text),
    Notify("Please enter the rejection reason.", NotificationType.Error),
    Patch('TV Requests', varSelectedRequest, { 'Rejection / Cancellation Reason': txtReviewComment.Text });
    Set(varNewStatus, 'TVR Status'.Rejected);
    Set(varRemarks, "Rejected: " & txtReviewComment.Text);
    Select(btnDoStatusChange)
)
```

Requester can see "Required By" in red if late:
```powerfx
lblRequiredBy.Color = If(varSelectedRequest.'Required By Date' < Today() && varSelectedRequest.'Request Status' <> 'TVR Status'.Closed, Color.Red, Color.Black)
```

## 9. Screen 4 – APPG Queue (`scrAPPGQueue`)

```powerfx
// galQueue.Items
SortByColumns(
    Filter('TV Requests',
        'Request Status' in ['TVR Status'.Submitted, 'TVR Status'.'Under APPG Review', 'TVR Status'.'Internal Alignment 1',
                   'TVR Status'.'Internal Alignment 2', 'TVR Status'.'Funding Approved', 'TVR Status'.'In Execution',
                   'TVR Status'.'Execution Completed'],
        chkMyItems.Value = false || 'APPG Owner'.'Primary Email' = User().Email),
    "tvr_statuschangedon", SortOrder.Ascending)   // oldest waiting first
```
Show "Days waiting": `RoundDown(DateDiff(ThisItem.'Status Changed On', Now(), TimeUnit.Hours) / 24, 0)`.

Assign owner: combo box `cmbAPPGOwner` (Items = Users filtered by APPG team) →
`Patch('TV Requests', varSelectedRequest, { 'APPG Owner': cmbAPPGOwner.Selected })`.

## 10. Screen 5 – Feasibility (`scrFeasibility`)

Gallery of options for the request + "Add Option" form.

```powerfx
// galOptions.Items
Filter('Feasibility Options', 'TV Request'.'TV Request' = varSelectedRequest.'TV Request')

// "Select this option" button inside gallery
ForAll(Filter('Feasibility Options', 'TV Request'.'TV Request' = varSelectedRequest.'TV Request') As o,
    Patch('Feasibility Options', o, { 'Is Selected': false }));
Patch('Feasibility Options', ThisItem, { 'Is Selected': true, Recommendation: 'Recommendation (Feasibility Options)'.Recommended });
Set(varSelectedRequest, Patch('TV Requests', varSelectedRequest, { 'Selected Option': ThisItem, 'Estimated Budget': ThisItem.'Quoted Cost' }))
```
(Here `'TV Request'` inside `'TV Request'.'TV Request'` is the GUID primary key column of the table.)

Sample comparison shown to APPG:

| Option | Institution | Capability | Cost | Weeks | Constraint | Recommendation |
|---|---|---|---|---|---|---|
| A | Stanford Nanofab Lab | 5 | 39,500 | 10 | Lab free from Nov | ✅ Recommended |
| B | Fraunhofer IPMS | 4 | 35,000 | 16 | Shipping to Germany | Alternative |
| C | Internal Lab Fremont | 3 | 22,000 | 20 | Tool booked till Jan | Not recommended |

A small column chart (Cost vs Weeks) helps decision. Quotes are uploaded with
F09 into `03-Feasibility & Quotes`.

## 11. Screen 6 – Funding (`scrFunding`)

- Shows Cost Center, its Owner (from master), Selected option cost, approval history gallery.
- **Send for Funding Approval** button: sets status Pending Funding Approval → flow **F04**
  creates the approval for the CCO (in Outlook + Teams + Approvals app).
- CCO can also open the request from the email link and see everything read-only.

```powerfx
// lblCCOwner.Text
varSelectedRequest.'Cost Center'.'Cost Center Owner'.'Full Name'
// galFundingHistory.Items
SortByColumns(Filter('Funding Approvals', 'TV Request'.'TV Request' = varSelectedRequest.'TV Request'), "createdon", SortOrder.Descending)
```

## 12. Screen 7 – Execution (`scrExecution`)

Three sections:
1. **Milestones** – editable gallery (Planned/Actual dates, % complete). Overall progress:
   ```powerfx
   // when a milestone is saved:
   Patch('TV Requests', varSelectedRequest,
     { 'Overall Progress %': Round(Average(Filter('Milestones', 'TV Request'.'TV Request' = varSelectedRequest.'TV Request'), '% Complete'), 0) })
   ```
2. **Risks / Issues / Exceptions** – add & update (severity High → flow F02 sends exception email).
3. **Costs** – add cost entries; show `Actual Total Cost` vs `Approved Amount` and utilization %:
   ```powerfx
   lblUtil.Text = Text(varSelectedRequest.'Actual Total Cost' / varSelectedRequest.'Approved Amount', "0%")
   ```
   Show it in red if > 100%.
Plus "Expected Completion Date" date picker and "Add update / comment" box.

## 13. Screen 8 – Closure (`scrClosure`)

Fields: Final Outcome*, Lessons Learned*, Reuse Recommendation*, Final Report upload*
(goes to `06-Final Report & Closure`), Final cost (read only, rollup).

```powerfx
// btnCloseRequest.OnSelect
If(
    IsBlank(txtOutcome.Text) || IsBlank(txtLessons.Text) || IsBlank(ddReuse.Selected),
        Notify("Outcome, lessons learned and reuse recommendation are mandatory.", NotificationType.Error),
    IsEmpty(Filter('Request Documents', 'TV Request'.'TV Request' = varSelectedRequest.'TV Request',
                   'Document Type' = 'Document Type (Request Documents)'.'Final Report')),
        Notify("Please upload the final report first.", NotificationType.Error),
    Patch('TV Requests', varSelectedRequest,
        { 'Final Outcome': txtOutcome.Text, 'Lessons Learned': txtLessons.Text,
          'Reuse Recommendation': ddReuse.Selected.Value, 'Closed On': Now() });
    Set(varNewStatus, 'TVR Status'.Closed); Set(varRemarks, "Request closed");
    Select(btnDoStatusChange)
)
```

## 14. Export to PDF

`btnExportPdf.OnSelect`:
```powerfx
Set(varPdf, 'F06-GeneratePDF'.Run(varSelectedRequest.TVID));
Launch(varPdf.fileurl)
```
Flow F06 builds the PDF, saves it in SharePoint and returns the link.

## 15. Error handling rules (Validation & Error Handling)

- Every `Patch` wrapped with `IfError(..., Notify(FirstError.Message, NotificationType.Error))`.
- Disable buttons while saving: `btnSubmit.DisplayMode = If(varSaving, DisplayMode.Disabled, DisplayMode.Edit)`.
- Show a spinner when `varSaving = true`.
- Use `App.OnError` to log unexpected errors:
  ```powerfx
  // App.OnError
  Notify("Something went wrong. Please try again or contact support.", NotificationType.Error)
  ```

## 16. Share the app

- Solution → app → **Share** with the Entra groups (`SG-TVRMS-Users`) – **not** individuals.
- Copy the app play URL into the environment variable `tvr_AppUrl` (used in email links).
