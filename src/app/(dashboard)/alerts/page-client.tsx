"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useDeleteAlertRuleMutation,
  useGetAlertRulesQuery,
  useGetSensorsQuery,
} from "@/store/api-slice";
import { ListPaginationFooter } from "@/components/ui/list-pagination";
import { AlertRuleFormDialog } from "@/features/alerts/components/alert-rule-form-dialog";
import { AlertsActionBar } from "@/features/alerts/components/alerts-action-bar";
import { AlertsListControls } from "@/features/alerts/components/alerts-list-controls";
import { AlertsTable } from "@/features/alerts/components/alerts-table";
import { useConfirm } from "@/hooks/use-confirm";
import { getOffsetLimitPaginationMeta, useOffsetLimitPagination } from "@/hooks/use-offset-limit-pagination";
import { LIST_PAGE_SIZE_FALLBACK, LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";
import type { AlertRule } from "@/types/models";

interface AlertsPageClientProps {
  initialPage: number;
  initialPerPage: number;
}

export default function AlertsPageClient({
  initialPage,
  initialPerPage,
}: AlertsPageClientProps) {
  const pagination = useOffsetLimitPagination({
    initialLimit: initialPerPage,
    initialPage,
  });
  const { data, isLoading, refetch } = useGetAlertRulesQuery(
    pagination.queryArgs,
    { refetchOnMountOrArgChange: true },
  );
  const { data: sensorsData } = useGetSensorsQuery();
  const [deleteRule] = useDeleteAlertRuleMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AlertRule | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const sensors = sensorsData?.items ?? [];
  const rules = data?.items ?? [];
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

  function openEdit(rule: AlertRule) {
    setEditTarget(rule);
    setDialogOpen(true);
  }

  async function handleDelete(id: string, name: string) {
    if (!await confirm({
      description: `Delete alert rule "${name}"?`,
      destructive: true,
    })) {
      return;
    }

    try {
      await deleteRule(id).unwrap();
      toast.success("Alert rule deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  }

  return (
    <div className="space-y-6">
      <AlertsActionBar onRefresh={refetch} onCreate={openCreate} />

      <AlertsListControls
        shownCount={rules.length}
        totalCount={totalCount}
        pageSize={pagination.perPage}
        pageSizeOptions={LIST_PAGE_SIZE_OPTIONS}
        onPageSizeChange={pagination.setLimitAndReset}
      />

      <AlertsTable
        rules={rules}
        sensors={sensors}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(rule) => handleDelete(rule.id, rule.name)}
      />

      <ListPaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={pagination.goPrev}
        onNext={pagination.goNext}
      />

      <AlertRuleFormDialog
        key={editTarget?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTarget={editTarget}
        sensors={sensors}
      />

      <ConfirmDialog />
    </div>
  );
}

