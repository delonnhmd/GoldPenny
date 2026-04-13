import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { setPageSeo } from "@/lib/seo";

type Post = {
  id: number;
  page: string;
  title: string;
  content: string;
  slug: string | null;
  createdAt: string;
  updatedAt: string;
};

const PAGE_BACK_LABELS: Record<string, { label: string; path: string }> = {
  rates: { label: "Business Lending News", path: "/rates" },
  "smart-penny": { label: "Smart Penny", path: "/smart-penny" },
  "shopping-guide": { label: "Shopping Guide", path: "/shopping-guide" },
};

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  const { data: post, isLoading, isError } = useQuery<Post>({
    queryKey: ["post-by-slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/smart-penny-posts/slug/${slug}`);
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    },
    enabled: Boolean(slug),
    retry: false,
  });

  useEffect(() => {
    if (post) {
      setPageSeo({
        title: `${post.title} | PennyFloat`,
        description: post.content.replace(/<[^>]*>/g, "").slice(0, 160),
        canonical: `https://www.pennyfloat.com/post/${post.slug ?? post.id}`,
        robots: "index, follow",
      });
    }
  }, [post]);

  const back = post ? (PAGE_BACK_LABELS[post.page] ?? { label: "Back", path: "/" }) : null;

  return (
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {isLoading && (
            <Card className="p-8 bg-white border-slate-200">
              <p className="text-slate-500">Loading article…</p>
            </Card>
          )}

          {isError && (
            <Card className="p-8 bg-white border-slate-200 text-center">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Article Not Found</h1>
              <p className="text-slate-500 mb-4">This article may have been removed or the link is incorrect.</p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-primary font-semibold hover:underline"
              >
                ← Go back home
              </button>
            </Card>
          )}

          {post && (
            <>
              {back && (
                <button
                  type="button"
                  onClick={() => navigate(back.path)}
                  className="text-sm text-primary font-semibold hover:underline mb-6 inline-block"
                >
                  ← Back to {back.label}
                </button>
              )}

              <Card className="p-6 md:p-10 bg-white border-slate-200">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 leading-tight">
                  {post.title}
                </h1>
                <p className="text-xs text-slate-500 mb-8">
                  Published: {new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>

                <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-bold">
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
                      p: ({ children }) => (
                        <p className="text-slate-700 leading-relaxed mb-4">{children}</p>
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                  <div className="clear-both" />
                </div>

                <div className="mt-10 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-500 italic">
                    PennyFloat is an educational loan comparison platform by MD Media LLC.
                    We connect borrowers with 200+ lending partners. Checking your rate won't affect your credit score.
                  </p>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
