import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { KpiGrid } from "@/features/dashboard/components/kpi-grid";
import { ActiveAlertsTable } from "@/features/alerts/components/active-alerts-table";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/config/constants";
import type { Sensor } from "@/features/sensors/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  let initialData: PaginatedResponse<Sensor> | null = null;

  if (token) {
    try {
      const params = new URLSearchParams({
        is_writable: "false",
        prefetch_readings: "true",
        prefetch_window_minutes: "15",
        offset: "0",
        limit: "100",
      });

      const res = await fetch(`${BACKEND_API_URL}/api/v1/sensors/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.ok) {
        initialData = await res.json();
      }
    } catch (e) {
      console.error("Failed to prefetch dashboard sensors data", e);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <KpiGrid initialData={initialData} />
      <ActiveAlertsTable />
    </div>
  );
}

