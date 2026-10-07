# 09 – Power BI Dashboard and Reports

Architecture slide – Dashboard and Reporting Layer:
**Request Status / Cycle Time & Aging / Cost Tracking / Utilization & Performance /
Exception Analysis / Executive Reporting.**

## 1. Connect to data

1. Open **Power BI Desktop** → **Get data → Dataverse** → sign in →
   choose environment `LAM-TVRMS-PROD` (use DEV while building).
2. Select tables: `tvr_tvrequest`, `tvr_feasibilityoption`, `tvr_fundingapproval`,
   `tvr_milestone`, `tvr_riskissue`, `tvr_costentry`, `tvr_statushistory`,
   `tvr_department`, `tvr_costcenter`, `tvr_location`, `tvr_researchinstitution`.
3. Mode: **Import** (fast, refresh 4–8 times a day). Use DirectQuery only if live data is a must.
4. In **Power Query**: keep only needed columns; rename them to friendly names;
   replace choice numbers with labels (the Dataverse connector gives `...name` columns for choices).
5. Add a **Date table** (DAX):
   ```DAX
   Date = ADDCOLUMNS(CALENDAR(DATE(2026,1,1), DATE(2030,12,31)),
       "Year", YEAR([Date]), "Month", FORMAT([Date],"MMM yyyy"),
       "MonthNo", YEAR([Date])*100+MONTH([Date]), "Quarter", "Q" & QUARTER([Date]))
   ```
6. **Relationships:** TV Request → Department, Cost Center, Location (many-to-one);
   Feasibility/Funding/Milestone/Risk/Cost/StatusHistory → TV Request (many-to-one);
   Date[Date] → TV Request[Submitted On (date)].

## 2. DAX measures (copy into a "_Measures" table)

```DAX
Total Requests      = COUNTROWS('TV Request')
Open Requests       = CALCULATE([Total Requests],
                        NOT 'TV Request'[Request Status] IN {"Closed","Cancelled","Rejected","Funding Rejected"})
Closed Requests     = CALCULATE([Total Requests], 'TV Request'[Request Status] = "Closed")
Rejected Requests   = CALCULATE([Total Requests], 'TV Request'[Request Status] IN {"Rejected","Funding Rejected"})
Approval Rate %     = DIVIDE(CALCULATE([Total Requests], NOT ISBLANK('TV Request'[Approved Amount])),
                        CALCULATE([Total Requests], 'TV Request'[Request Status] IN
                          {"Funding Approved","Funding Rejected","In Execution","On Hold","Execution Completed","Closed"}))

Avg Cycle Time (days) = AVERAGEX(FILTER('TV Request', NOT ISBLANK('TV Request'[Closed On])),
                          DATEDIFF('TV Request'[Submitted On], 'TV Request'[Closed On], DAY))

Age (days)          = DATEDIFF(MAX('TV Request'[Submitted On]), TODAY(), DAY)   -- use in table visual per request

Days In Current Status = DATEDIFF(MAX('TV Request'[Status Changed On]), NOW(), DAY)

Approved Budget     = SUM('TV Request'[Approved Amount])
Actual Cost         = SUM('Cost Entry'[Amount])
Cost Variance       = [Approved Budget] - [Actual Cost]
Budget Utilization %= DIVIDE([Actual Cost], [Approved Budget])

On-Time Completion %= DIVIDE(
                        CALCULATE([Closed Requests], FILTER('TV Request', 'TV Request'[Closed On] <= 'TV Request'[Required By Date])),
                        [Closed Requests])

Open Issues         = CALCULATE(COUNTROWS('Risk Issue'), 'Risk Issue'[Status] <> "Resolved")
High Severity Issues= CALCULATE([Open Issues], 'Risk Issue'[Severity] = "High")
Overdue Milestones  = CALCULATE(COUNTROWS('Milestone'),
                        'Milestone'[Planned End] < TODAY(), 'Milestone'[Status] <> "Completed")
```

**Aging bucket** (calculated column on TV Request):
```DAX
Aging Bucket =
VAR d = DATEDIFF('TV Request'[Submitted On], IF(ISBLANK('TV Request'[Closed On]), TODAY(), 'TV Request'[Closed On]), DAY)
RETURN SWITCH(TRUE(), d <= 15, "0-15 days", d <= 30, "16-30 days", d <= 60, "31-60 days", "60+ days")
```

**Time spent in each phase** (from Status History) – calculated column on Status History:
```DAX
Hours In Status =
VAR thisReq = 'Status History'[TV Request]
VAR thisTime = 'Status History'[Changed On]
VAR nextTime = CALCULATE(MIN('Status History'[Changed On]),
                 FILTER(ALL('Status History'), 'Status History'[TV Request] = thisReq && 'Status History'[Changed On] > thisTime))
RETURN DATEDIFF(thisTime, IF(ISBLANK(nextTime), NOW(), nextTime), HOUR)
```
Then average of `Hours In Status` by `To Status` = bottleneck chart.

## 3. Report pages

| Page | Visuals | Answers the question |
|---|---|---|
| **1. Executive Summary** | KPI cards (Total, Open, Closed, Avg Cycle Time, Approved Budget, Utilization %), requests by month (column), status funnel | "How are we doing overall?" |
| **2. Request Status** | Bar by status, donut by phase, table of open requests with TVID / owner / days in status, slicers (Department, Request Type, Priority, Date) | "Where is every request now?" |
| **3. Cycle Time & Aging** | Aging bucket bar, avg cycle time by department, hours in each status (bottleneck), on-time % | "Where do we lose time?" |
| **4. Cost Tracking** | Approved vs Actual by request (clustered bar), cost by category (pie), by cost center (matrix), variance | "Are we within budget?" |
| **5. Utilization & Performance** | Requests per research institution, avg quoted cost & weeks per institution, budget utilization %, reuse recommendation counts | "Which institutions perform best?" |
| **6. Exception Analysis** | Open issues by severity, overdue milestones list, auto-cancelled & rejected requests with reasons, failed notifications | "What is going wrong?" |

## 4. Sample numbers (for testing visuals with sample data)

| KPI | Expected with `/sample-data` |
|---|---|
| Total Requests | 8 |
| Open Requests | 5 |
| Closed Requests | 1 |
| Rejected / Cancelled | 2 |
| Approved Budget | 39,500 + 28,000 + 15,000 = 82,500 |

## 5. Security in Power BI

- Dataverse connector **respects Dataverse security of the person who refreshes**.
  With Import mode the service account refreshes → everyone sees everything in the report.
  So: share the **Executive** report only with APPG + management (`SG-TVRMS-APPG`, leadership group).
- If requesters need a "My requests" report, add **Row-Level Security**: role "Requester"
  with filter on TV Request: `[Requester Email] = USERPRINCIPALNAME()`.

## 6. Publish

1. Publish to workspace **`LAM TVRMS`** (Power BI service).
2. Dataset settings → credentials (OAuth, service account) → **Scheduled refresh** 4× per day.
3. Create an **App** in the workspace and share with the right groups.
4. (Optional) Embed the report in the Canvas app with the *Power BI tile* control,
   or add it as a dashboard page in the Model-Driven app.
