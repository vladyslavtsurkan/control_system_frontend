"use client";

import { PlusCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface AlertsActionBarProps {
  onRefresh: () => void;
  onCreate: () => void;
  canManage: boolean;
}

export function AlertsActionBar({
  onRefresh,
  onCreate,
  canManage,
}: AlertsActionBarProps) {
  const t = useTranslations("alerts");
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        aria-label={t("name")}
      >
        <RefreshCw className="size-4" />
      </Button>
      {canManage && (
        <Button onClick={onCreate}>
          <PlusCircle className="mr-2 size-4" />
          {t("addRule")}
        </Button>
      )}
    </div>
  );
}
