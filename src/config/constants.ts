// Backend URLs — update these for your environment
export const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8000";

// WebSocket base URL (ws:// or wss://)
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";

// Reconnect settings (exponential back-off)
export const WS_RECONNECT_BASE_DELAY_MS = 1_000;
export const WS_RECONNECT_MAX_DELAY_MS = 30_000;
export const WS_RECONNECT_MULTIPLIER = 2;

// Auth cookie names (set by BFF Route Handlers — httpOnly, never readable by JS)
export const AUTH_COOKIE_NAME = "iiot_token";
export const REFRESH_COOKIE_NAME = "iiot_refresh_token";
// Tenant cookie — stores the active org ID so server-side BFF routes can forward X-Tenant-ID
export const TENANT_COOKIE_NAME = "iiot_tenant_id";

// Max live alerts kept in Redux state
export const MAX_LIVE_ALERTS = 100;

// Max data points kept in RTK Query readings cache per sensor
export const MAX_CHART_POINTS = 2_000;

// Max automated actions per alert rule
export const MAX_ALERT_RULE_ACTIONS = 20;

// Max API keys allowed per OPC server
export const MAX_API_KEYS_PER_OPC_SERVER = 2;

// Dashboard sparkline keeps live websocket points within this time window.
export const DASHBOARD_LIVE_WINDOW_MS = 15 * 60 * 1000;

// Dashboard list page sizes (UI defaults) and safe fallback when response metadata is missing.
export const LIST_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export const LIST_PAGE_SIZE_FALLBACK = 10;
