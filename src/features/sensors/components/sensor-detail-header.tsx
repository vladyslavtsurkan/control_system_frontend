"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Sensor } from "@/features/sensors/types";

interface SensorDetailHeaderProps {
  sensor?: Sensor;
  canControl?: boolean;
  canManage?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onControl: () => void;
}

export function SensorDetailHeader({
  sensor,
  canControl = false,
  canManage = false,
  onEdit,
  onDelete,
  onControl,
}: SensorDetailHeaderProps) {
  const t = useTranslations("sensors");
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
          {t("nodeIdLabel")}{" "}
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
        {/* Write Value button — only for writable sensors and privileged roles */}
        {sensor?.is_writable && canControl && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onControl}
                  disabled={!sensor}
                />
              }
            >
              <Send className="size-4" />
            </TooltipTrigger>
            <TooltipContent>{t("detail.writeValueTooltip")}</TooltipContent>
          </Tooltip>
        )}
        {canManage && (
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            disabled={!sensor}
          >
            <Pencil className="size-4" />
          </Button>
        )}
        {canManage && (
          <Button
            variant="outline"
            size="icon"
            className="text-red-600 hover:border-red-300 hover:text-red-700"
            onClick={onDelete}
            disabled={!sensor}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
