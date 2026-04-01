"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { useDeleteSensorMutation } from "@/store/api";
import { useConfirm } from "@/hooks/use-confirm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate24, formatTime24 } from "@/lib/date-time";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Sensor } from "@/features/sensors/types";
import type { OpcServer } from "@/features/servers";

interface SensorTableProps {
  sensors: Sensor[];
  servers: OpcServer[];
  serverFilter: string;
  onEdit: (sensor: Sensor) => void;
}

export function SensorTable({ sensors, servers, serverFilter, onEdit }: SensorTableProps) {
  const [deleteSensor] = useDeleteSensorMutation();
  const { confirm, ConfirmDialog } = useConfirm();

  async function handleDelete(id: string, name: string) {
    if (!await confirm({
      description: `Delete sensor "${name}"? This will also remove its readings and alert rules.`,
      destructive: true,
    })) return;
    try {
      await deleteSensor(id).unwrap();
      toast.success("Sensor deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  }

  return (
    <>
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Node ID</TableHead>
            <TableHead>Units</TableHead>
            <TableHead>Recent readings</TableHead>
            <TableHead>OPC Server</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sensors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                {serverFilter
                  ? "No sensors found for the selected server."
                  : "No sensors found. Click \"Add Sensor\" to get started."}
              </TableCell>
            </TableRow>
          ) : (
            sensors.map((s) => {
              const server = servers.find((srv) => srv.id === s.opc_server_id);
              const prefetchedTimes = s.readings?.times ?? [];
              const prefetchedValues = s.readings?.values ?? [];
              const prefetchedLen = Math.min(prefetchedTimes.length, prefetchedValues.length);
              const recentPrefetchedReadings = Array.from({ length: prefetchedLen }, (_, index) => ({
                time: prefetchedTimes[index],
                value: prefetchedValues[index],
              }));

              if (s.readings && prefetchedTimes.length !== prefetchedValues.length) {
                console.warn("[Sensors] Prefetched readings are misaligned; truncating in table.", {
                  sensorId: s.id,
                  timesLength: prefetchedTimes.length,
                  valuesLength: prefetchedValues.length,
                  truncatedTo: prefetchedLen,
                });
              }

              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{s.name}</span>
                      {s.is_writable ? (
                        <Badge variant="secondary" className="text-xs">
                          Writable
                        </Badge>
                      ) : null}
                    </div>
                    {s.description && (
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                      {s.node_id}
                    </code>
                  </TableCell>
                  <TableCell>
                    {s.units ? (
                      <Badge variant="secondary">{s.units}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {recentPrefetchedReadings.length === 0 ? (
                      <span>No recent readings</span>
                    ) : (
                      <div className="space-y-1">
                        {recentPrefetchedReadings.slice(0, 3).map((reading) => (
                          <div key={`${s.id}-${reading.time}`} className="truncate">
                            {formatTime24(reading.time, { withSeconds: true })}
                            {" - "}
                            {reading.value.toFixed(3)}
                          </div>
                        ))}
                        {recentPrefetchedReadings.length > 3 ? <div>...</div> : null}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {server?.name ?? s.opc_server_id}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate24(s.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/sensors/${s.id}`}
                      aria-label="View readings"
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(s)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(s.id, s.name)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
    <ConfirmDialog />
    </>
  );
}
