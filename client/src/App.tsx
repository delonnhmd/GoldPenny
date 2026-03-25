import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageSideAdRails } from "@/components/PageSideAdRails";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Offers from "./pages/Offers";
import News from "./pages/News";
import SmartPenny from "./pages/SmartPenny";
import Admin from "./pages/Admin";
import LoanCalculators from "./pages/LoanCalculators";
import MortgageUnderwriting from "./pages/MortgageUnderwriting";
import MoneyTools from "./pages/MoneyTools";
import ShoppingGuide from "./pages/ShoppingGuide";
import AffiliateDisclosure from "./pages/AffiliateDisclosure";
import TexasCashAdvanceApps2026 from "./pages/TexasCashAdvanceApps2026";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/loan" component={Offers} />
      <Route path="/offers" component={Offers} />
      <Route path="/rates" component={News} />
      <Route path="/smart-penny" component={SmartPenny} />
      <Route path="/texas-cash-advance-apps-2026" component={TexasCashAdvanceApps2026} />
      <Route path="/loan-calculators" component={LoanCalculators} />
      <Route path="/mortgage" component={MortgageUnderwriting} />
      <Route path="/mortgage-underwriting" component={MortgageUnderwriting} />
      <Route path="/money-tools" component={MoneyTools} />
      <Route path="/money-tool" component={MoneyTools} />
      <Route path="/shopping-guide" component={ShoppingGuide} />
      <Route path="/affiliate-disclosure" component={AffiliateDisclosure} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PageSideAdRails />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
