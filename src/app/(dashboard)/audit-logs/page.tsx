import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import AuditLogsPageClient from "@/features/audit-logs/components/audit-logs-page-client";
import {
  getFirstSearchParamValue,
  parsePageSizeParam,
  parsePositiveIntParam,
  type SearchParamValue,
} from "@/lib/utils";
import { LIST_PAGE_SIZE_OPTIONS, AUTH_COOKIE_NAME, BACKEND_API_URL, TENANT_COOKIE_NAME } from "@/config/constants";
import type { AuditLogEntry } from "@/features/audit-logs/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

export const metadata: Metadata = {
  title: "Audit Log | IIoT Platform",
  description: "Track every action taken within your organization.",
};

interface AuditLogsPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function AuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations("auditLogs");
  const initialPage = parsePositiveIntParam(
    getFirstSearchParamValue(resolvedSearchParams.page),
    1,
  );
  const initialPerPage = parsePageSizeParam(
    getFirstSearchParamValue(resolvedSearchParams.per_page),
    LIST_PAGE_SIZE_OPTIONS,
    LIST_PAGE_SIZE_OPTIONS[0],
  );

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const tenantId = cookieStore.get(TENANT_COOKIE_NAME)?.value;

  let initialData: PaginatedResponse<AuditLogEntry> | null = null;

  if (token && tenantId) {
    try {
      const offset = (initialPage - 1) * initialPerPage;
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(initialPerPage),
      });

      const res = await fetch(`${BACKEND_API_URL}/api/v1/audit-logs/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
        },
        cache: "no-store",
      });

      if (res.ok) {
        initialData = await res.json();
      }
    } catch (e) {
      console.error("Failed to prefetch audit logs", e);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AuditLogsPageClient
        initialPage={initialPage}
        initialPerPage={initialPerPage}
        initialData={initialData}
      />
    </div>
  );
}

