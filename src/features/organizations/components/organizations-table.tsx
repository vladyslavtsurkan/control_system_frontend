"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
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
import { OrgRowActions } from "@/features/organizations/components/org-row-actions";
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
  const t = useTranslations("organizations");

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
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("role")}</TableHead>
            <TableHead>{t("created")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {t("noOrganizations")}
              </TableCell>
            </TableRow>
          ) : (
            organizations.map((org) => (
              <TableRow
                key={org.id}
                className={org.id === activeOrgId ? "bg-muted/30" : ""}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {org.name}
                    {org.id === activeOrgId && (
                      <Badge variant="outline" className="text-xs">
                        {t("active")}
                      </Badge>
                    )}
                  </div>
                  {org.description && (
                    <div className="text-xs text-muted-foreground">
                      {org.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={ROLE_VARIANT[org.role]}>{org.role}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate24(org.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <OrgRowActions
                    org={org}
                    onManageMembers={onManageMembers}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onLeave={onLeave}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
