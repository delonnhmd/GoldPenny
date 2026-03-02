import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Smart Penny en Español: Guías de Financiamiento | Penny Float";
const PAGE_DESCRIPTION = "Aprende a comparar créditos y adelantos con análisis claros sobre costo total, riesgos y mejores prácticas para flujo de efectivo.";
const PAGE_CANONICAL = "https://www.pennyfloat.com/es/smart-penny";

export default function SmartPennyEs() {
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
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Smart Penny</h1>
          <p className="text-slate-600 max-w-3xl">Análisis práctico para entender financiamiento, flujo de efectivo y riesgos de costo en créditos de corto plazo.</p>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Temas principales</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Cómo comparar propuestas con enfoque en costo total.</li>
              <li>Diferencias entre adelantos, líneas y préstamos.</li>
              <li>Errores comunes al elegir financiamiento rápido.</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/smart-penny">
                <Button variant="outline">Ver versión en inglés</Button>
              </Link>
              <Link href="/es/noticias">
                <Button>Ir a noticias</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
