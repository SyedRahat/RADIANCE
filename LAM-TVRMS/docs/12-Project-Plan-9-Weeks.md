# 12 – Project Plan (9 weeks, from slide "Execution Timeline")

| Week | Phase (slide) | Main work | Output |
|---|---|---|---|
| W1 | Plan for Success | Kick-off; workshops (process, data & documents, reports); send question list (doc 00); get access & licenses; create environments | Workshop notes, answers |
| W2 | Plan for Success | Write **Solution Blueprint** (data model, statuses, screens, flows, emails, KPIs, security); validate plan; submit for approval | **Deliverable: Solution Report (signed-off)** |
| W3 | Sprint 1 | Dataverse tables, choices, relationships, security roles; master data import; SharePoint site; Canvas app shell + Home + New Request wizard; F09 upload; F01 submit | Request intake working |
| W4 | Sprint 1 | Request Detail, APPG Queue, review actions (more info / reject / assign), comments, documents; F02 notifications; email templates; **Sprint 1 demo** | Demo 1 to business |
| W5 | Sprint 2 | Feasibility screen, Internal Alignment 1 & 2, Funding screen, F04 approval routing, access team; Execution screen (milestones, risks, costs) | Full process until execution |
| W6 | Sprint 2 | Closure, F06 PDF, F07 completion, F05 reminders/escalations/auto-cancel, F08 error handling, Model-driven admin app, Power BI report; system test; **UAT starts**; **Sprint 2 demo** | UAT build |
| W7 | Deploy | UAT fixes, UAT sign-off, PROD setup, **Go-Live** ⭐ | **Deliverable: Signed-off Power Platform Applications** |
| W8 | Hypercare | Post-rollout support, fixes | Issue log |
| W9 | Hypercare | Support, knowledge transfer, handover to BAU team | **Deliverable: Handover to Support** |

## Sprint backlog (user stories with acceptance criteria)

### Sprint 1 (W3–W4)
| ID | User story | Acceptance criteria | Points |
|---|---|---|---|
| US-01 | As an admin I want master data tables so that forms have dropdowns | Departments, CC, Locations, RIs created + imported | 3 |
| US-02 | As a requester I want to create a TV request (New/Repeat/One-time/Recurring) | Wizard with 3 steps; Repeat copies data; TVID auto-generated | 8 |
| US-03 | As a requester I want the system to check mandatory fields & technical document | TC-01..03, TC-06 pass | 3 |
| US-04 | As a requester I want to upload documents | Files go to TVID folder; metadata row created | 5 |
| US-05 | As the business I want a TVID workspace created automatically | 6 folders on submit | 3 |
| US-06 | As a requester I want an acknowledgement email | Email within 2 min with link | 2 |
| US-07 | As APPG I want a queue of requests and to assign an owner | Queue sorted by waiting days | 5 |
| US-08 | As APPG I want to request more information / reject with comments | Status + email + history | 5 |
| US-09 | As a requester I want to see my requests and status | Home screen counters + list | 3 |
| US-10 | As the business I want role-based access | TC-27 passes | 5 |

### Sprint 2 (W5–W6)
| ID | User story | Acceptance criteria | Points |
|---|---|---|---|
| US-11 | As APPG I want to compare feasibility options | Add/compare/select options | 5 |
| US-12 | As APPG I want to run internal alignment 1 and 2 | Status moves; alignment emails | 3 |
| US-13 | As APPG I want funding approval routed to the CCO | TC-16..18 pass | 8 |
| US-14 | As APPG I want to track milestones, risks, costs | TC-19..21 pass | 8 |
| US-15 | As APPG I want to close a request with outcome & lessons learned | TC-22..23 pass | 5 |
| US-16 | As the business I want reminders, escalations, auto-cancel | TC-24..26 pass | 5 |
| US-17 | As a user I want to export a request to PDF | TC-29 passes | 3 |
| US-18 | As an admin I want an admin app for master data and logs | Model-driven app with views | 3 |
| US-19 | As management I want a Power BI dashboard | 6 pages, numbers match | 8 |
| US-20 | As support I want failed flows logged | Error Log + email | 2 |

## Team (ASSUMPTION – typical for this size)
| Role | Allocation |
|---|---|
| Project Manager / Business Analyst | 50% |
| Power Platform Developer (Apps + Flows) | 100% |
| Power Platform Developer / Power BI | 100% (W3–W7) |
| QA / Tester | 50% (W4–W7) |

## Risks to watch
| Risk | Impact | Action |
|---|---|---|
| Late master data from LAM | Can't test properly | Use sample data; ask in W1 |
| Licenses not ready | Blocks build/testing | Raise on Day 1 (slide 8 dependency) |
| Requirements change after blueprint | Delay, cost | Change request process |
| SMEs not available for workshops / UAT | Delay | Book calendars in W1 |
