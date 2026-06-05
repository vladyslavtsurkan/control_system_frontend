import { api } from "@/store/api/base-api";
import type {
  OpcServer,
  ApiKeyInfoResponse,
} from "@/features/servers/types";
import type {
  PaginatedResponse,
  PaginationQueryParams,
} from "@/shared/types/pagination";

const serversApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getServers: builder.query<
      PaginatedResponse<OpcServer>,
      PaginationQueryParams | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.offset != null) params.set("offset", String(args.offset));
        if (args?.limit != null) params.set("limit", String(args.limit));
        const qs = params.toString();
        return `/v1/opc-servers/${qs ? `?${qs}` : ""}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Servers" as const,
                id,
              })),
              { type: "Servers", id: "LIST" },
            ]
          : [{ type: "Servers", id: "LIST" }],
    }),

    getApiKeys: builder.query<ApiKeyInfoResponse[], void>({
      query: () => "/v1/opc-servers/api-keys",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ opc_server_id }) => ({
                type: "Servers" as const,
                id: `APIKEY-${opc_server_id}`,
              })),
              { type: "Servers", id: "APIKEY-LIST" },
            ]
          : [{ type: "Servers", id: "APIKEY-LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetServersQuery,
  useGetApiKeysQuery,
} = serversApi;
