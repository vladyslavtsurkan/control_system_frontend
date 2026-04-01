import { type NextRequest, NextResponse } from "next/server";
import {
  BACKEND_API_URL,
  AUTH_COOKIE_NAME,
  TENANT_COOKIE_NAME,
} from "@/config/constants";

// Catch-all proxy: /api/proxy/v1/... → BACKEND_API_URL/api/v1/...
// Reads the httpOnly access-token cookie and injects Authorization header server-side.
// Also forwards X-Tenant-ID header required by all tenant-scoped endpoints.

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const { path } = await params;
  const backendPath = path.join("/");

  // Preserve the original query string
  const { search } = new URL(req.url);
  const backendUrl = `${BACKEND_API_URL}/api/${backendPath}${search}`;

  // Forward X-Tenant-ID: prefer the header (set by RTK Query prepareHeaders),
  // fall back to the iiot_tenant_id cookie (set by auth-slice.setActiveOrg).
  const tenantId =
    req.headers.get("X-Tenant-ID") ??
    req.cookies.get(TENANT_COOKIE_NAME)?.value ??
    null;

  // Read the body as text to avoid the "detached ArrayBuffer" Node.js bug
  // that occurs when fetch internally consumes the underlying buffer before
  // we pass it on. Text is re-encoded to UTF-8 bytes by the downstream fetch.
  const HAS_BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);
  let bodyText: string | undefined;
  const contentType = req.headers.get("content-type");
  if (HAS_BODY_METHODS.has(req.method)) {
    try {
      bodyText = await req.text();
    } catch {
      bodyText = undefined;
    }
  }

  const backendRes = await fetch(backendUrl, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(contentType ? { "Content-Type": contentType } : {}),
      ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
    },
    // Only attach body when there is actual content — empty string body on
    // DELETE / GET is rejected by some HTTP/1.1 servers.
    body: bodyText !== undefined && bodyText.length > 0 ? bodyText : undefined,
  });

  // 204 No Content has no body — return empty response
  if (backendRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const responseContentType = backendRes.headers.get("content-type") ?? "";
  const responseBody = responseContentType.includes("application/json")
    ? await backendRes.json()
    : await backendRes.text();

  if (responseContentType.includes("application/json")) {
    return NextResponse.json(responseBody, { status: backendRes.status });
  }

  return new NextResponse(
    typeof responseBody === "string" ? responseBody : String(responseBody),
    {
      status: backendRes.status,
      headers: responseContentType
        ? { "content-type": responseContentType }
        : undefined,
    },
  );
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
