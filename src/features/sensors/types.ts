export interface ReadingResponse {
  sensor_id: string;
  payload: Record<string, unknown>;
  time: string;
}

export interface Sensor {
  id: string;
  created_at: string;
  opc_server_id: string;
  name: string;
  description: string | null;
  node_id: string;
  units: string | null;
  readings?: ReadingResponse[] | null;
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
  units?: string | null;
}

export interface UpdateSensorRequest {
  id: string;
  name?: string | null;
  description?: string | null;
  node_id?: string | null;
  units?: string | null;
}

export interface GetReadingsParams {
  sensorId: string;
  startTime?: string;
  endTime?: string;
  sampleEvery?: number;
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
  sampleEvery?: number;
}

export interface LiveKpi {
  sensor_id: string;
  value: number;
  time: string;
}

