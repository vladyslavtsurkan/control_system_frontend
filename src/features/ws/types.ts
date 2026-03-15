import type { AlertLifecycleAction, AlertSeverity } from "@/features/alerts/types";

export interface WsTelemetryEvent {
  type: "telemetry";
  sensor_id: string;
  data: {
    value: number;
    time: string;
  };
}

export interface WsAlertEvent {
  type: "alert";
  sensor_id?: string;
  sensor_name?: string;
  severity?: AlertSeverity;
  message?: string;
  triggered_at?: string;
  rule_id?: string;
  data?: {
    action?: AlertLifecycleAction;
    rule_id?: string;
    message?: string;
    triggered_value?: Record<string, unknown>;
  };
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WsTicketResponse {
  ticket: string;
}

export type WsEvent = WsTelemetryEvent | WsAlertEvent;

