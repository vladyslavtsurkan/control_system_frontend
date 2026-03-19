import type { PaginationQueryParams } from "@/shared/types/pagination";

export type AlertSeverity = "info" | "warning" | "critical" | "fatal";

export type AlertLifecycleAction = "open" | "update" | "resolve";

export type AlertLifecycleStatus = "active" | "resolved";

export type AlertCondition =
  | "greater_than"
  | "less_than"
  | "equals"
  | "not_equals"
  | "outside_range"
  | "inside_range"
  | "no_data";

export interface AlertRuleSummary {
  id: string;
  created_at: string;
  sensor_id: string;
  name: string;
  severity: AlertSeverity;
  condition: AlertCondition;
  duration_seconds: number;
  is_active: boolean;
}

export interface Alert {
  id: string;
  created_at: string;
  updated_at?: string;
  sensor_id: string;
  rule_id?: string | null;
  rule?: AlertRuleSummary | null;
  message: string;
  triggered_value: Record<string, unknown>;
  is_acknowledged: boolean;
  resolved_at: string | null;
}

export interface GetAlertsParams {
  sensor_id?: string;
  offset?: number;
  limit?: number;
}

export interface GetAlertRulesParams extends PaginationQueryParams {
  sensorId?: string;
}

export type AlertThresholdScalar = number | string | boolean;

export interface SingleValueThreshold {
  type: "single_value";
  value: AlertThresholdScalar;
}

export interface RangeThreshold {
  type: "range";
  min: number;
  max: number;
}

export interface NoDataThreshold {
  type: "no_data";
  timeout_seconds?: number;
}

export type Threshold = SingleValueThreshold | RangeThreshold | NoDataThreshold;

export interface AlertRule {
  id: string;
  created_at: string;
  sensor_id: string;
  name: string;
  severity: AlertSeverity;
  condition: AlertCondition;
  threshold: Threshold;
  duration_seconds: number;
  is_active: boolean;
}

export interface CreateAlertRuleRequest {
  sensor_id: string;
  name: string;
  severity?: AlertSeverity;
  condition: AlertCondition;
  threshold: Threshold;
  duration_seconds?: number;
}

export interface UpdateAlertRuleRequest {
  id: string;
  name?: string | null;
  severity?: AlertSeverity | null;
  condition?: AlertCondition | null;
  threshold?: Threshold | null;
  duration_seconds?: number | null;
  is_active?: boolean | null;
}

export interface LiveAlert {
  id: string;
  key: string;
  rule_id: string;
  sensor_id: string;
  sensor_name: string;
  severity: AlertSeverity;
  message: string;
  triggered_at: string;
  updated_at: string;
  resolved_at: string | null;
  action: AlertLifecycleAction;
  status: AlertLifecycleStatus;
  triggered_value: Record<string, unknown>;
}

