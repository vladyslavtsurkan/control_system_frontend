"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { useGetSensorsQuery, useGetReadingsQuery } from "@/store/api-slice";
import { selectLiveKpis } from "@/store/selectors";
import { KpiCard } from "./kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sensor, ReadingResponse, SensorReading } from "@/types/models";

// Fetches 1000 readings for a single sensor and returns the latest one.
// Keeps this logic in a child so each sensor gets its own RTK Query subscription.
function SensorKpiCard({ sensor }: { sensor: Sensor }) {
  const liveKpis = useAppSelector(selectLiveKpis);

  // Fetch the 1000 most-recent historical readings via REST on mount.
  // WS middleware will then patch this same cache entry with live data.
  const { data: readingsData } = useGetReadingsQuery(
    { sensor_id: sensor.id, limit: 1000 },
  );

  // Derive chart-ready readings from the REST cache
  const chartData = useMemo<SensorReading[]>(() => {
    if (!readingsData?.items?.length) return [];
    return readingsData.items.map((r: ReadingResponse) => ({
      sensor_id: r.sensor_id,
      time: r.time,
      value: typeof r.payload.value === "number"
        ? r.payload.value
        : Number(r.payload.value ?? 0),
    }));
  }, [readingsData]);

  // Derive the latest known value from REST (used before the first WS event)
  const historicalLast = chartData.length ? chartData[chartData.length - 1] : undefined;
  const liveKpi = liveKpis[sensor.id];

  // Prefer the live WS kpi; fall back to the last historical reading
  const effectiveKpi = liveKpi ?? (
    historicalLast
      ? { value: historicalLast.value, time: historicalLast.time }
      : undefined
  );

  return (
    <KpiCard
      sensorId={sensor.id}
      sensorName={sensor.name}
      units={sensor.units}
      kpi={effectiveKpi}
      readings={chartData}
    />
  );
}

export function KpiGrid() {
  const { data: sensorsData, isLoading } = useGetSensorsQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const sensors = sensorsData?.items ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {sensors.map((sensor) => (
        <SensorKpiCard key={sensor.id} sensor={sensor} />
      ))}
      {sensors.length === 0 && (
        <p className="col-span-full text-sm text-muted-foreground">
          No sensors found. Add an OPC UA Server and sensors first.
        </p>
      )}
    </div>
  );
}
