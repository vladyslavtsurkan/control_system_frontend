export { api } from "@/store/api/base-api";

export {
  useGetMeQuery,
} from "@/features/auth/api/auth.endpoints";

export {
  useGetOrganizationsQuery,
  useGetOrganizationMembersQuery,
} from "@/features/organizations/api/organizations.endpoints";

export {
  useGetServersQuery,
  useGetApiKeysQuery,
} from "@/features/servers/api/servers.endpoints";

export {
  useGetSensorsQuery,
  useGetSensorQuery,
  useGetReadingsQuery,
} from "@/features/sensors/api/sensors.endpoints";

export {
  useGetAlertsQuery,
  useGetAlertRulesQuery,
} from "@/features/alerts/api/alerts.endpoints";

export { useGetAuditLogsQuery } from "@/features/audit-logs/api/audit-logs.endpoints";

export { useGetWsTicketQuery } from "@/features/ws/api/ws.endpoints";
