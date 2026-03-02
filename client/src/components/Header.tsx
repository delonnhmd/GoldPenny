import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getMappedPath, inferLanguageFromPath, normalizePath, setPreferredLanguage } from "@/lib/languageRoutes";

export function Header() {
  const [location] = useLocation();
  const currentPath = normalizePath(location.split("?")[0]);
  const englishPath = getMappedPath(currentPath, "en");
  const spanishPath = getMappedPath(currentPath, "es");
  const isSpanish = inferLanguageFromPath(currentPath) === "es";

  return (
    <header className="relative md:sticky md:top-0 z-50 w-full pt-[env(safe-area-inset-top)] bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={isSpanish ? "/es" : "/"}>
          <div className="flex items-center gap-2 cursor-pointer group">
            <img
              src="/logo.png"
              alt="PennyFloat logo"
              className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/favicon.png";
              }}
            />
            <span className="text-xl font-bold font-display text-slate-900 tracking-tight">PennyFloat</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8">
          {isSpanish ? (
            <>
              <Link href="/es" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Inicio</Link>
              <Link href="/es/ofertas" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Ofertas</Link>
              <Link href="/es/noticias" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Noticias</Link>
              <Link href="/es/smart-penny" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Smart Penny</Link>
              <Link href="/es/calculadoras-de-prestamos" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Calculadoras</Link>
            </>
          ) : (
            <>
              <a href="/#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">How it Works</a>
              <a href="/#benefits" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Benefits</a>
              <Link href="/rates" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">News</Link>
              <Link href="/smart-penny" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Smart Penny</Link>
              <Link href="/loan-calculators" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Loan Calculators</Link>
              <a href="/#faq" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">FAQ</a>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center rounded-md border border-slate-200 bg-white p-0.5">
            <Link
              href={englishPath}
              onClick={() => setPreferredLanguage("en")}
              className={`px-2 py-1 text-xs font-semibold rounded ${!isSpanish ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              English
            </Link>
            <Link
              href={spanishPath}
              onClick={() => setPreferredLanguage("es")}
              className={`px-2 py-1 text-xs font-semibold rounded ${isSpanish ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              Español
            </Link>
          </div>

          <a href={isSpanish ? "/es/ofertas" : "/#apply"} className="hidden lg:block">
            <Button className="font-semibold shadow-md shadow-primary/20">{isSpanish ? "Ver opciones" : "Check Your Rate"}</Button>
          </a>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[85vw] sm:max-w-sm">
              <nav className="mt-8 flex flex-col gap-2">
                {isSpanish ? (
                  <>
                    <SheetClose asChild>
                      <Link href="/es" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Inicio</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/es/ofertas" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Ofertas</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/es/noticias" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Noticias</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/es/smart-penny" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Smart Penny</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/es/calculadoras-de-prestamos" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Calculadoras</Link>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <a href="/#how-it-works" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">How it Works</a>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="/#benefits" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Benefits</a>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/rates" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">News</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/smart-penny" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Smart Penny</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/loan-calculators" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Loan Calculators</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="/#faq" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">FAQ</a>
                    </SheetClose>
                  </>
                )}

                <div className="mt-3 flex items-center rounded-md border border-slate-200 bg-white p-0.5">
                  <SheetClose asChild>
                    <Link
                      href={englishPath}
                      onClick={() => setPreferredLanguage("en")}
                      className={`flex-1 text-center px-2 py-2 text-xs font-semibold rounded ${!isSpanish ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      English
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href={spanishPath}
                      onClick={() => setPreferredLanguage("es")}
                      className={`flex-1 text-center px-2 py-2 text-xs font-semibold rounded ${isSpanish ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      Español
                    </Link>
                  </SheetClose>
                </div>

                <SheetClose asChild>
                  <a href={isSpanish ? "/es/ofertas" : "/#apply"} className="mt-2">
                    <Button className="w-full font-semibold shadow-md shadow-primary/20">{isSpanish ? "Ver opciones" : "Check Your Rate"}</Button>
                  </a>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
