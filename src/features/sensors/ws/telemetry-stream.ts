export interface LiveTelemetryPoint {
  sensorId: string;
  value: number;
  time: string;
}

type TelemetryListener = (point: LiveTelemetryPoint) => void;

const listeners = new Set<TelemetryListener>();

export function publishTelemetryPoint(point: LiveTelemetryPoint): void {
  for (const listener of listeners) {
    listener(point);
  }
}

export function subscribeTelemetry(listener: TelemetryListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
