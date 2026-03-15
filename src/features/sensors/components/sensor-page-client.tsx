"use client";

import {
  useGetSensorQuery,
  useGetReadingsQuery,
  useGetAlertsQuery,
} from "@/store/api";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useAppSelector } from "@/store/hooks";
import { selectLiveAlerts } from "@/store/selectors";
import { getOffsetLimitPaginationMeta, useOffsetLimitPagination } from "@/hooks/use-offset-limit-pagination";
import { LIST_PAGE_SIZE_FALLBACK, LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";
import {
  SensorAlertsCard,
  SensorDetailHeader,
  SensorEditDialog,
  SensorReadingsChartCard,
  SensorReadingsFiltersCard,
  SensorReadingsStats,
} from "@/features/sensors/components";
import {
  useSensorAlertRows,
  useSensorDetailActions,
  useSensorEditController,
  useSensorReadingsChartViewModel,
  useSensorReadingsFilters,
  useSensorReadingsQueryArgs,
} from "@/features/sensors/hooks";

interface SensorPageClientProps {
  id: string;
  initialRange?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialSampleEvery: number;
  initialAlertsPage: number;
  initialAlertsPerPage: number;
}

export default function SensorPageClient({
  id,
  initialRange,
  initialStartTime,
  initialEndTime,
  initialSampleEvery,
  initialAlertsPage,
  initialAlertsPerPage,
}: SensorPageClientProps) {
  const alertsPagination = useOffsetLimitPagination({
    initialLimit: initialAlertsPerPage,
    initialPage: initialAlertsPage,
    pageParam: "alerts_page",
    perPageParam: "alerts_per_page",
  });
  const {
    activePreset,
    startTimeLocal,
    endTimeLocal,
    sampleEveryInput,
    sampleEvery,
    startTimeIso,
    endTimeIso,
    rangeError,
    maxWindowHours,
    onPresetChange,
    onLiveMode,
    onUseNowAsEndTime,
    onClear,
    onStartTimeChange,
    onEndTimeChange,
    onSampleEveryChange,
  } = useSensorReadingsFilters({
    initialRange,
    initialStartTime,
    initialEndTime,
    initialSampleEvery,
    alertsPerPage: alertsPagination.perPage,
  });

  const { readingsArgs } = useSensorReadingsQueryArgs({
    sensorId: id,
    startTimeIso,
    endTimeIso,
    sampleEvery,
    rangeError,
  });

  const { data: readingsPage, isLoading: readingsLoading } =
    useGetReadingsQuery(readingsArgs as Parameters<typeof useGetReadingsQuery>[0] | typeof skipToken);

  const {
    data: alertsPage,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useGetAlertsQuery(
    {
      sensor_id: id,
      ...alertsPagination.queryArgs,
    },
    { refetchOnMountOrArgChange: true },
  );

  const { data: sensor } = useGetSensorQuery(id);
  const liveAlerts = useAppSelector(selectLiveAlerts);

  const {
    updating,
    editOpen,
    setEditOpen,
    form,
    setForm,
    openEdit,
    handleEditSubmit,
  } = useSensorEditController({
    sensorId: id,
    sensor,
  });

  const {
    acknowledging,
    acknowledgingId,
    handleDelete,
    handleAcknowledge,
    ConfirmDialog,
  } = useSensorDetailActions({
    sensorId: id,
    sensorName: sensor?.name,
    refetchAlerts,
  });

  const {
    totalCount: totalAlerts,
    totalPages: alertTotalPages,
    currentPage: alertCurrentPage,
    canGoPrev: canGoPrevAlerts,
    canGoNext: canGoNextAlerts,
  } = getOffsetLimitPaginationMeta({
    count: alertsPage?.count,
    perPage: alertsPage?.per_page,
    totalPages: alertsPage?.total_pages,
    page: alertsPage?.page,
    offset: alertsPagination.offset,
    requestedLimit: alertsPagination.limit,
    fallbackLimit: LIST_PAGE_SIZE_FALLBACK,
  });

  const { chartData, stats, chartKey } = useSensorReadingsChartViewModel({
    sensorId: id,
    startTimeIso,
    endTimeIso,
    sampleEvery,
    readingsPage,
  });

  const alertRows = useSensorAlertRows({
    sensorId: id,
    alerts: alertsPage?.items,
    liveAlerts,
  });

  const unit = sensor?.units ?? "";

  return (
    <div className="space-y-6">
      <SensorDetailHeader sensor={sensor} onEdit={openEdit} onDelete={handleDelete} />

      <SensorReadingsFiltersCard
        activePreset={activePreset}
        startTimeLocal={startTimeLocal}
        endTimeLocal={endTimeLocal}
        sampleEveryInput={sampleEveryInput}
        rangeError={rangeError}
        maxWindowHours={maxWindowHours}
        onPresetChange={onPresetChange}
        onLiveMode={onLiveMode}
        onUseNowAsEndTime={onUseNowAsEndTime}
        onClear={onClear}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onSampleEveryChange={onSampleEveryChange}
      />

      <SensorReadingsStats stats={stats} unit={unit} isLoading={readingsLoading} />

      <SensorReadingsChartCard
        isLoading={readingsLoading}
        chartKey={chartKey}
        chartData={chartData}
        unit={unit}
        sensorName={sensor?.name}
      />

      <SensorAlertsCard
        rows={alertRows}
        totalCount={totalAlerts}
        isLoading={alertsLoading}
        pageSize={alertsPagination.perPage}
        pageSizeOptions={LIST_PAGE_SIZE_OPTIONS}
        currentPage={alertCurrentPage}
        totalPages={alertTotalPages}
        canGoPrev={canGoPrevAlerts}
        canGoNext={canGoNextAlerts}
        acknowledging={acknowledging}
        acknowledgingId={acknowledgingId}
        onRefresh={refetchAlerts}
        onPageSizeChange={alertsPagination.setLimitAndReset}
        onPrev={alertsPagination.goPrev}
        onNext={alertsPagination.goNext}
        onAcknowledge={handleAcknowledge}
      />

      <SensorEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        form={form}
        updating={updating}
        onSubmit={handleEditSubmit}
        onFormChange={setForm}
      />

      <ConfirmDialog />
    </div>
  );
}




