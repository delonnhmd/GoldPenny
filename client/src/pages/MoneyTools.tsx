import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Calculator Hub: Loan Calculators, Mortgage Underwriting & Money Tools | PennyFloat";
const PAGE_DESCRIPTION =
  "Explore calculator tools on PennyFloat: Loan Calculators, Mortgage Underwriting Scenario Checker, and Money Tools resources for borrowers.";
const PAGE_KEYWORDS =
  "calculator hub, loan calculators, mortgage underwriting tool, money tools for borrowers, mortgage scenario checker";
const PAGE_CANONICAL = "https://www.pennyfloat.com/money-tools";

const CALCULATOR_PAGES = [
  {
    title: "Loan Calculators",
    href: "/loan-calculators",
    description: "Mortgage, refinance, car, personal, and business payment calculators.",
  },
  {
    title: "Mortgage Underwriting",
    href: "/mortgage-underwriting",
    description: "Pre-decision underwriting scenario checker with program guidance and condition flags.",
  },
  {
    title: "Money Tools",
    href: "/money-tools",
    description: "Navigation hub for borrower planning and calculator resources.",
  },
] as const;

export default function MoneyTools() {
  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      keywords: PAGE_KEYWORDS,
      canonical: PAGE_CANONICAL,
      robots: "index, follow, max-image-preview:large",
    });
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-6">
          <Card className="p-6 border-slate-200 bg-white">
            <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Calculator Hub</h1>
            <p className="text-slate-600 mt-3">
              Borrower tools organized under one parent menu with clear hierarchy.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-slate-50">
            <div className="mx-auto max-w-3xl">
              <div className="flex justify-center">
                <div className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm">
                  Calculator
                </div>
              </div>

              <div className="relative mt-6">
                <div className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-slate-300" />
                <div className="absolute left-[16.7%] right-[16.7%] top-6 h-px bg-slate-300" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
                  {CALCULATOR_PAGES.map((page) => (
                    <div key={page.title} className="relative">
                      <div className="absolute left-1/2 -top-2 h-2 w-px -translate-x-1/2 bg-slate-300 md:block hidden" />
                      <Link href={page.href}>
                        <Card className="h-full p-4 border-slate-200 bg-white hover:border-teal-400 transition-colors cursor-pointer">
                          <h2 className="text-base font-semibold text-slate-900">{page.title}</h2>
                          <p className="text-sm text-slate-600 mt-2">{page.description}</p>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
