"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateSensorMutation,
  useUpdateSensorMutation,
} from "@/store/api";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sensor, CreateSensorRequest } from "@/features/sensors/types";
import type { OpcServer } from "@/features/servers";

// ─── Form state ───────────────────────────────────────────────────────────────

interface SensorFormState {
  name: string;
  description: string;
  node_id: string;
  units: string;
  opc_server_id: string;
}

const emptyForm: SensorFormState = {
  name: "",
  description: "",
  node_id: "",
  units: "",
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
          units: editTarget.units ?? "",
          opc_server_id: editTarget.opc_server_id,
        }
      : { ...emptyForm, opc_server_id: defaultServerId },
  );

  const selectedServerName = servers.find((srv) => srv.id === form.opc_server_id)?.name ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editTarget) {
        await updateSensor({
          id: editTarget.id,
          name: form.name || undefined,
          description: form.description || null,
          node_id: form.node_id || undefined,
          units: form.units || null,
        }).unwrap();
        toast.success("Sensor updated.");
      } else {
        const payload: CreateSensorRequest = {
          opc_server_id: form.opc_server_id,
          name: form.name,
          description: form.description || null,
          node_id: form.node_id,
          units: form.units || null,
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
          <DialogTitle>
            {editTarget ? "Edit Sensor" : "Add Sensor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editTarget && (
            <div className="space-y-2">
              <Label>OPC UA Server</Label>
              <Select
                value={form.opc_server_id}
                onValueChange={(v) => setForm((f) => ({ ...f, opc_server_id: v ?? "" }))}
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
              onChange={(e) => setForm((f) => ({ ...f, node_id: e.target.value }))}
              placeholder="ns=2;i=1001"
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sensor-desc">Description</Label>
              <Input
                id="sensor-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sensor-units">Units</Label>
              <Input
                id="sensor-units"
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
            <Button
              type="submit"
              disabled={creating || updating || (!editTarget && !form.opc_server_id)}
            >
              {editTarget ? "Save Changes" : "Create Sensor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
