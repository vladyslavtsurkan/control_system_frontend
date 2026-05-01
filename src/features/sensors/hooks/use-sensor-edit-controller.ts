import { useState } from "react";
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

  function openEdit() {
    if (!sensor) return;
    setEditOpen(true);
  }

  async function handleEditSubmit(data: EditSensorFormState) {
    try {
      await updateSensor({
        id: sensorId,
        name: data.name || undefined,
        description: data.description || null,
        node_id: data.node_id || undefined,
        data_type: data.data_type,
        units: data.units || null,
        is_writable: data.is_writable,
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
    openEdit,
    handleEditSubmit,
  };
}
