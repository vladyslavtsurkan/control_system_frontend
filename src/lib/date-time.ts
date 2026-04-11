type DateInput = Date | string | number;

interface DateTimeFormatOptions {
  timeZone?: string;
  withSeconds?: boolean;
}

function toValidDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTime24(
  value: DateInput,
  options: DateTimeFormatOptions = {},
): string {
  const date = toValidDate(value);
  if (!date) return "";

  const { timeZone, withSeconds = false } = options;

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
    hour12: false,
    timeZone,
  });
}

export function formatDateTime24(
  value: DateInput,
  options: DateTimeFormatOptions = {},
): string {
  const date = toValidDate(value);
  if (!date) return "";

  const { timeZone, withSeconds = false } = options;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
    hour12: false,
    timeZone,
  });
}

export function formatDate24(
  value: DateInput,
  options: Omit<DateTimeFormatOptions, "withSeconds"> = {},
): string {
  const date = toValidDate(value);
  if (!date) return "";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: options.timeZone,
  });
}

/**
 * Returns a human-friendly relative string such as "2 hours ago" or "in 5 minutes".
 * Uses the browser's built-in Intl.RelativeTimeFormat — no extra dependency needed.
 */
export function formatRelativeTime(value: DateInput): string {
  const date = toValidDate(value);
  if (!date) return "";

  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (absSec < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffSec / 3_600);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffSec / 86_400);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, "day");
  const diffMonth = Math.round(diffSec / (86_400 * 30));
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, "month");
  const diffYear = Math.round(diffSec / (86_400 * 365));
  return rtf.format(diffYear, "year");
}

