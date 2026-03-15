"use client";

import { LogOut as LeaveIcon, Pencil, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate24 } from "@/lib/date-time";
import type { OrganizationWithRole } from "@/features/organizations/types";

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

interface OrganizationsTableProps {
  organizations: OrganizationWithRole[];
  activeOrgId?: string | null;
  isLoading: boolean;
  onManageMembers: (org: OrganizationWithRole) => void;
  onEdit: (org: OrganizationWithRole) => void;
  onDelete: (org: OrganizationWithRole) => void;
  onLeave: (org: OrganizationWithRole) => void;
}

export function OrganizationsTable({
  organizations,
  activeOrgId,
  isLoading,
  onManageMembers,
  onEdit,
  onDelete,
  onLeave,
}: OrganizationsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                No organizations found. Click &quot;New Organization&quot; to create one.
              </TableCell>
            </TableRow>
          ) : organizations.map((org) => (
            <TableRow key={org.id} className={org.id === activeOrgId ? "bg-muted/30" : ""}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {org.name}
                  {org.id === activeOrgId && (
                    <Badge variant="outline" className="text-xs">active</Badge>
                  )}
                </div>
                {org.description && (
                  <div className="text-xs text-muted-foreground">{org.description}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={ROLE_VARIANT[org.role]}>{org.role}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate24(org.created_at)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onManageMembers(org)}
                  aria-label="Manage members"
                >
                  <Users className="size-4" />
                </Button>
                {(org.role === "owner" || org.role === "admin") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(org)}
                    aria-label="Edit organization"
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
                {org.role === "owner" && (
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
                {org.role !== "owner" && (
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


