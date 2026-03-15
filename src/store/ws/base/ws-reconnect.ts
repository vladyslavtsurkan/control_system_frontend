import {
  WS_RECONNECT_BASE_DELAY_MS,
  WS_RECONNECT_MAX_DELAY_MS,
  WS_RECONNECT_MULTIPLIER,
} from "@/config/constants";

export function computeDelay(attempt: number): number {
  const delay =
    WS_RECONNECT_BASE_DELAY_MS * Math.pow(WS_RECONNECT_MULTIPLIER, attempt);
  return Math.min(delay, WS_RECONNECT_MAX_DELAY_MS);
}

export function isAuthExpiredStatus(status: number): boolean {
  return status === 401 || status === 403;
}

