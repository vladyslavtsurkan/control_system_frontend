import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useAcknowledgeAlertMutation,
  useDeleteSensorMutation,
} from "@/store/api";
import { useConfirm } from "@/hooks/use-confirm";

interface UseSensorDetailActionsParams {
  sensorId: string;
  sensorName?: string;
  refetchAlerts: () => void;
}

export function useSensorDetailActions({
  sensorId,
  sensorName,
  refetchAlerts,
}: UseSensorDetailActionsParams) {
  const router = useRouter();
  const [deleteSensor] = useDeleteSensorMutation();
  const [acknowledgeAlert, { isLoading: acknowledging }] =
    useAcknowledgeAlertMutation();
  const { confirm, ConfirmDialog } = useConfirm();
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !(await confirm({
        description: `Delete sensor "${sensorName}"? This will also remove its readings and alert rules.`,
        destructive: true,
      }))
    )
      return;

    try {
      await deleteSensor(sensorId).unwrap();
      toast.success("Sensor deleted.");
      router.push("/sensors");
    } catch {
      toast.error("Delete failed.");
    }
  }

  async function handleAcknowledge(alertId: string) {
    try {
      setAcknowledgingId(alertId);
      await acknowledgeAlert(alertId).unwrap();
      toast.success("Alert acknowledged.");
      refetchAlerts();
    } catch {
      toast.error("Failed to acknowledge alert.");
    } finally {
      setAcknowledgingId(null);
    }
  }

  return {
    acknowledging,
    acknowledgingId,
    handleDelete,
    handleAcknowledge,
    ConfirmDialog,
  };
}
