import { useSensorReadingsChartViewModel } from "./use-sensor-readings-chart-view-model";
import { useSensorReadingsQueryArgs } from "./use-sensor-readings-query-args";
import type {
  BucketInterval,
  ReadingsBucketedResponse,
} from "@/features/sensors/types";

interface UseSensorReadingsViewModelParams {
  sensorId: string;
  startTimeIso: string | undefined | null;
  endTimeIso: string | undefined | null;
  bucketInterval: BucketInterval;
  rangeError: string | null;
  readingsPage?: ReadingsBucketedResponse;
}

export function useSensorReadingsViewModel({
  sensorId,
  startTimeIso,
  endTimeIso,
  bucketInterval,
  rangeError,
  readingsPage,
}: UseSensorReadingsViewModelParams) {
  const { readingsArgs } = useSensorReadingsQueryArgs({
    sensorId,
    startTimeIso,
    endTimeIso,
    bucketInterval,
    rangeError,
  });

  const { chartData, stats, chartKey } = useSensorReadingsChartViewModel({
    sensorId,
    startTimeIso,
    endTimeIso,
    bucketInterval,
    readingsPage,
  });

  return {
    readingsArgs,
    chartData,
    stats,
    chartKey,
  };
}
