import { api } from "@/store/api/base-api";
import type { WsTicketResponse } from "@/features/ws/types";

export const wsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWsTicket: builder.query<WsTicketResponse, void>({
      keepUnusedDataFor: 0,
      queryFn: async (_arg, { getState }) => {
        const activeOrgId =
          (getState() as { auth?: { activeOrgId?: string | null } }).auth
            ?.activeOrgId ?? null;

        const response = await fetch("/api/ws/ticket", {
          method: "GET",
          cache: "no-store",
          headers: activeOrgId ? { "X-Tenant-ID": activeOrgId } : undefined,
        });

        const payload = (await response.json().catch(() => ({}))) as {
          ticket?: unknown;
          detail?: unknown;
        };

        if (!response.ok || typeof payload.ticket !== "string") {
          const detail =
            typeof payload.detail === "string"
              ? payload.detail
              : `WS ticket request failed (HTTP ${response.status})`;

          return {
            error: {
              status: response.status,
              data: { detail },
            },
          };
        }

        return { data: { ticket: payload.ticket } };
      },
    }),
  }),
  overrideExisting: false,
});

export const { useGetWsTicketQuery } = wsApi;


