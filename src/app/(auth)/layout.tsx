import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      {children}
    </div>
  );
}
