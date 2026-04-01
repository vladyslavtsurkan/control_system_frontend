"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parsePositiveIntParam } from "@/lib/utils";

interface UseOffsetLimitPaginationInput {
  initialLimit: number;
  initialPage?: number;
  pageParam?: string;
  perPageParam?: string;
}

interface UseOffsetLimitPaginationResult {
  page: number;
  perPage: number;
  offset: number;
  limit: number;
  queryArgs: { offset: number; limit: number };
  resetPage: () => void;
  setPage: (next: number) => void;
  setLimitAndReset: (next: number) => void;
  goPrev: () => void;
  goNext: () => void;
}

interface OffsetLimitPaginationMetaInput {
  count?: number | null;
  perPage?: number | null;
  totalPages?: number | null;
  page?: number | null;
  offset: number;
  requestedLimit: number;
  fallbackLimit: number;
}

interface OffsetLimitPaginationMeta {
  perPage: number;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function getOffsetLimitPaginationMeta({
  count,
  perPage,
  totalPages,
  page,
  offset,
  requestedLimit,
  fallbackLimit,
}: OffsetLimitPaginationMetaInput): OffsetLimitPaginationMeta {
  const safePerPage =
    perPage && perPage > 0 ? perPage : requestedLimit || fallbackLimit;
  const totalCount = count ?? 0;
  const safeTotalPages =
    totalPages && totalPages > 0
      ? totalPages
      : Math.max(1, Math.ceil(totalCount / Math.max(1, safePerPage)));
  const currentPage =
    page && page > 0 ? page : Math.floor(offset / Math.max(1, safePerPage)) + 1;

  return {
    perPage: safePerPage,
    totalCount,
    totalPages: safeTotalPages,
    currentPage,
    canGoPrev: currentPage > 1,
    canGoNext: currentPage < safeTotalPages,
  };
}

export function useOffsetLimitPagination({
  initialLimit,
  initialPage = 1,
  pageParam = "page",
  perPageParam = "per_page",
}: UseOffsetLimitPaginationInput): UseOffsetLimitPaginationResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePositiveIntParam(
    searchParams.get(pageParam) ?? undefined,
    initialPage,
  );
  const perPage = parsePositiveIntParam(
    searchParams.get(perPageParam) ?? undefined,
    initialLimit,
  );
  const offset = (page - 1) * perPage;
  const limit = perPage;

  const replaceQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  function setPage(next: number) {
    const safeNext = Math.max(1, Math.floor(next));
    replaceQuery((params) => {
      params.set(pageParam, String(safeNext));
      params.set(perPageParam, String(perPage));
    });
  }

  function setLimitAndReset(next: number) {
    const safeNext = Math.max(1, Math.floor(next));
    replaceQuery((params) => {
      params.set(pageParam, "1");
      params.set(perPageParam, String(safeNext));
    });
  }

  function resetPage() {
    setPage(1);
  }

  function goPrev() {
    setPage(page - 1);
  }

  function goNext() {
    setPage(page + 1);
  }

  return {
    page,
    perPage,
    offset,
    limit,
    queryArgs: { offset, limit },
    resetPage,
    setPage,
    setLimitAndReset,
    goPrev,
    goNext,
  };
}
