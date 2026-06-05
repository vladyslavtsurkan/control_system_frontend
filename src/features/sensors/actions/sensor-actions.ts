"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE_NAME, BACKEND_API_URL, TENANT_COOKIE_NAME } from "@/config/constants";
import type {
  Sensor,
  SensorCreateRequest,
  SensorUpdateRequest,
  SensorControlResponse,
} from "@/features/sensors/types";
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

export async function createSensor(
  body: SensorCreateRequest,
): Promise<ActionResponse<Sensor>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/sensors/`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to create sensor" };
    }

    const data = await res.json();
    revalidatePath("/sensors");
    revalidatePath("/");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to create sensor" };
  }
}

export async function updateSensor(
  id: string,
  body: Omit<SensorUpdateRequest, "id">,
): Promise<ActionResponse<Sensor>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/sensors/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to update sensor" };
    }

    const data = await res.json();
    revalidatePath("/sensors");
    revalidatePath("/");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to update sensor" };
  }
}

export async function deleteSensor(id: string): Promise<ActionResponse<void>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/sensors/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to delete sensor" };
    }

    revalidatePath("/sensors");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to delete sensor" };
  }
}

export async function sendControlCommand(
  sensorId: string,
  value: number | boolean | string,
): Promise<ActionResponse<SensorControlResponse>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/sensors/${sensorId}/control`, {
      method: "POST",
      headers,
      body: JSON.stringify({ value }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to send control command", status: res.status };
    }

    const data = await res.json();
    revalidatePath("/");
    revalidatePath("/sensors");
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to send control command" };
  }
}
