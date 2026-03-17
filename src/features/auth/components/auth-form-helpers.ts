import type { ZodIssue } from "zod";

export type FieldErrors = Record<string, string>;

interface ValidationErrorItem {
  msg?: unknown;
}

interface ValidationErrorResponse {
  detail?: unknown;
}

export function mapZodIssuesToFieldErrors(issues: ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
}

export function getApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const detail = (data as ValidationErrorResponse).detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as ValidationErrorItem;
    if (typeof first?.msg === "string") {
      return first.msg;
    }
  }

  return fallback;
}

