import { Link } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer group">
            <img
              src="/logo.png"
              alt="PennyFloat logo"
              className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/favicon.png";
              }}
            />
            <span className="text-xl font-bold font-display text-slate-900 tracking-tight">PennyFloat</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/rates" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">How it Works</Link>
          <Link href="/market" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Benefits</Link>
          <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-4">
          <a href="#apply" className="hidden sm:block">
            <Button className="font-semibold shadow-md shadow-primary/20">Check Your Rate</Button>
          </a>
          <button className="md:hidden p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
