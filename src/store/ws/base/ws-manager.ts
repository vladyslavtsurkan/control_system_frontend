import { setConnectionStatus, setWsError } from "@/store/ws-slice";
import { WS_BASE_URL } from "@/config/constants";
import { computeDelay, isAuthExpiredStatus } from "@/store/ws/base/ws-reconnect";
import { createWsRuntimeState } from "@/store/ws/base/ws-runtime";
import type { WsManagerOptions } from "@/store/ws/base/ws-types";

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function createWsManager({ storeApi, onMessageRaw }: WsManagerOptions) {
  const runtime = createWsRuntimeState();

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
      const ticketRes = await fetch("/api/ws/ticket", { cache: "no-store" });

      if (
        !runtime.shouldReconnect ||
        connectionAttemptId !== runtime.activeConnectionAttemptId
      ) {
        return;
      }

      if (!ticketRes.ok) {
        const errorDetails = await ticketRes.json().catch(() => ({}));

        if (
          !runtime.shouldReconnect ||
          connectionAttemptId !== runtime.activeConnectionAttemptId
        ) {
          return;
        }

        const authExpired = isAuthExpiredStatus(ticketRes.status);
        const errorCode = authExpired ? "AUTH_EXPIRED" : "TICKET_FETCH_FAILED";

        storeApi.dispatch(
          setWsError({
            code: errorCode,
            message: `Ticket fetch failed (HTTP ${ticketRes.status})`,
          }),
        );

        console.warn("[WS] Ticket fetch failed:", {
          status: ticketRes.status,
          details: errorDetails,
        });

        storeApi.dispatch(setConnectionStatus("error"));
        if (authExpired) {
          runtime.shouldReconnect = false;
          return;
        }

        if (runtime.shouldReconnect) scheduleReconnect();
        return;
      }

      const ticketPayload = (await ticketRes.json().catch(() => ({}))) as {
        ticket?: unknown;
      };
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

      const nextSocket = new WebSocket(`${WS_BASE_URL}?ticket=${ticket}`);
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

      console.error("[WS] Failed to fetch ticket or open socket:", err);
      storeApi.dispatch(setConnectionStatus("error"));
      storeApi.dispatch(
        setWsError({
          code: "TICKET_FETCH_FAILED",
          message: "Failed to establish WebSocket connection",
        }),
      );
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

