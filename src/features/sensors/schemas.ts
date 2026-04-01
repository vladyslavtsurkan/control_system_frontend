import { z } from "zod";

export const sensorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  node_id: z.string().min(1, "Node ID is required"),
  data_type: z.enum(["numeric", "boolean", "string"]).default("numeric"),
  units: z.string().nullable().optional(),
  is_writable: z.boolean().default(false),
});

export const createSensorSchema = z.object({
  opc_server_id: z.string().min(1, "OPC UA Server is required"),
}).extend(sensorFormSchema.shape);

export const updateSensorSchema = sensorFormSchema.partial().extend({
  name: z.string().min(1, "Name is required").optional(),
  node_id: z.string().min(1, "Node ID is required").optional(),
});

export type CreateSensorFormData = z.infer<typeof createSensorSchema>;
export type UpdateSensorFormData = z.infer<typeof updateSensorSchema>;
