import { useAppSelector } from "@/store/hooks";
import { selectActiveOrgId } from "@/store/selectors";
import { useGetOrganizationsQuery } from "@/store/api";
import type { UserRoleInOrg } from "@/features/organizations/types";

export interface OrgPermissions {
  /** The user's role in the currently active organization, or null if unknown. */
  role: UserRoleInOrg | null;
  /** True only when the user is the organization owner. */
  isOwner: boolean;
  /**
   * True when the user is an owner or admin.
   * Only these roles may create, update, or delete resources.
   * The `member` role is read-only — the backend returns 403 on all write operations.
   */
  canManage: boolean;
}

/**
 * Pure helper — derives permissions from a role value without any React hooks.
 * Use this when the role is already available as a plain value (e.g. a row's
 * `org.role` field). For the active-org role, use `useOrgPermissions()` instead.
 */
export function getOrgPermissions(
  role: UserRoleInOrg | null | undefined,
): OrgPermissions {
  return {
    role: role ?? null,
    isOwner: role === "owner",
    canManage: role === "owner" || role === "admin",
  };
}

/**
 * Returns the current user's permissions for the active organization.
 *
 * Reads from the already-cached organizations query (same call used by the
 * sidebar) so no extra network request is ever made.
 *
 * @example
 * const { canManage } = useOrgPermissions();
 * // hide / disable all create-update-delete UI when !canManage
 */
export function useOrgPermissions(): OrgPermissions {
  const activeOrgId = useAppSelector(selectActiveOrgId);
  const { data } = useGetOrganizationsQuery();

  const role =
    (activeOrgId && data?.items.find((o) => o.id === activeOrgId)?.role) ||
    null;

  return getOrgPermissions(role);
}
