"use client";

import { useState } from "react";
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
import {
  actionBadgeClass,
  getActionSentence,
} from "@/features/audit-logs/lib/audit-log-helpers";
import { formatDateTime24, formatRelativeTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "@/features/audit-logs/types";

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
  if (!entry) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground text-xs">Action</span>
            <Badge
              className={cn(
                "w-fit font-normal text-xs",
                actionBadgeClass(entry.action),
              )}
            >
              {getActionSentence(entry)}
            </Badge>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground text-xs">Timestamp</span>
            <span>
              {formatDateTime24(entry.created_at, { withSeconds: true })}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground text-xs">Actor</span>
            <span>
              {entry.actor_email}
              {entry.actor_id === null && (
                <span className="ml-1 text-muted-foreground">
                  (deleted user)
                </span>
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Extra data</span>
            {entry.extra_data && Object.keys(entry.extra_data).length > 0 ? (
              <pre className="rounded-md bg-muted px-4 py-3 text-xs leading-relaxed overflow-auto max-h-72 whitespace-pre-wrap break-all">
                {JSON.stringify(entry.extra_data, null, 2)}
              </pre>
            ) : (
              <span className="text-sm text-muted-foreground">
                No extra data
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
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

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
              <TableHead className="w-36">When</TableHead>
              <TableHead className="w-52">Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="w-48">Resource</TableHead>
              <TableHead className="w-24 text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No audit log entries found.
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
                          {formatRelativeTime(entry.created_at)}
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
                        (deleted user)
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
                      {getActionSentence(entry)}
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
                        View
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
