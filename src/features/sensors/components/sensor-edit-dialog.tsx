"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EditSensorFormState } from "@/features/sensors/components/sensor-detail-types";
import type { Sensor } from "@/features/sensors/types";

interface SensorEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sensor: Sensor | undefined;
  updating: boolean;
  onSave: (data: EditSensorFormState) => void;
}

const emptyForm: EditSensorFormState = {
  name: "",
  description: "",
  node_id: "",
  data_type: "numeric",
  units: "",
  is_writable: false,
};

export function SensorEditDialog({
  open,
  onOpenChange,
  sensor,
  updating,
  onSave,
}: SensorEditDialogProps) {
  const t = useTranslations("sensors");
  const tCommon = useTranslations("common");
  const [form, setForm] = useState<EditSensorFormState>(() =>
    sensor
      ? {
          name: sensor.name,
          description: sensor.description ?? "",
          node_id: sensor.node_id,
          data_type: sensor.data_type,
          units: sensor.units ?? "",
          is_writable: sensor.is_writable,
        }
      : emptyForm,
  );

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("editSensor")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-sensor-name">{t("name")}</Label>
            <Input
              id="edit-sensor-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Temperature Sensor A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-sensor-node-id">{t("nodeId")}</Label>
            <Input
              id="edit-sensor-node-id"
              required
              value={form.node_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, node_id: e.target.value }))
              }
              placeholder="ns=2;i=1001"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("dataType")}</Label>
            <Select
              value={form.data_type}
              onValueChange={(value) =>
                setForm((f) => ({
                  ...f,
                  data_type: value as EditSensorFormState["data_type"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue>{t(form.data_type)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numeric">{t("numeric")}</SelectItem>
                <SelectItem value="boolean">{t("boolean")}</SelectItem>
                <SelectItem value="string">{t("string")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-sensor-desc">{t("description")}</Label>
              <Input
                id="edit-sensor-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder={tCommon("optional")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sensor-units">{t("units")}</Label>
              <Input
                id="edit-sensor-units"
                value={form.units}
                onChange={(e) =>
                  setForm((f) => ({ ...f, units: e.target.value }))
                }
                placeholder="degC, bar, rpm"
              />
            </div>
          </div>
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="edit-sensor-is-writable">
                {t("writableNode")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("writableNodeHelp")}
              </p>
            </div>
            <Switch
              id="edit-sensor-is-writable"
              checked={form.is_writable}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, is_writable: checked }))
              }
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tCommon("cancel")}
            </DialogClose>
            <Button type="submit" disabled={updating}>
              {tCommon("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
