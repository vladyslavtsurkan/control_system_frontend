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
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
} from "@/features/alerts/types";
import type { Sensor } from "@/features/sensors";
import type { FormState } from "@/features/alerts/lib/alert-rule-helpers";
import {
  CONDITIONS,
  CONDITIONS_BY_SENSOR_TYPE,
  buildThresholdForSubmit,
  durationSecondsLabel,
  parseNonNegativeInteger,
  ruleToForm,
} from "@/features/alerts/lib/alert-rule-helpers";

const SEVERITIES: AlertSeverity[] = ["info", "warning", "critical", "fatal"];

const emptyForm: FormState = {
  sensor_id: "", name: "", severity: "warning", condition: "greater_than",
  duration_seconds: "0",
  sv_value: "", range_min: "", range_max: "", nodata_timeout: "300", is_active: true,
};

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
  const selectedSensorLabel = selectedSensor
    ? `${selectedSensor.name}${selectedSensor.units ? ` (${selectedSensor.units})` : ""}`
    : "";
  const selectedSensorType = selectedSensor?.data_type ?? "numeric";
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

    const durationSeconds = parseNonNegativeInteger(nextForm.duration_seconds);
    if (durationSeconds === null) {
      toast.error("Trigger delay must be a non-negative whole number.");
      return;
    }

    const { threshold, error } = buildThresholdForSubmit(nextForm, selectedSensorType);
    if (!threshold) {
      toast.error(error ?? "Threshold is invalid.");
      return;
    }

    try {
      if (editTarget) {
        const payload: UpdateAlertRuleRequest = {
          id: editTarget.id,
          name: nextForm.name,
          severity: nextForm.severity,
          condition: nextForm.condition,
          threshold,
          is_active: nextForm.is_active,
        };
        const currentDurationSeconds = editTarget.duration_seconds ?? 0;
        if (durationSeconds !== currentDurationSeconds) {
          payload.duration_seconds = durationSeconds;
        }
        await updateRule(payload).unwrap();
        toast.success("Alert rule updated.");
      } else {
        const payload: CreateAlertRuleRequest = {
          sensor_id: nextForm.sensor_id,
          name: nextForm.name,
          severity: nextForm.severity,
          condition: nextForm.condition,
          threshold,
          duration_seconds: durationSeconds,
        };
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
                <SelectTrigger>
                  <SelectValue placeholder="Select sensor…">
                    {selectedSensorLabel || undefined}
                  </SelectValue>
                </SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="trigger-delay">Trigger Delay (seconds)</Label>
            <Input
              id="trigger-delay"
              type="number"
              min="0"
              step="1"
              required
              value={form.duration_seconds}
              onChange={(e) => setForm((f) => ({ ...f, duration_seconds: e.target.value }))}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">0 = trigger immediately</p>
            <p className="text-xs text-muted-foreground">&gt;0 = trigger only if condition is continuously violated for this duration</p>
            <p className="text-xs text-muted-foreground">Mode: {durationSecondsLabel(parseNonNegativeInteger(form.duration_seconds) ?? 0)}</p>
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
