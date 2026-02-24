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
              We connect you with a network of trusted lenders to find the best personal loan rates. 
              Our service is free, secure, and won't impact your credit score to check rates.
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
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Lender Network</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 font-sans">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">E-Consent</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Ad Disclosure</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 text-xs text-slate-500 text-center leading-relaxed">
          <p className="mb-4">
            <strong>APR Disclosure:</strong> PennyFloat is not a lender, loan broker or agent for any lender or loan broker. We are an advertising referral service to qualified participating lenders that may be able to provide amounts between $100 and $5,000. Not all lenders can provide these amounts and there is no guarantee that you will be accepted by an independent, participating lender. This service does not constitute an offer or solicitation for loan products which are prohibited by any state law.
          </p>
          <p>
            © {new Date().getFullYear()} PennyFloat. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
