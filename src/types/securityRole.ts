export type PrivilegeLevel =
  | "none"
  | "user"
  | "businessUnit"
  | "parentChild"
  | "organization";

export type AccessRight =
  | "create"
  | "read"
  | "write"
  | "delete"
  | "append"
  | "appendto"
  | "assign"
  | "share";

export type SortColumn = "label" | AccessRight;
export type SortDirection = "asc" | "desc";

export type PrivilegeRow = {
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
  share: PrivilegeLevel;
};

export type RoleSummary = {
  id: string;
  name: string;
  isManaged: boolean;
};

export type EntitySummary = {
  logicalName: string;
  displayName: string;
  ownershipLabel: string;
};

export type PendingChange = {
  roleId: string;
  entityLogicalName: string;
  privilege: AccessRight;
  level: PrivilegeLevel;
};

export type PrivilegeInfo = {
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

export type MiscPrivilegeInfo = {
  id: string;
  name: string;
  label: string;
  canBeBasic: boolean;
  canBeLocal: boolean;
  canBeDeep: boolean;
  canBeGlobal: boolean;
};

export type MiscPendingChange = {
  roleId: string;
  privilegeId: string;
  level: PrivilegeLevel;
};
