import { useEffect, useState } from "react";
import { Check, ShieldCheck, Zap, TrendingUp, Bitcoin, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Borrow Against Your Crypto | Crypto-Backed Loans 2026 | PennyFloat";
const PAGE_DESCRIPTION =
  "Get access to funds without selling your crypto assets. Compare crypto-backed loan options including Bitcoin, Ethereum, and stablecoin collateral. No credit check required.";
const PAGE_KEYWORDS =
  "borrow against crypto, crypto backed loan, crypto collateral loan, bitcoin loan, ethereum loan, no credit check crypto loan, crypto lending 2026, nexo crypto loan, borrow without selling crypto";
const PAGE_CANONICAL = "https://www.pennyfloat.com/crypto-loan";

const MIN_AMOUNT = 500;
const MAX_AMOUNT = 100_000;

type CryptoAsset = "BTC" | "ETH" | "USDT" | "Other";

const CRYPTO_OPTIONS: { id: CryptoAsset; label: string; icon: string }[] = [
  { id: "BTC", label: "Bitcoin (BTC)", icon: "₿" },
  { id: "ETH", label: "Ethereum (ETH)", icon: "Ξ" },
  { id: "USDT", label: "USDT / Stablecoins", icon: "$" },
  { id: "Other", label: "Other", icon: "◈" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Step indicator component scoped to crypto lending labels
function CryptoStepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const labels = ["Assets", "Amount", "Options"];

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center relative">
        {/* Track background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full" />

        {/* Active progress */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full"
          initial={{ width: "0%" }}
          animate={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={stepNumber} className="relative bg-white px-2">
              <motion.div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-colors duration-300
                  ${
                    isActive
                      ? "border-primary bg-primary text-white shadow-lg shadow-primary/30"
                      : isCompleted
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 text-gray-400 bg-white"
                  }
                `}
                initial={false}
                animate={{ scale: isActive ? 1.1 : 1 }}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
              </motion.div>
              <div
                className={`absolute top-10 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
                  isActive ? "text-primary" : "text-gray-400"
                }`}
              >
                {labels[index]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  const [step, setStep] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState<CryptoAsset[]>([]);
  const [borrowAmount, setBorrowAmount] = useState(10_000);

  function toggleAsset(id: CryptoAsset) {
    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function handleNextStep() {
    if (step < 3) setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  return (
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />

      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-xl">

          {/* Page header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
              Borrow Against Your Crypto
            </h1>
            <p className="text-slate-500 text-base">
              Get access to funds without selling your assets
            </p>
          </div>

          {/* Funnel card */}
          <Card className="p-6 md:p-8 shadow-lg border-slate-100 bg-white">
            <CryptoStepIndicator currentStep={step} totalSteps={3} />

            <AnimatePresence mode="wait">
              {/* ── Step 1: Asset Selection ── */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-semibold text-slate-800 mb-4 text-base">
                    What crypto assets do you hold?
                  </p>
                  <p className="text-xs text-slate-400 mb-4">Select all that apply</p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {CRYPTO_OPTIONS.map(({ id, label, icon }) => {
                      const isSelected = selectedAssets.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleAsset(id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-left
                            ${
                              isSelected
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-slate-200 text-slate-700 hover:border-primary/40 hover:bg-slate-50"
                            }
                          `}
                        >
                          <span className="text-lg leading-none">{icon}</span>
                          <span>{label}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 ml-auto flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    className="w-full h-12 text-base font-semibold"
                    disabled={selectedAssets.length === 0}
                    onClick={handleNextStep}
                  >
                    Next Step <span className="ml-1">&rsaquo;</span>
                  </Button>
                </motion.div>
              )}

              {/* ── Step 2: Amount Slider ── */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-semibold text-slate-800 mb-1 text-base">
                    How much do you want to borrow?
                  </p>
                  <p className="text-xs text-slate-400 mb-4">
                    Min: {formatCurrency(MIN_AMOUNT)} — Max:{" "}
                    {formatCurrency(MAX_AMOUNT)}
                  </p>

                  {/* Big amount display */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">
                      {formatCurrency(borrowAmount)}
                    </span>
                  </div>

                  <div className="mb-8">
                    <Slider
                      min={MIN_AMOUNT}
                      max={MAX_AMOUNT}
                      step={500}
                      value={[borrowAmount]}
                      onValueChange={([val]) => setBorrowAmount(val)}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>{formatCurrency(MIN_AMOUNT)}</span>
                      <span>{formatCurrency(MAX_AMOUNT)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 text-base font-semibold"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-[2] h-12 text-base font-semibold"
                      onClick={handleNextStep}
                    >
                      Next Step <span className="ml-1">&rsaquo;</span>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Results ── */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-semibold text-slate-800 mb-4 text-base">
                    Your Crypto Lending Options
                  </p>

                  {/* NEXO card */}
                  <div className="border-2 border-primary rounded-xl p-5 mb-4 relative overflow-hidden">
                    {/* Recommended badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-slate-900">NEXO</span>
                      <Badge className="bg-primary text-white text-xs px-2 py-0.5">
                        Recommended
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 font-medium mb-3">
                      Borrow against crypto assets
                    </p>

                    <ul className="space-y-2 mb-5">
                      {[
                        "No credit check required",
                        "Flexible repayment",
                        "Keep your crypto exposure",
                      ].map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <a
                      href="https://nexo.sjv.io/zzxxQe"
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="block"
                    >
                      <Button className="w-full h-12 text-base font-semibold gap-2">
                        View Your Options
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>

                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Requires crypto collateral. Loan terms depend on asset value and
                      market conditions.
                    </p>
                  </div>

                  {/* Trust signals */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { icon: ShieldCheck, label: "No credit check" },
                      { icon: Bitcoin, label: "Keep your crypto" },
                      { icon: Zap, label: "Fast access" },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-3 text-center"
                      >
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-xs text-slate-600 font-medium leading-tight">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-10 text-sm"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Footer disclaimer */}
          <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed px-2">
            PennyFloat is not a lender. We connect users with third-party financial
            providers. This page may contain affiliate links.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
