"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("sensors");
  const emptyStateMessage =
    sensorDataType && sensorDataType !== "numeric"
      ? t("detail.noNumericData")
      : t("detail.noReadings");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("detail.chartTitle")}</CardTitle>
        <CardDescription>{t("detail.chartDescription")}</CardDescription>
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
