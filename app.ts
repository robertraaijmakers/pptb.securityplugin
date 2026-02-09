/// <reference types="@pptb/types" />

const toolboxAPI = (window as any).toolboxAPI;
const dataverseAPI = (window as any).dataverseAPI;

type FilterMode = "role" | "entity";

type AssignmentMode = "role" | "user";

type PrivilegeLevel = "none" | "user" | "businessUnit" | "parentChild" | "organization";

type AccessRight = "create" | "read" | "write" | "delete" | "append" | "appendto" | "assign";

type SortColumn = "label" | AccessRight;
type SortDirection = "asc" | "desc";

type AssignmentSortColumn = "label" | "assigned";
type AssignmentSortDirection = "asc" | "desc";

type PrivilegeRow = {
  roleId?: string;
  entityLogicalName: string;
  entityLabel: string;
  ownershipLabel: string;
  read: PrivilegeLevel;
  write: PrivilegeLevel;
  create: PrivilegeLevel;
  delete: PrivilegeLevel;
  append: PrivilegeLevel;
  appendto: PrivilegeLevel;
  assign: PrivilegeLevel;
};

type RoleSummary = {
  id: string;
  name: string;
  isManaged: boolean;
};

type UserSummary = {
  id: string;
  name: string;
  domainName: string;
  businessUnitId: string;
};

type AssignmentItem = {
  id: string;
  label: string;
  subLabel: string;
  assigned: boolean;
};

type EntitySummary = {
  logicalName: string;
  displayName: string;
  ownershipLabel: string;
};

type PendingChange = {
  roleId: string;
  entityLogicalName: string;
  privilege: AccessRight;
  level: PrivilegeLevel;
};

type PrivilegeInfo = {
  id: string;
  rowId: string | null;
  name: string;
  accessRight: number;
  isManaged: boolean;
  canBeBasic: boolean;
  canBeLocal: boolean;
  canBeDeep: boolean;
  canBeGlobal: boolean;
};

const state = {
  connectionName: "",
  filterMode: "role" as FilterMode,
  roles: [] as RoleSummary[],
  entities: [] as EntitySummary[],
  users: [] as UserSummary[],
  privilegeRows: [] as PrivilegeRow[],
  pendingChanges: [] as PendingChange[],
  privilegeIdByKey: new Map<string, string>(),
  privilegeInfoById: new Map<string, PrivilegeInfo>(),
  rolePrivileges: new Map<string, Map<string, Record<AccessRight, PrivilegeLevel>>>(),
  tableMode: "role" as FilterMode,
  selectedRoleIds: new Set<string>(),
  hideManagedRoles: false,
  currentTab: "privileges" as "privileges" | "assignments",
  rightsFilter: "all" as "all" | "with" | "without",
  assignmentMode: "role" as AssignmentMode,
  assignmentItems: [] as AssignmentItem[],
  selectedAssignmentIds: new Set<string>(),
  usersLoaded: false,
  roleByRootAndBu: new Map<string, string>(),
  assignmentSort: {
    column: "label" as AssignmentSortColumn,
    direction: "asc" as AssignmentSortDirection,
  },
  assignmentFilter: "" as "" | "assigned" | "not-assigned",
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
  tabButtons: Array.from(document.querySelectorAll(".tab-button")) as HTMLButtonElement[],
  tabPrivileges: document.getElementById("tab-privileges") as HTMLElement,
  tabAssignments: document.getElementById("tab-assignments") as HTMLElement,
  assignmentMode: document.getElementById("assignment-mode") as HTMLSelectElement,
  assignmentRoleSelect: document.getElementById("assignment-role-select") as HTMLSelectElement,
  assignmentUserSelect: document.getElementById("assignment-user-select") as HTMLSelectElement,
  assignmentRoleControl: document.getElementById("assignment-role-control") as HTMLDivElement,
  assignmentUserControl: document.getElementById("assignment-user-control") as HTMLDivElement,
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
  controlsPrivileges: document.getElementById("controls-privileges") as HTMLDivElement,
  controlsAssignments: document.getElementById("controls-assignments") as HTMLDivElement,
  applyBtn: document.getElementById("apply-btn") as HTMLButtonElement,
  undoBtn: document.getElementById("undo-btn") as HTMLButtonElement,
  pendingCount: document.getElementById("pending-count") as HTMLSpanElement,
  tableTitle: document.getElementById("table-title") as HTMLHeadingElement,
  privilegesTable: document.querySelector("#privileges-table tbody") as HTMLTableSectionElement,
  privilegesTableRoot: document.getElementById("privileges-table") as HTMLTableElement,
  tableLoading: document.getElementById("table-loading") as HTMLDivElement,
  loadingBar: document.getElementById("loading-bar") as HTMLDivElement,
  loadingText: document.getElementById("loading-text") as HTMLDivElement,
  log: document.getElementById("log") as HTMLPreElement,
  themeToggle: document.getElementById("theme-toggle") as HTMLButtonElement,
  sortButtons: Array.from(document.querySelectorAll(".sort-button")) as HTMLButtonElement[],
  filterSelects: Array.from(document.querySelectorAll(".filter-select")) as HTMLSelectElement[],
};

const accessRights: AccessRight[] = ["create", "read", "write", "delete", "append", "appendto", "assign"];

const privilegeLabels: Record<AccessRight, string> = {
  create: "Create",
  read: "Read",
  write: "Write",
  delete: "Delete",
  append: "Append",
  appendto: "Append To",
  assign: "Assign",
};

const levelOptions: Array<{ level: PrivilegeLevel; icon: string; label: string; className: string }> = [
  { level: "user", icon: "👤", label: "User", className: "level-user" },
  { level: "businessUnit", icon: "🏢", label: "Business Unit", className: "level-businessUnit" },
  { level: "parentChild", icon: "🧩", label: "Parent: Child BU", className: "level-parentChild" },
  { level: "organization", icon: "🌐", label: "Organization", className: "level-organization" },
  { level: "none", icon: "⛔", label: "None", className: "level-none" },
];

function logMessage(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  elements.log.textContent = `[${timestamp}] ${message}\n${elements.log.textContent}`;
}

function setTableTitle(text: string) {
  if (elements.tableTitle) {
    elements.tableTitle.textContent = text;
  }
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

function setLoading(active: boolean, message?: string) {
  state.loading.active = active;
  if (elements.tableLoading) {
    elements.tableLoading.classList.toggle("hidden", !active);
  }
  if (elements.privilegesTableRoot) {
    elements.privilegesTableRoot.classList.toggle("hidden", active);
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
    const status = total > 0 ? `${loaded} / ${total}` : "Working...";
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

function setTab(tab: "privileges" | "assignments") {
  state.currentTab = tab;
  if (elements.tabPrivileges) {
    elements.tabPrivileges.classList.toggle("hidden", tab !== "privileges");
  }
  if (elements.tabAssignments) {
    elements.tabAssignments.classList.toggle("hidden", tab !== "assignments");
  }
  if (elements.controlsPrivileges) {
    elements.controlsPrivileges.classList.toggle("hidden", tab !== "privileges");
  }
  if (elements.controlsAssignments) {
    elements.controlsAssignments.classList.toggle("hidden", tab !== "assignments");
  }
  for (const button of elements.tabButtons) {
    button.classList.toggle("active", button.dataset.tab === tab);
  }
}

function setAssignmentMode(mode: AssignmentMode) {
  state.assignmentMode = mode;
  if (elements.assignmentRoleControl) {
    elements.assignmentRoleControl.style.display = mode === "role" ? "flex" : "none";
  }
  if (elements.assignmentUserControl) {
    elements.assignmentUserControl.style.display = mode === "user" ? "flex" : "none";
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

function applyAssignmentSortAndFilter(items: AssignmentItem[]) {
  const filtered = items.filter((item) => {
    if (state.assignmentFilter === "assigned") {
      return item.assigned;
    }
    if (state.assignmentFilter === "not-assigned") {
      return !item.assigned;
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
    status.textContent = item.assigned ? "Assigned" : "Not assigned";
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
    elements.roleFilterButton.textContent = "All roles";
  } else {
    elements.roleFilterButton.textContent = `${selected} roles selected`;
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
    const options = [
      { value: "", label: "All" },
      { value: "user", label: "User" },
      { value: "businessUnit", label: "Business Unit" },
      { value: "parentChild", label: "Parent: Child BU" },
      { value: "organization", label: "Organization" },
      { value: "none", label: "None" },
      { value: "notAvailable", label: "N/A" },
    ];
    select.innerHTML = "";
    for (const optionData of options) {
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
    ownershipCell.textContent = row.ownershipLabel || "-";
    ownershipCell.className = "ownership";
    tr.appendChild(ownershipCell);

    for (const privilege of accessRights) {
      const td = document.createElement("td");
      const privilegeId = state.privilegeIdByKey.get(`${row.entityLogicalName}:${privilege}`);
      if (!privilegeId) {
        td.textContent = "-";
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
        logMessage(`Queued ${privilege} change for ${row.entityLogicalName}: ${level}`);
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
  elements.connectionBadge.textContent = name || "Not connected";
}

function setTheme(theme: "light" | "dark") {
  document.body.classList.remove("theme-light", "theme-dark");
  document.body.classList.add(`theme-${theme}`);
  if (elements.themeToggle) {
    const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    elements.themeToggle.setAttribute("aria-label", label);
    elements.themeToggle.title = label;
  }
}

async function applyTheme() {
  const theme = await toolboxAPI.utils.getCurrentTheme();
  setTheme(theme);
}

async function loadRoles() {
  const response = await dataverseAPI.queryData(
    "roles?$select=roleid,name,_parentrootroleid_value,ismanaged&$filter=ismanaged eq false",
  );
  const rootRoles = new Map<string, RoleSummary>();

  for (const entity of response.value ?? []) {
    if (state.hideManagedRoles && entity.ismanaged) {
      continue;
    }
    const roleId = entity.roleid;
    const rootId = entity._parentrootroleid_value ?? entity.roleid;
    const existing = rootRoles.get(rootId);
    if (!existing || roleId === rootId) {
      rootRoles.set(rootId, {
        id: rootId,
        name: entity.name,
        isManaged: Boolean(entity.ismanaged),
      });
    }
  }

  state.roles = Array.from(rootRoles.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  syncRoleFilterSelection();
  renderRoleFilterOptions();
  renderSelectOptions(elements.roleSelect, state.roles, (item) => item.id, (item) => item.name);
  renderSelectOptions(
    elements.assignmentRoleSelect,
    state.roles,
    (item) => item.id,
    (item) => item.name,
  );
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
  const response = await dataverseAPI.queryData(
    "systemusers?$select=systemuserid,fullname,domainname,_businessunitid_value,isdisabled,accessmode&$filter=isdisabled eq false and accessmode ne 3 and accessmode ne 5",
  );
  state.users = (response.value ?? []).map((user: any) => ({
    id: user.systemuserid,
    name: user.fullname ?? user.domainname ?? "Unknown",
    domainName: user.domainname ?? "",
    businessUnitId: user._businessunitid_value ?? "",
  }));
  renderSelectOptions(
    elements.assignmentUserSelect,
    state.users,
    (item) => item.id,
    (item) => item.name,
  );
  state.usersLoaded = true;
}

async function getAssignedUsersForRole(roleId: string): Promise<Set<string>> {
  try {
    const response = await dataverseAPI.queryData(
      `roles(${roleId})/systemuserroles_association?$select=systemuserid,isdisabled,accessmode`,
    );
    const assigned = new Set<string>();
    for (const user of response.value ?? []) {
      if (user.isdisabled === true || user.accessmode === 3 || user.accessmode === 5) {
        continue;
      }
      if (user.systemuserid) {
        assigned.add(user.systemuserid);
      }
    }
    return assigned;
  } catch (error) {
    console.error(error);
    return new Set<string>();
  }
}

async function getAssignedRolesForUser(userId: string): Promise<Set<string>> {
  try {
    const response = await dataverseAPI.queryData(
      `systemusers(${userId})/systemuserroles_association?$select=roleid,_parentrootroleid_value,name`,
    );
    const assigned = new Set<string>();
    for (const role of response.value ?? []) {
      const rootId = role._parentrootroleid_value ?? role.roleid;
      if (rootId) {
        assigned.add(rootId);
      }
    }
    return assigned;
  } catch (error) {
    console.error(error);
    return new Set<string>();
  }
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
  try {
    const response = await dataverseAPI.queryData(
      `roles?$select=roleid&$filter=_parentrootroleid_value eq ${rootRoleId} and _businessunitid_value eq ${businessUnitId}`,
    );
    const roleId = response.value?.[0]?.roleid ?? null;
    if (roleId) {
      state.roleByRootAndBu.set(cacheKey, roleId);
    }
    return roleId;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function associateRoleToUser(userId: string, roleId: string) {
  await dataverseAPI.associate(
    "systemuser",
    userId,
    "systemuserroles_association",
    "role",
    roleId,
  );
}

async function disassociateRoleFromUser(userId: string, roleId: string) {
  await dataverseAPI.disassociate(
    "systemuser",
    userId,
    "systemuserroles_association",
    roleId,
  );
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

function mapPrivilegeDepth(level: PrivilegeLevel): number {
  switch (level) {
    case "user":
      return 1;
    case "businessUnit":
      return 2;
    case "parentChild":
      return 4;
    case "organization":
      return 8;
    default:
      return 0;
  }
}

function mapOwnershipLabel(raw: any): string {
  if (!raw) {
    return "Unknown";
  }
  const value = typeof raw === "object" && "Value" in raw ? raw.Value : raw;
  if (typeof value === "string") {
    switch (value.toLowerCase()) {
      case "userowned":
        return "User/Team";
      case "organizationowned":
        return "Organization";
      case "businessowned":
        return "Business Unit";
      default:
        return value;
    }
  }
  if (typeof value === "number") {
    switch (value) {
      case 0:
        return "User/Team";
      case 1:
        return "Business Unit";
      case 2:
        return "Organization";
      default:
        return "Unknown";
    }
  }
  return "Unknown";
}

function getLevelColor(level: PrivilegeLevel): string {
  switch (level) {
    case "user":
      return "#5c5b57";
    case "businessUnit":
      return "#2f7a3d";
    case "parentChild":
      return "#1f6fa8";
    case "organization":
      return "#9c2c2c";
    default:
      return "#6d6a63";
  }
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

function normalizeNextLink(nextLink: string): string {
  const match = nextLink.match(/\/api\/data\/v\d+(?:\.\d+)?\/(.*)$/);
  if (match && match[1]) {
    return match[1];
  }
  return nextLink;
}

async function queryAll(odataQuery: string) {
  const all: any[] = [];
  let response = await dataverseAPI.queryData(odataQuery);
  all.push(...(response.value ?? []));

  let nextLink = response["@odata.nextLink"];
  while (nextLink) {
    const nextQuery = normalizeNextLink(nextLink);
    response = await dataverseAPI.queryData(nextQuery);
    all.push(...(response.value ?? []));
    nextLink = response["@odata.nextLink"];
  }

  return all;
}

async function executeParallel<T>(tasks: Array<Promise<T>>): Promise<T[]> {
  if (toolboxAPI?.utils?.executeParallel) {
    return toolboxAPI.utils.executeParallel(...tasks);
  }
  return Promise.all(tasks);
}

async function retrieveRolePrivileges(roleId: string) {
  const query = `RetrieveRolePrivilegesRole(RoleId=${roleId})`;
  try {
    const response = await dataverseAPI.queryData(query);
    return response?.RolePrivileges ?? response?.rolePrivileges ?? response?.value ?? [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function loadSecurityCache() {
  let privileges: any[] = [];
  let rolePrivilegeCount = 0;

  try {
    privileges = await queryAll(
      "privileges?$select=privilegeid,privilegerowid,name,accessright,ismanaged,canbebasic,canbelocal,canbedeep,canbeglobal",
    );
  } catch (error) {
    console.error(error);
    logMessage("Failed to retrieve privileges cache. Check API permissions or entity access.");
    await toolboxAPI.utils.showNotification({
      title: "Cache failed",
      body: "Could not cache role privileges. See console for details.",
      type: "error",
      duration: 3500,
    });
    return;
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
  let loadedRoles = 0;
  const batchSize = 5;
  for (let i = 0; i < state.roles.length; i += batchSize) {
    const batch = state.roles.slice(i, i + batchSize);
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
        logMessage(`No privileges returned for role ${role.name}.`);
      }

      rolePrivilegeCount += roleEntries.length;
      loadedRoles += 1;
      if (state.loading.active) {
        updateLoadingProgress(loadedRoles, state.roles.length, "Loading role privileges");
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
  logMessage(
    `Cached ${privileges.length} privileges and ${rolePrivilegeCount} role privilege rows for ${state.roles.length} roles.`,
  );
}

async function loadRolePrivileges(roleId: string) {
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
  setTableTitle(`Privileges for role: ${roleName}`);
}

async function loadEntityCoverage(entityLogicalName: string) {
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
  setTableTitle(`Privileges for table: ${entityLabel ?? entityLogicalName}`);
}

async function loadAssignmentView() {
  if (!state.usersLoaded) {
    await loadUsers();
  }
  if (!state.roles.length) {
    await loadRoles();
  }
  if (state.assignmentMode === "role") {
    const roleId = elements.assignmentRoleSelect.value;
    if (!roleId) {
      setAssignmentStatus("Select a role to view users.");
      renderAssignmentTable([]);
      return;
    }
    const assigned = await getAssignedUsersForRole(roleId);
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
      elements.assignmentTitle.textContent = `Users with role: ${roleName} (${assignedCount} users)`;
    }
    setAssignmentStatus("Select users to add or remove this role.");
    updateAssignmentSelectionUi();
  } else {
    const userId = elements.assignmentUserSelect.value;
    if (!userId) {
      setAssignmentStatus("Select a user to view roles.");
      renderAssignmentTable([]);
      return;
    }
    const assigned = await getAssignedRolesForUser(userId);
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
      elements.assignmentTitle.textContent = `Roles for user: ${userName} (${assignedCount} assigned)`;
    }
    setAssignmentStatus("Select roles to add or remove for this user.");
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
      const verb = action === "add" ? "Added" : "Removed";
      const prep = action === "add" ? "to" : "from";
      logMessage(`${verb} role ${roleName} ${prep} users: ${processedUsers.join(", ")}`);
    }
  } else {
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
      const verb = action === "add" ? "Added" : "Removed";
      const prep = action === "add" ? "to" : "from";
      logMessage(`${verb} roles ${prep} user ${user.name}: ${processedRoles.join(", ")}`);
    }
  }
  await loadAssignmentView();
}

async function applyChanges() {
  if (state.pendingChanges.length === 0) {
    await toolboxAPI.utils.showNotification({
      title: "No changes",
      body: "There are no pending privilege updates.",
      type: "info",
      duration: 2500,
    });
    return;
  }

  logMessage(`Applying ${state.pendingChanges.length} changes...`);
  const removesByRole = new Map<string, string[]>();
  const addsByRole = new Map<string, Array<{ PrivilegeId: string; Depth: number }>>();

  for (const change of state.pendingChanges) {
    const privilegeId = state.privilegeIdByKey.get(`${change.entityLogicalName}:${change.privilege}`);
    if (!privilegeId) {
      logMessage(`Missing privilege ID for ${change.entityLogicalName}:${change.privilege}`);
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
    if (currentLevel !== "none") {
      if (!removesByRole.has(change.roleId)) {
        removesByRole.set(change.roleId, []);
      }
      removesByRole.get(change.roleId)!.push(privilegeId);
    }
    if (change.level !== "none") {
      if (!addsByRole.has(change.roleId)) {
        addsByRole.set(change.roleId, []);
      }
      addsByRole.get(change.roleId)!.push({
        PrivilegeId: privilegeId,
        Depth: mapPrivilegeDepth(change.level),
      });
    }
  }

  try {
    for (const [roleId, privilegeIds] of removesByRole) {
      await dataverseAPI.execute({
        operationName: "RemovePrivilegesRole",
        operationType: "action",
        parameters: {
          RoleId: roleId,
          PrivilegeIds: privilegeIds,
        },
      });
    }

    for (const [roleId, privileges] of addsByRole) {
      await dataverseAPI.execute({
        operationName: "AddPrivilegesRole",
        operationType: "action",
        parameters: {
          RoleId: roleId,
          Privileges: privileges,
        },
      });
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
      title: "Update failed",
      body: "Failed to apply privilege updates. See console for details.",
      type: "error",
      duration: 3500,
    });
    return;
  }

  state.pendingChanges = [];
  await toolboxAPI.utils.showNotification({
    title: "Privileges updated",
    body: "Your changes have been queued for update.",
    type: "success",
    duration: 2500,
  });
  updatePendingUi();
  renderPrivilegeTable();
}

async function refreshData() {
  if (state.refreshInProgress) {
    return;
  }
  state.refreshInProgress = true;

  setLoading(true, "Loading roles and metadata");

  try {
    await Promise.all([loadRoles(), loadEntities()]);
    updateLoadingProgress(0, state.roles.length, "Loading role privileges");
    await loadSecurityCache();
    setTableTitle("Privileges");

    if (state.filterMode === "role" && state.roles.length > 0) {
      elements.roleSelect.value = state.roles[0].id;
      await loadRolePrivileges(elements.roleSelect.value);
    }
    if (state.filterMode === "entity" && state.entities.length > 0) {
      elements.entitySelect.value = state.entities[0].logicalName;
      await loadEntityCoverage(elements.entitySelect.value);
    }
  } finally {
    state.refreshInProgress = false;
    setLoading(false);
  }
}

async function initialize() {
  try {
    if (!toolboxAPI || !dataverseAPI) {
      logMessage("PPTB APIs not available. Load inside Power Platform ToolBox.");
      return;
    }

    const connection = await toolboxAPI.connections.getActiveConnection();
    updateConnectionBadge(connection ? `${connection.name} (${connection.environment})` : "Not connected");

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
        title: "Security Roles Explorer",
        body: "Tool loaded and ready.",
        type: "success",
        duration: 2500,
      });
      state.readyToastShown = true;
    }
  } catch (error) {
    console.error(error);
    logMessage("Initialization failed. Check console for details.");
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
      logMessage("Cleared pending privilege changes.");
    });
  }
  if (elements.rightsFilter) {
    elements.rightsFilter.addEventListener("change", () => {
      const value = elements.rightsFilter.value as "all" | "with" | "without";
      state.rightsFilter = value;
      renderPrivilegeTable();
    });
  }
  if (elements.themeToggle) {
    elements.themeToggle.addEventListener("click", () => {
      const isDark = document.body.classList.contains("theme-dark");
      setTheme(isDark ? "light" : "dark");
    });
  }

  for (const button of elements.tabButtons) {
    button.addEventListener("click", () => {
      const tab = (button.dataset.tab as "privileges" | "assignments") || "privileges";
      setTab(tab);
      if (tab === "assignments") {
        loadAssignmentView();
      }
    });
  }

  elements.assignmentMode.addEventListener("change", () => {
    setAssignmentMode(elements.assignmentMode.value as AssignmentMode);
    loadAssignmentView();
  });
  elements.assignmentRoleSelect.addEventListener("change", () => {
    if (state.assignmentMode === "role") {
      loadAssignmentView();
    }
  });
  elements.assignmentUserSelect.addEventListener("change", () => {
    if (state.assignmentMode === "user") {
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
    select.addEventListener("change", () => {
      const privilege = select.dataset.filter as AccessRight;
      state.filters[privilege] = select.value;
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
  initialize();
}
