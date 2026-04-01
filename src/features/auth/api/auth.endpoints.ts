import { api } from "@/store/api/base-api";
import type { User, UserUpdateRequest } from "@/features/auth/types";

const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => "/v1/users/me",
      providesTags: ["Me"],
    }),
    updateMe: builder.mutation<User, UserUpdateRequest>({
      query: (body) => ({ url: "/v1/users/", method: "PATCH", body }),
      invalidatesTags: ["Me"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetMeQuery, useUpdateMeMutation } = authApi;
