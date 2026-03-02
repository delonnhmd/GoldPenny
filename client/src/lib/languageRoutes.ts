export type AppLanguage = "en" | "es";

export const LANGUAGE_PREFERENCE_KEY = "preferredLanguage";

export const languageRoutePairs = [
  { en: "/", es: "/es" },
  { en: "/offers", es: "/es/ofertas" },
  { en: "/rates", es: "/es/noticias" },
  { en: "/smart-penny", es: "/es/smart-penny" },
  { en: "/loan-calculators", es: "/es/calculadoras-de-prestamos" },
  { en: "/affiliate-disclosure", es: "/es/divulgacion-afiliados" },
  { en: "/texas-cash-advance-apps-2026", es: "/es/apps-adelanto-efectivo-texas-2026" },
] as const;

export function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function inferLanguageFromPath(path: string): AppLanguage {
  return normalizePath(path).startsWith("/es") ? "es" : "en";
}

export function getMappedPath(path: string, language: AppLanguage) {
  const normalized = normalizePath(path);
  const pair = languageRoutePairs.find((item) => item.en === normalized || item.es === normalized);
  if (!pair) {
    return normalized;
  }
  return language === "es" ? pair.es : pair.en;
}

export function setPreferredLanguage(language: AppLanguage) {
  localStorage.setItem(LANGUAGE_PREFERENCE_KEY, language);
}

export function getPreferredLanguage(): AppLanguage | null {
  const value = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
  if (value === "en" || value === "es") {
    return value;
  }
  return null;
}
