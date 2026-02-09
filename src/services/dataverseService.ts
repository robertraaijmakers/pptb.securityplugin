import { RoleSummary } from "../types/securityRole";
import { UserSummary } from "../types/systemUser";
import { TeamSummary } from "../types/team";
import { BusinessUnitSummary, DashboardUser, TeamMembership } from "../types/dashboard";

export const dataverseAPI = (window as any).dataverseAPI;

function buildPrivilegeReference(privilegeId: string): string {
  const apiEndpoint = (dataverseAPI as any)?.apiEndpoint as string | undefined;
  if (!apiEndpoint) {
    return `privileges(${privilegeId})`;
  }
  const separator = apiEndpoint.endsWith("/") ? "" : "/";
  return `${apiEndpoint}${separator}privileges(${privilegeId})`;
}

export async function queryAll(odataQuery: string) {
  const all: any[] = [];
  let response = await dataverseAPI.queryData(odataQuery);
  all.push(...(response.value ?? []));

  let nextLink = response["@odata.nextLink"];
  while (nextLink) {
    const match = nextLink.match(/\/api\/data\/v\d+(?:\.\d+)?\/(.*)$/);
    const nextQuery = match && match[1] ? match[1] : nextLink;
    response = await dataverseAPI.queryData(nextQuery);
    all.push(...(response.value ?? []));
    nextLink = response["@odata.nextLink"];
  }

  return all;
}

export async function loadRoles(hideManagedRoles: boolean): Promise<RoleSummary[]> {
  const filter = hideManagedRoles ? "&$filter=ismanaged eq false" : "";
  const response = await dataverseAPI.queryData(
    `roles?$select=roleid,name,_parentrootroleid_value,ismanaged${filter}`,
  );
  const rootRoles = new Map<string, RoleSummary>();

  for (const entity of response.value ?? []) {
    if (hideManagedRoles && entity.ismanaged) {
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

  return Array.from(rootRoles.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export async function loadRoleRootMap(): Promise<Map<string, string>> {
  const response = await queryAll("roles?$select=roleid,_parentrootroleid_value");
  const map = new Map<string, string>();
  for (const role of response ?? []) {
    if (!role.roleid) {
      continue;
    }
    map.set(role.roleid, role._parentrootroleid_value ?? role.roleid);
  }
  return map;
}

export async function loadUsers(): Promise<UserSummary[]> {
  const response = await dataverseAPI.queryData(
    "systemusers?$select=systemuserid,fullname,domainname,_businessunitid_value,isdisabled,accessmode&$filter=isdisabled eq false and accessmode ne 3 and accessmode ne 5",
  );
  return (response.value ?? []).map((user: any) => ({
    id: user.systemuserid,
    name: user.fullname ?? user.domainname ?? "Unknown",
    domainName: user.domainname ?? "",
    businessUnitId: user._businessunitid_value ?? "",
  }));
}

export async function loadTeams(): Promise<TeamSummary[]> {
  const response = await dataverseAPI.queryData(
    "teams?$select=teamid,name,teamtype,_businessunitid_value,isdefault",
  );
  return (response.value ?? [])
    .filter((team: any) => !team.isdefault)
    .map((team: any) => ({
      id: team.teamid,
      name: team.name ?? "Unknown",
      teamType: typeof team.teamtype === "number" ? team.teamtype : null,
      businessUnitId: team._businessunitid_value ?? "",
    }));
}

export async function loadBusinessUnits(): Promise<BusinessUnitSummary[]> {
  const response = await queryAll("businessunits?$select=businessunitid,name");
  return (response ?? []).map((unit: any) => ({
    id: unit.businessunitid,
    name: unit.name ?? "Unknown",
  }));
}

export async function loadUsersForDashboard(): Promise<DashboardUser[]> {
  const response = await queryAll(
    "systemusers?$select=systemuserid,fullname,domainname,internalemailaddress,_businessunitid_value,isdisabled,accessmode,applicationid",
  );
  return (response ?? []).map((user: any) => ({
    id: user.systemuserid,
    name: user.fullname ?? user.domainname ?? "Unknown",
    email: user.internalemailaddress ?? user.domainname ?? "",
    businessUnitId: user._businessunitid_value ?? "",
    isDisabled: Boolean(user.isdisabled),
    accessMode: typeof user.accessmode === "number" ? user.accessmode : null,
    applicationId: user.applicationid ?? null,
  }));
}

export async function loadTeamMemberships(): Promise<TeamMembership[]> {
  const response = await queryAll("teammemberships?$select=teamid,systemuserid");
  return (response ?? [])
    .filter((membership: any) => membership.teamid && membership.systemuserid)
    .map((membership: any) => ({
      teamId: membership.teamid,
      userId: membership.systemuserid,
    }));
}

export async function loadUserRoleAssignments(): Promise<
  Array<{ roleId: string; userId: string }>
> {
  const response = await queryAll(
    "systemuserrolescollection?$select=roleid,systemuserid",
  );
  return (response ?? [])
    .filter((entry: any) => entry.roleid && entry.systemuserid)
    .map((entry: any) => ({
      roleId: entry.roleid,
      userId: entry.systemuserid,
    }));
}

export async function loadTeamRoleAssignments(): Promise<
  Array<{ roleId: string; teamId: string }>
> {
  const response = await queryAll("teamrolescollection?$select=roleid,teamid");
  return (response ?? [])
    .filter((entry: any) => entry.roleid && entry.teamid)
    .map((entry: any) => ({
      roleId: entry.roleid,
      teamId: entry.teamid,
    }));
}

// Bulk role assignment retrieval is handled via systemuserrolescollection/teamrolescollection.

export async function resolveRoleForBusinessUnit(
  rootRoleId: string,
  businessUnitId: string,
): Promise<string | null> {
  if (!businessUnitId) {
    return null;
  }
  const response = await dataverseAPI.queryData(
    `roles?$select=roleid&$filter=_parentrootroleid_value eq ${rootRoleId} and _businessunitid_value eq ${businessUnitId}`,
  );
  return response.value?.[0]?.roleid ?? null;
}

export async function retrieveRolePrivileges(roleId: string) {
  const query = `RetrieveRolePrivilegesRole(RoleId=${roleId})`;
  const response = await dataverseAPI.queryData(query);
  return response?.RolePrivileges ?? response?.rolePrivileges ?? response?.value ?? [];
}

export async function addPrivilegesToRole(
  roleId: string,
  privileges: Array<{ PrivilegeId: string; Depth: string; PrivilegeName?: string }>,
) {
  if (privileges.length === 0) {
    return;
  }
  await dataverseAPI.execute({
    entityName: "role",
    entityId: roleId,
    operationName: "AddPrivilegesRole",
    operationType: "action",
    parameters: {
      Privileges: privileges,
    },
  });
}

export async function removePrivilegesFromRole(roleId: string, privilegeId: string) {
  if (!privilegeId) {
    return;
  }
  const privilegeReference = buildPrivilegeReference(privilegeId);
  await dataverseAPI.execute({
    entityName: "role",
    entityId: roleId,
    operationName: "RemovePrivilegeRole",
    operationType: "action",
    parameters: {
      Privilege: privilegeReference,
    },
  });
}

export async function associateRoleToUser(userId: string, roleId: string) {
  await dataverseAPI.associate(
    "systemuser",
    userId,
    "systemuserroles_association",
    "role",
    roleId,
  );
}

export async function disassociateRoleFromUser(userId: string, roleId: string) {
  await dataverseAPI.disassociate(
    "systemuser",
    userId,
    "systemuserroles_association",
    roleId,
  );
}

export async function associateRoleToTeam(teamId: string, roleId: string) {
  await dataverseAPI.associate(
    "team",
    teamId,
    "teamroles_association",
    "role",
    roleId,
  );
}

export async function disassociateRoleFromTeam(teamId: string, roleId: string) {
  await dataverseAPI.disassociate(
    "team",
    teamId,
    "teamroles_association",
    roleId,
  );
}
