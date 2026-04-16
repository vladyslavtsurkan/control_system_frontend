"use client";

import { useTranslations } from "next-intl";
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
  label,
  triggerClassName = "h-8 w-20",
  wrapperClassName = "flex items-center gap-2",
}: ListPageSizeSelectProps) {
  const t = useTranslations("pagination");
  return (
    <div className={wrapperClassName}>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label ?? t("rows")}
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
  const t = useTranslations("pagination");
  return (
    <p className="text-sm text-muted-foreground">
      {t("showing", { shown: shownCount, total: totalCount, noun })}
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
  const t = useTranslations("pagination");
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        {t("page", { current: currentPage, total: totalPages })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoPrev}
          onClick={onPrev}
        >
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoNext}
          onClick={onNext}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
