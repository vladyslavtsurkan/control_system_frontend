"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, RefreshCw } from "lucide-react";
import { useGetAlertRulesQuery, useDeleteAlertRuleMutation, useGetSensorsQuery } from "@/store/api-slice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ListPageSizeSelect,
  ListPaginationFooter,
  ListResultsSummary,
} from "@/components/ui/list-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertRuleFormDialog, CONDITIONS, thresholdLabel } from "@/features/alerts/components/alert-rule-form-dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { getOffsetLimitPaginationMeta, useOffsetLimitPagination } from "@/hooks/use-offset-limit-pagination";
import { LIST_PAGE_SIZE_FALLBACK, LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";
import type { AlertRule, AlertSeverity } from "@/types/models";

const severityVariant: Record<AlertSeverity, "default" | "secondary" | "destructive" | "outline"> = {
  info: "secondary", warning: "default", critical: "destructive", fatal: "destructive",
};

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

  function openCreate() { setEditTarget(null); setDialogOpen(true); }
  function openEdit(rule: AlertRule) { setEditTarget(rule); setDialogOpen(true); }

  async function handleDelete(id: string, name: string) {
    if (!await confirm({
      description: `Delete alert rule "${name}"?`,
      destructive: true,
    })) return;
    try { await deleteRule(id).unwrap(); toast.success("Alert rule deleted."); }
    catch { toast.error("Delete failed."); }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh"><RefreshCw className="size-4" /></Button>
        <Button onClick={openCreate}><PlusCircle className="mr-2 size-4" />Add Rule</Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <ListResultsSummary shownCount={rules.length} totalCount={totalCount} noun="alert rules" />
        <ListPageSizeSelect
          id="alert-rules-page-size"
          value={pagination.perPage}
          options={LIST_PAGE_SIZE_OPTIONS}
          onChange={pagination.setLimitAndReset}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Sensor</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No alert rules configured yet.</TableCell></TableRow>
              ) : rules.map((rule) => {
                const sensor = sensors.find((s) => s.id === rule.sensor_id);
                const condMeta = CONDITIONS.find((c) => c.value === rule.condition);
                return (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{sensor?.name ?? rule.sensor_id}</TableCell>
                    <TableCell className="text-sm">{condMeta?.label ?? rule.condition}</TableCell>
                    <TableCell className="font-mono text-xs">{thresholdLabel(rule.threshold)}</TableCell>
                    <TableCell><Badge variant={severityVariant[rule.severity]}>{rule.severity}</Badge></TableCell>
                    <TableCell><Badge variant={rule.is_active ? "default" : "outline"}>{rule.is_active ? "active" : "paused"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(rule.id, rule.name)}><Trash2 className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ListPaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={pagination.goPrev}
        onNext={pagination.goNext}
      />

      <AlertRuleFormDialog key={editTarget?.id ?? "new"} open={dialogOpen} onOpenChange={setDialogOpen} editTarget={editTarget} sensors={sensors} />
      <ConfirmDialog />
    </div>
  );
}

