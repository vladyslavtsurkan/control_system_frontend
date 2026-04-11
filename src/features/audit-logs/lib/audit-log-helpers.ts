import type {
  AuditLogAction,
  AuditLogEntry,
  AuditLogResourceType,
} from "@/features/audit-logs/types";

// ─── Labels ──────────────────────────────────────────────────────────────────

export const RESOURCE_TYPE_LABELS: Record<AuditLogResourceType, string> = {
  organization: "Organization",
  opc_server: "OPC UA Server",
  sensor: "Sensor",
  alert_rule: "Alert Rule",
  member: "Member",
  api_key: "API Key",
};

export const ACTION_LABELS: Record<AuditLogAction, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  member_added: "Member Added",
  member_removed: "Member Removed",
  member_left: "Member Left",
  role_changed: "Role Changed",
  api_key_created: "API Key Created",
  api_key_revoked: "API Key Revoked",
  control_command_sent: "Control Command",
};

// ─── Human-readable sentence ─────────────────────────────────────────────────

function resourceLabel(type: AuditLogResourceType): string {
  return RESOURCE_TYPE_LABELS[type] ?? type;
}

export function getActionSentence(entry: AuditLogEntry): string {
  const { action, resource_type, resource_name, resource_id, extra_data } =
    entry;

  const name = resource_name ?? resource_id ?? "unknown";

  switch (action) {
    case "created":
      return `Created ${resourceLabel(resource_type)} "${name}"`;

    case "updated":
      return `Updated ${resourceLabel(resource_type)} "${name}"`;

    case "deleted":
      return `Deleted ${resourceLabel(resource_type)} "${name}"`;

    case "member_added":
      return `Added member "${name}"`;

    case "member_removed":
      return `Removed member "${name}"`;

    case "member_left":
      return `Member "${name}" left`;

    case "role_changed": {
      const old_role = (extra_data?.old_role as string | undefined) ?? "?";
      const new_role = (extra_data?.new_role as string | undefined) ?? "?";
      return `Changed "${name}" role from ${old_role} → ${new_role}`;
    }

    case "api_key_created":
      return `Created API key "${name}"`;

    case "api_key_revoked":
      return `Revoked API key "${name}"`;

    case "control_command_sent":
      return `Sent control command to "${name}"`;

    default:
      return action;
  }
}

// ─── Badge colour ─────────────────────────────────────────────────────────────

/**
 * Returns a Tailwind className string that overrides the base Badge styling
 * with the correct colour for the given action.
 */
export function actionBadgeClass(action: AuditLogAction): string {
  switch (action) {
    case "created":
      return "bg-green-100 text-green-800 border-transparent dark:bg-green-900/30 dark:text-green-400";

    case "updated":
    case "role_changed":
    case "api_key_created":
      return "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-900/30 dark:text-blue-400";

    case "deleted":
    case "member_removed":
    case "api_key_revoked":
      return "bg-red-100 text-red-800 border-transparent dark:bg-red-900/30 dark:text-red-400";

    case "control_command_sent":
      return "bg-orange-100 text-orange-800 border-transparent dark:bg-orange-900/30 dark:text-orange-400";

    case "member_added":
    case "member_left":
    default:
      return "bg-zinc-100 text-zinc-700 border-transparent dark:bg-zinc-800 dark:text-zinc-300";
  }
}
