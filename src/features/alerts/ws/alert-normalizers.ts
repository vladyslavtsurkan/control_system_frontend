import type {
  AlertLifecycleAction,
  AlertSeverity,
  LiveAlert,
} from "@/features/alerts/types";
import type { Sensor } from "@/features/sensors";
import type { PaginatedResponse } from "@/shared/types/pagination";

export function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeSeverity(value: unknown): AlertSeverity {
  const normalized = toNonEmptyString(value)?.toLowerCase();
  if (
    normalized === "info" ||
    normalized === "warning" ||
    normalized === "critical" ||
    normalized === "fatal"
  ) {
    return normalized;
  }
  return "warning";
}

export function normalizeAlertAction(value: unknown): AlertLifecycleAction {
  const normalized = toNonEmptyString(value)?.toLowerCase();
  if (normalized === "open" || normalized === "update" || normalized === "resolve") {
    return normalized;
  }
  return "open";
}

export function buildAlertKey(sensorId: string, ruleId: string): string {
  return `${sensorId}:${ruleId}`;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${JSON.stringify(key)}:${stableSerialize(val)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

export function buildAlertFingerprint(alert: LiveAlert): string {
  return [
    alert.key,
    alert.action,
    alert.message,
    alert.triggered_at,
    stableSerialize(alert.triggered_value),
  ].join("|");
}

export function findCachedSensorName(
  apiQueries: Record<string, { endpointName?: string; data?: unknown } | undefined>,
  sensorId: string,
): string | null {
  if (!sensorId || sensorId === "unknown-sensor") return null;

  for (const entry of Object.values(apiQueries)) {
    if (!entry?.endpointName) {
      continue;
    }

    if (entry.endpointName === "getSensors") {
      const data = entry.data as PaginatedResponse<Sensor> | undefined;
      const sensorName = data?.items?.find((sensor) => sensor.id === sensorId)?.name;
      if (sensorName) {
        return sensorName;
      }
      continue;
    }

    if (entry.endpointName === "getSensor") {
      const sensor = entry.data as Sensor | undefined;
      if (sensor?.id === sensorId && sensor.name) {
        return sensor.name;
      }
    }
  }

  return null;
}

