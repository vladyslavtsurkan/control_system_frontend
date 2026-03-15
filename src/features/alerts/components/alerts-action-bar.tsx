"use client";

import { PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertsActionBarProps {
  onRefresh: () => void;
  onCreate: () => void;
}

export function AlertsActionBar({ onRefresh, onCreate }: AlertsActionBarProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh">
        <RefreshCw className="size-4" />
      </Button>
      <Button onClick={onCreate}>
        <PlusCircle className="mr-2 size-4" />
        Add Rule
      </Button>
    </div>
  );
}

