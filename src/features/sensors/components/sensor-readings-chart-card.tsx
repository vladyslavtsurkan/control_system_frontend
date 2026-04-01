"use client";

import { TimeSeriesChart } from "@/features/sensors/components/time-series-chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SensorDataType, SensorReading } from "@/features/sensors/types";

interface SensorReadingsChartCardProps {
  isLoading: boolean;
  chartKey: string;
  chartData: SensorReading[];
  sensorDataType?: SensorDataType;
  unit: string;
  sensorName?: string;
}

export function SensorReadingsChartCard({
  isLoading,
  chartKey,
  chartData,
  sensorDataType,
  unit,
  sensorName,
}: SensorReadingsChartCardProps) {
  const emptyStateMessage =
    sensorDataType && sensorDataType !== "numeric"
      ? "No numeric data for this sensor type."
      : "No readings found for this sensor yet.";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Time-Series Chart</CardTitle>
        <CardDescription>
          Readings from selected time window - live updates apply only when end
          time is unset
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-105 w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-105 items-center justify-center text-sm text-muted-foreground">
            {emptyStateMessage}
          </div>
        ) : (
          <TimeSeriesChart
            key={chartKey}
            data={chartData}
            unit={unit}
            sensorName={sensorName}
            height={420}
          />
        )}
      </CardContent>
    </Card>
  );
}
