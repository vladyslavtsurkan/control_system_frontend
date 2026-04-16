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
import { LOCALE_META } from "@/i18n/locales";

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

  const current = LOCALE_META.find((l) => l.code === locale) ?? LOCALE_META[0];

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
        {LOCALE_META.map((l) => (
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
