"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateSensorMutation, useUpdateSensorMutation } from "@/store/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Sensor,
  SensorDataType,
  SensorCreateRequest,
} from "@/features/sensors/types";
import type { OpcServer } from "@/features/servers";

// ─── Form state ───────────────────────────────────────────────────────────────

interface SensorFormState {
  name: string;
  description: string;
  node_id: string;
  data_type: SensorDataType;
  units: string;
  is_writable: boolean;
  opc_server_id: string;
}

const emptyForm: SensorFormState = {
  name: "",
  description: "",
  node_id: "",
  data_type: "numeric",
  units: "",
  is_writable: false,
  opc_server_id: "",
};

interface SensorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: Sensor | null;
  servers: OpcServer[];
  defaultServerId?: string;
}

export function SensorFormDialog({
  open,
  onOpenChange,
  editTarget,
  servers,
  defaultServerId = "",
}: SensorFormDialogProps) {
  const [createSensor, { isLoading: creating }] = useCreateSensorMutation();
  const [updateSensor, { isLoading: updating }] = useUpdateSensorMutation();
  const [form, setForm] = useState<SensorFormState>(() =>
    editTarget
      ? {
          name: editTarget.name,
          description: editTarget.description ?? "",
          node_id: editTarget.node_id,
          data_type: editTarget.data_type,
          units: editTarget.units ?? "",
          is_writable: editTarget.is_writable,
          opc_server_id: editTarget.opc_server_id,
        }
      : { ...emptyForm, opc_server_id: defaultServerId },
  );

  const selectedServerName =
    servers.find((srv) => srv.id === form.opc_server_id)?.name ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editTarget) {
        await updateSensor({
          id: editTarget.id,
          name: form.name || undefined,
          description: form.description || null,
          node_id: form.node_id || undefined,
          data_type: form.data_type,
          units: form.units || null,
          is_writable: form.is_writable,
        }).unwrap();
        toast.success("Sensor updated.");
      } else {
        const payload: SensorCreateRequest = {
          opc_server_id: form.opc_server_id,
          name: form.name,
          description: form.description || null,
          node_id: form.node_id,
          data_type: form.data_type,
          units: form.units || null,
          is_writable: form.is_writable,
        };
        await createSensor(payload).unwrap();
        toast.success("Sensor created.");
      }
      onOpenChange(false);
    } catch {
      toast.error("Operation failed. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editTarget ? "Edit Sensor" : "Add Sensor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editTarget && (
            <div className="space-y-2">
              <Label>OPC UA Server</Label>
              <Select
                value={form.opc_server_id}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, opc_server_id: v ?? "" }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select OPC UA server…">
                    {selectedServerName || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {servers.map((srv) => (
                    <SelectItem key={srv.id} value={srv.id}>
                      {srv.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sensor-name">Name</Label>
            <Input
              id="sensor-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Temperature Sensor A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensor-node-id">Node ID</Label>
            <Input
              id="sensor-node-id"
              required
              value={form.node_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, node_id: e.target.value }))
              }
              placeholder="ns=2;i=1001"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Data Type</Label>
            <Select
              value={form.data_type}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, data_type: v as SensorDataType }))
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
              <Label htmlFor="sensor-desc">Description</Label>
              <Input
                id="sensor-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sensor-units">Units</Label>
              <Input
                id="sensor-units"
                value={form.units}
                onChange={(e) =>
                  setForm((f) => ({ ...f, units: e.target.value }))
                }
                placeholder="°C, bar, rpm…"
              />
            </div>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="sensor-is-writable">Writable Node</Label>
              <p className="text-sm text-muted-foreground">
                Allow control commands to be sent to this sensor
              </p>
            </div>
            <Switch
              id="sensor-is-writable"
              checked={form.is_writable}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, is_writable: checked }))
              }
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={
                creating || updating || (!editTarget && !form.opc_server_id)
              }
            >
              {editTarget ? "Save Changes" : "Create Sensor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
