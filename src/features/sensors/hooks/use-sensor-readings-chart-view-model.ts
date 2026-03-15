import { useMemo } from "react";
import type { SensorReadingsStatsData } from "@/features/sensors/components";
import type { ReadingResponse, SensorReading } from "@/types/models";

interface UseSensorReadingsChartViewModelParams {
  sensorId: string;
  startTimeIso: string | undefined | null;
  endTimeIso: string | undefined | null;
  sampleEvery: number;
  readingsPage?: { items: ReadingResponse[] };
}

export function useSensorReadingsChartViewModel({
  sensorId,
  startTimeIso,
  endTimeIso,
  sampleEvery,
  readingsPage,
}: UseSensorReadingsChartViewModelParams) {
  const chartData = useMemo<SensorReading[]>(() => {
    if (!readingsPage) return [];
    return readingsPage.items.map((reading) => ({
      sensor_id: reading.sensor_id,
      time: reading.time,
      value:
        typeof reading.payload.value === "number"
          ? reading.payload.value
          : Number(reading.payload.value ?? 0),
    }));
  }, [readingsPage]);

  const stats = useMemo<SensorReadingsStatsData | null>(() => {
    if (!chartData.length) return null;
    const values = chartData.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = chartData.reduce((mostRecent, current) =>
      Date.parse(current.time) > Date.parse(mostRecent.time) ? current : mostRecent,
    chartData[0]);

    return { min, max, avg, latest, count: chartData.length };
  }, [chartData]);

  const chartKey = `${sensorId}-${startTimeIso ?? "default-start"}-${endTimeIso ?? "default-end"}-${sampleEvery}`;

  return {
    chartData,
    stats,
    chartKey,
  };
}

