import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSmartPennyPosts } from "@/hooks/use-smart-penny-posts";
import { setPageSeo } from "@/lib/seo";
import { setPreferredLanguage } from "@/lib/languageRoutes";
import { translateBatch } from "@/lib/googleTranslate";

const PAGE_TITLE = "Noticias de Tasas y Financiamiento para Pymes | Penny Float";
const PAGE_DESCRIPTION = "Lee noticias en español sobre tasas, condiciones de crédito y tendencias de aprobación para pequeñas empresas.";
const PAGE_CANONICAL = "https://www.pennyfloat.com/es/noticias";

type NewsPost = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
};

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

export default function NewsEs() {
  const { data, isLoading } = useSmartPennyPosts("rates");
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [translatedPosts, setTranslatedPosts] = useState<NewsPost[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      canonical: PAGE_CANONICAL,
      robots: "index, follow, max-image-preview:large",
    });
  }, []);

  useEffect(() => {
    let ignore = false;

    async function translatePosts() {
      const posts = data ?? [];
      if (posts.length === 0) {
        setTranslatedPosts([]);
        return;
      }

      setIsTranslating(true);

      const textList = posts.flatMap((post) => [post.title, post.content]);
      const translated = await translateBatch(textList, {
        sourceLanguage: "en",
        targetLanguage: "es",
      });

      if (ignore) {
        return;
      }

      const localized = posts.map((post, index) => ({
        ...post,
        title: translated[index * 2] ?? post.title,
        content: translated[index * 2 + 1] ?? post.content,
      }));

      setTranslatedPosts(localized as NewsPost[]);
      setIsTranslating(false);
    }

    void translatePosts();

    return () => {
      ignore = true;
    };
  }, [data]);

  const localizedPosts = useMemo(() => {
    const posts = data ?? [];
    if (translatedPosts.length !== posts.length) {
      return posts as NewsPost[];
    }
    return translatedPosts;
  }, [data, translatedPosts]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredPosts = localizedPosts.filter((post) => {
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Noticias de financiamiento para negocio</h1>
              <p className="text-slate-600">Publicaciones y comentarios semanales traducidos automáticamente al español.</p>
            </div>
            <Link href="/rates" onClick={() => setPreferredLanguage("en")}>
              <Button variant="outline">Ver versión en inglés</Button>
            </Link>
          </div>

          <Input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar publicaciones"
            aria-label="Buscar publicaciones"
            className="max-w-md"
          />

          {isLoading || isTranslating ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">Cargando y traduciendo publicaciones…</p>
            </Card>
          ) : localizedPosts.length === 0 ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">Todavía no hay publicaciones en esta sección.</p>
            </Card>
          ) : filteredPosts.length === 0 ? (
            <Card className="p-6 md:p-8 border-slate-200 bg-white">
              <p className="text-slate-500">No se encontraron publicaciones para tu búsqueda.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const isExpanded = Boolean(expandedPosts[post.id]);
                const { preview, isTruncated } = getWordPreview(post.content, 166);
                const fullContentId = `news-post-full-${post.id}`;

                return (
                  <Card key={post.id} className="p-6 md:p-8 border-slate-200 bg-white">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{post.title}</h2>
                    <p className="text-xs text-slate-500 mb-4">Publicado: {new Date(post.createdAt).toLocaleString("es-ES")}</p>

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
                        {isExpanded ? "Mostrar menos" : "Mostrar más"}
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
