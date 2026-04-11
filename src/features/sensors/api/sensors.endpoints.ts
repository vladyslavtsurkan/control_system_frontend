import { api } from "@/store/api/base-api";
import { DEFAULT_BUCKET_INTERVAL } from "@/features/sensors/types";
import type {
  Sensor,
  GetSensorsParams,
  SensorCreateRequest,
  SensorUpdateRequest,
  ReadingsBucketedResponse,
  GetReadingsParams,
} from "@/features/sensors/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

const sensorsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSensors: builder.query<
      PaginatedResponse<Sensor>,
      GetSensorsParams | void
    >({
      query: ({
        opcServerId,
        is_writable,
        isWritable,
        offset = 0,
        limit = 100,
        prefetchReadings,
        prefetchWindowMinutes,
      }: GetSensorsParams = {}) => {
        const params = new URLSearchParams();
        if (opcServerId) params.set("opc_server_id", opcServerId);
        const writableFilter = is_writable ?? isWritable;
        if (writableFilter != null)
          params.set("is_writable", String(writableFilter));
        params.set("offset", String(offset));
        params.set("limit", String(limit));
        if (prefetchReadings != null) {
          params.set("prefetch_readings", String(prefetchReadings));
        }
        if (prefetchWindowMinutes != null) {
          params.set("prefetch_window_minutes", String(prefetchWindowMinutes));
        }
        return `/v1/sensors/?${params.toString()}`;
      },
      providesTags: (result, _e, args) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Sensors" as const,
                id,
              })),
              { type: "Sensors", id: "LIST" },
              ...(args?.opcServerId
                ? [{ type: "Sensors" as const, id: `LIST-${args.opcServerId}` }]
                : []),
            ]
          : [
              { type: "Sensors", id: "LIST" },
              ...(args?.opcServerId
                ? [{ type: "Sensors" as const, id: `LIST-${args.opcServerId}` }]
                : []),
            ],
    }),

    getSensor: builder.query<Sensor, string>({
      query: (sensorId) => `/v1/sensors/${sensorId}`,
      providesTags: (_r, _e, sensorId) => [{ type: "Sensors", id: sensorId }],
    }),

    createSensor: builder.mutation<Sensor, SensorCreateRequest>({
      query: (body) => ({ url: "/v1/sensors/", method: "POST", body }),
      invalidatesTags: (_r, _e, { opc_server_id }) => [
        { type: "Sensors", id: "LIST" },
        { type: "Sensors", id: `LIST-${opc_server_id}` },
      ],
    }),

    updateSensor: builder.mutation<Sensor, SensorUpdateRequest>({
      query: ({ id, ...body }) => ({
        url: `/v1/sensors/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Sensors", id },
        { type: "Sensors", id: "LIST" },
      ],
    }),

    deleteSensor: builder.mutation<void, string>({
      query: (id) => ({ url: `/v1/sensors/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Sensors", id: "LIST" }],
    }),

    getReadings: builder.query<ReadingsBucketedResponse, GetReadingsParams>({
      query: ({
        sensorId,
        startTime,
        endTime,
        bucketInterval = DEFAULT_BUCKET_INTERVAL,
      }) => {
        const params = new URLSearchParams({ sensor_id: sensorId });
        if (startTime) params.set("start_time", startTime);
        if (endTime) params.set("end_time", endTime);
        params.set("bucket_interval", bucketInterval);
        return `/v1/readings/?${params.toString()}`;
      },
      providesTags: (_r, _e, { sensorId }) => [
        { type: "Readings", id: sensorId },
      ],
    }),
  }),
  overrideExisting: false,
});

export { sensorsApi };

export const {
  useGetSensorsQuery,
  useGetSensorQuery,
  useCreateSensorMutation,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
  useGetReadingsQuery,
} = sensorsApi;
