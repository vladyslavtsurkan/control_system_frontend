import { type NextRequest, NextResponse } from "next/server";
import { BACKEND_API_URL, AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/config/constants";
import type { LoginResponse } from "@/types/models";

export async function POST(req: NextRequest) {
  // Body must be { email, password } — matches backend LoginRequest
  const body = await req.json();

  const backendRes = await fetch(`${BACKEND_API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({ detail: "Login failed" }));
    return NextResponse.json(error, { status: backendRes.status });
  }

  const { access_token, refresh_token } = (await backendRes.json()) as LoginResponse;

  // Fetch the user profile so we can hydrate Redux state (token stays server-side)
  const meRes = await fetch(`${BACKEND_API_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const user = await meRes.json();

  const response = NextResponse.json({ user }, { status: 200 });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieBase = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
  };

  // Access token cookie — 7 days (JWT exp controls actual validity)
  response.cookies.set({ name: AUTH_COOKIE_NAME, value: access_token, ...cookieBase, maxAge: 60 * 60 * 24 * 7 });

  // Refresh token cookie — 30 days
  response.cookies.set({ name: REFRESH_COOKIE_NAME, value: refresh_token, ...cookieBase, maxAge: 60 * 60 * 24 * 30 });

  return response;
}
