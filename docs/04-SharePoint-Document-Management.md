# 04 – SharePoint Document Management

Scope slide says: *"SharePoint Document Management with an automatically created
TVID workspace, predefined folder structure, versioning, permissions, and
seven-year retention."*

## 1. Structure

```
Site:    https://lam.sharepoint.com/sites/TVRMS
Library: TV Requests
 └── TV-2026-00015                      ← created automatically on submit (the "TVID workspace")
      ├── 01-Request                    ← request summary PDF
      ├── 02-Technical Documents        ← mandatory spec, drawings
      ├── 03-Feasibility & Quotes       ← quotes from research institutions
      ├── 04-Funding Approval           ← approval evidence PDF
      ├── 05-Execution                  ← progress reports, data
      └── 06-Final Report & Closure     ← final report, closure PDF
```
(ASSUMPTION: folder names – confirm with business.)

## 2. Library settings (do once per environment)

1. **Versioning:** Library → Settings → *Versioning settings* →
   "Create major versions" ✅, keep e.g. **50** versions. "Require check out" ❌.
2. **Metadata columns** on the library (helps search and retention):
   - `TVID` (Single line text)
   - `DocumentType` (Choice: Technical Specification, Supporting Document, Quote, Approval Evidence, Progress Report, Final Report)
   - `Phase` (Choice)
3. **Permissions:**
   - Stop inheriting from the site.
   - `SG-TVRMS-Admins` → Full Control
   - Service account `svc-tvrms` → Full Control (used by flows)
   - `SG-TVRMS-APPG` → Contribute
   - `SG-TVRMS-Users` → **Read** at library level (ASSUMPTION: simple model).
   - If business wants requesters to see **only their own folders**, the flow
     breaks inheritance on each TVID folder and grants Edit to requester + APPG
     (see flow F01 step 6). This is stricter but more work; decide in workshop.
4. **Users upload through the app**, not directly in SharePoint (keeps metadata correct).

## 3. Seven-year retention

Ask the **Microsoft 365 compliance admin** (Microsoft Purview):
1. Purview portal → **Data lifecycle management → Retention labels → Create label**
   - Name: `TVRMS-7-Years`
   - Retain items for **7 years** from **when created** (or *when labelled*),
     then **"Start a disposition review"** (safer than auto-delete).
2. Publish the label → **Auto-apply** or set as **default label** for library `TV Requests`
   (Library settings → *Apply label to items in this list or library*).

For Dataverse records: we **never delete** (Delete = Restrict), and auditing retention = 7 years (doc 02).

## 4. How a file goes from the app to SharePoint (simple pattern)

Canvas apps cannot write directly into SharePoint folders easily. So we use a flow:

```
Canvas App (Attachment control)
   └─► Power Automate flow "F09 - Upload Document" (Power Apps V2 trigger, input = File + TVID + DocType)
         ├─ Create file in /TV Requests/{TVID}/{Folder}
         ├─ Update file properties (TVID, DocumentType, Phase)
         └─ Add row to Dataverse "Request Document" table with file URL
```
Details of the flow are in [08-Power-Automate-Flows.md](08-Power-Automate-Flows.md#f09--upload-document-called-from-the-app).

## 5. Sample: which document goes where

| Document | Uploaded by | Phase | Folder |
|---|---|---|---|
| Etch_Test_Spec_v1.pdf | Requester | Initiation | 02-Technical Documents |
| Wafer_Map.xlsx | Requester | Initiation (after "More info") | 02-Technical Documents |
| Stanford_Quote_Q-1182.pdf | APPG | Internal Alignment 1 | 03-Feasibility & Quotes |
| TV-2026-00015_Funding_Approval.pdf | Flow | Funding Approval | 04-Funding Approval |
| Progress_Report_Dec.pptx | APPG | Execution | 05-Execution |
| Final_Report.pdf | APPG | Closure | 06-Final Report & Closure |
| TV-2026-00015_Summary.pdf | Flow | Closure | 06-Final Report & Closure |
