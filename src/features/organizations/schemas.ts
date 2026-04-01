import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .nullable()
    .optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export type CreateOrganizationFormData = z.infer<
  typeof createOrganizationSchema
>;
export type UpdateOrganizationFormData = z.infer<
  typeof updateOrganizationSchema
>;
