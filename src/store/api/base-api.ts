import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store";

const TAGS = [
  "Me",
  "Orgs",
  "Servers",
  "Sensors",
  "Readings",
  "Alerts",
  "AlertRules",
] as const;

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/proxy",
    prepareHeaders: (headers, { getState }) => {
      const activeOrgId = (getState() as RootState).auth.activeOrgId;
      if (activeOrgId) {
        headers.set("X-Tenant-ID", activeOrgId);
      }
      return headers;
    },
  }),
  tagTypes: [...TAGS],
  endpoints: () => ({}),
});

