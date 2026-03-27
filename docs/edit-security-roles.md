---
title: Edit Security Roles
nav_order: 3
---

# Edit Security Roles

The **Edit security roles** page is the Privilege Explorer. It gives you a detailed, grid-style view of every table privilege on a security role, and lets you change privilege levels directly in the browser. All changes are batched and applied together in one click.

---

## When to use this page

- You want to see exactly which tables a role has access to, and at what level.
- You need to compare how multiple roles are configured for the same table.
- You want to change privilege levels (Create, Read, Write, Delete, etc.) for a role.
- You need to find tables that have no rights set, or tables where a specific privilege is missing.

---

## Page layout

```
[Filter mode] [Security role / Entity select] [Rights filter] [Role filter (entity mode)]
──────────────────────────────────────────────────────────────────────
[Undo changes]  [Apply changes]  [Refresh]   pending count badge
──────────────────────────────────────────────────────────────────────
Table | Ownership | Create | Read | Write | Delete | Append | Append To | Assign | Share
[Search input]           [Column filter dropdowns for each privilege]
                         [Bulk update row]
──────────────────────────────────────────────────────────────────────
Rows of tables with privilege dropdowns
```

---

## Controls

### Filter mode

The **Filter mode** dropdown lets you choose between two ways of viewing data:

| Mode | What it shows |
|---|---|
| **By role** | All tables for a single selected security role. One column per privilege type. |
| **By entity** | All roles for a single selected table. One column per role (up to the roles in the role filter). |

---

### By role mode

1. Select **By role** from the Filter mode dropdown.
2. Choose a security role from the **Security role** dropdown. The list shows all roles in your environment (or only unmanaged ones if the toggle is on). Each option shows the role name together with the number of tables it covers.
3. Use the **Rights** filter to narrow down what is shown:
   - **Show all** — every table appears regardless of privilege level.
   - **Show all without rights** — only tables where the role has no privileges at all.
   - **Show all with rights** — only tables where at least one privilege is set.
4. The table loads with one row per Dataverse table.

---

### By entity mode

1. Select **By entity** from the Filter mode dropdown.
2. Choose a table from the **Entity** dropdown.
3. Use the **Role filter** dropdown (a multi-select) to pick which roles appear as columns. By default all roles are shown.
   - Click **Select filtered** to add all roles matching the current search to the selection.
   - Click **Clear filtered** to remove roles matching the current search.
   - Click **Clear all** to reset the selection to all roles.
4. The table shows one row per role, with columns for each privilege type.

---

## The privileges table

### Columns

| Column | Description |
|---|---|
| **Entity / Role** | Name of the table (by-role mode) or the security role (by-entity mode) |
| **Ownership** | The ownership model of the table: User, Organization, or Team |
| **Create** | Who can create records: None, User, Business Unit, Parent BU, or Organization |
| **Read** | Who can read records |
| **Write** | Who can update records |
| **Delete** | Who can delete records |
| **Append** | Allows this table to have lookups that reference other tables |
| **Append To** | Allows other tables to create lookups that point to this table |
| **Assign** | Who can reassign record ownership |
| **Share** | Who can share records with other users |

> **Append and Append To explained:** These two privileges always work in pairs. If a user needs a lookup from Table A to Table B to function, the user's role needs **Append** on Table A *and* **Append To** on Table B. If either side is missing, the lookup will fail at runtime.

### Privilege levels

Each privilege cell contains a dropdown with the following levels (where applicable for the table ownership type):

| Level | Description |
|---|---|
| **None** | No access |
| **User** | Access to records the user owns |
| **Business Unit** | Access to records in the user's business unit |
| **Parent BU** | Access to records in the user's business unit and all child business units |
| **Organization** | Access to all records in the environment |

### Sorting

Click any **column header button** to sort the table by that column. Click again to reverse the sort direction. The active sort column is highlighted and shows an arrow indicating ascending or descending order.

### Searching

Type in the **search box** at the top of the Entity / Role column to filter rows by name in real time. The search is case-insensitive and matches any part of the name.

### Column filters

Each privilege column has a **filter dropdown** below the header. Use it to show only rows with a specific privilege level for that column. For example, filtering the Read column to **Organization** shows only tables where the role has organization-wide read access.

### Bulk update

The **bulk update row** sits below the column filters. It lets you set the same privilege level on all currently visible rows at once:

1. Choose the desired level in the bulk update dropdown for a column.
2. Click **Set**.
3. All rows that are currently visible (after search and column filters are applied) update to that level.
4. The pending count badge updates to show how many cells have been changed.

Bulk update is useful for quickly setting a baseline: for example, set Read to Organization on all tables, then manually adjust the exceptions.

---

## Making and applying changes

### Changing a single privilege

Click the dropdown in any cell of the table and select the new privilege level. The cell immediately updates visually. The **pending count badge** in the panel header increments to track how many cells you have changed.

### Reviewing pending changes

The pending count badge (e.g. **3**) shows the total number of individual privilege cells that differ from the server state. Changes are highlighted in the table.

### Applying changes

When you are satisfied with all changes:

1. Click **Apply changes**.
2. The tool sends all changed cells to the Dataverse API in a single batch operation.
3. The table reloads with the confirmed server state.

### Undoing changes

- Click **Undo changes** at any time before applying to discard all pending edits and revert every cell to the last-loaded server value.
- This does not undo changes that have already been applied to the server.

### Refreshing

Click **Refresh** to reload all privilege data fresh from the server. This discards any pending changes and re-fetches the latest state.

---

## Tips and best practices

- **Filter before bulk-updating.** Use the search box and column filters first to narrow the visible rows, then use bulk update — it only affects the rows currently shown.
- **Use the Rights filter to find gaps.** Switching to "Show all without rights" quickly reveals tables where a role has no access at all, which can help identify permission gaps.
- **By entity mode is great for audits.** When you want to know which roles have Create access to a sensitive table, switch to By entity, select that table, and scan the Create column across all roles.
- **Append / Append To pairs.** When adding a multi-table relationship, always check both the source and target table and ensure both sides have the corresponding Append / Append To privilege at the right level.
