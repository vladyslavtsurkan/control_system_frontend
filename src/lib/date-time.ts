type DateInput = Date | string | number;

interface DateTimeFormatOptions {
  timeZone?: string;
  withSeconds?: boolean;
}

function toValidDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTime24(value: DateInput, options: DateTimeFormatOptions = {}): string {
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

export function formatDateTime24(value: DateInput, options: DateTimeFormatOptions = {}): string {
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

export function formatDate24(value: DateInput, options: Omit<DateTimeFormatOptions, "withSeconds"> = {}): string {
  const date = toValidDate(value);
  if (!date) return "";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: options.timeZone,
  });
}

