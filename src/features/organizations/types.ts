export type UserRoleInOrg = "owner" | "admin" | "member";

export interface OrganizationWithRole {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  role: UserRoleInOrg;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string | null;
}

export interface UpdateOrganizationRequest {
  name?: string | null;
  description?: string | null;
}

export interface OrganizationMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
  role: UserRoleInOrg;
}

export interface ChangeRoleRequest {
  role: UserRoleInOrg;
}

