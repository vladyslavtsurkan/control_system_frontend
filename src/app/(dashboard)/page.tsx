import { getTranslations } from "next-intl/server";
import { KpiGrid } from "@/features/dashboard/components/kpi-grid";
import { ActiveAlertsTable } from "@/features/alerts/components/active-alerts-table";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <KpiGrid />
      <ActiveAlertsTable />
    </div>
  );
}
