---
title: Getting Started
nav_order: 2
---

# Getting Started

This page walks you through installing the tool, connecting it to your Dataverse environment, and understanding the basic layout so you can find your way around quickly.

---

## Requirements

- **Power Platform Tool Box (PPTB)** installed on your machine.
- A Dataverse connection configured in PPTB that points to the environment you want to manage.
- The signed-in account must have at least **Security Administrator** or **System Administrator** privileges in that environment to view and edit security roles.

---

## Installation

1. Open **Power Platform Tool Box**.
2. Click **Tool Gallery** in the left sidebar.
3. Search for **Advanced Security Roles Explorer**.
4. Click **Install**.
5. The tool now appears in your PPTB tool list.

---

## Connecting to your environment

The tool uses the active connection that is selected in PPTB. It does not ask you to sign in separately.

1. In PPTB, make sure a Dataverse connection is selected and active. The connection badge at the top of the screen shows the current environment name.
2. Open **Advanced Security Roles Explorer** from your tool list.
3. The tool connects automatically and begins loading roles, tables, and users. This may take a few seconds depending on the size of your environment.

> **Connection badge** — The badge in the top-right of the tool header shows the current connection status. If it shows **Not connected**, return to PPTB, select a connection, and reopen the tool.

---

## The header

```
Advanced Security Roles Explorer
[Connection badge]  [Theme toggle]
[Edit security roles] [Assign security roles] [Security dashboard]
[Unmanaged roles only  ●]
```

| Element | What it does |
|---|---|
| **Connection badge** | Displays the name of the currently connected environment |
| **Theme toggle** | Switches between light and dark mode |
| **Tab bar** | Switches between the three main pages |
| **Unmanaged roles only** toggle | When enabled, hides managed (solution-deployed) roles across all pages and shows only custom (unmanaged) roles |

---

## Switching between pages

The tool has three pages, each accessible via the tab bar in the header:

| Tab | Page | Purpose |
|---|---|---|
| **Edit security roles** | Privilege Explorer | View and edit table-level privileges for any security role |
| **Assign security roles** | Assignment Manager | Assign or remove roles for users and teams |
| **Security dashboard** | Dashboard | High-level metrics and charts about roles, users, and teams |

Click any tab button to switch pages instantly. Your filters and unsaved changes on the current page are preserved while navigating between tabs.

> **Tip:** If you navigate away from the **Edit security roles** tab while you have pending changes, those changes are still there when you return — you do not lose your work.

---

## Unmanaged roles only

The **Unmanaged roles only** toggle in the header applies globally to all three pages. When switched on:

- Managed roles (roles that are part of a solution, such as Dynamics 365 built-in roles) are hidden from all dropdowns and tables.
- Only roles you have created directly in the environment (custom / unmanaged) remain visible.

This is useful when you only want to manage your own custom roles and do not want the built-in roles cluttering the lists.

---

## Loading and performance

On first open, the tool loads security roles, tables, and user data from Dataverse. In larger environments this can take 10–30 seconds. A loading indicator is shown while data is being fetched.

Once the data is loaded it is cached for the session. Switching tabs does not re-fetch data. To reload fresh data from the server, click the **Refresh** button on the **Edit security roles** page.

---

## Next steps

- [Edit Security Roles](edit-security-roles.md) — Learn how to view and change table privileges.
- [Assign Security Roles](assign-security-roles.md) — Assign or remove roles for users and teams.
- [Security Dashboard](security-dashboard.md) — Review access statistics for your environment.
