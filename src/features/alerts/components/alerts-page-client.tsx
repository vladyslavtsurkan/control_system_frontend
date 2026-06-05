"use client";

import { useState, useTransition, useOptimistic } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  useGetAlertRulesQuery,
  useGetSensorsQuery,
} from "@/store/api";
import { deleteAlertRule } from "@/features/alerts/actions/alert-actions";
import { ListPaginationFooter } from "@/components/ui/list-pagination";
import { AlertRuleFormDialog } from "@/features/alerts/components/alert-rule-form-dialog";
import { AlertsActionBar } from "@/features/alerts/components/alerts-action-bar";
import { AlertsListControls } from "@/features/alerts/components/alerts-list-controls";
import { AlertsTable } from "@/features/alerts/components/alerts-table";
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
import type { AlertRule } from "@/features/alerts/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

interface AlertsPageClientProps {
  initialPage: number;
  initialPerPage: number;
  initialData?: PaginatedResponse<AlertRule> | null;
}

export default function AlertsPageClient({
  initialPage,
  initialPerPage,
  initialData,
}: AlertsPageClientProps) {
  const t = useTranslations("alerts");
  const tCommon = useTranslations("common");
  const pagination = useOffsetLimitPagination({
    initialLimit: initialPerPage,
    initialPage,
  });
  const { data, isLoading, refetch } = useGetAlertRulesQuery(
    pagination.queryArgs,
    { refetchOnMountOrArgChange: true },
  );
  const { data: sensorsData } = useGetSensorsQuery();
  const [, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AlertRule | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const { canManage } = useOrgPermissions();

  const isInitialQuery =
    pagination.page === initialPage &&
    pagination.perPage === initialPerPage;

  const activeAlertRulesData = isInitialQuery ? (data ?? initialData) : data;

  const sensors = sensorsData?.items ?? [];
  const rules = activeAlertRulesData?.items ?? [];

  const [optimisticRules, addOptimisticRule] = useOptimistic(
    rules,
    (state, { action, id }: { action: "delete"; id: string }) => {
      if (action === "delete") {
        return state.filter((item) => item.id !== id);
      }
      return state;
    }
  );

  const { totalCount, totalPages, currentPage, canGoPrev, canGoNext } =
    getOffsetLimitPaginationMeta({
      count: activeAlertRulesData?.count,
      perPage: activeAlertRulesData?.per_page,
      totalPages: activeAlertRulesData?.total_pages,
      page: activeAlertRulesData?.page,
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
    if (
      !(await confirm({
        description: t("deleteRule", { name }),
        destructive: true,
      }))
    ) {
      return;
    }

    startTransition(async () => {
      addOptimisticRule({ action: "delete", id });
      try {
        const res = await deleteAlertRule(id);
        if (res.success) {
          toast.success(t("ruleDeleted"));
        } else {
          toast.error(res.error || tCommon("deleteFailed"));
        }
      } catch {
        toast.error(tCommon("deleteFailed"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <AlertsActionBar
        onRefresh={refetch}
        onCreate={openCreate}
        canManage={canManage}
      />

      <AlertsListControls
        shownCount={optimisticRules.length}
        totalCount={totalCount}
        pageSize={pagination.perPage}
        pageSizeOptions={LIST_PAGE_SIZE_OPTIONS}
        onPageSizeChange={pagination.setLimitAndReset}
      />

      <AlertsTable
        rules={optimisticRules}
        sensors={sensors}
        isLoading={isLoading && !activeAlertRulesData}
        onEdit={openEdit}
        onDelete={(rule) => handleDelete(rule.id, rule.name)}
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
