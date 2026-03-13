import type { Middleware, MiddlewareAPI } from "@reduxjs/toolkit";
import { isAction } from "@reduxjs/toolkit";
import { api } from "@/store/api-slice";
import {
  wsConnect,
  wsDisconnect,
  setConnectionStatus,
  updateLiveKpi,
  addLiveAlert,
  setWsError,
} from "@/store/ws-slice";
import type {
  WsEvent,
  WsAlertEvent,
  LiveAlert,
  AlertLifecycleAction,
  GetReadingsParams,
  ReadingResponse,
  PaginatedResponse,
  AlertSeverity,
  Sensor,
} from "@/types/models";
import {
  WS_BASE_URL,
  WS_RECONNECT_BASE_DELAY_MS,
  WS_RECONNECT_MAX_DELAY_MS,
  WS_RECONNECT_MULTIPLIER,
  MAX_CHART_POINTS,
} from "@/config/constants";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeDelay(attempt: number): number {
  const delay =
    WS_RECONNECT_BASE_DELAY_MS * Math.pow(WS_RECONNECT_MULTIPLIER, attempt);
  return Math.min(delay, WS_RECONNECT_MAX_DELAY_MS);
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeSeverity(value: unknown): AlertSeverity {
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

async function decodeWsFrame(data: unknown): Promise<string | null> {
  if (typeof data === "string") {
    const text = data.trim();
    return text.length > 0 ? text : null;
  }

  if (data instanceof Blob) {
    if (data.size === 0) return null;
    const text = (await data.text()).trim();
    return text.length > 0 ? text : null;
  }

  if (data instanceof ArrayBuffer) {
    if (data.byteLength === 0) return null;
    const text = new TextDecoder().decode(data).trim();
    return text.length > 0 ? text : null;
  }

  return null;
}

function normalizeTelemetry(event: unknown): {
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

function buildAlertKey(sensorId: string, ruleId: string): string {
  return `${sensorId}:${ruleId}`;
}

function normalizeAlertAction(value: unknown): AlertLifecycleAction {
  const normalized = toNonEmptyString(value)?.toLowerCase();
  if (normalized === "open" || normalized === "update" || normalized === "resolve") {
    return normalized;
  }

  // Backward compatibility: legacy alert events behave like open.
  return "open";
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

function buildAlertFingerprint(alert: LiveAlert): string {
  return [
    alert.key,
    alert.action,
    alert.message,
    alert.triggered_at,
    stableSerialize(alert.triggered_value),
  ].join("|");
}

function findCachedSensorName(
  apiQueries: Record<string, { endpointName?: string; data?: unknown } | undefined>,
  sensorId: string,
): string | null {
  if (!sensorId || sensorId === "unknown-sensor") return null;

  for (const entry of Object.values(apiQueries)) {
    if (entry?.endpointName !== "getSensors") continue;

    const data = entry.data as PaginatedResponse<Sensor> | undefined;
    const sensorName = data?.items?.find((sensor) => sensor.id === sensorId)?.name;
    if (sensorName) {
      return sensorName;
    }
  }

  return null;
}

// ─── WS Middleware Factory ────────────────────────────────────────────────────

export const wsMiddleware: Middleware = (storeApi) => {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;
  let shouldReconnect = true;
  let isConnecting = false;
  let activeConnectionAttemptId = 0;
  const recentAlertFingerprints = new Map<string, number>();
  const recentTelemetryFingerprints = new Map<string, number>();
  const ALERT_FINGERPRINT_TTL_MS = 5 * 60 * 1000;
  const TELEMETRY_FINGERPRINT_TTL_MS = 30 * 1000;

  // ── Step 1 + 2: Fetch ticket → open WebSocket ────────────────────────────
  async function connect() {
    if (!shouldReconnect || isConnecting) {
      return;
    }

    if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
      return;
    }

    isConnecting = true;
    const connectionAttemptId = ++activeConnectionAttemptId;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    storeApi.dispatch(setConnectionStatus("connecting"));

    try {
      const ticketRes = await fetch("/api/ws/ticket", { cache: "no-store" });

      if (!shouldReconnect || connectionAttemptId !== activeConnectionAttemptId) {
        return;
      }

      if (!ticketRes.ok) {
        const errorDetails = await ticketRes.json().catch(() => ({}));

        if (!shouldReconnect || connectionAttemptId !== activeConnectionAttemptId) {
          return;
        }

        const errorCode = ticketRes.status === 401 ? "AUTH_EXPIRED" : "TICKET_FETCH_FAILED";

        storeApi.dispatch(
          setWsError({
            code: errorCode,
            message: `Ticket fetch failed (HTTP ${ticketRes.status})`,
          })
        );

        console.warn("[WS] Ticket fetch failed:", {
          status: ticketRes.status,
          details: errorDetails,
        });

        storeApi.dispatch(setConnectionStatus("error"));
        if (shouldReconnect) scheduleReconnect();
        return;
      }

      const { ticket } = (await ticketRes.json()) as { ticket: string };
      if (!shouldReconnect || connectionAttemptId !== activeConnectionAttemptId) {
        return;
      }

      const nextSocket = new WebSocket(`${WS_BASE_URL}?ticket=${ticket}`);
      socket = nextSocket;

      nextSocket.onopen = () => {
        if (connectionAttemptId !== activeConnectionAttemptId || socket !== nextSocket) {
          nextSocket.close(1000, "Stale connection");
          return;
        }

        reconnectAttempt = 0;
        storeApi.dispatch(setConnectionStatus("connected"));
      };

      nextSocket.onmessage = (event: MessageEvent) => {
        if (connectionAttemptId !== activeConnectionAttemptId || socket !== nextSocket) {
          return;
        }

        void handleMessage(event.data, storeApi);
      };

      nextSocket.onerror = () => {
        if (connectionAttemptId !== activeConnectionAttemptId || socket !== nextSocket) {
          return;
        }

        storeApi.dispatch(setConnectionStatus("error"));
        storeApi.dispatch(
          setWsError({
            code: "NETWORK_ERROR",
            message: "WebSocket connection error",
          })
        );
      };

      nextSocket.onclose = () => {
        if (connectionAttemptId !== activeConnectionAttemptId || socket !== nextSocket) {
          return;
        }

        storeApi.dispatch(setConnectionStatus("disconnected"));
        socket = null;
        if (shouldReconnect) scheduleReconnect();
      };
    } catch (err) {
      if (!shouldReconnect || connectionAttemptId !== activeConnectionAttemptId) {
        return;
      }

      console.error("[WS] Failed to fetch ticket or open socket:", err);
      storeApi.dispatch(setConnectionStatus("error"));
      storeApi.dispatch(
        setWsError({
          code: "TICKET_FETCH_FAILED",
          message: "Failed to establish WebSocket connection",
        })
      );
      if (shouldReconnect) scheduleReconnect();
    } finally {
      if (connectionAttemptId === activeConnectionAttemptId) {
        isConnecting = false;
      }
    }
  }

  function scheduleReconnect() {
    if (!shouldReconnect || isConnecting || reconnectTimer) {
      return;
    }

    const delay = computeDelay(reconnectAttempt);
    reconnectAttempt += 1;
    console.info(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempt})`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (shouldReconnect) {
        void connect();
      }
    }, delay);
  }

  function disconnect() {
    shouldReconnect = false;
    isConnecting = false;
    activeConnectionAttemptId += 1;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (socket) {
      const currentSocket = socket;
      socket = null;
      currentSocket.close(1000, "Client disconnect");
    }

    storeApi.dispatch(setConnectionStatus("idle"));
  }

  // ── Message dispatcher ────────────────────────────────────────────────────
  async function handleMessage(raw: unknown, apiStore: MiddlewareAPI) {
    const frame = await decodeWsFrame(raw);
    if (!frame) {
      return;
    }

    let event: WsEvent;

    try {
      event = JSON.parse(frame) as WsEvent;
    } catch {
      console.warn("[WS] Unparseable message:", raw);
      return;
    }

    if (event.type === "telemetry") {
      handleTelemetry(event, apiStore);
      return;
    }

    if (event.type === "alert") {
      handleAlert(event, apiStore);
    }
  }

  function handleTelemetry(event: WsEvent, apiStore: MiddlewareAPI) {
    const telemetry = normalizeTelemetry(event);
    if (!telemetry) {
      console.warn("[WS] Ignoring malformed telemetry event:", event);
      return;
    }

    const { sensorId, value, time } = telemetry;

    // Drop duplicate telemetry frames that sometimes appear during reconnect bursts.
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
      if (arg?.sensor_id !== sensorId) continue;

      const newReading: ReadingResponse = {
        sensor_id: sensorId,
        payload: { value },
        time,
      };

      const dispatchThunk = apiStore.dispatch as (action: unknown) => unknown;
      dispatchThunk(
        api.util.updateQueryData(
          "getReadings",
          arg,
          (draft: PaginatedResponse<ReadingResponse>) => {
            const existingIndex = draft.items.findIndex(
              (item) => item.time === newReading.time,
            );

            if (existingIndex >= 0) {
              draft.items[existingIndex] = newReading;
            } else {
              const last = draft.items[draft.items.length - 1];
              // Fast path: telemetry is usually ordered, so append and avoid full sort.
              if (!last || Date.parse(last.time) <= Date.parse(newReading.time)) {
                draft.items.push(newReading);
              } else {
                const insertAt = draft.items.findIndex(
                  (item) => Date.parse(item.time) > Date.parse(newReading.time),
                );
                if (insertAt === -1) {
                  draft.items.push(newReading);
                } else {
                  draft.items.splice(insertAt, 0, newReading);
                }
              }
              draft.count += 1;
            }


            if (draft.items.length > MAX_CHART_POINTS) {
              draft.items.splice(0, draft.items.length - MAX_CHART_POINTS);
            }
          }
        )
      );
    }
  }

  function handleAlert(event: WsAlertEvent, apiStore: MiddlewareAPI) {
    const root = toRecord(event);
    const nested = toRecord(root.data ?? root.payload);

    const normalizedRuleId =
      toNonEmptyString(root.rule_id) ??
      toNonEmptyString(root.ruleId) ??
      toNonEmptyString(nested.rule_id) ??
      toNonEmptyString(nested.ruleId) ??
      "unknown-rule";

    const normalizedSensorId =
      toNonEmptyString(root.sensor_id) ??
      toNonEmptyString(root.sensorId) ??
      toNonEmptyString(nested.sensor_id) ??
      toNonEmptyString(nested.sensorId) ??
      "unknown-sensor";

    const providedSensorName =
      toNonEmptyString(root.sensor_name) ??
      toNonEmptyString(root.sensorName) ??
      toNonEmptyString(nested.sensor_name) ??
      toNonEmptyString(nested.sensorName);

    const queryCacheEntries = storeApi.getState().api.queries as Record<
      string,
      { endpointName?: string; data?: unknown } | undefined
    >;

    const cachedSensorName = findCachedSensorName(queryCacheEntries, normalizedSensorId);
    const normalizedSensorName =
      providedSensorName ??
      cachedSensorName ??
      (normalizedSensorId !== "unknown-sensor" ? normalizedSensorId : "Unknown sensor");

    const normalizedMessage =
      toNonEmptyString(root.message) ??
      toNonEmptyString(root.alert_message) ??
      toNonEmptyString(nested.message) ??
      toNonEmptyString(nested.alert_message) ??
      "Alert triggered";

    const normalizedAction = normalizeAlertAction(
      nested.action ?? root.action,
    );

    const normalizedTriggeredAt =
      toNonEmptyString(root.triggered_at) ??
      toNonEmptyString(root.triggeredAt) ??
      toNonEmptyString(root.time) ??
      toNonEmptyString(root.created_at) ??
      toNonEmptyString(nested.triggered_at) ??
      toNonEmptyString(nested.triggeredAt) ??
      toNonEmptyString(nested.time) ??
      toNonEmptyString(nested.created_at) ??
      new Date().toISOString();

    const normalizedTriggeredValue =
      toRecord(nested.triggered_value ?? nested.triggeredValue ?? root.triggered_value);

    const normalizedUpdatedAt =
      toNonEmptyString(root.updated_at) ??
      toNonEmptyString(root.updatedAt) ??
      toNonEmptyString(nested.updated_at) ??
      toNonEmptyString(nested.updatedAt) ??
      normalizedTriggeredAt;

    const alertKey = buildAlertKey(normalizedSensorId, normalizedRuleId);

    const normalizedSeverity = normalizeSeverity(
      root.severity ?? nested.severity,
    );

    const liveAlert: LiveAlert = {
      id: alertKey,
      key: alertKey,
      rule_id: normalizedRuleId,
      sensor_id: normalizedSensorId,
      sensor_name: normalizedSensorName,
      severity: normalizedSeverity,
      message: normalizedMessage,
      triggered_at: normalizedTriggeredAt,
      updated_at: normalizedUpdatedAt,
      resolved_at: normalizedAction === "resolve" ? normalizedUpdatedAt : null,
      action: normalizedAction,
      status: normalizedAction === "resolve" ? "resolved" : "active",
      triggered_value: normalizedTriggeredValue,
    };

    const now = Date.now();
    for (const [fingerprint, seenAt] of recentAlertFingerprints.entries()) {
      if (now - seenAt > ALERT_FINGERPRINT_TTL_MS) {
        recentAlertFingerprints.delete(fingerprint);
      }
    }

    const fingerprint = buildAlertFingerprint(liveAlert);
    if (recentAlertFingerprints.has(fingerprint)) {
      return;
    }
    recentAlertFingerprints.set(fingerprint, now);

    apiStore.dispatch(addLiveAlert(liveAlert));
  }

  // ── Middleware intercept ──────────────────────────────────────────────────
  return (next) => (action) => {
    if (isAction(action)) {
      if (wsConnect.match(action)) {
        shouldReconnect = true;
        reconnectAttempt = 0;
        void connect();
        return;
      }

      if (wsDisconnect.match(action)) {
        disconnect();
        return;
      }
    }

    return next(action);
  };
};
