"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { wsConnect, wsDisconnect } from "@/store/ws-slice";
import { setUser, setAuthLoading, initActiveOrg } from "@/store/auth-slice";
import { selectAuthStatus } from "@/store/selectors";
import type { User } from "@/features/auth/types";
import type { OrganizationWithRole } from "@/features/organizations/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

/** Read the persisted tenant cookie (written by setActiveOrg). */
function getPersistedTenantId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)iiot_tenant_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * AuthGuard — client component that handles the auth bootstrap lifecycle.
 * Verifies the session via BFF, loads orgs, connects WS, and redirects
 * to /login if unauthenticated. Shows a spinner while loading.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authStatus = useAppSelector(selectAuthStatus);

  useEffect(() => {
    const controller = new AbortController();

    async function bootstrap() {
      dispatch(setAuthLoading());
      try {
        // 1. Verify access token (BFF reads httpOnly cookie)
        const meRes = await fetch("/api/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!meRes.ok) {
          if (!controller.signal.aborted) {
            router.replace("/login");
          }
          return;
        }

        if (controller.signal.aborted) {
          return;
        }

        const user: User = await meRes.json();
        if (controller.signal.aborted) {
          return;
        }

        // 2. Load orgs and activate the last-used one (from cookie) or the first
        const orgsRes = await fetch("/api/proxy/v1/organizations/", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (orgsRes.ok) {
          const orgs: PaginatedResponse<OrganizationWithRole> =
            await orgsRes.json();
          if (controller.signal.aborted) {
            return;
          }

          if (orgs.items.length > 0) {
            const persistedId = getPersistedTenantId();
            const match =
              persistedId && orgs.items.find((o) => o.id === persistedId);
            // initActiveOrg sets the ID without triggering the cache-reset listener
            dispatch(initActiveOrg((match || orgs.items[0]).id));
          }
        }

        // Mark auth as ready only after tenant bootstrap is complete.
        dispatch(setUser(user));

        // 3. Open WebSocket connection
        dispatch(wsConnect());
      } catch {
        if (!controller.signal.aborted) {
          router.replace("/login");
        }
      }
    }
    bootstrap();

    return () => {
      controller.abort();
      dispatch(wsDisconnect());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authStatus === "idle" || authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-200" />
      </div>
    );
  }

  return <>{children}</>;
}
