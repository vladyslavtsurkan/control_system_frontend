import type { AlertSeverity } from "@/features/alerts";
import type { SensorReading } from "@/features/sensors/types";

export interface EditSensorFormState {
  name: string;
  description: string;
  node_id: string;
  units: string;
}

export interface SensorReadingsStatsData {
  min: number;
  max: number;
  avg: number;
  latest: SensorReading;
  count: number;
}

export type SensorAlertRow = {
  key: string;
  source: "rest" | "live";
  restAlertId?: string;
  ruleId: string | null;
  message: string;
  severity?: AlertSeverity;
  status: "active" | "resolved";
  // null means the row is websocket-only and ack state is unknown until REST sync.
  isAcknowledged: boolean | null;
  triggeredAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

