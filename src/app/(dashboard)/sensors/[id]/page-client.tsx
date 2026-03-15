"use client";

import { useCallback, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Activity, Hash, Clock, Pencil, Trash2, BellRing, CheckCircle2 } from "lucide-react";
import {
  useGetSensorQuery,
  useGetReadingsQuery,
  useGetAlertsQuery,
  useAcknowledgeAlertMutation,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
} from "@/store/api-slice";
import { useAppSelector } from "@/store/hooks";
import { selectLiveAlerts } from "@/store/selectors";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ListPageSizeSelect,
  ListPaginationFooter,
  ListResultsSummary,
} from "@/components/ui/list-pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { getOffsetLimitPaginationMeta, useOffsetLimitPagination } from "@/hooks/use-offset-limit-pagination";
import { LIST_PAGE_SIZE_FALLBACK, LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";
import { formatTime24 } from "@/lib/date-time";
import type { SensorReading, LiveAlert, AlertSeverity } from "@/types/models";

interface SensorPageClientProps {
  id: string;
  initialRange?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialSampleEvery: number;
  initialAlertsPage: number;
  initialAlertsPerPage: number;
}

interface EditFormState {
  name: string;
  description: string;
  node_id: string;
  units: string;
}

function toDateTimeLocalValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

const RANGE_PRESETS = [
  { key: "15m", label: "Last 15m", ms: 15 * 60 * 1000 },
  { key: "1h", label: "Last 1h", ms: 60 * 60 * 1000 },
  { key: "3h", label: "Last 3h", ms: 3 * 60 * 60 * 1000 },
  { key: "6h", label: "Last 6h", ms: 6 * 60 * 60 * 1000 },
  { key: "24h", label: "Last 24h", ms: 24 * 60 * 60 * 1000 },
] as const;

const MAX_READINGS_WINDOW_HOURS = 25;
const MAX_READINGS_WINDOW_MS = MAX_READINGS_WINDOW_HOURS * 60 * 60 * 1000;

type RangePresetKey = (typeof RANGE_PRESETS)[number]["key"] | "custom";

type AlertRow = {
  key: string;
  source: "rest" | "live";
  restAlertId?: string;
  ruleId: string | null;
  message: string;
  severity?: AlertSeverity;
  status: "active" | "resolved";
  // null means the row is websocket-only and ack state is unknown until REST sync.
  isAcknowledged: boolean | null;
  triggeredAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

const severityVariant: Record<AlertSeverity, "default" | "secondary" | "destructive" | "outline"> = {
  info: "secondary",
  warning: "default",
  critical: "destructive",
  fatal: "destructive",
};

export default function SensorPageClient({
  id,
  initialRange,
  initialStartTime,
  initialEndTime,
  initialSampleEvery,
  initialAlertsPage,
  initialAlertsPerPage,
}: SensorPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultStartTimeLocal = useMemo(
    () => toDateTimeLocalValue(new Date(Date.now() - 3 * 60 * 60 * 1000)),
    [],
  );
  const activePresetParam = searchParams.get("range") ?? initialRange ?? undefined;
  const activePreset = useMemo<RangePresetKey>(() => {
    if (activePresetParam === "custom") return "custom";
    if (RANGE_PRESETS.some((preset) => preset.key === activePresetParam)) {
      return activePresetParam as RangePresetKey;
    }
    return "3h";
  }, [activePresetParam]);
  const startTimeLocal = searchParams.get("start_time") ?? initialStartTime ?? defaultStartTimeLocal;
  const endTimeLocal = searchParams.get("end_time") ?? initialEndTime ?? "";
  const sampleEveryInput = searchParams.get("sample_every") ?? String(initialSampleEvery);

  const replaceQuery = useCallback((mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  function applyPreset(ms: number, key: Exclude<RangePresetKey, "custom">) {
    const now = new Date();
    const start = new Date(now.getTime() - ms);
    replaceQuery((params) => {
      params.set("start_time", toDateTimeLocalValue(start));
      params.delete("end_time");
      params.set("range", key);
      params.set("alerts_page", "1");
      params.set("alerts_per_page", String(alertsPagination.perPage));
    });
  }

  function useNowAsEndTime() {
    replaceQuery((params) => {
      params.set("end_time", toDateTimeLocalValue(new Date()));
      params.set("range", "custom");
      params.set("alerts_page", "1");
      params.set("alerts_per_page", String(alertsPagination.perPage));
    });
  }

  function setLiveMode() {
    replaceQuery((params) => {
      params.delete("end_time");
      params.set("alerts_page", "1");
      params.set("alerts_per_page", String(alertsPagination.perPage));
    });
  }

  function clearRange() {
    replaceQuery((params) => {
      params.delete("start_time");
      params.delete("end_time");
      params.set("range", "custom");
      params.set("alerts_page", "1");
      params.set("alerts_per_page", String(alertsPagination.perPage));
    });
  }

  const alertsPagination = useOffsetLimitPagination({
    initialLimit: initialAlertsPerPage,
    initialPage: initialAlertsPage,
    pageParam: "alerts_page",
    perPageParam: "alerts_per_page",
  });

  function resetAlertsPaginationParams(params: URLSearchParams) {
    params.set("alerts_page", "1");
    params.set("alerts_per_page", String(alertsPagination.perPage));
  }

  const parsedSampleEvery = Number(sampleEveryInput);
  const sampleEvery = Number.isInteger(parsedSampleEvery) ? parsedSampleEvery : NaN;

  const startTimeIso = useMemo(() => {
    if (!startTimeLocal) return undefined;
    const ms = Date.parse(startTimeLocal);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms).toISOString();
  }, [startTimeLocal]);

  const endTimeIso = useMemo(() => {
    if (!endTimeLocal) return undefined;
    const ms = Date.parse(endTimeLocal);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms).toISOString();
  }, [endTimeLocal]);

  const rangeError = useMemo(() => {
    if (!Number.isInteger(sampleEvery) || sampleEvery < 1) {
      return "Sampling must be an integer greater than or equal to 1.";
    }
    if (startTimeIso === null || endTimeIso === null) {
      return "Please enter valid start and end datetimes.";
    }
    if (startTimeIso && endTimeIso && Date.parse(startTimeIso) > Date.parse(endTimeIso)) {
      return "Start time must be before or equal to end time.";
    }

    if (startTimeIso) {
      const startMs = Date.parse(startTimeIso);
      const effectiveEndMs = Date.parse(endTimeIso ?? new Date().toISOString());
      if (Number.isFinite(startMs) && Number.isFinite(effectiveEndMs)) {
        if (effectiveEndMs - startMs > MAX_READINGS_WINDOW_MS) {
          return `The maximum readings window is ${MAX_READINGS_WINDOW_HOURS} hours.`;
        }
      }
    }

    return null;
  }, [sampleEvery, startTimeIso, endTimeIso]);

  const readingsArgs =
    rangeError || startTimeIso === null || endTimeIso === null
      ? skipToken
      : {
          sensorId: id,
          startTime: startTimeIso,
          endTime: endTimeIso,
          sampleEvery,
        };

  const { data: readingsPage, isLoading: readingsLoading } =
    useGetReadingsQuery(readingsArgs);

  const {
    data: alertsPage,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useGetAlertsQuery(
    {
      sensor_id: id,
      ...alertsPagination.queryArgs,
    },
    { refetchOnMountOrArgChange: true },
  );

  const { data: sensor } = useGetSensorQuery(id);
  const liveAlerts = useAppSelector(selectLiveAlerts);

  const [updateSensor, { isLoading: updating }] = useUpdateSensorMutation();
  const [deleteSensor] = useDeleteSensorMutation();
  const [acknowledgeAlert, { isLoading: acknowledging }] = useAcknowledgeAlertMutation();
  const { confirm, ConfirmDialog } = useConfirm();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditFormState>({
    name: "",
    description: "",
    node_id: "",
    units: "",
  });
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const {
    totalCount: totalAlerts,
    totalPages: alertTotalPages,
    currentPage: alertCurrentPage,
    canGoPrev: canGoPrevAlerts,
    canGoNext: canGoNextAlerts,
  } = getOffsetLimitPaginationMeta({
    count: alertsPage?.count,
    perPage: alertsPage?.per_page,
    totalPages: alertsPage?.total_pages,
    page: alertsPage?.page,
    offset: alertsPagination.offset,
    requestedLimit: alertsPagination.limit,
    fallbackLimit: LIST_PAGE_SIZE_FALLBACK,
  });

  function openEdit() {
    if (!sensor) return;
    setForm({
      name: sensor.name,
      description: sensor.description ?? "",
      node_id: sensor.node_id,
      units: sensor.units ?? "",
    });
    setEditOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateSensor({
        id,
        name: form.name || undefined,
        description: form.description || null,
        node_id: form.node_id || undefined,
        units: form.units || null,
      }).unwrap();
      toast.success("Sensor updated.");
      setEditOpen(false);
    } catch {
      toast.error("Update failed. Please try again.");
    }
  }

  async function handleDelete() {
    if (!await confirm({
      description: `Delete sensor "${sensor?.name}"? This will also remove its readings and alert rules.`,
      destructive: true,
    })) return;
    try {
      await deleteSensor(id).unwrap();
      toast.success("Sensor deleted.");
      router.push("/sensors");
    } catch {
      toast.error("Delete failed.");
    }
  }

  const chartData = useMemo<SensorReading[]>(() => {
    if (!readingsPage) return [];
    return readingsPage.items.map((r) => ({
      sensor_id: r.sensor_id,
      time: r.time,
      value:
        typeof r.payload.value === "number"
          ? r.payload.value
          : Number(r.payload.value ?? 0),
    }));
  }, [readingsPage]);

  const stats = useMemo(() => {
    if (!chartData.length) return null;
    const values = chartData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = chartData.reduce((mostRecent, current) =>
      Date.parse(current.time) > Date.parse(mostRecent.time) ? current : mostRecent,
    chartData[0]);
    return { min, max, avg, latest, count: chartData.length };
  }, [chartData]);

  const liveAlertsForSensor = useMemo(
    () => liveAlerts.filter((alert) => alert.sensor_id === id),
    [liveAlerts, id],
  );

  const latestLiveByRuleId = useMemo(() => {
    const map = new Map<string, LiveAlert>();
    for (const alert of liveAlertsForSensor) {
      const existing = map.get(alert.rule_id);
      if (!existing || Date.parse(alert.updated_at) > Date.parse(existing.updated_at)) {
        map.set(alert.rule_id, alert);
      }
    }
    return map;
  }, [liveAlertsForSensor]);

  const alertRows = useMemo<AlertRow[]>(() => {
    const restItems = alertsPage?.items ?? [];

    const restRows: AlertRow[] = restItems.map((alert) => {
      const normalizedRuleId = alert.rule_id ?? alert.rule?.id ?? null;
      const liveMatch = !alert.resolved_at && normalizedRuleId
        ? latestLiveByRuleId.get(normalizedRuleId)
        : undefined;

      const status: "active" | "resolved" =
        liveMatch?.status ?? (alert.resolved_at ? "resolved" : "active");

      return {
        key: `rest-${alert.id}`,
        source: "rest",
        restAlertId: alert.id,
        ruleId: normalizedRuleId,
        message: liveMatch?.message ?? alert.message,
        severity: liveMatch?.severity ?? alert.rule?.severity,
        status,
        isAcknowledged: alert.is_acknowledged,
        triggeredAt: alert.created_at,
        updatedAt: liveMatch?.updated_at ?? alert.updated_at ?? alert.created_at,
        resolvedAt:
          liveMatch?.status === "resolved"
            ? (liveMatch.resolved_at ?? alert.resolved_at)
            : alert.resolved_at,
      };
    });

    const restActiveRuleIds = new Set(
      restRows
        .filter((row) => row.status === "active" && row.ruleId)
        .map((row) => row.ruleId as string),
    );

    const liveOnlyRows: AlertRow[] = liveAlertsForSensor
      .filter((alert) => alert.status === "active" && !restActiveRuleIds.has(alert.rule_id))
      .map((alert) => ({
        key: `live-${alert.key}`,
        source: "live",
        ruleId: alert.rule_id,
        message: alert.message,
        severity: alert.severity,
        status: alert.status,
        isAcknowledged: null,
        triggeredAt: alert.triggered_at,
        updatedAt: alert.updated_at,
        resolvedAt: alert.resolved_at,
      }));

    return [...restRows, ...liveOnlyRows].sort((a, b) => {
      if (a.status !== b.status) return a.status === "active" ? -1 : 1;
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
  }, [alertsPage, latestLiveByRuleId, liveAlertsForSensor]);

  async function handleAcknowledge(alertId: string) {
    try {
      setAcknowledgingId(alertId);
      await acknowledgeAlert(alertId).unwrap();
      toast.success("Alert acknowledged.");
      refetchAlerts();
    } catch {
      toast.error("Failed to acknowledge alert.");
    } finally {
      setAcknowledgingId(null);
    }
  }

  const unit = sensor?.units ?? "";
  const chartKey = `${id}-${startTimeIso ?? "default-start"}-${endTimeIso ?? "default-end"}-${sampleEvery}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/sensors"
          className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            {sensor?.name ?? "Sensor"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Node ID:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
              {sensor?.node_id ?? "-"}
            </code>
            {sensor?.units && (
              <>
                {" · "}
                <Badge variant="secondary" className="text-xs">
                  {sensor.units}
                </Badge>
              </>
            )}
            {sensor?.description && (
              <span className="ml-2">{sensor.description}</span>
            )}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="outline" size="icon" onClick={openEdit} disabled={!sensor}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-red-600 hover:text-red-700 hover:border-red-300"
            onClick={handleDelete}
            disabled={!sensor}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Readings Filters</CardTitle>
          <CardDescription>
            Use presets for speed or pick custom local dates. Leave end time empty for live mode. Maximum window is 36 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={activePreset}
              onValueChange={(value) => {
                if (value === "custom") {
                  replaceQuery((params) => {
                    params.set("range", "custom");
                    resetAlertsPaginationParams(params);
                  });
                  return;
                }
                const preset = RANGE_PRESETS.find((p) => p.key === value);
                if (!preset) return;
                applyPreset(preset.ms, preset.key);
              }}
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_PRESETS.map((preset) => (
                  <SelectItem key={preset.key} value={preset.key}>
                    {preset.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant={endTimeLocal === "" ? "default" : "outline"}
              className="h-8 px-3 text-xs"
              onClick={setLiveMode}
            >
              Live
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={useNowAsEndTime}
            >
              End = now
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={clearRange}
            >
              Clear
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start time (optional)</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTimeLocal}
                onChange={(e) => {
                    replaceQuery((params) => {
                      if (e.target.value) {
                        params.set("start_time", e.target.value);
                      } else {
                        params.delete("start_time");
                      }
                      params.set("range", "custom");
                      resetAlertsPaginationParams(params);
                    });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End time (optional)</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTimeLocal}
                onChange={(e) => {
                    replaceQuery((params) => {
                      if (e.target.value) {
                        params.set("end_time", e.target.value);
                      } else {
                        params.delete("end_time");
                      }
                      params.set("range", "custom");
                      resetAlertsPaginationParams(params);
                    });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sample-every">Sample every N readings</Label>
              <Input
                id="sample-every"
                type="number"
                min={1}
                step={1}
                value={sampleEveryInput}
                  onChange={(e) => {
                    replaceQuery((params) => {
                      if (e.target.value) {
                        params.set("sample_every", e.target.value);
                      } else {
                        params.delete("sample_every");
                      }
                      resetAlertsPaginationParams(params);
                    });
                  }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Display/edit uses local time; requests are sent as UTC ISO.
          </p>

          {rangeError ? (
            <p className="text-sm text-red-600">{rangeError}</p>
          ) : null}
        </CardContent>
      </Card>

      {readingsLoading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-22 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="size-3" /> Latest
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold tabular-nums">
                {stats.latest.value.toFixed(3)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {unit}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTime24(stats.latest.time, { withSeconds: true })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground">
                Average
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold tabular-nums">
                {stats.avg.toFixed(3)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {unit}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                over {stats.count} readings
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground">
                Min / Max
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold tabular-nums">
                {stats.min.toFixed(2)}
                <span className="mx-1 text-muted-foreground font-normal text-base">
                  /
                </span>
                {stats.max.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <Hash className="size-3" /> Readings
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold tabular-nums">{stats.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="size-3" /> windowed by selected filters
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time-Series Chart</CardTitle>
          <CardDescription>
            Readings from selected time window · live updates apply only when end time is unset
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readingsLoading ? (
            <Skeleton className="h-105 w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-105 items-center justify-center text-sm text-muted-foreground">
              No readings found for this sensor yet.
            </div>
          ) : (
            <TimeSeriesChart
              key={chartKey}
              data={chartData}
              unit={unit}
              sensorName={sensor?.name}
              height={420}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BellRing className="size-4" />
              Sensor Alerts
            </CardTitle>
            <CardDescription>
              Loaded from REST on page entry and enriched with live WebSocket updates.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => refetchAlerts()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <ListResultsSummary shownCount={alertRows.length} totalCount={totalAlerts} noun="alerts" />
            <ListPageSizeSelect
              id="sensor-alerts-page-size"
              value={alertsPagination.perPage}
              options={LIST_PAGE_SIZE_OPTIONS}
              onChange={alertsPagination.setLimitAndReset}
            />
          </div>

          {alertsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : alertRows.length === 0 ? (
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
                {alertRows.map((row) => {
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
                        {formatTime24(row.updatedAt, {withSeconds: true})}
                      </TableCell>
                      <TableCell className="text-right">
                        {canAcknowledge ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={acknowledging && acknowledgingId === row.restAlertId}
                            onClick={() => handleAcknowledge(row.restAlertId!)}
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
            currentPage={alertCurrentPage}
            totalPages={alertTotalPages}
            canGoPrev={canGoPrevAlerts}
            canGoNext={canGoNextAlerts}
            onPrev={alertsPagination.goPrev}
            onNext={alertsPagination.goNext}
          />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Sensor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sensor-name">Name</Label>
              <Input
                id="edit-sensor-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Temperature Sensor A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sensor-node-id">Node ID</Label>
              <Input
                id="edit-sensor-node-id"
                required
                value={form.node_id}
                onChange={(e) => setForm((f) => ({ ...f, node_id: e.target.value }))}
                placeholder="ns=2;i=1001"
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-sensor-desc">Description</Label>
                <Input
                  id="edit-sensor-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sensor-units">Units</Label>
                <Input
                  id="edit-sensor-units"
                  value={form.units}
                  onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                  placeholder="degC, bar, rpm"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={updating}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}

