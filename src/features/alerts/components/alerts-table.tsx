"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CONDITIONS,
  durationSecondsLabel,
  thresholdLabel,
} from "@/features/alerts/lib/alert-rule-helpers";
import type { AlertRule, AlertSeverity } from "@/features/alerts/types";
import type { Sensor } from "@/features/sensors";

const severityVariant: Record<
  AlertSeverity,
  "default" | "secondary" | "destructive" | "outline"
> = {
  info: "secondary",
  warning: "default",
  critical: "destructive",
  fatal: "destructive",
};

interface AlertsTableProps {
  rules: AlertRule[];
  sensors: Sensor[];
  isLoading: boolean;
  onEdit: (rule: AlertRule) => void;
  onDelete: (rule: AlertRule) => void;
  canManage: boolean;
}

export function AlertsTable({
  rules,
  sensors,
  isLoading,
  onEdit,
  onDelete,
  canManage,
}: AlertsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Sensor</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Threshold</TableHead>
            <TableHead>Debounce</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No alert rules configured yet.
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => {
              const sensor = sensors.find((s) => s.id === rule.sensor_id);
              const condMeta = CONDITIONS.find(
                (c) => c.value === rule.condition,
              );
              return (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{sensor?.name ?? rule.sensor_id}</TableCell>
                  <TableCell className="text-sm">
                    {condMeta?.label ?? rule.condition}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {thresholdLabel(rule.threshold)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {durationSecondsLabel(rule.duration_seconds ?? 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={severityVariant[rule.severity]}>
                      {rule.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? "default" : "outline"}>
                      {rule.is_active ? "active" : "paused"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(rule)}
                        aria-label="Edit alert rule"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => onDelete(rule)}
                        aria-label="Delete alert rule"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
