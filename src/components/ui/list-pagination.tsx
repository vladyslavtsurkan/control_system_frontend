"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ListPageSizeSelectProps {
  id: string;
  value: number;
  options: readonly number[];
  onChange: (next: number) => void;
  label?: string;
  triggerClassName?: string;
  wrapperClassName?: string;
}

export function ListPageSizeSelect({
  id,
  value,
  options,
  onChange,
  label = "Rows",
  triggerClassName = "h-8 w-20",
  wrapperClassName = "flex items-center gap-2",
}: ListPageSizeSelectProps) {
  return (
    <div className={wrapperClassName}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select
        value={String(value)}
        onValueChange={(next) => onChange(Number(next))}
      >
        <SelectTrigger id={id} className={triggerClassName}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface ListResultsSummaryProps {
  shownCount: number;
  totalCount: number;
  noun: string;
}

export function ListResultsSummary({
  shownCount,
  totalCount,
  noun,
}: ListResultsSummaryProps) {
  return (
    <p className="text-sm text-muted-foreground">
      Showing {shownCount} of {totalCount} {noun}
    </p>
  );
}

interface ListPaginationFooterProps {
  currentPage: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function ListPaginationFooter({
  currentPage,
  totalPages,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: ListPaginationFooterProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoPrev}
          onClick={onPrev}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoNext}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
