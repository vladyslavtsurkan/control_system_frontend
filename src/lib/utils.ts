import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export type SearchParamValue = string | string[] | undefined;

export function getFirstSearchParamValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parsePositiveIntParam(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export function parsePageSizeParam(
  value: string | undefined,
  allowedValues: readonly number[],
  fallback: number,
): number {
  const parsed = parsePositiveIntParam(value, fallback);
  return allowedValues.includes(parsed) ? parsed : fallback;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
