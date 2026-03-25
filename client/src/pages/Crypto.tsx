import { useEffect } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowRight, Bitcoin, ShieldCheck, Wallet } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Crypto Loan Without Selling | Borrow Against Crypto 2026";
const PAGE_DESCRIPTION =
  "Learn how to borrow against crypto with crypto backed loan and crypto collateral loan options. Compare bitcoin loan 2026, stablecoin loan, and defi lending platform choices with secure crypto loan platform and safe crypto lending checks before you apply.";
const PAGE_KEYWORDS =
  "crypto loan without selling, borrow against crypto, bitcoin loan 2026, crypto backed loan, instant crypto loan, defi lending platform, crypto collateral loan, stablecoin loan, how to borrow against bitcoin, crypto loan vs personal loan, best crypto lending platform 2026, how to get cash from crypto, secure crypto loan platform, no credit check crypto loan, fast crypto loan approval, safe crypto lending";
const PAGE_CANONICAL = "https://www.pennyfloat.com/crypto";

const coreKeywords = [
  "crypto loan without selling",
  "borrow against crypto",
  "bitcoin loan 2026",
  "crypto backed loan",
  "crypto collateral loan",
  "stablecoin loan",
] as const;

const intentKeywords = [
  "how to borrow against bitcoin",
  "crypto loan vs personal loan",
  "best crypto lending platform 2026",
  "how to get cash from crypto",
] as const;

const trustKeywords = [
  "secure crypto loan platform",
  "no credit check crypto loan options",
  "fast crypto loan approval comparison",
  "safe crypto lending practices",
] as const;

const longTailTopics = [
  "How to borrow against bitcoin without selling long-term holdings",
  "Crypto loan vs personal loan in 2026: which is cheaper for cash flow",
] as const;

export default function Crypto() {
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
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />

      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl space-y-8">
          <Card className="p-6 md:p-8 border-slate-100 shadow-lg bg-white">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-3">
                  Crypto Loan Without Selling: Compare Options
                </h1>
                <p className="text-slate-600 leading-relaxed">
                  Compare instant crypto loan pathways and crypto backed loan structures if you want to access cash while keeping your assets. Review collateral terms, liquidation rules, and platform safety before borrowing.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <Bitcoin className="h-4 w-4 text-primary" />
                  <span>Borrow Against Crypto</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Secure Crypto Loan Platform Checks</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span>Crypto Loan vs Personal Loan Planning</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-slate-200 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Core Keywords</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {coreKeywords.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 border-slate-200 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Intent Keywords</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {intentKeywords.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 border-slate-200 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Trust Keywords</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {trustKeywords.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-5 border-slate-200 bg-white">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Long-Tail Topics</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
              {longTailTopics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 border-amber-200 bg-amber-50">
            <p className="text-xs text-amber-900 leading-relaxed">
              <AlertTriangle className="inline h-4 w-4 mr-1 align-text-bottom" />
              Crypto lending carries liquidation and platform counterparty risk. This page is educational, not investment or lending advice. Always confirm collateral requirements, margin call thresholds, custody terms, and jurisdiction restrictions.
            </p>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/smart-penny">
              <Button className="font-semibold">
                Read Best Crypto Lending Platform 2026 Guides
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/loan">
              <Button variant="outline" className="font-semibold">
                Compare Crypto Loan vs Personal Loan
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

