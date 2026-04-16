"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { thresholdLabel } from "@/features/alerts/lib/alert-rule-helpers";
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
  const t = useTranslations("alerts");

  function durationLabel(secs: number): string {
    const n = Number.isInteger(secs) && secs > 0 ? secs : 0;
    return n === 0
      ? t("durationInstant")
      : t("durationDelay", { seconds: String(n) });
  }
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
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("sensor")}</TableHead>
            <TableHead>{t("condition")}</TableHead>
            <TableHead>{t("threshold")}</TableHead>
            <TableHead>{t("debounce")}</TableHead>
            <TableHead>{t("severity")}</TableHead>
            <TableHead>{t("active")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {t("noRules")}
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => {
              const sensor = sensors.find((s) => s.id === rule.sensor_id);
              return (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{sensor?.name ?? rule.sensor_id}</TableCell>
                  <TableCell className="text-sm">
                    {t(`conditions.${rule.condition}`)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {thresholdLabel(rule.threshold)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {durationLabel(rule.duration_seconds ?? 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={severityVariant[rule.severity]}>
                      {t(`severities.${rule.severity}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? "default" : "outline"}>
                      {rule.is_active ? t("activeBadge") : t("paused")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(rule)}
                        aria-label={t("editRuleTitle")}
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
                        aria-label={t("deleteRule", { name: rule.name })}
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
