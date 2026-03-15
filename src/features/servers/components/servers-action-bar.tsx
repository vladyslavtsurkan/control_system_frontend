"use client";

import { PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServersActionBarProps {
  onRefresh: () => void;
  onCreate: () => void;
}

export function ServersActionBar({ onRefresh, onCreate }: ServersActionBarProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh">
        <RefreshCw className="size-4" />
      </Button>
      <Button onClick={onCreate}>
        <PlusCircle className="mr-2 size-4" />
        Add Server
      </Button>
    </div>
  );
}

