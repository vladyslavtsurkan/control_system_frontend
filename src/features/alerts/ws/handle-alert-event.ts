import { addLiveAlert } from "@/store/ws-slice";
import type { LiveAlert } from "@/features/alerts/types";
import type { WsAlertHandler } from "@/store/ws/base/ws-types";
import {
  buildAlertFingerprint,
  buildAlertKey,
  findCachedSensorName,
  normalizeAlertAction,
  normalizeSeverity,
  toNonEmptyString,
  toRecord,
} from "@/features/alerts/ws/alert-normalizers";

const ALERT_FINGERPRINT_TTL_MS = 5 * 60 * 1000;

export function createAlertEventHandler(): WsAlertHandler {
  const recentAlertFingerprints = new Map<string, number>();

  return (event, { storeApi, apiStore }) => {
    const root = toRecord(event);
    const nested = toRecord(root.data ?? root.payload);
    const rootRule = toRecord(root.rule);
    const nestedRule = toRecord(nested.rule);

    const normalizedRuleId =
      toNonEmptyString(root.rule_id) ??
      toNonEmptyString(root.ruleId) ??
      toNonEmptyString(nested.rule_id) ??
      toNonEmptyString(nested.ruleId) ??
      toNonEmptyString(rootRule.id) ??
      toNonEmptyString(nestedRule.id) ??
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

    const cachedSensorName = findCachedSensorName(
      queryCacheEntries,
      normalizedSensorId,
    );
    const normalizedSensorName =
      providedSensorName ??
      cachedSensorName ??
      (normalizedSensorId !== "unknown-sensor"
        ? normalizedSensorId
        : "Unknown sensor");

    const normalizedMessage =
      toNonEmptyString(root.message) ??
      toNonEmptyString(root.alert_message) ??
      toNonEmptyString(nested.message) ??
      toNonEmptyString(nested.alert_message) ??
      "Alert triggered";

    const normalizedAction = normalizeAlertAction(nested.action ?? root.action);

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

    const normalizedTriggeredValue = toRecord(
      nested.triggered_value ?? nested.triggeredValue ?? root.triggered_value,
    );

    const normalizedUpdatedAt =
      toNonEmptyString(root.updated_at) ??
      toNonEmptyString(root.updatedAt) ??
      toNonEmptyString(nested.updated_at) ??
      toNonEmptyString(nested.updatedAt) ??
      normalizedTriggeredAt;

    const alertKey = buildAlertKey(normalizedSensorId, normalizedRuleId);

    const normalizedSeverity = normalizeSeverity(root.severity ?? nested.severity);

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
  };
}

