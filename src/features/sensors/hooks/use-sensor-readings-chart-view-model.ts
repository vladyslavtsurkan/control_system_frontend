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
    let min = chartData[0].value;
    let max = chartData[0].value;
    let sum = chartData[0].value;
    let latestMs = Date.parse(chartData[0].time);
    let latest = chartData[0];
    for (let i = 1; i < chartData.length; i++) {
      const { value, time } = chartData[i];
      if (value < min) min = value;
      if (value > max) max = value;
      sum += value;
      const ms = Date.parse(time);
      if (ms > latestMs) {
        latestMs = ms;
        latest = chartData[i];
      }
    }
    const avg = sum / chartData.length;

    return { min, max, avg, latest, count: chartData.length };
  }, [chartData]);

  const chartKey = `${sensorId}-${startTimeIso ?? "default-start"}-${endTimeIso ?? "default-end"}-${bucketInterval}`;

  return {
    chartData,
    stats,
    chartKey,
  };
}
