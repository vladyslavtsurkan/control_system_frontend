import { useMemo } from "react";
import type { SensorReadingsStatsData } from "@/features/sensors/components";
import type {
  BucketInterval,
  ReadingsBucketedResponse,
  SensorReading,
} from "@/features/sensors/types";

interface UseSensorReadingsChartViewModelParams {
  sensorId: string;
  startTimeIso: string | undefined | null;
  endTimeIso: string | undefined | null;
  bucketInterval: BucketInterval;
  readingsPage?: ReadingsBucketedResponse;
}

export function useSensorReadingsChartViewModel({
  sensorId,
  startTimeIso,
  endTimeIso,
  bucketInterval,
  readingsPage,
}: UseSensorReadingsChartViewModelParams) {
  const chartData = useMemo<SensorReading[]>(() => {
    if (!readingsPage) return [];
    const maxLen = Math.min(
      readingsPage.times.length,
      readingsPage.values.length,
    );

    if (readingsPage.times.length !== readingsPage.values.length) {
      console.warn(
        "[Readings] times/values length mismatch; truncating to aligned points.",
        {
          sensorId,
          timesLength: readingsPage.times.length,
          valuesLength: readingsPage.values.length,
          truncatedTo: maxLen,
        },
      );
    }

    return Array.from({ length: maxLen }, (_, index) => ({
      sensor_id: sensorId,
      time: readingsPage.times[index],
      value: readingsPage.values[index],
    }));
  }, [readingsPage, sensorId]);

  const stats = useMemo<SensorReadingsStatsData | null>(() => {
    if (!chartData.length) return null;
    const values = chartData.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = chartData.reduce(
      (mostRecent, current) =>
        Date.parse(current.time) > Date.parse(mostRecent.time)
          ? current
          : mostRecent,
      chartData[0],
    );

    return { min, max, avg, latest, count: chartData.length };
  }, [chartData]);

  const chartKey = `${sensorId}-${startTimeIso ?? "default-start"}-${endTimeIso ?? "default-end"}-${bucketInterval}`;

  return {
    chartData,
    stats,
    chartKey,
  };
}
