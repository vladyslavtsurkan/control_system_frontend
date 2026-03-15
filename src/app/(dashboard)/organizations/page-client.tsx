"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useDeleteOrganizationMutation,
  useGetOrganizationsQuery,
  useLeaveOrganizationMutation,
} from "@/store/api-slice";
import { useAppSelector } from "@/store/hooks";
import { selectActiveOrgId } from "@/store/selectors";
import { ListPaginationFooter } from "@/components/ui/list-pagination";
import { MembersDialog } from "@/features/organizations/components/members-dialog";
import { OrganizationFormDialog } from "@/features/organizations/components/organization-form-dialog";
import { OrganizationsActionBar } from "@/features/organizations/components/organizations-action-bar";
import { OrganizationsListControls } from "@/features/organizations/components/organizations-list-controls";
import { OrganizationsTable } from "@/features/organizations/components/organizations-table";
import { useConfirm } from "@/hooks/use-confirm";
import { getOffsetLimitPaginationMeta, useOffsetLimitPagination } from "@/hooks/use-offset-limit-pagination";
import { LIST_PAGE_SIZE_FALLBACK, LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";
import type { OrganizationWithRole } from "@/types/models";

interface OrganizationsPageClientProps {
  initialPage: number;
  initialPerPage: number;
}

export default function OrganizationsPageClient({
  initialPage,
  initialPerPage,
}: OrganizationsPageClientProps) {
  const activeOrgId = useAppSelector(selectActiveOrgId);
  const pagination = useOffsetLimitPagination({
    initialLimit: initialPerPage,
    initialPage,
  });

  const { data, isLoading, refetch } = useGetOrganizationsQuery(
    pagination.queryArgs,
    { refetchOnMountOrArgChange: true },
  );
  const [deleteOrg] = useDeleteOrganizationMutation();
  const [leaveOrg] = useLeaveOrganizationMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrganizationWithRole | null>(null);
  const [membersTarget, setMembersTarget] = useState<OrganizationWithRole | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const orgs = data?.items ?? [];
  const { totalCount, totalPages, currentPage, canGoPrev, canGoNext } = getOffsetLimitPaginationMeta({
    count: data?.count,
    perPage: data?.per_page,
    totalPages: data?.total_pages,
    page: data?.page,
    offset: pagination.offset,
    requestedLimit: pagination.limit,
    fallbackLimit: LIST_PAGE_SIZE_FALLBACK,
  });

  function openCreate() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(org: OrganizationWithRole) {
    setEditTarget(org);
    setDialogOpen(true);
  }

  async function handleDelete(org: OrganizationWithRole) {
    if (!await confirm({
      description: `Delete "${org.name}"? This cannot be undone.`,
      destructive: true,
    })) {
      return;
    }

    try {
      await deleteOrg(org.id).unwrap();
      toast.success("Organization deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  }

  async function handleLeave(org: OrganizationWithRole) {
    if (!await confirm({
      title: "Leave organization?",
      description: `Leave "${org.name}"?`,
      confirmLabel: "Leave",
    })) {
      return;
    }

    try {
      await leaveOrg(org.id).unwrap();
      toast.success(`Left "${org.name}".`);
    } catch {
      toast.error("Failed to leave organization.");
    }
  }

  return (
    <div className="space-y-6">
      <OrganizationsActionBar onRefresh={refetch} onCreate={openCreate} />

      <OrganizationsListControls
        shownCount={orgs.length}
        totalCount={totalCount}
        pageSize={pagination.perPage}
        pageSizeOptions={LIST_PAGE_SIZE_OPTIONS}
        onPageSizeChange={pagination.setLimitAndReset}
      />

      <OrganizationsTable
        organizations={orgs}
        activeOrgId={activeOrgId}
        isLoading={isLoading}
        onManageMembers={setMembersTarget}
        onEdit={openEdit}
        onDelete={handleDelete}
        onLeave={handleLeave}
      />

      <ListPaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={pagination.goPrev}
        onNext={pagination.goNext}
      />

      {dialogOpen && (
        <OrganizationFormDialog
          key={editTarget?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editTarget={editTarget}
          activeOrgId={activeOrgId}
        />
      )}

      {membersTarget && (
        <MembersDialog
          org={membersTarget}
          open={!!membersTarget}
          onOpenChange={(open) => {
            if (!open) {
              setMembersTarget(null);
            }
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
}

