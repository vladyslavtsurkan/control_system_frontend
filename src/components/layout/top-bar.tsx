import { getTranslations } from "next-intl/server";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import type { User } from "@/features/auth/types";

interface TopBarProps {
  user: User;
}

export async function TopBar({ user }: TopBarProps) {
  const t = await getTranslations("topBar");

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="flex-1 text-sm font-medium text-muted-foreground">
        {t("title")}
      </span>

      {/* Language switcher */}
      <LanguageSwitcher />

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User menu */}
      <ProfileDropdown user={user} />
    </header>
  );
}
