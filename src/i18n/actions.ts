"use server";

import { cookies } from "next/headers";

const SUPPORTED_LOCALES = ["en", "uk"];

export async function setLocale(locale: string) {
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
