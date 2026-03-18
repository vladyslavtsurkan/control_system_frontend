"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { TimeSeriesChart } from "@/features/sensors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime24 } from "@/lib/date-time";
import type { LiveKpi, SensorReading } from "@/features/sensors";

interface KpiCardProps {
  sensorId: string;
  sensorName: string;
  units: string | null;
  kpi: LiveKpi | undefined;
  /** Sparkline data derived from the 1000-reading REST cache */
  readings?: SensorReading[];
}

export function KpiCard({ sensorId, sensorName, units, kpi, readings }: KpiCardProps) {
  const hasKpiValue = typeof kpi?.value === "number" && Number.isFinite(kpi.value);
  const hasKpiTime = typeof kpi?.time === "string" && !Number.isNaN(Date.parse(kpi.time));
  const canRenderKpi = hasKpiValue && hasKpiTime;

  return (
    <Link href={`/sensors/${sensorId}`} className="group block">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {sensorName}
          </CardTitle>
          <Activity className="size-4 text-muted-foreground" />
        </CardHeader>

        <CardContent className="space-y-2">
          {kpi ? (
            canRenderKpi ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)] motion-safe:animate-pulse" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    Live
                  </span>
                </div>
                <div className="text-3xl font-bold tabular-nums">
                  {kpi.value.toFixed(2)}
                  {units ? (
                    <span className="ml-1 text-lg font-normal text-muted-foreground">
                      {units}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated:{" "}
                  {formatTime24(kpi.time, { withSeconds: true })}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold tabular-nums text-muted-foreground">--</div>
                <p className="text-xs text-muted-foreground">Waiting for telemetry...</p>
              </>
            )
          ) : (
            <>
              <Skeleton className="h-9 w-32" />
              <Skeleton className="mt-1 h-4 w-24" />
            </>
          )}

          <div className="pointer-events-none -mx-2">
            {readings && readings.length > 1 ? (
              <TimeSeriesChart
                data={readings}
                unit={units ?? undefined}
                sensorName={sensorName}
                height={56}
                sparkline
              />
            ) : (
              <div className="h-14" />
            )}
          </div>

          <p className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View full chart {"->"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

