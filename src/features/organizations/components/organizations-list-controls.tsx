"use client";

import { useTranslations } from "next-intl";
import {
  ListPageSizeSelect,
  ListResultsSummary,
} from "@/components/ui/list-pagination";

interface OrganizationsListControlsProps {
  shownCount: number;
  totalCount: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (next: number) => void;
}

export function OrganizationsListControls({
  shownCount,
  totalCount,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: OrganizationsListControlsProps) {
  const t = useTranslations("organizations");
  return (
    <div className="flex items-center justify-between gap-3">
      <ListResultsSummary
        shownCount={shownCount}
        totalCount={totalCount}
        noun={t("noun")}
      />
      <ListPageSizeSelect
        id="organizations-page-size"
        value={pageSize}
        options={pageSizeOptions}
        onChange={onPageSizeChange}
      />
    </div>
  );
}
