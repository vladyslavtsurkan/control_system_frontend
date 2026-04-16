import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import OrganizationsPageClient from "@/features/organizations/components/organizations-page-client";
import {
  getFirstSearchParamValue,
  parsePageSizeParam,
  parsePositiveIntParam,
  type SearchParamValue,
} from "@/lib/utils";
import { LIST_PAGE_SIZE_OPTIONS } from "@/config/constants";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <OrganizationsPageClient
        initialPage={initialPage}
        initialPerPage={initialPerPage}
      />
    </div>
  );
}
