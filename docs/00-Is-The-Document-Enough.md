# 00 – Is the PPT document enough to develop the project?

## 1. What kind of document is `ABC_REQUEST.pptx`?

It is a **"Solution Approach" / proposal** made by HCLTech for the customer **LAM**.
It has 10 slides:

| Slide | Title | What it gives us | Detail level |
|---|---|---|---|
| 1 | Cover – LAM TV Request Management System | Project name, date (Sep 2026) | – |
| 2 | Table of Contents | 7 sections | – |
| 3 | Objectives & Scope | Problem, goal, 13 in-scope items, 4 out-of-scope items | **Medium** |
| 4 | Business Process Flow | 6 phases, user journey, key actions, notifications | **Medium** |
| 5 | Solution Architecture | Tools: Canvas app, Model-driven app, Power Automate, Dataverse, SharePoint, Outlook, Power BI | **Medium** |
| 6 | Execution Approach | Plan → Build (2 sprints) → Deploy → Hypercare | High-level |
| 7 | Execution Timeline | 9 weeks plan | High-level |
| 8 | Assumptions & Dependencies | Customer gives master data, licenses, SMEs | High-level |
| 9 | Non-Functional Requirements | 24x7, Edge, SharePoint, 7-year retention, audit, RBAC, scalable | **Medium** |
| 10 | Commercials | Fixed price USD 58,950 (excluding taxes) | Not for developers |

## 2. Final answer

> **The document is enough to START the project, but NOT enough to FINISH building it.**

- ✅ **Enough for:** understanding the goal, choosing the technology, drawing the
  architecture, creating environments, creating a first draft of the data model,
  planning the 9 weeks, and preparing questions for the workshops.
- ❌ **Not enough for:** final form fields, status rules, approval rules, email texts,
  reminder timings, PDF layout, report KPIs, and test cases with real values.

This is **normal**. Slide 6 and 7 clearly say that **Week 1–2 ("Plan for Success")**
is for "Requirement Understanding" and "Solution Blueprint". So your **first job**
is to collect the missing details below and write a **Solution Blueprint**
(also called a design document). In this repository we filled each gap with a
reasonable **(ASSUMPTION)** so you can build a working version now and adjust later.

## 3. What is clear in the document (we can build this directly)

1. 6 phases: Request Initiation → APPG Review → Internal Alignment → Funding Approval → Execution → Closure.
2. Request types: **New, Repeat, One-time, Recurring**.
3. Mandatory fields and **technical document** must be validated on submit.
4. APPG can **review, assign owner, comment, ask for more information, reject**.
5. Feasibility = compare **multiple Research Institutions / sourcing options** on capability, cost, timeline, constraints, recommendation.
6. Two internal alignment steps (1st: quotes/estimates; 2nd: confirm selected option & raise funding request).
7. Funding: find **Cost Center Owner**, route approval, capture decision + comments + history.
8. Execution: milestones, planned & actual dates, progress, risks, costs, comments, expected completion date.
9. Closure: deliverables, outcomes, lessons learned, costs, reuse recommendations.
10. SharePoint: auto-create a **TVID workspace** with fixed folders, versioning, permissions, **7-year retention**.
11. Automation: notifications, reminders, escalations, status updates, **automatic cancellation**, approvals, audit log, PDF generation.
12. Roles: Requester, APPG user, Cost Center Owner, Agreed stakeholders, System admin.
13. Power BI: Request status, cycle time & aging, cost tracking, utilization & performance, exception analysis, executive view.
14. Out of scope: integration with external systems, old data migration, user training, change management.

## 4. Gaps – what is missing (and what we assumed)

| # | Missing item | Why it matters | Our ASSUMPTION in this guide |
|---|---|---|---|
| G1 | Full list of fields on the request form | Needed to build table + screen | We designed ~25 fields (see doc 03) |
| G2 | Meaning of "APPG" | Team name in the process | A central **planning/governance team** that reviews TV requests |
| G3 | Exact status list and allowed moves | Drives the whole workflow | 15 statuses, see doc 03 §4 |
| G4 | Which documents are "mandatory technical documents" | Validation on submit | At least 1 file of type "Technical Specification" |
| G5 | Reminder / escalation / auto-cancel days | Scheduled flows | Reminder after **3** working days, escalation after **5**, auto-cancel after **30** days in "More Info Required" (stored in a Settings table so business can change) |
| G6 | Funding approval rules (one level or many? amount limits?) | Approval flow | One approver = Cost Center Owner. If amount > **USD 50,000**, also the CC Owner's manager (configurable) |
| G7 | How is the Cost Center Owner found? | Routing | From the **Cost Center** master table (Owner column) |
| G8 | Who are "agreed stakeholders"? | Security | Read-only users added per request (Access Team) |
| G9 | SharePoint folder names | Folder creation flow | 01-Request, 02-Technical Documents, 03-Feasibility & Quotes, 04-Funding Approval, 05-Execution, 06-Final Report & Closure |
| G10 | Email templates (subject + text) | Notifications | Templates stored in an **Email Template** table |
| G11 | What goes into the PDF export | PDF flow | Request summary + feasibility + approval + closure |
| G12 | Recurring request rules (how often, auto-create?) | Data + flow | Frequency (Monthly/Quarterly/Yearly) and a "Create next occurrence" button; no auto-creation |
| G13 | Exact KPI definitions in Power BI | Reports | Defined in doc 09 |
| G14 | Number of users, requests per year | Licenses, performance | ~200 users, ~500 requests/year |
| G15 | Master data files (users, departments, cost centers, locations, vendors) | Customer to provide (slide 8) | Sample CSVs in `sample-data/` |
| G16 | Environments and licenses | Dataverse needs **Power Apps Premium** licenses | Dev, Test, Prod environments; premium license for every app user |
| G17 | Who does UAT and sign-off | Slide 8 says business users do UAT | 3–5 key users |
| G18 | Branding / logo / colours | UI design | LAM logo, simple corporate colours |
| G19 | Language, time zone, currency | Data format | English, USD, customer's local time zone |
| G20 | Can a requester cancel their own request? | Status rules | Yes, while status is Draft, Submitted or More Info Required |

## 5. Questions to ask your manager / customer (copy and send)

Copy this list into an email. Ask for answers before the end of Week 1.

```
Subject: LAM TVRMS – Clarification questions for Solution Blueprint

Hi <Manager name>,

I have gone through the LAM TV Request Management System solution approach.
To complete the Solution Blueprint, I need the following details:

A. Process
 1. What does "APPG" stand for, and who are the APPG users (names / group)?
 2. Please share the complete list of request statuses and who can move a request between them.
 3. For "Repeat" requests – should the system copy data from an old TVID?
 4. For "Recurring" requests – what frequencies are allowed, and should the system auto-create the next request?
 5. What is the exact difference between 1st and 2nd Internal Alignment? Who takes part?
 6. How many feasibility options (research institutions / vendors) are normally compared? Is there a scoring method?
 7. Funding approval: single approver or multi-level? Any amount limits?
 8. Can a request be put "On Hold"? Who can cancel a request?

B. Rules / timings
 9. After how many days should reminders be sent? After how many days escalated, and to whom?
10. After how many days of no response should a request be auto-cancelled?
11. Working days only or calendar days?

C. Data and documents
12. Please share the current request template (PPT/Excel) so I can map all fields.
13. Which technical documents are mandatory at submission?
14. Please confirm the SharePoint folder structure for each TVID.
15. Please share master data: users & roles, departments, cost centers + owners, locations, research institutions/vendors.

D. Notifications & reports
16. Please share/approve the email texts for each notification.
17. What should the exported PDF contain?
18. Which KPIs are most important for the Power BI dashboard? Any targets (e.g. cycle time < 30 days)?

E. Technical
19. Which tenant/environments will we use (Dev/Test/Prod)? Who gives access?
20. Are Power Apps Premium and Power BI Pro licenses available for all users?
21. Expected number of users and requests per year?

Thanks,
<Your name>
```

## 6. Recommendation

1. **Do not wait** for all answers. Set up environments and build the data model
   using the assumptions in this guide (they are easy to change).
2. Hold **2–3 workshops** in Week 1 (Process, Data & Documents, Reports).
3. Write the **Solution Blueprint** in Week 2 and get it **signed off** (slide 6 says
   "Report submitted for final approval"). Only then start Sprint 1.
4. Any new idea after sign-off = **Change Request** (slide 10: fixed price, scope changes affect cost and schedule).
