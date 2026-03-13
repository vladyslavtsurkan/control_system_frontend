import { z } from "zod";

export const createSensorSchema = z.object({
  opc_server_id: z.string().min(1, "OPC UA Server is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  node_id: z.string().min(1, "Node ID is required"),
  units: z.string().nullable().optional(),
});

export const updateSensorSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
  node_id: z.string().min(1, "Node ID is required").optional(),
  units: z.string().nullable().optional(),
});

export type CreateSensorFormData = z.infer<typeof createSensorSchema>;
export type UpdateSensorFormData = z.infer<typeof updateSensorSchema>;
