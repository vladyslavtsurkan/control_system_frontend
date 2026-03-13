"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/auth-slice";
import { wsDisconnect } from "@/store/ws-slice";

/**
 * Shared logout hook — calls the BFF logout endpoint, clears Redux state,
 * disconnects the WebSocket, and navigates to /login.
 */
export function useLogout() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    dispatch(wsDisconnect());
    dispatch(logout());
    toast.success("Signed out successfully.");
    router.push("/login");
  }, [dispatch, router]);
}
