"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useGetServersQuery, useDeleteServerMutation } from "@/store/api";
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

interface ServersPageClientProps {
  initialPage: number;
  initialPerPage: number;
}

export default function ServersPageClient({
  initialPage,
  initialPerPage,
}: ServersPageClientProps) {
  const pagination = useOffsetLimitPagination({
    initialLimit: initialPerPage,
    initialPage,
  });
  const { data, isLoading, refetch } = useGetServersQuery(
    pagination.queryArgs,
    { refetchOnMountOrArgChange: true },
  );
  const [deleteServer] = useDeleteServerMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OpcServer | null>(null);
  const [apiKeyServer, setApiKeyServer] = useState<OpcServer | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();
  const { canManage } = useOrgPermissions();

  const servers = data?.items ?? [];
  const { totalCount, totalPages, currentPage, canGoPrev, canGoNext } =
    getOffsetLimitPaginationMeta({
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

  function openEdit(server: OpcServer) {
    setEditTarget(server);
    setDialogOpen(true);
  }

  async function handleDelete(id: string, name: string) {
    if (
      !(await confirm({
        description: `Delete server "${name}"?`,
        destructive: true,
      }))
    ) {
      return;
    }

    try {
      await deleteServer(id).unwrap();
      toast.success("Server deleted.");
    } catch {
      toast.error("Delete failed.");
    }
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
        isLoading={isLoading}
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
