import { useEffect } from "react";
import { useLocation } from "wouter";
import { getMappedPath, getPreferredLanguage, inferLanguageFromPath, normalizePath } from "@/lib/languageRoutes";

export function LanguageRedirect() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const preferredLanguage = getPreferredLanguage();
    if (!preferredLanguage) {
      return;
    }

    const currentPath = normalizePath(location.split("?")[0]);
    const currentLanguage = inferLanguageFromPath(currentPath);
    if (currentLanguage === preferredLanguage) {
      return;
    }

    const mappedPath = getMappedPath(currentPath, preferredLanguage);
    if (mappedPath !== currentPath) {
      setLocation(mappedPath);
    }
  }, [location, setLocation]);

  return null;
}
