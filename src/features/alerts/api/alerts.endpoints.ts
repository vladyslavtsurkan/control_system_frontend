import { api } from "@/store/api/base-api";
import type {
  Alert,
  GetAlertsParams,
  GetAlertRulesParams,
  AlertRule,
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
} from "@/features/alerts/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

function normalizeAlertRule(rule: AlertRule): AlertRule {
  return {
    ...rule,
    duration_seconds: rule.duration_seconds ?? 0,
    actions: rule.actions ?? [],
  };
}

const alertsApi = api.injectEndpoints({
  endpoints: (builder) => ({
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

    getAlertRules: builder.query<PaginatedResponse<AlertRule>, GetAlertRulesParams | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.sensorId) params.set("sensor_id", args.sensorId);
        if (args?.offset != null) params.set("offset", String(args.offset));
        if (args?.limit != null) params.set("limit", String(args.limit));
        const qs = params.toString();
        return `/v1/alert-rules/${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (response: PaginatedResponse<AlertRule>): PaginatedResponse<AlertRule> => ({
        ...response,
        items: response.items.map(normalizeAlertRule),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "AlertRules" as const, id })),
              { type: "AlertRules", id: "LIST" },
            ]
          : [{ type: "AlertRules", id: "LIST" }],
    }),

    createAlertRule: builder.mutation<AlertRule, CreateAlertRuleRequest>({
      query: (body) => ({
        url: "/v1/alert-rules/",
        method: "POST",
        body: {
          ...body,
          duration_seconds: body.duration_seconds ?? 0,
        },
      }),
      transformResponse: (response: AlertRule): AlertRule => normalizeAlertRule(response),
      invalidatesTags: [{ type: "AlertRules", id: "LIST" }],
    }),

    updateAlertRule: builder.mutation<AlertRule, UpdateAlertRuleRequest>({
      query: ({ id, ...body }) => ({ url: `/v1/alert-rules/${id}`, method: "PATCH", body }),
      transformResponse: (response: AlertRule): AlertRule => normalizeAlertRule(response),
      invalidatesTags: (_r, _e, { id }) => [{ type: "AlertRules", id }],
    }),

    deleteAlertRule: builder.mutation<void, string>({
      query: (id) => ({ url: `/v1/alert-rules/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "AlertRules", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAlertsQuery,
  useAcknowledgeAlertMutation,
  useResolveAlertMutation,
  useGetAlertRulesQuery,
  useCreateAlertRuleMutation,
  useUpdateAlertRuleMutation,
  useDeleteAlertRuleMutation,
} = alertsApi;


