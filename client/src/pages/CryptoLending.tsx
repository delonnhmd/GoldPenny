import { useEffect } from "react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CryptoLendingModule } from "@/components/CryptoLendingModule";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Borrow Against Your Crypto | Crypto-Backed Loans 2026 | PennyFloat";
const PAGE_DESCRIPTION =
  "Get access to funds without selling your crypto assets. Compare crypto-backed loan options including Bitcoin, Ethereum, and stablecoin collateral. No credit check required.";
const PAGE_KEYWORDS =
  "borrow against crypto, crypto backed loan, crypto collateral loan, bitcoin loan, ethereum loan, no credit check crypto loan, crypto lending 2026, nexo crypto loan, borrow without selling crypto";
const PAGE_CANONICAL = "https://www.pennyfloat.com/crypto-loan";

export default function CryptoLending() {
  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      keywords: PAGE_KEYWORDS,
      canonical: PAGE_CANONICAL,
      robots: "index, follow, max-image-preview:large",
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />

      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <CryptoLendingModule />
        </div>
      </main>

      <Footer />
    </div>
  );
}
