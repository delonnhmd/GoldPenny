import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { setPageSeo } from "@/lib/seo";
import { setPreferredLanguage } from "@/lib/languageRoutes";

const PAGE_TITLE = "Divulgación de Afiliados | Penny Float";
const PAGE_DESCRIPTION = "Conoce cómo funciona nuestra divulgación de afiliados y cómo mantenemos transparencia en recomendaciones y comparativas.";
const PAGE_CANONICAL = "https://www.pennyfloat.com/es/divulgacion-afiliados";

export default function AffiliateDisclosureEs() {
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
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Divulgación de Afiliados</h1>
          <p className="text-slate-600 max-w-3xl">Podemos recibir una comisión por algunos enlaces de socios. Esto no afecta el costo para el usuario.</p>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Transparencia para nuestros usuarios</h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>No somos prestamistas y no aprobamos créditos.</li>
              <li>Algunos enlaces pueden generar comisión para nuestro sitio.</li>
              <li>El costo final y condiciones dependen del proveedor elegido.</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/affiliate-disclosure" onClick={() => setPreferredLanguage("en")}>
                <Button variant="outline">Ver versión en inglés</Button>
              </Link>
              <Link href="/es">
                <Button>Inicio en español</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
