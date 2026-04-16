"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  ACTION_LABELS,
  RESOURCE_TYPE_LABELS,
} from "@/features/audit-logs/lib/audit-log-helpers";
import type {
  AuditLogAction,
  AuditLogResourceType,
} from "@/features/audit-logs/types";
import type { OrganizationMember } from "@/features/organizations/types";
import { cn } from "@/lib/utils";

export interface AuditLogFiltersValue {
  resource_type: AuditLogResourceType | "";
  action: AuditLogAction | "";
  actor_id: string;
}

interface AuditLogFiltersProps {
  value: AuditLogFiltersValue;
  members: OrganizationMember[];
  onChange: (next: AuditLogFiltersValue) => void;
}

const RESOURCE_TYPES = Object.keys(
  RESOURCE_TYPE_LABELS,
) as AuditLogResourceType[];
const ACTIONS = Object.keys(ACTION_LABELS) as AuditLogAction[];

export function AuditLogFilters({
  value,
  members,
  onChange,
}: AuditLogFiltersProps) {
  const t = useTranslations("auditLogs");

  // Translated labels for dropdowns
  const translatedResourceTypeLabels: Record<AuditLogResourceType, string> = {
    organization: t("resourceTypes.organization"),
    opc_server: t("resourceTypes.opc_server"),
    sensor: t("resourceTypes.sensor"),
    alert_rule: t("resourceTypes.alert_rule"),
    member: t("resourceTypes.member"),
    api_key: t("resourceTypes.api_key"),
  };
  const translatedActionLabels: Record<AuditLogAction, string> = {
    created: t("actionLabels.created"),
    updated: t("actionLabels.updated"),
    deleted: t("actionLabels.deleted"),
    member_added: t("actionLabels.member_added"),
    member_removed: t("actionLabels.member_removed"),
    member_left: t("actionLabels.member_left"),
    role_changed: t("actionLabels.role_changed"),
    api_key_created: t("actionLabels.api_key_created"),
    api_key_revoked: t("actionLabels.api_key_revoked"),
    control_command_sent: t("actionLabels.control_command_sent"),
  };

  function set<K extends keyof AuditLogFiltersValue>(
    key: K,
    val: AuditLogFiltersValue[K],
  ) {
    onChange({ ...value, [key]: val });
  }

  const selectedMember = members.find((m) => m.id === value.actor_id);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Resource type */}
      <Select
        value={value.resource_type || "__all__"}
        onValueChange={(v) =>
          set(
            "resource_type",
            v === "__all__" ? "" : (v as AuditLogResourceType),
          )
        }
      >
        <SelectTrigger className="h-8 min-w-44">
          <span className={cn(!value.resource_type && "text-muted-foreground")}>
            {value.resource_type
              ? translatedResourceTypeLabels[value.resource_type]
              : t("allResourceTypes")}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t("allResourceTypes")}</SelectItem>
          {RESOURCE_TYPES.map((rt) => (
            <SelectItem key={rt} value={rt}>
              {translatedResourceTypeLabels[rt]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Action */}
      <Select
        value={value.action || "__all__"}
        onValueChange={(v) =>
          set("action", v === "__all__" ? "" : (v as AuditLogAction))
        }
      >
        <SelectTrigger className="h-8 min-w-44">
          <span className={cn(!value.action && "text-muted-foreground")}>
            {value.action
              ? translatedActionLabels[value.action]
              : t("allActions")}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t("allActions")}</SelectItem>
          {ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {translatedActionLabels[a]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Actor (members list) */}
      {members.length > 0 && (
        <Select
          value={value.actor_id || "__all__"}
          onValueChange={(v) =>
            set("actor_id", v == null || v === "__all__" ? "" : v)
          }
        >
          <SelectTrigger className="h-8 min-w-52">
            <span className={cn(!value.actor_id && "text-muted-foreground")}>
              {selectedMember ? selectedMember.email : t("allUsers")}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("allUsers")}</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
