"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCreateAlertRuleMutation, useUpdateAlertRuleMutation } from "@/store/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  AlertRule,
  AlertCondition,
  AlertSeverity,
  Threshold,
  CreateAlertRuleRequest,
} from "@/features/alerts/types";
import type { Sensor } from "@/features/sensors";
import type { SensorDataType } from "@/features/sensors";

// ─── Static config ────────────────────────────────────────────────────────────

const CONDITIONS: { value: AlertCondition; label: string; thresholdType: Threshold["type"] }[] = [
  { value: "greater_than",  label: "> greater than",   thresholdType: "single_value" },
  { value: "less_than",     label: "< less than",      thresholdType: "single_value" },
  { value: "equals",        label: "= equals",         thresholdType: "single_value" },
  { value: "not_equals",    label: "≠ not equals",     thresholdType: "single_value" },
  { value: "outside_range", label: "↔ outside range",  thresholdType: "range" },
  { value: "inside_range",  label: "↔ inside range",   thresholdType: "range" },
  { value: "no_data",       label: "⌀ no data",        thresholdType: "no_data" },
];

const SEVERITIES: AlertSeverity[] = ["info", "warning", "critical", "fatal"];

const NUMERIC_CONDITIONS: AlertCondition[] = [
  "greater_than",
  "less_than",
  "equals",
  "not_equals",
  "outside_range",
  "inside_range",
  "no_data",
];

const NON_NUMERIC_CONDITIONS: AlertCondition[] = ["equals", "not_equals", "no_data"];

const CONDITIONS_BY_SENSOR_TYPE: Record<SensorDataType, AlertCondition[]> = {
  numeric: NUMERIC_CONDITIONS,
  boolean: NON_NUMERIC_CONDITIONS,
  string: NON_NUMERIC_CONDITIONS,
};

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  sensor_id: string;
  name: string;
  severity: AlertSeverity;
  condition: AlertCondition;
  sv_value: string;
  range_min: string;
  range_max: string;
  nodata_timeout: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  sensor_id: "", name: "", severity: "warning", condition: "greater_than",
  sv_value: "", range_min: "", range_max: "", nodata_timeout: "300", is_active: true,
};

function parseStrictNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildThresholdForSubmit(form: FormState, sensorType: SensorDataType): { threshold: Threshold | null; error: string | null } {
  if (form.condition === "greater_than" || form.condition === "less_than") {
    const numericValue = parseStrictNumber(form.sv_value);
    if (sensorType !== "numeric") {
      return { threshold: null, error: "This condition is only available for numeric sensors." };
    }
    if (numericValue === null) {
      return { threshold: null, error: "Threshold value must be a valid number." };
    }
    return { threshold: { type: "single_value", value: numericValue }, error: null };
  }

  if (form.condition === "equals" || form.condition === "not_equals") {
    if (sensorType === "numeric") {
      const numericValue = parseStrictNumber(form.sv_value);
      if (numericValue === null) {
        return { threshold: null, error: "Threshold value must be a valid number." };
      }
      return { threshold: { type: "single_value", value: numericValue }, error: null };
    }

    if (sensorType === "boolean") {
      if (form.sv_value !== "true" && form.sv_value !== "false") {
        return { threshold: null, error: "Boolean threshold must be true or false." };
      }
      return { threshold: { type: "single_value", value: form.sv_value === "true" }, error: null };
    }

    const textValue = form.sv_value.trim();
    if (!textValue) {
      return { threshold: null, error: "Threshold value is required." };
    }
    return { threshold: { type: "single_value", value: textValue }, error: null };
  }

  if (form.condition === "outside_range" || form.condition === "inside_range") {
    if (sensorType !== "numeric") {
      return { threshold: null, error: "Range conditions are only available for numeric sensors." };
    }
    const min = parseStrictNumber(form.range_min);
    const max = parseStrictNumber(form.range_max);
    if (min === null || max === null) {
      return { threshold: null, error: "Range min and max must be valid numbers." };
    }
    if (min >= max) {
      return { threshold: null, error: "Range min must be less than max." };
    }
    return { threshold: { type: "range", min, max }, error: null };
  }

  const timeoutSeconds = parseInt(form.nodata_timeout, 10);
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds <= 0) {
    return { threshold: null, error: "No-data timeout must be a positive whole number." };
  }
  return { threshold: { type: "no_data", timeout_seconds: timeoutSeconds }, error: null };
}

function ruleToForm(rule: AlertRule): FormState {
  const t = rule.threshold;
  return {
    sensor_id: rule.sensor_id, name: rule.name, severity: rule.severity,
    condition: rule.condition,
    sv_value: t.type === "single_value" ? String(t.value) : "",
    range_min: t.type === "range" ? String(t.min) : "",
    range_max: t.type === "range" ? String(t.max) : "",
    nodata_timeout: t.type === "no_data" ? String(t.timeout_seconds ?? 300) : "300",
    is_active: rule.is_active,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AlertRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: AlertRule | null;
  sensors: Sensor[];
}

export function AlertRuleFormDialog({ open, onOpenChange, editTarget, sensors }: AlertRuleFormDialogProps) {
  const [createRule, { isLoading: creating }] = useCreateAlertRuleMutation();
  const [updateRule, { isLoading: updating }] = useUpdateAlertRuleMutation();
  const [form, setForm] = useState<FormState>(() =>
    editTarget ? ruleToForm(editTarget) : emptyForm,
  );

  const selectedSensor = useMemo(
    () => sensors.find((sensor) => sensor.id === form.sensor_id),
    [form.sensor_id, sensors],
  );
  const selectedSensorType: SensorDataType = selectedSensor?.data_type ?? "numeric";
  const allowedConditionValues = CONDITIONS_BY_SENSOR_TYPE[selectedSensorType];
  const activeCondition = allowedConditionValues.includes(form.condition)
    ? form.condition
    : (allowedConditionValues[0] ?? "equals");
  const allowedConditions = useMemo(
    () => CONDITIONS.filter((condition) => allowedConditionValues.includes(condition.value)),
    [allowedConditionValues],
  );
  const currentThresholdType = CONDITIONS.find((c) => c.value === activeCondition)?.thresholdType ?? "single_value";
  const booleanThresholdValue = form.sv_value === "false" ? "false" : "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget && !form.sensor_id) {
      toast.error("Please select a sensor.");
      return;
    }

    const nextForm = activeCondition === form.condition
      ? form
      : { ...form, condition: activeCondition };

    const { threshold, error } = buildThresholdForSubmit(nextForm, selectedSensorType);
    if (!threshold) {
      toast.error(error ?? "Threshold is invalid.");
      return;
    }

    try {
      if (editTarget) {
        await updateRule({ id: editTarget.id, name: nextForm.name, severity: nextForm.severity, condition: nextForm.condition, threshold, is_active: nextForm.is_active }).unwrap();
        toast.success("Alert rule updated.");
      } else {
        const payload: CreateAlertRuleRequest = { sensor_id: nextForm.sensor_id, name: nextForm.name, severity: nextForm.severity, condition: nextForm.condition, threshold };
        await createRule(payload).unwrap();
        toast.success("Alert rule created.");
      }
      onOpenChange(false);
    } catch {
      toast.error("Operation failed. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editTarget ? "Edit Alert Rule" : "Create Alert Rule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule Name</Label>
            <Input id="rule-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="High Temperature Alert" />
          </div>

          {!editTarget && (
            <div className="space-y-2">
              <Label>Sensor</Label>
              <Select value={form.sensor_id} onValueChange={(v) => setForm((f) => ({ ...f, sensor_id: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Select sensor…" /></SelectTrigger>
                <SelectContent>
                  {sensors.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}{s.units ? ` (${s.units})` : ""}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v as AlertSeverity }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEVERITIES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={activeCondition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v as AlertCondition }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{allowedConditions.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>

          {currentThresholdType === "single_value" && (
            <div className="space-y-2">
              <Label htmlFor="sv-value">Threshold Value</Label>
              {selectedSensorType === "boolean" ? (
                <Select value={booleanThresholdValue} onValueChange={(v) => setForm((f) => ({ ...f, sv_value: v ?? "true" }))}>
                  <SelectTrigger id="sv-value">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="sv-value"
                  type={selectedSensorType === "numeric" ? "number" : "text"}
                  step={selectedSensorType === "numeric" ? "any" : undefined}
                  required
                  value={form.sv_value}
                  onChange={(e) => setForm((f) => ({ ...f, sv_value: e.target.value }))}
                  placeholder={selectedSensorType === "numeric" ? "e.g. 100" : "Enter value"}
                />
              )}
            </div>
          )}

          {currentThresholdType === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="range-min">Min</Label>
                <Input id="range-min" type="number" step="any" required value={form.range_min} onChange={(e) => setForm((f) => ({ ...f, range_min: e.target.value }))} placeholder="e.g. 20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="range-max">Max</Label>
                <Input id="range-max" type="number" step="any" required value={form.range_max} onChange={(e) => setForm((f) => ({ ...f, range_max: e.target.value }))} placeholder="e.g. 80" />
              </div>
            </div>
          )}

          {currentThresholdType === "no_data" && (
            <div className="space-y-2">
              <Label htmlFor="nodata-timeout">No-Data Timeout (seconds)</Label>
              <Input id="nodata-timeout" type="number" min="1" required value={form.nodata_timeout} onChange={(e) => setForm((f) => ({ ...f, nodata_timeout: e.target.value }))} placeholder="300" />
            </div>
          )}

          {editTarget && (
            <div className="flex items-center gap-3">
              <input id="is-active" type="checkbox" className="size-4 accent-primary" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <Label htmlFor="is-active">Rule is active</Label>
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={creating || updating}>{editTarget ? "Save Changes" : "Create Rule"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function thresholdLabel(threshold: Threshold): string {
  if (threshold.type === "single_value") return String(threshold.value);
  if (threshold.type === "range") return `[${threshold.min}, ${threshold.max}]`;
  return `no data (${threshold.timeout_seconds ?? 300}s)`;
}

export { CONDITIONS, type FormState };
