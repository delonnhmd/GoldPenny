import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { setPageSeo } from "@/lib/seo";
import { setPreferredLanguage } from "@/lib/languageRoutes";

const PAGE_TITLE = "Calculadoras de Préstamos para Negocio | Penny Float";
const PAGE_DESCRIPTION = "Usa calculadoras en español para estimar pagos, costo total y comparar escenarios de financiamiento para negocio.";
const PAGE_CANONICAL = "https://www.pennyfloat.com/es/calculadoras-de-prestamos";

export default function LoanCalculatorsEs() {
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
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Calculadoras de Préstamos</h1>
          <p className="text-slate-600 max-w-3xl">Calcula pago estimado, costo total y diferentes escenarios para comparar opciones de crédito con más claridad.</p>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Usa estas calculadoras para</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Comparar mensualidades entre distintos plazos.</li>
              <li>Estimar el costo total antes de aceptar una oferta.</li>
              <li>Probar escenarios según monto y tasa.</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/loan-calculators" onClick={() => setPreferredLanguage("en")}>
                <Button variant="outline">Ver versión en inglés</Button>
              </Link>
              <Link href="/es/ofertas">
                <Button>Comparar ofertas</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
