import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { ActiveAlertsTable } from "@/components/dashboard/active-alerts-table";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live sensor KPIs and real-time alerts.
        </p>
      </div>
      <KpiGrid />
      <ActiveAlertsTable />
    </div>
  );
}
