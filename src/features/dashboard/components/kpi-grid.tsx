"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { useGetSensorsQuery } from "@/store/api";
import { selectLiveKpis, selectLiveReadingsBySensor } from "@/store/selectors";
import { KpiCard } from "./kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sensor, SensorReading } from "@/features/sensors";

// Uses readings prefetched by getSensors for sparkline and KPI fallback.
function SensorKpiCard({ sensor }: { sensor: Sensor }) {
  const liveKpis = useAppSelector(selectLiveKpis);
  const liveReadingsBySensor = useAppSelector(selectLiveReadingsBySensor);
  const liveKpi = liveKpis[sensor.id];

  // Prefetched readings may be undefined/null/empty depending server response.
  const chartData = useMemo<SensorReading[]>(() => {
    if (!sensor.readings?.length) return [];
    return sensor.readings.map((r) => ({
      sensor_id: r.sensor_id,
      time: r.time,
      value: typeof r.payload.value === "number"
        ? r.payload.value
        : Number(r.payload.value ?? 0),
    }));
  }, [sensor.readings]);

  const mergedChartData = useMemo<SensorReading[]>(() => {
    const liveTail = liveReadingsBySensor[sensor.id] ?? [];
    const byTime = new Map<string, SensorReading>();
    for (const point of chartData) byTime.set(point.time, point);
    for (const point of liveTail) byTime.set(point.time, point);
    return Array.from(byTime.values()).sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  }, [chartData, liveReadingsBySensor, sensor.id]);

  // Derive the latest known value from merged history (used before the first WS event)
  const historicalLatest = mergedChartData.reduce<SensorReading | undefined>((latest, current) => {
    if (!latest) return current;
    return Date.parse(current.time) > Date.parse(latest.time) ? current : latest;
  }, undefined);

  // Prefer the live WS kpi; fall back to the last historical reading
  const effectiveKpi = liveKpi ?? (
    historicalLatest
      ? { value: historicalLatest.value, time: historicalLatest.time }
      : undefined
  );

  return (
    <KpiCard
      sensorId={sensor.id}
      sensorName={sensor.name}
      units={sensor.units}
      kpi={effectiveKpi}
      readings={mergedChartData}
    />
  );
}

export function KpiGrid() {
  const { data: sensorsData, isLoading } = useGetSensorsQuery({
    prefetchReadings: true,
    prefetchWindowMinutes: 15,
    offset: 0,
    limit: 100,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-50 w-full rounded-xl" />
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

