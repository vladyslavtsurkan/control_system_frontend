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
  is_writable: boolean;
  readings?: ReadingsBucketedResponse | null;
}

export interface GetSensorsParams {
  opcServerId?: string;
  is_writable?: boolean;
  isWritable?: boolean;
  offset?: number;
  limit?: number;
  prefetchReadings?: boolean;
  prefetchWindowMinutes?: number;
}

export interface SensorCreateRequest {
  opc_server_id: string;
  name: string;
  description?: string | null;
  node_id: string;
  data_type: SensorDataType;
  units?: string | null;
  is_writable?: boolean;
}

export interface SensorUpdateRequest {
  id: string;
  name?: string | null;
  description?: string | null;
  node_id?: string | null;
  data_type?: SensorDataType;
  units?: string | null;
  is_writable?: boolean;
}

export interface GetReadingsParams {
  sensorId: string;
  startTime?: string;
  endTime?: string;
  bucketInterval?: BucketInterval;
}

export interface SensorControlRequest {
  value: number | boolean | string;
}

export interface SensorControlResponse {
  status: string;
  command_id: string;
}

export interface SensorReading {
  time: string;
  value: number;
  sensor_id: string;
}

export interface LiveKpi {
  sensor_id: string;
  value: number;
  time: string;
}
