"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocale } from "@/i18n/actions";

const LOCALES = [
  { code: "en", label: "English", short: "EN" },
  { code: "uk", label: "Українська", short: "УК" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("topBar");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(code: string) {
    startTransition(async () => {
      await setLocale(code);
      router.refresh();
    });
  }

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium hover:bg-accent focus-visible:outline-none disabled:opacity-50"
        aria-label={t("language")}
        disabled={isPending}
      >
        <Globe className="size-3.5" />
        {current.short}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleSelect(l.code)}
            className={l.code === locale ? "font-semibold" : ""}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
