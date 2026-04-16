"use client";

import { useMemo, useState, type SyntheticEvent } from "react";
import { X } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  useCreateAlertRuleMutation,
  useGetSensorsQuery,
  useUpdateAlertRuleMutation,
} from "@/store/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  parseNonNegativeInteger,
  ruleToForm,
} from "@/features/alerts/lib/alert-rule-helpers";
import { MAX_ALERT_RULE_ACTIONS } from "@/config/constants";

const SEVERITIES: AlertSeverity[] = ["info", "warning", "critical", "fatal"];

const emptyForm: FormState = {
  sensor_id: "",
  name: "",
  severity: "warning",
  condition: "greater_than",
  duration_seconds: "0",
  sv_value: "",
  range_min: "",
  range_max: "",
  nodata_timeout: "300",
  is_active: true,
  actions: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

interface AlertRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: AlertRule | null;
  sensors: Sensor[];
}

export function AlertRuleFormDialog({
  open,
  onOpenChange,
  editTarget,
  sensors,
}: AlertRuleFormDialogProps) {
  const t = useTranslations("alerts");
  const tCommon = useTranslations("common");
  const [createRule, { isLoading: creating }] = useCreateAlertRuleMutation();
  const [updateRule, { isLoading: updating }] = useUpdateAlertRuleMutation();
  const { data: sensorsData } = useGetSensorsQuery({
    limit: 100,
    is_writable: true,
  });
  const [form, setForm] = useState<FormState>(() =>
    editTarget ? ruleToForm(editTarget) : emptyForm,
  );
  const actionsForm = useForm<Pick<FormState, "actions">>({
    defaultValues: {
      actions: (editTarget ? ruleToForm(editTarget) : emptyForm).actions,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: actionsForm.control,
    name: "actions",
  });
  const isAtActionLimit = fields.length >= MAX_ALERT_RULE_ACTIONS;
  const watchedActions = useWatch({
    control: actionsForm.control,
    name: "actions",
  });

  const writableSensors = useMemo(
    () => sensorsData?.items ?? [],
    [sensorsData?.items],
  );
  const sensorLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const sensor of sensors) {
      map.set(
        sensor.id,
        sensor.units ? `${sensor.name} (${sensor.units})` : sensor.name,
      );
    }
    return map;
  }, [sensors]);
  const actionSensorOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const sensor of writableSensors) {
      map.set(sensor.id, {
        id: sensor.id,
        label: sensor.units ? `${sensor.name} (${sensor.units})` : sensor.name,
      });
    }
    for (const action of watchedActions ?? []) {
      const sensorId = action?.target_sensor_id;
      if (!sensorId || map.has(sensorId)) continue;
      map.set(sensorId, {
        id: sensorId,
        label:
          sensorLabelById.get(sensorId) ??
          `Unknown sensor (${sensorId.slice(0, 8)}...)`,
      });
    }
    return Array.from(map.values());
  }, [writableSensors, watchedActions, sensorLabelById]);

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
    () =>
      CONDITIONS.filter((condition) =>
        allowedConditionValues.includes(condition.value),
      ),
    [allowedConditionValues],
  );
  const currentThresholdType =
    CONDITIONS.find((c) => c.value === activeCondition)?.thresholdType ??
    "single_value";
  const booleanThresholdValue = form.sv_value === "false" ? "false" : "true";

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget && !form.sensor_id) {
      toast.error(t("pleaseSelectSensor"));
      return;
    }

    const nextForm =
      activeCondition === form.condition
        ? form
        : { ...form, condition: activeCondition };

    const durationSeconds = parseNonNegativeInteger(nextForm.duration_seconds);
    if (durationSeconds === null) {
      toast.error(t("triggerDelayMustBeWhole"));
      return;
    }

    const { threshold, error } = buildThresholdForSubmit(
      nextForm,
      selectedSensorType,
    );
    if (!threshold) {
      toast.error(error ?? t("thresholdInvalid"));
      return;
    }

    if ((watchedActions?.length ?? 0) > MAX_ALERT_RULE_ACTIONS) {
      toast.error(t("tooManyActions", { max: MAX_ALERT_RULE_ACTIONS }));
      return;
    }

    const transformedActions = (watchedActions ?? []).map((action) => ({
      target_sensor_id: action.target_sensor_id,
      trigger_payload: action.trigger_value
        ? { value: action.trigger_value }
        : null,
      resolve_payload: action.resolve_value
        ? { value: action.resolve_value }
        : null,
    }));

    try {
      if (editTarget) {
        const payload: UpdateAlertRuleRequest = {
          id: editTarget.id,
          name: nextForm.name,
          severity: nextForm.severity,
          condition: nextForm.condition,
          threshold,
          is_active: nextForm.is_active,
          actions: transformedActions,
        };
        const currentDurationSeconds = editTarget.duration_seconds ?? 0;
        if (durationSeconds !== currentDurationSeconds) {
          payload.duration_seconds = durationSeconds;
        }
        await updateRule(payload).unwrap();
        toast.success(t("ruleUpdated"));
      } else {
        const payload: CreateAlertRuleRequest = {
          sensor_id: nextForm.sensor_id,
          name: nextForm.name,
          severity: nextForm.severity,
          condition: nextForm.condition,
          threshold,
          duration_seconds: durationSeconds,
          actions: transformedActions,
        };
        await createRule(payload).unwrap();
        toast.success(t("ruleCreated"));
      }
      onOpenChange(false);
    } catch {
      toast.error(tCommon("operationFailed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {editTarget ? t("editRuleTitle") : t("createRuleTitle")}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex max-h-[calc(90vh-5rem)] flex-col gap-4 overflow-y-auto pr-1"
        >
          <div className="space-y-2">
            <Label htmlFor="rule-name">{t("ruleName")}</Label>
            <Input
              id="rule-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="High Temperature Alert"
            />
          </div>

          {!editTarget && (
            <div className="space-y-2">
              <Label>{t("sensor")}</Label>
              <Select
                value={form.sensor_id}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, sensor_id: v ?? "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sensor…">
                    {selectedSensorLabel || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sensors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.units ? ` (${s.units})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("severity")}</Label>
              <Select
                value={form.severity}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, severity: v as AlertSeverity }))
                }
              >
                <SelectTrigger>
                  <SelectValue>{t(`severities.${form.severity}`)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`severities.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("condition")}</Label>
              <Select
                value={activeCondition}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, condition: v as AlertCondition }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {t(`conditions.${activeCondition}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allowedConditions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {t(`conditions.${c.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-delay">{t("triggerDelay")}</Label>
            <Input
              id="trigger-delay"
              type="number"
              min="0"
              step="1"
              required
              value={form.duration_seconds}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration_seconds: e.target.value }))
              }
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              {t("triggerDelayImmediate")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("triggerDelayDuration")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("triggerDelayMode", {
                mode: (() => {
                  const secs =
                    parseNonNegativeInteger(form.duration_seconds) ?? 0;
                  return secs === 0
                    ? t("durationInstant")
                    : t("durationDelay", { seconds: String(secs) });
                })(),
              })}
            </p>
          </div>

          {currentThresholdType === "single_value" && (
            <div className="space-y-2">
              <Label htmlFor="sv-value">{t("thresholdValue")}</Label>
              {selectedSensorType === "boolean" ? (
                <Select
                  value={booleanThresholdValue}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, sv_value: v ?? "true" }))
                  }
                >
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sv_value: e.target.value }))
                  }
                  placeholder={
                    selectedSensorType === "numeric"
                      ? "e.g. 100"
                      : "Enter value"
                  }
                />
              )}
            </div>
          )}

          {currentThresholdType === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="range-min">{t("min")}</Label>
                <Input
                  id="range-min"
                  type="number"
                  step="any"
                  required
                  value={form.range_min}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, range_min: e.target.value }))
                  }
                  placeholder="e.g. 20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="range-max">{t("max")}</Label>
                <Input
                  id="range-max"
                  type="number"
                  step="any"
                  required
                  value={form.range_max}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, range_max: e.target.value }))
                  }
                  placeholder="e.g. 80"
                />
              </div>
            </div>
          )}

          {currentThresholdType === "no_data" && (
            <div className="space-y-2">
              <Label htmlFor="nodata-timeout">{t("noDataTimeout")}</Label>
              <Input
                id="nodata-timeout"
                type="number"
                min="1"
                required
                value={form.nodata_timeout}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nodata_timeout: e.target.value }))
                }
                placeholder="300"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t("automatedActions")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("automatedActionsHelp", {
                    count: fields.length,
                    max: MAX_ALERT_RULE_ACTIONS,
                  })}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isAtActionLimit}
                onClick={() => {
                  if (isAtActionLimit) {
                    toast.error(
                      t("tooManyActions", { max: MAX_ALERT_RULE_ACTIONS }),
                    );
                    return;
                  }
                  append({
                    target_sensor_id: "",
                    trigger_value: "",
                    resolve_value: "",
                  });
                }}
              >
                {t("addAction")}
              </Button>
            </div>

            {fields.length === 0 && (
              <Card className="border-dashed p-4 text-sm text-muted-foreground">
                {t("noActions")}
              </Card>
            )}

            {fields.map((field, index) => (
              <Card key={field.id} className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {t("actionLabel", { index: index + 1 })}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("targetSensor")}</Label>
                    <Select
                      value={watchedActions?.[index]?.target_sensor_id ?? ""}
                      onValueChange={(value) =>
                        actionsForm.setValue(
                          `actions.${index}.target_sensor_id`,
                          value ?? "",
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectSensor")}>
                          {sensorLabelById.get(
                            watchedActions?.[index]?.target_sensor_id ?? "",
                          ) || undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {actionSensorOptions.map((sensor) => (
                          <SelectItem key={sensor.id} value={sensor.id}>
                            {sensor.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`trigger-value-${index}`}>
                      {t("triggerValue")}
                    </Label>
                    <Input
                      id={`trigger-value-${index}`}
                      value={watchedActions?.[index]?.trigger_value ?? ""}
                      onChange={(e) =>
                        actionsForm.setValue(
                          `actions.${index}.trigger_value`,
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`resolve-value-${index}`}>
                      {t("resolveValue")}
                    </Label>
                    <Input
                      id={`resolve-value-${index}`}
                      value={watchedActions?.[index]?.resolve_value ?? ""}
                      onChange={(e) =>
                        actionsForm.setValue(
                          `actions.${index}.resolve_value`,
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {editTarget && (
            <div className="flex items-center gap-3">
              <input
                id="is-active"
                type="checkbox"
                className="size-4 accent-primary"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
              />
              <Label htmlFor="is-active">{t("ruleIsActive")}</Label>
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tCommon("cancel")}
            </DialogClose>
            <Button type="submit" disabled={creating || updating}>
              {editTarget ? tCommon("saveChanges") : t("createRuleTitle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
