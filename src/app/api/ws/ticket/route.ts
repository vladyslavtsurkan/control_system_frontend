import { type NextRequest, NextResponse } from "next/server";
import { BACKEND_API_URL, AUTH_COOKIE_NAME, TENANT_COOKIE_NAME } from "@/config/constants";

// Fetches a single-use WS ticket from the backend and returns it to the client.
// The JWT and tenant ID never leave the server — the browser only receives the short-lived ticket.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const tenantId =
    req.headers.get("X-Tenant-ID") ?? req.cookies.get(TENANT_COOKIE_NAME)?.value;

  // Backend uses POST /ws/ticket with X-Tenant-ID header
  const backendRes = await fetch(`${BACKEND_API_URL}/ws/ticket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
    },
    cache: "no-store",
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}
