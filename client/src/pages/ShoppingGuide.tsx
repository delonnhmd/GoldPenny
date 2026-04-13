import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Star,
  Search,
  BarChart3,
  FileText,
  Clock,
  Percent,
  BookOpen,
  ChevronRight,
} from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { setPageSeo } from "@/lib/seo";
import { useSmartPennyPosts } from "@/hooks/use-smart-penny-posts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PAGE_TITLE = "Loan Shopping Guide: How to Compare & Choose the Right Loan | PennyFloat";
const PAGE_DESCRIPTION = "Learn how to shop for personal, auto, and mortgage loans the smart way. Compare APR, fees, terms, and lender reputation before you commit.";
const PAGE_KEYWORDS = "loan shopping guide, how to compare loans, personal loan guide, auto loan guide, mortgage loan tips, APR vs interest rate, loan comparison checklist, loan terms explained, credit score and loans";
const PAGE_CANONICAL = "https://www.pennyfloat.com/shopping-guide";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Know Your Credit Score",
    description:
      "Your credit score is the single biggest factor in the rate and terms you'll be offered. Pull a free report before you shop so there are no surprises. Scores above 670 unlock better rates; 740+ typically gets the best tiers.",
    tips: ["Check all three bureaus (Equifax, Experian, TransUnion)", "Dispute errors before applying", "Pay down card balances to boost utilization"],
  },
  {
    number: "02",
    icon: DollarSign,
    title: "Set a Realistic Budget",
    description:
      "Decide how much you actually need — not the maximum you can borrow. Borrow only what you can repay comfortably within the term. A good rule: total debt payments should stay under 36% of gross monthly income.",
    tips: ["Factor in origination fees and closing costs", "Use our Loan Calculators to model scenarios", "Leave a buffer for unexpected expenses"],
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Compare APR, Not Just Rate",
    description:
      "The Annual Percentage Rate (APR) includes the interest rate plus lender fees, giving you the true cost of borrowing. Two loans with identical rates but different fees can have meaningfully different APRs.",
    tips: ["Always compare APR — not just the stated interest rate", "Ask for the Loan Estimate (mortgage) or Truth in Lending disclosure", "Watch for hidden fees: prepayment penalties, late fees, origination"],
  },
  {
    number: "04",
    icon: FileText,
    title: "Get Pre-qualified from Multiple Lenders",
    description:
      "Pre-qualification typically uses a soft credit pull, which does not affect your score. Shopping 3–5 lenders exposes you to the market range and gives you leverage to negotiate.",
    tips: ["Rate-shop within a 14–45 day window (treated as one inquiry)", "Compare offers on the same loan amount and term", "Note whether rates are fixed or variable"],
  },
  {
    number: "05",
    icon: ShieldCheck,
    title: "Vet the Lender",
    description:
      "Not all lenders are equal. Confirm they are licensed in your state, check CFPB complaint data, and read third-party reviews. Predatory lenders often target borrowers with limited options.",
    tips: ["Check NMLS license numbers for mortgage lenders", "Review CFPB Consumer Complaint Database", "Avoid lenders that guarantee approval without checking credit"],
  },
  {
    number: "06",
    icon: CheckCircle2,
    title: "Read the Fine Print",
    description:
      "Before signing, review the full loan agreement — not just the summary page. Understand what triggers a rate change (for variable loans), what happens if you miss a payment, and whether early payoff is penalized.",
    tips: ["Confirm if the rate is fixed or adjustable", "Ask about grace periods and late fees", "Check if there's a prepayment penalty"],
  },
];

const loanTypes = [
  {
    type: "Personal Loan",
    bestFor: "Debt consolidation, home improvement, major purchases",
    typicalAPR: "7% – 36%",
    terms: "12 – 84 months",
    collateral: "None (unsecured)",
    watchOut: "Origination fees of 1%–10%; high rates for low credit scores",
    badge: "Most Flexible",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    type: "Auto Loan",
    bestFor: "New or used vehicle purchase",
    typicalAPR: "5% – 20%",
    terms: "24 – 84 months",
    collateral: "Vehicle (secured)",
    watchOut: "Longer terms = more interest paid; vehicle depreciates fast",
    badge: "Asset-Backed",
    badgeColor: "bg-green-100 text-green-800",
  },
  {
    type: "Mortgage",
    bestFor: "Home purchase or refinance",
    typicalAPR: "5% – 9%",
    terms: "10, 15, 20, or 30 years",
    collateral: "Home (secured)",
    watchOut: "Closing costs 2%–5% of loan amount; PMI if < 20% down",
    badge: "Largest Commitment",
    badgeColor: "bg-purple-100 text-purple-800",
  },
  {
    type: "Business Loan",
    bestFor: "Working capital, equipment, expansion",
    typicalAPR: "7% – 30%+",
    terms: "6 months – 10 years",
    collateral: "Varies (secured or unsecured)",
    watchOut: "Personal guarantee often required; MCA factor rates can be very expensive",
    badge: "Complex Terms",
    badgeColor: "bg-amber-100 text-amber-800",
  },
];

const glossaryTerms = [
  {
    term: "APR (Annual Percentage Rate)",
    definition:
      "The yearly cost of credit expressed as a percentage, including interest and most fees. APR is the fairest comparison metric across lenders because it reflects total borrowing cost.",
  },
  {
    term: "Amortization",
    definition:
      "The process of paying down a loan through regular, scheduled payments that cover both principal and interest. Early payments are mostly interest; later payments are mostly principal.",
  },
  {
    term: "Origination Fee",
    definition:
      "An upfront charge by the lender to process your loan, usually expressed as a percentage (e.g., 2% of the loan amount). It is often deducted from your disbursed funds, reducing what you actually receive.",
  },
  {
    term: "Debt-to-Income Ratio (DTI)",
    definition:
      "Your total monthly debt payments divided by gross monthly income. Most lenders prefer a DTI below 36–43%. A lower DTI signals less financial stress and can improve approval odds and rates.",
  },
  {
    term: "Collateral",
    definition:
      "An asset pledged as security for a loan. If you default, the lender can seize it. Secured loans (backed by collateral) usually carry lower rates than unsecured loans.",
  },
  {
    term: "Prepayment Penalty",
    definition:
      "A fee charged by some lenders if you pay off your loan early. Not all loans have them — always ask. Paying early saves interest, so a prepayment penalty can offset that benefit.",
  },
  {
    term: "Hard vs. Soft Credit Pull",
    definition:
      "A soft pull (pre-qualification) does not affect your credit score and is visible only to you. A hard pull (formal application) is recorded on your credit report and may temporarily lower your score by a few points.",
  },
  {
    term: "Fixed vs. Variable Rate",
    definition:
      "A fixed rate stays the same for the life of the loan. A variable rate can change with a benchmark index (like the prime rate), making future payments unpredictable.",
  },
];

const faqs = [
  {
    question: "How many lenders should I apply to?",
    answer:
      "Aim to compare at least 3–5 lenders. For mortgages and auto loans, multiple hard pulls within a 14–45 day window are typically treated as a single inquiry by credit bureaus, minimizing score impact. For personal loans, pre-qualifying (soft pull) with several lenders before choosing one to apply formally with is the safest approach.",
  },
  {
    question: "Does pre-qualifying hurt my credit score?",
    answer:
      "No. Pre-qualification uses a soft credit inquiry, which does not affect your credit score and is not visible to other lenders. Only a formal application triggers a hard pull.",
  },
  {
    question: "What credit score do I need to get a good rate?",
    answer:
      "Generally: 740+ is considered excellent and qualifies for top-tier rates. 670–739 is good and still competitive. 580–669 is fair — you'll qualify with most lenders but at higher rates. Below 580 is challenging; options exist but often at significantly higher cost.",
  },
  {
    question: "Should I choose the shortest term I can afford?",
    answer:
      "Shorter terms cost less in total interest but come with higher monthly payments. It depends on your cash flow. If a shorter term would strain your budget, the risk of missing payments outweighs the interest savings. Use our Loan Calculators to model both scenarios with your real numbers.",
  },
  {
    question: "Is a secured or unsecured loan better?",
    answer:
      "Secured loans (backed by an asset) usually offer lower rates because the lender has less risk. However, you risk losing the collateral if you default. Unsecured loans are safer for your assets but typically cost more in interest.",
  },
  {
    question: "What is the difference between pre-qualification and pre-approval?",
    answer:
      "Pre-qualification is a quick estimate based on self-reported information — no hard pull. Pre-approval involves verification of income, assets, and credit with a hard pull, and carries more weight with sellers (especially in mortgage). They are not the same thing.",
  },
];

const redFlags = [
  "Guaranteed approval regardless of credit history",
  "Upfront fees required before loan is disbursed",
  "No physical address or verifiable license number",
  "Pressure to sign immediately without time to review",
  "Rate changes between verbal quote and written agreement",
  "No disclosure of APR or total repayment amount",
];

export default function ShoppingGuide() {
  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      keywords: PAGE_KEYWORDS,
      canonical: PAGE_CANONICAL,
      robots: "index, follow, max-image-preview:large",
    });
  }, []);

  const { data: posts, isLoading: postsLoading } = useSmartPennyPosts("shopping-guide");
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});

  function getWordPreview(content: string, limit = 100) {
    const plainText = content
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[[^\]]+\]\([^)]*\)/g, "$1")
      .replace(/[*_`>#~-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const words = plainText.split(/\s+/);
    const isTruncated = words.length > limit;
    const preview = isTruncated ? `${words.slice(0, limit).join(" ")}...` : plainText;
    return { preview, isTruncated };
  }

  return (
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              Free Resource
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-display text-white leading-tight mb-5">
              The Smart Borrower's<br className="hidden sm:block" /> Loan Shopping Guide
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Compare lenders confidently, understand every fee, and choose the loan that actually fits your financial life — not just the one that's easiest to get.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#steps">
                <Button size="lg" className="font-semibold shadow-lg w-full sm:w-auto">
                  Start the Guide <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
              <Link href="/loan-calculators">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                  Open Loan Calculators
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Stats Bar */}
        <section className="bg-white border-b border-slate-100 py-6">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Star, label: "Topics Covered", value: "6 Steps" },
                { icon: BarChart3, label: "Loan Types Compared", value: "4 Types" },
                { icon: BookOpen, label: "Glossary Terms", value: "8 Defined" },
                { icon: Clock, label: "Read Time", value: "~8 min" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <Icon className="w-5 h-5 text-primary mb-1" />
                  <p className="text-xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 Steps */}
        <section id="steps" className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900">6 Steps to Smarter Loan Shopping</h2>
              <p className="text-slate-600 mt-3 max-w-xl mx-auto">Follow these steps in order before you submit a single application.</p>
            </div>

            <div className="space-y-6">
              {steps.map(({ number, icon: Icon, title, description, tips }) => (
                <Card key={number} className="p-6 border-slate-200 bg-white">
                  <div className="flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">{number}</span>
                        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                      </div>
                      <p className="text-slate-600 text-sm mb-3">{description}</p>
                      <ul className="space-y-1">
                        {tips.map((tip) => (
                          <li key={tip} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Loan Type Comparison */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Loan Type Comparison</h2>
              <p className="text-slate-600 mt-3 max-w-xl mx-auto">Not all loans are built alike. Match the loan type to your specific need.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {loanTypes.map(({ type, bestFor, typicalAPR, terms, collateral, watchOut, badge, badgeColor }) => (
                <Card key={type} className="p-6 border-slate-200 bg-[#f4fafc] flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{type}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${badgeColor}`}>{badge}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-28 flex-shrink-0">Best for</span>
                      <span className="text-slate-800 font-medium">{bestFor}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-28 flex-shrink-0">Typical APR</span>
                      <span className="text-slate-800 font-medium">{typicalAPR}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-28 flex-shrink-0">Typical terms</span>
                      <span className="text-slate-800 font-medium">{terms}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500 w-28 flex-shrink-0">Collateral</span>
                      <span className="text-slate-800 font-medium">{collateral}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-amber-800"><strong>Watch out:</strong> {watchOut}</span>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/loan-calculators">
                <Button variant="outline" size="lg" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Run Numbers in Our Loan Calculators
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Red Flags */}
        <section className="py-16 md:py-20 bg-red-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold font-display text-slate-900">Lender Red Flags to Avoid</h2>
              <p className="text-slate-600 mt-3 max-w-xl mx-auto">If a lender displays any of these, walk away — regardless of how appealing the offer sounds.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {redFlags.map((flag) => (
                <div key={flag} className="flex items-start gap-3 p-4 bg-white border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">{flag}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Glossary */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Loan Terms Glossary</h2>
              <p className="text-slate-600 mt-3">Plain-English definitions for the terms lenders use most.</p>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {glossaryTerms.map(({ term, definition }) => (
                <AccordionItem key={term} value={term} className="border border-slate-200 rounded-xl bg-[#f4fafc] px-4">
                  <AccordionTrigger className="text-left font-semibold text-slate-800 hover:no-underline">
                    {term}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-sm pb-4">
                    {definition}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 bg-[#f4fafc]">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Frequently Asked Questions</h2>
              <p className="text-slate-600 mt-3">Common questions from borrowers shopping for loans.</p>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map(({ question, answer }) => (
                <AccordionItem key={question} value={question} className="border border-slate-200 rounded-xl bg-white px-4">
                  <AccordionTrigger className="text-left font-semibold text-slate-800 hover:no-underline">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-sm pb-4">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Rate Factors */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold font-display text-slate-900">What Drives Your Interest Rate</h2>
              <p className="text-slate-600 mt-3 max-w-xl mx-auto">Lenders weigh these factors when pricing your loan. Improving them lowers your cost of borrowing.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, title: "Credit Score", desc: "The most impactful factor. Higher scores = lower rates across all loan types." },
                { icon: Percent, title: "Debt-to-Income (DTI)", desc: "Lower DTI shows lenders you have room to repay without financial strain." },
                { icon: DollarSign, title: "Loan Amount & Term", desc: "Larger amounts and longer terms generally mean higher total interest cost." },
                { icon: ShieldCheck, title: "Collateral", desc: "Secured loans carry lower risk for the lender, often resulting in lower rates." },
                { icon: Clock, title: "Employment History", desc: "Stable income history signals lower default risk, improving your rate." },
                { icon: FileText, title: "Loan Purpose", desc: "Some purposes (e.g., auto, mortgage) get better rates because assets back the loan." },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="p-5 border-slate-200 bg-[#f4fafc]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                  </div>
                  <p className="text-sm text-slate-600">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Shopping Guide Posts */}
        {(postsLoading || (posts && posts.length > 0)) && (
          <section className="py-16 md:py-20 bg-[#f4fafc]">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Shopping Guide Posts</h2>
                <p className="text-slate-600 mt-3">Expert tips and updates from the PennyFloat team.</p>
              </div>

              {postsLoading ? (
                <Card className="p-6 md:p-8 border-slate-200 bg-white">
                  <p className="text-slate-500">Loading posts…</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(posts ?? []).map((post) => {
                    const isExpanded = Boolean(expandedPosts[post.id]);
                    const { preview, isTruncated } = getWordPreview(post.content, 120);
                    const fullContentId = `shopping-guide-post-full-${post.id}`;

                    return (
                      <Card key={post.id} className="p-6 md:p-8 border-slate-200 bg-white">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                          {post.slug ? (
                            <a href={`/post/${post.slug}`} className="hover:text-primary transition-colors">
                              {post.title}
                            </a>
                          ) : post.title}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Published: {new Date(post.createdAt).toLocaleString()}</p>

                        <p className={isExpanded ? "hidden" : "text-slate-700 leading-relaxed whitespace-pre-line"}>{preview}</p>

                        <div id={fullContentId} className={isExpanded ? "block" : "hidden"}>
                          <div className="prose prose-slate max-w-none prose-p:leading-relaxed">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                img: ({ node: _node, ...props }) => {
                                  const align = (props.title ?? "").toLowerCase().trim();
                                  const floatClass = align === "left"
                                    ? "md:float-left md:mr-4"
                                    : "md:float-right md:ml-4";
                                  return (
                                    <img
                                      {...props}
                                      className={`not-prose ${floatClass} md:mb-3 md:mt-1 rounded-md max-w-full h-auto md:w-[220px]`}
                                      loading="lazy"
                                    />
                                  );
                                },
                              }}
                            >
                              {post.content}
                            </ReactMarkdown>
                          </div>
                          <div className="clear-both" />
                        </div>

                        {isTruncated ? (
                          <div className="mt-3 flex items-center gap-4">
                            <button
                              type="button"
                              className="text-sm font-semibold text-primary hover:underline"
                              aria-expanded={isExpanded}
                              aria-controls={fullContentId}
                              onClick={() =>
                                setExpandedPosts((current) => ({
                                  ...current,
                                  [post.id]: !current[post.id],
                                }))
                              }
                            >
                              {isExpanded ? "Show less" : "Show more"}
                            </button>
                            {post.slug && !isExpanded && (
                              <a
                                href={`/post/${post.slug}`}
                                className="text-sm font-semibold text-slate-500 hover:text-primary hover:underline"
                              >
                                Read full article →
                              </a>
                            )}
                          </div>
                        ) : null}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4">Ready to Find Your Loan?</h2>
            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
              Use our free tools to run payment scenarios, then check your rate with no impact to your credit score.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/#apply">
                <Button size="lg" className="font-semibold shadow-lg w-full sm:w-auto">
                  Check My Rate — No Hard Pull
                </Button>
              </a>
              <Link href="/loan-calculators">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                  Open Loan Calculators
                </Button>
              </Link>
            </div>
            <p className="text-slate-500 text-xs mt-6">
              For educational purposes only. Not a loan offer or financial advice. Rates and availability vary by lender.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
