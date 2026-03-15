import type { WsEventHandlers, WsHandlerContext } from "@/store/ws/base/ws-types";
import { decodeWsFrame, parseWsEvent } from "@/store/ws/base/ws-frame";

export async function routeWsEvent(
  raw: unknown,
  ctx: WsHandlerContext,
  handlers: WsEventHandlers,
): Promise<void> {
  const frame = await decodeWsFrame(raw);
  if (!frame) {
    return;
  }

  const event = parseWsEvent(frame, raw);
  if (!event) {
    return;
  }

  if (event.type === "telemetry") {
    await handlers.telemetry?.(event, ctx);
    return;
  }

  if (event.type === "alert") {
    await handlers.alert?.(event, ctx);
  }
}

