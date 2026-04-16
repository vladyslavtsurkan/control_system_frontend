import { useState } from "react";
import type { SyntheticEvent } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSendControlCommandMutation } from "@/store/api";
import { useConfirm } from "@/hooks/use-confirm";
import { useOrgPermissions } from "@/features/organizations";
import type { Sensor } from "@/features/sensors/types";

interface UseSensorControlParams {
  sensor?: Sensor;
}

export function useSensorControl({ sensor }: UseSensorControlParams) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | boolean>("");
  const t = useTranslations("sensors");

  const [sendControlCommand, { isLoading: sending }] =
    useSendControlCommandMutation();
  const { confirm, ConfirmDialog } = useConfirm();

  // Role-gating: only owner/admin may send control commands
  const { canManage } = useOrgPermissions();
  const canControl = canManage;

  function openControl() {
    if (!sensor) return;
    setValue(sensor.data_type === "boolean" ? false : "");
    setOpen(true);
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
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

    try {
      const result = await sendControlCommand({
        sensorId: sensor.id,
        value: parsedValue,
      }).unwrap();
      toast.success(t("detail.controlDispatched", { id: result.command_id }));
      setOpen(false);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
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
  }

  return {
    open,
    setOpen,
    value,
    setValue,
    sending,
    canControl,
    openControl,
    handleSubmit,
    ConfirmDialog,
  };
}
