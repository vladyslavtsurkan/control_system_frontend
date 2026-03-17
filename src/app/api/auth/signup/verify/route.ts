import { type NextRequest, NextResponse } from "next/server";
import { BACKEND_API_URL, AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/config/constants";
import type { SignUpVerifyResponse } from "@/features/auth/types";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const backendRes = await fetch(`${BACKEND_API_URL}/api/v1/auth/signup/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({ detail: "Signup verification failed" }));
    return NextResponse.json(error, { status: backendRes.status });
  }

  const { access_token, refresh_token } = (await backendRes.json()) as SignUpVerifyResponse;

  const meRes = await fetch(`${BACKEND_API_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!meRes.ok) {
    const error = await meRes.json().catch(() => ({ detail: "Could not load user profile" }));
    return NextResponse.json(error, { status: meRes.status });
  }

  const user = await meRes.json();
  const response = NextResponse.json({ user }, { status: 201 });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieBase = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
  };

  response.cookies.set({ name: AUTH_COOKIE_NAME, value: access_token, ...cookieBase, maxAge: 60 * 60 * 24 * 7 });
  response.cookies.set({ name: REFRESH_COOKIE_NAME, value: refresh_token, ...cookieBase, maxAge: 60 * 60 * 24 * 30 });

  return response;
}

