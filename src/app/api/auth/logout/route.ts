import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/config/constants";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set({ name: AUTH_COOKIE_NAME, value: "", ...cookieBase });
  response.cookies.set({ name: REFRESH_COOKIE_NAME, value: "", ...cookieBase });
  return response;
}
