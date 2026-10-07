# Sample data (for DEV / TEST only)

Fake data that matches the examples in the docs. Import in this order (lookups need parents first):

1. `departments.csv`
2. `locations.csv`
3. `research_institutions.csv`
4. `cost_centers.csv`
5. `app_settings.csv`
6. `email_templates.csv`
7. `tv_requests.csv`
8. `feasibility_options.csv`
9. `milestones.csv`
10. `cost_entries.csv`

Notes:
- People are given by **email**. These users must exist in the environment (from Entra ID).
  Replace the emails with your real test users before import.
- In `tv_requests.csv` the TVID values are given so the examples line up. In real use the TVID is an
  **autonumber**; when importing, either map TVID to the autonumber column (allowed on import) or let it
  generate new numbers.
- Choice columns (Request Type, Request Status, Priority ...) must use the exact labels you created.
- Expected Power BI numbers with this data: Total 8, Open 5, Closed 1, Rejected/Cancelled 2,
  Approved budget 82,500.
- **Never** load this sample data into PROD.
