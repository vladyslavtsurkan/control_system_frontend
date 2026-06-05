"use client";

import { useState, useTransition, useOptimistic } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  useGetOrganizationsQuery,
} from "@/store/api";
import { deleteOrganization, leaveOrganization } from "@/features/organizations/actions/org-actions";
import { useAppSelector } from "@/store/hooks";
import { selectActiveOrgId } from "@/store/selectors";
import { ListPaginationFooter } from "@/components/ui/list-pagination";
import { MembersDialog } from "@/features/organizations/components/members-dialog";
import { OrganizationFormDialog } from "@/features/organizations/components/organization-form-dialog";
import { OrganizationsActionBar } from "@/features/organizations/components/organizations-action-bar";
import { OrganizationsListControls } from "@/features/organizations/components/organizations-list-controls";
import { OrganizationsTable } from "@/features/organizations/components/organizations-table";
import { useConfirm } from "@/hooks/use-confirm";
import {
  getOffsetLimitPaginationMeta,
  useOffsetLimitPagination,
} from "@/hooks/use-offset-limit-pagination";
import {
  LIST_PAGE_SIZE_FALLBACK,
  LIST_PAGE_SIZE_OPTIONS,
} from "@/config/constants";
import type { OrganizationWithRole } from "@/features/organizations/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

interface OrganizationsPageClientProps {
  initialPage: number;
  initialPerPage: number;
  initialData?: PaginatedResponse<OrganizationWithRole> | null;
}

export default function OrganizationsPageClient({
  initialPage,
  initialPerPage,
  initialData,
}: OrganizationsPageClientProps) {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const activeOrgId = useAppSelector(selectActiveOrgId);
  const pagination = useOffsetLimitPagination({
    initialLimit: initialPerPage,
    initialPage,
  });

  const { data, isLoading, refetch } = useGetOrganizationsQuery(
    pagination.queryArgs,
    { refetchOnMountOrArgChange: true },
  );
  const [, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrganizationWithRole | null>(
    null,
  );
  const [membersTarget, setMembersTarget] =
    useState<OrganizationWithRole | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const isInitialQuery =
    pagination.page === initialPage &&
    pagination.perPage === initialPerPage;

  const activeOrgsData = isInitialQuery ? (data ?? initialData) : data;

  const orgs = activeOrgsData?.items ?? [];

  const [optimisticOrgs, addOptimisticOrg] = useOptimistic(
    orgs,
    (state, { action, id }: { action: "delete" | "leave"; id: string }) => {
      if (action === "delete" || action === "leave") {
        return state.filter((item) => item.id !== id);
      }
      return state;
    }
  );

  const { totalCount, totalPages, currentPage, canGoPrev, canGoNext } =
    getOffsetLimitPaginationMeta({
      count: activeOrgsData?.count,
      perPage: activeOrgsData?.per_page,
      totalPages: activeOrgsData?.total_pages,
      page: activeOrgsData?.page,
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
    if (
      !(await confirm({
        description: t("deleteOrg", { name: org.name }),
        destructive: true,
      }))
    ) {
      return;
    }

    startTransition(async () => {
      addOptimisticOrg({ action: "delete", id: org.id });
      try {
        const res = await deleteOrganization(org.id);
        if (res.success) {
          toast.success(t("orgDeleted"));
        } else {
          toast.error(res.error || tCommon("deleteFailed"));
        }
      } catch {
        toast.error(tCommon("deleteFailed"));
      }
    });
  }

  async function handleLeave(org: OrganizationWithRole) {
    if (
      !(await confirm({
        title: t("leaveOrg"),
        description: t("leaveOrgDescription", { name: org.name }),
        confirmLabel: t("leave"),
      }))
    ) {
      return;
    }

    startTransition(async () => {
      addOptimisticOrg({ action: "leave", id: org.id });
      try {
        const res = await leaveOrganization(org.id);
        if (res.success) {
          toast.success(t("leftOrg", { name: org.name }));
        } else {
          toast.error(res.error || t("failedToLeave"));
        }
      } catch {
        toast.error(t("failedToLeave"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <OrganizationsActionBar onRefresh={refetch} onCreate={openCreate} />

      <OrganizationsListControls
        shownCount={optimisticOrgs.length}
        totalCount={totalCount}
        pageSize={pagination.perPage}
        pageSizeOptions={LIST_PAGE_SIZE_OPTIONS}
        onPageSizeChange={pagination.setLimitAndReset}
      />

      <OrganizationsTable
        organizations={optimisticOrgs}
        activeOrgId={activeOrgId}
        isLoading={isLoading && !activeOrgsData}
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
