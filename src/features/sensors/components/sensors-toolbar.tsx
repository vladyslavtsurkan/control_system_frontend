"use client";

import { PlusCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ListPageSizeSelect } from "@/components/ui/list-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OpcServer } from "@/features/servers";

interface SensorsToolbarProps {
  serverFilter: string;
  servers: OpcServer[];
  pageSize: number;
  pageSizeOptions: readonly number[];
  onServerFilterChange: (nextValue: string) => void;
  onPageSizeChange: (next: number) => void;
  onRefresh: () => void;
  onCreate: () => void;
  canManage: boolean;
}

export function SensorsToolbar({
  serverFilter,
  servers,
  pageSize,
  pageSizeOptions,
  onServerFilterChange,
  onPageSizeChange,
  onRefresh,
  onCreate,
  canManage,
}: SensorsToolbarProps) {
  const t = useTranslations("sensors");
  const selectedServerName = servers.find(
    (srv) => srv.id === serverFilter,
  )?.name;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select
        value={serverFilter}
        onValueChange={(value) => onServerFilterChange(value ?? "")}
      >
        <SelectTrigger className="w-48">
          <SelectValue>
            {serverFilter
              ? (selectedServerName ?? t("allServers"))
              : t("allServers")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{t("allServers")}</SelectItem>
          {servers.map((srv) => (
            <SelectItem key={srv.id} value={srv.id}>
              {srv.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ListPageSizeSelect
        id="sensors-page-size"
        value={pageSize}
        options={pageSizeOptions}
        onChange={onPageSizeChange}
        wrapperClassName="flex items-center gap-2 rounded-md border px-3 py-1.5"
      />

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        aria-label={t("allServers")}
      >
        <RefreshCw className="size-4" />
      </Button>
      {canManage && (
        <Button onClick={onCreate}>
          <PlusCircle className="mr-2 size-4" />
          {t("addSensor")}
        </Button>
      )}
    </div>
  );
}
