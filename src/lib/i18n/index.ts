/**
 * Minimal i18n layer.
 *
 * - All UI strings live in /messages/<locale>.json.
 * - `t("section.key", { vars })` resolves a dotted key and interpolates {placeholders}.
 * - Only English ships in the MVP; adding Arabic means adding messages/ar.json,
 *   registering it in `dictionaries`, and setting <html dir="rtl"> via `dir(locale)`.
 *
 * Deliberately dependency-free so the same helper works in Server and Client Components.
 */
import en from "../../../messages/en.json";

export type Locale = "en" | "ar";
export const defaultLocale: Locale = "en";

type Dictionary = typeof en;
const dictionaries: Record<Locale, Dictionary | null> = {
  en,
  ar: null, // Not yet translated. Falls back to English.
};

export function dir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

type Vars = Record<string, string | number>;

function resolve(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

/** Translate a string key. Returns the key itself if missing so gaps are visible, not silent. */
export function t(key: string, vars?: Vars, locale: Locale = defaultLocale): string {
  const dict = dictionaries[locale] ?? dictionaries[defaultLocale];
  const value = resolve(dict, key) ?? resolve(dictionaries[defaultLocale], key);
  if (typeof value !== "string") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing or non-string key: ${key}`);
    }
    return key;
  }
  return interpolate(value, vars);
}

/** Return a structured (non-string) message, e.g. a list of steps. */
export function tList<T = unknown>(key: string, locale: Locale = defaultLocale): T[] {
  const dict = dictionaries[locale] ?? dictionaries[defaultLocale];
  const value = resolve(dict, key) ?? resolve(dictionaries[defaultLocale], key);
  return Array.isArray(value) ? (value as T[]) : [];
}
