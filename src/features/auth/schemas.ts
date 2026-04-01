import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be at most 64 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be at most 64 characters"),
  first_name: z
    .string()
    .max(100, "First name must be at most 100 characters")
    .optional(),
  last_name: z
    .string()
    .max(100, "Last name must be at most 100 characters")
    .optional(),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const signUpVerifySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  code: z.string().min(1, "Verification code is required"),
});

export type SignUpVerifyFormData = z.infer<typeof signUpVerifySchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  code: z.string().min(1, "Reset code is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be at most 64 characters"),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
