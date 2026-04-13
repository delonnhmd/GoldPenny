import { Link } from "wouter";
import { ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const calculatorSubpages = [
  { label: "Loan Calculators", href: "/loan-calculators" },
  { label: "Mortgage Underwriting", href: "/mortgage" },
  { label: "Money Tools", href: "/money-tools" },
] as const;

export function Header() {
  return (
    <header className="relative md:sticky md:top-0 z-50 w-full pt-[env(safe-area-inset-top)] bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
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
          <>
            <a href="/#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">How it Works</a>
            <a href="/#benefits" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Benefits</a>
            <Link href="/loan" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Personal Loan</Link>
            <Link href="/rates" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">News</Link>
            <div className="relative group">
              <Link href="/loan-calculators" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                Calculator
                <ChevronDown className="h-4 w-4" />
              </Link>

              <div className="pointer-events-none invisible opacity-0 translate-y-2 absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Calculator</p>
                  <div className="relative mt-3 pl-5">
                    <div className="absolute left-1 top-1 bottom-1 w-px bg-slate-200" />
                    <div className="space-y-2">
                      {calculatorSubpages.map((item) => (
                        <Link key={item.href} href={item.href} className="relative block rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-primary">
                          <span className="absolute -left-[13px] top-1/2 h-px w-3 -translate-y-1/2 bg-slate-300" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/shopping-guide" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Shopping Guide</Link>
            <Link href="/smart-penny" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Smart Penny</Link>
            <a href="/#faq" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">FAQ</a>
          </>
        </nav>

        <div className="flex items-center gap-2">
          <a href="/#apply" className="hidden lg:block">
            <Button className="font-semibold shadow-md shadow-primary/20">Fast Personal Loan Approval</Button>
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
                <>
                  <SheetClose asChild>
                    <a href="/#how-it-works" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">How it Works</a>
                  </SheetClose>
                  <SheetClose asChild>
                    <a href="/#benefits" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Benefits</a>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/loan" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Personal Loan</Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/rates" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">News</Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/loan-calculators" className="rounded-md px-2 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100">Calculator</Link>
                  </SheetClose>
                  <div className="ml-3 border-l border-slate-200 pl-3 space-y-1">
                    {calculatorSubpages.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link href={item.href} className="relative block rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                          <span className="absolute -left-3 top-1/2 h-px w-2 -translate-y-1/2 bg-slate-300" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                  <SheetClose asChild>
                    <Link href="/shopping-guide" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Shopping Guide</Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/smart-penny" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Smart Penny</Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <a href="/#faq" className="rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">FAQ</a>
                  </SheetClose>
                </>

                <SheetClose asChild>
                  <a href="/#apply" className="mt-2">
                    <Button className="w-full font-semibold shadow-md shadow-primary/20">Fast Personal Loan Approval</Button>
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
