"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Sensor } from "@/features/sensors/types";

interface SensorControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sensor: Sensor;
  value: string | boolean;
  sending: boolean;
  onValueChange: (v: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const DATA_TYPE_LABELS: Record<string, string> = {
  numeric: "Numeric",
  boolean: "Boolean",
  string: "String",
};

export function SensorControlDialog({
  open,
  onOpenChange,
  sensor,
  value,
  sending,
  onValueChange,
  onSubmit,
}: SensorControlDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Write Value to Sensor</DialogTitle>
          <DialogDescription>
            This command will be dispatched to the OPC UA node immediately.
          </DialogDescription>
        </DialogHeader>

        {/* Sensor info */}
        <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-1 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate">{sensor.name}</span>
            <Badge variant="secondary" className="shrink-0">
              {DATA_TYPE_LABELS[sensor.data_type] ?? sensor.data_type}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-xs">
            {sensor.node_id}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            {sensor.data_type === "boolean" ? (
              /* Boolean — toggle */
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="control-value-bool">Value</Label>
                  <p className="text-sm text-muted-foreground">
                    {(value as boolean) ? "true" : "false"}
                  </p>
                </div>
                <Switch
                  id="control-value-bool"
                  checked={value as boolean}
                  onCheckedChange={(checked) => onValueChange(checked)}
                />
              </div>
            ) : sensor.data_type === "numeric" ? (
              /* Numeric — number input */
              <div className="space-y-2">
                <Label htmlFor="control-value-num">
                  Value{sensor.units ? ` (${sensor.units})` : ""}
                </Label>
                <Input
                  id="control-value-num"
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 42.5"
                  value={value as string}
                  onChange={(e) => onValueChange(e.target.value)}
                  className="font-mono"
                />
              </div>
            ) : (
              /* String — text input */
              <div className="space-y-2">
                <Label htmlFor="control-value-str">Value</Label>
                <Input
                  id="control-value-str"
                  type="text"
                  required
                  placeholder='e.g. "AUTO"'
                  value={value as string}
                  onChange={(e) => onValueChange(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send Command"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
