import { useState } from "react";
import { toast } from "sonner";
import { useUpdateSensorMutation } from "@/store/api";
import type { EditSensorFormState } from "@/features/sensors/components";
import type { Sensor } from "@/features/sensors/types";

interface UseSensorEditControllerParams {
  sensorId: string;
  sensor?: Sensor;
}

export function useSensorEditController({ sensorId, sensor }: UseSensorEditControllerParams) {
  const [updateSensor, { isLoading: updating }] = useUpdateSensorMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditSensorFormState>({
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
        id: sensorId,
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

  return {
    updating,
    editOpen,
    setEditOpen,
    form,
    setForm,
    openEdit,
    handleEditSubmit,
  };
}

