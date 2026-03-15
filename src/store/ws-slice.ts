import { createAction, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { LiveAlert } from "@/features/alerts/types";
import type { LiveKpi, SensorReading } from "@/features/sensors/types";
import { DASHBOARD_LIVE_KPI_WINDOW_MS, MAX_LIVE_ALERTS } from "@/config/constants";

// ─── Public actions consumed by the WS middleware ────────────────────────────
export const wsConnect = createAction("ws/connect");
export const wsDisconnect = createAction("ws/disconnect");

// ─── Connection status ────────────────────────────────────────────────────────
export type WsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// ─── Typed WS error codes ────────────────────────────────────────────────────
export type WsErrorCode = "TICKET_FETCH_FAILED" | "AUTH_EXPIRED" | "NETWORK_ERROR";

export interface WsError {
  code: WsErrorCode;
  message: string;
}

interface WsState {
  connectionStatus: WsConnectionStatus;
  liveKpis: Record<string, LiveKpi>; // keyed by sensor_id
  liveReadingsBySensor: Record<string, SensorReading[]>;
  liveAlerts: LiveAlert[]; // lifecycle list (active + resolved)
  resolvedAlerts: LiveAlert[];
  alertsByKey: Record<string, LiveAlert>;
  lastError: WsError | null;
}

const initialState: WsState = {
  connectionStatus: "idle",
  liveKpis: {},
  liveReadingsBySensor: {},
  liveAlerts: [],
  resolvedAlerts: [],
  alertsByKey: {},
  lastError: null,
};

function sortByUpdatedDesc(alerts: LiveAlert[]): LiveAlert[] {
  return [...alerts].sort(
    (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
  );
}

function upsertActiveAlert(state: WsState, alert: LiveAlert) {
  state.alertsByKey[alert.key] = alert;
  state.liveAlerts = sortByUpdatedDesc(
    [alert, ...state.liveAlerts.filter((item) => item.key !== alert.key)],
  ).slice(0, MAX_LIVE_ALERTS);
}

function pushResolvedAlert(state: WsState, alert: LiveAlert) {
  state.resolvedAlerts = sortByUpdatedDesc(
    [alert, ...state.resolvedAlerts.filter((item) => item.key !== alert.key)],
  ).slice(0, MAX_LIVE_ALERTS);
}

const wsSlice = createSlice({
  name: "ws",
  initialState,
  reducers: {
    setConnectionStatus(state, action: PayloadAction<WsConnectionStatus>) {
      state.connectionStatus = action.payload;
      // Clear error when successfully connected
      if (action.payload === "connected") {
        state.lastError = null;
      }
    },
    updateLiveKpi(state, action: PayloadAction<LiveKpi>) {
      const next = action.payload;
      state.liveKpis[next.sensor_id] = next;

      const readings = state.liveReadingsBySensor[next.sensor_id] ?? [];
      const nextTimeMs = Date.parse(next.time);
      if (!Number.isFinite(nextTimeMs)) {
        state.liveReadingsBySensor[next.sensor_id] = readings;
        return;
      }

      const point: SensorReading = {
        sensor_id: next.sensor_id,
        time: next.time,
        value: next.value,
      };

      const existingIndex = readings.findIndex((item) => item.time === next.time);
      if (existingIndex >= 0) {
        readings[existingIndex] = point;
      } else {
        readings.push(point);
      }

      readings.sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
      const latestTimeMs = Date.parse(readings[readings.length - 1]?.time ?? next.time);
      const windowStartMs = latestTimeMs - DASHBOARD_LIVE_KPI_WINDOW_MS;

      state.liveReadingsBySensor[next.sensor_id] = readings.filter((item) => {
        const timeMs = Date.parse(item.time);
        return Number.isFinite(timeMs) && timeMs >= windowStartMs;
      });
    },
    addLiveAlert(state, action: PayloadAction<LiveAlert>) {
      const incoming = action.payload;
      const existing = state.alertsByKey[incoming.key] ?? null;

      if (incoming.action === "open") {
        upsertActiveAlert(state, {
          ...incoming,
          status: "active",
          resolved_at: null,
        });
        return;
      }

      if (incoming.action === "update") {
        // Ignore updates for non-active entities to avoid synthetic lifecycle.
        if (!existing || existing.status !== "active") {
          return;
        }

        upsertActiveAlert(state, {
          ...existing,
          ...incoming,
          status: "active",
          resolved_at: null,
        });
        return;
      }

      if (incoming.action === "resolve") {
        // Resolve is valid only for an existing active alert.
        if (!existing || existing.status !== "active") {
          return;
        }

        const resolved: LiveAlert = {
          ...existing,
          ...incoming,
          status: "resolved",
          resolved_at: incoming.resolved_at ?? incoming.updated_at,
        };

        state.alertsByKey[incoming.key] = resolved;
        upsertActiveAlert(state, resolved);
        pushResolvedAlert(state, resolved);
      }
    },
    clearLiveAlerts(state) {
      state.liveAlerts = [];
      state.resolvedAlerts = [];
      state.alertsByKey = {};
    },
    resetRealtimeState(state) {
      state.liveKpis = {};
      state.liveReadingsBySensor = {};
      state.liveAlerts = [];
      state.resolvedAlerts = [];
      state.alertsByKey = {};
      state.lastError = null;
    },
    setWsError(state, action: PayloadAction<WsError>) {
      state.lastError = action.payload;
    },
  },
});

export const {
  setConnectionStatus,
  updateLiveKpi,
  addLiveAlert,
  clearLiveAlerts,
  resetRealtimeState,
  setWsError,
} =
  wsSlice.actions;

export default wsSlice.reducer;
