import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketPosts } from "@/hooks/use-market-posts";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

export default function Market() {
  const { data, isLoading } = useMarketPosts("market");
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredPosts = (data ?? []).filter((post) => {
    if (!normalizedSearchTerm) return true;

    const title = post.title.toLowerCase();
    const content = post.content.toLowerCase();
    return title.includes(normalizedSearchTerm) || content.includes(normalizedSearchTerm);
  });

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
          <Input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search market posts"
            aria-label="Search market posts"
            className="max-w-md"
          />

          {isLoading ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">Loading market posts…</p>
            </Card>
          ) : (data ?? []).length === 0 ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">No market posts published yet.</p>
            </Card>
          ) : filteredPosts.length === 0 ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">No market posts match your search.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const isExpanded = Boolean(expandedPosts[post.id]);
                const { preview, isTruncated } = getWordPreview(post.content, 166);
                const fullContentId = `market-post-full-${post.id}`;

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
      </main>
      <Footer />
    </div>
  );
}
