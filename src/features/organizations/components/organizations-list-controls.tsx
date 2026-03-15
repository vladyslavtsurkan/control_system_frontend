"use client";

import { ListPageSizeSelect, ListResultsSummary } from "@/components/ui/list-pagination";

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
  return (
    <div className="flex items-center justify-between gap-3">
      <ListResultsSummary shownCount={shownCount} totalCount={totalCount} noun="organizations" />
      <ListPageSizeSelect
        id="organizations-page-size"
        value={pageSize}
        options={pageSizeOptions}
        onChange={onPageSizeChange}
      />
    </div>
  );
}

