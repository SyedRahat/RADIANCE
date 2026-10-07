# 07 – Model-Driven App (for Admin users)

Architecture slide: Model Driven App (Admin users) → **Master Data management**
and **View Notification Logs**.

## 1. Create the app

1. Solution TVRMS → **New → App → Model-driven app**.
2. Name: **`TVRMS Administration`**.
3. Add a **navigation (sitemap)** with these areas and groups:

| Area | Group | Pages (tables) |
|---|---|---|
| Requests | Requests | TV Requests (all views), Feasibility Options, Funding Approvals |
| Requests | Execution | Milestones, Risk Issues, Cost Entries |
| Master Data | Organisation | Departments, Cost Centers, Locations |
| Master Data | Partners | Research Institutions |
| Configuration | Settings | App Settings, Email Templates, Status Transitions (optional) |
| Monitoring | Logs | Notification Logs, Error Logs, Status Histories |
| Monitoring | Audit | Audit Summary (link to Dataverse audit history) |

4. **Share** the app only with the `TVRMS Admins` team / role `TVR Admin`.

## 2. Views to create (sample)

| Table | View name | Filter | Columns |
|---|---|---|---|
| TV Requests | Active Requests | Status not in (Closed, Cancelled, Rejected, Funding Rejected) | TVID, Title, Requester, Status, Phase, Status Changed On, Required By |
| TV Requests | Overdue Requests | Required By < Today AND Status not Closed | TVID, Title, Requester, Required By, APPG Owner |
| Cost Centers | Active Cost Centers | Is Active = Yes | Code, Name, Owner, Owner's Manager |
| Notification Logs | Failed Notifications | Result = Failed | Subject, Sent To, Sent On, Error |
| Error Logs | Open Errors | Status = New | Flow Name, TVID, Error, Run URL |

## 3. Forms

- **Cost Center main form**: Code, Name, Owner, Owner's Manager, Department, Is Active.
  Business rule: Owner is required.
- **App Setting form**: Key (read-only after create), Value, Description.
- **Email Template form**: Code, Subject, Body (use the rich text control), Is Active.
- **TV Request main form** (admin view): all fields in tabs + sub-grids for each child
  table + **Audit History** tab (built in).

## 4. Typical admin tasks (use cases)

| Use case | Steps | Sample |
|---|---|---|
| New cost center created by Finance | Master Data → Cost Centers → New → fill → Save | CC-4300 "Deposition R&D", Owner = Kevin Brown |
| Cost center owner changes | Open CC-4100 → change Owner → Save. New funding requests go to new owner | Maria Lopez → Anna White |
| Change reminder days | Configuration → App Settings → ReminderAfterDays → 2 → Save | No code change needed |
| Email failed | Monitoring → Failed Notifications → check error → fix email address → re-run from flow history | "Mailbox not found" |
| See who changed a request | Open request → Related → Audit History | Status changed by David Chen on 13-Oct |
| Deactivate a vendor | Research Institution → Is Active = No | "Old Lab Inc." |

> Do not delete master data – set **Is Active = No**. Dropdowns in the Canvas app
> filter on `Is Active = true`, for example:
> `cmbCostCenter.Items = Filter('Cost Centers', 'Is Active' = true)`.
