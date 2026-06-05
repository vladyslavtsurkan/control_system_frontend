import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSensor } from "@/features/sensors/actions/sensor-actions";
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
  const [updating, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  function openEdit() {
    if (!sensor) return;
    setEditOpen(true);
  }

  function handleEditSubmit(data: EditSensorFormState) {
    startTransition(async () => {
      const result = await updateSensor(sensorId, {
        name: data.name || undefined,
        description: data.description || null,
        node_id: data.node_id || undefined,
        data_type: data.data_type,
        units: data.units || null,
        is_writable: data.is_writable,
      });
      if (result.success) {
        toast.success("Sensor updated.");
        setEditOpen(false);
      } else {
        toast.error(result.error || "Update failed. Please try again.");
      }
    });
  }

  return {
    updating,
    editOpen,
    setEditOpen,
    openEdit,
    handleEditSubmit,
  };
}
