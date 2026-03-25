import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Briefcase, Building2, LineChart, ShieldCheck } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Business Loan Houston TX | Small Business Funding Houston 2026";
const PAGE_DESCRIPTION =
  "Compare small business loan 2026 options in Houston with business funding fast approval pathways, startup business loan choices, and working capital loan or business line of credit solutions. Use a secure business loan platform to compare business lenders before applying.";
const PAGE_KEYWORDS =
  "small business loan 2026, business funding fast approval, startup business loan, working capital loan, business line of credit, instant business funding, business loan Houston TX, small business funding Houston, startup funding Houston Texas, Houston business financing, business loan no credit check, secure business loan platform, compare business lenders, fast business funding no risk";
const PAGE_CANONICAL = "https://www.pennyfloat.com/business";

const coreKeywords = [
  "small business loan 2026",
  "business funding fast approval",
  "startup business loan",
  "working capital loan",
  "business line of credit",
  "instant business funding",
] as const;

const localKeywords = [
  "business loan Houston TX",
  "small business funding Houston",
  "startup funding Houston Texas",
  "Houston business financing",
] as const;

const trustKeywords = [
  "business loan no credit check options",
  "fast business funding no risk comparison",
  "secure business loan platform",
  "compare business lenders",
] as const;

const longTailTopics = [
  "Best startup business loan Houston Texas 2026",
  "Working capital loan vs business line of credit for Houston businesses",
] as const;

export default function Business() {
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
                  Business Loan Houston TX Comparison Hub
                </h1>
                <p className="text-slate-600 leading-relaxed">
                  Looking for small business funding Houston owners can use to grow? Compare startup business loan, working capital loan, and business line of credit offers with clear terms and fast review paths.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>Business Funding Fast Approval</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Secure Business Loan Platform</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Houston Business Financing</span>
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
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Houston Local Keywords</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {localKeywords.map((item) => (
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
            <p className="text-xs text-slate-500 mt-4">
              PennyFloat is not a lender. We provide educational business loan comparison content so you can compare business lenders with more confidence.
            </p>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <a href="/#business-loan">
              <Button className="font-semibold">
                Check Business Funding Fast Approval
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/smart-penny">
              <Button variant="outline" className="font-semibold">
                Read SBA Loan Alternatives
                <LineChart className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

