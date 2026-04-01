import { skipToken } from "@reduxjs/toolkit/query/react";
import type {
  BucketInterval,
  GetReadingsParams,
} from "@/features/sensors/types";

interface UseSensorReadingsQueryArgsParams {
  sensorId: string;
  startTimeIso: string | undefined | null;
  endTimeIso: string | undefined | null;
  bucketInterval: BucketInterval;
  rangeError: string | null;
}

export function useSensorReadingsQueryArgs({
  sensorId,
  startTimeIso,
  endTimeIso,
  bucketInterval,
  rangeError,
}: UseSensorReadingsQueryArgsParams) {
  const readingsArgs: GetReadingsParams | typeof skipToken =
    rangeError || startTimeIso === null || endTimeIso === null
      ? skipToken
      : {
          sensorId,
          startTime: startTimeIso,
          endTime: endTimeIso,
          bucketInterval,
        };

  return { readingsArgs };
}
