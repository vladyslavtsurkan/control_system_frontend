"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE_NAME, BACKEND_API_URL, TENANT_COOKIE_NAME } from "@/config/constants";
import type {
  OpcServer,
  CreateOpcServerRequest,
  UpdateOpcServerRequest,
  ApiKeyCreateResponse,
} from "@/features/servers/types";
import type { ActionResponse } from "@/features/alerts";
import { createServerSchema, updateServerSchema } from "../schemas";

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

export async function createServer(
  body: CreateOpcServerRequest,
): Promise<ActionResponse<OpcServer>> {
  const parsed = createServerSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/opc-servers/`, {
      method: "POST",
      headers,
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to create server" };
    }

    const data = await res.json();
    revalidatePath("/servers");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create server" };
  }
}

export async function updateServer(
  id: string,
  body: Omit<UpdateOpcServerRequest, "id">,
): Promise<ActionResponse<OpcServer>> {
  const parsed = updateServerSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/opc-servers/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to update server" };
    }

    const data = await res.json();
    revalidatePath("/servers");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update server" };
  }
}


export async function deleteServer(id: string): Promise<ActionResponse<void>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/opc-servers/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to delete server" };
    }

    revalidatePath("/servers");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete server" };
  }
}

export async function createApiKey(
  serverId: string,
): Promise<ActionResponse<ApiKeyCreateResponse>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(
      `${BACKEND_API_URL}/api/v1/opc-servers/${serverId}/api-keys`,
      {
        method: "POST",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to generate API key" };
    }

    const data = await res.json();
    revalidatePath("/servers");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to generate API key" };
  }
}

export async function revokeApiKey(
  serverId: string,
  keyId: string,
): Promise<ActionResponse<void>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(
      `${BACKEND_API_URL}/api/v1/opc-servers/${serverId}/api-keys/${keyId}`,
      {
        method: "DELETE",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to revoke API key" };
    }

    revalidatePath("/servers");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to revoke API key" };
  }
}
