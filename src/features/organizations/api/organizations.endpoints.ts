import { api } from "@/store/api/base-api";
import type {
  OrganizationWithRole,
  OrganizationMember,
} from "@/features/organizations/types";
import type {
  PaginatedResponse,
  PaginationQueryParams,
} from "@/shared/types/pagination";

const organizationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizations: builder.query<
      PaginatedResponse<OrganizationWithRole>,
      PaginationQueryParams | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.offset != null) params.set("offset", String(args.offset));
        if (args?.limit != null) params.set("limit", String(args.limit));
        const qs = params.toString();
        return `/v1/organizations/${qs ? `?${qs}` : ""}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Orgs" as const, id })),
              { type: "Orgs", id: "LIST" },
            ]
          : [{ type: "Orgs", id: "LIST" }],
    }),

    getOrganizationMembers: builder.query<
      PaginatedResponse<OrganizationMember>,
      string
    >({
      query: (orgId) => `/v1/organizations/${orgId}/members`,
      providesTags: (_r, _e, orgId) => [
        { type: "Orgs", id: `MEMBERS-${orgId}` },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetOrganizationsQuery,
  useGetOrganizationMembersQuery,
} = organizationsApi;
