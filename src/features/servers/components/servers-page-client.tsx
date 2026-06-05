"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useGetServersQuery } from "@/store/api";
import { deleteServer } from "@/features/servers/actions/server-actions";
import { ListPaginationFooter } from "@/components/ui/list-pagination";
import { ServerFormDialog } from "@/features/servers/components/server-form-dialog";
import { ApiKeyDialog } from "@/features/servers/components/api-key-dialog";
import { ServersActionBar } from "@/features/servers/components/servers-action-bar";
import { ServersListControls } from "@/features/servers/components/servers-list-controls";
import { ServersTable } from "@/features/servers/components/servers-table";
import { useOrgPermissions } from "@/features/organizations";
import { useConfirm } from "@/hooks/use-confirm";
import {
  getOffsetLimitPaginationMeta,
  useOffsetLimitPagination,
} from "@/hooks/use-offset-limit-pagination";
import {
  LIST_PAGE_SIZE_FALLBACK,
  LIST_PAGE_SIZE_OPTIONS,
} from "@/config/constants";
import type { OpcServer } from "@/features/servers/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

interface ServersPageClientProps {
  initialPage: number;
  initialPerPage: number;
  initialData?: PaginatedResponse<OpcServer> | null;
}

export default function ServersPageClient({
  initialPage,
  initialPerPage,
  initialData,
}: ServersPageClientProps) {
  const t = useTranslations("servers");
  const tCommon = useTranslations("common");
  const pagination = useOffsetLimitPagination({
    initialLimit: initialPerPage,
    initialPage,
  });
  const { data, isLoading, refetch } = useGetServersQuery(
    pagination.queryArgs,
    { refetchOnMountOrArgChange: true },
  );
  const [isPending, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OpcServer | null>(null);
  const [apiKeyServer, setApiKeyServer] = useState<OpcServer | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();
  const { canManage } = useOrgPermissions();

  const isInitialQuery =
    pagination.page === initialPage &&
    pagination.perPage === initialPerPage;

  const activeServersData = isInitialQuery ? (data ?? initialData) : data;

  const servers = activeServersData?.items ?? [];
  const { totalCount, totalPages, currentPage, canGoPrev, canGoNext } =
    getOffsetLimitPaginationMeta({
      count: activeServersData?.count,
      perPage: activeServersData?.per_page,
      totalPages: activeServersData?.total_pages,
      page: activeServersData?.page,
      offset: pagination.offset,
      requestedLimit: pagination.limit,
      fallbackLimit: LIST_PAGE_SIZE_FALLBACK,
    });

  function openCreate() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(server: OpcServer) {
    setEditTarget(server);
    setDialogOpen(true);
  }

  async function handleDelete(id: string, name: string) {
    if (
      !(await confirm({
        description: t("deleteServer", { name }),
        destructive: true,
      }))
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteServer(id);
      if (res.success) {
        toast.success(t("serverDeleted"));
        refetch();
      } else {
        toast.error(res.error || tCommon("deleteFailed"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <ServersActionBar
        onRefresh={refetch}
        onCreate={openCreate}
        canManage={canManage}
      />

      <ServersListControls
        shownCount={servers.length}
        totalCount={totalCount}
        pageSize={pagination.perPage}
        pageSizeOptions={LIST_PAGE_SIZE_OPTIONS}
        onPageSizeChange={pagination.setLimitAndReset}
      />

      <ServersTable
        servers={servers}
        isLoading={isLoading && !activeServersData}
        onEdit={openEdit}
        onManageApiKey={setApiKeyServer}
        onDelete={(server) => handleDelete(server.id, server.name)}
        canManage={canManage}
      />

      <ListPaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={pagination.goPrev}
        onNext={pagination.goNext}
      />

      <ServerFormDialog
        key={editTarget?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTarget={editTarget}
      />

      {apiKeyServer && (
        <ApiKeyDialog
          server={apiKeyServer}
          open={!!apiKeyServer}
          onOpenChange={(open) => {
            if (!open) {
              setApiKeyServer(null);
            }
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
}
