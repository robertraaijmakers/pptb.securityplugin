export type AssignmentMode = "role" | "user" | "role-team" | "team";

export type AssignmentSortColumn = "label" | "assigned";
export type AssignmentSortDirection = "asc" | "desc";

export type AssignmentItem = {
  id: string;
  label: string;
  subLabel: string;
  assigned: boolean;
};
