"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Activity, Hash, Clock, Pencil, Trash2 } from "lucide-react";
import {
  useGetSensorsQuery,
  useGetReadingsQuery,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
} from "@/store/api-slice";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import type { SensorReading } from "@/types/models";

interface SensorPageProps {
  params: Promise<{ id: string }>;
}

interface EditFormState {
  name: string;
  description: string;
  node_id: string;
  units: string;
}

export default function SensorPage({ params }: SensorPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: readingsPage, isLoading: readingsLoading } =
    useGetReadingsQuery({ sensor_id: id, limit: 1000 });

  const { data: sensorsData } = useGetSensorsQuery();
  const sensor = sensorsData?.items.find((s) => s.id === id);

  const [updateSensor, { isLoading: updating }] = useUpdateSensorMutation();
  const [deleteSensor] = useDeleteSensorMutation();
  const { confirm, ConfirmDialog } = useConfirm();

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditFormState>({
    name: "",
    description: "",
    node_id: "",
    units: "",
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
    const latest = chartData[chartData.length - 1];
    return { min, max, avg, latest, count: chartData.length };
  }, [chartData]);

  const unit = sensor?.units ?? "";

  return (
    <div className="space-y-6">
      {/* Header */}
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
              {sensor?.node_id ?? "—"}
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
        {/* Edit / Delete actions */}
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

      {/* Stats row */}
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
                {new Date(stats.latest.time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
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
                <Clock className="size-3" /> last 1 000 loaded
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Main chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time-Series Chart</CardTitle>
          <CardDescription>
            Last 1 000 readings loaded from REST · live updates via WebSocket
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
              data={chartData}
              unit={unit}
              sensorName={sensor?.name}
              height={420}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
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
                  placeholder="°C, bar, rpm…"
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
