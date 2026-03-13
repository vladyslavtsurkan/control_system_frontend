"use client";

import dynamic from "next/dynamic";
import { memo, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import type { EChartsOption } from "echarts";
import type { SensorReading } from "@/types/models";

// Lazy-load to avoid SSR issues — ECharts accesses window/document at init time
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface TimeSeriesChartProps {
  data: SensorReading[];
  unit?: string;
  sensorName?: string;
  height?: number;
  /** When true renders a minimal sparkline — no axes, no toolbox, no zoom */
  sparkline?: boolean;
}

interface ZoomWindow {
  start: number;
  end: number;
}

function toUnixMs(value: string): number | null {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

// Wrapped in React.memo — only re-renders when data/unit/sensorName change
const TimeSeriesChartInner = memo(function TimeSeriesChartInner({
  data,
  unit = "",
  sensorName = "Sensor",
  height = 380,
  sparkline = false,
}: TimeSeriesChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const palette = useMemo(
    () => ({
      line: isDark ? "#93c5fd" : "#2563eb",
      area: isDark ? "rgba(147, 197, 253, 0.20)" : "rgba(37, 99, 235, 0.12)",
      axis: isDark ? "rgba(229, 231, 235, 0.75)" : "rgba(31, 41, 55, 0.75)",
      split: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(0, 0, 0, 0.12)",
      sliderBg: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
      sliderFill: isDark ? "rgba(147, 197, 253, 0.30)" : "rgba(37, 99, 235, 0.25)",
      tooltipBg: isDark ? "rgba(17, 24, 39, 0.94)" : "rgba(255, 255, 255, 0.96)",
      tooltipBorder: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.12)",
      tooltipText: isDark ? "#f9fafb" : "#111827",
    }),
    [isDark],
  );

  const [zoomWindow, setZoomWindow] = useState<ZoomWindow | null>(null);

  const seriesData = useMemo<[number, number][]>(() => {
    const normalized = data
      .map((d) => {
        const time = toUnixMs(d.time);
        const value = d.value;
        if (time === null || !Number.isFinite(value)) return null;
        return [time, value] as [number, number];
      })
      .filter((point): point is [number, number] => point !== null)
      .sort((a, b) => a[0] - b[0]);

    // Collapse same-timestamp points; keep the newest value for that timestamp.
    const byTimestamp = new Map<number, number>();
    for (const [time, value] of normalized) {
      byTimestamp.set(time, value);
    }

    return Array.from(byTimestamp.entries()).sort((a, b) => a[0] - b[0]);
  }, [data]);

  const defaultZoom = useMemo<ZoomWindow>(() => {
    const start = Math.max(0, 100 - (500 / Math.max(seriesData.length, 1)) * 100);
    return { start, end: 100 };
  }, [seriesData.length]);

  const activeZoom = zoomWindow ?? defaultZoom;

  const chartEvents = useMemo<Record<string, (evt: unknown) => void> | undefined>(() => {
    if (sparkline) return undefined;

    return {
      "datazoom": (evt: unknown) => {
        const payload = evt as { start?: unknown; end?: unknown; batch?: Array<{ start?: unknown; end?: unknown }> };
        const source = Array.isArray(payload.batch) && payload.batch.length > 0
          ? payload.batch[0]
          : payload;

        const start = typeof source.start === "number" ? source.start : null;
        const end = typeof source.end === "number" ? source.end : null;
        if (start === null || end === null) return;
        setZoomWindow({ start, end });
      },
    };
  }, [sparkline]);

  const option = useMemo<EChartsOption>(
    () => {
      if (sparkline) {
        return {
          backgroundColor: "transparent",
          animation: false,
          grid: { left: 0, right: 0, top: 2, bottom: 2 },
          xAxis: { type: "time", show: false },
          yAxis: { type: "value", show: false },
          series: [
            {
              type: "line",
              smooth: true,
              showSymbol: false,
              sampling: "lttb",
              lineStyle: { width: 1.5, color: palette.line },
              areaStyle: { opacity: 1, color: palette.area },
              data: seriesData,
            },
          ],
        };
      }

      return {
        backgroundColor: "transparent",
        animation: false, // disabled for high-frequency live updates
        textStyle: { color: palette.axis },
        grid: { left: 56, right: 24, top: 32, bottom: 56 },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross", snap: true },
          backgroundColor: palette.tooltipBg,
          borderColor: palette.tooltipBorder,
          borderWidth: 1,
          textStyle: { color: palette.tooltipText },
          formatter: (params: unknown) => {
            const p = (params as { value: [string, number] }[])[0];
            if (!p) return "";
            const time = new Date(p.value[0]).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            return `<b>${time}</b><br/>${sensorName}: <b>${p.value[1].toFixed(3)} ${unit}</b>`;
          },
        },
        toolbox: {
          iconStyle: { borderColor: palette.axis },
          feature: {
            dataZoom: { yAxisIndex: "none" },
            restore: {},
            saveAsImage: {},
          },
        },
        dataZoom: [
          {
            type: "inside",
            start: activeZoom.start,
            end: activeZoom.end,
          },
          {
            type: "slider",
            bottom: 8,
            height: 20,
            start: activeZoom.start,
            end: activeZoom.end,
            borderColor: "transparent",
            backgroundColor: palette.sliderBg,
            fillerColor: palette.sliderFill,
          },
        ],
        xAxis: {
          type: "time",
          axisLine: { lineStyle: { color: palette.axis } },
          splitLine: { show: false },
          axisLabel: {
            color: palette.axis,
            formatter: (val: number) =>
              new Date(val).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
          },
        },
        yAxis: {
          type: "value",
          name: unit,
          nameLocation: "end",
          nameTextStyle: { color: palette.axis },
          axisLine: { show: true, lineStyle: { color: palette.axis } },
          axisLabel: { color: palette.axis },
          splitLine: { lineStyle: { type: "dashed", color: palette.split } },
        },
        series: [
          {
            name: sensorName,
            type: "line",
            smooth: false,
            showSymbol: false,
            sampling: "lttb", // Largest-Triangle-Three-Buckets — downsamples for perf
            lineStyle: { width: 1.7, color: palette.line },
            areaStyle: { opacity: 1, color: palette.area },
            emphasis: { focus: "series" },
            data: seriesData,
          },
        ],
      };
    },
    [activeZoom.end, activeZoom.start, palette, sensorName, seriesData, sparkline, unit],
  );

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      notMerge={false}  // merge — enables incremental dataset updates
      lazyUpdate={true} // batch DOM repaints — critical for high-frequency IIoT data
      theme={isDark ? "dark" : undefined}
      onEvents={chartEvents}
    />
  );
});

TimeSeriesChartInner.displayName = "TimeSeriesChart";

export { TimeSeriesChartInner as TimeSeriesChart };
