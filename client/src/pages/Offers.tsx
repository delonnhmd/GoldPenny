import { useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, Clock, Percent, Info, Star, ShieldCheck } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Personal Loan Online Houston TX | Fast Personal Loan Approval 2026";
const PAGE_DESCRIPTION =
  "Compare personal loan online offers in Houston with fast personal loan approval options, unsecured personal loan choices, and low interest personal loan ranges. Check personal loan bad credit pathways with a soft pull personal loan flow and no hidden fees personal loan comparison.";
const PAGE_KEYWORDS =
  "personal loan online, best personal loan 2026, fast personal loan approval, unsecured personal loan, low interest personal loan, personal loan bad credit, instant personal loan USA, quick personal loan online, personal loan Houston TX, Houston personal loan options, apply personal loan Houston, soft pull personal loan, personal loan no credit impact, no hidden fees personal loan, safe personal loan comparison";
const PAGE_CANONICAL = "https://www.pennyfloat.com/loan";

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

  const upstartUrl = "https://upstart.9c65.net/c/7021230/3807099/9083";

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
                <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900 mb-2">Your Personal Loan Online Options Are Ready, {fullName}</h1>
                <p className="text-slate-600 leading-relaxed">
                  Based on your request for a <span className="font-semibold text-slate-800">{loanPurpose}</span> and credit profile <span className="font-semibold text-slate-800">{creditScore}</span>, here are personal loan Houston TX matches, quick personal loan online options, and instant personal loan USA pathways to review.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <Percent className="w-4 h-4 text-primary" />
                  <span>Fast Personal Loan Approval</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Soft Pull Personal Loan</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Safe Personal Loan Comparison</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Recommended Loan Options */}
          <TooltipProvider>
            <section aria-label="Recommended Loan Options">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Best Personal Loan 2026 Options</h2>

              {/* Upstart Featured Card */}
              <Card className="p-6 md:p-8 mb-4 border-primary/20 shadow-md bg-white overflow-hidden relative">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-500 rounded-t-xl" />

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  {/* Left: Lender info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border border-primary/20 font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Top Pick
                      </Badge>
                      <a href={upstartUrl} target="_blank" rel="noopener noreferrer sponsored" className="text-xl font-bold text-slate-900 hover:text-primary transition-colors">Upstart</a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                      <a href={upstartUrl} target="_blank" rel="noopener noreferrer sponsored" className="bg-slate-50 rounded-lg p-3 border border-slate-100 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
                        <div className="text-xs text-slate-500 mb-0.5">Loan Amount</div>
                        <div className="font-semibold text-slate-800">$1,000 - $75,000</div>
                      </a>
                      <a href={upstartUrl} target="_blank" rel="noopener noreferrer sponsored" className="bg-slate-50 rounded-lg p-3 border border-slate-100 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
                        <div className="text-xs text-slate-500 mb-0.5">APR Range</div>
                        <div className="font-semibold text-slate-800">6.5% - 35.99%</div>
                      </a>
                      <a href={upstartUrl} target="_blank" rel="noopener noreferrer sponsored" className="bg-slate-50 rounded-lg p-3 border border-slate-100 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
                        <div className="text-xs text-slate-500 mb-0.5">Loan Terms</div>
                        <div className="font-semibold text-slate-800">36 or 60 months</div>
                      </a>
                    </div>

                    <ul className="space-y-2 mb-5 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="flex items-center gap-1">
                          Fast approval process (instant decision for most applicants)
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                aria-label="More info about approval process"
                                className="inline-flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs leading-relaxed" side="top">
                              The majority of borrowers on the Upstart marketplace are able to receive an instant decision upon submitting a completed application. Final approval is conditioned upon passing a hard credit inquiry, and additional documentation may be required.
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Unsecured personal loan options available</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Low interest personal loan ranges based on profile</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Personal loan no credit impact pre-check flow</span>
                      </li>
                    </ul>
                  </div>


                </div>

                {/* Inline Disclaimers */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.5" }}>
                    Your loan amount will be determined based on your credit, income, and other information provided in your application. Not all applicants will qualify for the full amount. Minimum loan amounts vary by state: GA ($3,100), HI ($2,100), MA ($7,000).
                  </p>
                  <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.5" }}>
                    The majority of borrowers on the Upstart marketplace are able to receive an instant decision upon submitting a completed application. Final approval is conditioned upon passing a hard credit inquiry, and additional documentation may be required.
                  </p>
                </div>
              </Card>
            </section>
          </TooltipProvider>

          {/* Global Disclaimer */}
          <div className="mt-10 px-4 py-5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              <strong className="text-slate-600">Disclaimer:</strong> PennyFloat is not a lender. We help you compare lenders safely. Looking for the best personal loan Houston for personal loan bad credit in 2026? Start with a soft pull personal loan check and review no hidden fees personal loan terms before applying.
            </p>
          </div>

          <div className="mt-8 text-center">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/#apply">
                <Button className="font-semibold">Apply Personal Loan Houston</Button>
              </a>
              <Link href="/">
                <Button variant="outline" className="font-semibold">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
