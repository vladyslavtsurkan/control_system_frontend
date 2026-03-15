"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  BellRing,
  Activity,
  Building2,
  ChevronDown,
  UserCircle,
  LogOut,
  Copy,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setActiveOrg, setUser } from "@/store/auth-slice";
import { useGetOrganizationsQuery, useUpdateMeMutation } from "@/store/api";
import { selectUser, selectActiveOrgId, selectWsStatus, selectActiveAlertCount } from "@/store/selectors";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { toast } from "sonner";
import type { OrganizationWithRole } from "@/features/organizations/types";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/servers", label: "OPC UA Servers", icon: Server },
  { href: "/sensors", label: "Sensors", icon: Activity },
  { href: "/alerts", label: "Alert Rules", icon: BellRing },
  { href: "/organizations", label: "Organizations", icon: Building2 },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function AppSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const activeOrgId = useAppSelector(selectActiveOrgId);
  const wsStatus = useAppSelector(selectWsStatus);
  const activeAlertCount = useAppSelector(selectActiveAlertCount);

  const { data: orgsData } = useGetOrganizationsQuery();
  const orgs = orgsData?.items ?? [];
  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0];

  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const handleLogout = useLogout();
  const [profileOpen, setProfileOpen] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "" });
  const orgSwitchToastIdRef = useRef<string | number | null>(null);
  const pendingOrgNameRef = useRef<string | null>(null);

  function openProfile() {
    setForm({
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
    });
    setProfileOpen(true);
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await updateMe({
        first_name: form.first_name || null,
        last_name: form.last_name || null,
      }).unwrap();
      dispatch(setUser(updated));
      toast.success("Profile updated.");
      setProfileOpen(false);
    } catch {
      toast.error("Failed to update profile.");
    }
  }


  function handleSwitchOrg(org: OrganizationWithRole) {
    if (org.id === activeOrgId) {
      return;
    }

    pendingOrgNameRef.current = org.name;
    orgSwitchToastIdRef.current = toast.loading(`Switching to ${org.name}...`);
    dispatch(setActiveOrg(org));
  }

  const isOrgSwitchPending = wsStatus === "connecting";

  useEffect(() => {
    if (orgSwitchToastIdRef.current == null) return;

    if (wsStatus === "connected") {
      const orgName = pendingOrgNameRef.current ?? activeOrg?.name ?? "selected organization";
      toast.success(`Switched to ${orgName}. Live stream reconnected.`, {
        id: orgSwitchToastIdRef.current,
      });
      orgSwitchToastIdRef.current = null;
      pendingOrgNameRef.current = null;
      return;
    }

    if (wsStatus === "error") {
      toast.error("Organization switched, but live stream reconnect failed.", {
        id: orgSwitchToastIdRef.current,
      });
      orgSwitchToastIdRef.current = null;
      pendingOrgNameRef.current = null;
    }
  }, [activeOrg?.name, wsStatus]);

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
    : "";

  const initials = user
    ? (
        [user.first_name, user.last_name]
          .filter(Boolean)
          .map((n) => n![0])
          .join("") || user.email[0]
      ).toUpperCase()
    : "?";

  const statusColor: Record<string, string> = {
    connected: "bg-green-500",
    connecting: "bg-yellow-400 animate-pulse",
    disconnected: "bg-zinc-400",
    error: "bg-red-500",
    idle: "bg-zinc-400",
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header — org switcher */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              {/* Render trigger content inline — avoids <button> inside <button> because
                  DropdownMenuTrigger (base-ui) already renders a <button> itself */}
              <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-1 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeOrg?.name ?? "Select organization"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeOrg ? ROLE_LABELS[activeOrg.role] : ""}
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
                      {ROLE_LABELS[org.role]}
                    </span>
                  </DropdownMenuItem>
                ))}
                {orgs.length === 0 && (
                  <DropdownMenuItem disabled>No organizations</DropdownMenuItem>
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

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
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
                    {href === "/" && activeAlertCount > 0 ? (
                      <span className="absolute -top-1 -right-1 inline-block size-2 rounded-full bg-red-500" />
                    ) : null}
                  </div>
                  <span>{label}</span>
                </SidebarMenuButton>
                {href === "/" && activeAlertCount > 0 ? (
                  <SidebarMenuBadge className="bg-red-500/15 text-red-700 dark:text-red-300">
                    {activeAlertCount > 99 ? "99+" : activeAlertCount}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — user menu + WS status */}
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-1 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none">
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <ChevronDown className="ml-auto size-4 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="top">
            <DropdownMenuItem onClick={openProfile}>
              <UserCircle className="mr-2 size-4" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 dark:text-red-400"
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
          <Activity className="size-3 shrink-0" />
          <span className="flex items-center gap-1.5 truncate">
            <span
              className={`inline-block size-2 shrink-0 rounded-full ${statusColor[wsStatus] ?? "bg-zinc-400"}`}
            />
            WS: {wsStatus}{isOrgSwitchPending ? " (switching org...)" : ""}
          </span>
        </div>
      </SidebarFooter>

      {/* Profile Edit Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                value={user?.email ?? ""}
                disabled
                className="opacity-60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-uuid">Your User ID</Label>
              <p className="text-xs text-muted-foreground">
                Share this ID so others can add you to their organization.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="profile-uuid"
                  value={user?.id ?? ""}
                  disabled
                  className="font-mono text-xs opacity-80"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.id ?? "");
                    toast.success("User ID copied to clipboard.");
                  }}
                  aria-label="Copy user ID"
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="profile-first">First Name</Label>
                <Input
                  id="profile-first"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-last">Last Name</Label>
                <Input
                  id="profile-last"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={saving}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
