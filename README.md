# RADIANCE – LAM TV (Test Vehicle) Request Management System

This repository has a **complete A to Z guide** for building the
**"LAM – TV Request Management System" (TVRMS)**.

The only input given by the manager was the PowerPoint file **`ABC_REQUEST.pptx`**
(HCLTech's solution approach, September 2026).
Everything here is based on that file. Where the file does not give a detail,
we made a **sensible assumption**. Every assumption is marked with **(ASSUMPTION)**
so that you can confirm it with your manager.

---

## 1. What is this project? (in one paragraph)

Today, LAM manages **Test Vehicle (TV) requests** with emails, PowerPoint files,
Excel sheets and loose documents. Nobody can see the full picture in one place.
We will build **one central system** on **Microsoft Power Platform** where a
request is **created → reviewed → assessed (feasibility) → funded → executed → closed**,
with all documents stored in **SharePoint**, all emails sent automatically by
**Power Automate**, and management reports in **Power BI**.

## 2. Technology used (from slide "Solution Architecture")

| Layer | Tool | What it does |
|---|---|---|
| Login / Security | Microsoft Entra ID | Users sign in with their company account |
| UI for end users | Power Apps **Canvas App** | Request intake, review, feasibility, funding, execution, closure |
| UI for admins | Power Apps **Model-Driven App** | Master data, notification logs, audit |
| Automation | **Power Automate** | Emails, approvals, reminders, folder creation, PDF |
| Data | **Dataverse** | All request data, security roles, audit |
| Documents | **SharePoint Online** document library | One folder (workspace) per TVID |
| Emails | **Outlook (Office 365)** | All notifications |
| Reports | **Power BI** | Status, cycle time, aging, cost, utilization |

## 3. How to read this guide (follow in order)

| # | File | What you will learn |
|---|---|---|
| 0 | [docs/00-Is-The-Document-Enough.md](docs/00-Is-The-Document-Enough.md) | **Is the PPT enough?** Gaps + list of questions to ask your manager |
| 1 | [docs/01-Project-Understanding.md](docs/01-Project-Understanding.md) | Slide-by-slide explanation, roles, glossary, 6 phases |
| 2 | [docs/02-Environment-Setup.md](docs/02-Environment-Setup.md) | Licenses, environments, solution, publisher, SharePoint site |
| 3 | [docs/03-Dataverse-Data-Model.md](docs/03-Dataverse-Data-Model.md) | All tables, columns, choices, relationships, with sample data |
| 4 | [docs/04-SharePoint-Document-Management.md](docs/04-SharePoint-Document-Management.md) | TVID workspace, folders, versioning, permissions, 7-year retention |
| 5 | [docs/05-Security-Roles.md](docs/05-Security-Roles.md) | Role-based access, row-level security |
| 6 | [docs/06-Canvas-App.md](docs/06-Canvas-App.md) | Every screen, with Power Fx formulas |
| 7 | [docs/07-Model-Driven-App.md](docs/07-Model-Driven-App.md) | Admin app for master data and logs |
| 8 | [docs/08-Power-Automate-Flows.md](docs/08-Power-Automate-Flows.md) | All flows step by step (notifications, approvals, reminders, PDF) |
| 9 | [docs/09-Power-BI-Reports.md](docs/09-Power-BI-Reports.md) | Dashboard pages and DAX measures |
| 10 | [docs/10-Testing-and-UAT.md](docs/10-Testing-and-UAT.md) | Test cases with sample data |
| 11 | [docs/11-Deployment-GoLive-Hypercare.md](docs/11-Deployment-GoLive-Hypercare.md) | Moving Dev → Test → Prod, go-live checklist, hypercare |
| 12 | [docs/12-Project-Plan-9-Weeks.md](docs/12-Project-Plan-9-Weeks.md) | Week-by-week plan, sprint backlog |
| 13 | [docs/13-End-to-End-Use-Case.md](docs/13-End-to-End-Use-Case.md) | One full request story from start to end (with sample data) |
| – | [sample-data/](sample-data/) | Ready CSV files to import into Dataverse for testing |

## 4. Quick answer: "Is this document enough to develop the project?"

**Short answer: No, not fully.** The PPT is a **proposal / solution approach**
(what will be built, the timeline and the price). It is **good enough to start the
"Plan for Success" phase (Week 1–2)** and to set up the platform, but it is
**not a detailed requirement document**. Field lists, status rules, reminder days,
approval rules, email texts, report KPIs and master data are missing.
These are exactly the things the PPT says will be finalised in Week 1–2
("Solution Blueprint"). See [docs/00-Is-The-Document-Enough.md](docs/00-Is-The-Document-Enough.md)
for the full gap list and the questions to ask.

## 5. PDF version (for reading, printing or sending)

Every `.md` and `.csv` file in this repository is also available as a PDF in the `pdf/` folder:

| What | Where |
|---|---|
| **Everything in one PDF** (cover, contents, all guides, all sample data, clickable links and bookmarks) | `pdf/LAM-TVRMS-Complete-Guide.pdf` |
| One PDF per guide | `pdf/README.pdf` and `pdf/docs/00-...pdf` to `pdf/docs/13-...pdf` |
| One PDF per sample data file (landscape) | `pdf/sample-data/*.pdf` |

If you change any `.md` or `.csv` file, create the PDFs again with `tools/pdf-export/make-pdfs.sh`
(it needs Node.js, pandoc, Python with pypdf and a Chromium browser – see the comments at the top of the script).
