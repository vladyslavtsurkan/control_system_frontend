import { z } from "zod";

export const createSensorSchema = z.object({
  opc_server_id: z.string().min(1, "OPC UA Server is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  node_id: z.string().min(1, "Node ID is required"),
  data_type: z.enum(["numeric", "boolean", "string"]).default("numeric"),
  units: z.string().nullable().optional(),
  is_writable: z.boolean().default(false),
});

export const updateSensorSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
  node_id: z.string().min(1, "Node ID is required").optional(),
  data_type: z.enum(["numeric", "boolean", "string"]).optional(),
  units: z.string().nullable().optional(),
  is_writable: z.boolean().optional(),
});

export type CreateSensorFormData = z.infer<typeof createSensorSchema>;
export type UpdateSensorFormData = z.infer<typeof updateSensorSchema>;
