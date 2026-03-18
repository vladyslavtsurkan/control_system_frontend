import { setConnectionStatus, setWsError } from "@/store/ws-slice";
import { WS_BASE_URL } from "@/config/constants";
import { computeDelay, isAuthExpiredStatus } from "@/store/ws/base/ws-reconnect";
import { createWsRuntimeState } from "@/store/ws/base/ws-runtime";
import type { WsManagerOptions } from "@/store/ws/base/ws-types";
import { wsApi } from "@/features/ws/api/ws.endpoints";

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function createWsManager({ storeApi, onMessageRaw }: WsManagerOptions) {
  const runtime = createWsRuntimeState();
  const dispatchThunk = storeApi.dispatch as unknown as (action: unknown) => unknown;

  async function connect() {
    if (!runtime.shouldReconnect || runtime.isConnecting) {
      return;
    }

    if (
      runtime.socket &&
      (runtime.socket.readyState === WebSocket.CONNECTING ||
        runtime.socket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    runtime.isConnecting = true;
    const connectionAttemptId = ++runtime.activeConnectionAttemptId;

    if (runtime.reconnectTimer) {
      clearTimeout(runtime.reconnectTimer);
      runtime.reconnectTimer = null;
    }

    storeApi.dispatch(setConnectionStatus("connecting"));

    try {
      const ticketQuery = dispatchThunk(
        wsApi.endpoints.getWsTicket.initiate(undefined, {
          forceRefetch: true,
          subscribe: false,
        }),
      ) as unknown as {
        unwrap: () => Promise<{ ticket: string }>;
      };

      const ticketPayload = await ticketQuery.unwrap();

      if (
        !runtime.shouldReconnect ||
        connectionAttemptId !== runtime.activeConnectionAttemptId
      ) {
        return;
      }

      const ticket = toNonEmptyString(ticketPayload.ticket);
      if (!ticket) {
        storeApi.dispatch(setConnectionStatus("error"));
        storeApi.dispatch(
          setWsError({
            code: "TICKET_FETCH_FAILED",
            message: "Ticket endpoint returned an invalid payload",
          }),
        );
        if (runtime.shouldReconnect) scheduleReconnect();
        return;
      }

      if (
        !runtime.shouldReconnect ||
        connectionAttemptId !== runtime.activeConnectionAttemptId
      ) {
        return;
      }

      const activeTenantId =
        (storeApi.getState() as { auth?: { activeOrgId?: string | null } }).auth
          ?.activeOrgId ?? null;
      const wsParams = new URLSearchParams({ ticket });
      if (activeTenantId) {
        wsParams.set("tenant_id", activeTenantId);
      }

      const nextSocket = new WebSocket(`${WS_BASE_URL}?${wsParams.toString()}`);
      runtime.socket = nextSocket;

      nextSocket.onopen = () => {
        if (
          connectionAttemptId !== runtime.activeConnectionAttemptId ||
          runtime.socket !== nextSocket
        ) {
          nextSocket.close(1000, "Stale connection");
          return;
        }

        runtime.reconnectAttempt = 0;
        storeApi.dispatch(setConnectionStatus("connected"));
      };

      nextSocket.onmessage = (event: MessageEvent) => {
        if (
          connectionAttemptId !== runtime.activeConnectionAttemptId ||
          runtime.socket !== nextSocket
        ) {
          return;
        }

        void onMessageRaw(event.data, storeApi);
      };

      nextSocket.onerror = () => {
        if (
          connectionAttemptId !== runtime.activeConnectionAttemptId ||
          runtime.socket !== nextSocket
        ) {
          return;
        }

        storeApi.dispatch(setConnectionStatus("error"));
        storeApi.dispatch(
          setWsError({
            code: "NETWORK_ERROR",
            message: "WebSocket connection error",
          }),
        );
      };

      nextSocket.onclose = (event: CloseEvent) => {
        if (
          connectionAttemptId !== runtime.activeConnectionAttemptId ||
          runtime.socket !== nextSocket
        ) {
          return;
        }

        storeApi.dispatch(setConnectionStatus("disconnected"));
        runtime.socket = null;

        if (event.code === 1008 || event.code === 4001) {
          runtime.shouldReconnect = false;
          storeApi.dispatch(
            setWsError({
              code: "AUTH_EXPIRED",
              message: "WebSocket authorization expired",
            }),
          );
          return;
        }

        if (runtime.shouldReconnect) scheduleReconnect();
      };
    } catch (err) {
      if (
        !runtime.shouldReconnect ||
        connectionAttemptId !== runtime.activeConnectionAttemptId
      ) {
        return;
      }

      const status =
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        typeof (err as { status?: unknown }).status === "number"
          ? (err as { status: number }).status
          : null;

      const authExpired = status !== null && isAuthExpiredStatus(status);

      console.error("[WS] Failed to fetch ticket or open socket:", err);
      storeApi.dispatch(setConnectionStatus("error"));
      storeApi.dispatch(
        setWsError({
          code: authExpired ? "AUTH_EXPIRED" : "TICKET_FETCH_FAILED",
          message:
            status === null
              ? "Failed to establish WebSocket connection"
              : `Ticket fetch failed (HTTP ${status})`,
        }),
      );
      if (authExpired) {
        runtime.shouldReconnect = false;
        return;
      }
      if (runtime.shouldReconnect) scheduleReconnect();
    } finally {
      if (connectionAttemptId === runtime.activeConnectionAttemptId) {
        runtime.isConnecting = false;
      }
    }
  }

  function scheduleReconnect() {
    if (!runtime.shouldReconnect || runtime.isConnecting || runtime.reconnectTimer) {
      return;
    }

    const delay = computeDelay(runtime.reconnectAttempt);
    runtime.reconnectAttempt += 1;
    console.info(
      `[WS] Reconnecting in ${delay}ms (attempt ${runtime.reconnectAttempt})`,
    );
    runtime.reconnectTimer = setTimeout(() => {
      runtime.reconnectTimer = null;
      if (runtime.shouldReconnect) {
        void connect();
      }
    }, delay);
  }

  function disconnect() {
    runtime.shouldReconnect = false;
    runtime.isConnecting = false;
    runtime.activeConnectionAttemptId += 1;

    if (runtime.reconnectTimer) {
      clearTimeout(runtime.reconnectTimer);
      runtime.reconnectTimer = null;
    }

    if (runtime.socket) {
      const currentSocket = runtime.socket;
      runtime.socket = null;
      currentSocket.close(1000, "Client disconnect");
    }

    storeApi.dispatch(setConnectionStatus("idle"));
  }

  function requestConnect() {
    runtime.shouldReconnect = true;
    runtime.reconnectAttempt = 0;
    void connect();
  }

  return {
    requestConnect,
    disconnect,
  };
}

