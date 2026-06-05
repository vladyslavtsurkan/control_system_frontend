"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE_NAME, BACKEND_API_URL, TENANT_COOKIE_NAME } from "@/config/constants";
import type {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationWithRole,
  UserRoleInOrg,
} from "@/features/organizations/types";
import type { ActionResponse } from "@/features/alerts";

async function getHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const tenantId = cookieStore.get(TENANT_COOKIE_NAME)?.value;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
  };
}

export async function createOrganization(
  body: CreateOrganizationRequest,
): Promise<ActionResponse<OrganizationWithRole>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/organizations/`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to create organization" };
    }

    const data = await res.json();
    revalidatePath("/organizations");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create organization" };
  }
}

export async function updateOrganization(
  id: string,
  body: UpdateOrganizationRequest,
): Promise<ActionResponse<OrganizationWithRole>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/organizations/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to update organization" };
    }

    const data = await res.json();
    revalidatePath("/organizations");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update organization" };
  }
}

export async function deleteOrganization(id: string): Promise<ActionResponse<void>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/organizations/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to delete organization" };
    }

    revalidatePath("/organizations");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete organization" };
  }
}

export async function leaveOrganization(id: string): Promise<ActionResponse<void>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/organizations/${id}/leave`, {
      method: "POST",
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to leave organization" };
    }

    revalidatePath("/organizations");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to leave organization" };
  }
}

export async function addOrganizationMember(
  orgId: string,
  userId: string,
): Promise<ActionResponse<void>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(
      `${BACKEND_API_URL}/api/v1/organizations/${orgId}/add/${userId}`,
      {
        method: "POST",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to add member" };
    }

    revalidatePath("/organizations");
    revalidatePath("/audit-logs");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to add member" };
  }
}

export async function removeOrganizationMember(
  orgId: string,
  userId: string,
): Promise<ActionResponse<void>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(
      `${BACKEND_API_URL}/api/v1/organizations/${orgId}/remove/${userId}`,
      {
        method: "POST",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to remove member" };
    }

    revalidatePath("/organizations");
    revalidatePath("/audit-logs");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to remove member" };
  }
}

export async function changeOrganizationMemberRole(
  orgId: string,
  userId: string,
  role: UserRoleInOrg,
): Promise<ActionResponse<void>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(
      `${BACKEND_API_URL}/api/v1/organizations/${orgId}/members/${userId}/role`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ role }),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to change member role" };
    }

    revalidatePath("/organizations");
    revalidatePath("/audit-logs");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to change member role" };
  }
}
