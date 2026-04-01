import type { Middleware } from "@reduxjs/toolkit";
import { isAction } from "@reduxjs/toolkit";
import { wsConnect, wsDisconnect } from "@/store/ws-slice";
import { createWsManager } from "@/store/ws/base/ws-manager";
import { routeWsEvent } from "@/store/ws/base/ws-event-router";
import { createTelemetryEventHandler } from "@/features/sensors/ws";
import { createAlertEventHandler } from "@/features/alerts/ws";

export const wsMiddleware: Middleware = (storeApi) => {
  const handlers = {
    telemetry: createTelemetryEventHandler(),
    alert: createAlertEventHandler(),
  };

  const manager = createWsManager({
    storeApi,
    onMessageRaw: (raw, apiStore) =>
      routeWsEvent(raw, { storeApi, apiStore }, handlers),
  });

  return (next) => (action) => {
    if (isAction(action)) {
      if (wsConnect.match(action)) {
        manager.requestConnect();
        return;
      }

      if (wsDisconnect.match(action)) {
        manager.disconnect();
        return;
      }
    }

    return next(action);
  };
};
