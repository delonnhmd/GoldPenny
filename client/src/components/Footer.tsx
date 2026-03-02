import { ShieldCheck, Lock } from "lucide-react";

export function Footer() {
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
              We compare and explain short-term cash tools so borrowers can make informed decisions. PennyFloat is an educational comparison resource focused on helping people understand costs, terms, and trade-offs.
            </p>
            <p className="text-sm leading-relaxed max-w-md text-slate-400 mt-3">
              MD Media LLC (Texas, USA) • Contact: admin@pennyfloat.com • Publisher: Minh Ho
            </p>
            <div className="flex gap-4 mt-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>256-bit SSL Secured</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Lock className="w-4 h-4" />
                <span>Privacy Protected</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 font-sans">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#about-us" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/#how-it-works-info" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="/#lender-network" className="hover:text-white transition-colors">Lender Network</a></li>
              <li><a href="/#contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 font-sans">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/#terms-of-service" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/#e-consent" className="hover:text-white transition-colors">E-Consent</a></li>
              <li><a href="/affiliate-disclosure" className="hover:text-white transition-colors">Affiliate Disclosure</a></li>
              <li><a href="/#apr-disclosure" className="hover:text-white transition-colors">APR Disclosure</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 text-xs text-slate-500 text-center leading-relaxed">
          <p className="mb-4">
            <>
              <strong>Legal Disclaimer:</strong> MD Media LLC, doing business as PennyFloat, provides educational comparison content. Content on this site is for informational purposes only and does not constitute financial advice. We do not lend money, approve loans, or guarantee rates. Any loan decision, including approval, APR, fees, and repayment terms, comes from the lender or provider you choose.
            </>
          </p>
          <p>
            © {new Date().getFullYear()} MD Media LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
