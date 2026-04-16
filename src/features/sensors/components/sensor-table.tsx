"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeleteSensorMutation } from "@/store/api";
import { useConfirm } from "@/hooks/use-confirm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate24 } from "@/lib/date-time";
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
  canManage: boolean;
}

export function SensorTable({
  sensors,
  servers,
  serverFilter,
  onEdit,
  canManage,
}: SensorTableProps) {
  const t = useTranslations("sensors");
  const [deleteSensor] = useDeleteSensorMutation();
  const { confirm, ConfirmDialog } = useConfirm();

  async function handleDelete(id: string, name: string) {
    if (
      !(await confirm({
        description: t("deleteSensor", { name }),
        destructive: true,
      }))
    )
      return;
    try {
      await deleteSensor(id).unwrap();
      toast.success(t("sensorDeleted"));
    } catch {
      toast.error(t("sensorDeleted"));
    }
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("nodeId")}</TableHead>
              <TableHead>{t("units")}</TableHead>
              <TableHead>{t("opcServer")}</TableHead>
              <TableHead>{t("created")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sensors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {serverFilter
                    ? t("noSensorsForServer")
                    : canManage
                      ? t("noSensorsCanManage")
                      : t("noSensors")}
                </TableCell>
              </TableRow>
            ) : (
              sensors.map((s) => {
                const server = servers.find(
                  (srv) => srv.id === s.opc_server_id,
                );

                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{s.name}</span>
                        {s.is_writable ? (
                          <Badge variant="secondary" className="text-xs">
                            {t("writable")}
                          </Badge>
                        ) : null}
                      </div>
                      {s.description && (
                        <div className="text-xs text-muted-foreground">
                          {s.description}
                        </div>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {server?.name ?? s.opc_server_id}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate24(s.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/sensors/${s.id}`}
                        aria-label={t("viewReadings")}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon",
                        })}
                      >
                        <ExternalLink className="size-4" />
                      </Link>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(s)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(s.id, s.name)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
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
