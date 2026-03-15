import { useSensorReadingsChartViewModel } from "./use-sensor-readings-chart-view-model";
import { useSensorReadingsQueryArgs } from "./use-sensor-readings-query-args";
import type { ReadingResponse } from "@/features/sensors/types";

interface UseSensorReadingsViewModelParams {
  sensorId: string;
  startTimeIso: string | undefined | null;
  endTimeIso: string | undefined | null;
  sampleEvery: number;
  rangeError: string | null;
  readingsPage?: { items: ReadingResponse[] };
}

export function useSensorReadingsViewModel({
  sensorId,
  startTimeIso,
  endTimeIso,
  sampleEvery,
  rangeError,
  readingsPage,
}: UseSensorReadingsViewModelParams) {
  const { readingsArgs } = useSensorReadingsQueryArgs({
    sensorId,
    startTimeIso,
    endTimeIso,
    sampleEvery,
    rangeError,
  });

  const { chartData, stats, chartKey } = useSensorReadingsChartViewModel({
    sensorId,
    startTimeIso,
    endTimeIso,
    sampleEvery,
    readingsPage,
  });

  return {
    readingsArgs,
    chartData,
    stats,
    chartKey,
  };
}


