import { useState } from "react";
import { toast } from "sonner";
import {
  useSendControlCommandMutation,
  useGetOrganizationsQuery,
} from "@/store/api";
import { useConfirm } from "@/hooks/use-confirm";
import { useAppSelector } from "@/store/hooks";
import { selectActiveOrgId } from "@/store/selectors";
import type { Sensor } from "@/features/sensors/types";

interface UseSensorControlParams {
  sensor?: Sensor;
}

export function useSensorControl({ sensor }: UseSensorControlParams) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | boolean>("");

  const [sendControlCommand, { isLoading: sending }] =
    useSendControlCommandMutation();
  const { confirm, ConfirmDialog } = useConfirm();

  // Role-gating: only owner/admin may send control commands
  const activeOrgId = useAppSelector(selectActiveOrgId);
  const { data: orgsPage } = useGetOrganizationsQuery();
  const activeOrgRole = orgsPage?.items.find((o) => o.id === activeOrgId)?.role;
  const canControl = activeOrgRole === "owner" || activeOrgRole === "admin";

  function openControl() {
    if (!sensor) return;
    setValue(sensor.data_type === "boolean" ? false : "");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sensor) return;

    // Parse value to the correct type before sending
    let parsedValue: number | boolean | string;
    if (sensor.data_type === "numeric") {
      const n = Number(value);
      if (isNaN(n)) {
        toast.error("Please enter a valid number.");
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
      description: `Write ${displayValue} to "${sensor.name}" (${sensor.node_id})? This will immediately affect the physical device.`,
    });
    if (!ok) return;

    try {
      const result = await sendControlCommand({
        sensorId: sensor.id,
        value: parsedValue,
      }).unwrap();
      toast.success(`Command dispatched (ID: ${result.command_id})`);
      setOpen(false);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 400) {
        toast.error("This sensor does not accept write commands.");
      } else if (status === 404) {
        toast.error("Sensor not found.");
      } else if (status === 401 || status === 403) {
        toast.error("You do not have permission to send control commands.");
      } else {
        toast.error("Failed to dispatch command. Please try again.");
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
