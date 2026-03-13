import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  url: z.string().min(1, "Endpoint URL is required")
    .regex(/^(opc\.tcp|https?):\/\/.+/, "Must be a valid OPC-TCP or HTTP URL"),
  security_policy: z.enum([
    "None", "Basic256Sha256", "Aes256_Sha256_RsaPss",
    "Aes128_Sha256_RsaOaep", "Basic256", "Basic128Rsa15",
  ]).default("None"),
  authentication_method: z.enum(["anonymous", "username"]).default("anonymous"),
  username: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
});

export const updateServerSchema = createServerSchema.partial();

export type CreateServerFormData = z.infer<typeof createServerSchema>;
export type UpdateServerFormData = z.infer<typeof updateServerSchema>;
