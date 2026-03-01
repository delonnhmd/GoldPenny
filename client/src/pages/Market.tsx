import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMarketPosts } from "@/hooks/use-market-posts";
import { Link } from "wouter";

function getWordPreview(content: string, limit = 100) {
  const words = content.trim().split(/\s+/);
  const isTruncated = words.length > limit;
  const preview = isTruncated ? `${words.slice(0, limit).join(" ")}...` : content;
  return { preview, isTruncated };
}

export default function Market() {
  const { data, isLoading } = useMarketPosts("market");
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Business Lending Market</h1>
          <p className="text-slate-600">Daily market news posts and lending commentary from your team.</p>
          <Link href="/loan-calculators">
            <Button className="font-semibold shadow-md shadow-primary/20">Open Loan Calculators</Button>
          </Link>

          {isLoading ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">Loading market posts…</p>
            </Card>
          ) : (data ?? []).length === 0 ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">No market posts published yet.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {(data ?? []).map((post) => {
                const isExpanded = Boolean(expandedPosts[post.id]);
                const { preview, isTruncated } = getWordPreview(post.content, 166);
                const fullContentId = `market-post-full-${post.id}`;

                return (
                  <Card key={post.id} className="p-6 md:p-8 border-slate-200 bg-white">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{post.title}</h2>
                    <p className="text-xs text-slate-500 mb-4">Published: {new Date(post.createdAt).toLocaleString()}</p>

                    <p className={isExpanded ? "hidden" : "text-slate-700 leading-relaxed whitespace-pre-line"}>{preview}</p>

                    <div id={fullContentId} className={isExpanded ? "block" : "hidden"}>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">{post.content}</p>
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
      </main>
      <Footer />
    </div>
  );
}
