import { api } from "@/store/api";
import { updateLiveKpi } from "@/store/ws-slice";
import type {
  GetReadingsParams,
  ReadingsBucketedResponse,
} from "@/features/sensors/types";
import type { WsTelemetryHandler } from "@/store/ws/base/ws-types";
import {
  normalizeTelemetry,
  parseIsoMs,
  resolveWindowBounds,
} from "@/features/sensors/ws/telemetry-normalizers";

const LIVE_READING_END_SKEW_TOLERANCE_MS = 5_000;
const MAX_WS_READINGS_GUARD_POINTS = 50_000;
const TELEMETRY_FINGERPRINT_TTL_MS = 30 * 1000;

export function createTelemetryEventHandler(): WsTelemetryHandler {
  const recentTelemetryFingerprints = new Map<string, number>();

  return (event, { storeApi, apiStore }) => {
    const telemetry = normalizeTelemetry(event);
    if (!telemetry) {
      console.warn("[WS] Ignoring malformed telemetry event:", event);
      return;
    }

    const { sensorId, value, time } = telemetry;

    const now = Date.now();
    for (const [fingerprint, seenAt] of recentTelemetryFingerprints.entries()) {
      if (now - seenAt > TELEMETRY_FINGERPRINT_TTL_MS) {
        recentTelemetryFingerprints.delete(fingerprint);
      }
    }

    const telemetryFingerprint = `${sensorId}|${time}|${value}`;
    if (recentTelemetryFingerprints.has(telemetryFingerprint)) {
      return;
    }
    recentTelemetryFingerprints.set(telemetryFingerprint, now);

    apiStore.dispatch(updateLiveKpi({ sensor_id: sensorId, value, time }));

    const queryCacheEntries = storeApi.getState().api.queries as Record<
      string,
      { endpointName?: string; originalArgs?: unknown } | undefined
    >;

    for (const entry of Object.values(queryCacheEntries)) {
      if (entry?.endpointName !== "getReadings") continue;

      const arg = entry.originalArgs as GetReadingsParams | undefined;
      if (arg?.sensorId !== sensorId) continue;
      if (arg?.endTime) continue;

      const readingTimeMs = parseIsoMs(time);
      if (readingTimeMs === null) {
        continue;
      }

      const nowMs = Date.now();
      const { startMs } = resolveWindowBounds(arg, nowMs);
      if (startMs !== null && readingTimeMs < startMs) {
        continue;
      }

      const dispatchThunk = apiStore.dispatch as (action: unknown) => unknown;
      dispatchThunk(
        (api.util.updateQueryData as unknown as (
          endpointName: string,
          args: unknown,
          updater: (draft: ReadingsBucketedResponse) => void,
        ) => unknown)(
          "getReadings",
          arg,
          (draft: ReadingsBucketedResponse) => {
            const alignedLen = Math.min(draft.times.length, draft.values.length);
            if (draft.times.length !== draft.values.length) {
              draft.times = draft.times.slice(0, alignedLen);
              draft.values = draft.values.slice(0, alignedLen);
            }

            const patchNowMs = Date.now();
            const { startMs: windowStartMs, endMs } = resolveWindowBounds(
              arg,
              patchNowMs,
            );
            const windowEndMs =
              endMs === null
                ? null
                : Math.max(endMs, readingTimeMs) +
                  LIVE_READING_END_SKEW_TOLERANCE_MS;

            const existingIndex = draft.times.findIndex((itemTime) => itemTime === time);

            if (existingIndex >= 0) {
              draft.values[existingIndex] = value;
            } else {
              const insertAt = draft.times.findIndex(
                (itemTime) => Date.parse(itemTime) < readingTimeMs,
              );
              if (insertAt === -1) {
                draft.times.push(time);
                draft.values.push(value);
              } else {
                draft.times.splice(insertAt, 0, time);
                draft.values.splice(insertAt, 0, value);
              }
            }

            const nextTimes: string[] = [];
            const nextValues: number[] = [];

            for (let i = 0; i < draft.times.length; i += 1) {
              const itemMs = parseIsoMs(draft.times[i]);
              if (itemMs === null) continue;

              const isInWindow =
                (windowStartMs === null || itemMs >= windowStartMs) &&
                (windowEndMs === null || itemMs <= windowEndMs);
              if (!isInWindow) continue;

              nextTimes.push(draft.times[i]);
              nextValues.push(draft.values[i]);
            }

            draft.times = nextTimes;
            draft.values = nextValues;

            if (draft.times.length > MAX_WS_READINGS_GUARD_POINTS) {
              draft.times.splice(MAX_WS_READINGS_GUARD_POINTS);
              draft.values.splice(MAX_WS_READINGS_GUARD_POINTS);
            }
          },
        ),
      );
    }
  };
}

