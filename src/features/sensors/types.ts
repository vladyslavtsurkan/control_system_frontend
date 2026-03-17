export const BUCKET_INTERVAL_VALUES = [
  "1 second",
  "2 seconds",
  "5 seconds",
  "10 seconds",
  "15 seconds",
  "30 seconds",
  "1 minute",
  "5 minutes",
  "15 minutes",
  "30 minutes",
  "1 hour",
] as const;

export type BucketInterval = (typeof BUCKET_INTERVAL_VALUES)[number];

export const DEFAULT_BUCKET_INTERVAL: BucketInterval = "10 seconds";

export const SENSOR_DATA_TYPES = ["numeric", "boolean", "string"] as const;

export type SensorDataType = (typeof SENSOR_DATA_TYPES)[number];

export interface ReadingsBucketedResponse {
  times: string[];
  values: number[];
}

export interface Sensor {
  id: string;
  created_at: string;
  opc_server_id: string;
  name: string;
  description: string | null;
  node_id: string;
  data_type: SensorDataType;
  units: string | null;
  readings?: ReadingsBucketedResponse | null;
}

export interface GetSensorsParams {
  opcServerId?: string;
  offset?: number;
  limit?: number;
  prefetchReadings?: boolean;
  prefetchWindowMinutes?: number;
}

export interface CreateSensorRequest {
  opc_server_id: string;
  name: string;
  description?: string | null;
  node_id: string;
  data_type: SensorDataType;
  units?: string | null;
}

export interface UpdateSensorRequest {
  id: string;
  name?: string | null;
  description?: string | null;
  node_id?: string | null;
  data_type?: SensorDataType;
  units?: string | null;
}

export interface GetReadingsParams {
  sensorId: string;
  startTime?: string;
  endTime?: string;
  bucketInterval?: BucketInterval;
}

export interface SensorReading {
  time: string;
  value: number;
  sensor_id: string;
}

export interface GetSensorReadingsParams {
  sensorId: string;
  from?: string;
  to?: string;
  bucketInterval?: BucketInterval;
}

export interface LiveKpi {
  sensor_id: string;
  value: number;
  time: string;
}

