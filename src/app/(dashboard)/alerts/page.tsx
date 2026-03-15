import AlertsPageClient from "@/features/alerts/components/alerts-page-client";
import {
  getFirstSearchParamValue,
  parsePageSizeParam,
  parsePositiveIntParam,
  type SearchParamValue,
} from "@/lib/utils";
import { LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";

interface AlertsPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  const resolvedSearchParams = await searchParams;
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
        <h1 className="text-2xl font-semibold tracking-tight">Alert Rules</h1>
        <p className="text-sm text-muted-foreground">Configure threshold-based alerts for your sensors.</p>
      </div>
      <AlertsPageClient initialPage={initialPage} initialPerPage={initialPerPage} />
    </div>
  );
}
