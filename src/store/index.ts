import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { api } from "@/store/api-slice";
import authReducer, { setActiveOrg } from "@/store/auth-slice";
import wsReducer from "@/store/ws-slice";
import { resetRealtimeState, wsConnect, wsDisconnect } from "@/store/ws-slice";
import { wsMiddleware } from "@/store/ws-middleware";

// ─── Listener: reset RTK Query cache + reconnect WS on tenant switch ─────────
// When the active org changes every cached query belongs to the previous tenant.
// Resetting the API state forces all active queries to refetch with the new
// X-Tenant-ID header. WS reconnect + local realtime reset prevents stale tenant data.
const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: setActiveOrg,
  effect: (action, listenerApi) => {
    const prevState = listenerApi.getOriginalState() as { auth?: { activeOrgId?: string | null } };
    if (prevState.auth?.activeOrgId === action.payload.id) {
      return;
    }

    listenerApi.dispatch(wsDisconnect());
    listenerApi.dispatch(resetRealtimeState());
    listenerApi.dispatch(api.util.resetApiState());
    listenerApi.dispatch(wsConnect());
  },
});

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    ws: wsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // RTK Query cache can become large under live telemetry and slows dev checks.
        ignoredPaths: ["api.queries", "api.mutations"],
        warnAfter: 128,
      },
      immutableCheck: {
        ignoredPaths: ["api.queries", "api.mutations"],
        warnAfter: 128,
      },
    })
      .prepend(listenerMiddleware.middleware)
      .concat(api.middleware)
      .concat(wsMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
