import SensorPageClient from "./page-client";
import { LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";
import {
  getFirstSearchParamValue,
  parsePageSizeParam,
  parsePositiveIntParam,
  type SearchParamValue,
} from "@/lib/utils";

interface SensorPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function SensorPage({ params, searchParams }: SensorPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const initialRange = getFirstSearchParamValue(resolvedSearchParams.range);
  const initialStartTime = getFirstSearchParamValue(resolvedSearchParams.start_time);
  const initialEndTime = getFirstSearchParamValue(resolvedSearchParams.end_time);
  const initialSampleEvery = parsePositiveIntParam(
    getFirstSearchParamValue(resolvedSearchParams.sample_every),
    5,
  );
  const initialAlertsPage = parsePositiveIntParam(
    getFirstSearchParamValue(resolvedSearchParams.alerts_page),
    1,
  );
  const initialAlertsPerPage = parsePageSizeParam(
    getFirstSearchParamValue(resolvedSearchParams.alerts_per_page),
    LIST_PAGE_SIZE_OPTIONS,
    LIST_PAGE_SIZE_OPTIONS[0],
  );

  return (
    <SensorPageClient
      id={id}
      initialRange={initialRange}
      initialStartTime={initialStartTime}
      initialEndTime={initialEndTime}
      initialSampleEvery={initialSampleEvery}
      initialAlertsPage={initialAlertsPage}
      initialAlertsPerPage={initialAlertsPerPage}
    />
  );
}
