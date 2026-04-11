import type { Metadata } from "next";
import SensorPageClient from "@/features/sensors/components/sensor-page-client";
import { LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";
import {
  getFirstSearchParamValue,
  parsePageSizeParam,
  parsePositiveIntParam,
  parseBucketIntervalParam,
  type SearchParamValue,
} from "@/lib/utils";

interface SensorPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export async function generateMetadata({
  params,
}: SensorPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Sensor ${id} | IIoT Platform`,
    description: `Live readings and alert history for sensor ${id}.`,
  };
}

export default async function SensorPage({
  params,
  searchParams,
}: SensorPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const initialRange = getFirstSearchParamValue(resolvedSearchParams.range);
  const initialStartTime = getFirstSearchParamValue(
    resolvedSearchParams.start_time,
  );
  const initialEndTime = getFirstSearchParamValue(
    resolvedSearchParams.end_time,
  );
  const initialBucketInterval = parseBucketIntervalParam(
    getFirstSearchParamValue(resolvedSearchParams.bucket_interval),
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
      initialBucketInterval={initialBucketInterval}
      initialAlertsPage={initialAlertsPage}
      initialAlertsPerPage={initialAlertsPerPage}
    />
  );
}
