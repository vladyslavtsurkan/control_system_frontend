"use client";

import { useCallback, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearLiveAlerts } from "@/store/ws-slice";
import { selectLiveAlerts } from "@/store/selectors";
import { useGetSensorsQuery } from "@/store/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { formatTime24 } from "@/lib/date-time";
import type { AlertSeverity } from "@/features/alerts/types";

const severityVariant: Record<
  AlertSeverity,
  "default" | "secondary" | "destructive"
> = {
  info: "secondary",
  warning: "default",
  critical: "destructive",
  fatal: "destructive",
};

export function ActiveAlertsTable() {
  const dispatch = useAppDispatch();
  const alerts = useAppSelector(selectLiveAlerts);
  const { data: sensorsData } = useGetSensorsQuery({ limit: 100, offset: 0 });

  const sensorNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const sensor of sensorsData?.items ?? []) {
      map.set(sensor.id, sensor.name);
    }
    return map;
  }, [sensorsData]);

  const getDisplaySensorName = useCallback(
    (sensorId: string, sensorName: string) => {
      if (sensorName && sensorName !== sensorId) {
        return sensorName;
      }
      return sensorNameById.get(sensorId) ?? sensorName ?? sensorId;
    },
    [sensorNameById],
  );

  const rows = useMemo(
    () =>
      [...alerts].sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "active" ? -1 : 1;
        }
        return Date.parse(b.updated_at) - Date.parse(a.updated_at);
      }),
    [alerts],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Live Alerts</CardTitle>
        {rows.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(clearLiveAlerts())}
          >
            <Trash2 className="mr-1 size-3" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            No active alerts. All systems nominal.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Sensor</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Last Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((alert) => (
                <TableRow
                  key={alert.id}
                  className={
                    alert.status === "resolved" ? "opacity-70" : undefined
                  }
                >
                  <TableCell>
                    <Badge variant={severityVariant[alert.severity]}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {getDisplaySensorName(alert.sensor_id, alert.sensor_name)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {alert.message}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        alert.status === "resolved" ? "outline" : "destructive"
                      }
                    >
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatTime24(alert.updated_at, { withSeconds: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
