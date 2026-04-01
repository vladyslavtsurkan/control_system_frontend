"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Sensor } from "@/features/sensors/types";

interface SensorDetailHeaderProps {
  sensor?: Sensor;
  onEdit: () => void;
  onDelete: () => void;
}

export function SensorDetailHeader({
  sensor,
  onEdit,
  onDelete,
}: SensorDetailHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/sensors"
        className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <ArrowLeft className="size-4" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-semibold tracking-tight">
          {sensor?.name ?? "Sensor"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Node ID:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
            {sensor?.node_id ?? "-"}
          </code>
          {sensor?.units && (
            <>
              {" - "}
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
      <div className="shrink-0 flex gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onEdit}
          disabled={!sensor}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="text-red-600 hover:border-red-300 hover:text-red-700"
          onClick={onDelete}
          disabled={!sensor}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
