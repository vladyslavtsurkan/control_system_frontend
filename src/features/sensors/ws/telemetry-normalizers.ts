import type { GetReadingsParams } from "@/features/sensors/types";

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

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toTelemetryValue(value: unknown): number | null {
  const asNumber = toFiniteNumber(value);
  if (asNumber !== null) return asNumber;

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  const record = toRecord(value);
  if (Object.keys(record).length > 0) {
    const nested = toFiniteNumber(record.value);
    if (nested !== null) return nested;
    if (typeof record.value === "boolean") {
      return record.value ? 1 : 0;
    }
  }

  return null;
}

export function normalizeTelemetry(event: unknown): {
  sensorId: string;
  value: number;
  time: string;
} | null {
  const root = toRecord(event);
  const data = toRecord(root.data);
  const nestedPayload = toRecord(data.payload ?? root.payload);

  const sensorId =
    toNonEmptyString(root.sensor_id) ??
    toNonEmptyString(root.sensorId) ??
    toNonEmptyString(data.sensor_id) ??
    toNonEmptyString(data.sensorId) ??
    toNonEmptyString(nestedPayload.sensor_id) ??
    toNonEmptyString(nestedPayload.sensorId);

  const time =
    toNonEmptyString(data.time) ??
    toNonEmptyString(data.timestamp) ??
    toNonEmptyString(nestedPayload.time) ??
    toNonEmptyString(nestedPayload.timestamp) ??
    toNonEmptyString(root.time) ??
    toNonEmptyString(root.timestamp) ??
    toNonEmptyString(root.created_at);

  const value =
    toTelemetryValue(data.value) ??
    toTelemetryValue(nestedPayload.value) ??
    toTelemetryValue(root.value);

  if (!sensorId || !time || value === null) {
    return null;
  }

  return { sensorId, value, time };
}

export function parseIsoMs(value?: string): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function resolveWindowBounds(
  arg: GetReadingsParams,
  nowMs: number,
): { startMs: number | null; endMs: number | null } {
  const startMs = parseIsoMs(arg.startTime);
  const endMs = parseIsoMs(arg.endTime) ?? nowMs;
  return { startMs, endMs };
}

