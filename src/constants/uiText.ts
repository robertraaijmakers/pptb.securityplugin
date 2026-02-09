export const UI_TEXT = {
  loadingWorking: "Working...",
  loadingRolesMetadata: "Loading roles and metadata",
  loadingRolePrivileges: "Loading role privileges",
  loadingRefreshingPrivileges: "Refreshing role privileges",
  loadingApplyingChanges: "Applying privilege changes",
  loadingDashboardData: "Loading dashboard data",
  loadingDashboardRolesTeams: "Loading roles and teams",
  loadingDashboardPeople: "Loading users, business units, and team memberships",
  loadingDashboardRoleUserCounts: "Loading users per role",
  loadingDashboardRoleTeamCounts: "Loading teams per role",
  loadingDashboardFilters: "Preparing dashboard filters",
  tableTitlePrivileges: "Privileges",
  roleFilterAll: "All roles",
  statusAssigned: "Assigned",
  statusNotAssigned: "Not assigned",
  connectionNotConnected: "Not connected",
  ownershipUnknown: "Unknown",
  ownershipUserTeam: "User/Team",
  ownershipOrganization: "Organization",
  ownershipBusinessUnit: "Business Unit",
  teamTypeOwner: "Owner team",
  teamTypeAccess: "Access team",
  teamTypeDefault: "Team",
  tableCellEmpty: "-",
  themeSwitchToLight: "Switch to light theme",
  themeSwitchToDark: "Switch to dark theme",
  assignmentSelectRoleUsers: "Select a role to view users.",
  assignmentSelectUsersForRole: "Select users to add or remove this role.",
  assignmentSelectUserRoles: "Select a user to view roles.",
  assignmentSelectRolesForUser: "Select roles to add or remove for this user.",
  assignmentSelectRoleTeams: "Select a role to view teams.",
  assignmentSelectTeamsForRole: "Select teams to add or remove this role.",
  assignmentSelectTeamRoles: "Select a team to view roles.",
  assignmentSelectRolesForTeam: "Select roles to add or remove for this team.",
  unitUsers: "users",
  unitTeams: "teams",
  unitRoles: "roles",
  labelAll: "All",
  labelCustomRolesOnly: "Unmanaged roles only",
  chartEmpty: "No data for this selection.",
  logPptbUnavailable: "PPTB APIs not available. Load inside Power Platform ToolBox.",
  logInitFailed: "Initialization failed. Check console for details.",
  logClearedPending: "Cleared pending privilege changes.",
  logPrivilegesCacheFailed:
    "Failed to retrieve privileges cache. Check API permissions or entity access.",
  logDashboardLoadFailed: "Dashboard data load failed. Check console for details.",
};

export const NOTIFICATIONS = {
  noChanges: {
    title: "No changes",
    body: "There are no pending privilege updates.",
  },
  updateFailed: {
    title: "Update failed",
    body: "Failed to apply privilege updates. See console for details.",
  },
  cacheFailed: {
    title: "Cache failed",
    body: "Could not cache role privileges. See console for details.",
  },
  ready: {
    title: "Security Roles Explorer",
    body: "Tool loaded and ready.",
  },
};

export const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "user", label: "User" },
  { value: "businessUnit", label: "Business Unit" },
  { value: "parentChild", label: "Parent: Child BU" },
  { value: "organization", label: "Organization" },
  { value: "none", label: "None" },
  { value: "notAvailable", label: "N/A" },
];

export function formatRoleFilterSelected(count: number): string {
  return `${count} roles selected`;
}

export function formatLoadingStatus(loaded: number, total: number): string {
  return total > 0 ? `${loaded} / ${total}` : UI_TEXT.loadingWorking;
}

export function formatPrivilegesForRoleTitle(roleName: string): string {
  return `Privileges for role: ${roleName}`;
}

export function formatPrivilegesForTableTitle(entityLabel: string): string {
  return `Privileges for table: ${entityLabel}`;
}

export function formatAssignmentTitleUsersWithRole(roleName: string, count: number): string {
  return `Users with role: ${roleName} (${count} users)`;
}

export function formatAssignmentTitleRolesForUser(userName: string, count: number): string {
  return `Roles for user: ${userName} (${count} assigned)`;
}

export function formatAssignmentTitleTeamsWithRole(roleName: string, count: number): string {
  return `Teams with role: ${roleName} (${count} teams)`;
}

export function formatAssignmentTitleRolesForTeam(teamName: string, count: number): string {
  return `Roles for team: ${teamName} (${count} assigned)`;
}

export function formatAssignmentSelectLabel(
  label: string,
  count: number,
  unitLabel: string,
): string {
  return `${label} (${count} ${unitLabel})`;
}

export function formatApplyingChanges(count: number): string {
  return `Applying ${count} changes...`;
}

export function formatMissingPrivilegeId(entityLogicalName: string, privilege: string): string {
  return `Missing privilege ID for ${entityLogicalName}:${privilege}`;
}

export function formatNoPrivilegesForRole(roleName: string): string {
  return `No privileges returned for role ${roleName}.`;
}

export function formatCachedPrivileges(
  privilegeCount: number,
  rolePrivilegeCount: number,
  roleCount: number,
): string {
  return `Cached ${privilegeCount} privileges and ${rolePrivilegeCount} role privilege rows for ${roleCount} roles.`;
}

export function formatRoleAssignmentLogUsers(
  action: "add" | "remove",
  roleName: string,
  userNames: string[],
): string {
  const verb = action === "add" ? "Added" : "Removed";
  const prep = action === "add" ? "to" : "from";
  return `${verb} role ${roleName} ${prep} users: ${userNames.join(", ")}`;
}

export function formatRoleAssignmentLogRolesForUser(
  action: "add" | "remove",
  userName: string,
  roleNames: string[],
): string {
  const verb = action === "add" ? "Added" : "Removed";
  const prep = action === "add" ? "to" : "from";
  return `${verb} roles ${prep} user ${userName}: ${roleNames.join(", ")}`;
}

export function formatRoleAssignmentLogTeams(
  action: "add" | "remove",
  roleName: string,
  teamNames: string[],
): string {
  const verb = action === "add" ? "Added" : "Removed";
  const prep = action === "add" ? "to" : "from";
  return `${verb} role ${roleName} ${prep} teams: ${teamNames.join(", ")}`;
}

export function formatRoleAssignmentLogRolesForTeam(
  action: "add" | "remove",
  teamName: string,
  roleNames: string[],
): string {
  const verb = action === "add" ? "Added" : "Removed";
  const prep = action === "add" ? "to" : "from";
  return `${verb} roles ${prep} team ${teamName}: ${roleNames.join(", ")}`;
}
