import { type NextRequest, NextResponse } from "next/server";
import { BACKEND_API_URL, AUTH_COOKIE_NAME } from "@/config/constants";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const backendRes = await fetch(`${BACKEND_API_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
