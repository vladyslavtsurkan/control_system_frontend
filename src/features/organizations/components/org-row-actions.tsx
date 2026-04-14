"use client";

import { LogOut as LeaveIcon, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrgPermissions } from "@/features/organizations";
import type { OrganizationWithRole } from "@/features/organizations/types";

interface OrgRowActionsProps {
  org: OrganizationWithRole;
  onManageMembers: (org: OrganizationWithRole) => void;
  onEdit: (org: OrganizationWithRole) => void;
  onDelete: (org: OrganizationWithRole) => void;
  onLeave: (org: OrganizationWithRole) => void;
}

export function OrgRowActions({
  org,
  onManageMembers,
  onEdit,
  onDelete,
  onLeave,
}: OrgRowActionsProps) {
  const { isOwner, canManage } = getOrgPermissions(org.role);

  return (
    <>
      {canManage && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onManageMembers(org)}
          aria-label="Manage members"
        >
          <Users className="size-4" />
        </Button>
      )}
      {canManage && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(org)}
          aria-label="Edit organization"
        >
          <Pencil className="size-4" />
        </Button>
      )}
      {isOwner && (
        <Button
          variant="ghost"
          size="icon"
          className="text-red-600 hover:text-red-700"
          onClick={() => onDelete(org)}
          aria-label="Delete organization"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
      {!isOwner && (
        <Button
          variant="ghost"
          size="icon"
          className="text-orange-500 hover:text-orange-600"
          onClick={() => onLeave(org)}
          aria-label="Leave organization"
        >
          <LeaveIcon className="size-4" />
        </Button>
      )}
    </>
  );
}
