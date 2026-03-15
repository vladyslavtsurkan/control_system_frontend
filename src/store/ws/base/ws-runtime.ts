export interface WsRuntimeState {
  socket: WebSocket | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempt: number;
  shouldReconnect: boolean;
  isConnecting: boolean;
  activeConnectionAttemptId: number;
}

export function createWsRuntimeState(): WsRuntimeState {
  return {
    socket: null,
    reconnectTimer: null,
    reconnectAttempt: 0,
    shouldReconnect: true,
    isConnecting: false,
    activeConnectionAttemptId: 0,
  };
}

