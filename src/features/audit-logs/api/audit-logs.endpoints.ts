import { api } from "@/store/api/base-api";
import type { AuditLogEntry, GetAuditLogsParams } from "@/features/audit-logs/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

const auditLogsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<
      PaginatedResponse<AuditLogEntry>,
      GetAuditLogsParams | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.resource_type) params.set("resource_type", args.resource_type);
        if (args?.action) params.set("action", args.action);
        if (args?.actor_id) params.set("actor_id", args.actor_id);
        if (args?.offset != null) params.set("offset", String(args.offset));
        if (args?.limit != null) params.set("limit", String(args.limit));
        const qs = params.toString();
        return `/v1/audit-logs/${qs ? `?${qs}` : ""}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "AuditLogs" as const,
                id,
              })),
              { type: "AuditLogs", id: "LIST" },
            ]
          : [{ type: "AuditLogs", id: "LIST" }],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogsApi;

