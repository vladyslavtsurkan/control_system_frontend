import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";
import { useUpdateSensorMutation } from "@/store/api";
import type { EditSensorFormState } from "@/features/sensors/components";
import type { Sensor } from "@/features/sensors/types";

interface UseSensorEditControllerParams {
  sensorId: string;
  sensor?: Sensor;
}

export function useSensorEditController({
  sensorId,
  sensor,
}: UseSensorEditControllerParams) {
  const [updateSensor, { isLoading: updating }] = useUpdateSensorMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditSensorFormState>({
    name: "",
    description: "",
    node_id: "",
    data_type: "numeric",
    units: "",
    is_writable: false,
  });

  function openEdit() {
    if (!sensor) return;

    setForm({
      name: sensor.name,
      description: sensor.description ?? "",
      node_id: sensor.node_id,
      data_type: sensor.data_type,
      units: sensor.units ?? "",
      is_writable: sensor.is_writable,
    });
    setEditOpen(true);
  }

  async function handleEditSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      await updateSensor({
        id: sensorId,
        name: form.name || undefined,
        description: form.description || null,
        node_id: form.node_id || undefined,
        data_type: form.data_type,
        units: form.units || null,
        is_writable: form.is_writable,
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
