import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SeoHreflang } from "@/components/SeoHreflang";
import { LanguageRedirect } from "@/components/LanguageRedirect";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import HomeEs from "@/pages/HomeEs";
import Offers from "./pages/Offers";
import OffersEs from "./pages/OffersEs";
import News from "./pages/News";
import NewsEs from "./pages/NewsEs";
import SmartPenny from "./pages/SmartPenny";
import SmartPennyEs from "./pages/SmartPennyEs";
import Admin from "./pages/Admin";
import LoanCalculators from "./pages/LoanCalculators";
import LoanCalculatorsEs from "./pages/LoanCalculatorsEs";
import AffiliateDisclosure from "./pages/AffiliateDisclosure";
import AffiliateDisclosureEs from "./pages/AffiliateDisclosureEs";
import TexasCashAdvanceApps2026 from "./pages/TexasCashAdvanceApps2026";
import TexasCashAdvanceApps2026Es from "./pages/TexasCashAdvanceApps2026Es";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/es" component={HomeEs} />
      <Route path="/offers" component={Offers} />
      <Route path="/es/ofertas" component={OffersEs} />
      <Route path="/rates" component={News} />
      <Route path="/es/noticias" component={NewsEs} />
      <Route path="/smart-penny" component={SmartPenny} />
      <Route path="/es/smart-penny" component={SmartPennyEs} />
      <Route path="/texas-cash-advance-apps-2026" component={TexasCashAdvanceApps2026} />
      <Route path="/es/apps-adelanto-efectivo-texas-2026" component={TexasCashAdvanceApps2026Es} />
      <Route path="/loan-calculators" component={LoanCalculators} />
      <Route path="/es/calculadoras-de-prestamos" component={LoanCalculatorsEs} />
      <Route path="/affiliate-disclosure" component={AffiliateDisclosure} />
      <Route path="/es/divulgacion-afiliados" component={AffiliateDisclosureEs} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageRedirect />
        <SeoHreflang />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
