import type { Metadata } from "next";
import ServersPageClient from "@/features/servers/components/servers-page-client";
import {
  getFirstSearchParamValue,
  parsePageSizeParam,
  parsePositiveIntParam,
  type SearchParamValue,
} from "@/lib/utils";
import { LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";

export const metadata: Metadata = {
  title: "OPC UA Servers | IIoT Platform",
  description: "Manage your industrial OPC UA server connections.",
};

interface ServersPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function ServersPage({ searchParams }: ServersPageProps) {
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
        <h1 className="text-2xl font-semibold tracking-tight">
          OPC UA Servers
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your industrial OPC UA server connections.
        </p>
      </div>
      <ServersPageClient
        initialPage={initialPage}
        initialPerPage={initialPerPage}
      />
    </div>
  );
}
