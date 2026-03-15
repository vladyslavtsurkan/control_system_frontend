import {useMemo} from "react";
import type {SensorAlertRow} from "@/features/sensors/components";
import type { Alert, LiveAlert } from "@/features/alerts/types";

interface UseSensorAlertRowsParams {
  sensorId: string;
  alerts?: Alert[];
  liveAlerts: LiveAlert[];
}

export function useSensorAlertRows({ sensorId, alerts, liveAlerts }: UseSensorAlertRowsParams) {
  const liveAlertsForSensor = useMemo(
    () => liveAlerts.filter((alert) => alert.sensor_id === sensorId),
    [liveAlerts, sensorId],
  );

  const latestLiveByRuleId = useMemo(() => {
    const map = new Map<string, LiveAlert>();

    for (const alert of liveAlertsForSensor) {
      const existing = map.get(alert.rule_id);
      if (!existing || Date.parse(alert.updated_at) > Date.parse(existing.updated_at)) {
        map.set(alert.rule_id, alert);
      }
    }

    return map;
  }, [liveAlertsForSensor]);

  return useMemo<SensorAlertRow[]>(() => {
      const restItems = alerts ?? [];

      const restRows: SensorAlertRow[] = restItems.map((alert) => {
          const normalizedRuleId = alert.rule_id ?? alert.rule?.id ?? null;
          const liveMatch = !alert.resolved_at && normalizedRuleId
              ? latestLiveByRuleId.get(normalizedRuleId)
              : undefined;

          const status: "active" | "resolved" =
              liveMatch?.status ?? (alert.resolved_at ? "resolved" : "active");

          return {
              key: `rest-${alert.id}`,
              source: "rest",
              restAlertId: alert.id,
              ruleId: normalizedRuleId,
              message: liveMatch?.message ?? alert.message,
              severity: liveMatch?.severity ?? alert.rule?.severity,
              status,
              isAcknowledged: alert.is_acknowledged,
              triggeredAt: alert.created_at,
              updatedAt: liveMatch?.updated_at ?? alert.updated_at ?? alert.created_at,
              resolvedAt:
                  liveMatch?.status === "resolved"
                      ? (liveMatch.resolved_at ?? alert.resolved_at)
                      : alert.resolved_at,
          };
      });

      const restActiveRuleIds = new Set(
          restRows
              .filter((row) => row.status === "active" && row.ruleId)
              .map((row) => row.ruleId as string),
      );

      const liveOnlyRows: SensorAlertRow[] = liveAlertsForSensor
          .filter((alert) => alert.status === "active" && !restActiveRuleIds.has(alert.rule_id))
          .map((alert) => ({
              key: `live-${alert.key}`,
              source: "live",
              ruleId: alert.rule_id,
              message: alert.message,
              severity: alert.severity,
              status: alert.status,
              isAcknowledged: null,
              triggeredAt: alert.triggered_at,
              updatedAt: alert.updated_at,
              resolvedAt: alert.resolved_at,
          }));

      return [...restRows, ...liveOnlyRows].sort((a, b) => {
          if (a.status !== b.status) return a.status === "active" ? -1 : 1;
          return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      });
  }, [alerts, latestLiveByRuleId, liveAlertsForSensor]);
}

