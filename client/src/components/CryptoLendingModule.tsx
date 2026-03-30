import { useState } from "react";
import { Check, ShieldCheck, Zap, ExternalLink, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { StepIndicator } from "@/components/StepIndicator";

const MIN_AMOUNT = 500;
const MAX_AMOUNT = 100_000;

type CryptoAsset = "BTC" | "ETH" | "USDT" | "Other";

const CRYPTO_OPTIONS: { id: CryptoAsset; label: string; icon: string }[] = [
  { id: "BTC", label: "Bitcoin (BTC)", icon: "₿" },
  { id: "ETH", label: "Ethereum (ETH)", icon: "Ξ" },
  { id: "USDT", label: "USDT / Stablecoins", icon: "$" },
  { id: "Other", label: "Other", icon: "◈" },
];

const STEP_LABELS = ["Assets", "Amount", "Options"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

type CryptoLendingModuleProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export function CryptoLendingModule({
  title = "Borrow Against Your Crypto",
  subtitle = "Get access to funds without selling your assets",
  className = "",
}: CryptoLendingModuleProps) {
  const [step, setStep] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState<CryptoAsset[]>([]);
  const [borrowAmount, setBorrowAmount] = useState(10_000);

  function toggleAsset(id: CryptoAsset) {
    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  return (
    <div className={`mx-auto w-full max-w-lg ${className}`.trim()}>
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
          {title}
        </h1>
        <p className="text-slate-500 text-base">{subtitle}</p>
      </div>

      <Card className="p-6 md:p-8 shadow-2xl border-slate-100 bg-white/90 backdrop-blur rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-400" />

        <h3 className="text-2xl font-bold text-center mb-6 font-display text-slate-800">
          Check Your Rate
        </h3>

        <StepIndicator currentStep={step} totalSteps={3} labels={STEP_LABELS} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <p className="text-base font-semibold text-slate-700 mb-1">
                  What crypto assets do you hold?
                </p>
                <p className="text-xs text-slate-400 mb-4">Select all that apply</p>
                <div className="grid grid-cols-2 gap-3">
                  {CRYPTO_OPTIONS.map(({ id, label, icon }) => {
                    const isSelected = selectedAssets.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleAsset(id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 text-left
                          ${
                            isSelected
                              ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                              : "border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50"
                          }
                        `}
                      >
                        <span className="text-lg leading-none">{icon}</span>
                        <span>{label}</span>
                        {isSelected && <Check className="w-4 h-4 ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="button"
                className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                disabled={selectedAssets.length === 0}
                onClick={() => setStep(2)}
              >
                Next Step <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <p className="text-base font-semibold text-slate-700 mb-2">
                  How much do you want to borrow?
                </p>
                <div className="pt-2 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-primary">
                      {formatCurrency(borrowAmount)}
                    </span>
                    <span className="text-sm text-slate-500">
                      Min: {formatCurrency(MIN_AMOUNT)} - Max: {formatCurrency(MAX_AMOUNT)}
                    </span>
                  </div>
                  <Slider
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    step={500}
                    value={[borrowAmount]}
                    onValueChange={([val]) => setBorrowAmount(val)}
                    className="py-4"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12"
                >
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-[2] h-12 text-lg font-semibold bg-primary hover:bg-primary/90"
                >
                  Next Step <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <p className="text-base font-semibold text-slate-700">
                Your Crypto Lending Options
              </p>

              <div className="border-2 border-primary rounded-xl p-5">
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
                  {["No credit check required", "Flexible repayment", "Maintain market exposure"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://nexo.sjv.io/zzxxQe"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="block"
                >
                  <Button className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2">
                    View Your Options <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Requires crypto collateral. Loan terms depend on asset value and market conditions.
                </p>
              </div>

              <div className="mx-auto grid max-w-sm grid-cols-2 gap-3">
                {[
                  { icon: ShieldCheck, label: "No credit check" },
                  { icon: Zap, label: "Fast access" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2 py-3 text-center"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-xs text-slate-600 font-medium leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-12"
                >
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                PennyFloat is not a lender. We connect users with third-party financial providers. This page may contain affiliate links.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
