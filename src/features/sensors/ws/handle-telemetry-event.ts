import { api } from "@/store/api";
import { updateLiveKpi } from "@/store/ws-slice";
import type {
  GetReadingsParams,
  ReadingResponse,
} from "@/features/sensors/types";
import type { ItemsResponse } from "@/shared/types/pagination";
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

      const newReading: ReadingResponse = {
        sensor_id: sensorId,
        payload: { value },
        time,
      };

      const dispatchThunk = apiStore.dispatch as (action: unknown) => unknown;
      dispatchThunk(
        (api.util.updateQueryData as unknown as (
          endpointName: string,
          args: unknown,
          updater: (draft: ItemsResponse<ReadingResponse>) => void,
        ) => unknown)(
          "getReadings",
          arg,
          (draft: ItemsResponse<ReadingResponse>) => {
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

            const existingIndex = draft.items.findIndex(
              (item) => item.time === newReading.time,
            );

            if (existingIndex >= 0) {
              draft.items[existingIndex] = newReading;
            } else {
              const first = draft.items[0];
              const last = draft.items[draft.items.length - 1];
              if (!first || Date.parse(first.time) <= readingTimeMs) {
                draft.items.unshift(newReading);
              } else if (last && Date.parse(last.time) >= readingTimeMs) {
                draft.items.push(newReading);
              } else {
                const insertAt = draft.items.findIndex(
                  (item) => Date.parse(item.time) < readingTimeMs,
                );
                if (insertAt === -1) {
                  draft.items.push(newReading);
                } else {
                  draft.items.splice(insertAt, 0, newReading);
                }
              }
            }

            draft.items = draft.items.filter((item) => {
              const itemMs = parseIsoMs(item.time);
              return (
                itemMs !== null &&
                (windowStartMs === null || itemMs >= windowStartMs) &&
                (windowEndMs === null || itemMs <= windowEndMs)
              );
            });

            if (draft.items.length > MAX_WS_READINGS_GUARD_POINTS) {
              draft.items.splice(MAX_WS_READINGS_GUARD_POINTS);
            }
          },
        ),
      );
    }
  };
}

