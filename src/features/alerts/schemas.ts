import { z } from "zod";

const alertSeverity = z.enum(["info", "warning", "critical", "fatal"]);
const alertCondition = z.enum([
  "greater_than", "less_than", "equals", "not_equals",
  "outside_range", "inside_range", "no_data",
]);

const singleValueThreshold = z.object({
  type: z.literal("single_value"),
  value: z.union([
    z.number({ error: "Threshold value is required" }),
    z.boolean({ error: "Threshold value is required" }),
    z.string().min(1, "Threshold value is required"),
  ]),
});

const rangeThreshold = z.object({
  type: z.literal("range"),
  min: z.number({ error: "Min value is required" }),
  max: z.number({ error: "Max value is required" }),
}).refine((data) => data.min < data.max, {
  message: "Min must be less than max",
  path: ["min"],
});

const noDataThreshold = z.object({
  type: z.literal("no_data"),
  timeout_seconds: z.number().int().positive("Timeout must be positive").default(300),
});

export const thresholdSchema = z.discriminatedUnion("type", [
  singleValueThreshold,
  rangeThreshold,
  noDataThreshold,
]);

export const createAlertRuleSchema = z.object({
  sensor_id: z.string().min(1, "Sensor is required"),
  name: z.string().min(1, "Rule name is required"),
  severity: alertSeverity.default("warning"),
  condition: alertCondition,
  threshold: thresholdSchema,
  duration_seconds: z.number().int("Trigger delay must be a whole number").min(0, "Trigger delay cannot be negative").default(0),
});

export const updateAlertRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required").optional(),
  severity: alertSeverity.optional(),
  condition: alertCondition.optional(),
  threshold: thresholdSchema.optional(),
  duration_seconds: z.number().int("Trigger delay must be a whole number").min(0, "Trigger delay cannot be negative").optional(),
  is_active: z.boolean().optional(),
});

export type CreateAlertRuleFormData = z.infer<typeof createAlertRuleSchema>;
export type UpdateAlertRuleFormData = z.infer<typeof updateAlertRuleSchema>;
