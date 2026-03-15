import { api } from "@/store/api/base-api";
import type {
  Sensor,
  GetSensorsParams,
  CreateSensorRequest,
  UpdateSensorRequest,
  ReadingResponse,
  GetReadingsParams,
} from "@/features/sensors/types";
import type { PaginatedResponse, ItemsResponse } from "@/shared/types/pagination";

const sensorsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSensors: builder.query<PaginatedResponse<Sensor>, GetSensorsParams | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.opcServerId) params.set("opc_server_id", args.opcServerId);
        params.set("offset", String(args?.offset ?? 0));
        params.set("limit", String(args?.limit ?? 100));
        if (args?.prefetchReadings != null) {
          params.set("prefetch_readings", String(args.prefetchReadings));
        }
        if (args?.prefetchWindowMinutes != null) {
          params.set("prefetch_window_minutes", String(args.prefetchWindowMinutes));
        }
        return `/v1/sensors/?${params.toString()}`;
      },
      providesTags: (result, _e, args) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Sensors" as const, id })),
              { type: "Sensors", id: "LIST" },
              ...(args?.opcServerId ? [{ type: "Sensors" as const, id: `LIST-${args.opcServerId}` }] : []),
            ]
          : [
              { type: "Sensors", id: "LIST" },
              ...(args?.opcServerId ? [{ type: "Sensors" as const, id: `LIST-${args.opcServerId}` }] : []),
            ],
    }),

    getSensor: builder.query<Sensor, string>({
      query: (sensorId) => `/v1/sensors/${sensorId}`,
      providesTags: (_r, _e, sensorId) => [{ type: "Sensors", id: sensorId }],
    }),

    createSensor: builder.mutation<Sensor, CreateSensorRequest>({
      query: (body) => ({ url: "/v1/sensors/", method: "POST", body }),
      invalidatesTags: (_r, _e, { opc_server_id }) => [
        { type: "Sensors", id: "LIST" },
        { type: "Sensors", id: `LIST-${opc_server_id}` },
      ],
    }),

    updateSensor: builder.mutation<Sensor, UpdateSensorRequest>({
      query: ({ id, ...body }) => ({ url: `/v1/sensors/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Sensors", id }, { type: "Sensors", id: "LIST" }],
    }),

    deleteSensor: builder.mutation<void, string>({
      query: (id) => ({ url: `/v1/sensors/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Sensors", id: "LIST" }],
    }),

    getReadings: builder.query<ItemsResponse<ReadingResponse>, GetReadingsParams>({
      query: ({ sensorId, startTime, endTime, sampleEvery }) => {
        const params = new URLSearchParams({ sensor_id: sensorId });
        if (startTime) params.set("start_time", startTime);
        if (endTime) params.set("end_time", endTime);
        if (sampleEvery != null) params.set("sample_every", String(sampleEvery));
        return `/v1/readings/?${params.toString()}`;
      },
      providesTags: (_r, _e, { sensorId }) => [{ type: "Readings", id: sensorId }],
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



