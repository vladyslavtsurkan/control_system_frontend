import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/index";

// ─── Auth selectors ──────────────────────────────────────────────────────────
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectActiveOrgId = (state: RootState) => state.auth.activeOrgId;

// ─── WebSocket selectors ─────────────────────────────────────────────────────
export const selectWsStatus = (state: RootState) => state.ws.connectionStatus;
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


