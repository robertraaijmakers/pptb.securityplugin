export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  businessUnitId: string;
  isDisabled: boolean;
  accessMode: number | null;
  applicationId: string | null;
};

export type BusinessUnitSummary = {
  id: string;
  name: string;
};

export type TeamMembership = {
  teamId: string;
  userId: string;
};
