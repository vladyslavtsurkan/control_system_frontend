"use client";

import { useTranslations } from "next-intl";
import { ListResultsSummary } from "@/components/ui/list-pagination";

interface SensorsListControlsProps {
  shownCount: number;
  totalCount: number;
}

export function SensorsListControls({
  shownCount,
  totalCount,
}: SensorsListControlsProps) {
  const t = useTranslations("sensors");
  return (
    <ListResultsSummary
      shownCount={shownCount}
      totalCount={totalCount}
      noun={t("noun")}
    />
  );
}
