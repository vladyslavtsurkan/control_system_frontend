import { api } from "@/store/api/base-api";
import type { User } from "@/features/auth/types";

const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => "/v1/users/me",
      providesTags: ["Me"],
    }),
  }),
  overrideExisting: true,
});

export const { useGetMeQuery } = authApi;
