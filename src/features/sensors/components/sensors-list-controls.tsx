"use client";

import { ListResultsSummary } from "@/components/ui/list-pagination";

interface SensorsListControlsProps {
  shownCount: number;
  totalCount: number;
}

export function SensorsListControls({ shownCount, totalCount }: SensorsListControlsProps) {
  return <ListResultsSummary shownCount={shownCount} totalCount={totalCount} noun="sensors" />;
}

