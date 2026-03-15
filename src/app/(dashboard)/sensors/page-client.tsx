"use client";

import { useState } from "react";
import { PlusCircle, RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetSensorsQuery, useGetServersQuery } from "@/store/api-slice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ListPageSizeSelect,
  ListPaginationFooter,
  ListResultsSummary,
} from "@/components/ui/list-pagination";
import { SensorTable } from "@/features/sensors/components/sensor-table";
import { SensorFormDialog } from "@/features/sensors/components/sensor-form-dialog";
import { getOffsetLimitPaginationMeta, useOffsetLimitPagination } from "@/hooks/use-offset-limit-pagination";
import { LIST_PAGE_SIZE_FALLBACK, LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";
import type { Sensor } from "@/types/models";

interface SensorsPageClientProps {
  initialPage: number;
  initialPerPage: number;
  initialServerFilter: string;
}

export default function SensorsPageClient({
  initialPage,
  initialPerPage,
  initialServerFilter,
}: SensorsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serverFilter = searchParams.get("server_id") ?? initialServerFilter;
  const pagination = useOffsetLimitPagination({
    initialLimit: initialPerPage,
    initialPage,
  });

  const { data, isLoading, refetch } = useGetSensorsQuery({
    opcServerId: serverFilter || undefined,
    ...pagination.queryArgs,
  }, {
    refetchOnMountOrArgChange: true,
  });
  const { data: serversData } = useGetServersQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Sensor | null>(null);

  const sensors = data?.items ?? [];
  const servers = serversData?.items ?? [];
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

  function openEdit(sensor: Sensor) {
    setEditTarget(sensor);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
          <Select
            value={serverFilter}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams.toString());
              const nextValue = v ?? "";
              if (nextValue) {
                params.set("server_id", nextValue);
              } else {
                params.delete("server_id");
              }
              params.set("page", "1");
              params.set("per_page", String(pagination.perPage));
              const next = params.toString();
              router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue>
                {serverFilter
                  ? (servers.find((srv) => srv.id === serverFilter)?.name ?? "All servers")
                  : "All servers"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All servers</SelectItem>
              {servers.map((srv) => (
                <SelectItem key={srv.id} value={srv.id}>
                  {srv.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ListPageSizeSelect
            id="sensors-page-size"
              value={pagination.perPage}
            options={LIST_PAGE_SIZE_OPTIONS}
            onChange={pagination.setLimitAndReset}
            wrapperClassName="flex items-center gap-2 rounded-md border px-3 py-1.5"
          />

          <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 size-4" />
            Add Sensor
          </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <SensorTable
          sensors={sensors}
          servers={servers}
          serverFilter={serverFilter}
          onEdit={openEdit}
        />
      )}

      <ListResultsSummary shownCount={sensors.length} totalCount={totalCount} noun="sensors" />

      <ListPaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={pagination.goPrev}
        onNext={pagination.goNext}
      />

      <SensorFormDialog
        key={editTarget?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTarget={editTarget}
        servers={servers}
        defaultServerId={serverFilter}
      />
    </div>
  );
}

