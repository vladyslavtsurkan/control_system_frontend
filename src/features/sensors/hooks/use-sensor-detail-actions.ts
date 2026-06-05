import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteSensor } from "@/features/sensors/actions/sensor-actions";
import { acknowledgeAlert } from "@/features/alerts";
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
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isAckPending, startAckTransition] = useTransition();
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

    startDeleteTransition(async () => {
      try {
        const res = await deleteSensor(sensorId);
        if (res.success) {
          toast.success("Sensor deleted.");
          router.push("/sensors");
        } else {
          toast.error(res.error || "Delete failed.");
        }
      } catch {
        toast.error("Delete failed.");
      }
    });
  }

  async function handleAcknowledge(alertId: string) {
    setAcknowledgingId(alertId);
    startAckTransition(async () => {
      try {
        const res = await acknowledgeAlert(alertId);
        if (res.success) {
          toast.success("Alert acknowledged.");
          refetchAlerts();
        } else {
          toast.error(res.error || "Failed to acknowledge alert.");
        }
      } catch {
        toast.error("Failed to acknowledge alert.");
      } finally {
        setAcknowledgingId(null);
      }
    });
  }

  return {
    acknowledging: isAckPending,
    acknowledgingId,
    deleting: isDeletePending,
    handleDelete,
    handleAcknowledge,
    ConfirmDialog,
  };
}

