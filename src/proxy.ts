import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  BACKEND_API_URL,
} from "@/config/constants";

// ─── Public routes that never require a valid token ──────────────────────────
const PUBLIC_PATHS = ["/login", "/signup"];

// ─── JWT helpers (no secret required — we only inspect the payload) ───────────

interface JwtPayload {
  exp?: number;
}

/**
 * Decode the payload section of a JWT without verifying the signature.
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // atob is available in Edge Runtime; replace URL-safe characters first.
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns true when the token is missing, malformed, or within 10 seconds of
 * expiry (buffer avoids clock-skew races between Edge and the API server).
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp - nowSeconds < 10;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const accessToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

  // ── Authenticated user visiting a public page → send them home ────────────
  if (isPublicPath) {
    if (accessToken && !isTokenExpired(accessToken)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // ── Protected route: no tokens at all → redirect to login ─────────────────
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ── Access token still valid → pass through ───────────────────────────────
  if (accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  // ── Access token expired (or missing) but refresh token exists → rotate ───
  if (refreshToken) {
    try {
      const refreshRes = await fetch(
        `${BACKEND_API_URL}/api/v1/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
      );

      if (!refreshRes.ok) {
        // Refresh failed (expired / revoked) → force re-login
        return NextResponse.redirect(new URL("/login", req.url));
      }

      const data = (await refreshRes.json()) as {
        access_token: string;
        refresh_token: string;
      };

      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token;

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      };

      // Mutate the incoming request so downstream Server Components see the
      // fresh access token immediately (without waiting for a round-trip).
      req.cookies.set(AUTH_COOKIE_NAME, newAccessToken);

      // Build the forward-to-origin response and stamp the rotated cookies.
      const response = NextResponse.next({ request: req });
      response.cookies.set(AUTH_COOKIE_NAME, newAccessToken, cookieOptions);
      response.cookies.set(
        REFRESH_COOKIE_NAME,
        newRefreshToken,
        cookieOptions,
      );

      return response;
    } catch {
      // Network error during refresh — redirect to login rather than crash.
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ── No usable token at all → login ────────────────────────────────────────
  return NextResponse.redirect(new URL("/login", req.url));
}

// ─── Matcher ──────────────────────────────────────────────────────────────────
// Runs on every request except Next.js internals, static assets, and the
// built-in favicon so the Edge function stays lean.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api).*)"],
};
