"use client";

import { BellRing, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ListPageSizeSelect,
  ListPaginationFooter,
  ListResultsSummary,
} from "@/components/ui/list-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTime24 } from "@/lib/date-time";
import type { SensorAlertRow } from "@/features/sensors/components/sensor-detail-types";
import type { AlertSeverity } from "@/types/models";

const severityVariant: Record<AlertSeverity, "default" | "secondary" | "destructive" | "outline"> = {
  info: "secondary",
  warning: "default",
  critical: "destructive",
  fatal: "destructive",
};

interface SensorAlertsCardProps {
  rows: SensorAlertRow[];
  totalCount: number;
  isLoading: boolean;
  pageSize: number;
  pageSizeOptions: readonly number[];
  currentPage: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  acknowledging: boolean;
  acknowledgingId: string | null;
  onRefresh: () => void;
  onPageSizeChange: (next: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onAcknowledge: (alertId: string) => void;
}

export function SensorAlertsCard({
  rows,
  totalCount,
  isLoading,
  pageSize,
  pageSizeOptions,
  currentPage,
  totalPages,
  canGoPrev,
  canGoNext,
  acknowledging,
  acknowledgingId,
  onRefresh,
  onPageSizeChange,
  onPrev,
  onNext,
  onAcknowledge,
}: SensorAlertsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="size-4" />
            Sensor Alerts
          </CardTitle>
          <CardDescription>
            Loaded from REST on page entry and enriched with live WebSocket updates.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <ListResultsSummary shownCount={rows.length} totalCount={totalCount} noun="alerts" />
          <ListPageSizeSelect
            id="sensor-alerts-page-size"
            value={pageSize}
            options={pageSizeOptions}
            onChange={onPageSizeChange}
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No alerts for this sensor yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ack</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const canAcknowledge =
                  row.source === "rest"
                  && !!row.restAlertId
                  && row.status === "active"
                  && row.isAcknowledged === false;

                return (
                  <TableRow key={row.key} className={row.status === "resolved" ? "opacity-70" : undefined}>
                    <TableCell>
                      {row.severity ? (
                        <Badge variant={severityVariant[row.severity]}>{row.severity}</Badge>
                      ) : (
                        <Badge variant="outline">unknown</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === "active" ? "destructive" : "outline"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.isAcknowledged === null ? (
                        <Badge variant="outline">live</Badge>
                      ) : (
                        <Badge variant={row.isAcknowledged ? "secondary" : "outline"}>
                          {row.isAcknowledged ? "acknowledged" : "pending"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-140 truncate text-sm text-muted-foreground">
                      {row.message}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatTime24(row.updatedAt, { withSeconds: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      {canAcknowledge ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={acknowledging && acknowledgingId === row.restAlertId}
                          onClick={() => onAcknowledge(row.restAlertId!)}
                        >
                          <CheckCircle2 className="mr-1.5 size-3.5" />
                          Acknowledge
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {row.source === "live" ? "Live-only" : "-"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <ListPaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={onPrev}
          onNext={onNext}
        />
      </CardContent>
    </Card>
  );
}

