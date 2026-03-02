import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Penny Float en Español: Compara Préstamos y Adelantos | Penny Float";
const PAGE_DESCRIPTION = "Compara opciones de préstamo para negocio y adelantos de efectivo en español. Revisa costos, plazos, APR y recomendaciones para decidir mejor.";
const PAGE_CANONICAL = "https://www.pennyfloat.com/es";

export default function HomeEs() {
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
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">
            Penny Float en Español
          </h1>
          <p className="text-slate-600 max-w-3xl leading-relaxed">
            Compara opciones de financiamiento para negocio y adelantos de efectivo con explicaciones claras sobre costo total, plazo y requisitos. Nuestro objetivo es ayudarte a decidir con información simple y transparente.
          </p>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Qué puedes hacer aquí</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Revisar ofertas en <span className="font-medium">/es/ofertas</span>.</li>
              <li>Leer noticias y tendencias en <span className="font-medium">/es/noticias</span>.</li>
              <li>Usar calculadoras para estimar pagos y costo total.</li>
            </ul>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/es/ofertas">
                <Button>Ver ofertas</Button>
              </Link>
              <Link href="/es/smart-penny">
                <Button variant="outline">Smart Penny</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
