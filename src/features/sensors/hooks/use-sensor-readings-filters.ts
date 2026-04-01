"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SENSOR_RANGE_PRESETS,
  type SensorRangePresetKey,
} from "@/features/sensors/components";
import {
  BUCKET_INTERVAL_VALUES,
  DEFAULT_BUCKET_INTERVAL,
  type BucketInterval,
} from "@/features/sensors/types";

const MAX_READINGS_WINDOW_HOURS = 24 * 7;
const MAX_READINGS_WINDOW_MS = MAX_READINGS_WINDOW_HOURS * 60 * 60 * 1000;

function toDateTimeLocalValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

interface UseSensorReadingsFiltersParams {
  initialRange?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialBucketInterval: BucketInterval;
  alertsPerPage: number;
}

export function useSensorReadingsFilters({
  initialRange,
  initialStartTime,
  initialEndTime,
  initialBucketInterval,
  alertsPerPage,
}: UseSensorReadingsFiltersParams) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [defaultStartTimeLocal] = useState(() =>
    toDateTimeLocalValue(new Date(Date.now() - 3 * 60 * 60 * 1000)),
  );

  const activePresetParam =
    searchParams.get("range") ?? initialRange ?? undefined;
  const activePreset = useMemo<SensorRangePresetKey>(() => {
    if (activePresetParam === "custom") return "custom";
    if (
      SENSOR_RANGE_PRESETS.some((preset) => preset.key === activePresetParam)
    ) {
      return activePresetParam as SensorRangePresetKey;
    }
    return "3h";
  }, [activePresetParam]);

  const startTimeLocal =
    searchParams.get("start_time") ?? initialStartTime ?? defaultStartTimeLocal;
  const endTimeLocal = searchParams.get("end_time") ?? initialEndTime ?? "";
  const bucketIntervalInput =
    searchParams.get("bucket_interval") ?? initialBucketInterval;
  const bucketInterval = useMemo<BucketInterval>(() => {
    if (
      BUCKET_INTERVAL_VALUES.includes(bucketIntervalInput as BucketInterval)
    ) {
      return bucketIntervalInput as BucketInterval;
    }
    return DEFAULT_BUCKET_INTERVAL;
  }, [bucketIntervalInput]);

  const replaceQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const resetAlertsPaginationParams = useCallback(
    (params: URLSearchParams) => {
      params.set("alerts_page", "1");
      params.set("alerts_per_page", String(alertsPerPage));
    },
    [alertsPerPage],
  );

  const applyPreset = useCallback(
    (ms: number, key: Exclude<SensorRangePresetKey, "custom">) => {
      const now = new Date();
      const start = new Date(now.getTime() - ms);
      replaceQuery((params) => {
        params.set("start_time", toDateTimeLocalValue(start));
        params.delete("end_time");
        params.set("range", key);
        resetAlertsPaginationParams(params);
      });
    },
    [replaceQuery, resetAlertsPaginationParams],
  );

  const onUseNowAsEndTime = useCallback(() => {
    replaceQuery((params) => {
      params.set("end_time", toDateTimeLocalValue(new Date()));
      params.set("range", "custom");
      resetAlertsPaginationParams(params);
    });
  }, [replaceQuery, resetAlertsPaginationParams]);

  const onLiveMode = useCallback(() => {
    replaceQuery((params) => {
      params.delete("end_time");
      resetAlertsPaginationParams(params);
    });
  }, [replaceQuery, resetAlertsPaginationParams]);

  const onClear = useCallback(() => {
    replaceQuery((params) => {
      params.delete("start_time");
      params.delete("end_time");
      params.set("range", "custom");
      resetAlertsPaginationParams(params);
    });
  }, [replaceQuery, resetAlertsPaginationParams]);

  const onPresetChange = useCallback(
    (value: SensorRangePresetKey) => {
      if (value === "custom") {
        replaceQuery((params) => {
          params.set("range", "custom");
          resetAlertsPaginationParams(params);
        });
        return;
      }

      const preset = SENSOR_RANGE_PRESETS.find((p) => p.key === value);
      if (!preset) return;
      applyPreset(preset.ms, preset.key);
    },
    [applyPreset, replaceQuery, resetAlertsPaginationParams],
  );

  const onStartTimeChange = useCallback(
    (value: string) => {
      replaceQuery((params) => {
        if (value) {
          params.set("start_time", value);
        } else {
          params.delete("start_time");
        }
        params.set("range", "custom");
        resetAlertsPaginationParams(params);
      });
    },
    [replaceQuery, resetAlertsPaginationParams],
  );

  const onEndTimeChange = useCallback(
    (value: string) => {
      replaceQuery((params) => {
        if (value) {
          params.set("end_time", value);
        } else {
          params.delete("end_time");
        }
        params.set("range", "custom");
        resetAlertsPaginationParams(params);
      });
    },
    [replaceQuery, resetAlertsPaginationParams],
  );

  const onBucketIntervalChange = useCallback(
    (value: BucketInterval) => {
      replaceQuery((params) => {
        params.set("bucket_interval", value);
        resetAlertsPaginationParams(params);
      });
    },
    [replaceQuery, resetAlertsPaginationParams],
  );

  const startTimeIso = useMemo(() => {
    if (!startTimeLocal) return undefined;
    const ms = Date.parse(startTimeLocal);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms).toISOString();
  }, [startTimeLocal]);

  const endTimeIso = useMemo(() => {
    if (!endTimeLocal) return undefined;
    const ms = Date.parse(endTimeLocal);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms).toISOString();
  }, [endTimeLocal]);

  const rangeError = useMemo(() => {
    if (startTimeIso === null || endTimeIso === null) {
      return "Please enter valid start and end datetimes.";
    }
    if (
      startTimeIso &&
      endTimeIso &&
      Date.parse(startTimeIso) > Date.parse(endTimeIso)
    ) {
      return "Start time must be before or equal to end time.";
    }

    if (startTimeIso) {
      const startMs = Date.parse(startTimeIso);
      const effectiveEndMs = Date.parse(endTimeIso ?? new Date().toISOString());
      if (Number.isFinite(startMs) && Number.isFinite(effectiveEndMs)) {
        if (effectiveEndMs - startMs > MAX_READINGS_WINDOW_MS) {
          return `The maximum readings window is ${MAX_READINGS_WINDOW_HOURS} hours.`;
        }
      }
    }

    return null;
  }, [startTimeIso, endTimeIso]);

  return {
    activePreset,
    startTimeLocal,
    endTimeLocal,
    bucketInterval,
    startTimeIso,
    endTimeIso,
    rangeError,
    maxWindowHours: MAX_READINGS_WINDOW_HOURS,
    onPresetChange,
    onLiveMode,
    onUseNowAsEndTime,
    onClear,
    onStartTimeChange,
    onEndTimeChange,
    onBucketIntervalChange,
  };
}
