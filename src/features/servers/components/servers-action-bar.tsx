"use client";

import { PlusCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ServersActionBarProps {
  onRefresh: () => void;
  onCreate: () => void;
  canManage: boolean;
}

export function ServersActionBar({
  onRefresh,
  onCreate,
  canManage,
}: ServersActionBarProps) {
  const t = useTranslations("servers");
  const tCommon = useTranslations("common");
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        aria-label={tCommon("refresh")}
      >
        <RefreshCw className="size-4" />
      </Button>
      {canManage && (
        <Button onClick={onCreate}>
          <PlusCircle className="mr-2 size-4" />
          {t("addServer")}
        </Button>
      )}
    </div>
  );
}
