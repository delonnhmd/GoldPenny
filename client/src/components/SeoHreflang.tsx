import { useEffect } from "react";
import { useLocation } from "wouter";
import { inferLanguageFromPath, languageRoutePairs, normalizePath } from "@/lib/languageRoutes";

const SITE_URL = "https://www.pennyfloat.com";

function upsertAlternate(hreflang: "en" | "es" | "x-default", href: string) {
  let link = document.querySelector(`link[rel='alternate'][hreflang='${hreflang}'][data-managed='hreflang']`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", hreflang);
    link.setAttribute("data-managed", "hreflang");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function upsertOgTag(property: "og:locale" | "og:locale:alternate", content: string) {
  let tag = document.querySelector(`meta[property='${property}'][data-managed='og-locale']`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    tag.setAttribute("data-managed", "og-locale");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function SeoHreflang() {
  const [location] = useLocation();

  useEffect(() => {
    const currentPath = normalizePath(location.split("?")[0]);
    const matched = languageRoutePairs.find((pair) => pair.en === currentPath || pair.es === currentPath);
    const isSpanishRoute = matched ? matched.es === currentPath : inferLanguageFromPath(currentPath) === "es";

    if (!matched) {
      document
        .querySelectorAll("link[rel='alternate'][data-managed='hreflang']")
        .forEach((node) => node.remove());

      document
        .querySelectorAll("meta[data-managed='og-locale']")
        .forEach((node) => node.remove());
      return;
    }

    const enHref = `${SITE_URL}${matched.en}`;
    const esHref = `${SITE_URL}${matched.es}`;
    const xDefaultHref = `${SITE_URL}${matched.en}`;

    upsertAlternate("en", enHref);
    upsertAlternate("es", esHref);
    upsertAlternate("x-default", xDefaultHref);

    upsertOgTag("og:locale", isSpanishRoute ? "es_MX" : "en_US");
    upsertOgTag("og:locale:alternate", isSpanishRoute ? "en_US" : "es_MX");
  }, [location]);

  return null;
}
