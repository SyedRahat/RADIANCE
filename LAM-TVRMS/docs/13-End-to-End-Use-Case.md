# 13 – End-to-End Use Case (one request from start to finish)

**Story:** Priya Sharma, a process engineer in Fremont, needs a plasma etch uniformity
test because customer X reported 4% non-uniformity. Let us follow her request
**TV-2026-00015** through all 6 phases and see what the system does at each step.

## Phase 1 – Request Initiation (12-Oct-2026)

**Priya** opens the app → **New Request**:

| Field | Value |
|---|---|
| Title | Plasma etch uniformity test on 300mm wafers |
| Request Type | New |
| Department | Process Engineering |
| Location | Fremont, CA |
| Cost Center | CC-4100 Etch R&D |
| Priority | High |
| Required By | 15-Dec-2026 |
| Estimated Budget | USD 42,000 |
| Business Justification | Customer X reports 4% within-wafer non-uniformity on 3nm etch. Need to qualify new recipe. |
| Technical Description | 25 wafers, 3 recipes, CD-SEM measurement at 49 points per wafer. |
| Expected Outcome | Uniformity below 2% |
| Attachment | Etch_Test_Spec_v1.pdf |

She clicks **Submit**.

**System does:**
1. App validates fields + attachment ✅ → saves the record → TVID **TV-2026-00015**.
2. F09 uploads the PDF to `TV Requests/TV-2026-00015/02-Technical Documents`.
3. Status → **Submitted**; history row "Draft → Submitted".
4. F01 creates the 6 folders, saves the folder URL, emails Priya (**acknowledgement**)
   and the APPG mailbox (**new request**).

## Phase 2 – APPG Review (13–16 Oct)

- **13-Oct, David (APPG)** opens the APPG Queue → TV-2026-00015 → **Start Review**,
  APPG Owner = David. → Status **Under APPG Review**; Priya gets "review started" email.
- David notices the wafer map is missing → comment *"Please attach the wafer map for the 25 wafers."*
  → **Request More Info**. → Status **More Info Required**; Priya gets email with the comment.
- **15-Oct, Priya** uploads `Wafer_Map.xlsx`, writes *"Wafer map attached."* → **Resubmit**.
  → Status **Under APPG Review**; David is notified.
  *(If Priya had not answered: reminder on day 3, escalation to her manager on day 5,
  auto-cancel on day 30 – flow F05.)*
- **16-Oct, David** is satisfied → **Move to Internal Alignment**.

## Phase 3 – Internal Alignment (17 Oct – 31 Oct)

**1st Internal Alignment** – David asks 3 institutions for quotes and enters options:

| Option | Institution | Capability | Quote (USD) | Weeks | Constraint |
|---|---|---|---|---|---|
| A | Stanford Nanofab Lab | 5 | 39,500 | 10 | Lab free from Nov |
| B | Fraunhofer IPMS | 4 | 35,000 | 16 | Shipping to Germany |
| C | Internal Lab Fremont | 3 | 22,000 | 20 | Tool booked till Jan |

Quotes uploaded to `03-Feasibility & Quotes`. Requester gets an **alignment update** email.

**2nd Internal Alignment** – meeting with Priya and program manager Tom:
Option **A** chosen because only it meets the 15-Dec date. David clicks **Select this option**
→ **Confirm Option** (status Internal Alignment 2), adds Tom as stakeholder, then
**Send for Funding Approval**.

## Phase 4 – Funding Approval (2–3 Nov)

**F04** runs:
1. Cost center CC-4100 → owner **Maria Lopez**.
2. Amount 39,500 ≤ limit 50,000 → only one approval level.
3. Maria is added to the request's access team (can now view it).
4. Funding Approval row created (Pending). Approval appears in Maria's Outlook / Teams.

**3-Nov, Maria** clicks **Approve**, comment *"Approved from Q4 budget."*

→ Funding Approval row = Approved; Request **Funding Approved**, Approved Amount 39,500;
Priya and David get **funding approved** email.

*(If Maria had rejected with "No budget this quarter" → status Funding Rejected, Priya gets
the reason; request ends.)*

## Phase 5 – Execution (10 Nov – 28 Feb)

David clicks **Start Execution** → status **In Execution**. He adds milestones:

| # | Milestone | Planned | Actual | % |
|---|---|---|---|---|
| 1 | Wafer preparation | 10–24 Nov | 12–26 Nov | 100 |
| 2 | Etch runs (3 recipes) | 25 Nov–15 Dec | 27 Nov–20 Dec | 100 |
| 3 | CD-SEM measurement | 16 Dec–20 Jan | 21 Dec–25 Jan | 100 |
| 4 | Final report | 21 Jan–15 Feb | 26 Jan–20 Feb | 100 |

- **5-Dec:** issue "Lab tool down for maintenance", severity High → **exception email** to
  David and Priya. Mitigation: move run to 2nd tool → Resolved 9-Dec.
- Costs entered: Lab fee 18,000 (Nov) + Lab fee 12,000 (Dec) + Materials 5,300 + Shipping 2,500
  = **37,800** → Utilization **96%** of 39,500.
- Expected completion updated to 28-Feb. Status updates emailed to Priya and Tom.
- 28-Feb: David clicks **Complete Execution** → status Execution Completed.

## Phase 6 – Closure (5 Mar 2027)

David uploads `Final_Report.pdf` to `06-Final Report & Closure` and fills:

| Field | Value |
|---|---|
| Final Outcome | Recipe B improved uniformity to 1.6% (target < 2%) ✅ |
| Lessons Learned | Book external lab 6 weeks early; keep backup tool option. |
| Reuse Recommendation | Reuse with changes |

Clicks **Close Request** → status **Closed**, Closed On 5-Mar-2027.

**F07:** builds summary PDF (`TV-2026-00015_Summary_20270305.pdf`) into SharePoint, and emails
Priya, David, Maria and Tom: **"TV-2026-00015 completed – final report available"** with links.

## What management sees in Power BI

- Cycle time for TV-2026-00015 = 12-Oct-2026 → 5-Mar-2027 = **144 days**.
- Cost: approved 39,500, actual 37,800, variance +1,700.
- Bottleneck: most time spent in *In Execution* (expected), 2 days lost in *More Info Required*.
- Stanford Nanofab: 1 request, 100% on budget.

## Full audit trail (Status History for TV-2026-00015)

| When | From → To | By |
|---|---|---|
| 12-Oct 10:05 | Draft → Submitted | Priya |
| 13-Oct 09:12 | Submitted → Under APPG Review | David |
| 13-Oct 09:40 | Under APPG Review → More Info Required | David |
| 15-Oct 14:20 | More Info Required → Under APPG Review | Priya |
| 16-Oct 11:00 | Under APPG Review → Internal Alignment 1 | David |
| 31-Oct 16:30 | Internal Alignment 1 → Internal Alignment 2 | David |
| 02-Nov 09:00 | Internal Alignment 2 → Pending Funding Approval | David |
| 03-Nov 15:45 | Pending Funding Approval → Funding Approved | Maria (via flow) |
| 10-Nov 08:30 | Funding Approved → In Execution | David |
| 28-Feb 17:00 | In Execution → Execution Completed | David |
| 05-Mar 10:10 | Execution Completed → Closed | David |
