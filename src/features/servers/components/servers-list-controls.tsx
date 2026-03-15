"use client";

import {
  ListPageSizeSelect,
  ListResultsSummary,
} from "@/components/ui/list-pagination";

interface ServersListControlsProps {
  shownCount: number;
  totalCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (next: number) => void;
}

export function ServersListControls({
  shownCount,
  totalCount,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: ServersListControlsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <ListResultsSummary shownCount={shownCount} totalCount={totalCount} noun="servers" />
      <ListPageSizeSelect
        id="servers-page-size"
        value={pageSize}
        options={pageSizeOptions}
        onChange={onPageSizeChange}
      />
    </div>
  );
}

