"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { actionBadgeClass } from "@/features/audit-logs/lib/audit-log-helpers";
import { formatDateTime24, formatRelativeTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import type {
  AuditLogEntry,
  AuditLogResourceType,
} from "@/features/audit-logs/types";

interface AuditLogTableProps {
  entries: AuditLogEntry[];
  isLoading: boolean;
}

interface ExtraDataDialogProps {
  entry: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ExtraDataDialog({ entry, open, onOpenChange }: ExtraDataDialogProps) {
  const t = useTranslations("auditLogs");

  function getLocalizedSentence(e: AuditLogEntry): string {
    const { action, resource_type, resource_name, resource_id, extra_data } = e;
    const name = resource_name ?? resource_id ?? "unknown";
    const resourceType = t(
      `resourceTypes.${resource_type as AuditLogResourceType}`,
    );
    switch (action) {
      case "created":
        return t("sentences.created", { resourceType, name });
      case "updated":
        return t("sentences.updated", { resourceType, name });
      case "deleted":
        return t("sentences.deleted", { resourceType, name });
      case "member_added":
        return t("sentences.member_added", { name });
      case "member_removed":
        return t("sentences.member_removed", { name });
      case "member_left":
        return t("sentences.member_left", { name });
      case "role_changed": {
        const old_role = (extra_data?.old_role as string | undefined) ?? "?";
        const new_role = (extra_data?.new_role as string | undefined) ?? "?";
        return t("sentences.role_changed", { name, old_role, new_role });
      }
      case "api_key_created":
        return t("sentences.api_key_created", { name });
      case "api_key_revoked":
        return t("sentences.api_key_revoked", { name });
      case "control_command_sent":
        return t("sentences.control_command_sent", { name });
      default:
        return action;
    }
  }

  if (!entry) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("eventDetails")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground text-xs">{t("action")}</span>
            <Badge
              className={cn(
                "w-fit font-normal text-xs",
                actionBadgeClass(entry.action),
              )}
            >
              {getLocalizedSentence(entry)}
            </Badge>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground text-xs">
              {t("timestamp")}
            </span>
            <span>
              {formatDateTime24(entry.created_at, { withSeconds: true })}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground text-xs">{t("actor")}</span>
            <span>
              {entry.actor_email}
              {entry.actor_id === null && (
                <span className="ml-1 text-muted-foreground">
                  {t("deletedUser")}
                </span>
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">
              {t("extraData")}
            </span>
            {entry.extra_data && Object.keys(entry.extra_data).length > 0 ? (
              <pre className="rounded-md bg-muted px-4 py-3 text-xs leading-relaxed overflow-auto max-h-72 whitespace-pre-wrap break-all">
                {JSON.stringify(entry.extra_data, null, 2)}
              </pre>
            ) : (
              <span className="text-sm text-muted-foreground">
                {t("noExtraData")}
              </span>
            )}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

export function AuditLogTable({ entries, isLoading }: AuditLogTableProps) {
  const t = useTranslations("auditLogs");
  const locale = useLocale();
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  function getLocalizedSentence(e: AuditLogEntry): string {
    const { action, resource_type, resource_name, resource_id, extra_data } = e;
    const name = resource_name ?? resource_id ?? "unknown";
    const resourceType = t(
      `resourceTypes.${resource_type as AuditLogResourceType}`,
    );
    switch (action) {
      case "created":
        return t("sentences.created", { resourceType, name });
      case "updated":
        return t("sentences.updated", { resourceType, name });
      case "deleted":
        return t("sentences.deleted", { resourceType, name });
      case "member_added":
        return t("sentences.member_added", { name });
      case "member_removed":
        return t("sentences.member_removed", { name });
      case "member_left":
        return t("sentences.member_left", { name });
      case "role_changed": {
        const old_role = (extra_data?.old_role as string | undefined) ?? "?";
        const new_role = (extra_data?.new_role as string | undefined) ?? "?";
        return t("sentences.role_changed", { name, old_role, new_role });
      }
      case "api_key_created":
        return t("sentences.api_key_created", { name });
      case "api_key_revoked":
        return t("sentences.api_key_revoked", { name });
      case "control_command_sent":
        return t("sentences.control_command_sent", { name });
      default:
        return action;
    }
  }

  function openDetails(entry: AuditLogEntry) {
    setSelectedEntry(entry);
    setDialogOpen(true);
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">{t("when")}</TableHead>
              <TableHead className="w-52">{t("who")}</TableHead>
              <TableHead>{t("action")}</TableHead>
              <TableHead className="w-48">{t("resource")}</TableHead>
              <TableHead className="w-24 text-right">{t("details")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {t("noEntries")}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  {/* When */}
                  <TableCell className="text-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          render={<span />}
                          className="cursor-default whitespace-nowrap"
                        >
                          {formatRelativeTime(entry.created_at, locale)}
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatDateTime24(entry.created_at, {
                            withSeconds: true,
                          })}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* Who */}
                  <TableCell className="text-sm">
                    <span className="truncate max-w-48 block">
                      {entry.actor_email}
                    </span>
                    {entry.actor_id === null && (
                      <span className="text-xs text-muted-foreground">
                        {t("deletedUser")}
                      </span>
                    )}
                  </TableCell>

                  {/* Action */}
                  <TableCell>
                    <Badge
                      className={cn(
                        "font-normal text-xs",
                        actionBadgeClass(entry.action),
                      )}
                    >
                      {getLocalizedSentence(entry)}
                    </Badge>
                  </TableCell>

                  {/* Resource */}
                  <TableCell className="text-sm">
                    {entry.resource_name ? (
                      <span className="font-medium">{entry.resource_name}</span>
                    ) : entry.resource_id ? (
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-40 block">
                        {entry.resource_id}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Details */}
                  <TableCell className="text-right">
                    {entry.extra_data &&
                    Object.keys(entry.extra_data).length > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => openDetails(entry)}
                      >
                        {t("view")}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ExtraDataDialog
        entry={selectedEntry}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
