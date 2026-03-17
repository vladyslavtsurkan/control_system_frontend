"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BUCKET_INTERVAL_VALUES,
  type BucketInterval,
} from "@/features/sensors/types";

export const SENSOR_RANGE_PRESETS = [
  { key: "15m", label: "Last 15m", ms: 15 * 60 * 1000 },
  { key: "1h", label: "Last 1h", ms: 60 * 60 * 1000 },
  { key: "3h", label: "Last 3h", ms: 3 * 60 * 60 * 1000 },
  { key: "6h", label: "Last 6h", ms: 6 * 60 * 60 * 1000 },
  { key: "24h", label: "Last 24h", ms: 24 * 60 * 60 * 1000 },
] as const;

export type SensorRangePresetKey = (typeof SENSOR_RANGE_PRESETS)[number]["key"] | "custom";

interface SensorReadingsFiltersCardProps {
  activePreset: SensorRangePresetKey;
  startTimeLocal: string;
  endTimeLocal: string;
  bucketInterval: BucketInterval;
  rangeError: string | null;
  maxWindowHours: number;
  onPresetChange: (value: SensorRangePresetKey) => void;
  onLiveMode: () => void;
  onUseNowAsEndTime: () => void;
  onClear: () => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onBucketIntervalChange: (value: BucketInterval) => void;
}

export function SensorReadingsFiltersCard({
  activePreset,
  startTimeLocal,
  endTimeLocal,
  bucketInterval,
  rangeError,
  maxWindowHours,
  onPresetChange,
  onLiveMode,
  onUseNowAsEndTime,
  onClear,
  onStartTimeChange,
  onEndTimeChange,
  onBucketIntervalChange,
}: SensorReadingsFiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Readings Filters</CardTitle>
        <CardDescription>
          Use presets for speed or pick custom local dates. Leave end time empty for live mode. Maximum window is {maxWindowHours} hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={activePreset} onValueChange={(value) => onPresetChange(value as SensorRangePresetKey)}>
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SENSOR_RANGE_PRESETS.map((preset) => (
                <SelectItem key={preset.key} value={preset.key}>
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={endTimeLocal === "" ? "default" : "outline"}
            className="h-8 px-3 text-xs"
            onClick={onLiveMode}
          >
            Live
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-8 px-3 text-xs"
            onClick={onUseNowAsEndTime}
          >
            End = now
          </Button>

          <Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={onClear}>
            Clear
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="start-time">Start time (optional)</Label>
            <Input
              id="start-time"
              type="datetime-local"
              value={startTimeLocal}
              onChange={(e) => onStartTimeChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">End time (optional)</Label>
            <Input
              id="end-time"
              type="datetime-local"
              value={endTimeLocal}
              onChange={(e) => onEndTimeChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bucket-interval">Bucket interval</Label>
            <Select value={bucketInterval} onValueChange={(value) => onBucketIntervalChange(value as BucketInterval)}>
              <SelectTrigger id="bucket-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUCKET_INTERVAL_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Display/edit uses local time; requests are sent as UTC ISO.
        </p>

        {rangeError ? <p className="text-sm text-red-600">{rangeError}</p> : null}
      </CardContent>
    </Card>
  );
}

