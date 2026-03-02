import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { setPageSeo } from "@/lib/seo";
import { setPreferredLanguage } from "@/lib/languageRoutes";

const PAGE_TITLE = "Ofertas de Préstamos y Adelantos para Negocio | Penny Float";
const PAGE_DESCRIPTION = "Compara ofertas de financiamiento para negocio en español: costo total, APR, comisiones y plazos antes de tomar una decisión.";
const PAGE_CANONICAL = "https://www.pennyfloat.com/es/ofertas";

export default function OffersEs() {
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
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Ofertas</h1>
          <p className="text-slate-600 max-w-3xl">Compara opciones de préstamo y adelanto de efectivo para negocio. Evalúa APR, comisiones, pago semanal/mensual y costo total antes de firmar.</p>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Antes de elegir una oferta</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Compara costo total de pago, no solo la tasa anunciada.</li>
              <li>Valida si hay penalización por pago anticipado.</li>
              <li>Confirma periodicidad de pago y cargos por atraso.</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/offers" onClick={() => setPreferredLanguage("en")}>
                <Button variant="outline">Ver versión en inglés</Button>
              </Link>
              <Link href="/es/calculadoras-de-prestamos">
                <Button>Ir a calculadoras</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
