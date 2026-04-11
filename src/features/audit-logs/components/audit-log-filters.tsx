"use client";

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
              ? RESOURCE_TYPE_LABELS[value.resource_type]
              : "All resource types"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All resource types</SelectItem>
          {RESOURCE_TYPES.map((rt) => (
            <SelectItem key={rt} value={rt}>
              {RESOURCE_TYPE_LABELS[rt]}
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
            {value.action ? ACTION_LABELS[value.action] : "All actions"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All actions</SelectItem>
          {ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {ACTION_LABELS[a]}
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
              {selectedMember ? selectedMember.email : "All users"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All users</SelectItem>
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
