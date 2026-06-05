import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { sendControlCommand } from "@/features/sensors/actions/sensor-actions";
import { useConfirm } from "@/hooks/use-confirm";
import { useOrgPermissions } from "@/features/organizations";
import type { Sensor } from "@/features/sensors/types";

interface UseSensorControlParams {
  sensor?: Sensor;
}

export function useSensorControl({ sensor }: UseSensorControlParams) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("sensors");

  const [sending, startTransition] = useTransition();
  const { confirm, ConfirmDialog } = useConfirm();

  // Role-gating: only owner/admin may send control commands
  const { canManage } = useOrgPermissions();
  const canControl = canManage;

  function openControl() {
    if (!sensor) return;
    setOpen(true);
  }

  async function handleSave(value: string | boolean) {
    if (!sensor) return;

    // Parse value to the correct type before sending
    let parsedValue: number | boolean | string;
    if (sensor.data_type === "numeric") {
      const n = Number(value);
      if (isNaN(n)) {
        toast.error(t("detail.controlInvalidNumber"));
        return;
      }
      parsedValue = n;
    } else if (sensor.data_type === "boolean") {
      parsedValue = value as boolean;
    } else {
      parsedValue = value as string;
    }

    // Confirmation step before issuing physical OPC UA write
    const displayValue =
      sensor.data_type === "numeric"
        ? `${parsedValue}${sensor.units ? ` ${sensor.units}` : ""}`
        : String(parsedValue);

    const ok = await confirm({
      description: t("detail.controlConfirm", {
        value: displayValue,
        name: sensor.name,
        nodeId: sensor.node_id,
      }),
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await sendControlCommand(sensor.id, parsedValue);
      if (result.success) {
        toast.success(t("detail.controlDispatched", { id: result.data.command_id }));
        setOpen(false);
      } else {
        const status = result.status;
        if (status === 400) {
          toast.error(t("detail.controlNotWritable"));
        } else if (status === 404) {
          toast.error(t("detail.controlSensorNotFound"));
        } else if (status === 401 || status === 403) {
          toast.error(t("detail.controlPermission"));
        } else {
          toast.error(t("detail.controlFailed"));
        }
      }
    });
  }

  return {
    open,
    setOpen,
    sending,
    canControl,
    openControl,
    handleSave,
    ConfirmDialog,
  };
}
