---
title: Assign Security Roles
nav_order: 4
---

# Assign Security Roles

The **Assign security roles** page is the Assignment Manager. It shows who has which security roles, and lets you assign or remove roles for individual users and teams — all from a simple checkbox list. Changes are staged first and only sent to the server when you click **Update**.

---

## When to use this page

- You want to see which users currently have a specific security role.
- You want to see all roles assigned to a specific user.
- You need to assign a role to one or more users or a team.
- You need to remove a role from one or more users or a team.
- You want to manage role assignments for Dataverse teams.

---

## Page layout

```
[View mode] [Security role / User / Team select] [Role filter / User filter]
──────────────────────────────────────────────
[Update button]  pending count badge
──────────────────────────────────────────────
User / Role | Assigned | Select
[Search]      [Assigned filter]  [Check all] [Uncheck all]
──────────────────────────────────────────────
Rows with checkboxes and status pills
```

---

## View modes

The **View** dropdown switches between four perspectives. Choose the one that matches your goal:

| View mode | Left dropdown | Table shows | Use when |
|---|---|---|---|
| **Role → Users** | Security role | All users in the environment, checked if they have the selected role | You want to manage who has a specific role |
| **User → Roles** | User | All security roles, checked if the user holds that role | You want to see or change all roles for a specific user |
| **Role → Teams** | Security role | All Dataverse teams, checked if the team has the selected role | You want to assign a role to a team |
| **Team → Roles** | Team | All security roles, checked if the team holds that role | You want to see or change all roles for a specific team |

---

## Selecting a role, user, or team

After choosing a view mode, a second dropdown appears on the left with a list of items to pick from:

- **Security role dropdown** — appears in Role → Users and Role → Teams modes. Shows all roles (or only unmanaged ones if the toggle is on) with a count of how many users or teams are already assigned.
- **User dropdown** — appears in User → Roles mode. Shows all users with a count of how many roles they hold.
- **Team dropdown** — appears in Team → Roles mode. Shows all teams.

Select an item from the dropdown to load the assignment table.

---

## Filtering the dropdown list

In **Role → Users** and **Role → Teams** modes a **Role filter** dropdown appears next to the role selector:

| Option | What it shows in the role dropdown |
|---|---|
| **All roles** | Every role, regardless of whether any users/teams are assigned |
| **With assigned** | Only roles that have at least one user or team assigned |
| **Without assigned** | Only roles that have no assignments yet |

In **User → Roles** mode a **User filter** dropdown appears:

| Option | What it shows in the user dropdown |
|---|---|
| **All users** | Every user |
| **With assigned roles** | Only users who hold at least one security role |
| **Without assigned roles** | Only users who have no roles at all |

These filters help narrow down long dropdown lists when you are looking for specific cases — for example, finding roles that nobody holds yet, or users who have not been granted any roles.

---

## The assignment table

Once a role, user, or team is selected the table loads. Each row represents one item (a user, team, or role) together with its assignment status.

### Columns

| Column | Description |
|---|---|
| **User / Role** | Name of the user, team, or security role depending on the active view mode |
| **Assigned** | A status pill showing **Assigned** or **Not assigned** |
| **Select** | A checkbox that controls the desired assignment state |

### Status pills

The **Assigned** column shows a colour-coded pill:

| Pill label | Colour | Meaning |
|---|---|---|
| Assigned | Green | The role is currently active for this item |
| Not assigned | Grey | The role is not currently active |

When you change a checkbox and there is a pending change, the pill turns **amber/orange** to show it will be different after you click Update.

### Rows with pending changes

Rows where the checkbox state differs from the current server state are highlighted with a subtle amber background, making it easy to see at a glance what will change before you commit.

---

## Making changes (checkbox workflow)

Assignment changes work as follows:

1. **Check a box** on a row that is currently **Not assigned** → that item will be assigned the role when you click Update.
2. **Uncheck a box** on a row that is currently **Assigned** → that item will have the role removed when you click Update.
3. **Revert**: check/uncheck back to the original state to cancel the pending change for that row. The row highlight disappears.

The **pending count badge** next to the Update button shows the total number of rows with a pending change. If the badge shows **0** (or is hidden), there is nothing to apply.

---

## Quickly checking or unchecking many rows

- **Check all** — checks every row that is currently visible after filters are applied.
- **Uncheck all** — unchecks every row that is currently visible.

These bulk actions only affect visible rows. Use the search box or the Assigned filter to narrow down which rows are visible before using Check all / Uncheck all, so you change only the rows you intend to.

---

## Filtering the table

### Search

Type in the search box at the top of the User / Role column to filter rows by name in real time. The search matches any part of the name and is not case-sensitive.

### Assigned filter

The dropdown under the **Assigned** column lets you show:

| Option | What is shown |
|---|---|
| **All** | Every row |
| **Assigned** | Only rows where the item currently holds the role |
| **Not assigned** | Only rows where the role is not currently held |

Combine the search and the assigned filter together to quickly drill down. For example: filter to "Not assigned", then type a name to find a specific user who does not yet have the role.

### Sorting

Click any **column header button** to sort the table. Click again to reverse the order. Sorting works on name (alphabetical) and on assigned status. The active sort column is highlighted.

---

## Applying changes (Update button)

When you have finished checking and unchecking rows:

1. Click **Update**.
2. The tool processes every pending change:
   - Checked rows that were previously Not assigned → Dataverse **associate** (role granted).
   - Unchecked rows that were previously Assigned → Dataverse **disassociate** (role removed).
3. The table refreshes to reflect the confirmed server state.
4. The pending count badge resets to zero.

> **Nothing to update?** If all checkboxes match the current server state the Update button is disabled and the badge is hidden.

---

## Tips and best practices

- **Check the count before clicking Update.** The badge next to the Update button tells you how many changes will be sent. If you see an unexpectedly high number, review the highlighted rows before proceeding.
- **Use "Without assigned" role filter for onboarding.** Filtering the role dropdown to "Without assigned" quickly surfaces roles that have no users yet — useful when setting up a new environment.
- **Use "Without assigned roles" user filter for audits.** Filtering the user dropdown to "Without assigned roles" shows users who hold no roles at all, which may indicate they cannot do anything useful in the system.
- **Use Role → Teams for automated flows.** If you use Power Automate flows or application users, they are often members of teams rather than assigned roles directly. Use Role → Teams mode to manage team-level assignments.
- **Unmanaged roles only toggle.** When this is on, managed roles are hidden from the second dropdown. This is convenient when you only want to work with your own custom roles.
