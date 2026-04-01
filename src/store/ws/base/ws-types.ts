import type { MiddlewareAPI } from "@reduxjs/toolkit";
import type {
  WsAlertEvent,
  WsEvent,
  WsTelemetryEvent,
} from "@/features/ws/types";

export interface WsHandlerContext {
  storeApi: MiddlewareAPI;
  apiStore: MiddlewareAPI;
}

export type WsTelemetryHandler = (
  event: WsTelemetryEvent,
  ctx: WsHandlerContext,
) => void | Promise<void>;

export type WsAlertHandler = (
  event: WsAlertEvent,
  ctx: WsHandlerContext,
) => void | Promise<void>;

export interface WsEventHandlers {
  telemetry?: WsTelemetryHandler;
  alert?: WsAlertHandler;
}

export interface WsManagerOptions {
  storeApi: MiddlewareAPI;
  onMessageRaw: (raw: unknown, apiStore: MiddlewareAPI) => void | Promise<void>;
}

export type ParsedWsEvent = WsEvent;
