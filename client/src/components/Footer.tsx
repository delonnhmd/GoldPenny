import { ShieldCheck, Lock } from "lucide-react";
import { useLocation } from "wouter";

export function Footer() {
  const [location] = useLocation();
  const isSpanish = location.startsWith("/es");

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="PennyFloat logo"
                className="w-10 h-10 rounded-lg object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/favicon.png";
                }}
              />
              <h3 className="text-2xl text-white font-display">PennyFloat</h3>
            </div>
            <p className="text-sm leading-relaxed max-w-md text-slate-400">
              {isSpanish
                ? "Comparamos y explicamos herramientas de efectivo a corto plazo para que puedas tomar decisiones informadas. PennyFloat es un recurso educativo que te ayuda a entender costos, plazos y riesgos."
                : "We compare and explain short-term cash tools so borrowers can make informed decisions. PennyFloat is an educational comparison resource focused on helping people understand costs, terms, and trade-offs."}
            </p>
            <p className="text-sm leading-relaxed max-w-md text-slate-400 mt-3">
              {isSpanish
                ? "MD Media LLC (Texas, EE. UU.) • Contacto: admin@pennyfloat.com • Editor: Minh Ho"
                : "MD Media LLC (Texas, USA) • Contact: admin@pennyfloat.com • Publisher: Minh Ho"}
            </p>
            <div className="flex gap-4 mt-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{isSpanish ? "SSL seguro 256-bit" : "256-bit SSL Secured"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Lock className="w-4 h-4" />
                <span>{isSpanish ? "Privacidad protegida" : "Privacy Protected"}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 font-sans">{isSpanish ? "Empresa" : "Company"}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href={isSpanish ? "/es" : "/#about-us"} className="hover:text-white transition-colors">{isSpanish ? "Quiénes somos" : "About Us"}</a></li>
              <li><a href={isSpanish ? "/es" : "/#how-it-works-info"} className="hover:text-white transition-colors">{isSpanish ? "Cómo funciona" : "How It Works"}</a></li>
              <li><a href={isSpanish ? "/es/ofertas" : "/#lender-network"} className="hover:text-white transition-colors">{isSpanish ? "Red de prestamistas" : "Lender Network"}</a></li>
              <li><a href={isSpanish ? "/es" : "/#contact"} className="hover:text-white transition-colors">{isSpanish ? "Contacto" : "Contact"}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 font-sans">{isSpanish ? "Legal" : "Legal"}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href={isSpanish ? "/es" : "/#privacy-policy"} className="hover:text-white transition-colors">{isSpanish ? "Política de privacidad" : "Privacy Policy"}</a></li>
              <li><a href={isSpanish ? "/es" : "/#terms-of-service"} className="hover:text-white transition-colors">{isSpanish ? "Términos de servicio" : "Terms of Service"}</a></li>
              <li><a href={isSpanish ? "/es" : "/#e-consent"} className="hover:text-white transition-colors">{isSpanish ? "Consentimiento electrónico" : "E-Consent"}</a></li>
              <li><a href={isSpanish ? "/es/divulgacion-afiliados" : "/affiliate-disclosure"} className="hover:text-white transition-colors">{isSpanish ? "Divulgación de afiliados" : "Affiliate Disclosure"}</a></li>
              <li><a href={isSpanish ? "/es" : "/#apr-disclosure"} className="hover:text-white transition-colors">{isSpanish ? "Divulgación de APR" : "APR Disclosure"}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 text-xs text-slate-500 text-center leading-relaxed">
          <p className="mb-4">
            {isSpanish ? (
              <>
                <strong>Aviso legal:</strong> MD Media LLC, operando como PennyFloat, ofrece contenido educativo de comparación. El contenido de este sitio es solo informativo y no constituye asesoría financiera. No otorgamos préstamos, no aprobamos créditos y no garantizamos tasas. Cualquier decisión de préstamo, incluyendo aprobación, APR, comisiones y condiciones de pago, depende del proveedor que elijas.
              </>
            ) : (
              <>
                <strong>Legal Disclaimer:</strong> MD Media LLC, doing business as PennyFloat, provides educational comparison content. Content on this site is for informational purposes only and does not constitute financial advice. We do not lend money, approve loans, or guarantee rates. Any loan decision, including approval, APR, fees, and repayment terms, comes from the lender or provider you choose.
              </>
            )}
          </p>
          <p>
            © {new Date().getFullYear()} MD Media LLC. {isSpanish ? "Todos los derechos reservados." : "All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
}
