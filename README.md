# Security Roles Explorer

A Power Platform ToolBox tool for inspecting and managing Dataverse security roles, table privileges, and role assignments.

More information and the user manual can be found here: [https://robertraaijmakers.github.io/pptb.securityplugin/](https://robertraaijmakers.github.io/pptb.securityplugin/)

## Overview

Security Roles Explorer provides administrators with a focused interface to:

- Analyze role privileges by security role or table
- Edit privileges individually or in bulk
- Assign and unassign roles for users and teams
- Review security posture in a dashboard with key metrics

## Features

### PRIVILEGE EXPLORER

- View privileges by role or by table
- Sort and filter by access rights and ownership
- Bulk update visible rows for a selected privilege column
- Track pending privilege changes before applying

### ASSIGN SECURITY ROLES

- Manage role assignments in multiple views:
	- Role -> Users
	- User -> Roles
	- Role -> Teams
	- Team -> Roles
- Check/uncheck assignment state directly in the table
- Use a single Update action with pending change count
- See row-level indicators for items that will be updated

### SECURITY DASHBOARD

- View user, role, and team security metrics
- Analyze active human/application user distribution per role
- See teams per role and users per business unit/team
- Filter dashboard charts and export dataset snapshots

## What this tool changes

Security Roles Explorer is read-only until you stage changes and apply them. When you do, it writes to the **currently connected Dataverse environment** only:

- **Role privileges** – adds, removes, or changes the access level of table and miscellaneous privileges on security roles (Privilege Explorer).
- **Role assignments** – associates or disassociates security roles with users and teams (Assign Security Roles).

Nothing is written to Dataverse until you click **Apply changes** / **Update** and confirm. The confirmation dialog shows the target environment, the scope and the number of roles or assignments affected, and offers **Export current state, then apply**, which saves a CSV of the affected roles/assignments as they are right now so you have a recovery point. The tool does not change solutions, table definitions, or data records, and it does not send data anywhere other than your connected Dataverse environment.

## Troubleshooting

- If the tool shows "Not connected", select a connection in ToolBox and reload.
- If role privileges fail to load, verify the connection user has required security permissions and refresh.
- If assignments look stale after changes, refresh data from the toolbar.

## License

MIT