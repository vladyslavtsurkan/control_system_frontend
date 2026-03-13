"use client";

import { useState } from "react";
import { PlusCircle, RefreshCw } from "lucide-react";
import { useGetSensorsQuery, useGetServersQuery } from "@/store/api-slice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SensorTable } from "@/features/sensors/components/sensor-table";
import { SensorFormDialog } from "@/features/sensors/components/sensor-form-dialog";
import type { Sensor } from "@/types/models";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SensorsPage() {
  const [serverFilter, setServerFilter] = useState<string>("");

  const { data, isLoading, refetch } = useGetSensorsQuery(serverFilter || undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: serversData } = useGetServersQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Sensor | null>(null);

  const sensors = data?.items ?? [];
  const servers = serversData?.items ?? [];

  function openCreate() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(sensor: Sensor) {
    setEditTarget(sensor);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sensors</h1>
          <p className="text-sm text-muted-foreground">
            Manage OPC UA sensor nodes and their metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={serverFilter}
            onValueChange={(v) => setServerFilter(v ?? "")}
          >
            <SelectTrigger className="w-48">
              <SelectValue>
                {serverFilter
                  ? (servers.find((srv) => srv.id === serverFilter)?.name ?? "All servers")
                  : "All servers"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All servers</SelectItem>
              {servers.map((srv) => (
                <SelectItem key={srv.id} value={srv.id}>
                  {srv.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 size-4" />
            Add Sensor
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <SensorTable
          sensors={sensors}
          servers={servers}
          serverFilter={serverFilter}
          onEdit={openEdit}
        />
      )}

      {/* Create / Edit Dialog */}
      <SensorFormDialog
        key={editTarget?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTarget={editTarget}
        servers={servers}
        defaultServerId={serverFilter}
      />
    </div>
  );
}
