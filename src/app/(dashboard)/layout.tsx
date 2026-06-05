import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ReduxHydrator } from "@/providers/redux-hydrator";
import { AUTH_COOKIE_NAME, BACKEND_API_URL } from "@/config/constants";
import type { User } from "@/features/auth/types";
import type { OrganizationWithRole } from "@/features/organizations/types";
import type { PaginatedResponse } from "@/shared/types/pagination";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Middleware already guarantees a valid token here, but we still guard
  // defensively so TypeScript is happy and the page fails gracefully.
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const authHeader = { Authorization: `Bearer ${token}` };

  // Parallel server-to-server fetches — no extra round-trips from the browser.
  const [meRes, orgsRes] = await Promise.all([
    fetch(`${BACKEND_API_URL}/api/v1/users/me`, {
      headers: authHeader,
      cache: "no-store",
    }),
    fetch(`${BACKEND_API_URL}/api/v1/organizations/`, {
      headers: authHeader,
      cache: "no-store",
    }),
  ]);

  if (!meRes.ok) {
    redirect("/login");
  }

  const user = (await meRes.json()) as User;
  const orgsData = orgsRes.ok
    ? ((await orgsRes.json()) as PaginatedResponse<OrganizationWithRole>)
    : { items: [] as OrganizationWithRole[] };

  return (
    <ReduxHydrator user={user} initialOrgs={orgsData.items}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopBar />
          <main className="flex flex-1 flex-col gap-4 p-4 pt-4">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ReduxHydrator>
  );
}
