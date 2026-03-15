import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/features/auth/types";
import type { OrganizationWithRole } from "@/features/organizations/types";

const TENANT_COOKIE = "iiot_tenant_id";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  /** ID of the currently active organization (used as X-Tenant-ID header) */
  activeOrgId: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  activeOrgId: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    setAuthLoading(state) {
      state.status = "loading";
    },
    setActiveOrg(state, action: PayloadAction<OrganizationWithRole>) {
      state.activeOrgId = action.payload.id;
      // Persist to a plain (non-httpOnly) cookie so server-side BFF routes
      // (e.g. /api/ws/ticket) can read X-Tenant-ID without needing JS access.
      if (typeof document !== "undefined") {
        document.cookie = `${TENANT_COOKIE}=${action.payload.id}; path=/; SameSite=Strict`;
      }
    },
    /** Used during bootstrap only — sets the active org without triggering
     *  the listener that resets the RTK Query cache. */
    initActiveOrg(state, action: PayloadAction<string>) {
      state.activeOrgId = action.payload;
    },
    logout(state) {
      state.user = null;
      state.activeOrgId = null;
      state.status = "unauthenticated";
      if (typeof document !== "undefined") {
        document.cookie = `${TENANT_COOKIE}=; path=/; max-age=0`;
      }
    },
  },
});

export const { setUser, setAuthLoading, setActiveOrg, initActiveOrg, logout } = authSlice.actions;
export default authSlice.reducer;
