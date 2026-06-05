"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Activity,
  BellRing,
  Building2,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Server,
  UserCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveOrg, setUser } from "@/store/auth-slice";
import { updateMe } from "@/features/auth/actions/auth-actions";
import {
  selectActiveAlertCount,
  selectActiveOrgId,
  selectUser,
  selectWsStatus,
} from "@/store/selectors";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { ProfileDialog } from "./profile-dialog";
import { toast } from "sonner";
import type { OrganizationWithRole } from "@/features/organizations/types";
import type { User } from "@/features/auth/types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Tailwind classes for the WebSocket status indicator dot. */
const WS_STATUS_COLOR: Record<string, string> = {
  connected: "bg-green-500",
  connecting: "bg-yellow-400 animate-pulse",
  disconnected: "bg-zinc-400",
  error: "bg-red-500",
  idle: "bg-zinc-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface AppSidebarProps {
  user: User;
  organizations: OrganizationWithRole[];
  currentOrg?: OrganizationWithRole;
}

export function AppSidebar({ user: initialUser, organizations, currentOrg }: AppSidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const t = useTranslations("nav");

  // ── Redux state ────────────────────────────────────────────────────────────
  const storeUser = useAppSelector(selectUser);
  const user = storeUser ?? initialUser;
  const activeOrgId = useAppSelector(selectActiveOrgId);
  const wsStatus = useAppSelector(selectWsStatus);
  const activeAlertCount = useAppSelector(selectActiveAlertCount);

  // ── Queries / mutations ───────────────────────────────────────────────────
  const [saving, startTransition] = useTransition();
  const handleLogout = useLogout();

  const orgs = organizations;
  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? currentOrg ?? orgs[0];

  // ── Profile dialog ────────────────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  // Incrementing this key remounts <ProfileDialog>, resetting its form state.
  const [profileKey, setProfileKey] = useState(0);

  const openProfile = useCallback(() => {
    setProfileKey((k) => k + 1);
    setProfileOpen(true);
  }, []);

  const handleProfileSave = useCallback(
    async (data: { first_name: string; last_name: string }) => {
      startTransition(async () => {
        try {
          const res = await updateMe({
            first_name: data.first_name || null,
            last_name: data.last_name || null,
          });
          if (res.success) {
            dispatch(setUser(res.data));
            toast.success(t("profileUpdated"));
            setProfileOpen(false);
          } else {
            toast.error(res.error || t("profileUpdateFailed"));
          }
        } catch {
          toast.error(t("profileUpdateFailed"));
        }
      });
    },
    [dispatch, t],
  );

  // ── Organisation switching ────────────────────────────────────────────────
  const orgSwitchToastIdRef = useRef<string | number | null>(null);
  const pendingOrgNameRef = useRef<string | null>(null);
  const isOrgSwitchPending = wsStatus === "connecting";

  const handleSwitchOrg = useCallback(
    (org: OrganizationWithRole) => {
      if (org.id === activeOrgId) return;
      pendingOrgNameRef.current = org.name;
      orgSwitchToastIdRef.current = toast.loading(
        t("switchingToOrg", { name: org.name }),
      );
      dispatch(setActiveOrg(org));
    },
    [activeOrgId, dispatch, t],
  );

  // Dismiss the "switching…" toast once the WS reconnects (or errors).
  useEffect(() => {
    if (orgSwitchToastIdRef.current == null) return;

    if (wsStatus === "connected") {
      const name =
        pendingOrgNameRef.current ?? activeOrg?.name ?? "selected organization";
      toast.success(t("switchedTo", { name }), {
        id: orgSwitchToastIdRef.current,
      });
      orgSwitchToastIdRef.current = null;
      pendingOrgNameRef.current = null;
    } else if (wsStatus === "error") {
      toast.error(t("switchFailed"), { id: orgSwitchToastIdRef.current });
      orgSwitchToastIdRef.current = null;
      pendingOrgNameRef.current = null;
    }
  }, [activeOrg?.name, wsStatus, t]);

  // ── Derived display values ────────────────────────────────────────────────
  const displayName = useMemo(
    () =>
      user
        ? [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          user.email
        : "",
    [user],
  );

  const initials = useMemo(() => {
    if (!user) return "?";
    const letters = [user.first_name, user.last_name]
      .filter(Boolean)
      .map((n) => n![0])
      .join("");
    return (letters || user.email[0]).toUpperCase();
  }, [user]);

  const navItems = useMemo(
    () => [
      { href: "/", label: t("dashboard"), icon: LayoutDashboard },
      { href: "/servers", label: t("servers"), icon: Server },
      { href: "/sensors", label: t("sensors"), icon: Activity },
      { href: "/alerts", label: t("alerts"), icon: BellRing },
      { href: "/organizations", label: t("organizations"), icon: Building2 },
    ],
    [t],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Sidebar collapsible="icon">
      {/* ── Header: organisation switcher ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-1 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeOrg?.name ?? t("selectOrganization")}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeOrg ? t(`roles.${activeOrg.role}`) : ""}
                  </span>
                </div>
                <ChevronDown className="ml-auto size-4" />
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="start">
                {orgs.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSwitchOrg(org)}
                    disabled={isOrgSwitchPending || org.id === activeOrg?.id}
                    className={org.id === activeOrg?.id ? "font-medium" : ""}
                  >
                    <Building2 className="mr-2 size-4" />
                    <span className="flex-1 truncate">{org.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t(`roles.${org.role}`)}
                    </span>
                  </DropdownMenuItem>
                ))}

                {orgs.length === 0 && (
                  <DropdownMenuItem disabled>
                    {t("noOrganizations")}
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  {displayName}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content: navigation ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("platform")}</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  isActive={pathname === href}
                  tooltip={label}
                  render={<Link href={href} />}
                >
                  <div className="relative">
                    <Icon className="size-4" />
                    {href === "/" && activeAlertCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-block size-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  <span>{label}</span>
                </SidebarMenuButton>

                {href === "/" && activeAlertCount > 0 && (
                  <SidebarMenuBadge className="bg-red-500/15 text-red-700 dark:text-red-300">
                    {activeAlertCount > 99 ? "99+" : activeAlertCount}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}

            {/* Audit log — owners and admins only */}
            {(activeOrg?.role === "owner" || activeOrg?.role === "admin") && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/audit-logs"}
                  tooltip={t("auditLog")}
                  render={<Link href="/audit-logs" />}
                >
                  <ClipboardList className="size-4" />
                  <span>{t("auditLog")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer: user menu + WS status ── */}
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-1 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none">
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </div>
            <div className="grid flex-1 min-w-0 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
            <ChevronDown className="ml-auto size-4 shrink-0" />
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="start" side="top">
            <DropdownMenuItem onClick={openProfile}>
              <UserCircle className="mr-2 size-4" />
              {t("editProfile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 dark:text-red-400"
            >
              <LogOut className="mr-2 size-4" />
              {t("logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* WebSocket connection status */}
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
          <Activity className="size-3 shrink-0" />
          <span className="flex items-center gap-1.5 truncate">
            <span
              className={`inline-block size-2 shrink-0 rounded-full ${
                WS_STATUS_COLOR[wsStatus] ?? "bg-zinc-400"
              }`}
            />
            {t("wsStatus", { status: wsStatus })}
            {isOrgSwitchPending && ` ${t("switchingOrg")}`}
          </span>
        </div>
      </SidebarFooter>

      {/* Profile edit dialog — remounted on open to reset form */}
      <ProfileDialog
        key={profileKey}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        saving={saving}
        onSave={handleProfileSave}
      />
    </Sidebar>
  );
}
