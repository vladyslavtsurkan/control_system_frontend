export const SUPPORTED_LOCALES = ["en", "uk", "de", "fr", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_META: { code: Locale; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "uk", label: "Українська", short: "УК" },
  { code: "de", label: "Deutsch", short: "DE" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "es", label: "Español", short: "ES" },
];
