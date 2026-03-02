import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { setPageSeo } from "@/lib/seo";
import { setPreferredLanguage } from "@/lib/languageRoutes";

const PAGE_TITLE = "Apps de Adelanto de Efectivo en Texas 2026: Costos y Riesgos | Penny Float";
const PAGE_DESCRIPTION = "Guía en español para evaluar apps de adelanto de efectivo en Texas: costos totales, riesgos de uso repetido y alternativas más seguras.";
const PAGE_CANONICAL = "https://www.pennyfloat.com/es/apps-adelanto-efectivo-texas-2026";

export default function TexasCashAdvanceApps2026Es() {
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
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Apps de Adelanto de Efectivo en Texas 2026</h1>
          <p className="text-slate-600 max-w-3xl">Guía en español sobre costos, riesgos y criterios para evaluar apps de adelanto de efectivo en Texas.</p>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Qué revisar antes de usar una app</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Costo total cuando hay uso repetido.</li>
              <li>Fecha exacta de cobro y posibles cargos por atraso.</li>
              <li>Impacto en flujo de efectivo semanal o quincenal.</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/texas-cash-advance-apps-2026" onClick={() => setPreferredLanguage("en")}>
                <Button variant="outline">Ver versión en inglés</Button>
              </Link>
              <Link href="/es/ofertas">
                <Button>Ver opciones</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
