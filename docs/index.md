---
title: Home
nav_order: 1
---

# Advanced Security Roles Explorer

**Advanced Security Roles Explorer** is a [Power Platform Tool Box (PPTB)](https://www.powerplatformtoolbox.com/) plugin that gives you full visibility and control over your Dataverse security configuration. From a single interface you can inspect table privileges, assign or remove security roles for users and teams, and review high-level access statistics — without writing a line of code.

---

## What can you do with this tool?

| Goal | Where to go |
|---|---|
| See which tables a role has access to | [Edit Security Roles](edit-security-roles.md) |
| Compare multiple roles for the same table | [Edit Security Roles](edit-security-roles.md) |
| Change privilege levels on a role | [Edit Security Roles](edit-security-roles.md) |
| Assign or remove a role for a user or team | [Assign Security Roles](assign-security-roles.md) |
| See every role a specific user holds | [Assign Security Roles](assign-security-roles.md) |
| Get an overview of user counts, role coverage, and teams | [Security Dashboard](security-dashboard.md) |

---

## Pages in this documentation

- **[Getting Started](getting-started.md)** — Install the tool, connect to your environment, and learn how to navigate between pages.
- **[Edit Security Roles](edit-security-roles.md)** — Detailed guide to viewing and editing table privileges.
- **[Assign Security Roles](assign-security-roles.md)** — Step-by-step instructions for assigning and removing roles for users and teams.
- **[Security Dashboard](security-dashboard.md)** — How to read the dashboard metrics and charts and export the data.

---

## Quick start

1. Open **Power Platform Tool Box**.
2. Install **Advanced Security Roles Explorer** from the Tool Gallery.
3. Open the tool — it connects automatically using your active PPTB connection.
4. Use the three tabs at the top-right to switch between pages:  
   **Edit security roles · Assign security roles · Security dashboard**

See [Getting Started](getting-started.md) for a full walkthrough.

---

## Troubleshooting

| Symptom | Solution |
|---|---|
| Badge shows "Not connected" | Select a Dataverse connection in PPTB and reopen the tool |
| Privileges fail to load | Verify the signed-in account has Security Administrator or System Administrator rights |
| Changes do not appear after applying | Click **Refresh** to reload data from the server |
| A role is not listed | Enable the **Unmanaged roles only** toggle to show or hide managed (solution) roles |

---

## Support

For bugs or feature requests, open an issue in this GitHub repository.
