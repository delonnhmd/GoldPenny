import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BlogBannerSection } from "@/components/BlogBannerSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setPageSeo } from "@/lib/seo";
import { useSmartPennyPosts } from "@/hooks/use-smart-penny-posts";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PAGE_TITLE = "Smart Penny 2026: Personal, Business, and Crypto Loan Guides";
const PAGE_DESCRIPTION =
  "Smart Penny covers personal loan online comparisons, small business funding Houston insights, and crypto loan without selling guides. Read soft pull personal loan, compare business lenders, and secure crypto lending best-practice content.";
const PAGE_KEYWORDS =
  "personal loan online, fast personal loan approval, personal loan Houston TX, soft pull personal loan, small business loan 2026, business loan Houston TX, compare business lenders, crypto loan without selling, borrow against crypto, best crypto lending platform 2026, secure crypto loan platform, crypto loan vs personal loan";
const PAGE_CANONICAL = "https://www.pennyfloat.com/smart-penny";

const PERSONAL_LOAN_TOPICS = [
  "personal loan online",
  "best personal loan 2026",
  "fast personal loan approval",
  "unsecured personal loan",
  "low interest personal loan",
  "personal loan bad credit",
  "instant personal loan USA",
  "quick personal loan online",
  "personal loan Houston TX",
  "apply personal loan Houston",
  "personal loan no credit impact",
  "soft pull personal loan",
  "no hidden fees personal loan",
  "safe personal loan comparison",
] as const;

const BUSINESS_LOAN_TOPICS = [
  "small business loan 2026",
  "business funding fast approval",
  "startup business loan",
  "working capital loan",
  "business loan no collateral",
  "business line of credit",
  "SBA loan alternatives",
  "instant business funding",
  "business loan Houston TX",
  "small business funding Houston",
  "startup funding Houston Texas",
  "Houston business financing",
  "business loan no credit check",
  "secure business loan platform",
  "compare business lenders",
] as const;

const CRYPTO_LOAN_TOPICS = [
  "crypto loan without selling",
  "borrow against crypto",
  "bitcoin loan 2026",
  "crypto backed loan",
  "instant crypto loan",
  "defi lending platform",
  "crypto collateral loan",
  "stablecoin loan",
  "how to borrow against bitcoin",
  "crypto loan vs personal loan",
  "best crypto lending platform 2026",
  "how to get cash from crypto",
  "secure crypto loan platform",
  "no credit check crypto loan",
  "fast crypto loan approval",
  "safe crypto lending",
] as const;

const LONG_TAIL_TOPIC_TITLES = [
  "Best personal loan Houston for bad credit in 2026",
  "How to apply personal loan Houston with soft pull personal loan checks",
  "Best startup business loan Houston Texas 2026",
  "Working capital loan vs business line of credit in Houston",
  "How to borrow against bitcoin without selling in 2026",
  "Crypto loan vs personal loan: which is lower cost for fast cash",
] as const;

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

export default function SmartPenny() {
  const { data, isLoading } = useSmartPennyPosts("smart-penny");
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      keywords: PAGE_KEYWORDS,
      canonical: PAGE_CANONICAL,
      robots: "index, follow, max-image-preview:large",
    });
  }, []);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredPosts = (data ?? []).filter((post) => {
    if (!normalizedSearchTerm) return true;

    const title = post.title.toLowerCase();
    const content = post.content.toLowerCase();
    return title.includes(normalizedSearchTerm) || content.includes(normalizedSearchTerm);
  });

  return (
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Smart Penny 2026 Loan SEO Topics</h1>
          <p className="text-slate-600">Daily Smart Penny posts across personal, business, and crypto lending comparisons.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/loan">
              <Button className="font-semibold shadow-md shadow-primary/20">Compare Personal Loan Online</Button>
            </Link>
            <Link href="/business">
              <Button variant="outline" className="font-semibold">Compare Business Lenders</Button>
            </Link>
            <Link href="/crypto-loan">
              <Button variant="outline" className="font-semibold">Review Crypto Lending Options</Button>
            </Link>
          </div>
          <Input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search Smart Penny posts"
            aria-label="Search Smart Penny posts"
            className="max-w-md"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="p-5 border-slate-200 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Personal Loan Keywords</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {PERSONAL_LOAN_TOPICS.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </Card>
            <Card className="p-5 border-slate-200 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Business Loan Keywords</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {BUSINESS_LOAN_TOPICS.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </Card>
            <Card className="p-5 border-slate-200 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Crypto Loan Keywords</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {CRYPTO_LOAN_TOPICS.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </Card>
            <Card className="p-5 border-slate-200 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Long-Tail Blog Titles</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {LONG_TAIL_TOPIC_TITLES.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </Card>
          </div>

          {isLoading ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">Loading Smart Penny posts…</p>
            </Card>
          ) : (data ?? []).length === 0 ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">No Smart Penny posts published yet.</p>
            </Card>
          ) : filteredPosts.length === 0 ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">No Smart Penny posts match your search.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const isExpanded = Boolean(expandedPosts[post.id]);
                const { preview, isTruncated } = getWordPreview(post.content, 166);
                const fullContentId = `smart-penny-post-full-${post.id}`;

                return (
                  <Card key={post.id} className="p-6 md:p-8 border-slate-200 bg-white">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{post.title}</h2>
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
                      <button
                        type="button"
                        className="mt-3 text-sm font-semibold text-primary hover:underline"
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
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        <BlogBannerSection
          pageType="blog"
          currentPageCategory="business_software"
          maxItems={2}
        />
      </main>
      <Footer />
    </div>
  );
}
