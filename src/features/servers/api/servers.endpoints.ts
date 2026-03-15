import { api } from "@/store/api/base-api";
import type {
  OpcServer,
  CreateOpcServerRequest,
  UpdateOpcServerRequest,
  ApiKeyCreateResponse,
  ApiKeyInfoResponse,
} from "@/features/servers/types";
import type { PaginatedResponse, PaginationQueryParams } from "@/shared/types/pagination";

const serversApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getServers: builder.query<PaginatedResponse<OpcServer>, PaginationQueryParams | void>({
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
              ...result.items.map(({ id }) => ({ type: "Servers" as const, id })),
              { type: "Servers", id: "LIST" },
            ]
          : [{ type: "Servers", id: "LIST" }],
    }),

    createServer: builder.mutation<OpcServer, CreateOpcServerRequest>({
      query: (body) => ({ url: "/v1/opc-servers/", method: "POST", body }),
      invalidatesTags: [{ type: "Servers", id: "LIST" }],
    }),

    updateServer: builder.mutation<OpcServer, UpdateOpcServerRequest>({
      query: ({ id, ...body }) => ({ url: `/v1/opc-servers/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Servers", id }],
    }),

    deleteServer: builder.mutation<void, string>({
      query: (id) => ({ url: `/v1/opc-servers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Servers", id: "LIST" }],
    }),

    getApiKeys: builder.query<ApiKeyInfoResponse[], void>({
      query: () => "/v1/opc-servers/api-keys",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ opc_server_id }) => ({ type: "Servers" as const, id: `APIKEY-${opc_server_id}` })),
              { type: "Servers", id: "APIKEY-LIST" },
            ]
          : [{ type: "Servers", id: "APIKEY-LIST" }],
    }),

    createOrRotateApiKey: builder.mutation<ApiKeyCreateResponse, string>({
      query: (serverId) => ({ url: `/v1/opc-servers/${serverId}/api-key`, method: "POST" }),
      invalidatesTags: (_r, _e, serverId) => [
        { type: "Servers", id: `APIKEY-${serverId}` },
        { type: "Servers", id: "APIKEY-LIST" },
      ],
    }),

    revokeApiKey: builder.mutation<void, string>({
      query: (serverId) => ({ url: `/v1/opc-servers/${serverId}/api-key`, method: "DELETE" }),
      invalidatesTags: (_r, _e, serverId) => [
        { type: "Servers", id: `APIKEY-${serverId}` },
        { type: "Servers", id: "APIKEY-LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetServersQuery,
  useCreateServerMutation,
  useUpdateServerMutation,
  useDeleteServerMutation,
  useGetApiKeysQuery,
  useCreateOrRotateApiKeyMutation,
  useRevokeApiKeyMutation,
} = serversApi;


