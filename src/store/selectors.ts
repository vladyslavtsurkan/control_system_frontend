import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/index";

// ─── Auth selectors ──────────────────────────────────────────────────────────
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectActiveOrgId = (state: RootState) => state.auth.activeOrgId;

// ─── WebSocket selectors ─────────────────────────────────────────────────────
export const selectWsStatus = (state: RootState) => state.ws.connectionStatus;
export const selectLiveKpis = (state: RootState) => state.ws.liveKpis;
export const selectLiveReadingsBySensor = (state: RootState) => state.ws.liveReadingsBySensor;
export const selectLiveAlerts = (state: RootState) => state.ws.liveAlerts;
export const selectResolvedLiveAlerts = (state: RootState) => state.ws.resolvedAlerts;
export const selectWsError = (state: RootState) => state.ws.lastError;

export const selectActiveAlertCount = createSelector(
  selectLiveAlerts,
  (alerts) => alerts.filter((alert) => alert.status === "active").length,
);

export const selectResolvedAlertCount = createSelector(
  selectResolvedLiveAlerts,
  (alerts) => alerts.length,
);

export const selectLiveKpiForSensor = (sensorId: string) =>
  createSelector(selectLiveKpis, (kpis) => kpis[sensorId] ?? null);

export const selectLiveReadingsForSensor = (sensorId: string) =>
  createSelector(selectLiveReadingsBySensor, (readings) => readings[sensorId] ?? []);

