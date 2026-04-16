"use server";

import { cookies } from "next/headers";
import { SUPPORTED_LOCALES } from "./locales";

export async function setLocale(locale: string) {
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
