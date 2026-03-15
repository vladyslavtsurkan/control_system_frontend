import { api } from "@/store/api/base-api";
import type {
  OrganizationWithRole,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationMember,
  UserRoleInOrg,
} from "@/features/organizations/types";
import type { PaginatedResponse, PaginationQueryParams } from "@/shared/types/pagination";

const organizationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizations: builder.query<PaginatedResponse<OrganizationWithRole>, PaginationQueryParams | void>({
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

    createOrganization: builder.mutation<OrganizationWithRole, CreateOrganizationRequest>({
      query: (body) => ({ url: "/v1/organizations/", method: "POST", body }),
      invalidatesTags: [{ type: "Orgs", id: "LIST" }],
    }),

    updateOrganization: builder.mutation<OrganizationWithRole, UpdateOrganizationRequest & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/v1/organizations/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Orgs", id }],
    }),

    deleteOrganization: builder.mutation<void, string>({
      query: (id) => ({ url: `/v1/organizations/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Orgs", id: "LIST" }],
    }),

    leaveOrganization: builder.mutation<void, string>({
      query: (id) => ({ url: `/v1/organizations/${id}/leave`, method: "POST" }),
      invalidatesTags: [{ type: "Orgs", id: "LIST" }],
    }),

    getOrganizationMembers: builder.query<PaginatedResponse<OrganizationMember>, string>({
      query: (orgId) => `/v1/organizations/${orgId}/members`,
      providesTags: (_r, _e, orgId) => [{ type: "Orgs", id: `MEMBERS-${orgId}` }],
    }),

    addOrganizationMember: builder.mutation<void, { orgId: string; userId: string }>({
      query: ({ orgId, userId }) => ({
        url: `/v1/organizations/${orgId}/add/${userId}`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { orgId }) => [{ type: "Orgs", id: `MEMBERS-${orgId}` }],
    }),

    removeOrganizationMember: builder.mutation<void, { orgId: string; userId: string }>({
      query: ({ orgId, userId }) => ({
        url: `/v1/organizations/${orgId}/remove/${userId}`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { orgId }) => [{ type: "Orgs", id: `MEMBERS-${orgId}` }],
    }),

    changeOrganizationMemberRole: builder.mutation<void, { orgId: string; userId: string; role: UserRoleInOrg }>({
      query: ({ orgId, userId, role }) => ({
        url: `/v1/organizations/${orgId}/members/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (_r, _e, { orgId }) => [
        { type: "Orgs", id: `MEMBERS-${orgId}` },
        { type: "Orgs", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrganizationsQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useLeaveOrganizationMutation,
  useGetOrganizationMembersQuery,
  useAddOrganizationMemberMutation,
  useRemoveOrganizationMemberMutation,
  useChangeOrganizationMemberRoleMutation,
} = organizationsApi;


