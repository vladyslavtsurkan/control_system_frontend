"use client";

import { useRef, type ReactNode } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setUser, initActiveOrg } from "@/store/auth-slice";
import { wsConnect } from "@/store/ws-slice";
import type { User } from "@/features/auth/types";
import type { OrganizationWithRole } from "@/features/organizations/types";

interface ReduxHydratorProps {
  user: User;
  initialOrgs: OrganizationWithRole[];
  children: ReactNode;
}

/**
 * ReduxHydrator — a thin "use client" boundary that synchronously primes the
 * Redux store on the very first render, before any child paints.
 *
 * Dispatching in the render body (guarded by a ref) avoids the one-frame
 * flash that a useEffect would produce and prevents double-hydration in
 * React Strict Mode (the ref stays true after the first run).
 *
 * This component MUST be a direct child of ReduxProvider so it has access to
 * the store.
 */
export function ReduxHydrator({
  user,
  initialOrgs,
  children,
}: ReduxHydratorProps) {
  const dispatch = useAppDispatch();
  const hydrated = useRef(false);

  if (!hydrated.current) {
    dispatch(setUser(user));

    if (initialOrgs.length > 0) {
      dispatch(initActiveOrg(initialOrgs[0].id));
    }

    dispatch(wsConnect());

    hydrated.current = true;
  }

  return <>{children}</>;
}
