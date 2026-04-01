"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EditSensorFormState } from "@/features/sensors/components/sensor-detail-types";

interface SensorEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: EditSensorFormState;
  updating: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (next: EditSensorFormState) => void;
}

export function SensorEditDialog({
  open,
  onOpenChange,
  form,
  updating,
  onSubmit,
  onFormChange,
}: SensorEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Sensor</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-sensor-name">Name</Label>
            <Input
              id="edit-sensor-name"
              required
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="Temperature Sensor A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-sensor-node-id">Node ID</Label>
            <Input
              id="edit-sensor-node-id"
              required
              value={form.node_id}
              onChange={(e) =>
                onFormChange({ ...form, node_id: e.target.value })
              }
              placeholder="ns=2;i=1001"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>Data Type</Label>
            <Select
              value={form.data_type}
              onValueChange={(value) =>
                onFormChange({
                  ...form,
                  data_type: value as EditSensorFormState["data_type"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numeric">Numeric</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="string">String</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-sensor-desc">Description</Label>
              <Input
                id="edit-sensor-desc"
                value={form.description}
                onChange={(e) =>
                  onFormChange({ ...form, description: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sensor-units">Units</Label>
              <Input
                id="edit-sensor-units"
                value={form.units}
                onChange={(e) =>
                  onFormChange({ ...form, units: e.target.value })
                }
                placeholder="degC, bar, rpm"
              />
            </div>
          </div>
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="edit-sensor-is-writable">Writable Node</Label>
              <p className="text-sm text-muted-foreground">
                Allow control commands to be sent to this sensor
              </p>
            </div>
            <Switch
              id="edit-sensor-is-writable"
              checked={form.is_writable}
              onCheckedChange={(checked) =>
                onFormChange({ ...form, is_writable: checked })
              }
            />
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
  );
}
