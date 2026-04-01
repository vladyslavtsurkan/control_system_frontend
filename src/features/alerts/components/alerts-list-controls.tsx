"use client";

import {
  ListPageSizeSelect,
  ListResultsSummary,
} from "@/components/ui/list-pagination";

interface AlertsListControlsProps {
  shownCount: number;
  totalCount: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (next: number) => void;
}

export function AlertsListControls({
  shownCount,
  totalCount,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: AlertsListControlsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <ListResultsSummary
        shownCount={shownCount}
        totalCount={totalCount}
        noun="alert rules"
      />
      <ListPageSizeSelect
        id="alert-rules-page-size"
        value={pageSize}
        options={pageSizeOptions}
        onChange={onPageSizeChange}
      />
    </div>
  );
}
