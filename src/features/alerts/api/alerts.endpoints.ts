import { api } from "@/store/api/base-api";
import type {
  Alert,
  GetAlertsParams,
  GetAlertRulesParams,
  AlertRule,
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
      transformResponse: (
        response: PaginatedResponse<Alert>,
      ): PaginatedResponse<Alert> => ({
        ...response,
        items: response.items.map((alert) => ({
          ...alert,
          rule_id: alert.rule?.id ?? null,
        })),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Alerts" as const,
                id,
              })),
              { type: "Alerts", id: "LIST" },
            ]
          : [{ type: "Alerts", id: "LIST" }],
    }),

    getAlertRules: builder.query<
      PaginatedResponse<AlertRule>,
      GetAlertRulesParams | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.sensorId) params.set("sensor_id", args.sensorId);
        if (args?.offset != null) params.set("offset", String(args.offset));
        if (args?.limit != null) params.set("limit", String(args.limit));
        const qs = params.toString();
        return `/v1/alert-rules/${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (
        response: PaginatedResponse<AlertRule>,
      ): PaginatedResponse<AlertRule> => ({
        ...response,
        items: response.items.map(normalizeAlertRule),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "AlertRules" as const,
                id,
              })),
              { type: "AlertRules", id: "LIST" },
            ]
          : [{ type: "AlertRules", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAlertsQuery,
  useGetAlertRulesQuery,
} = alertsApi;
