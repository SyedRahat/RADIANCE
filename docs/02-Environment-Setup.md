# 02 – Environment Setup (do this first)

## Step 1 – Check licenses (slide 8: LAM provides licenses from Day 1)

| Who | License needed | Why |
|---|---|---|
| Every app user (requesters, APPG, CCO, stakeholders) | **Power Apps Premium** (per user) or Per-App | The app uses **Dataverse**, which is a premium connector |
| Every report viewer | **Power BI Pro** (or Premium capacity) | To view shared dashboards |
| Developers | Power Apps Premium + Power BI Pro (or Developer Plan for Dev) | Build and test |
| Flow owner (service account) | Power Automate Premium (or covered by Power Apps license in context of the app) | Flows use Dataverse + SharePoint + Outlook |

> Tip: Use a **service account** (e.g. `svc-tvrms@lam.com`) as owner of all flows
> and connections. Then emails come from one mailbox and flows don't stop if a
> developer leaves.

## Step 2 – Create 3 environments

Go to **https://admin.powerplatform.microsoft.com** → **Environments** → **+ New**.

| Name | Type | Dataverse | Used for |
|---|---|---|---|
| `LAM-TVRMS-DEV` | Sandbox | Yes | Developers build here |
| `LAM-TVRMS-TEST` | Sandbox | Yes | Testing & UAT |
| `LAM-TVRMS-PROD` | Production | Yes | Real users |

Settings for each: Language = English, Currency = USD, Security group = an Entra ID
group like `SG-TVRMS-Users` (so only these people can enter the environment).

## Step 3 – Turn on auditing (NFR: all actions auditable, 7 years)

Power Platform admin center → Environment → **Settings → Audit and logs → Audit settings**:
- ✅ Start auditing
- ✅ Log access
- Retain logs: **Custom → 2555 days** (= 7 years) (ASSUMPTION; confirm with compliance)

## Step 4 – Create a Publisher and a Solution (in DEV)

1. Go to **https://make.powerapps.com** → choose `LAM-TVRMS-DEV`.
2. **Solutions → New solution**.
3. Click **New publisher**:
   - Display name: `LAM TVRMS`
   - Name: `lamtvrms`
   - Prefix: **`tvr`** → every table/column will start with `tvr_` (e.g. `tvr_tvrequest`)
4. Solution name: **`TV Request Management System`**, Name: `TVRMS`, Version `1.0.0.0`.

> **Rule:** Always create everything (tables, apps, flows, roles, env variables)
> **inside this solution**. Never in "Default Solution".

## Step 5 – Create the SharePoint site

1. Go to SharePoint → **Create site → Team site** (or Communication site).
2. Name: **`TV Request Management`** → URL e.g. `https://lam.sharepoint.com/sites/TVRMS`
3. Create a document library: **`TV Requests`** (this holds one folder per TVID).
4. Do one site per environment (ASSUMPTION): `TVRMS-DEV`, `TVRMS-TEST`, `TVRMS` (prod).

Details in [04-SharePoint-Document-Management.md](04-SharePoint-Document-Management.md).

## Step 6 – Create Environment Variables (inside the solution)

Environment variables let the same solution point to different sites in Dev/Test/Prod.

| Display name | Schema name | Type | DEV value (example) |
|---|---|---|---|
| SharePoint Site URL | `tvr_SPSiteUrl` | Text | `https://lam.sharepoint.com/sites/TVRMS-DEV` |
| SharePoint Library | `tvr_SPLibrary` | Text | `TV Requests` |
| App URL | `tvr_AppUrl` | Text | `https://apps.powerapps.com/play/e/.../a/...` |
| APPG Team Email | `tvr_APPGEmail` | Text | `appg-team@lam.com` |
| Admin Email | `tvr_AdminEmail` | Text | `tvrms-admin@lam.com` |

How: Solution → **New → More → Environment variable**.

## Step 7 – Create Connection References

Solution → **New → More → Connection reference**. Create one each:
- `tvr_Dataverse` (Microsoft Dataverse)
- `tvr_SharePoint` (SharePoint)
- `tvr_Outlook` (Office 365 Outlook)
- `tvr_Approvals` (Approvals)
- `tvr_Users` (Office 365 Users)
- `tvr_OneDrive` (OneDrive for Business – used for PDF conversion)

All flows must use these connection references.

## Step 8 – Create Entra ID security groups (ask IT)

| Group | Members (sample) | Linked to |
|---|---|---|
| `SG-TVRMS-Users` | all users | Environment access |
| `SG-TVRMS-Requesters` | engineers | Dataverse team → role "TVR Requester" |
| `SG-TVRMS-APPG` | APPG team | role "TVR APPG Reviewer" |
| `SG-TVRMS-CCOwners` | cost center owners | role "TVR Cost Center Owner" |
| `SG-TVRMS-Admins` | IT admins | role "TVR Admin" |

## Step 9 – Tools on your laptop (optional but useful)

- Microsoft Edge (NFR: must work in Edge)
- **Power BI Desktop** (free, from Microsoft Store)
- **Power Platform CLI** (`pac`) for exporting solutions to source control
- **Visual Studio Code** + "Power Platform Tools" extension
- **Git** – to keep exported solution in this repository (folder `solution/` later)

## Checklist ✅

- [ ] Licenses confirmed
- [ ] DEV / TEST / PROD environments created
- [ ] Auditing on, 7-year retention
- [ ] Publisher `tvr` + solution `TVRMS` created
- [ ] SharePoint site + library created
- [ ] Environment variables + connection references created
- [ ] Security groups created
