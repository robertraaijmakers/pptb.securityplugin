---
title: Security Dashboard
nav_order: 5
---

# Security Dashboard

The **Security dashboard** page gives you a high-level overview of your Dataverse environment's security state. It shows key metrics and visual charts that help you understand how roles, users, teams, and business units are distributed — without needing to dig through individual records.

---

## When to use this page

- You want a quick summary of how many users, roles, and teams exist in the environment.
- You need to spot roles that have no users assigned (potentially unused or misconfigured).
- You want to see which roles are most widely distributed.
- You are preparing a security audit or compliance report and need an exportable snapshot.
- You want to understand how users are spread across business units or teams.

---

## Page layout

```
[User status filter] [User type filter] [Business unit filter] [Role filter] [Team filter]  [Download data]
──────────────────────────────────────────────────────────────────────
[Metric cards: user and role counts]
──────────────────────────────────────────────────────────────────────
[Active users per role chart]        [Teams per role chart]
[Users per business unit chart]      [Users per team chart]
```

---

## Filters

The filters at the top of the page apply to all metric cards and charts simultaneously. Adjust them to focus on a specific segment of your environment.

| Filter | Options | Effect |
|---|---|---|
| **User status** | All / Active only / Inactive only | Includes or excludes active and inactive users |
| **User type** | All / Human / Application | Includes or excludes human and application (service) users |
| **Business unit** | All / specific BU | Restricts data to users in the selected business unit |
| **Security role** | All / specific role | Restricts data to users who hold the selected role |
| **Team** | All / specific team | Restricts data to users who are members of the selected team |

Filters stack — for example, you can filter to **Active only** + **Human** + a specific **Business unit** at the same time to see the number of active human users in a particular part of the organisation.

---

## Metric cards

Eight summary cards appear at the top of the dashboard. Each shows a single number computed from the current filter combination.

| Card | What it counts |
|---|---|
| **Active human users** | Users of type Human with Active status |
| **Inactive human users** | Users of type Human with Inactive status |
| **Active application users** | Service / application users with Active status |
| **Inactive application users** | Service / application users with Inactive status |
| **Unmanaged roles** | Security roles that are custom (not part of a managed solution) |
| **Managed roles** | Security roles that are part of a solution |
| **Roles without users** | Security roles where no active user holds the role directly or via a team |
| **Total teams** | Total number of Dataverse teams in the environment |

### Interpreting the cards

- **Roles without users** is the most actionable metric for a security audit. A high number may indicate stale or unused roles that can be cleaned up, or new roles that have not yet been assigned to anyone.
- **Inactive users** should be reviewed periodically. Inactive accounts that still hold security roles may be a compliance concern.
- **Managed vs unmanaged roles** gives a sense of how much of the security model is managed through solutions versus manually configured.

---

## Charts

Four bar charts give a visual breakdown of the distribution of users across roles, teams, and business units. Each chart is computed from the same active filter set.

### Active users per role

Shows the number of active users assigned to each security role, sorted from most to fewest. This makes it easy to identify which roles are widely held and which are nearly empty.

> **Use case:** Quickly see whether your "Salesperson" role is properly populated, or identify roles that have a suspiciously high number of users.

### Teams per role

Shows how many Dataverse teams hold each security role. Useful in environments that manage role assignments primarily through teams rather than individual users.

> **Use case:** Verify that team-based role assignments are proportional — a role carried by many teams is effectively granted to many users indirectly.

### Users per business unit

Shows the number of users (filtered by the active user status and type filters) in each business unit.

> **Use case:** Check whether users are distributed across business units as expected, or identify a business unit with an unusual count that may indicate a data issue.

### Users per team

Shows the number of users (filtered by the active user status and type filters) in each team.

> **Use case:** Identify large teams that may carry broad security roles, or small teams that might be consolidated.

---

## Expanding a chart

Each chart shows a limited number of items by default (typically the top entries). To see the full list:

1. Click **View all** in the top-right corner of a chart card.
2. A modal opens with a larger version of the chart that includes all items.
3. Click **Close** or click outside the modal to return to the dashboard.

---

## Downloading data

Click **Download data** in the filter bar to export the current dashboard data as a file. The export reflects the current filter selections — only the data visible on the dashboard at that moment is included.

Use this when you need to share a snapshot of the security state with stakeholders, or when you want to do further analysis in Excel or another tool.

---

## Tips and best practices

- **Start with no filters** to get the full picture, then apply filters to zoom into specific segments.
- **Use "Roles without users" as a starting point for cleanup.** Switch the Role filter to specific roles with zero users to verify whether those roles are still needed.
- **Filter by Business unit for audits.** If your organisation is divided into business units with different compliance requirements, filter to each unit and take a screenshot or export for documentation.
- **Compare Human vs Application users.** Switching the User type filter between Human and Application gives a quick picture of how many automated processes exist and whether they hold roles they should not.
- **Revisit after bulk changes.** If you have just finished a large batch of assignments in the **Assign security roles** tab, come back to the dashboard to verify the metrics updated as expected.
