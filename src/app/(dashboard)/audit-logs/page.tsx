import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AuditLogsPageClient from "@/features/audit-logs/components/audit-logs-page-client";
import {
  getFirstSearchParamValue,
  parsePageSizeParam,
  parsePositiveIntParam,
  type SearchParamValue,
} from "@/lib/utils";
import { LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AuditLogsPageClient
        initialPage={initialPage}
        initialPerPage={initialPerPage}
      />
    </div>
  );
}
