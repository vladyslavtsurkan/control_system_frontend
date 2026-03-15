import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store/index";
import type {
  User,
  UserUpdateRequest,
  OrganizationWithRole,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationMember,
  OpcServer,
  CreateOpcServerRequest,
  UpdateOpcServerRequest,
  ApiKeyCreateResponse,
  ApiKeyInfoResponse,
  Sensor,
  GetSensorsParams,
  CreateSensorRequest,
  UpdateSensorRequest,
  ReadingResponse,
  GetReadingsParams,
  Alert,
  GetAlertsParams,
  GetAlertRulesParams,
  AlertRule,
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
  WsTicketResponse,
  PaginatedResponse,
  ItemsResponse,
  UserRoleInOrg,
  PaginationQueryParams,
} from "@/types/models";

// ─── Tag types for cache invalidation ────────────────────────────────────────
const TAGS = ["Me", "Orgs", "Servers", "Sensors", "Readings", "Alerts", "AlertRules"] as const;

// ─── RTK Query API Slice ──────────────────────────────────────────────────────
// baseUrl → Next.js BFF proxy (same-origin). The proxy reads the httpOnly cookie
// and injects the Authorization header server-side. We only need to pass X-Tenant-ID.
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/proxy",
    prepareHeaders: (headers, { getState }) => {
      const activeOrgId = (getState() as RootState).auth.activeOrgId;
      if (activeOrgId) {
        headers.set("X-Tenant-ID", activeOrgId);
      }
      return headers;
    },
  }),
  tagTypes: [...TAGS],
  endpoints: (builder) => ({

    // ── Auth / User ──────────────────────────────────────────────────────────
    getMe: builder.query<User, void>({
      query: () => "/v1/users/me",
      providesTags: ["Me"],
    }),

    updateMe: builder.mutation<User, UserUpdateRequest>({
      query: (body) => ({ url: "/v1/users/", method: "PATCH", body }),
      invalidatesTags: ["Me"],
    }),

    // ── Organizations ────────────────────────────────────────────────────────
    getOrganizations: builder.query<PaginatedResponse<OrganizationWithRole>, PaginationQueryParams | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.offset != null) params.set("offset", String(args.offset));
        if (args?.limit != null) params.set("limit", String(args.limit));
        const qs = params.toString();
        return `/v1/organizations/${qs ? `?${qs}` : ""}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Orgs" as const, id })),
              { type: "Orgs", id: "LIST" },
            ]
          : [{ type: "Orgs", id: "LIST" }],
    }),

    createOrganization: builder.mutation<OrganizationWithRole, CreateOrganizationRequest>({
      query: (body) => ({ url: "/v1/organizations/", method: "POST", body }),
      invalidatesTags: [{ type: "Orgs", id: "LIST" }],
    }),

    updateOrganization: builder.mutation<OrganizationWithRole, UpdateOrganizationRequest & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/v1/organizations/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Orgs", id }],
    }),

    deleteOrganization: builder.mutation<void, string>({
      query: (id) => ({ url: `/v1/organizations/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Orgs", id: "LIST" }],
    }),

    leaveOrganization: builder.mutation<void, string>({
      query: (id) => ({ url: `/v1/organizations/${id}/leave`, method: "POST" }),
      invalidatesTags: [{ type: "Orgs", id: "LIST" }],
    }),

    getOrganizationMembers: builder.query<PaginatedResponse<OrganizationMember>, string>({
      query: (orgId) => `/v1/organizations/${orgId}/members`,
      providesTags: (_r, _e, orgId) => [{ type: "Orgs", id: `MEMBERS-${orgId}` }],
    }),

    addOrganizationMember: builder.mutation<void, { orgId: string; userId: string }>({
      query: ({ orgId, userId }) => ({
        url: `/v1/organizations/${orgId}/add/${userId}`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { orgId }) => [{ type: "Orgs", id: `MEMBERS-${orgId}` }],
    }),

    removeOrganizationMember: builder.mutation<void, { orgId: string; userId: string }>({
      query: ({ orgId, userId }) => ({
        url: `/v1/organizations/${orgId}/remove/${userId}`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { orgId }) => [{ type: "Orgs", id: `MEMBERS-${orgId}` }],
    }),

    changeOrganizationMemberRole: builder.mutation<void, { orgId: string; userId: string; role: UserRoleInOrg }>({
      query: ({ orgId, userId, role }) => ({
        url: `/v1/organizations/${orgId}/members/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (_r, _e, { orgId }) => [
        { type: "Orgs", id: `MEMBERS-${orgId}` },
        { type: "Orgs", id: "LIST" },
      ],
    }),

    // ── OPC UA Servers ───────────────────────────────────────────────────────
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

    // ── Sensors ──────────────────────────────────────────────────────────────
    getSensors: builder.query<PaginatedResponse<Sensor>, GetSensorsParams | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.opcServerId) params.set("opc_server_id", args.opcServerId);
        params.set("offset", String(args?.offset ?? 0));
        params.set("limit", String(args?.limit ?? 100));
        if (args?.prefetchReadings != null) {
          params.set("prefetch_readings", String(args.prefetchReadings));
        }
        if (args?.prefetchWindowMinutes != null) {
          params.set("prefetch_window_minutes", String(args.prefetchWindowMinutes));
        }
        return `/v1/sensors/?${params.toString()}`;
      },
      providesTags: (result, _e, args) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Sensors" as const, id })),
              { type: "Sensors", id: "LIST" },
              ...(args?.opcServerId ? [{ type: "Sensors" as const, id: `LIST-${args.opcServerId}` }] : []),
            ]
          : [
              { type: "Sensors", id: "LIST" },
              ...(args?.opcServerId ? [{ type: "Sensors" as const, id: `LIST-${args.opcServerId}` }] : []),
            ],
    }),

    getSensor: builder.query<Sensor, string>({
      query: (sensorId) => `/v1/sensors/${sensorId}`,
      providesTags: (_r, _e, sensorId) => [{ type: "Sensors", id: sensorId }],
    }),

    createSensor: builder.mutation<Sensor, CreateSensorRequest>({
      query: (body) => ({ url: "/v1/sensors/", method: "POST", body }),
      invalidatesTags: (_r, _e, { opc_server_id }) => [
        { type: "Sensors", id: "LIST" },
        { type: "Sensors", id: `LIST-${opc_server_id}` },
      ],
    }),

    updateSensor: builder.mutation<Sensor, UpdateSensorRequest>({
      query: ({ id, ...body }) => ({ url: `/v1/sensors/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Sensors", id }, { type: "Sensors", id: "LIST" }],
    }),

    deleteSensor: builder.mutation<void, string>({
      query: (id) => ({ url: `/v1/sensors/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Sensors", id: "LIST" }],
    }),

    // ── Readings ─────────────────────────────────────────────────────────────
    getReadings: builder.query<ItemsResponse<ReadingResponse>, GetReadingsParams>({
      query: ({ sensorId, startTime, endTime, sampleEvery }) => {
        const params = new URLSearchParams({ sensor_id: sensorId });
        if (startTime) params.set("start_time", startTime);
        if (endTime) params.set("end_time", endTime);
        if (sampleEvery != null) params.set("sample_every", String(sampleEvery));
        return `/v1/readings/?${params.toString()}`;
      },
      providesTags: (_r, _e, { sensorId }) => [{ type: "Readings", id: sensorId }],
    }),

    // ── Triggered Alerts ─────────────────────────────────────────────────────
    getAlerts: builder.query<PaginatedResponse<Alert>, GetAlertsParams | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.sensor_id) params.set("sensor_id", args.sensor_id);
        if (args?.offset != null) params.set("offset", String(args.offset));
        if (args?.limit != null) params.set("limit", String(args.limit));
        const qs = params.toString();
        return `/v1/alerts/${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (response: PaginatedResponse<Alert>): PaginatedResponse<Alert> => ({
        ...response,
        items: response.items.map((alert) => ({
          ...alert,
          rule_id: alert.rule?.id ?? null,
        })),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Alerts" as const, id })),
              { type: "Alerts", id: "LIST" },
            ]
          : [{ type: "Alerts", id: "LIST" }],
    }),

    acknowledgeAlert: builder.mutation<Alert, string>({
      query: (alertId) => ({ url: `/v1/alerts/${alertId}/acknowledge`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Alerts", id }],
    }),

    resolveAlert: builder.mutation<Alert, string>({
      query: (alertId) => ({ url: `/v1/alerts/${alertId}/resolve`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Alerts", id }],
    }),

    // ── Alert Rules ──────────────────────────────────────────────────────────
    getAlertRules: builder.query<PaginatedResponse<AlertRule>, GetAlertRulesParams | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.sensorId) params.set("sensor_id", args.sensorId);
        if (args?.offset != null) params.set("offset", String(args.offset));
        if (args?.limit != null) params.set("limit", String(args.limit));
        const qs = params.toString();
        return `/v1/alert-rules/${qs ? `?${qs}` : ""}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "AlertRules" as const, id })),
              { type: "AlertRules", id: "LIST" },
            ]
          : [{ type: "AlertRules", id: "LIST" }],
    }),

    createAlertRule: builder.mutation<AlertRule, CreateAlertRuleRequest>({
      query: (body) => ({ url: "/v1/alert-rules/", method: "POST", body }),
      invalidatesTags: [{ type: "AlertRules", id: "LIST" }],
    }),

    updateAlertRule: builder.mutation<AlertRule, UpdateAlertRuleRequest>({
      query: ({ id, ...body }) => ({ url: `/v1/alert-rules/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "AlertRules", id }],
    }),

    deleteAlertRule: builder.mutation<void, string>({
      query: (id) => ({ url: `/v1/alert-rules/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "AlertRules", id: "LIST" }],
    }),

    // ── WebSocket Ticket ─────────────────────────────────────────────────────
    getWsTicket: builder.query<WsTicketResponse, void>({
      query: () => ({ url: "/ws/ticket", baseUrl: "/api" }),
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useGetOrganizationsQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useLeaveOrganizationMutation,
  useGetOrganizationMembersQuery,
  useAddOrganizationMemberMutation,
  useRemoveOrganizationMemberMutation,
  useChangeOrganizationMemberRoleMutation,
  useGetServersQuery,
  useCreateServerMutation,
  useUpdateServerMutation,
  useDeleteServerMutation,
  useGetApiKeysQuery,
  useCreateOrRotateApiKeyMutation,
  useRevokeApiKeyMutation,
  useGetSensorsQuery,
  useGetSensorQuery,
  useCreateSensorMutation,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
  useGetReadingsQuery,
  useGetAlertsQuery,
  useAcknowledgeAlertMutation,
  useResolveAlertMutation,
  useGetAlertRulesQuery,
  useCreateAlertRuleMutation,
  useUpdateAlertRuleMutation,
  useDeleteAlertRuleMutation,
} = api;
