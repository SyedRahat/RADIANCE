# 11 – Deployment, Go-Live and Hypercare

Slide 6: Deployment = *key stakeholders approve & sign off, Go-Live preparation, Go-Live*.
Hypercare = *post rollout support, handover to application support team*.
Deliverables: **Signed-off Power Platform Applications** and **Handover to Support**.

## 1. ALM – how the solution moves

```
DEV (unmanaged solution)  ──export managed──►  TEST (managed)  ──same file──►  PROD (managed)
        │
        └── export unmanaged + unpack ──► this Git repository (folder /solution)
```

**Never** build directly in TEST or PROD.

### Option A – Power Platform Pipelines (easiest, built-in)
1. Admin installs **Power Platform Pipelines** in a host environment.
2. Create pipeline `TVRMS Pipeline`: Stage 1 = TEST, Stage 2 = PROD (source = DEV).
3. In DEV: Solutions → TVRMS → **Pipelines → Deploy here**. Fill environment variable
   values for the target and select connections. Approvals can be required for PROD.

### Option B – Manual export/import
1. DEV → Solutions → TVRMS → **Publish all customizations**.
2. Increase version, e.g. `1.0.0.5` → `1.0.1.0`.
3. **Export → Managed** → you get `TVRMS_1_0_1_0_managed.zip`.
4. TEST → Solutions → **Import** → choose zip → set connection references (service account
   connections) and environment variable values (TEST SharePoint URL, etc.) → Import.
5. After testing the **same zip** goes to PROD.

### Keep the source in Git (this repository)
```bash
# one-time
pac auth create --environment https://lam-tvrms-dev.crm.dynamics.com
# every time you finish a feature
pac solution export --name TVRMS --path ./out/TVRMS.zip --managed false
pac solution unpack --zipfile ./out/TVRMS.zip --folder ./solution --packagetype Unmanaged
git add solution && git commit -m "TVRMS 1.0.1.0 - funding approval flow" && git push
```

## 2. What is NOT inside the solution (do separately in each environment)

| Item | How |
|---|---|
| Master data (departments, cost centers, ...) | Import CSV from LAM (slide 8: customer provides) |
| App Settings + Email Templates rows | Import `sample-data/app_settings.csv` and `email_templates.csv` (or Configuration Migration tool) |
| SharePoint site, library, columns, versioning, retention label | Create manually (doc 04) or PnP script |
| Entra ID groups & Dataverse group teams | IT + admin center (doc 05) |
| Auditing settings | Admin center (doc 02) |
| Power BI report | Publish from Desktop, change data source to PROD |
| Sharing app with groups | Share after import |
| Turning flows ON | Check every flow is **On** after import |

## 3. Go-Live checklist (Week 7)

**1 week before**
- [ ] UAT sign-off received (email saved in project folder)
- [ ] PROD environment, licenses assigned to all users
- [ ] PROD SharePoint site + library + retention label ready
- [ ] Master data from LAM received & validated (no blanks in Cost Center Owner!)
- [ ] Email templates approved by business
- [ ] Go-live communication drafted (by LAM – change management is out of scope)

**Go-live day**
- [ ] Import managed solution to PROD (version noted, e.g. 1.0.2.0)
- [ ] Set environment variables & connections (service account)
- [ ] Load master data, settings, templates
- [ ] Turn on all flows; check owners = service account
- [ ] Share Canvas app (users) and Model-driven app (admins)
- [ ] Publish Power BI, set refresh, share app
- [ ] **Smoke test** in PROD: create 1 test request → submit → check folder + email →
      cancel it (mark it "TEST – ignore")
- [ ] Send go-live email with app link

**Rollback plan:** if a critical issue appears, turn off flows, inform users to use email
temporarily, fix in DEV, redeploy. (Managed solutions can be upgraded quickly.)

## 4. Hypercare (Week 8–9, about 2 weeks)

| Activity | Detail |
|---|---|
| Daily check | Flow run history (failed runs), Error Log, Failed Notifications view |
| Daily 15-min call | With APPG lead: issues, questions |
| Issue log | Same format as UAT defects |
| Quick fixes | Fix in DEV → TEST → PROD (small releases) |
| Usage check | How many requests submitted; any stuck requests |

## 5. Handover to the Application Support Team (BAU)

Give them a **handover pack**:
1. This repository (all docs + exported solution).
2. Architecture diagram and data model (docs 03).
3. List of flows with purpose, trigger, owner (doc 08).
4. Security roles & how to add users (doc 05) – "add person to Entra group X".
5. **Runbook** – common support tasks:

| Problem | Fix |
|---|---|
| User cannot open app | Check license + member of `SG-TVRMS-Users` |
| User cannot see a request | Check role / access team / ownership |
| Email not received | Model-driven app → Failed Notifications → error; check flow run |
| Folder not created | Error Log → resubmit F01 run |
| CCO left the company | Admin app → Cost Center → change owner; reassign pending approval (cancel approval & re-send) |
| Change reminder days | App Settings table |
| Flow connection expired | Fix connection of service account; all flows use connection references |

6. Credentials ownership: service account managed by LAM IT (never a personal account).
7. Knowledge transfer session (1–2 hours, recorded).
