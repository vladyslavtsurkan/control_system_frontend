"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/config/constants";
import type { User, UserUpdateRequest } from "@/features/auth/types";
import type { ActionResponse } from "@/features/alerts";
import { updateMeSchema } from "../schemas";

async function getHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function updateMe(
  body: UserUpdateRequest,
): Promise<ActionResponse<User>> {
  const parsed = updateMeSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_API_URL}/api/v1/users/`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText || "Failed to update profile" };
    }

    const data = await res.json();
    revalidatePath("/");
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update profile" };
  }
}

