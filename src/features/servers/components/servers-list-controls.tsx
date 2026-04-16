"use client";

import { useTranslations } from "next-intl";
import {
  ListPageSizeSelect,
  ListResultsSummary,
} from "@/components/ui/list-pagination";

interface ServersListControlsProps {
  shownCount: number;
  totalCount: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (next: number) => void;
}

export function ServersListControls({
  shownCount,
  totalCount,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: ServersListControlsProps) {
  const t = useTranslations("servers");
  return (
    <div className="flex items-center justify-between gap-3">
      <ListResultsSummary
        shownCount={shownCount}
        totalCount={totalCount}
        noun={t("noun")}
      />
      <ListPageSizeSelect
        id="servers-page-size"
        value={pageSize}
        options={pageSizeOptions}
        onChange={onPageSizeChange}
      />
    </div>
  );
}
