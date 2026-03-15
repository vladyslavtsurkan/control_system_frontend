import SensorsPageClient from "@/features/sensors/components/sensors-page-client";
import {
  getFirstSearchParamValue,
  parsePageSizeParam,
  parsePositiveIntParam,
  type SearchParamValue,
} from "@/lib/utils";
import { LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";

interface SensorsPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function SensorsPage({ searchParams }: SensorsPageProps) {
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
  const initialServerFilter = getFirstSearchParamValue(resolvedSearchParams.server_id) ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sensors</h1>
        <p className="text-sm text-muted-foreground">Manage OPC UA sensor nodes and their metadata.</p>
      </div>
      <SensorsPageClient
        initialPage={initialPage}
        initialPerPage={initialPerPage}
        initialServerFilter={initialServerFilter}
      />
    </div>
  );
}
