"use client";

import dynamic from "next/dynamic";
import { memo, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import type { EChartsOption } from "echarts";
import { formatTime24 } from "@/lib/date-time";
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

type ChartPoint = [number, number | null];
type DensePoint = [number, number];

const GAP_MULTIPLIER = 4;
const MIN_GAP_MS = 15 * 60 * 1000;
const DEFAULT_ZOOM_WINDOW_MS = 3 * 60 * 60 * 1000;

// Keep mini-charts readable even when values are nearly flat.
function getPaddedBounds(points: DensePoint[], paddingRatio = 0.08): { min: number; max: number } | null {
  if (points.length === 0) return null;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const [, value] of points) {
    if (value < min) min = value;
    if (value > max) max = value;
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;

  if (min === max) {
    const base = Math.abs(min);
    const pad = Math.max(base * 0.04, 0.1);
    return { min: min - pad, max: max + pad };
  }

  const span = max - min;
  const pad = span * paddingRatio;
  return { min: min - pad, max: max + pad };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function insertGapBreaks(points: [number, number][]): ChartPoint[] {
  if (points.length < 2) return points;

  const deltas: number[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const delta = points[i][0] - points[i - 1][0];
    if (delta > 0) deltas.push(delta);
  }

  const medianDelta = median(deltas);
  const gapThreshold = Math.max(medianDelta * GAP_MULTIPLIER, MIN_GAP_MS);

  if (!Number.isFinite(gapThreshold) || gapThreshold <= 0) return points;

  const withGaps: ChartPoint[] = [points[0]];

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const delta = current[0] - prev[0];

    if (delta > gapThreshold) {
      const rawMidpoint = prev[0] + Math.floor(delta / 2);
      const midpoint = Math.min(current[0] - 1, Math.max(prev[0] + 1, rawMidpoint));
      withGaps.push([midpoint, null]);
    }

    withGaps.push(current);
  }

  return withGaps;
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

  const dedupedData = useMemo<DensePoint[]>(() => {
    const normalized = data
      .map((d) => {
        const time = toUnixMs(d.time);
        const value = d.value;
        if (time === null || !Number.isFinite(value)) return null;
        return [time, value] as DensePoint;
      })
      .filter((point): point is DensePoint => point !== null)
      .sort((a, b) => a[0] - b[0]);

    // Collapse same-timestamp points; keep the newest value for that timestamp.
    const byTimestamp = new Map<number, number>();
    for (const [time, value] of normalized) {
      byTimestamp.set(time, value);
    }

    return Array.from(byTimestamp.entries()).sort((a, b) => a[0] - b[0]);
  }, [data]);

  const timeSeriesData = useMemo<ChartPoint[]>(() => insertGapBreaks(dedupedData), [dedupedData]);

  const sparklineSeriesData = useMemo<DensePoint[]>(
    // Sparklines should show trend density; use sequential X to avoid huge blank time gaps.
    () => dedupedData.map(([, value], index) => [index, value]),
    [dedupedData],
  );

  const sparklineBounds = useMemo(
    () => getPaddedBounds(dedupedData),
    [dedupedData],
  );

  const fullChartBounds = useMemo(
    () => getPaddedBounds(dedupedData),
    [dedupedData],
  );

  const defaultZoom = useMemo<ZoomWindow>(() => {
    if (dedupedData.length === 0) {
      return { start: 0, end: 100 };
    }

    const first = dedupedData[0][0];
    const last = dedupedData[dedupedData.length - 1][0];
    const span = last - first;
    if (span <= 0) {
      return { start: 0, end: 100 };
    }

    const windowStart = Math.max(first, last - DEFAULT_ZOOM_WINDOW_MS);
    const startPercent = ((windowStart - first) / span) * 100;

    return {
      start: Math.max(0, Math.min(100, startPercent)),
      end: 100,
    };
  }, [dedupedData]);

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
          xAxis: {
            type: "value",
            show: false,
            min: "dataMin",
            max: "dataMax",
          },
          yAxis: {
            type: "value",
            show: false,
            scale: true,
            min: sparklineBounds?.min,
            max: sparklineBounds?.max,
          },
          series: [
            {
              type: "line",
              smooth: true,
              showSymbol: false,
              sampling: "lttb",
              lineStyle: { width: 1.5, color: palette.line },
              areaStyle: { opacity: 1, color: palette.area },
              connectNulls: false,
              data: sparklineSeriesData,
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
          renderMode: "richText",
          axisPointer: { type: "cross", snap: true },
          backgroundColor: palette.tooltipBg,
          borderColor: palette.tooltipBorder,
          borderWidth: 1,
          textStyle: { color: palette.tooltipText },
          formatter: (params: unknown) => {
            const points = Array.isArray(params) ? params : [];
            const point = points.find((entry) => {
              const value = (entry as { value?: unknown }).value;
              return Array.isArray(value)
                && typeof value[1] === "number"
                && Number.isFinite(value[1]);
            }) as { value: [number, number] } | undefined;

            if (!point) return "";
            const time = formatTime24(point.value[0], { withSeconds: true });
            return `${time}\n${sensorName}: ${point.value[1].toFixed(3)} ${unit}`;
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
            formatter: (val: number) => formatTime24(val, {withSeconds: true}),
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
          scale: true,
          min: fullChartBounds?.min,
          max: fullChartBounds?.max,
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
            connectNulls: false,
            data: timeSeriesData,
          },
        ],
      };
    },
    [
      activeZoom.end,
      activeZoom.start,
      palette,
      sensorName,
      sparkline,
      sparklineBounds?.max,
      sparklineBounds?.min,
      sparklineSeriesData,
      timeSeriesData,
      unit,
      fullChartBounds?.max,
      fullChartBounds?.min,
    ],
  );

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      notMerge={false}  // merge — more stable under frequent websocket updates
      lazyUpdate={true} // batch DOM repaints — critical for high-frequency IIoT data
      theme={isDark ? "dark" : undefined}
      onEvents={chartEvents}
    />
  );
});

TimeSeriesChartInner.displayName = "TimeSeriesChart";

export { TimeSeriesChartInner as TimeSeriesChart };
