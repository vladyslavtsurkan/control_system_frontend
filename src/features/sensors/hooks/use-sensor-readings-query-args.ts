import { skipToken } from "@reduxjs/toolkit/query";

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
  const readingsArgs =
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

