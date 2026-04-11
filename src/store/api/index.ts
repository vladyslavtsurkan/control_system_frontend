export { api } from "@/store/api/base-api";

export {
  useGetMeQuery,
  useUpdateMeMutation,
} from "@/features/auth/api/auth.endpoints";

export {
  useGetOrganizationsQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useLeaveOrganizationMutation,
  useGetOrganizationMembersQuery,
  useAddOrganizationMemberMutation,
  useRemoveOrganizationMemberMutation,
  useChangeOrganizationMemberRoleMutation,
} from "@/features/organizations/api/organizations.endpoints";

export {
  useGetServersQuery,
  useCreateServerMutation,
  useUpdateServerMutation,
  useDeleteServerMutation,
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} from "@/features/servers/api/servers.endpoints";

export {
  useGetSensorsQuery,
  useGetSensorQuery,
  useCreateSensorMutation,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
  useGetReadingsQuery,
} from "@/features/sensors/api/sensors.endpoints";

export {
  useGetAlertsQuery,
  useAcknowledgeAlertMutation,
  useResolveAlertMutation,
  useGetAlertRulesQuery,
  useCreateAlertRuleMutation,
  useUpdateAlertRuleMutation,
  useDeleteAlertRuleMutation,
} from "@/features/alerts/api/alerts.endpoints";

export { useGetAuditLogsQuery } from "@/features/audit-logs/api/audit-logs.endpoints";

export { useGetWsTicketQuery } from "@/features/ws/api/ws.endpoints";
