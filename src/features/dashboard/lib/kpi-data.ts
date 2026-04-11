import type { LiveKpi, Sensor, SensorReading } from "@/features/sensors";

function parseTimeMs(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toChartData(sensor: Sensor): SensorReading[] {
  if (!sensor.readings) return [];

  const { times, values } = sensor.readings;
  const maxLen = Math.min(times.length, values.length);

  if (times.length !== values.length) {
    console.warn("[Sensors] Prefetched readings are misaligned; truncating.", {
      sensorId: sensor.id,
      timesLength: times.length,
      valuesLength: values.length,
      truncatedTo: maxLen,
    });
  }

  return Array.from({ length: maxLen }, (_, index) => ({
    sensor_id: sensor.id,
    time: times[index],
    value: values[index],
  }));
}

export function mergeByTimestamp(
  historical: SensorReading[],
  liveTail: SensorReading[] | undefined,
): SensorReading[] {
  if (!liveTail || liveTail.length === 0) {
    return historical;
  }

  const byTime = new Map<string, SensorReading>();
  for (const point of historical) byTime.set(point.time, point);
  for (const point of liveTail) byTime.set(point.time, point);

  return Array.from(byTime.values()).sort(
    (a, b) => Date.parse(a.time) - Date.parse(b.time),
  );
}

export function getLatestReading(
  readings: SensorReading[],
): SensorReading | undefined {
  let latest: SensorReading | undefined;
  let latestMs = Number.NEGATIVE_INFINITY;

  for (const reading of readings) {
    const ms = parseTimeMs(reading.time);
    if (ms === null || ms <= latestMs) {
      continue;
    }
    latest = reading;
    latestMs = ms;
  }

  return latest;
}

export function buildFallbackKpi(
  sensorId: string,
  reading: SensorReading | undefined,
): LiveKpi | undefined {
  if (!reading) {
    return undefined;
  }

  return {
    sensor_id: sensorId,
    value: reading.value,
    time: reading.time,
  };
}

export function upsertLiveReading(
  currentReadings: SensorReading[],
  point: SensorReading,
  windowMs: number,
): SensorReading[] {
  const pointMs = parseTimeMs(point.time);
  if (pointMs === null) {
    return currentReadings;
  }

  const next = [...currentReadings];
  const existingIdx = next.findIndex((item) => item.time === point.time);
  if (existingIdx >= 0) {
    next[existingIdx] = point;
  } else {
    const last = next[next.length - 1];
    const lastMs = last ? parseTimeMs(last.time) : null;

    if (lastMs !== null && pointMs >= lastMs) {
      next.push(point);
    } else {
      let insertAt = next.length;
      while (insertAt > 0) {
        const prevMs = parseTimeMs(next[insertAt - 1].time);
        if (prevMs !== null && prevMs <= pointMs) {
          break;
        }
        insertAt -= 1;
      }
      next.splice(insertAt, 0, point);
    }
  }

  const windowStartMs = pointMs - windowMs;
  let firstInWindow = 0;
  while (firstInWindow < next.length) {
    const ms = parseTimeMs(next[firstInWindow].time);
    if (ms !== null && ms >= windowStartMs) {
      break;
    }
    firstInWindow += 1;
  }

  return firstInWindow > 0 ? next.slice(firstInWindow) : next;
}
