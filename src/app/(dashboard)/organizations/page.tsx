import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import OrganizationsPageClient from "@/features/organizations/components/organizations-page-client";
import {
  getFirstSearchParamValue,
  parsePageSizeParam,
  parsePositiveIntParam,
  type SearchParamValue,
} from "@/lib/utils";
import { LIST_PAGE_SIZE_OPTIONS, AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/config/constants";
import type { OrganizationWithRole } from "@/features/organizations/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

export const metadata: Metadata = {
  title: "Organizations | IIoT Platform",
  description: "Manage your organizations and memberships.",
};

interface OrganizationsPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function OrganizationsPage({
  searchParams,
}: OrganizationsPageProps) {
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations("organizations");
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

  let initialData: PaginatedResponse<OrganizationWithRole> | null = null;

  if (token) {
    try {
      const offset = (initialPage - 1) * initialPerPage;
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(initialPerPage),
      });

      const res = await fetch(`${BACKEND_API_URL}/api/v1/organizations/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.ok) {
        initialData = await res.json();
      }
    } catch (e) {
      console.error("Failed to prefetch organizations", e);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <OrganizationsPageClient
        initialPage={initialPage}
        initialPerPage={initialPerPage}
        initialData={initialData}
      />
    </div>
  );
}

