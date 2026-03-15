"use client";

import { Activity, Clock, Hash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime24 } from "@/lib/date-time";
import type { SensorReadingsStatsData } from "@/features/sensors/components/sensor-detail-types";

interface SensorReadingsStatsProps {
  stats: SensorReadingsStatsData | null;
  unit: string;
  isLoading: boolean;
}

export function SensorReadingsStats({ stats, unit, isLoading }: SensorReadingsStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-22 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="px-4 pb-1 pt-4">
          <CardTitle className="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="size-3" /> Latest
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold tabular-nums">
            {stats.latest.value.toFixed(3)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatTime24(stats.latest.time, { withSeconds: true })}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="px-4 pb-1 pt-4">
          <CardTitle className="text-xs text-muted-foreground">Average</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold tabular-nums">
            {stats.avg.toFixed(3)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">over {stats.count} readings</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="px-4 pb-1 pt-4">
          <CardTitle className="text-xs text-muted-foreground">Min / Max</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold tabular-nums">
            {stats.min.toFixed(2)}
            <span className="mx-1 text-base font-normal text-muted-foreground">/</span>
            {stats.max.toFixed(2)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{unit}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="px-4 pb-1 pt-4">
          <CardTitle className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="size-3" /> Readings
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold tabular-nums">{stats.count}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" /> windowed by selected filters
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

