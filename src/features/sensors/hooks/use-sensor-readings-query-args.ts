import { skipToken } from "@reduxjs/toolkit/query/react";
import type { GetReadingsParams } from "@/features/sensors/types";

interface UseSensorReadingsQueryArgsParams {
  sensorId: string;
  startTimeIso: string | undefined | null;
  endTimeIso: string | undefined | null;
  sampleEvery: number;
  rangeError: string | null;
}

export function useSensorReadingsQueryArgs({
  sensorId,
  startTimeIso,
  endTimeIso,
  sampleEvery,
  rangeError,
}: UseSensorReadingsQueryArgsParams) {
  const readingsArgs: GetReadingsParams | typeof skipToken =
    rangeError || startTimeIso === null || endTimeIso === null
      ? skipToken
      : {
          sensorId,
          startTime: startTimeIso,
          endTime: endTimeIso,
          sampleEvery,
        };

  return { readingsArgs };
}

