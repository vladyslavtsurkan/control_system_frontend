"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeTelemetry } from "@/features/sensors";
import type { LiveKpi, SensorReading } from "@/features/sensors";
import { DASHBOARD_LIVE_WINDOW_MS } from "@/config/constants";
import { upsertLiveReading } from "@/features/dashboard/lib/kpi-data";

interface DashboardTelemetryState {
  latestBySensor: Record<string, LiveKpi>;
  readingsBySensor: Record<string, SensorReading[]>;
}

export function useDashboardTelemetry(): DashboardTelemetryState {
  const latestRef = useRef(new Map<string, LiveKpi>());
  const readingsRef = useRef(new Map<string, SensorReading[]>());
  const rafIdRef = useRef<number | null>(null);

  const [latestBySensor, setLatestBySensor] = useState<Record<string, LiveKpi>>(
    {},
  );
  const [readingsBySensor, setReadingsBySensor] = useState<
    Record<string, SensorReading[]>
  >({});

  useEffect(() => {
    const flushFrame = () => {
      rafIdRef.current = null;
      setLatestBySensor(Object.fromEntries(latestRef.current.entries()));
      setReadingsBySensor(Object.fromEntries(readingsRef.current.entries()));
    };

    const scheduleFlush = () => {
      if (rafIdRef.current !== null) {
        return;
      }
      rafIdRef.current = requestAnimationFrame(flushFrame);
    };

    const unsubscribe = subscribeTelemetry(({ sensorId, value, time }) => {
      latestRef.current.set(sensorId, {
        sensor_id: sensorId,
        value,
        time,
      });

      const currentReadings = readingsRef.current.get(sensorId) ?? [];
      const nextReadings = upsertLiveReading(
        currentReadings,
        { sensor_id: sensorId, value, time },
        DASHBOARD_LIVE_WINDOW_MS,
      );

      if (nextReadings !== currentReadings) {
        readingsRef.current.set(sensorId, nextReadings);
      }

      scheduleFlush();
    });

    return () => {
      unsubscribe();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return { latestBySensor, readingsBySensor };
}
