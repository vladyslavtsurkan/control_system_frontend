"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useGetAuditLogsQuery,
  useGetOrganizationMembersQuery,
  useGetOrganizationsQuery,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";
import { selectActiveOrgId } from "@/store/selectors";
import { cn } from "@/lib/utils";
import {
  ListPaginationFooter,
  ListPageSizeSelect,
  ListResultsSummary,
} from "@/components/ui/list-pagination";
import { AuditLogFilters } from "@/features/audit-logs/components/audit-log-filters";
import { AuditLogTable } from "@/features/audit-logs/components/audit-log-table";
import {
  getOffsetLimitPaginationMeta,
  useOffsetLimitPagination,
} from "@/hooks/use-offset-limit-pagination";
import {
  LIST_PAGE_SIZE_FALLBACK,
  LIST_PAGE_SIZE_OPTIONS,
} from "@/config/constants";
import type { AuditLogFiltersValue } from "@/features/audit-logs/components/audit-log-filters";
import type {
  AuditLogAction,
  AuditLogResourceType,
} from "@/features/audit-logs/types";

interface AuditLogsPageClientProps {
  initialPage: number;
  initialPerPage: number;
}

const DEFAULT_FILTERS: AuditLogFiltersValue = {
  resource_type: "",
  action: "",
  actor_id: "",
};

export default function AuditLogsPageClient({
  initialPage,
  initialPerPage,
}: AuditLogsPageClientProps) {
  const router = useRouter();
  const activeOrgId = useAppSelector(selectActiveOrgId);

  const [filters, setFilters] = useState<AuditLogFiltersValue>(DEFAULT_FILTERS);

  const pagination = useOffsetLimitPagination({
    initialLimit: initialPerPage,
    initialPage,
  });

  // Derive the active org role (same pattern as the sidebar)
  const { data: orgsData } = useGetOrganizationsQuery();
  const activeOrg = orgsData?.items.find((o) => o.id === activeOrgId);
  const activeRole = activeOrg?.role;

  const isAuthorized = activeRole === "owner" || activeRole === "admin";

  const queryArgs = {
    ...pagination.queryArgs,
    ...(filters.resource_type
      ? { resource_type: filters.resource_type as AuditLogResourceType }
      : {}),
    ...(filters.action ? { action: filters.action as AuditLogAction } : {}),
    ...(filters.actor_id ? { actor_id: filters.actor_id } : {}),
  };

  const { data, isLoading, isFetching, error, refetch } = useGetAuditLogsQuery(queryArgs, {
    refetchOnMountOrArgChange: true,
    // Skip the query until we know the role to avoid leaking the request
    skip: !isAuthorized,
  });

  const { data: membersData } = useGetOrganizationMembersQuery(
    activeOrgId ?? "",
    { skip: !activeOrgId || !isAuthorized },
  );

  // Handle API-level errors (403/404 should be rare due to UI guard, but handle gracefully)
  if (error) {
    const status = "status" in error ? (error as { status: number }).status : 0;
    if (status === 403) {
      toast.error("Access denied. Only owners and admins can view audit logs.");
    } else if (status === 404) {
      router.replace("/organizations");
    }
  }

  // Role guard — show a clear message when the org list has loaded but role is insufficient
  if (orgsData && !isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Only organization owners and admins can view the audit log.
        </p>
      </div>
    );
  }

  const members = membersData?.items ?? [];
  const entries = data?.items ?? [];

  const { totalCount, totalPages, currentPage, canGoPrev, canGoNext } =
    getOffsetLimitPaginationMeta({
      count: data?.count,
      perPage: data?.per_page,
      totalPages: data?.total_pages,
      page: data?.page,
      offset: pagination.offset,
      requestedLimit: pagination.limit,
      fallbackLimit: LIST_PAGE_SIZE_FALLBACK,
    });

  function handleFiltersChange(next: AuditLogFiltersValue) {
    setFilters(next);
    pagination.resetPage();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AuditLogFilters
          value={filters}
          members={members}
          onChange={handleFiltersChange}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh"
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <ListResultsSummary
          shownCount={entries.length}
          totalCount={totalCount}
          noun="entries"
        />
        <ListPageSizeSelect
          id="audit-log-page-size"
          value={pagination.perPage}
          options={LIST_PAGE_SIZE_OPTIONS}
          onChange={pagination.setLimitAndReset}
        />
      </div>

      <AuditLogTable entries={entries} isLoading={isLoading} />

      <ListPaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={pagination.goPrev}
        onNext={pagination.goNext}
      />
    </div>
  );
}
