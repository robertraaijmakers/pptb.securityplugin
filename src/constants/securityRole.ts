import { AccessRight, PrivilegeLevel } from "../types/securityRole";

export const accessRights: AccessRight[] = [
  "create",
  "read",
  "write",
  "delete",
  "append",
  "appendto",
  "assign",
];

export const privilegeLabels: Record<AccessRight, string> = {
  create: "Create",
  read: "Read",
  write: "Write",
  delete: "Delete",
  append: "Append",
  appendto: "Append To",
  assign: "Assign",
};

export const levelOptions: Array<{
  level: PrivilegeLevel;
  icon: string;
  label: string;
  className: string;
}> = [
  { level: "user", icon: "👤", label: "User", className: "level-user" },
  { level: "businessUnit", icon: "🏢", label: "Business Unit", className: "level-businessUnit" },
  { level: "parentChild", icon: "🧩", label: "Parent: Child BU", className: "level-parentChild" },
  { level: "organization", icon: "🌐", label: "Organization", className: "level-organization" },
  { level: "none", icon: "⛔", label: "None", className: "level-none" },
];

export const levelColorMap: Record<PrivilegeLevel, string> = {
  user: "#5c5b57",
  businessUnit: "#2f7a3d",
  parentChild: "#1f6fa8",
  organization: "#9c2c2c",
  none: "#6d6a63",
};
