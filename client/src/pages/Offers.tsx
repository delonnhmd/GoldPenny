import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, ShieldCheck, Clock, Percent } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Compare Personal, Auto & Business Loan Offers | PennyFloat";
const PAGE_DESCRIPTION = "Compare personal, auto, and business loan offers by APR, fees, repayment schedule, and total cost before choosing a lender.";
const PAGE_KEYWORDS = "loan offers comparison, personal loan offers, auto loan offers, business loan offers, lender comparison, APR and fees, loan repayment options, compare loan rates";
const PAGE_CANONICAL = "https://www.pennyfloat.com/offers";

type CreditTier = "low" | "mid" | "high";
type LoanType = "personal" | "auto";

function getCreditTier(score: string): CreditTier {
  if (score === "Below 580") return "low";
  if (score === "580-649") return "mid";
  return "high";
}

function getLoanType(purpose: string): LoanType {
  return purpose.toLowerCase().includes("car") ? "auto" : "personal";
}

function buildPartnerUrl(baseUrl: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `${baseUrl}?${searchParams.toString()}`;
}

const partnerBaseUrls = {
  personal: {
    low: {
      trusted: "https://example.com/pennyfloat/personal/low/trusted",
      summit: "https://example.com/pennyfloat/personal/low/summit",
      crestline: "https://example.com/pennyfloat/personal/low/crestline",
    },
    mid: {
      trusted: "https://example.com/pennyfloat/personal/mid/trusted",
      summit: "https://example.com/pennyfloat/personal/mid/summit",
      crestline: "https://example.com/pennyfloat/personal/mid/crestline",
    },
    high: {
      trusted: "https://example.com/pennyfloat/personal/high/trusted",
      summit: "https://example.com/pennyfloat/personal/high/summit",
      crestline: "https://example.com/pennyfloat/personal/high/crestline",
    },
  },
  auto: {
    low: {
      trusted: "https://example.com/pennyfloat/auto/low/trusted",
      summit: "https://example.com/pennyfloat/auto/low/summit",
      crestline: "https://example.com/pennyfloat/auto/low/crestline",
    },
    mid: {
      trusted: "https://example.com/pennyfloat/auto/mid/trusted",
      summit: "https://example.com/pennyfloat/auto/mid/summit",
      crestline: "https://example.com/pennyfloat/auto/mid/crestline",
    },
    high: {
      trusted: "https://example.com/pennyfloat/auto/high/trusted",
      summit: "https://example.com/pennyfloat/auto/high/summit",
      crestline: "https://example.com/pennyfloat/auto/high/crestline",
    },
  },
} as const;

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Offers() {
  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      keywords: PAGE_KEYWORDS,
      canonical: PAGE_CANONICAL,
      robots: "index, follow, max-image-preview:large",
    });
  }, []);

  const params = new URLSearchParams(window.location.search);

  const fullName = params.get("name") || "there";
  const loanPurpose = params.get("purpose") || "Personal Loan";
  const creditScore = params.get("score") || "650-719";
  const amount = Number(params.get("amount") || "15000");

  const requestedAmount = Number.isFinite(amount) && amount > 0 ? amount : 15000;
  const creditTier = getCreditTier(creditScore);
  const loanType = getLoanType(loanPurpose);
  const isMaintenanceMode = loanType === "personal" || loanType === "auto";
  const maintenanceLabel = loanType === "auto" ? "Car Loan Offers" : "Personal Loan Offers";

  return (
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />

      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <Card className="p-6 md:p-8 mb-8 border-slate-100 shadow-lg bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-4 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Application Received</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-2">Your Offers Are Ready, {fullName}</h1>
                <p className="text-slate-600 leading-relaxed">
                  Based on your request for a <span className="font-semibold text-slate-800">{loanPurpose}</span> and credit profile <span className="font-semibold text-slate-800">{creditScore}</span>, here are lender options to review.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <Percent className="w-4 h-4 text-primary" />
                  <span>Competitive APRs</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Fast decisions</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Secure process</span>
                </div>
              </div>
            </div>
          </Card>

          {isMaintenanceMode ? (
            <Card className="p-6 md:p-8 border-amber-200 bg-amber-50/60 shadow-sm">
              <div className="max-w-3xl mx-auto text-center">
                <Badge className="mb-3 bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200">Temporarily Unavailable</Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{maintenanceLabel} are under maintenance</h2>
                <p className="text-slate-700 leading-relaxed mb-6">
                  We are updating our lender integrations for this category. Please check back soon, or return to the home page to explore other resources.
                </p>
                <Link href="/">
                  <Button className="h-11 px-6 font-semibold bg-slate-900 hover:bg-slate-800 text-white">
                    Back to Home <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ) : null}

          <div className="mt-8 text-center">
            <Link href="/">
              <Button variant="outline" className="font-semibold">Back to Home</Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
