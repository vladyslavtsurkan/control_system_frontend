"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetSensorsQuery, useGetServersQuery } from "@/store/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ListPaginationFooter } from "@/components/ui/list-pagination";
import { SensorTable } from "@/features/sensors/components/sensor-table";
import { SensorFormDialog } from "@/features/sensors/components/sensor-form-dialog";
import { SensorsListControls } from "@/features/sensors/components/sensors-list-controls";
import { SensorsToolbar } from "@/features/sensors/components/sensors-toolbar";
import {
  getOffsetLimitPaginationMeta,
  useOffsetLimitPagination,
} from "@/hooks/use-offset-limit-pagination";
import {
  LIST_PAGE_SIZE_FALLBACK,
  LIST_PAGE_SIZE_OPTIONS,
} from "@/config/constants";
import type { Sensor } from "@/features/sensors/types";

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

  const { data, isLoading, refetch } = useGetSensorsQuery(
    {
      opcServerId: serverFilter || undefined,
      ...pagination.queryArgs,
    },
    {
      refetchOnMountOrArgChange: true,
    },
  );
  const { data: serversData } = useGetServersQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Sensor | null>(null);

  const sensors = data?.items ?? [];
  const servers = serversData?.items ?? [];
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

  function openEdit(sensor: Sensor) {
    setEditTarget(sensor);
    setDialogOpen(true);
  }

  function handleServerFilterChange(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue) {
      params.set("server_id", nextValue);
    } else {
      params.delete("server_id");
    }
    params.set("page", "1");
    params.set("per_page", String(pagination.perPage));
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <SensorsToolbar
        serverFilter={serverFilter}
        servers={servers}
        pageSize={pagination.perPage}
        pageSizeOptions={LIST_PAGE_SIZE_OPTIONS}
        onServerFilterChange={handleServerFilterChange}
        onPageSizeChange={pagination.setLimitAndReset}
        onRefresh={refetch}
        onCreate={openCreate}
      />

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

      <SensorsListControls
        shownCount={sensors.length}
        totalCount={totalCount}
      />

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
