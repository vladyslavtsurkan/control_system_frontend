import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import ServersPageClient from "@/features/servers/components/servers-page-client";
import {
  getFirstSearchParamValue,
  parsePageSizeParam,
  parsePositiveIntParam,
  type SearchParamValue,
} from "@/lib/utils";
import { LIST_PAGE_SIZE_OPTIONS, AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/config/constants";
import type { OpcServer } from "@/features/servers/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

export const metadata: Metadata = {
  title: "OPC UA Servers | IIoT Platform",
  description: "Manage your industrial OPC UA server connections.",
};

interface ServersPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function ServersPage({ searchParams }: ServersPageProps) {
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations("servers");
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

  let initialData: PaginatedResponse<OpcServer> | null = null;

  if (token) {
    try {
      const offset = (initialPage - 1) * initialPerPage;
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(initialPerPage),
      });

      const res = await fetch(`${BACKEND_API_URL}/api/v1/opc-servers/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.ok) {
        initialData = await res.json();
      }
    } catch (e) {
      console.error("Failed to prefetch servers", e);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ServersPageClient
        initialPage={initialPage}
        initialPerPage={initialPerPage}
        initialData={initialData}
      />
    </div>
  );
}

