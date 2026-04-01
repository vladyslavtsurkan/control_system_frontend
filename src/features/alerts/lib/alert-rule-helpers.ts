import type {
  AlertRule,
  AlertCondition,
  Threshold,
} from "@/features/alerts/types";
import type { SensorDataType } from "@/features/sensors";

export const CONDITIONS: {
  value: AlertCondition;
  label: string;
  thresholdType: Threshold["type"];
}[] = [
  {
    value: "greater_than",
    label: "> greater than",
    thresholdType: "single_value",
  },
  { value: "less_than", label: "< less than", thresholdType: "single_value" },
  { value: "equals", label: "= equals", thresholdType: "single_value" },
  { value: "not_equals", label: "≠ not equals", thresholdType: "single_value" },
  { value: "outside_range", label: "↔ outside range", thresholdType: "range" },
  { value: "inside_range", label: "↔ inside range", thresholdType: "range" },
  { value: "no_data", label: "⌀ no data", thresholdType: "no_data" },
];

const NUMERIC_CONDITIONS: AlertCondition[] = [
  "greater_than",
  "less_than",
  "equals",
  "not_equals",
  "outside_range",
  "inside_range",
  "no_data",
];

const NON_NUMERIC_CONDITIONS: AlertCondition[] = [
  "equals",
  "not_equals",
  "no_data",
];

export const CONDITIONS_BY_SENSOR_TYPE: Record<
  SensorDataType,
  AlertCondition[]
> = {
  numeric: NUMERIC_CONDITIONS,
  boolean: NON_NUMERIC_CONDITIONS,
  string: NON_NUMERIC_CONDITIONS,
};

export interface FormState {
  sensor_id: string;
  name: string;
  severity: "info" | "warning" | "critical" | "fatal";
  condition: AlertCondition;
  duration_seconds: string;
  sv_value: string;
  range_min: string;
  range_max: string;
  nodata_timeout: string;
  is_active: boolean;
  actions: {
    target_sensor_id: string;
    trigger_value?: string;
    resolve_value?: string;
  }[];
}

export function parseStrictNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseNonNegativeInteger(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function buildThresholdForSubmit(
  form: FormState,
  sensorType: SensorDataType,
): { threshold: Threshold | null; error: string | null } {
  if (form.condition === "greater_than" || form.condition === "less_than") {
    const numericValue = parseStrictNumber(form.sv_value);
    if (sensorType !== "numeric") {
      return {
        threshold: null,
        error: "This condition is only available for numeric sensors.",
      };
    }
    if (numericValue === null) {
      return {
        threshold: null,
        error: "Threshold value must be a valid number.",
      };
    }
    return {
      threshold: { type: "single_value", value: numericValue },
      error: null,
    };
  }

  if (form.condition === "equals" || form.condition === "not_equals") {
    if (sensorType === "numeric") {
      const numericValue = parseStrictNumber(form.sv_value);
      if (numericValue === null) {
        return {
          threshold: null,
          error: "Threshold value must be a valid number.",
        };
      }
      return {
        threshold: { type: "single_value", value: numericValue },
        error: null,
      };
    }

    if (sensorType === "boolean") {
      if (form.sv_value !== "true" && form.sv_value !== "false") {
        return {
          threshold: null,
          error: "Boolean threshold must be true or false.",
        };
      }
      return {
        threshold: { type: "single_value", value: form.sv_value === "true" },
        error: null,
      };
    }

    const textValue = form.sv_value.trim();
    if (!textValue) {
      return { threshold: null, error: "Threshold value is required." };
    }
    return {
      threshold: { type: "single_value", value: textValue },
      error: null,
    };
  }

  if (form.condition === "outside_range" || form.condition === "inside_range") {
    if (sensorType !== "numeric") {
      return {
        threshold: null,
        error: "Range conditions are only available for numeric sensors.",
      };
    }
    const min = parseStrictNumber(form.range_min);
    const max = parseStrictNumber(form.range_max);
    if (min === null || max === null) {
      return {
        threshold: null,
        error: "Range min and max must be valid numbers.",
      };
    }
    if (min >= max) {
      return { threshold: null, error: "Range min must be less than max." };
    }
    return { threshold: { type: "range", min, max }, error: null };
  }

  const timeoutSeconds = parseInt(form.nodata_timeout, 10);
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds <= 0) {
    return {
      threshold: null,
      error: "No-data timeout must be a positive whole number.",
    };
  }
  return {
    threshold: { type: "no_data", timeout_seconds: timeoutSeconds },
    error: null,
  };
}

export function ruleToForm(rule: AlertRule): FormState {
  const t = rule.threshold;
  return {
    sensor_id: rule.sensor_id,
    name: rule.name,
    severity: rule.severity,
    condition: rule.condition,
    duration_seconds: String(rule.duration_seconds ?? 0),
    sv_value: t.type === "single_value" ? String(t.value) : "",
    range_min: t.type === "range" ? String(t.min) : "",
    range_max: t.type === "range" ? String(t.max) : "",
    nodata_timeout:
      t.type === "no_data" ? String(t.timeout_seconds ?? 300) : "300",
    is_active: rule.is_active,
    actions: (rule.actions ?? []).map((action) => ({
      target_sensor_id: action.target_sensor_id,
      trigger_value:
        action.trigger_payload?.value != null
          ? String(action.trigger_payload.value)
          : "",
      resolve_value:
        action.resolve_payload?.value != null
          ? String(action.resolve_payload.value)
          : "",
    })),
  };
}

export function thresholdLabel(threshold: Threshold): string {
  if (threshold.type === "single_value") return String(threshold.value);
  if (threshold.type === "range") return `[${threshold.min}, ${threshold.max}]`;
  return `no data (${threshold.timeout_seconds ?? 300}s)`;
}

export function durationSecondsLabel(
  durationSeconds: number | null | undefined,
): string {
  const normalizedDuration =
    typeof durationSeconds === "number" &&
    Number.isInteger(durationSeconds) &&
    durationSeconds > 0
      ? durationSeconds
      : 0;
  return normalizedDuration === 0
    ? "Instant"
    : `${normalizedDuration} sec delay`;
}
