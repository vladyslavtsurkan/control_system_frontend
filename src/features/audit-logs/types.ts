export type AuditLogResourceType =
  | "organization"
  | "opc_server"
  | "sensor"
  | "alert_rule"
  | "member"
  | "api_key";

export type AuditLogAction =
  | "created"
  | "updated"
  | "deleted"
  | "member_added"
  | "member_removed"
  | "member_left"
  | "role_changed"
  | "api_key_created"
  | "api_key_revoked"
  | "control_command_sent";

export interface AuditLogEntry {
  id: string;
  created_at: string;
  organization_id: string;
  actor_id: string | null;
  actor_email: string;
  action: AuditLogAction;
  resource_type: AuditLogResourceType;
  resource_id: string | null;
  resource_name: string | null;
  extra_data: Record<string, unknown> | null;
}

export interface GetAuditLogsParams {
  resource_type?: AuditLogResourceType | "";
  action?: AuditLogAction | "";
  actor_id?: string;
  offset?: number;
  limit?: number;
}

