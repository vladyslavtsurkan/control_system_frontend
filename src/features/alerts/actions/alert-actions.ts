"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/config/constants";
import type {
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
  AlertRule,
  Alert,
} from "@/features/alerts/types";
import { createAlertRuleSchema, updateAlertRuleSchema } from "../schemas";

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      status?: number;
      fieldErrors?: Record<string, string[] | undefined>;
    };

async function getHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function createAlertRule(
  body: CreateAlertRuleRequest,
 ): Promise<ActionResponse<AlertRule>> {
  const parsed = createAlertRuleSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/alert-rules/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...parsed.data,
        duration_seconds: parsed.data.duration_seconds ?? 0,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to create alert rule" };
    }

    const data = await res.json();
    revalidatePath("/alerts");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create alert rule" };
  }
}

export async function updateAlertRule(
  id: string,
  body: UpdateAlertRuleRequest,
): Promise<ActionResponse<AlertRule>> {
  const parsed = updateAlertRuleSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/alert-rules/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to update alert rule" };
    }

    const data = await res.json();
    revalidatePath("/alerts");

    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update alert rule" };
  }
}

export async function deleteAlertRule(id: string): Promise<ActionResponse<void>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/alert-rules/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to delete alert rule" };
    }

    revalidatePath("/alerts");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete alert rule" };
  }
}

export async function acknowledgeAlert(alertId: string): Promise<ActionResponse<Alert>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(
      `${BACKEND_API_URL}/api/v1/alerts/${alertId}/acknowledge`,
      {
        method: "POST",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to acknowledge alert" };
    }

    const data = await res.json();
    revalidatePath("/");
    revalidatePath("/alerts");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to acknowledge alert" };
  }
}

export async function resolveAlert(alertId: string): Promise<ActionResponse<Alert>> {
  try {
    const headers = await getHeaders();
    const res = await fetch(
      `${BACKEND_API_URL}/api/v1/alerts/${alertId}/resolve`,
      {
        method: "POST",
        headers,
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to resolve alert" };
    }

    const data = await res.json();
    revalidatePath("/");
    revalidatePath("/alerts");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to resolve alert" };
  }
}
