"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { useGetSensorsQuery } from "@/store/api";
import { KpiCard } from "./kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LiveKpi, Sensor, SensorReading } from "@/features/sensors";
import { useDashboardTelemetry } from "@/features/dashboard/hooks/use-dashboard-telemetry";
import {
  buildFallbackKpi,
  getLatestReading,
  mergeByTimestamp,
  toChartData,
} from "@/features/dashboard/lib/kpi-data";

const SKELETON_COUNT = 4;

// Uses readings prefetched by getSensors for sparkline and KPI fallback.
interface SensorKpiCardProps {
  sensor: Sensor;
  liveKpi: LiveKpi | undefined;
  liveTail: SensorReading[] | undefined;
}

const SensorKpiCard = memo(function SensorKpiCard({
  sensor,
  liveKpi,
  liveTail,
}: SensorKpiCardProps) {
  const chartData = toChartData(sensor);
  const mergedChartData = mergeByTimestamp(chartData, liveTail);
  const historicalLatest = getLatestReading(mergedChartData);
  const effectiveKpi = liveKpi ?? buildFallbackKpi(sensor.id, historicalLatest);

  return (
    <KpiCard
      sensorId={sensor.id}
      sensorName={sensor.name}
      units={sensor.units}
      kpi={effectiveKpi}
      readings={mergedChartData}
    />
  );
});

export function KpiGrid() {
  const t = useTranslations("dashboard");
  const { latestBySensor, readingsBySensor } = useDashboardTelemetry();

  const { data: sensorsData, isLoading } = useGetSensorsQuery({
    isWritable: false,
    prefetchReadings: true,
    prefetchWindowMinutes: 15,
    offset: 0,
    limit: 100,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-50 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const sensors = sensorsData?.items ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {sensors.map((sensor) => (
        <SensorKpiCard
          key={sensor.id}
          sensor={sensor}
          liveKpi={latestBySensor[sensor.id]}
          liveTail={readingsBySensor[sensor.id]}
        />
      ))}
      {sensors.length === 0 && (
        <p className="col-span-full text-sm text-muted-foreground">
          {t("noSensors")}
        </p>
      )}
    </div>
  );
}
