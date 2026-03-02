import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Noticias de Tasas y Financiamiento para Pymes | Penny Float";
const PAGE_DESCRIPTION = "Lee noticias en español sobre tasas, condiciones de crédito y tendencias de aprobación para pequeñas empresas.";
const PAGE_CANONICAL = "https://www.pennyfloat.com/es/noticias";

export default function NewsEs() {
  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      canonical: PAGE_CANONICAL,
      robots: "index, follow, max-image-preview:large",
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Noticias</h1>
          <p className="text-slate-600 max-w-3xl">Actualizaciones de tasas, tendencias de aprobación y cambios en productos financieros para pymes.</p>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Qué encontrarás en esta sección</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Resumen semanal de tasas y condiciones.</li>
              <li>Cambios de criterios de aprobación por perfil.</li>
              <li>Recomendaciones para aplicar con mejor preparación.</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/rates">
                <Button variant="outline">Ver versión en inglés</Button>
              </Link>
              <Link href="/es/ofertas">
                <Button>Ver ofertas</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
