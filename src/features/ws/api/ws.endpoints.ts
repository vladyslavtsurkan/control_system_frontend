import { api } from "@/store/api/base-api";
import type { WsTicketResponse } from "@/features/ws/types";

const wsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWsTicket: builder.query<WsTicketResponse, void>({
      query: () => ({ url: "/ws/ticket", baseUrl: "/api" }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetWsTicketQuery } = wsApi;


