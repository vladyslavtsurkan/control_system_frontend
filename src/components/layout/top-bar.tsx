"use client";

import { Moon, Sun, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/store/hooks";
import { selectUser } from "@/store/selectors";
import { useLogout } from "@/store/use-logout";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const user = useAppSelector(selectUser);
  const handleLogout = useLogout();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="flex-1 text-sm font-medium text-muted-foreground">
        Industrial IoT Platform
      </span>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      {/* User menu */}
      <DropdownMenu>
        {/* Inline trigger content — DropdownMenuTrigger already renders a <button>,
            so we must NOT nest another <Button> inside it */}
        <DropdownMenuTrigger className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none" aria-label="User menu">
          <User className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* User info — plain div; DropdownMenuLabel (GroupLabel) requires a Group */}
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">
              {user
                ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
                : "User"}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 dark:text-red-400"
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
