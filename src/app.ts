/// <reference types="@pptb/types" />

import { getActiveConnection } from "./hooks/useConnection";
import { initLogger, logMessage } from "./services/loggerService";
import { buildCsv, exportCsvBundle } from "./services/exportService";
import Chart from "chart.js/auto";
import {
  dataverseAPI,
  queryAll,
  retrieveRolePrivileges,
  loadRoles as fetchRoles,
  loadUsers as fetchUsers,
  loadTeams as fetchTeams,
  loadBusinessUnits,
  loadUsersForDashboard,
  loadTeamMemberships,
  loadRoleRootMap,
  loadUserRoleAssignments,
  loadTeamRoleAssignments,
  resolveRoleForBusinessUnit,
  addPrivilegesToRole,
  removePrivilegesFromRole,
  associateRoleToUser,
  disassociateRoleFromUser,
  associateRoleToTeam,
  disassociateRoleFromTeam,
} from "./services/dataverseService";
import {
  AccessRight,
  PrivilegeLevel,
  SortColumn,
  SortDirection,
  PrivilegeRow,
  RoleSummary,
  EntitySummary,
  PendingChange,
  PrivilegeInfo,
} from "./types/securityRole";
import {
  BusinessUnitSummary,
  DashboardUser,
  TeamMembership,
} from "./types/dashboard";
import { accessRights, levelColorMap, levelOptions } from "./constants/securityRole";
import {
  FILTER_OPTIONS,
  NOTIFICATIONS,
  UI_TEXT,
  formatApplyingChanges,
  formatAssignmentTitleRolesForTeam,
  formatAssignmentTitleRolesForUser,
  formatAssignmentTitleTeamsWithRole,
  formatAssignmentTitleUsersWithRole,
  formatAssignmentSelectLabel,
  formatCachedPrivileges,
  formatLoadingStatus,
  formatMissingPrivilegeId,
  formatNoPrivilegesForRole,
  formatPrivilegesForRoleTitle,
  formatPrivilegesForTableTitle,
  formatRoleAssignmentLogRolesForTeam,
  formatRoleAssignmentLogRolesForUser,
  formatRoleAssignmentLogTeams,
  formatRoleAssignmentLogUsers,
  formatRoleFilterSelected,
} from "./constants/uiText";
import {
  AssignmentItem,
  AssignmentMode,
  AssignmentSortColumn,
  AssignmentSortDirection,
} from "./types/assignment";
import { UserSummary } from "./types/systemUser";
import { TeamSummary } from "./types/team";
import { FilterMode } from "./types/ui";

const toolboxAPI = (window as any).toolboxAPI;

const state = {
  connectionName: "",
  filterMode: "role" as FilterMode,
  allRoles: [] as RoleSummary[],
  roles: [] as RoleSummary[],
  entities: [] as EntitySummary[],
  users: [] as UserSummary[],
  teams: [] as TeamSummary[],
  privilegeRows: [] as PrivilegeRow[],
  pendingChanges: [] as PendingChange[],
  privilegeIdByKey: new Map<string, string>(),
  privilegeInfoById: new Map<string, PrivilegeInfo>(),
  rolePrivileges: new Map<string, Map<string, Record<AccessRight, PrivilegeLevel>>>(),
  tableMode: "role" as FilterMode,
  selectedRoleIds: new Set<string>(),
  hideManagedRoles: false,
  currentTab: "privileges" as "privileges" | "assignments" | "dashboard",
  rightsFilter: "all" as "all" | "with" | "without",
  cacheLoaded: false,
  cacheLoading: false,
  cachePromise: null as Promise<boolean> | null,
  assignmentMode: "role" as AssignmentMode,
  assignmentItems: [] as AssignmentItem[],
  selectedAssignmentIds: new Set<string>(),
  usersLoaded: false,
  teamsLoaded: false,
  roleByRootAndBu: new Map<string, string>(),
  teamByRootAndBu: new Map<string, string>(),
  roleRootById: new Map<string, string>(),
  roleRootLoaded: false,
  roleRootLoading: false,
  roleRootPromise: null as Promise<void> | null,
  assignmentRoleUserCounts: new Map<string, number>(),
  assignmentRoleTeamCounts: new Map<string, number>(),
  assignmentUserRoleCounts: new Map<string, number>(),
  assignmentTeamRoleCounts: new Map<string, number>(),
  assignmentUsersByRole: new Map<string, Set<string>>(),
  assignmentRolesByUser: new Map<string, Set<string>>(),
  assignmentTeamsByRole: new Map<string, Set<string>>(),
  assignmentRolesByTeam: new Map<string, Set<string>>(),
  assignmentUserRolesLoaded: false,
  assignmentTeamRolesLoaded: false,
  assignmentUserRolesLoading: false,
  assignmentUserRolesPromise: null as Promise<void> | null,
  assignmentTeamRolesLoading: false,
  assignmentTeamRolesPromise: null as Promise<void> | null,
  dashboardLoaded: false,
  dashboardLoading: false,
  dashboardPromise: null as Promise<void> | null,
  dashboardUsers: [] as DashboardUser[],
  dashboardBusinessUnits: [] as BusinessUnitSummary[],
  dashboardTeamMemberships: [] as TeamMembership[],
  dashboardRoleUserCounts: new Map<string, number>(),
  dashboardRoleTeamCounts: new Map<string, number>(),
  dashboardCharts: {
    usersByRole: null as Chart | null,
    teamsByRole: null as Chart | null,
    usersByBusinessUnit: null as Chart | null,
    usersByTeam: null as Chart | null,
    modal: null as Chart | null,
  },
  assignmentSort: {
    column: "label" as AssignmentSortColumn,
    direction: "asc" as AssignmentSortDirection,
  },
  assignmentFilter: "" as "" | "assigned" | "not-assigned",
  assignmentSearch: "",
  sort: {
    column: "label" as SortColumn,
    direction: "asc" as SortDirection,
  },
  filters: {
    create: "",
    read: "",
    write: "",
    delete: "",
    append: "",
    appendto: "",
    assign: "",
  } as Record<AccessRight, string>,
  eventsHooked: false,
  readyToastShown: false,
  refreshInProgress: false,
  loading: {
    active: false,
    loaded: 0,
    total: 0,
  },
};

const elements = {
  connectionBadge: document.getElementById("connection-badge") as HTMLDivElement,
  filterMode: document.getElementById("filter-mode") as HTMLSelectElement,
  roleSelect: document.getElementById("role-select") as HTMLSelectElement,
  entitySelect: document.getElementById("entity-select") as HTMLSelectElement,
  roleSelectControl: document.getElementById("role-select-control") as HTMLDivElement,
  entitySelectControl: document.getElementById("entity-select-control") as HTMLDivElement,
  rightsFilter: document.getElementById("rights-filter") as HTMLSelectElement,
  roleFilterControl: document.getElementById("role-filter-control") as HTMLDivElement,
  roleFilterButton: document.getElementById("role-filter-button") as HTMLButtonElement,
  roleFilterMenu: document.getElementById("role-filter-menu") as HTMLDivElement,
  roleFilterList: document.getElementById("role-filter-list") as HTMLDivElement,
  roleFilterAll: document.getElementById("role-filter-all") as HTMLButtonElement,
  roleFilterNone: document.getElementById("role-filter-none") as HTMLButtonElement,
  rolesCustomOnlyGlobal: document.getElementById("roles-custom-only-global") as HTMLInputElement,
  tabButtons: Array.from(document.querySelectorAll(".tab-button")) as HTMLButtonElement[],
  tabPrivileges: document.getElementById("tab-privileges") as HTMLElement,
  tabAssignments: document.getElementById("tab-assignments") as HTMLElement,
  tabDashboard: document.getElementById("tab-dashboard") as HTMLElement,
  assignmentMode: document.getElementById("assignment-mode") as HTMLSelectElement,
  assignmentRoleSelect: document.getElementById("assignment-role-select") as HTMLSelectElement,
  assignmentUserSelect: document.getElementById("assignment-user-select") as HTMLSelectElement,
  assignmentTeamSelect: document.getElementById("assignment-team-select") as HTMLSelectElement,
  assignmentRoleControl: document.getElementById("assignment-role-control") as HTMLDivElement,
  assignmentUserControl: document.getElementById("assignment-user-control") as HTMLDivElement,
  assignmentTeamControl: document.getElementById("assignment-team-control") as HTMLDivElement,
  assignmentTitle: document.getElementById("assignment-title") as HTMLHeadingElement,
  assignmentAdd: document.getElementById("assignment-add") as HTMLButtonElement,
  assignmentRemove: document.getElementById("assignment-remove") as HTMLButtonElement,
  assignmentCount: document.getElementById("assignment-count") as HTMLSpanElement,
  assignmentSelectAll: document.getElementById("assignment-select-all") as HTMLButtonElement,
  assignmentClear: document.getElementById("assignment-clear") as HTMLButtonElement,
  assignmentStatus: document.getElementById("assignment-status") as HTMLDivElement,
  assignmentTableBody: document.getElementById("assignment-table-body") as HTMLTableSectionElement,
  assignmentSortButtons: Array.from(
    document.querySelectorAll("[data-assign-sort]"),
  ) as HTMLButtonElement[],
  assignmentFilterAssigned: document.getElementById("assignment-filter-assigned") as HTMLSelectElement,
  assignmentSearch: document.getElementById("assignment-search") as HTMLInputElement,
  controlsPrivileges: document.getElementById("controls-privileges") as HTMLDivElement,
  controlsAssignments: document.getElementById("controls-assignments") as HTMLDivElement,
  controlsDashboard: document.getElementById("controls-dashboard") as HTMLDivElement,
  dashboardUserStatus: document.getElementById("dashboard-user-status") as HTMLSelectElement,
  dashboardUserType: document.getElementById("dashboard-user-type") as HTMLSelectElement,
  dashboardBusinessUnitSelect: document.getElementById("dashboard-bu-select") as HTMLSelectElement,
  dashboardRoleSelect: document.getElementById("dashboard-role-select") as HTMLSelectElement,
  dashboardTeamSelect: document.getElementById("dashboard-team-select") as HTMLSelectElement,
  dashboardExport: document.getElementById("dashboard-export") as HTMLButtonElement,
  dashboardLoading: document.getElementById("dashboard-loading") as HTMLDivElement,
  dashboardLoadingBar: document.getElementById("dashboard-loading-bar") as HTMLDivElement,
  dashboardLoadingText: document.getElementById("dashboard-loading-text") as HTMLDivElement,
  dashboardChartCards: Array.from(
    document.querySelectorAll("[data-dashboard-chart]"),
  ) as HTMLDivElement[],
  dashboardChartButtons: Array.from(
    document.querySelectorAll(".chart-expand"),
  ) as HTMLButtonElement[],
  chartModal: document.getElementById("chart-modal") as HTMLDivElement,
  chartModalTitle: document.getElementById("chart-modal-title") as HTMLHeadingElement,
  chartModalCanvas: document.getElementById("chart-modal-canvas") as HTMLCanvasElement,
  chartModalClose: document.getElementById("chart-modal-close") as HTMLButtonElement,
  chartModalBackdrop: document.querySelector("[data-modal-close='true']") as HTMLDivElement,
  chartModalBody: document.querySelector(".modal-body") as HTMLDivElement,
  metricHumanActive: document.getElementById("metric-human-active") as HTMLDivElement,
  metricHumanInactive: document.getElementById("metric-human-inactive") as HTMLDivElement,
  metricAppActive: document.getElementById("metric-app-active") as HTMLDivElement,
  metricAppInactive: document.getElementById("metric-app-inactive") as HTMLDivElement,
  metricCustomRoles: document.getElementById("metric-custom-roles") as HTMLDivElement,
  metricManagedRoles: document.getElementById("metric-managed-roles") as HTMLDivElement,
  metricRolesWithoutUsers: document.getElementById("metric-roles-without-users") as HTMLDivElement,
  metricTotalTeams: document.getElementById("metric-total-teams") as HTMLDivElement,
  chartUsersByRole: document.getElementById("chart-users-by-role") as HTMLCanvasElement,
  chartTeamsByRole: document.getElementById("chart-teams-by-role") as HTMLCanvasElement,
  chartUsersByBusinessUnit: document.getElementById("chart-users-by-bu") as HTMLCanvasElement,
  chartUsersByTeam: document.getElementById("chart-users-by-team") as HTMLCanvasElement,
  applyBtn: document.getElementById("apply-btn") as HTMLButtonElement,
  undoBtn: document.getElementById("undo-btn") as HTMLButtonElement,
  refreshBtn: document.getElementById("refresh-btn") as HTMLButtonElement,
  pendingCount: document.getElementById("pending-count") as HTMLSpanElement,
  tableTitle: document.getElementById("table-title") as HTMLHeadingElement,
  privilegesTable: document.querySelector("#privileges-table tbody") as HTMLTableSectionElement,
  privilegesTableRoot: document.getElementById("privileges-table") as HTMLTableElement,
  tableLoading: document.getElementById("table-loading") as HTMLDivElement,
  tableEmpty: document.getElementById("table-empty") as HTMLDivElement,
  loadingBar: document.getElementById("loading-bar") as HTMLDivElement,
  loadingText: document.getElementById("loading-text") as HTMLDivElement,
  log: document.getElementById("log") as HTMLPreElement,
  themeToggle: document.getElementById("theme-toggle") as HTMLButtonElement,
  sortButtons: Array.from(document.querySelectorAll(".sort-button")) as HTMLButtonElement[],
  filterSelects: Array.from(document.querySelectorAll(".filter-select")) as HTMLSelectElement[],
};

initLogger(elements.log);

function setTableTitle(text: string) {
  if (elements.tableTitle) {
    elements.tableTitle.textContent = text;
  }
}

function resetSecurityCache(clearPending: boolean) {
  state.cacheLoaded = false;
  state.privilegeIdByKey = new Map();
  state.privilegeInfoById = new Map();
  state.rolePrivileges = new Map();
  state.privilegeRows = [];
  if (clearPending) {
    state.pendingChanges = [];
    updatePendingUi();
  }
}

function resetAssignmentCaches() {
  state.assignmentUsersByRole.clear();
  state.assignmentRolesByUser.clear();
  state.assignmentTeamsByRole.clear();
  state.assignmentRolesByTeam.clear();
  state.assignmentRoleUserCounts.clear();
  state.assignmentRoleTeamCounts.clear();
  state.assignmentUserRoleCounts.clear();
  state.assignmentTeamRoleCounts.clear();
  state.assignmentUserRolesLoaded = false;
  state.assignmentTeamRolesLoaded = false;
  state.assignmentUserRolesLoading = false;
  state.assignmentUserRolesPromise = null;
  state.assignmentTeamRolesLoading = false;
  state.assignmentTeamRolesPromise = null;
}

function resetDashboardCaches() {
  state.dashboardLoaded = false;
  state.dashboardLoading = false;
  state.dashboardPromise = null;
  state.dashboardUsers = [];
  state.dashboardBusinessUnits = [];
  state.dashboardTeamMemberships = [];
  state.dashboardRoleUserCounts.clear();
  state.dashboardRoleTeamCounts.clear();
}

async function ensureRoleRootMapLoaded() {
  if (state.roleRootLoaded) {
    return;
  }
  if (state.roleRootLoading && state.roleRootPromise) {
    return state.roleRootPromise;
  }
  state.roleRootLoading = true;
  state.roleRootPromise = (async () => {
    try {
      state.roleRootById = await loadRoleRootMap();
      state.roleRootLoaded = true;
    } finally {
      state.roleRootLoading = false;
      state.roleRootPromise = null;
    }
  })();
  return state.roleRootPromise;
}

async function ensureUserRoleAssignmentsLoaded() {
  if (state.assignmentUserRolesLoaded) {
    return;
  }
  if (state.assignmentUserRolesLoading && state.assignmentUserRolesPromise) {
    return state.assignmentUserRolesPromise;
  }
  state.assignmentUserRolesLoading = true;
  state.assignmentUserRolesPromise = (async () => {
    try {
      await ensureRoleRootMapLoaded();
      const assignments = await loadUserRoleAssignments();
      state.assignmentUsersByRole.clear();
      state.assignmentRolesByUser.clear();
      for (const entry of assignments) {
        const rootRoleId = state.roleRootById.get(entry.roleId) ?? entry.roleId;
        if (!state.assignmentUsersByRole.has(rootRoleId)) {
          state.assignmentUsersByRole.set(rootRoleId, new Set());
        }
        state.assignmentUsersByRole.get(rootRoleId)!.add(entry.userId);
        if (!state.assignmentRolesByUser.has(entry.userId)) {
          state.assignmentRolesByUser.set(entry.userId, new Set());
        }
        state.assignmentRolesByUser.get(entry.userId)!.add(rootRoleId);
      }
      state.assignmentUserRolesLoaded = true;
    } finally {
      state.assignmentUserRolesLoading = false;
      state.assignmentUserRolesPromise = null;
    }
  })();
  return state.assignmentUserRolesPromise;
}

async function ensureTeamRoleAssignmentsLoaded() {
  if (state.assignmentTeamRolesLoaded) {
    return;
  }
  if (state.assignmentTeamRolesLoading && state.assignmentTeamRolesPromise) {
    return state.assignmentTeamRolesPromise;
  }
  state.assignmentTeamRolesLoading = true;
  state.assignmentTeamRolesPromise = (async () => {
    try {
      await ensureRoleRootMapLoaded();
      const assignments = await loadTeamRoleAssignments();
      state.assignmentTeamsByRole.clear();
      state.assignmentRolesByTeam.clear();
      for (const entry of assignments) {
        const rootRoleId = state.roleRootById.get(entry.roleId) ?? entry.roleId;
        if (!state.assignmentTeamsByRole.has(rootRoleId)) {
          state.assignmentTeamsByRole.set(rootRoleId, new Set());
        }
        state.assignmentTeamsByRole.get(rootRoleId)!.add(entry.teamId);
        if (!state.assignmentRolesByTeam.has(entry.teamId)) {
          state.assignmentRolesByTeam.set(entry.teamId, new Set());
        }
        state.assignmentRolesByTeam.get(entry.teamId)!.add(rootRoleId);
      }
      state.assignmentTeamRolesLoaded = true;
    } finally {
      state.assignmentTeamRolesLoading = false;
      state.assignmentTeamRolesPromise = null;
    }
  })();
  return state.assignmentTeamRolesPromise;
}

function setDashboardLoading(active: boolean, message?: string) {
  if (elements.dashboardLoading) {
    elements.dashboardLoading.classList.toggle("hidden", !active);
  }
  if (elements.dashboardLoadingText && message) {
    elements.dashboardLoadingText.textContent = message;
  }
  if (elements.dashboardLoadingBar) {
    elements.dashboardLoadingBar.style.width = active ? "0%" : "0%";
  }
}

function setDashboardLoadingProgress(step: number, total: number, message: string) {
  if (elements.dashboardLoadingText) {
    elements.dashboardLoadingText.textContent = `${message} (${step}/${total})`;
  }
  if (elements.dashboardLoadingBar) {
    const percent = total > 0 ? Math.round((step / total) * 100) : 0;
    elements.dashboardLoadingBar.style.width = `${percent}%`;
  }
}

function isApplicationUser(user: DashboardUser): boolean {
  return Boolean(user.applicationId) || user.accessMode === 4;
}

function isActiveUser(user: DashboardUser): boolean {
  return !user.isDisabled && user.accessMode !== 3 && user.accessMode !== 5;
}

function updatePendingUi() {
  const count = state.pendingChanges.length;
  if (elements.applyBtn) {
    elements.applyBtn.disabled = count === 0;
  }
  if (elements.undoBtn) {
    elements.undoBtn.disabled = count === 0;
  }
  if (elements.pendingCount) {
    elements.pendingCount.textContent = `${count}`;
    elements.pendingCount.classList.toggle("hidden", count === 0);
  }
}

function updateAssignmentSelectionUi() {
  const count = state.selectedAssignmentIds.size;
  if (elements.assignmentAdd) {
    elements.assignmentAdd.disabled = count === 0;
  }
  if (elements.assignmentRemove) {
    elements.assignmentRemove.disabled = count === 0;
  }
  if (elements.assignmentCount) {
    elements.assignmentCount.textContent = `${count}`;
    elements.assignmentCount.classList.toggle("hidden", count === 0);
  }
}

async function setCustomRolesOnly(enabled: boolean, silent = false) {
  state.hideManagedRoles = enabled;
  if (elements.rolesCustomOnlyGlobal) {
    elements.rolesCustomOnlyGlobal.checked = enabled;
  }

  if (silent) {
    return;
  }

  applyRoleFilterToUi();
}

function getFilteredRoles(): RoleSummary[] {
  return state.hideManagedRoles
    ? state.allRoles.filter((role) => !role.isManaged)
    : [...state.allRoles];
}

function applyRoleFilterToUi() {
  state.roles = getFilteredRoles();
  syncRoleFilterSelection();
  renderRoleFilterOptions();

  renderSelectOptionsWithSelection(
    elements.roleSelect,
    state.roles,
    (item) => item.id,
    (item) => item.name,
  );
  renderSelectOptionsWithSelection(
    elements.assignmentRoleSelect,
    state.roles,
    (item) => item.id,
    (item) => item.name,
  );
  renderSelectOptionsWithAll(
    elements.dashboardRoleSelect,
    state.roles,
    (item) => item.id,
    (item) => item.name,
  );

  if (state.filterMode === "role" && state.roles.length > 0 && !elements.roleSelect.value) {
    elements.roleSelect.value = state.roles[0].id;
  }
  if (state.cacheLoaded) {
    if (state.filterMode === "entity" && state.entities.length > 0) {
      loadEntityCoverage(elements.entitySelect.value);
    } else if (state.filterMode === "role" && elements.roleSelect.value) {
      loadRolePrivileges(elements.roleSelect.value);
    }
  }

  if (state.currentTab === "assignments") {
    loadAssignmentView();
  }
  if (state.currentTab === "dashboard" && state.dashboardLoaded) {
    updateDashboardMetrics();
    updateDashboardCharts();
  }
}

function setLoading(active: boolean, message?: string) {
  state.loading.active = active;
  if (elements.tableLoading) {
    elements.tableLoading.classList.toggle("hidden", !active);
  }
  if (elements.privilegesTableRoot) {
    elements.privilegesTableRoot.classList.toggle("hidden", active);
  }
  if (elements.tableEmpty) {
    elements.tableEmpty.classList.toggle("hidden", active || state.cacheLoaded);
  }
  if (message && elements.loadingText) {
    elements.loadingText.textContent = message;
  }
  if (active) {
    updateLoadingProgress(0, state.loading.total || 0, message);
  }
}

function updateLoadingProgress(loaded: number, total: number, message?: string) {
  state.loading.loaded = loaded;
  state.loading.total = total;
  const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
  if (elements.loadingBar) {
    elements.loadingBar.style.width = `${percent}%`;
  }
  if (elements.loadingText) {
    const status = formatLoadingStatus(loaded, total);
    elements.loadingText.textContent = message ? `${message} (${status})` : status;
  }
}

function renderSelectOptions<T extends { id?: string; logicalName?: string; name?: string; displayName?: string }>(
  select: HTMLSelectElement,
  items: T[],
  getValue: (item: T) => string,
  getLabel: (item: T) => string,
) {
  select.innerHTML = "";
  for (const item of items) {
    const option = document.createElement("option");
    option.value = getValue(item);
    option.textContent = getLabel(item);
    select.appendChild(option);
  }
}

function renderSelectOptionsWithSelection<T extends { id?: string; logicalName?: string; name?: string; displayName?: string }>(
  select: HTMLSelectElement,
  items: T[],
  getValue: (item: T) => string,
  getLabel: (item: T) => string,
) {
  const previousValue = select.value;
  renderSelectOptions(select, items, getValue, getLabel);
  if (previousValue && items.some((item) => getValue(item) === previousValue)) {
    select.value = previousValue;
  }
}

function renderSelectOptionsWithAll<T extends { id?: string; logicalName?: string; name?: string; displayName?: string }>(
  select: HTMLSelectElement,
  items: T[],
  getValue: (item: T) => string,
  getLabel: (item: T) => string,
) {
  const previousValue = select.value;
  select.innerHTML = "";
  const optionAll = document.createElement("option");
  optionAll.value = "";
  optionAll.textContent = UI_TEXT.labelAll;
  select.appendChild(optionAll);
  for (const item of items) {
    const option = document.createElement("option");
    option.value = getValue(item);
    option.textContent = getLabel(item);
    select.appendChild(option);
  }
  if (previousValue && items.some((item) => getValue(item) === previousValue)) {
    select.value = previousValue;
  }
}

function setTab(tab: "privileges" | "assignments" | "dashboard") {
  state.currentTab = tab;
  if (elements.tabPrivileges) {
    elements.tabPrivileges.classList.toggle("hidden", tab !== "privileges");
  }
  if (elements.tabAssignments) {
    elements.tabAssignments.classList.toggle("hidden", tab !== "assignments");
  }
  if (elements.tabDashboard) {
    elements.tabDashboard.classList.toggle("hidden", tab !== "dashboard");
  }
  if (elements.controlsPrivileges) {
    elements.controlsPrivileges.classList.toggle("hidden", tab !== "privileges");
  }
  if (elements.controlsAssignments) {
    elements.controlsAssignments.classList.toggle("hidden", tab !== "assignments");
  }
  if (elements.controlsDashboard) {
    elements.controlsDashboard.classList.toggle("hidden", tab !== "dashboard");
  }
  for (const button of elements.tabButtons) {
    button.classList.toggle("active", button.dataset.tab === tab);
  }
}

function setAssignmentMode(mode: AssignmentMode) {
  state.assignmentMode = mode;
  const showRole = mode === "role" || mode === "role-team";
  const showUser = mode === "user";
  const showTeam = mode === "team";
  if (elements.assignmentRoleControl) {
    elements.assignmentRoleControl.style.display = showRole ? "flex" : "none";
  }
  if (elements.assignmentUserControl) {
    elements.assignmentUserControl.style.display = showUser ? "flex" : "none";
  }
  if (elements.assignmentTeamControl) {
    elements.assignmentTeamControl.style.display = showTeam ? "flex" : "none";
  }
}

function setAssignmentStatus(text: string) {
  if (elements.assignmentStatus) {
    elements.assignmentStatus.textContent = text;
  }
}

function updateAssignmentSortIndicators() {
  for (const button of elements.assignmentSortButtons) {
    button.classList.remove("sort-asc", "sort-desc");
    if (button.dataset.assignSort === state.assignmentSort.column) {
      button.classList.add(
        state.assignmentSort.direction === "asc" ? "sort-asc" : "sort-desc",
      );
    }
  }
}

function mapTeamTypeLabel(teamType: number | null): string {
  switch (teamType) {
    case 0:
      return UI_TEXT.teamTypeOwner;
    case 1:
      return UI_TEXT.teamTypeAccess;
    default:
      return UI_TEXT.teamTypeDefault;
  }
}

function applyAssignmentSortAndFilter(items: AssignmentItem[]) {
  const filtered = items.filter((item) => {
    if (state.assignmentFilter === "assigned") {
      return item.assigned;
    }
    if (state.assignmentFilter === "not-assigned") {
      return !item.assigned;
    }
    if (state.assignmentSearch) {
      const rawTerm = state.assignmentSearch.toLowerCase();
      const term = rawTerm.replace(/\*/g, "").trim();
      if (term) {
        const labelMatch = item.label.toLowerCase().includes(term);
        const subLabelMatch = item.subLabel
          ? item.subLabel.toLowerCase().includes(term)
          : false;
        if (!labelMatch && !subLabelMatch) {
          return false;
        }
      }
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (state.assignmentSort.column === "label") {
      const cmp = a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
      return state.assignmentSort.direction === "asc" ? cmp : -cmp;
    }
    const aRank = a.assigned ? 1 : 2;
    const bRank = b.assigned ? 1 : 2;
    const diff = state.assignmentSort.direction === "asc" ? aRank - bRank : bRank - aRank;
    if (diff !== 0) {
      return diff;
    }
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
}

function renderAssignmentTable(items: AssignmentItem[]) {
  state.assignmentItems = items;
  const previouslySelected = new Set(state.selectedAssignmentIds);
  state.selectedAssignmentIds.clear();
  if (!elements.assignmentTableBody) {
    return;
  }
  elements.assignmentTableBody.innerHTML = "";
  const rows = applyAssignmentSortAndFilter(items);

  for (const item of rows) {
    const tr = document.createElement("tr");

    const labelCell = document.createElement("td");
    const label = document.createElement("div");
    label.textContent = item.label;
    labelCell.appendChild(label);
    if (item.subLabel) {
      const sub = document.createElement("div");
      sub.className = "assignment-subtitle";
      sub.textContent = item.subLabel;
      labelCell.appendChild(sub);
    }

    const statusCell = document.createElement("td");
    const status = document.createElement("div");
    status.className = "assignment-status-pill";
    status.textContent = item.assigned ? UI_TEXT.statusAssigned : UI_TEXT.statusNotAssigned;
    statusCell.appendChild(status);

    const selectCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = previouslySelected.has(item.id);
    if (checkbox.checked) {
      state.selectedAssignmentIds.add(item.id);
    }
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.selectedAssignmentIds.add(item.id);
      } else {
        state.selectedAssignmentIds.delete(item.id);
      }
      updateAssignmentSelectionUi();
    });
    selectCell.appendChild(checkbox);

    tr.appendChild(labelCell);
    tr.appendChild(statusCell);
    tr.appendChild(selectCell);
    elements.assignmentTableBody.appendChild(tr);
  }
  updateAssignmentSelectionUi();
}

function syncRoleFilterSelection() {
  const roleIds = new Set(state.roles.map((role) => role.id));
  if (state.selectedRoleIds.size === 0) {
    state.selectedRoleIds = new Set(roleIds);
  } else {
    for (const id of Array.from(state.selectedRoleIds)) {
      if (!roleIds.has(id)) {
        state.selectedRoleIds.delete(id);
      }
    }
    if (state.selectedRoleIds.size === 0) {
      state.selectedRoleIds = new Set(roleIds);
    }
  }
}

function updateRoleFilterLabel() {
  if (!elements.roleFilterButton) {
    return;
  }
  const total = state.roles.length;
  const selected = state.selectedRoleIds.size;
  if (selected === 0 || selected === total) {
    elements.roleFilterButton.textContent = UI_TEXT.roleFilterAll;
  } else {
    elements.roleFilterButton.textContent = formatRoleFilterSelected(selected);
  }
}

function renderRoleFilterOptions() {
  if (!elements.roleFilterList) {
    return;
  }
  elements.roleFilterList.innerHTML = "";
  const sortedRoles = [...state.roles].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  for (const role of sortedRoles) {
    const item = document.createElement("label");
    item.className = "multi-select-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.selectedRoleIds.has(role.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.selectedRoleIds.add(role.id);
      } else {
        state.selectedRoleIds.delete(role.id);
      }
      updateRoleFilterLabel();
      if (state.tableMode === "entity") {
        loadEntityCoverage(elements.entitySelect.value);
      }
    });
    const text = document.createElement("span");
    text.textContent = role.name;
    item.appendChild(checkbox);
    item.appendChild(text);
    elements.roleFilterList.appendChild(item);
  }
  updateRoleFilterLabel();
}

function setRoleFilterVisibility(show: boolean) {
  if (!elements.roleFilterControl) {
    return;
  }
  elements.roleFilterControl.style.display = show ? "flex" : "none";
}

function renderFilterOptions() {
  for (const select of elements.filterSelects) {
    if (select.id === "assignment-filter-assigned") {
      continue;
    }
    select.innerHTML = "";
    for (const optionData of FILTER_OPTIONS) {
      const option = document.createElement("option");
      option.value = optionData.value;
      option.textContent = optionData.label;
      select.appendChild(option);
    }
  }
}

function updateSortIndicators() {
  for (const button of elements.sortButtons) {
    button.classList.remove("sort-asc", "sort-desc");
    if (button.dataset.sort === state.sort.column) {
      button.classList.add(state.sort.direction === "asc" ? "sort-asc" : "sort-desc");
    }
  }
}

function isPrivilegeAvailable(row: PrivilegeRow, privilege: AccessRight): boolean {
  return Boolean(state.privilegeIdByKey.get(`${row.entityLogicalName}:${privilege}`));
}

function hasAnyRights(row: PrivilegeRow): boolean {
  return accessRights.some((privilege) => {
    if (!isPrivilegeAvailable(row, privilege)) {
      return false;
    }
    return row[privilege] !== "none";
  });
}

function getCurrentPrivilegeLevel(
  roleId: string,
  entityLogicalName: string,
  privilege: AccessRight,
): PrivilegeLevel {
  const roleMap = state.rolePrivileges.get(roleId);
  const record = roleMap?.get(entityLogicalName);
  return record?.[privilege] ?? "none";
}

function findPendingChange(
  roleId: string,
  entityLogicalName: string,
  privilege: AccessRight,
): PendingChange | undefined {
  return state.pendingChanges.find(
    (change) =>
      change.roleId === roleId &&
      change.entityLogicalName === entityLogicalName &&
      change.privilege === privilege,
  );
}

function updatePendingChange(
  roleId: string,
  entityLogicalName: string,
  privilege: AccessRight,
  level: PrivilegeLevel,
): boolean {
  const currentLevel = getCurrentPrivilegeLevel(roleId, entityLogicalName, privilege);
  const existing = findPendingChange(roleId, entityLogicalName, privilege);
  if (level === currentLevel) {
    if (existing) {
      state.pendingChanges = state.pendingChanges.filter((change) => change !== existing);
    }
    updatePendingUi();
    return false;
  }
  if (existing) {
    existing.level = level;
  } else {
    state.pendingChanges.push({
      roleId,
      entityLogicalName,
      privilege,
      level,
    });
  }
  updatePendingUi();
  return true;
}

function setPendingClass(select: HTMLSelectElement, isPending: boolean) {
  select.classList.toggle("pending-change", isPending);
}

function getPrivilegeSortRank(level: PrivilegeLevel, available: boolean, direction: SortDirection): number {
  if (!available) {
    return 99;
  }
  const ascRank: Record<PrivilegeLevel, number> = {
    user: 1,
    businessUnit: 2,
    parentChild: 3,
    organization: 4,
    none: 5,
  };
  const descRank: Record<PrivilegeLevel, number> = {
    none: 1,
    organization: 2,
    parentChild: 3,
    businessUnit: 4,
    user: 5,
  };
  return direction === "asc" ? ascRank[level] : descRank[level];
}

function applySortAndFilters(rows: PrivilegeRow[]): PrivilegeRow[] {
  const filtered = rows.filter((row) => {
    if (state.rightsFilter === "with" && !hasAnyRights(row)) {
      return false;
    }
    if (state.rightsFilter === "without" && hasAnyRights(row)) {
      return false;
    }
    for (const privilege of accessRights) {
      const filterValue = state.filters[privilege];
      if (!filterValue) {
        continue;
      }
      const available = isPrivilegeAvailable(row, privilege);
      if (filterValue === "notAvailable") {
        if (available) {
          return false;
        }
        continue;
      }
      if (!available) {
        return false;
      }
      if (row[privilege] !== filterValue) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (state.sort.column === "label") {
      const cmp = a.entityLabel.localeCompare(b.entityLabel, undefined, { sensitivity: "base" });
      return state.sort.direction === "asc" ? cmp : -cmp;
    }
    const privilege = state.sort.column;
    const aAvailable = isPrivilegeAvailable(a, privilege);
    const bAvailable = isPrivilegeAvailable(b, privilege);
    const aRank = getPrivilegeSortRank(a[privilege], aAvailable, state.sort.direction);
    const bRank = getPrivilegeSortRank(b[privilege], bAvailable, state.sort.direction);
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return a.entityLabel.localeCompare(b.entityLabel, undefined, { sensitivity: "base" });
  });

  return sorted;
}

function renderPrivilegeTable() {
  elements.privilegesTable.innerHTML = "";
  const isRoleMode = state.tableMode === "role";
  const rows = applySortAndFilters(state.privilegeRows);

  if (elements.tableEmpty) {
    elements.tableEmpty.classList.toggle("hidden", state.cacheLoaded);
  }

  const tableElement = elements.privilegesTable.closest("table");
  if (tableElement) {
    tableElement.classList.toggle("hide-ownership", !isRoleMode);
  }

  for (const row of rows) {
    const tr = document.createElement("tr");
    const entityCell = document.createElement("td");
    const labelSpan = document.createElement("span");
    labelSpan.textContent = row.entityLabel;
    if (isRoleMode) {
      labelSpan.title = row.entityLogicalName;
    }
    entityCell.appendChild(labelSpan);
    tr.appendChild(entityCell);

    const ownershipCell = document.createElement("td");
    ownershipCell.textContent = row.ownershipLabel || UI_TEXT.tableCellEmpty;
    ownershipCell.className = "ownership";
    tr.appendChild(ownershipCell);

    for (const privilege of accessRights) {
      const td = document.createElement("td");
      const privilegeId = state.privilegeIdByKey.get(`${row.entityLogicalName}:${privilege}`);
      if (!privilegeId) {
        td.textContent = UI_TEXT.tableCellEmpty;
        tr.appendChild(td);
        continue;
      }

      const info = state.privilegeInfoById.get(privilegeId);
      const allowedLevels: PrivilegeLevel[] = ["none"];
      if (info?.canBeBasic) {
        allowedLevels.push("user");
      }
      if (info?.canBeLocal) {
        allowedLevels.push("businessUnit");
      }
      if (info?.canBeDeep) {
        allowedLevels.push("parentChild");
      }
      if (info?.canBeGlobal) {
        allowedLevels.push("organization");
      }

      const select = document.createElement("select");
      select.className = "level-select";
      select.dataset.entityLogicalName = row.entityLogicalName;
      select.dataset.privilege = privilege;
      if (isRoleMode) {
        select.dataset.roleId = elements.roleSelect.value;
      } else if (row.roleId) {
        select.dataset.roleId = row.roleId;
      }
      for (const optionMeta of levelOptions) {
        if (!allowedLevels.includes(optionMeta.level)) {
          continue;
        }
        const option = document.createElement("option");
        option.value = optionMeta.level;
        option.textContent = `${optionMeta.icon} ${optionMeta.label}`;
        option.className = optionMeta.className;
        option.style.color = getLevelColor(optionMeta.level);
        if (row[privilege] === optionMeta.level) {
          option.selected = true;
        }
        select.appendChild(option);
      }
      select.addEventListener("change", () => {
        const roleId = isRoleMode ? elements.roleSelect.value : row.roleId;
        if (!roleId) {
          return;
        }
        const level = select.value as PrivilegeLevel;
        const isPending = updatePendingChange(roleId, row.entityLogicalName, privilege, level);
        setPendingClass(select, isPending);
      });
      select.disabled = !isRoleMode && !row.roleId;
      applyLevelClass(select, select.value as PrivilegeLevel);
      select.addEventListener("change", () => {
        applyLevelClass(select, select.value as PrivilegeLevel);
      });
      if (select.dataset.roleId) {
        const pending = Boolean(
          findPendingChange(select.dataset.roleId, row.entityLogicalName, privilege),
        );
        setPendingClass(select, pending);
      }
      td.appendChild(select);
      tr.appendChild(td);
    }

    elements.privilegesTable.appendChild(tr);
  }

  updatePendingUi();
}

function setFilterMode(mode: FilterMode) {
  state.filterMode = mode;
  const isRole = mode === "role";
  if (elements.roleSelectControl) {
    elements.roleSelectControl.style.display = isRole ? "flex" : "none";
  }
  if (elements.entitySelectControl) {
    elements.entitySelectControl.style.display = isRole ? "none" : "flex";
  }
  setRoleFilterVisibility(!isRole);
}

function updateConnectionBadge(name: string) {
  elements.connectionBadge.textContent = name || UI_TEXT.connectionNotConnected;
}

function setTheme(theme: "light" | "dark") {
  document.body.classList.remove("theme-light", "theme-dark");
  document.body.classList.add(`theme-${theme}`);
  if (elements.themeToggle) {
    const label =
      theme === "dark" ? UI_TEXT.themeSwitchToLight : UI_TEXT.themeSwitchToDark;
    elements.themeToggle.setAttribute("aria-label", label);
    elements.themeToggle.title = label;
  }
}

async function applyTheme() {
  const theme = await toolboxAPI.utils.getCurrentTheme();
  setTheme(theme);
}

async function loadRoles(force = false) {
  if (!force && state.allRoles.length > 0) {
    applyRoleFilterToUi();
    return;
  }
  state.allRoles = await fetchRoles(false);
  applyRoleFilterToUi();
}

async function loadEntities() {
  const response = await dataverseAPI.getAllEntitiesMetadata([
    "LogicalName",
    "DisplayName",
    "OwnershipType",
  ]);
  state.entities = response.value
    .filter((entity: any) => entity.LogicalName)
    .map((entity: any) => ({
      logicalName: entity.LogicalName,
      displayName: entity.DisplayName?.UserLocalizedLabel?.Label ?? entity.LogicalName,
      ownershipLabel: mapOwnershipLabel(entity.OwnershipType),
    }));
  renderSelectOptions(
    elements.entitySelect,
    state.entities,
    (item) => item.logicalName,
    (item) => item.displayName,
  );
}

async function loadUsers() {
  state.users = await fetchUsers();
  renderSelectOptionsWithSelection(
    elements.assignmentUserSelect,
    state.users,
    (item) => item.id,
    (item) => item.name,
  );
  state.usersLoaded = true;
}

async function loadTeams() {
  state.teams = await fetchTeams();
  renderSelectOptionsWithSelection(
    elements.assignmentTeamSelect,
    state.teams,
    (item) => item.id,
    (item) => item.name,
  );
  state.teamsLoaded = true;
}

async function resolveRoleForUser(rootRoleId: string, businessUnitId: string): Promise<string | null> {
  if (!businessUnitId) {
    return null;
  }
  const cacheKey = `${rootRoleId}:${businessUnitId}`;
  const cached = state.roleByRootAndBu.get(cacheKey);
  if (cached) {
    return cached;
  }
  const roleId = await resolveRoleForBusinessUnit(rootRoleId, businessUnitId);
  if (roleId) {
    state.roleByRootAndBu.set(cacheKey, roleId);
  }
  return roleId;
}

async function resolveRoleForTeam(rootRoleId: string, businessUnitId: string): Promise<string | null> {
  if (!businessUnitId) {
    return null;
  }
  const cacheKey = `${rootRoleId}:${businessUnitId}`;
  const cached = state.teamByRootAndBu.get(cacheKey);
  if (cached) {
    return cached;
  }
  const roleId = await resolveRoleForBusinessUnit(rootRoleId, businessUnitId);
  if (roleId) {
    state.teamByRootAndBu.set(cacheKey, roleId);
  }
  return roleId;
}

function mapPrivilegeLevel(raw: number): PrivilegeLevel {
  switch (raw) {
    case 1:
      return "user";
    case 2:
      return "businessUnit";
    case 4:
      return "parentChild";
    case 8:
      return "organization";
    default:
      return "none";
  }
}

function mapPrivilegeLevelFromDepth(depth: unknown): PrivilegeLevel {
  if (typeof depth === "string") {
    switch (depth.toLowerCase()) {
      case "basic":
      case "user":
        return "user";
      case "local":
      case "businessunit":
        return "businessUnit";
      case "deep":
      case "parentchild":
        return "parentChild";
      case "global":
      case "organization":
        return "organization";
      default:
        return "none";
    }
  }
  if (typeof depth === "number") {
    return mapPrivilegeLevel(depth);
  }
  return "none";
}

function mapPrivilegeDepthLabel(level: PrivilegeLevel): string {
  switch (level) {
    case "user":
      return "Basic";
    case "businessUnit":
      return "Local";
    case "parentChild":
      return "Deep";
    case "organization":
      return "Global";
    default:
      return "None";
  }
}

function mapOwnershipLabel(raw: any): string {
  if (!raw) {
    return UI_TEXT.ownershipUnknown;
  }
  const value = typeof raw === "object" && "Value" in raw ? raw.Value : raw;
  if (typeof value === "string") {
    switch (value.toLowerCase()) {
      case "userowned":
        return UI_TEXT.ownershipUserTeam;
      case "organizationowned":
        return UI_TEXT.ownershipOrganization;
      case "businessowned":
        return UI_TEXT.ownershipBusinessUnit;
      default:
        return value;
    }
  }
  if (typeof value === "number") {
    switch (value) {
      case 0:
        return UI_TEXT.ownershipUserTeam;
      case 1:
        return UI_TEXT.ownershipBusinessUnit;
      case 2:
        return UI_TEXT.ownershipOrganization;
      default:
        return UI_TEXT.ownershipUnknown;
    }
  }
  return UI_TEXT.ownershipUnknown;
}

function getLevelColor(level: PrivilegeLevel): string {
  return levelColorMap[level] ?? levelColorMap.none;
}

function applyLevelClass(select: HTMLSelectElement, level: PrivilegeLevel) {
  select.classList.remove(
    "level-none",
    "level-user",
    "level-businessUnit",
    "level-parentChild",
    "level-organization",
  );
  select.classList.add(`level-${level}`);
}

function mapAccessFromName(name: string): { access: AccessRight; entityLogicalName: string } | null {
  const prefixes: Array<{ prefix: string; access: AccessRight }> = [
    { prefix: "prvCreate", access: "create" },
    { prefix: "prvRead", access: "read" },
    { prefix: "prvWrite", access: "write" },
    { prefix: "prvDelete", access: "delete" },
    { prefix: "prvAppendTo", access: "appendto" },
    { prefix: "prvAppend", access: "append" },
    { prefix: "prvAssign", access: "assign" },
  ];

  for (const { prefix, access } of prefixes) {
    if (name.startsWith(prefix)) {
      const suffix = name.slice(prefix.length);
      if (!suffix) {
        return null;
      }
      return {
        access,
        entityLogicalName: suffix.toLowerCase(),
      };
    }
  }

  return null;
}

function ensureRolePrivilegeRecord(
  roleMap: Map<string, Record<AccessRight, PrivilegeLevel>>,
  entityLogicalName: string,
) {
  if (!roleMap.has(entityLogicalName)) {
    roleMap.set(entityLogicalName, {
      create: "none",
      read: "none",
      write: "none",
      delete: "none",
      append: "none",
      appendto: "none",
      assign: "none",
    });
  }
  return roleMap.get(entityLogicalName)!;
}

async function executeParallel<T>(tasks: Array<Promise<T>>): Promise<T[]> {
  if (toolboxAPI?.utils?.executeParallel) {
    return toolboxAPI.utils.executeParallel(...tasks);
  }
  return Promise.all(tasks);
}

async function loadRoleAssignmentCounts(
  kind: "users" | "teams",
  roles: RoleSummary[] = state.allRoles,
  activeUserIds?: Set<string>,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (kind === "users") {
    await ensureUserRoleAssignmentsLoaded();
    for (const role of roles) {
      const assigned = state.assignmentUsersByRole.get(role.id) ?? new Set<string>();
      if (!activeUserIds) {
        counts.set(role.id, assigned.size);
        continue;
      }
      let total = 0;
      for (const userId of assigned) {
        if (activeUserIds.has(userId)) {
          total += 1;
        }
      }
      counts.set(role.id, total);
    }
    return counts;
  }

  await ensureTeamRoleAssignmentsLoaded();
  for (const role of roles) {
    const assigned = state.assignmentTeamsByRole.get(role.id) ?? new Set<string>();
    counts.set(role.id, assigned.size);
  }
  return counts;
}

async function loadUserAssignmentCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  await ensureUserRoleAssignmentsLoaded();
  for (const user of state.users) {
    counts.set(user.id, state.assignmentRolesByUser.get(user.id)?.size ?? 0);
  }
  return counts;
}

async function loadTeamAssignmentCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  await ensureTeamRoleAssignmentsLoaded();
  for (const team of state.teams) {
    counts.set(team.id, state.assignmentRolesByTeam.get(team.id)?.size ?? 0);
  }
  return counts;
}

function renderAssignmentRoleOptionsWithCounts(unitLabel: string, counts: Map<string, number>) {
  renderSelectOptionsWithSelection(
    elements.assignmentRoleSelect,
    state.roles,
    (item) => item.id,
    (item) => formatAssignmentSelectLabel(item.name, counts.get(item.id) ?? 0, unitLabel),
  );
}

function renderAssignmentUserOptionsWithCounts(unitLabel: string, counts: Map<string, number>) {
  renderSelectOptionsWithSelection(
    elements.assignmentUserSelect,
    state.users,
    (item) => item.id,
    (item) => formatAssignmentSelectLabel(item.name, counts.get(item.id) ?? 0, unitLabel),
  );
}

function renderAssignmentTeamOptionsWithCounts(unitLabel: string, counts: Map<string, number>) {
  renderSelectOptionsWithSelection(
    elements.assignmentTeamSelect,
    state.teams,
    (item) => item.id,
    (item) => formatAssignmentSelectLabel(item.name, counts.get(item.id) ?? 0, unitLabel),
  );
}

async function getAssignedUsersForRoleCached(roleId: string): Promise<Set<string>> {
  await ensureUserRoleAssignmentsLoaded();
  return state.assignmentUsersByRole.get(roleId) ?? new Set();
}

async function getAssignedRolesForUserCached(userId: string): Promise<Set<string>> {
  await ensureUserRoleAssignmentsLoaded();
  return state.assignmentRolesByUser.get(userId) ?? new Set();
}

async function getAssignedTeamsForRoleCached(roleId: string): Promise<Set<string>> {
  await ensureTeamRoleAssignmentsLoaded();
  return state.assignmentTeamsByRole.get(roleId) ?? new Set();
}

async function getAssignedRolesForTeamCached(teamId: string): Promise<Set<string>> {
  await ensureTeamRoleAssignmentsLoaded();
  return state.assignmentRolesByTeam.get(teamId) ?? new Set();
}

async function ensureDashboardDataLoaded() {
  if (state.dashboardLoaded) {
    return;
  }
  if (state.dashboardLoading && state.dashboardPromise) {
    return state.dashboardPromise;
  }
  state.dashboardLoading = true;
  setDashboardLoading(true, UI_TEXT.loadingDashboardData);
  state.dashboardPromise = (async () => {
    try {
      const totalSteps = 5;
      let currentStep = 0;

      setDashboardLoadingProgress(
        ++currentStep,
        totalSteps,
        UI_TEXT.loadingDashboardRolesTeams,
      );
      await Promise.all([
        state.roles.length ? Promise.resolve() : loadRoles(),
        state.teamsLoaded ? Promise.resolve() : loadTeams(),
      ]);

      setDashboardLoadingProgress(++currentStep, totalSteps, UI_TEXT.loadingDashboardPeople);
      const [users, businessUnits, teamMemberships] = await Promise.all([
        loadUsersForDashboard(),
        loadBusinessUnits(),
        loadTeamMemberships(),
      ]);
      state.dashboardUsers = users;
      state.dashboardBusinessUnits = businessUnits;
      state.dashboardTeamMemberships = teamMemberships;

      setDashboardLoadingProgress(
        ++currentStep,
        totalSteps,
        UI_TEXT.loadingDashboardRoleUserCounts,
      );
      if (state.assignmentRoleUserCounts.size !== state.allRoles.length) {
        const activeUserIds = new Set(
          state.dashboardUsers.filter((user) => isActiveUser(user)).map((user) => user.id),
        );
        state.assignmentRoleUserCounts = await loadRoleAssignmentCounts(
          "users",
          state.allRoles,
          activeUserIds,
        );
      }

      setDashboardLoadingProgress(
        ++currentStep,
        totalSteps,
        UI_TEXT.loadingDashboardRoleTeamCounts,
      );
      if (state.assignmentRoleTeamCounts.size !== state.allRoles.length) {
        state.assignmentRoleTeamCounts = await loadRoleAssignmentCounts(
          "teams",
          state.allRoles,
        );
      }
      state.dashboardRoleUserCounts = new Map(state.assignmentRoleUserCounts);
      state.dashboardRoleTeamCounts = new Map(state.assignmentRoleTeamCounts);

      setDashboardLoadingProgress(
        ++currentStep,
        totalSteps,
        UI_TEXT.loadingDashboardFilters,
      );
      renderSelectOptionsWithAll(
        elements.dashboardBusinessUnitSelect,
        state.dashboardBusinessUnits,
        (item) => item.id,
        (item) => item.name,
      );
      renderSelectOptionsWithAll(
        elements.dashboardRoleSelect,
        state.roles,
        (item) => item.id,
        (item) => item.name,
      );
      renderSelectOptionsWithAll(
        elements.dashboardTeamSelect,
        state.teams,
        (item) => item.id,
        (item) => item.name,
      );
      state.dashboardLoaded = true;
    } catch (error) {
      console.error(error);
      logMessage(UI_TEXT.logDashboardLoadFailed);
    } finally {
      state.dashboardLoading = false;
      state.dashboardPromise = null;
      setDashboardLoading(false);
    }
  })();
  return state.dashboardPromise;
}

function buildFilteredDashboardUsers(): DashboardUser[] {
  const status = elements.dashboardUserStatus?.value ?? "all";
  const userType = elements.dashboardUserType?.value ?? "all";
  const businessUnitId = elements.dashboardBusinessUnitSelect?.value ?? "";
  const teamId = elements.dashboardTeamSelect?.value ?? "";
  const roleFilterId = elements.dashboardRoleSelect?.value ?? "";
  let teamUserIds: Set<string> | null = null;
  if (teamId) {
    teamUserIds = new Set(
      state.dashboardTeamMemberships
        .filter((membership) => membership.teamId === teamId)
        .map((membership) => membership.userId),
    );
  }
  const roleUserIds = roleFilterId
    ? state.assignmentUsersByRole.get(roleFilterId) ?? new Set<string>()
    : null;
  return state.dashboardUsers.filter((user) => {
    const active = isActiveUser(user);
    if (status === "active" && !active) {
      return false;
    }
    if (status === "inactive" && active) {
      return false;
    }
    const isApp = isApplicationUser(user);
    if (userType === "human" && isApp) {
      return false;
    }
    if (userType === "app" && !isApp) {
      return false;
    }
    if (businessUnitId && user.businessUnitId !== businessUnitId) {
      return false;
    }
    if (teamUserIds && !teamUserIds.has(user.id)) {
      return false;
    }
    if (roleUserIds && !roleUserIds.has(user.id)) {
      return false;
    }
    return true;
  });
}

function buildFilteredUserTypeSets() {
  const filteredUsers = buildFilteredDashboardUsers();
  const humanIds = new Set<string>();
  const appIds = new Set<string>();
  for (const user of filteredUsers) {
    if (isApplicationUser(user)) {
      appIds.add(user.id);
    } else {
      humanIds.add(user.id);
    }
  }
  return { filteredUsers, humanIds, appIds };
}

function updateDashboardMetrics() {
  const users = state.dashboardUsers;
  const humanUsers = users.filter((user) => !isApplicationUser(user));
  const appUsers = users.filter((user) => isApplicationUser(user));
  const humanActive = humanUsers.filter((user) => isActiveUser(user)).length;
  const humanInactive = humanUsers.length - humanActive;
  const appActive = appUsers.filter((user) => isActiveUser(user)).length;
  const appInactive = appUsers.length - appActive;

  if (elements.metricHumanActive) {
    elements.metricHumanActive.textContent = `${humanActive}`;
  }
  if (elements.metricHumanInactive) {
    elements.metricHumanInactive.textContent = `${humanInactive}`;
  }
  if (elements.metricAppActive) {
    elements.metricAppActive.textContent = `${appActive}`;
  }
  if (elements.metricAppInactive) {
    elements.metricAppInactive.textContent = `${appInactive}`;
  }

  const managedRoles = state.roles.filter((role) => role.isManaged).length;
  const customRoles = state.roles.length - managedRoles;
  const rolesWithoutUsers = state.roles.filter(
    (role) => (state.dashboardRoleUserCounts.get(role.id) ?? 0) === 0,
  ).length;

  if (elements.metricCustomRoles) {
    elements.metricCustomRoles.textContent = `${customRoles}`;
  }
  if (elements.metricManagedRoles) {
    elements.metricManagedRoles.textContent = `${managedRoles}`;
  }
  if (elements.metricRolesWithoutUsers) {
    elements.metricRolesWithoutUsers.textContent = `${rolesWithoutUsers}`;
  }
  if (elements.metricTotalTeams) {
    elements.metricTotalTeams.textContent = `${state.teams.length}`;
  }
}

function buildRoleUserTypeChartData(
  roleFilterId: string | null,
  roles: RoleSummary[],
  humanIds: Set<string>,
  appIds: Set<string>,
  maxRoles: number | null,
) {
  const roleTotals = new Map<string, number>();
  const roleHuman = new Map<string, number>();
  const roleApp = new Map<string, number>();
  for (const role of roles) {
    const assigned = state.assignmentUsersByRole.get(role.id) ?? new Set<string>();
    let humanCount = 0;
    let appCount = 0;
    for (const userId of assigned) {
      if (humanIds.has(userId)) {
        humanCount += 1;
      } else if (appIds.has(userId)) {
        appCount += 1;
      }
    }
    roleHuman.set(role.id, humanCount);
    roleApp.set(role.id, appCount);
    roleTotals.set(role.id, humanCount + appCount);
  }

  if (roleFilterId) {
    const role = roles.find((item) => item.id === roleFilterId);
    const total = role ? (roleTotals.get(role.id) ?? 0) : 0;
    if (!role || total === 0) {
      return { labels: [], human: [], app: [] };
    }
    return {
      labels: [role.name],
      human: [roleHuman.get(role.id) ?? 0],
      app: [roleApp.get(role.id) ?? 0],
    };
  }

  const sortedRoles = [...roles]
    .filter((role) => (roleTotals.get(role.id) ?? 0) > 0)
    .sort((a, b) => (roleTotals.get(b.id) ?? 0) - (roleTotals.get(a.id) ?? 0));
  let visibleRoles = maxRoles ? sortedRoles.slice(0, maxRoles) : sortedRoles;

  return {
    labels: visibleRoles.map((role) => role.name),
    human: visibleRoles.map((role) => roleHuman.get(role.id) ?? 0),
    app: visibleRoles.map((role) => roleApp.get(role.id) ?? 0),
  };
}

function buildRoleTotalChartData(
  counts: Map<string, number>,
  roleFilterId: string | null,
  roles: RoleSummary[],
  maxRoles: number | null,
) {
  const sortedRoles = [...roles]
    .filter((role) => (counts.get(role.id) ?? 0) > 0)
    .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  if (roleFilterId) {
    const role = roles.find((item) => item.id === roleFilterId);
    if (!role || (counts.get(role.id) ?? 0) === 0) {
      return { labels: [], values: [] };
    }
    return { labels: [role.name], values: [counts.get(role.id) ?? 0] };
  }
  const visibleRoles = sortedRoles.slice(0, maxRoles ?? sortedRoles.length);
  return {
    labels: visibleRoles.map((role) => role.name),
    values: visibleRoles.map((role) => counts.get(role.id) ?? 0),
  };
}

function buildUsersByBusinessUnitData(filteredUsers: DashboardUser[], maxRoles: number | null) {
  const humanCounts = new Map<string, number>();
  const appCounts = new Map<string, number>();
  for (const user of filteredUsers) {
    if (!user.businessUnitId) {
      continue;
    }
    if (isApplicationUser(user)) {
      appCounts.set(user.businessUnitId, (appCounts.get(user.businessUnitId) ?? 0) + 1);
    } else {
      humanCounts.set(user.businessUnitId, (humanCounts.get(user.businessUnitId) ?? 0) + 1);
    }
  }
  const units = state.dashboardBusinessUnits
    .map((unit) => ({
      unit,
      total: (humanCounts.get(unit.id) ?? 0) + (appCounts.get(unit.id) ?? 0),
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total);
  const visibleUnits = maxRoles ? units.slice(0, maxRoles) : units;
  return {
    labels: visibleUnits.map((entry) => entry.unit.name),
    human: visibleUnits.map((entry) => humanCounts.get(entry.unit.id) ?? 0),
    app: visibleUnits.map((entry) => appCounts.get(entry.unit.id) ?? 0),
  };
}

function buildUsersByTeamData(filteredUsers: DashboardUser[], maxRoles: number | null) {
  const humanIds = new Set<string>();
  const appIds = new Set<string>();
  for (const user of filteredUsers) {
    if (isApplicationUser(user)) {
      appIds.add(user.id);
    } else {
      humanIds.add(user.id);
    }
  }

  const humanCounts = new Map<string, number>();
  const appCounts = new Map<string, number>();
  for (const membership of state.dashboardTeamMemberships) {
    if (humanIds.has(membership.userId)) {
      humanCounts.set(membership.teamId, (humanCounts.get(membership.teamId) ?? 0) + 1);
      continue;
    }
    if (appIds.has(membership.userId)) {
      appCounts.set(membership.teamId, (appCounts.get(membership.teamId) ?? 0) + 1);
    }
  }

  const teamFilterId = elements.dashboardTeamSelect?.value ?? "";
  const teams = [...state.teams]
    .map((team) => ({
      team,
      human: humanCounts.get(team.id) ?? 0,
      app: appCounts.get(team.id) ?? 0,
    }))
    .filter((entry) => entry.human > 0 || entry.app > 0);
  const filteredTeams = teamFilterId
    ? teams.filter((entry) => entry.team.id === teamFilterId)
    : teams
        .sort((a, b) => (b.human + b.app) - (a.human + a.app))
        .slice(0, maxRoles ?? teams.length);
  return {
    labels: filteredTeams.map((entry) => entry.team.name),
    human: filteredTeams.map((entry) => entry.human),
    app: filteredTeams.map((entry) => entry.app),
  };
}

function buildTeamsByRoleCounts(
  businessUnitId: string,
  teamId: string,
): Map<string, number> {
  if (!businessUnitId && !teamId) {
    return state.dashboardRoleTeamCounts;
  }

  const counts = new Map<string, number>();
  const filteredTeams = state.teams.filter((team) => {
    if (businessUnitId && team.businessUnitId !== businessUnitId) {
      return false;
    }
    if (teamId && team.id !== teamId) {
      return false;
    }
    return true;
  });

  for (const team of filteredTeams) {
    const roles = state.assignmentRolesByTeam.get(team.id) ?? new Set<string>();
    for (const roleId of roles) {
      counts.set(roleId, (counts.get(roleId) ?? 0) + 1);
    }
  }

  return counts;
}

function renderOrUpdateBarChart(
  chart: Chart | null,
  canvas: HTMLCanvasElement | null,
  labels: string[],
  datasets: Array<{ label: string; data: number[]; backgroundColor: string }>,
  stacked = false,
): Chart | null {
  if (!canvas) {
    return chart;
  }
  if (!chart) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return chart;
    }
    return new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: datasets.map((dataset) => ({
          ...dataset,
          borderRadius: stacked ? 0 : 6,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
        scales: {
          x: {
            stacked,
            ticks: {
              maxRotation: 60,
              minRotation: 30,
            },
          },
          y: {
            beginAtZero: true,
            stacked,
          },
        },
      },
    });
  }
  chart.data.labels = labels;
  chart.data.datasets = datasets.map((dataset) => ({
    ...dataset,
    borderRadius: stacked ? 0 : 6,
  }));
  if (chart.options?.scales && "x" in chart.options.scales) {
    const xScale = chart.options.scales.x;
    if (xScale) {
      (xScale as { stacked?: boolean }).stacked = stacked;
    }
  }
  if (chart.options?.scales && "y" in chart.options.scales) {
    const yScale = chart.options.scales.y;
    if (yScale) {
      (yScale as { stacked?: boolean }).stacked = stacked;
    }
  }
  chart.update();
  return chart;
}

function setChartEmptyState(canvas: HTMLCanvasElement | null, isEmpty: boolean) {
  if (!canvas) {
    return;
  }
  const card = canvas.closest(".chart-card");
  if (!card) {
    return;
  }
  let empty = card.querySelector(".chart-empty") as HTMLDivElement | null;
  if (!empty) {
    empty = document.createElement("div");
    empty.className = "chart-empty";
    empty.textContent = UI_TEXT.chartEmpty;
    card.appendChild(empty);
  }
  empty.classList.toggle("hidden", !isEmpty);
  canvas.style.display = isEmpty ? "none" : "block";
}

function setModalEmptyState(isEmpty: boolean) {
  if (!elements.chartModalBody || !elements.chartModalCanvas) {
    return;
  }
  let empty = elements.chartModalBody.querySelector(".chart-empty") as HTMLDivElement | null;
  if (!empty) {
    empty = document.createElement("div");
    empty.className = "chart-empty";
    empty.textContent = UI_TEXT.chartEmpty;
    elements.chartModalBody.appendChild(empty);
  }
  empty.classList.toggle("hidden", !isEmpty);
  elements.chartModalCanvas.style.display = isEmpty ? "none" : "block";
}

function updateDashboardCharts() {
  const roleFilterId = elements.dashboardRoleSelect?.value ?? "";
  const businessUnitId = elements.dashboardBusinessUnitSelect?.value ?? "";
  const teamFilterId = elements.dashboardTeamSelect?.value ?? "";
  const { filteredUsers, humanIds, appIds } = buildFilteredUserTypeSets();
  const maxRoles = 12;
  const usersByRoleData = buildRoleUserTypeChartData(
    roleFilterId || null,
    state.roles,
    humanIds,
    appIds,
    maxRoles,
  );
  state.dashboardCharts.usersByRole = renderOrUpdateBarChart(
    state.dashboardCharts.usersByRole,
    elements.chartUsersByRole,
    usersByRoleData.labels,
    [
      { label: "Human users", data: usersByRoleData.human, backgroundColor: "#d35400" },
      { label: "Application users", data: usersByRoleData.app, backgroundColor: "#f39c4a" },
    ],
    true,
  );
  setChartEmptyState(elements.chartUsersByRole, usersByRoleData.labels.length === 0);

  const teamsByRoleCounts = buildTeamsByRoleCounts(businessUnitId, teamFilterId);
  const teamsByRoleData = buildRoleTotalChartData(
    teamsByRoleCounts,
    roleFilterId || null,
    state.roles,
    maxRoles,
  );
  state.dashboardCharts.teamsByRole = renderOrUpdateBarChart(
    state.dashboardCharts.teamsByRole,
    elements.chartTeamsByRole,
    teamsByRoleData.labels,
    [
      { label: "Teams", data: teamsByRoleData.values, backgroundColor: "#1f7a8c" },
    ],
  );
  setChartEmptyState(elements.chartTeamsByRole, teamsByRoleData.labels.length === 0);

  const usersByBuData = buildUsersByBusinessUnitData(filteredUsers, maxRoles);
  state.dashboardCharts.usersByBusinessUnit = renderOrUpdateBarChart(
    state.dashboardCharts.usersByBusinessUnit,
    elements.chartUsersByBusinessUnit,
    usersByBuData.labels,
    [
      { label: "Human users", data: usersByBuData.human, backgroundColor: "#d35400" },
      { label: "Application users", data: usersByBuData.app, backgroundColor: "#f39c4a" },
    ],
    true,
  );
  setChartEmptyState(elements.chartUsersByBusinessUnit, usersByBuData.labels.length === 0);

  const usersByTeamData = buildUsersByTeamData(filteredUsers, maxRoles);
  state.dashboardCharts.usersByTeam = renderOrUpdateBarChart(
    state.dashboardCharts.usersByTeam,
    elements.chartUsersByTeam,
    usersByTeamData.labels,
    [
      { label: "Human users", data: usersByTeamData.human, backgroundColor: "#d35400" },
      { label: "Application users", data: usersByTeamData.app, backgroundColor: "#f39c4a" },
    ],
    true,
  );
  setChartEmptyState(elements.chartUsersByTeam, usersByTeamData.labels.length === 0);
}

type DashboardChartKind = "usersByRole" | "teamsByRole" | "usersByBusinessUnit" | "usersByTeam";

function getDashboardChartData(kind: DashboardChartKind, maxRoles: number | null) {
  const roleFilterId = elements.dashboardRoleSelect?.value ?? "";
  const businessUnitId = elements.dashboardBusinessUnitSelect?.value ?? "";
  const teamFilterId = elements.dashboardTeamSelect?.value ?? "";
  const { filteredUsers, humanIds, appIds } = buildFilteredUserTypeSets();

  switch (kind) {
    case "usersByRole": {
      const data = buildRoleUserTypeChartData(
        roleFilterId || null,
        state.roles,
        humanIds,
        appIds,
        maxRoles,
      );
      return {
        title: "Active users per role",
        labels: data.labels,
        stacked: true,
        datasets: [
          { label: "Human users", data: data.human, backgroundColor: "#d35400" },
          { label: "Application users", data: data.app, backgroundColor: "#f39c4a" },
        ],
      };
    }
    case "teamsByRole": {
      const teamsByRoleCounts = buildTeamsByRoleCounts(businessUnitId, teamFilterId);
      const data = buildRoleTotalChartData(
        teamsByRoleCounts,
        roleFilterId || null,
        state.roles,
        maxRoles,
      );
      return {
        title: "Teams per role",
        labels: data.labels,
        stacked: false,
        datasets: [{ label: "Teams", data: data.values, backgroundColor: "#1f7a8c" }],
      };
    }
    case "usersByBusinessUnit": {
      const data = buildUsersByBusinessUnitData(filteredUsers, maxRoles);
      return {
        title: "Users per business unit",
        labels: data.labels,
        stacked: true,
        datasets: [
          { label: "Human users", data: data.human, backgroundColor: "#d35400" },
          { label: "Application users", data: data.app, backgroundColor: "#f39c4a" },
        ],
      };
    }
    case "usersByTeam": {
      const data = buildUsersByTeamData(filteredUsers, maxRoles);
      return {
        title: "Users per team",
        labels: data.labels,
        stacked: true,
        datasets: [
          { label: "Human users", data: data.human, backgroundColor: "#d35400" },
          { label: "Application users", data: data.app, backgroundColor: "#f39c4a" },
        ],
      };
    }
    default:
      return null;
  }
}

function openDashboardChartModal(kind: DashboardChartKind) {
  if (!state.dashboardLoaded) {
    return;
  }
  if (!elements.chartModal || !elements.chartModalCanvas) {
    return;
  }
  const data = getDashboardChartData(kind, null);
  if (!data) {
    return;
  }
  if (elements.chartModalTitle) {
    elements.chartModalTitle.textContent = data.title;
  }
  setModalEmptyState(data.labels.length === 0);
  if (data.labels.length === 0) {
    elements.chartModal.classList.remove("hidden");
    elements.chartModal.setAttribute("aria-hidden", "false");
    return;
  }
  if (state.dashboardCharts.modal) {
    state.dashboardCharts.modal.destroy();
    state.dashboardCharts.modal = null;
  }
  state.dashboardCharts.modal = renderOrUpdateBarChart(
    null,
    elements.chartModalCanvas,
    data.labels,
    data.datasets,
    data.stacked,
  );
  elements.chartModal.classList.remove("hidden");
  elements.chartModal.setAttribute("aria-hidden", "false");
}

function closeDashboardChartModal() {
  if (!elements.chartModal) {
    return;
  }
  if (state.dashboardCharts.modal) {
    state.dashboardCharts.modal.destroy();
    state.dashboardCharts.modal = null;
  }
  setModalEmptyState(false);
  elements.chartModal.classList.add("hidden");
  elements.chartModal.setAttribute("aria-hidden", "true");
}

async function renderDashboard() {
  await ensureDashboardDataLoaded();
  updateDashboardMetrics();
  updateDashboardCharts();
}

function formatUserDisplayName(user: DashboardUser): string {
  return isApplicationUser(user) ? `App: ${user.name}` : user.name;
}

function formatUserActiveLabel(user: DashboardUser): string {
  return isActiveUser(user) ? "Active" : "Inactive";
}

function buildUserRoleExportRows(): string[][] {
  const roleNameById = new Map(state.allRoles.map((role) => [role.id, role.name]));
  const businessUnitById = new Map(
    state.dashboardBusinessUnits.map((unit) => [unit.id, unit.name]),
  );
  const usersById = new Map(state.dashboardUsers.map((user) => [user.id, user]));

  const rows: string[][] = [
    ["User", "Email", "Status", "Business Unit", "Security Role"],
  ];

  for (const [userId, roles] of state.assignmentRolesByUser) {
    const user = usersById.get(userId);
    if (!user) {
      continue;
    }
    for (const roleId of roles) {
      rows.push([
        formatUserDisplayName(user),
        user.email ?? "",
        formatUserActiveLabel(user),
        businessUnitById.get(user.businessUnitId) ?? "",
        roleNameById.get(roleId) ?? roleId,
      ]);
    }
  }

  return rows;
}

function buildUserTeamExportRows(): string[][] {
  const teamNameById = new Map(state.teams.map((team) => [team.id, team.name]));
  const usersById = new Map(state.dashboardUsers.map((user) => [user.id, user]));
  const rows: string[][] = [["User", "Email", "Status", "Team"]];

  for (const membership of state.dashboardTeamMemberships) {
    const user = usersById.get(membership.userId);
    const teamName = teamNameById.get(membership.teamId);
    if (!user || !teamName) {
      continue;
    }
    rows.push([
      formatUserDisplayName(user),
      user.email ?? "",
      formatUserActiveLabel(user),
      teamName,
    ]);
  }

  return rows;
}

async function exportDashboardData() {
  if (!toolboxAPI?.fileSystem?.saveFile || !toolboxAPI?.fileSystem?.writeText) {
    await toolboxAPI.utils.showNotification({
      title: "Export unavailable",
      body: "Filesystem API is not available in this environment.",
      type: "error",
      duration: 3500,
    });
    return;
  }

  await ensureDashboardDataLoaded();
  await ensureUserRoleAssignmentsLoaded();
  await ensureTeamRoleAssignmentsLoaded();

  const userRolesCsv = buildCsv(buildUserRoleExportRows());
  const userTeamsCsv = buildCsv(buildUserTeamExportRows());

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await exportCsvBundle(
    toolboxAPI.fileSystem,
    toolboxAPI.utils,
    [
      { filename: `security-roles-users-${timestamp}.csv`, content: userRolesCsv },
      { filename: `security-roles-teams-${timestamp}.csv`, content: userTeamsCsv },
    ],
    `security-roles-users-${timestamp}.csv`,
  );
}

async function loadSecurityCache(): Promise<boolean> {
  let privileges: any[] = [];
  let rolePrivilegeCount = 0;

  try {
    privileges = await queryAll(
      "privileges?$select=privilegeid,privilegerowid,name,accessright,ismanaged,canbebasic,canbelocal,canbedeep,canbeglobal",
    );
  } catch (error) {
    console.error(error);
    logMessage(UI_TEXT.logPrivilegesCacheFailed);
    await toolboxAPI.utils.showNotification({
      title: NOTIFICATIONS.cacheFailed.title,
      body: NOTIFICATIONS.cacheFailed.body,
      type: "error",
      duration: 3500,
    });
    return false;
  }

  const privilegeMeta = new Map<string, { access: AccessRight; entityLogicalName: string }>();
  const privilegeIdByKey = new Map<string, string>();
  const privilegeInfoById = new Map<string, PrivilegeInfo>();

  for (const privilege of privileges) {
    const parsed = mapAccessFromName(privilege.name ?? "");
    if (!parsed) {
      continue;
    }
    privilegeInfoById.set(privilege.privilegeid, {
      id: privilege.privilegeid,
      rowId: privilege.privilegerowid ?? null,
      name: privilege.name ?? "",
      accessRight: privilege.accessright ?? 0,
      isManaged: Boolean(privilege.ismanaged),
      canBeBasic: Boolean(privilege.canbebasic),
      canBeLocal: Boolean(privilege.canbelocal),
      canBeDeep: Boolean(privilege.canbedeep),
      canBeGlobal: Boolean(privilege.canbeglobal),
    });
    privilegeMeta.set(privilege.privilegeid, parsed);
    privilegeIdByKey.set(`${parsed.entityLogicalName}:${parsed.access}`, privilege.privilegeid);
  }

  const rolePrivilegesCache = new Map<string, Map<string, Record<AccessRight, PrivilegeLevel>>>();
  const rolesToCache = state.allRoles.length > 0 ? state.allRoles : state.roles;
  let loadedRoles = 0;
  const batchSize = 5;
  for (let i = 0; i < rolesToCache.length; i += batchSize) {
    const batch = rolesToCache.slice(i, i + batchSize);
    const results = await executeParallel(
      batch.map(async (role) => ({
        role,
        entries: await retrieveRolePrivileges(role.id),
      })),
    );

    for (const result of results) {
      const role = result.role;
      const roleEntries = result.entries ?? [];
      rolePrivilegesCache.set(role.id, new Map());
      if (roleEntries.length === 0) {
        logMessage(formatNoPrivilegesForRole(role.name));
      }

      rolePrivilegeCount += roleEntries.length;
      loadedRoles += 1;
      if (state.loading.active) {
        updateLoadingProgress(loadedRoles, rolesToCache.length, UI_TEXT.loadingRolePrivileges);
      }

      for (const entry of roleEntries) {
        const privilegeId = entry.PrivilegeId ?? entry.privilegeid ?? entry._privilegeid_value;
        const depth = entry.Depth ?? entry.depth ?? 0;
        if (!privilegeId) {
          continue;
        }
        const meta = privilegeMeta.get(privilegeId);
        if (!meta) {
          continue;
        }
        const roleMap = rolePrivilegesCache.get(role.id)!;
        const record = ensureRolePrivilegeRecord(roleMap, meta.entityLogicalName);
        record[meta.access] = mapPrivilegeLevelFromDepth(depth);
      }
    }
  }

  state.privilegeIdByKey = privilegeIdByKey;
  state.privilegeInfoById = privilegeInfoById;
  state.rolePrivileges = rolePrivilegesCache;
  state.cacheLoaded = true;
  logMessage(
    formatCachedPrivileges(privileges.length, rolePrivilegeCount, rolesToCache.length),
  );
  return true;
}

async function ensureSecurityCacheLoaded(message = UI_TEXT.loadingRolePrivileges) {
  if (state.cacheLoaded) {
    return true;
  }
  if (state.cacheLoading && state.cachePromise) {
    return state.cachePromise;
  }
  state.cacheLoading = true;
  setLoading(true, message);
  const totalRoles = state.allRoles.length > 0 ? state.allRoles.length : state.roles.length;
  updateLoadingProgress(0, totalRoles, message);
  state.cachePromise = loadSecurityCache().finally(() => {
    state.cacheLoading = false;
    state.cachePromise = null;
    setLoading(false);
  });
  return state.cachePromise;
}

async function refreshPrivilegeView() {
  if (state.filterMode === "role") {
    const roleId = elements.roleSelect.value;
    if (roleId) {
      await loadRolePrivileges(roleId);
    }
  } else {
    const entityLogicalName = elements.entitySelect.value;
    if (entityLogicalName) {
      await loadEntityCoverage(entityLogicalName);
    }
  }
}

async function loadRolePrivileges(roleId: string) {
  const loaded = await ensureSecurityCacheLoaded();
  if (!loaded) {
    return;
  }
  state.tableMode = "role";
  const roleMap = state.rolePrivileges.get(roleId) ?? new Map();
  state.privilegeRows = state.entities.map((entity) => {
    const record = roleMap.get(entity.logicalName) ?? {
      create: "none",
      read: "none",
      write: "none",
      delete: "none",
      append: "none",
      appendto: "none",
      assign: "none",
    };
    return {
      entityLabel: entity.displayName,
      entityLogicalName: entity.logicalName,
      ownershipLabel: entity.ownershipLabel,
      create: record.create,
      read: record.read,
      write: record.write,
      delete: record.delete,
      append: record.append,
      appendto: record.appendto,
      assign: record.assign,
    };
  });
  renderPrivilegeTable();
  const roleName = state.roles.find((role) => role.id === roleId)?.name ?? roleId;
  setTableTitle(formatPrivilegesForRoleTitle(roleName));
}

async function loadEntityCoverage(entityLogicalName: string) {
  const loaded = await ensureSecurityCacheLoaded();
  if (!loaded) {
    return;
  }
  state.tableMode = "entity";
  const entityLabel = state.entities.find((entity) => entity.logicalName === entityLogicalName)?.displayName;
  const visibleRoles = state.roles.filter((role) => state.selectedRoleIds.has(role.id));
  state.privilegeRows = visibleRoles.map((role) => {
    const record = state.rolePrivileges.get(role.id)?.get(entityLogicalName) ?? {
      create: "none",
      read: "none",
      write: "none",
      delete: "none",
      append: "none",
      appendto: "none",
      assign: "none",
    };
    return {
      roleId: role.id,
      entityLogicalName,
      entityLabel: role.name,
      ownershipLabel: "",
      create: record.create,
      read: record.read,
      write: record.write,
      delete: record.delete,
      append: record.append,
      appendto: record.appendto,
      assign: record.assign,
    };
  });
  renderPrivilegeTable();
  setTableTitle(formatPrivilegesForTableTitle(entityLabel ?? entityLogicalName));
}

async function loadAssignmentView() {
  if (!state.allRoles.length) {
    await loadRoles();
  }
  if (state.assignmentMode === "role") {
    if (!state.usersLoaded) {
      await loadUsers();
    }
    if (state.assignmentRoleUserCounts.size !== state.allRoles.length) {
      const activeUserIds = new Set(state.users.map((user) => user.id));
      state.assignmentRoleUserCounts = await loadRoleAssignmentCounts(
        "users",
        state.allRoles,
        activeUserIds,
      );
    }
    renderAssignmentRoleOptionsWithCounts(UI_TEXT.unitUsers, state.assignmentRoleUserCounts);
    const roleId = elements.assignmentRoleSelect.value;
    if (!roleId) {
      setAssignmentStatus(UI_TEXT.assignmentSelectRoleUsers);
      renderAssignmentTable([]);
      return;
    }
    const assigned = await getAssignedUsersForRoleCached(roleId);
    const items = state.users.map((user) => ({
      id: user.id,
      label: user.name,
      subLabel: user.domainName,
      assigned: assigned.has(user.id),
    }));
    renderAssignmentTable(items);
    const roleName = state.roles.find((role) => role.id === roleId)?.name ?? roleId;
    const assignedCount = items.filter((item) => item.assigned).length;
    if (elements.assignmentTitle) {
      elements.assignmentTitle.textContent = formatAssignmentTitleUsersWithRole(
        roleName,
        assignedCount,
      );
    }
    setAssignmentStatus(UI_TEXT.assignmentSelectUsersForRole);
    updateAssignmentSelectionUi();
  } else if (state.assignmentMode === "user") {
    if (!state.usersLoaded) {
      await loadUsers();
    }
    if (state.assignmentUserRoleCounts.size !== state.users.length) {
      state.assignmentUserRoleCounts = await loadUserAssignmentCounts();
    }
    renderAssignmentUserOptionsWithCounts(UI_TEXT.unitRoles, state.assignmentUserRoleCounts);
    const userId = elements.assignmentUserSelect.value;
    if (!userId) {
      setAssignmentStatus(UI_TEXT.assignmentSelectUserRoles);
      renderAssignmentTable([]);
      return;
    }
    const assigned = await getAssignedRolesForUserCached(userId);
    const items = state.roles.map((role) => ({
      id: role.id,
      label: role.name,
      subLabel: role.isManaged ? "Managed" : "Custom",
      assigned: assigned.has(role.id),
    }));
    renderAssignmentTable(items);
    const userName = state.users.find((user) => user.id === userId)?.name ?? userId;
    const assignedCount = items.filter((item) => item.assigned).length;
    if (elements.assignmentTitle) {
      elements.assignmentTitle.textContent = formatAssignmentTitleRolesForUser(
        userName,
        assignedCount,
      );
    }
    setAssignmentStatus(UI_TEXT.assignmentSelectRolesForUser);
    updateAssignmentSelectionUi();
  } else if (state.assignmentMode === "role-team") {
    if (!state.teamsLoaded) {
      await loadTeams();
    }
    if (state.assignmentRoleTeamCounts.size !== state.allRoles.length) {
      state.assignmentRoleTeamCounts = await loadRoleAssignmentCounts(
        "teams",
        state.allRoles,
      );
    }
    renderAssignmentRoleOptionsWithCounts(UI_TEXT.unitTeams, state.assignmentRoleTeamCounts);
    const roleId = elements.assignmentRoleSelect.value;
    if (!roleId) {
      setAssignmentStatus(UI_TEXT.assignmentSelectRoleTeams);
      renderAssignmentTable([]);
      return;
    }
    const assigned = await getAssignedTeamsForRoleCached(roleId);
    const items = state.teams.map((team) => ({
      id: team.id,
      label: team.name,
      subLabel: mapTeamTypeLabel(team.teamType),
      assigned: assigned.has(team.id),
    }));
    renderAssignmentTable(items);
    const roleName = state.roles.find((role) => role.id === roleId)?.name ?? roleId;
    const assignedCount = items.filter((item) => item.assigned).length;
    if (elements.assignmentTitle) {
      elements.assignmentTitle.textContent = formatAssignmentTitleTeamsWithRole(
        roleName,
        assignedCount,
      );
    }
    setAssignmentStatus(UI_TEXT.assignmentSelectTeamsForRole);
    updateAssignmentSelectionUi();
  } else {
    if (!state.teamsLoaded) {
      await loadTeams();
    }
    if (state.assignmentTeamRoleCounts.size !== state.teams.length) {
      state.assignmentTeamRoleCounts = await loadTeamAssignmentCounts();
    }
    renderAssignmentTeamOptionsWithCounts(UI_TEXT.unitRoles, state.assignmentTeamRoleCounts);
    const teamId = elements.assignmentTeamSelect.value;
    if (!teamId) {
      setAssignmentStatus(UI_TEXT.assignmentSelectTeamRoles);
      renderAssignmentTable([]);
      return;
    }
    const assigned = await getAssignedRolesForTeamCached(teamId);
    const items = state.roles.map((role) => ({
      id: role.id,
      label: role.name,
      subLabel: role.isManaged ? "Managed" : "Custom",
      assigned: assigned.has(role.id),
    }));
    renderAssignmentTable(items);
    const teamName = state.teams.find((team) => team.id === teamId)?.name ?? teamId;
    const assignedCount = items.filter((item) => item.assigned).length;
    if (elements.assignmentTitle) {
      elements.assignmentTitle.textContent = formatAssignmentTitleRolesForTeam(
        teamName,
        assignedCount,
      );
    }
    setAssignmentStatus(UI_TEXT.assignmentSelectRolesForTeam);
    updateAssignmentSelectionUi();
  }
}

async function applyAssignmentChange(action: "add" | "remove") {
  if (state.assignmentMode === "role") {
    const roleRootId = elements.assignmentRoleSelect.value;
    if (!roleRootId) {
      return;
    }
    const roleName = state.roles.find((role) => role.id === roleRootId)?.name ?? roleRootId;
    const processedUsers: string[] = [];
    const selectedUsers = Array.from(state.selectedAssignmentIds);
    for (const userId of selectedUsers) {
      const user = state.users.find((item) => item.id === userId);
      if (!user) {
        continue;
      }
      const roleId = await resolveRoleForUser(roleRootId, user.businessUnitId);
      if (!roleId) {
        continue;
      }
      if (action === "add") {
        await associateRoleToUser(userId, roleId);
      } else {
        await disassociateRoleFromUser(userId, roleId);
      }
      processedUsers.push(user.name);
    }
    if (processedUsers.length > 0) {
      logMessage(formatRoleAssignmentLogUsers(action, roleName, processedUsers));
    }
  } else if (state.assignmentMode === "user") {
    const userId = elements.assignmentUserSelect.value;
    if (!userId) {
      return;
    }
    const user = state.users.find((item) => item.id === userId);
    if (!user) {
      return;
    }
    const processedRoles: string[] = [];
    const selectedRoles = Array.from(state.selectedAssignmentIds);
    for (const roleRootId of selectedRoles) {
      const roleId = await resolveRoleForUser(roleRootId, user.businessUnitId);
      if (!roleId) {
        continue;
      }
      if (action === "add") {
        await associateRoleToUser(userId, roleId);
      } else {
        await disassociateRoleFromUser(userId, roleId);
      }
      const roleName = state.roles.find((role) => role.id === roleRootId)?.name ?? roleRootId;
      processedRoles.push(roleName);
    }
    if (processedRoles.length > 0) {
      logMessage(formatRoleAssignmentLogRolesForUser(action, user.name, processedRoles));
    }
  } else if (state.assignmentMode === "role-team") {
    const roleRootId = elements.assignmentRoleSelect.value;
    if (!roleRootId) {
      return;
    }
    const roleName = state.roles.find((role) => role.id === roleRootId)?.name ?? roleRootId;
    const processedTeams: string[] = [];
    const selectedTeams = Array.from(state.selectedAssignmentIds);
    for (const teamId of selectedTeams) {
      const team = state.teams.find((item) => item.id === teamId);
      if (!team) {
        continue;
      }
      const roleId = await resolveRoleForTeam(roleRootId, team.businessUnitId);
      if (!roleId) {
        continue;
      }
      if (action === "add") {
        await associateRoleToTeam(teamId, roleId);
      } else {
        await disassociateRoleFromTeam(teamId, roleId);
      }
      processedTeams.push(team.name);
    }
    if (processedTeams.length > 0) {
      logMessage(formatRoleAssignmentLogTeams(action, roleName, processedTeams));
    }
  } else {
    const teamId = elements.assignmentTeamSelect.value;
    if (!teamId) {
      return;
    }
    const team = state.teams.find((item) => item.id === teamId);
    if (!team) {
      return;
    }
    const processedRoles: string[] = [];
    const selectedRoles = Array.from(state.selectedAssignmentIds);
    for (const roleRootId of selectedRoles) {
      const roleId = await resolveRoleForTeam(roleRootId, team.businessUnitId);
      if (!roleId) {
        continue;
      }
      if (action === "add") {
        await associateRoleToTeam(teamId, roleId);
      } else {
        await disassociateRoleFromTeam(teamId, roleId);
      }
      const roleName = state.roles.find((role) => role.id === roleRootId)?.name ?? roleRootId;
      processedRoles.push(roleName);
    }
    if (processedRoles.length > 0) {
      logMessage(formatRoleAssignmentLogRolesForTeam(action, team.name, processedRoles));
    }
  }
  resetAssignmentCaches();
  resetDashboardCaches();
  await loadAssignmentView();
  if (state.currentTab === "dashboard") {
    await renderDashboard();
  }
}

async function applyChanges() {
  if (state.pendingChanges.length === 0) {
    await toolboxAPI.utils.showNotification({
      title: NOTIFICATIONS.noChanges.title,
      body: NOTIFICATIONS.noChanges.body,
      type: "info",
      duration: 2500,
    });
    return;
  }

  logMessage(formatApplyingChanges(state.pendingChanges.length));
  const removesByRole = new Map<string, string[]>();
  const addsByRole = new Map<
    string,
    Array<{ PrivilegeId: string; Depth: string; PrivilegeName?: string }>
  >();

  for (const change of state.pendingChanges) {
    const privilegeId = state.privilegeIdByKey.get(`${change.entityLogicalName}:${change.privilege}`);
    if (!privilegeId) {
      logMessage(formatMissingPrivilegeId(change.entityLogicalName, change.privilege));
      continue;
    }
    const roleMap = state.rolePrivileges.get(change.roleId) ?? new Map();
    const record = roleMap.get(change.entityLogicalName) ?? {
      read: "none",
      write: "none",
      append: "none",
      appendto: "none",
    };
    const currentLevel = record[change.privilege];
    if (currentLevel === change.level) {
      continue;
    }
    if (change.level === "none") {
      if (!removesByRole.has(change.roleId)) {
        removesByRole.set(change.roleId, []);
      }
      removesByRole.get(change.roleId)!.push(privilegeId);
    } else {
      if (!addsByRole.has(change.roleId)) {
        addsByRole.set(change.roleId, []);
      }
      const privilegeInfo = state.privilegeInfoById.get(privilegeId);
      addsByRole.get(change.roleId)!.push({
        PrivilegeId: privilegeId,
        Depth: mapPrivilegeDepthLabel(change.level),
        PrivilegeName: privilegeInfo?.name,
      });
    }
  }

  const totalRemoveCalls = Array.from(removesByRole.values()).reduce(
    (total, privilegeIds) => total + privilegeIds.length,
    0,
  );
  const totalAddCalls = addsByRole.size;
  const totalCalls = totalRemoveCalls + totalAddCalls;
  let completedCalls = 0;

  setLoading(true, UI_TEXT.loadingApplyingChanges);
  updateLoadingProgress(0, totalCalls, UI_TEXT.loadingApplyingChanges);

  try {
    for (const [roleId, privilegeIds] of removesByRole) {
      for (const privilegeId of privilegeIds) {
        await removePrivilegesFromRole(roleId, privilegeId);
        completedCalls += 1;
        updateLoadingProgress(completedCalls, totalCalls, UI_TEXT.loadingApplyingChanges);
      }
    }

    for (const [roleId, privileges] of addsByRole) {
      await addPrivilegesToRole(roleId, privileges);
      completedCalls += 1;
      updateLoadingProgress(completedCalls, totalCalls, UI_TEXT.loadingApplyingChanges);
    }

    for (const change of state.pendingChanges) {
      if (!state.rolePrivileges.has(change.roleId)) {
        state.rolePrivileges.set(change.roleId, new Map());
      }
      const roleMap = state.rolePrivileges.get(change.roleId)!;
      const record = ensureRolePrivilegeRecord(roleMap, change.entityLogicalName);
      record[change.privilege] = change.level;
    }
  } catch (error) {
    console.error(error);
    await toolboxAPI.utils.showNotification({
      title: NOTIFICATIONS.updateFailed.title,
      body: NOTIFICATIONS.updateFailed.body,
      type: "error",
      duration: 3500,
    });
    return;
  } finally {
    setLoading(false);
  }

  state.pendingChanges = [];
  updatePendingUi();
  await refreshPrivilegeView();
}

async function refreshData() {
  if (state.refreshInProgress) {
    return;
  }
  state.refreshInProgress = true;
  resetSecurityCache(true);
  resetAssignmentCaches();
  resetDashboardCaches();
  state.allRoles = [];
  state.roleRootById = new Map();
  state.roleRootLoaded = false;
  state.roleRootLoading = false;
  state.roleRootPromise = null;

  setLoading(true, UI_TEXT.loadingRolesMetadata);

  try {
    await Promise.all([loadRoles(true), loadEntities()]);
    setTableTitle(UI_TEXT.tableTitlePrivileges);

    if (state.filterMode === "role" && state.roles.length > 0) {
      elements.roleSelect.value = state.roles[0].id;
    }
    if (state.filterMode === "entity" && state.entities.length > 0) {
      elements.entitySelect.value = state.entities[0].logicalName;
    }
    if (state.currentTab === "dashboard") {
      await renderDashboard();
    }
  } finally {
    state.refreshInProgress = false;
    setLoading(false);
  }
}

async function initialize() {
  try {
    if (!toolboxAPI || !dataverseAPI) {
      logMessage(UI_TEXT.logPptbUnavailable);
      return;
    }

    const connection = await getActiveConnection();
    updateConnectionBadge(
      connection ? `${connection.name} (${connection.environment})` : UI_TEXT.connectionNotConnected,
    );

    await applyTheme();

    await refreshData();

    if (!state.eventsHooked) {
      toolboxAPI.events.on((event: any, payload: any) => {
        if (payload.event === "connection:updated") {
          refreshData();
        }
      });
      state.eventsHooked = true;
    }

    if (!state.readyToastShown) {
      await toolboxAPI.utils.showNotification({
        title: NOTIFICATIONS.ready.title,
        body: NOTIFICATIONS.ready.body,
        type: "success",
        duration: 2500,
      });
      state.readyToastShown = true;
    }
  } catch (error) {
    console.error(error);
    logMessage(UI_TEXT.logInitFailed);
  }
}

function wireEvents() {
  elements.filterMode.addEventListener("change", () => {
    setFilterMode(elements.filterMode.value as FilterMode);
  });
  elements.roleSelect.addEventListener("change", () => {
    if (state.filterMode === "role") {
      loadRolePrivileges(elements.roleSelect.value);
    }
  });
  elements.entitySelect.addEventListener("change", () => {
    if (state.filterMode === "entity") {
      loadEntityCoverage(elements.entitySelect.value);
    }
  });
  elements.roleFilterButton.addEventListener("click", () => {
    elements.roleFilterMenu.classList.toggle("hidden");
  });
  elements.roleFilterAll.addEventListener("click", () => {
    state.selectedRoleIds = new Set(state.roles.map((role) => role.id));
    renderRoleFilterOptions();
    if (state.tableMode === "entity") {
      loadEntityCoverage(elements.entitySelect.value);
    }
  });
  elements.roleFilterNone.addEventListener("click", () => {
    state.selectedRoleIds.clear();
    renderRoleFilterOptions();
    if (state.tableMode === "entity") {
      loadEntityCoverage(elements.entitySelect.value);
    }
  });
  document.addEventListener("click", (event) => {
    if (!elements.roleFilterMenu || !elements.roleFilterButton) {
      return;
    }
    const target = event.target as Node;
    if (elements.roleFilterMenu.contains(target) || elements.roleFilterButton.contains(target)) {
      return;
    }
    elements.roleFilterMenu.classList.add("hidden");
  });
  elements.applyBtn.addEventListener("click", applyChanges);
  if (elements.undoBtn) {
    elements.undoBtn.addEventListener("click", () => {
      if (state.pendingChanges.length === 0) {
        return;
      }
      state.pendingChanges = [];
      updatePendingUi();
      renderPrivilegeTable();
      logMessage(UI_TEXT.logClearedPending);
    });
  }
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener("click", async () => {
      resetSecurityCache(true);
      await ensureSecurityCacheLoaded(UI_TEXT.loadingRefreshingPrivileges);
      await refreshPrivilegeView();
    });
  }
  if (elements.rightsFilter) {
    elements.rightsFilter.addEventListener("change", async () => {
      const value = elements.rightsFilter.value as "all" | "with" | "without";
      state.rightsFilter = value;
      if (!state.cacheLoaded) {
        const loaded = await ensureSecurityCacheLoaded();
        if (loaded) {
          await refreshPrivilegeView();
        }
        return;
      }
      renderPrivilegeTable();
    });
  }
  if (elements.themeToggle) {
    elements.themeToggle.addEventListener("click", () => {
      const isDark = document.body.classList.contains("theme-dark");
      setTheme(isDark ? "light" : "dark");
    });
  }

  if (elements.rolesCustomOnlyGlobal) {
    elements.rolesCustomOnlyGlobal.addEventListener("change", () => {
      setCustomRolesOnly(elements.rolesCustomOnlyGlobal.checked);
    });
  }

  for (const button of elements.tabButtons) {
    button.addEventListener("click", () => {
      const tab =
        (button.dataset.tab as "privileges" | "assignments" | "dashboard") ||
        "privileges";
      setTab(tab);
      if (tab === "assignments") {
        loadAssignmentView();
      } else if (tab === "dashboard") {
        renderDashboard();
      }
    });
  }

  if (elements.dashboardUserStatus) {
    elements.dashboardUserStatus.addEventListener("change", () => {
      if (state.currentTab === "dashboard") {
        updateDashboardCharts();
      }
    });
  }
  if (elements.dashboardUserType) {
    elements.dashboardUserType.addEventListener("change", () => {
      if (state.currentTab === "dashboard") {
        updateDashboardCharts();
      }
    });
  }
  if (elements.dashboardBusinessUnitSelect) {
    elements.dashboardBusinessUnitSelect.addEventListener("change", () => {
      if (state.currentTab === "dashboard") {
        updateDashboardCharts();
      }
    });
  }
  if (elements.dashboardRoleSelect) {
    elements.dashboardRoleSelect.addEventListener("change", () => {
      if (state.currentTab === "dashboard") {
        updateDashboardCharts();
      }
    });
  }
  if (elements.dashboardTeamSelect) {
    elements.dashboardTeamSelect.addEventListener("change", () => {
      if (state.currentTab === "dashboard") {
        updateDashboardCharts();
      }
    });
  }
  if (elements.dashboardExport) {
    elements.dashboardExport.addEventListener("click", () => {
      exportDashboardData();
    });
  }

  for (const button of elements.dashboardChartButtons) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const kind = button.dataset.dashboardChart as DashboardChartKind | undefined;
      if (kind) {
        openDashboardChartModal(kind);
      }
    });
  }

  for (const card of elements.dashboardChartCards) {
    card.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest(".chart-expand")) {
        return;
      }
      const kind = card.dataset.dashboardChart as DashboardChartKind | undefined;
      if (kind) {
        openDashboardChartModal(kind);
      }
    });
  }

  if (elements.chartModalClose) {
    elements.chartModalClose.addEventListener("click", () => {
      closeDashboardChartModal();
    });
  }
  if (elements.chartModalBackdrop) {
    elements.chartModalBackdrop.addEventListener("click", () => {
      closeDashboardChartModal();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.chartModal && !elements.chartModal.classList.contains("hidden")) {
      closeDashboardChartModal();
    }
  });

  elements.assignmentMode.addEventListener("change", () => {
    setAssignmentMode(elements.assignmentMode.value as AssignmentMode);
    loadAssignmentView();
  });
  elements.assignmentRoleSelect.addEventListener("change", () => {
    if (state.assignmentMode === "role" || state.assignmentMode === "role-team") {
      loadAssignmentView();
    }
  });
  elements.assignmentUserSelect.addEventListener("change", () => {
    if (state.assignmentMode === "user") {
      loadAssignmentView();
    }
  });
  elements.assignmentTeamSelect.addEventListener("change", () => {
    if (state.assignmentMode === "team") {
      loadAssignmentView();
    }
  });
  elements.assignmentAdd.addEventListener("click", () => applyAssignmentChange("add"));
  elements.assignmentRemove.addEventListener("click", () => applyAssignmentChange("remove"));
  elements.assignmentSelectAll.addEventListener("click", () => {
    state.selectedAssignmentIds = new Set(state.assignmentItems.map((item) => item.id));
    renderAssignmentTable(state.assignmentItems);
    updateAssignmentSelectionUi();
  });
  elements.assignmentClear.addEventListener("click", () => {
    state.selectedAssignmentIds.clear();
    renderAssignmentTable(state.assignmentItems);
    updateAssignmentSelectionUi();
  });

  for (const button of elements.assignmentSortButtons) {
    button.addEventListener("click", () => {
      const column = (button.dataset.assignSort as AssignmentSortColumn) || "label";
      if (state.assignmentSort.column === column) {
        state.assignmentSort.direction =
          state.assignmentSort.direction === "asc" ? "desc" : "asc";
      } else {
        state.assignmentSort.column = column;
        state.assignmentSort.direction = "asc";
      }
      updateAssignmentSortIndicators();
      renderAssignmentTable(state.assignmentItems);
    });
  }

  if (elements.assignmentFilterAssigned) {
    elements.assignmentFilterAssigned.addEventListener("change", () => {
      state.assignmentFilter =
        (elements.assignmentFilterAssigned.value as "" | "assigned" | "not-assigned") || "";
      renderAssignmentTable(state.assignmentItems);
    });
  }
  if (elements.assignmentSearch) {
    elements.assignmentSearch.addEventListener("input", () => {
      state.assignmentSearch = elements.assignmentSearch.value.trim();
      renderAssignmentTable(state.assignmentItems);
    });
  }

  for (const button of elements.sortButtons) {
    button.addEventListener("click", () => {
      const column = (button.dataset.sort as SortColumn) || "label";
      if (state.sort.column === column) {
        state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
      } else {
        state.sort.column = column;
        state.sort.direction = "asc";
      }
      updateSortIndicators();
      renderPrivilegeTable();
    });
  }

  for (const select of elements.filterSelects) {
    select.addEventListener("change", async () => {
      const privilege = select.dataset.filter as AccessRight;
      state.filters[privilege] = select.value;
      if (!state.cacheLoaded) {
        const loaded = await ensureSecurityCacheLoaded();
        if (loaded) {
          await refreshPrivilegeView();
        }
        return;
      }
      renderPrivilegeTable();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    renderFilterOptions();
    updateSortIndicators();
    updateAssignmentSortIndicators();
    wireEvents();
    setFilterMode(state.filterMode);
    setTab("privileges");
    setAssignmentMode(state.assignmentMode);
    setCustomRolesOnly(state.hideManagedRoles, true);
    initialize();
  });
} else {
  renderFilterOptions();
  updateSortIndicators();
  updateAssignmentSortIndicators();
  wireEvents();
  setFilterMode(state.filterMode);
  setTab("privileges");
  setAssignmentMode(state.assignmentMode);
  setCustomRolesOnly(state.hideManagedRoles, true);
  initialize();
}
