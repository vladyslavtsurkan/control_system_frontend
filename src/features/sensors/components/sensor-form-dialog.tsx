"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { Path } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createSensor, updateSensor } from "@/features/sensors/actions/sensor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type {
  Sensor,
  SensorDataType,
  SensorCreateRequest,
} from "@/features/sensors/types";
import type { OpcServer } from "@/features/servers";

// ─── Form state ───────────────────────────────────────────────────────────────

interface SensorFormState {
  name: string;
  description: string;
  node_id: string;
  data_type: SensorDataType;
  units: string;
  is_writable: boolean;
  opc_server_id: string;
}

const emptyForm: SensorFormState = {
  name: "",
  description: "",
  node_id: "",
  data_type: "numeric",
  units: "",
  is_writable: false,
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
  const t = useTranslations("sensors");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<SensorFormState>({
    defaultValues: editTarget
      ? {
          name: editTarget.name,
          description: editTarget.description ?? "",
          node_id: editTarget.node_id,
          data_type: editTarget.data_type,
          units: editTarget.units ?? "",
          is_writable: editTarget.is_writable,
          opc_server_id: editTarget.opc_server_id,
        }
      : { ...emptyForm, opc_server_id: defaultServerId },
  });

  const opc_server_id = watch("opc_server_id");
  const data_type = watch("data_type");
  const is_writable = watch("is_writable");

  const selectedServerName =
    servers.find((srv) => srv.id === opc_server_id)?.name ?? "";

  const onSubmit = async (data: SensorFormState) => {
    startTransition(async () => {
      try {
        if (editTarget) {
          const res = await updateSensor(editTarget.id, {
            name: data.name || undefined,
            description: data.description || null,
            node_id: data.node_id || undefined,
            data_type: data.data_type,
            units: data.units || null,
            is_writable: data.is_writable,
          });
          if (res.success) {
            toast.success(t("sensorUpdated"));
            onOpenChange(false);
          } else {
            if (res.fieldErrors) {
              Object.entries(res.fieldErrors).forEach(([field, messages]) => {
                if (messages && messages.length > 0) {
                  setError(field as Path<SensorFormState>, { type: "server", message: messages[0] });
                }
              });
            } else {
              toast.error(res.error || tCommon("operationFailed"));
            }
          }
        } else {
          const payload: SensorCreateRequest = {
            opc_server_id: data.opc_server_id,
            name: data.name,
            description: data.description || null,
            node_id: data.node_id,
            data_type: data.data_type,
            units: data.units || null,
            is_writable: data.is_writable,
          };
          const res = await createSensor(payload);
          if (res.success) {
            toast.success(t("sensorCreated"));
            onOpenChange(false);
          } else {
            if (res.fieldErrors) {
              Object.entries(res.fieldErrors).forEach(([field, messages]) => {
                if (messages && messages.length > 0) {
                  setError(field as Path<SensorFormState>, { type: "server", message: messages[0] });
                }
              });
            } else {
              toast.error(res.error || tCommon("operationFailed"));
            }
          }
        }

      } catch {
        toast.error(tCommon("operationFailed"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editTarget ? t("editSensor") : t("addSensor")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editTarget && (
            <div className="space-y-2">
              <Label>{t("opcUaServer")}</Label>
              <Select
                value={opc_server_id}
                onValueChange={(v) => setValue("opc_server_id", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectServer")}>
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
              {errors.opc_server_id && (
                <p className="text-xs text-red-500 mt-1">{errors.opc_server_id.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="sensor-name">{t("name")}</Label>
            <Input
              id="sensor-name"
              {...register("name")}
              placeholder="Temperature Sensor A"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensor-node-id">{t("nodeId")}</Label>
            <Input
              id="sensor-node-id"
              {...register("node_id")}
              placeholder="ns=2;i=1001"
              className="font-mono"
            />
            {errors.node_id && (
              <p className="text-xs text-red-500 mt-1">{errors.node_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("dataType")}</Label>
            <Select
              value={data_type}
              onValueChange={(v) => setValue("data_type", v as SensorDataType)}
            >
              <SelectTrigger>
                <SelectValue>{t(data_type)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numeric">{t("numeric")}</SelectItem>
                <SelectItem value="boolean">{t("boolean")}</SelectItem>
                <SelectItem value="string">{t("string")}</SelectItem>
              </SelectContent>
            </Select>
            {errors.data_type && (
              <p className="text-xs text-red-500 mt-1">{errors.data_type.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sensor-desc">{t("description")}</Label>
              <Input
                id="sensor-desc"
                {...register("description")}
                placeholder={tCommon("optional")}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sensor-units">{t("units")}</Label>
              <Input
                id="sensor-units"
                {...register("units")}
                placeholder="°C, bar, rpm…"
              />
              {errors.units && (
                <p className="text-xs text-red-500 mt-1">{errors.units.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="sensor-is-writable">{t("writableNode")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("writableNodeHelp")}
              </p>
            </div>
            <Switch
              id="sensor-is-writable"
              checked={is_writable}
              onCheckedChange={(checked) => setValue("is_writable", checked)}
            />
            {errors.is_writable && (
              <p className="text-xs text-red-500 mt-1">{errors.is_writable.message}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tCommon("cancel")}
            </DialogClose>
            <Button
              type="submit"
              disabled={
                isPending || (!editTarget && !opc_server_id)
              }
            >
              {editTarget ? tCommon("saveChanges") : t("createSensor")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
