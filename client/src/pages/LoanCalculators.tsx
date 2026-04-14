import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AmortizationTable,
  ExportPdfButton,
  GlobalDisclaimers,
  ResultMetrics,
  type SummaryMetric,
} from "@/components/calculators/CalculatorShared";
import {
  calculateBuydownAmortization,
  calculateFixedAmortization,
  formatCurrency,
  formatPercent,
  toNonNegativeNumber,
  toPositiveInt,
  type BuydownType,
} from "@/lib/finance";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Loan Calculators: Mortgage Payment, FHA/VA, Auto, Personal & Business | PennyFloat";
const PAGE_DESCRIPTION =
  "Use this loan calculator hub to estimate mortgage payments, loan amount, down payment, DTI, and amortization for FHA, VA, and conventional home loans, plus auto, personal, and business loan scenarios.";
const PAGE_KEYWORDS =
  "loan calculators, mortgage payment calculator, home loan calculator, FHA loan calculator, VA loan calculator, conventional loan calculator, mortgage affordability calculator, mortgage qualification calculator, DTI calculator for mortgage, how much house can I afford, loan amount calculator, down payment calculator, amortization schedule calculator, refinance calculator, auto loan calculator, personal loan calculator, business loan calculator";
const PAGE_CANONICAL = "https://www.pennyfloat.com/loan-calculators";

const MAX_RATE = 100;

type FeesMode = "percent" | "flat";
type TermUnit = "years" | "months";
type BusinessMode = "term" | "mca";
type DownPaymentInputMode = "amount" | "percent";
type MortgageLoanType = "conventional" | "fha" | "va";
type QualificationStatus = "Strong" | "Possible" | "Needs Review" | "Unlikely";

interface DownPaymentSyncResult {
  downPaymentAmount: number;
  downPaymentPercent: number;
  loanAmount: number;
}

interface DtiRatioResult {
  frontEnd: number;
  backEnd: number;
}

interface LoanTypeGuidanceInput {
  loanType: MortgageLoanType;
  ficoScore: number;
  frontEndDti: number;
  backEndDti: number;
}

const MORTGAGE_PROGRAM_COMPARISON = [
  {
    loanType: "Conventional",
    preferred: "36% preferred",
    maximum: "Up to 50%",
    minFico: "620",
  },
  {
    loanType: "FHA",
    preferred: "43% standard",
    maximum: "Up to ~57% possible",
    minFico: "500 agency / 580+ common lender",
  },
  {
    loanType: "VA",
    preferred: "41% benchmark",
    maximum: "No strict cap",
    minFico: "No official minimum / 580+ common lender",
  },
] as const;

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toWholeNumber(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.round(value);
}

function roundPercentToOneDecimal(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

function syncDownPaymentByAmount(propertyValue: number, downPaymentAmount: number): DownPaymentSyncResult {
  const safePropertyValue = toNonNegativeNumber(propertyValue);
  const clampedAmount = clampNumber(toNonNegativeNumber(downPaymentAmount), 0, safePropertyValue);
  const percent = safePropertyValue > 0 ? (clampedAmount / safePropertyValue) * 100 : 0;

  return {
    downPaymentAmount: clampedAmount,
    downPaymentPercent: roundPercentToOneDecimal(percent),
    loanAmount: Math.max(0, safePropertyValue - clampedAmount),
  };
}

function syncDownPaymentByPercent(propertyValue: number, downPaymentPercent: number): DownPaymentSyncResult {
  const safePropertyValue = toNonNegativeNumber(propertyValue);
  const clampedPercent = clampNumber(toNonNegativeNumber(downPaymentPercent), 0, 100);
  const amount = safePropertyValue * (clampedPercent / 100);

  return {
    downPaymentAmount: amount,
    downPaymentPercent: roundPercentToOneDecimal(clampedPercent),
    loanAmount: Math.max(0, safePropertyValue - amount),
  };
}

function calculateDtiRatios(input: {
  monthlyIncome: number;
  monthlyDebts: number;
  monthlyHousingPayment: number;
}): DtiRatioResult | null {
  const monthlyIncome = toNonNegativeNumber(input.monthlyIncome);
  if (monthlyIncome <= 0) return null;

  const monthlyDebts = toNonNegativeNumber(input.monthlyDebts);
  const monthlyHousingPayment = toNonNegativeNumber(input.monthlyHousingPayment);
  const frontEnd = roundPercentToOneDecimal((monthlyHousingPayment / monthlyIncome) * 100);
  const backEnd = roundPercentToOneDecimal(((monthlyDebts + monthlyHousingPayment) / monthlyIncome) * 100);

  return { frontEnd, backEnd };
}

function getLoanTypeGuidance({ loanType, ficoScore, frontEndDti, backEndDti }: LoanTypeGuidanceInput): string[] {
  const guidance: string[] = [];

  if (loanType === "conventional") {
    if (ficoScore < 620) {
      guidance.push("FICO is below common conventional minimum.");
    }
    if (frontEndDti > 28) {
      guidance.push("Front-end DTI is above the commonly recommended conventional range (~28%).");
    }
    if (backEndDti <= 36) {
      guidance.push("Within preferred conventional DTI range.");
    } else if (backEndDti <= 45) {
      guidance.push("May qualify for conventional financing depending on full file strength.");
    } else if (backEndDti <= 50) {
      guidance.push("Possible with strong credit, reserves, or AUS approval.");
    } else {
      guidance.push("Above common conventional DTI limits.");
    }
    return guidance;
  }

  if (loanType === "fha") {
    if (ficoScore < 500) {
      guidance.push("FICO is below FHA minimum.");
    } else if (ficoScore < 580) {
      guidance.push("Meets agency minimum but may not meet many lender overlays.");
    }

    if (frontEndDti > 31) {
      guidance.push("Front-end DTI is above the standard FHA benchmark (31%).");
    }

    if (backEndDti <= 43) {
      guidance.push("Within standard FHA DTI guideline.");
    } else if (backEndDti <= 50) {
      guidance.push("May still qualify with AUS approval.");
    } else if (backEndDti <= 57) {
      guidance.push("Possible with strong compensating factors.");
    } else {
      guidance.push("Above common FHA approval range.");
    }
    return guidance;
  }

  if (ficoScore < 580) {
    guidance.push("VA has no official minimum, but many lenders require higher scores.");
  }
  if (backEndDti <= 41) {
    guidance.push("Within VA benchmark ratio.");
  } else {
    guidance.push("Above VA benchmark; approval may still be possible if residual income is strong.");
  }
  guidance.push("VA loans do not use a strict DTI cap like other programs.");
  return guidance;
}

function getQualificationStatus(input: {
  loanType: MortgageLoanType;
  ficoScore: number;
  backEndDti: number;
}): QualificationStatus {
  const fico = input.ficoScore;
  const backEndDti = input.backEndDti;

  if (input.loanType === "conventional") {
    if (fico >= 680 && backEndDti <= 36) return "Strong";
    if (fico >= 620 && backEndDti <= 45) return "Possible";
    if (fico >= 620 && backEndDti <= 50) return "Needs Review";
    return "Unlikely";
  }

  if (input.loanType === "fha") {
    if (fico >= 620 && backEndDti <= 43) return "Strong";
    if (fico >= 580 && backEndDti <= 50) return "Possible";
    if (fico >= 500 && backEndDti <= 57) return "Needs Review";
    return "Unlikely";
  }

  if (fico >= 620 && backEndDti <= 41) return "Strong";
  if (fico >= 580 && backEndDti <= 50) return "Possible";
  if (fico < 500 && backEndDti > 65) return "Unlikely";
  return "Needs Review";
}

function getQualificationBadgeClasses(status: QualificationStatus): string {
  if (status === "Strong") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "Possible") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "Needs Review") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

function clampRate(value: number): number {
  return Math.min(MAX_RATE, toNonNegativeNumber(value));
}

function termToMonths(value: number, unit: TermUnit): number {
  const safe = toPositiveInt(value, 1);
  return unit === "years" ? safe * 12 : safe;
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

function NumberField({ id, label, value, onChange, min = 0, max, step = 1, suffix }: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          className={suffix ? "no-number-spinner pr-10" : "no-number-spinner"}
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            onChange(Number.isFinite(nextValue) ? nextValue : 0);
          }}
        />
        {suffix ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{suffix}</span> : null}
      </div>
    </div>
  );
}

export default function LoanCalculators() {
  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      keywords: PAGE_KEYWORDS,
      canonical: PAGE_CANONICAL,
      robots: "index, follow, max-image-preview:large",
    });
  }, []);

  const [activeTab, setActiveTab] = useState("mortgage");

  const initialMortgageSync = syncDownPaymentByPercent(400000, 20);
  const [propertyValue, setPropertyValue] = useState(400000);
  const [downPaymentInputMode, setDownPaymentInputMode] = useState<DownPaymentInputMode>("percent");
  const [downPaymentAmount, setDownPaymentAmount] = useState(initialMortgageSync.downPaymentAmount);
  const [downPaymentPercent, setDownPaymentPercent] = useState(initialMortgageSync.downPaymentPercent);
  const [mortgageLoanType, setMortgageLoanType] = useState<MortgageLoanType>("conventional");
  const [ficoScore, setFicoScore] = useState(680);
  const [monthlyIncome, setMonthlyIncome] = useState(9000);
  const [otherMonthlyDebts, setOtherMonthlyDebts] = useState(500);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [mortgageTermChoice, setMortgageTermChoice] = useState("30");
  const [mortgageCustomYears, setMortgageCustomYears] = useState(25);
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(4800);
  const [insuranceAnnual, setInsuranceAnnual] = useState(1800);
  const [hoaMonthly, setHoaMonthly] = useState(0);
  const [miMonthly, setMiMonthly] = useState(0);

  const syncMortgageByAmount = (nextPropertyValue: number, nextDownPaymentAmount: number) => {
    const synced = syncDownPaymentByAmount(nextPropertyValue, nextDownPaymentAmount);
    setDownPaymentAmount(synced.downPaymentAmount);
    setDownPaymentPercent(synced.downPaymentPercent);
  };

  const syncMortgageByPercent = (nextPropertyValue: number, nextDownPaymentPercent: number) => {
    const synced = syncDownPaymentByPercent(nextPropertyValue, nextDownPaymentPercent);
    setDownPaymentAmount(synced.downPaymentAmount);
    setDownPaymentPercent(synced.downPaymentPercent);
  };

  const handlePropertyValueChange = (value: number) => {
    const nextPropertyValue = toNonNegativeNumber(value);
    setPropertyValue(nextPropertyValue);
    if (downPaymentInputMode === "amount") {
      syncMortgageByAmount(nextPropertyValue, downPaymentAmount);
    } else {
      syncMortgageByPercent(nextPropertyValue, downPaymentPercent);
    }
  };

  const handleDownPaymentModeChange = (value: DownPaymentInputMode) => {
    setDownPaymentInputMode(value);
    if (value === "amount") {
      syncMortgageByAmount(propertyValue, downPaymentAmount);
    } else {
      syncMortgageByPercent(propertyValue, downPaymentPercent);
    }
  };

  const handleDownPaymentAmountChange = (value: number) => {
    syncMortgageByAmount(propertyValue, value);
  };

  const handleDownPaymentPercentChange = (value: number) => {
    syncMortgageByPercent(propertyValue, value);
  };

  const mortgageTermYears = mortgageTermChoice === "custom" ? mortgageCustomYears : Number(mortgageTermChoice);
  const mortgageTermMonths = toPositiveInt(mortgageTermYears, 1) * 12;
  const mortgageAmount = Math.max(0, toNonNegativeNumber(propertyValue) - toNonNegativeNumber(downPaymentAmount));
  const propertyTaxMonthly = toNonNegativeNumber(propertyTaxAnnual) / 12;
  const insuranceMonthly = toNonNegativeNumber(insuranceAnnual) / 12;

  const mortgageResult = useMemo(
    () =>
      calculateFixedAmortization({
        loanAmount: toNonNegativeNumber(mortgageAmount),
        annualRateAPR: clampRate(mortgageRate),
        termMonths: mortgageTermMonths,
      }),
    [mortgageAmount, mortgageRate, mortgageTermMonths],
  );

  const mortgageExtras =
    toNonNegativeNumber(propertyTaxMonthly) +
    toNonNegativeNumber(insuranceMonthly) +
    toNonNegativeNumber(hoaMonthly) +
    toNonNegativeNumber(miMonthly);

  const [refiCurrentBalance, setRefiCurrentBalance] = useState(300000);
  const [refiCurrentRate, setRefiCurrentRate] = useState(6.75);
  const [refiCurrentTermValue, setRefiCurrentTermValue] = useState(25);
  const [refiCurrentTermUnit, setRefiCurrentTermUnit] = useState<TermUnit>("years");
  const [refiNewRate, setRefiNewRate] = useState(5.9);
  const [refiNewTermValue, setRefiNewTermValue] = useState(30);
  const [refiNewTermUnit, setRefiNewTermUnit] = useState<TermUnit>("years");
  const [refiClosingCosts, setRefiClosingCosts] = useState(6000);
  const [refiCashOut, setRefiCashOut] = useState(0);

  const refiCurrentMonths = termToMonths(refiCurrentTermValue, refiCurrentTermUnit);
  const refiNewMonths = termToMonths(refiNewTermValue, refiNewTermUnit);
  const refinanceCurrentResult = useMemo(
    () =>
      calculateFixedAmortization({
        loanAmount: toNonNegativeNumber(refiCurrentBalance),
        annualRateAPR: clampRate(refiCurrentRate),
        termMonths: refiCurrentMonths,
      }),
    [refiCurrentBalance, refiCurrentMonths, refiCurrentRate],
  );

  const refinanceNewPrincipal = toNonNegativeNumber(refiCurrentBalance) + toNonNegativeNumber(refiCashOut);
  const refinanceNewResult = useMemo(
    () =>
      calculateFixedAmortization({
        loanAmount: refinanceNewPrincipal,
        annualRateAPR: clampRate(refiNewRate),
        termMonths: refiNewMonths,
      }),
    [refiNewMonths, refiNewRate, refinanceNewPrincipal],
  );

  const refinanceSavingsPerMonth = refinanceCurrentResult.monthlyPayment - refinanceNewResult.monthlyPayment;
  const refinanceBreakEvenMonths =
    refinanceSavingsPerMonth > 0 && toNonNegativeNumber(refiClosingCosts) > 0
      ? toNonNegativeNumber(refiClosingCosts) / refinanceSavingsPerMonth
      : null;

  const [buydownAmount, setBuydownAmount] = useState(400000);
  const [buydownNoteRate, setBuydownNoteRate] = useState(6.75);
  const [buydownTermYears, setBuydownTermYears] = useState(30);
  const [buydownType, setBuydownType] = useState<BuydownType>("2-1");
  const [buydownMonthlyMI, setBuydownMonthlyMI] = useState(0);
  const [buydownMonthlyTax, setBuydownMonthlyTax] = useState(0);

  const buydownResult = useMemo(
    () =>
      calculateBuydownAmortization({
        loanAmount: toNonNegativeNumber(buydownAmount),
        noteRateAPR: clampRate(buydownNoteRate),
        termMonths: toPositiveInt(buydownTermYears, 1) * 12,
        buydownType,
      }),
    [buydownAmount, buydownNoteRate, buydownTermYears, buydownType],
  );

  const [carPrice, setCarPrice] = useState(35000);
  const [carDownPayment, setCarDownPayment] = useState(5000);
  const [carTradeIn, setCarTradeIn] = useState(0);
  const [carFeesMode, setCarFeesMode] = useState<FeesMode>("percent");
  const [carFeesValue, setCarFeesValue] = useState(8);
  const [carRate, setCarRate] = useState(7.2);
  const [carTermMonths, setCarTermMonths] = useState(60);

  const carFees =
    carFeesMode === "percent"
      ? toNonNegativeNumber(carPrice) * (toNonNegativeNumber(carFeesValue) / 100)
      : toNonNegativeNumber(carFeesValue);

  const carLoanAmount = Math.max(
    0,
    toNonNegativeNumber(carPrice) - toNonNegativeNumber(carDownPayment) - toNonNegativeNumber(carTradeIn) + carFees,
  );

  const carResult = useMemo(
    () =>
      calculateFixedAmortization({
        loanAmount: carLoanAmount,
        annualRateAPR: clampRate(carRate),
        termMonths: toPositiveInt(carTermMonths, 1),
      }),
    [carLoanAmount, carRate, carTermMonths],
  );

  const [personalAmount, setPersonalAmount] = useState(15000);
  const [personalRate, setPersonalRate] = useState(11.5);
  const [personalTermMonths, setPersonalTermMonths] = useState(48);
  const [personalOriginationFeePct, setPersonalOriginationFeePct] = useState(0);

  const personalResult = useMemo(
    () =>
      calculateFixedAmortization({
        loanAmount: toNonNegativeNumber(personalAmount),
        annualRateAPR: clampRate(personalRate),
        termMonths: toPositiveInt(personalTermMonths, 1),
      }),
    [personalAmount, personalRate, personalTermMonths],
  );

  const personalOriginationFeeAmount = toNonNegativeNumber(personalAmount) * (toNonNegativeNumber(personalOriginationFeePct) / 100);
  const personalNetCash = Math.max(0, toNonNegativeNumber(personalAmount) - personalOriginationFeeAmount);

  const [businessMode, setBusinessMode] = useState<BusinessMode>("term");
  const [businessAmount, setBusinessAmount] = useState(75000);
  const [businessRate, setBusinessRate] = useState(10.5);
  const [businessTermMonths, setBusinessTermMonths] = useState(60);

  const businessResult = useMemo(
    () =>
      calculateFixedAmortization({
        loanAmount: toNonNegativeNumber(businessAmount),
        annualRateAPR: clampRate(businessRate),
        termMonths: toPositiveInt(businessTermMonths, 1),
      }),
    [businessAmount, businessRate, businessTermMonths],
  );

  const totalMonthlyMortgagePayment = mortgageResult.monthlyPayment + mortgageExtras;
  const ficoScoreWhole = toWholeNumber(ficoScore, 0);
  const ficoForGuidance = clampNumber(ficoScoreWhole, 300, 850);
  const isFicoInRange = ficoScoreWhole >= 300 && ficoScoreWhole <= 850;

  const dtiRatios = useMemo(
    () =>
      calculateDtiRatios({
        monthlyIncome: toNonNegativeNumber(monthlyIncome),
        monthlyDebts: toNonNegativeNumber(otherMonthlyDebts),
        monthlyHousingPayment: totalMonthlyMortgagePayment,
      }),
    [monthlyIncome, otherMonthlyDebts, totalMonthlyMortgagePayment],
  );

  const qualificationStatus: QualificationStatus = useMemo(() => {
    if (!dtiRatios || !isFicoInRange) return "Needs Review";
    return getQualificationStatus({
      loanType: mortgageLoanType,
      ficoScore: ficoForGuidance,
      backEndDti: dtiRatios.backEnd,
    });
  }, [dtiRatios, ficoForGuidance, isFicoInRange, mortgageLoanType]);

  const mortgageGuidance = useMemo(() => {
    if (!dtiRatios) {
      return ["Enter monthly income to calculate front-end and back-end DTI guidance."];
    }

    const messages = getLoanTypeGuidance({
      loanType: mortgageLoanType,
      ficoScore: ficoForGuidance,
      frontEndDti: dtiRatios.frontEnd,
      backEndDti: dtiRatios.backEnd,
    });

    if (!isFicoInRange) {
      messages.unshift("Enter a FICO score between 300 and 850 for more accurate guidance.");
    }

    return messages;
  }, [dtiRatios, ficoForGuidance, isFicoInRange, mortgageLoanType]);

  const homeLoanSummaryMetrics: SummaryMetric[] = [
    { label: "Property Value", value: formatCurrency(propertyValue) },
    { label: "Down Payment ($)", value: formatCurrency(downPaymentAmount) },
    { label: "Down Payment (%)", value: formatPercent(downPaymentPercent, 1) },
    { label: "Estimated Loan Amount", value: formatCurrency(mortgageAmount) },
  ];

  const monthlyPaymentBreakdownMetrics: SummaryMetric[] = [
    { label: "Principal & Interest", value: formatCurrency(mortgageResult.monthlyPayment) },
    { label: "Property Tax (Monthly Est.)", value: formatCurrency(propertyTaxMonthly) },
    { label: "Insurance (Monthly Est.)", value: formatCurrency(insuranceMonthly) },
    { label: "Monthly MI / MIP", value: formatCurrency(miMonthly) },
    { label: "HOA (Monthly)", value: formatCurrency(hoaMonthly) },
    { label: "Total Monthly Mortgage Payment", value: formatCurrency(totalMonthlyMortgagePayment) },
    { label: "Total Interest Over Full Term", value: formatCurrency(mortgageResult.totalInterest) },
  ];

  const dtiSummaryMetrics: SummaryMetric[] = [
    { label: "Front-end DTI", value: dtiRatios ? formatPercent(dtiRatios.frontEnd, 1) : "N/A" },
    { label: "Back-end DTI", value: dtiRatios ? formatPercent(dtiRatios.backEnd, 1) : "N/A" },
    {
      label: "Monthly Income",
      value: formatCurrency(monthlyIncome),
    },
    {
      label: "Other Monthly Debts",
      value: formatCurrency(otherMonthlyDebts),
    },
  ];

  const mortgageAmortizationMetrics: SummaryMetric[] = [
    { label: "Loan Amount", value: formatCurrency(mortgageAmount) },
    { label: "Monthly Payment (P&I)", value: formatCurrency(mortgageResult.monthlyPayment) },
    { label: "Total Interest", value: formatCurrency(mortgageResult.totalInterest) },
    { label: "Total Paid", value: formatCurrency(mortgageResult.totalPaid) },
    { label: "Total Monthly Mortgage", value: formatCurrency(totalMonthlyMortgagePayment) },
  ];

  const refinanceMetrics: SummaryMetric[] = [
    { label: "Current Monthly P&I", value: formatCurrency(refinanceCurrentResult.monthlyPayment) },
    { label: "New Monthly P&I", value: formatCurrency(refinanceNewResult.monthlyPayment) },
    { label: "Monthly Difference", value: formatCurrency(refinanceSavingsPerMonth) },
    {
      label: "Break-even Months",
      value: refinanceBreakEvenMonths ? `${Math.ceil(refinanceBreakEvenMonths)} months` : "N/A",
      hint: refinanceSavingsPerMonth > 0 ? "Closing costs divided by monthly savings." : "No positive monthly savings to break even.",
    },
    {
      label: "Remaining Interest (Current Loan)",
      value: formatCurrency(refinanceCurrentResult.totalInterest),
    },
    {
      label: "Interest on New Loan",
      value: formatCurrency(refinanceNewResult.totalInterest),
    },
  ];

  const escrowMonthly = toNonNegativeNumber(buydownMonthlyMI) + toNonNegativeNumber(buydownMonthlyTax);
  const withEscrow = (pi: number | undefined | null) =>
    pi && Number.isFinite(pi) ? formatCurrency(pi + escrowMonthly) : "N/A";

  const buydownMetrics: SummaryMetric[] = [
    { label: "Baseline Monthly at Note Rate", value: withEscrow(buydownResult.baseline.monthlyPayment) },
    { label: "Year 1 Monthly Payment", value: withEscrow(buydownResult.paymentSnapshots.year1) },
    { label: "Year 2 Monthly Payment", value: withEscrow(buydownResult.paymentSnapshots.year2) },
    { label: "Year 3 Monthly Payment", value: withEscrow(buydownResult.paymentSnapshots.year3) },
    { label: "Year 4 Actual Monthly Payment", value: withEscrow(buydownResult.paymentSnapshots.year4Actual), hint: "This is the note-rate payment after the temporary buydown period." },
    { label: "Estimated Buydown Cost", value: formatCurrency(buydownResult.savings.estimatedBuydownCost) },
  ];

  const carMetrics: SummaryMetric[] = [
    { label: "Calculated Loan Amount", value: formatCurrency(carLoanAmount) },
    { label: "Monthly Payment (P&I)", value: formatCurrency(carResult.monthlyPayment) },
    { label: "Total Interest", value: formatCurrency(carResult.totalInterest) },
    { label: "Total Paid", value: formatCurrency(carResult.totalPaid) },
  ];

  const personalMetrics: SummaryMetric[] = [
    { label: "Monthly Payment", value: formatCurrency(personalResult.monthlyPayment) },
    { label: "Total Interest", value: formatCurrency(personalResult.totalInterest) },
    { label: "Total Paid", value: formatCurrency(personalResult.totalPaid) },
    { label: "Net Cash Received", value: formatCurrency(personalNetCash), hint: "Loan amount minus origination fee." },
  ];

  const businessMetrics: SummaryMetric[] = [
    { label: "Business Term Loan Payment", value: formatCurrency(businessResult.monthlyPayment) },
    { label: "Total Interest", value: formatCurrency(businessResult.totalInterest) },
    { label: "Total Paid", value: formatCurrency(businessResult.totalPaid) },
  ];

  return (
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Loan Calculators</h1>
            <p className="text-slate-600 mt-2">Run quick payment estimates across mortgage, refinance, auto, personal, and business scenarios.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full h-auto p-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
              <TabsTrigger value="mortgage">Mortgage</TabsTrigger>
              <TabsTrigger value="refinance">Refinance</TabsTrigger>
              <TabsTrigger value="buydown">Buydown Mortgage</TabsTrigger>
              <TabsTrigger value="car">Car Loan</TabsTrigger>
              <TabsTrigger value="personal">Personal Loan</TabsTrigger>
              <TabsTrigger value="business">Business Loan</TabsTrigger>
            </TabsList>

            <TabsContent value="mortgage" className="space-y-4">
              <Card className="p-5 border-slate-200 bg-white space-y-3">
                <h2 className="text-2xl font-semibold text-slate-900">Mortgage Payment &amp; Qualification Calculator</h2>
                <p className="text-sm text-slate-600">
                  Use this mortgage payment calculator to estimate your monthly payment, loan amount, down payment, DTI ratio, and basic eligibility for FHA, VA, and conventional loans.
                  Enter the property value, down payment, interest rate, loan term, taxes, insurance, income, debts, loan type, and FICO score to view your estimated mortgage scenario.
                  This combines a mortgage payment calculator, home loan calculator, FHA loan calculator, VA loan calculator, conventional loan calculator, mortgage affordability calculator,
                  and DTI calculator for mortgage scenarios to help answer how much house can I afford.
                </p>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5 border-slate-200 bg-white space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Mortgage Inputs</h2>
                  {/* Home Price with slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="property-value">Home Price</Label>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(propertyValue)}</span>
                    </div>
                    <Slider
                      value={[propertyValue]}
                      onValueChange={([v]) => handlePropertyValueChange(v)}
                      min={50000}
                      max={2000000}
                      step={5000}
                      className="mt-1"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>$50k</span><span>$2M</span>
                    </div>
                    <NumberField
                      id="property-value"
                      label=""
                      value={propertyValue}
                      onChange={handlePropertyValueChange}
                      step={1000}
                    />
                  </div>

                  {/* Down Payment with slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Down Payment</Label>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(downPaymentAmount)} <span className="text-slate-500 font-normal">| {formatPercent(downPaymentPercent, 1)}</span></span>
                    </div>
                    <Slider
                      value={[downPaymentPercent]}
                      onValueChange={([v]) => syncMortgageByPercent(propertyValue, v)}
                      min={0}
                      max={50}
                      step={0.5}
                      className="mt-1"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>0%</span><span>50%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="down-payment-type">Down Payment Input Mode</Label>
                      <Select value={downPaymentInputMode} onValueChange={(value) => handleDownPaymentModeChange(value as DownPaymentInputMode)}>
                        <SelectTrigger id="down-payment-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">Dollar Amount</SelectItem>
                          <SelectItem value="percent">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {downPaymentInputMode === "amount" ? (
                      <NumberField
                        id="down-payment-amount"
                        label="Down Payment ($)"
                        value={downPaymentAmount}
                        onChange={handleDownPaymentAmountChange}
                        step={500}
                      />
                    ) : (
                      <NumberField
                        id="down-payment-percent"
                        label="Down Payment (%)"
                        value={downPaymentPercent}
                        onChange={handleDownPaymentPercentChange}
                        step={0.1}
                        max={100}
                        suffix="%"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="down-payment-auto">
                        {downPaymentInputMode === "amount" ? "Down Payment (%)" : "Down Payment ($)"}
                      </Label>
                      <Input
                        id="down-payment-auto"
                        readOnly
                        value={downPaymentInputMode === "amount" ? formatPercent(downPaymentPercent, 1) : formatCurrency(downPaymentAmount)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loan-amount-auto">Loan Amount (Auto)</Label>
                      <Input id="loan-amount-auto" readOnly value={formatCurrency(mortgageAmount)} />
                    </div>
                  </div>
                  {propertyValue <= 0 ? (
                    <p className="text-xs text-red-700">Enter a property value greater than $0.</p>
                  ) : null}
                  {downPaymentAmount >= propertyValue && propertyValue > 0 ? (
                    <p className="text-xs text-amber-700">Down payment is at or above property value. Loan amount is zero.</p>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="mortgage-loan-type">Loan Type</Label>
                      <Select value={mortgageLoanType} onValueChange={(value) => setMortgageLoanType(value as MortgageLoanType)}>
                        <SelectTrigger id="mortgage-loan-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conventional">Conventional</SelectItem>
                          <SelectItem value="fha">FHA</SelectItem>
                          <SelectItem value="va">VA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <NumberField
                      id="fico-score"
                      label="FICO Score"
                      value={ficoScore}
                      onChange={(value) => setFicoScore(toWholeNumber(value, 0))}
                      min={0}
                      max={900}
                      step={1}
                    />
                  </div>
                  {!isFicoInRange ? (
                    <p className="text-xs text-red-700">Enter a whole-number FICO score between 300 and 850.</p>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <NumberField
                      id="monthly-income"
                      label="Monthly Income (Gross)"
                      value={monthlyIncome}
                      onChange={(value) => setMonthlyIncome(toNonNegativeNumber(value))}
                      step={100}
                    />
                    <NumberField
                      id="monthly-debts"
                      label="Other Monthly Debts"
                      value={otherMonthlyDebts}
                      onChange={(value) => setOtherMonthlyDebts(toNonNegativeNumber(value))}
                      step={50}
                    />
                  </div>

                  {/* APR / Interest Rate — prominent */}
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "linear-gradient(135deg, #0a1628, #0f2044)" }}>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-white">APR / Interest Rate</Label>
                      <span className="text-xl font-extrabold" style={{ color: "#c9a84c" }}>{mortgageRate.toFixed(3)}%</span>
                    </div>
                    <Slider
                      value={[mortgageRate]}
                      onValueChange={([v]) => setMortgageRate(clampRate(v))}
                      min={2}
                      max={18}
                      step={0.001}
                    />
                    <div className="flex justify-between text-xs" style={{ color: "#94b4d8" }}>
                      <span>2%</span><span>18%</span>
                    </div>
                    <NumberField id="mortgage-rate" label="" value={mortgageRate} onChange={(value) => setMortgageRate(clampRate(value))} step={0.001} max={MAX_RATE} suffix="%" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mortgage-term">Term (Years)</Label>
                    <Select value={mortgageTermChoice} onValueChange={setMortgageTermChoice}>
                      <SelectTrigger id="mortgage-term">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {mortgageTermChoice === "custom" ? (
                    <NumberField id="mortgage-custom-term" label="Custom Term (Years)" value={mortgageCustomYears} onChange={(value) => setMortgageCustomYears(toPositiveInt(value, 1))} min={1} max={50} />
                  ) : null}

                  <Accordion type="single" collapsible>
                    <AccordionItem value="mortgage-advanced">
                      <AccordionTrigger>Advanced (Taxes, Insurance, HOA, MI / MIP)</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <NumberField id="property-tax-annual" label="Annual Property Tax" value={propertyTaxAnnual} onChange={(value) => setPropertyTaxAnnual(toNonNegativeNumber(value))} step={100} />
                          <NumberField id="home-insurance-annual" label="Annual Homeowners Insurance" value={insuranceAnnual} onChange={(value) => setInsuranceAnnual(toNonNegativeNumber(value))} step={100} />
                          <NumberField id="hoa" label="HOA (Monthly)" value={hoaMonthly} onChange={(value) => setHoaMonthly(toNonNegativeNumber(value))} step={1} />
                          <NumberField id="mi" label="Monthly MI / MIP (Optional)" value={miMonthly} onChange={(value) => setMiMonthly(toNonNegativeNumber(value))} step={1} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>

                <div className="space-y-4">
                  {/* ── Payment Hero ── */}
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <div style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f2044 60%, #1a3a6b 100%)" }} className="p-5 space-y-4">
                      <div>
                        <div className="flex items-end gap-1">
                          <span className="text-4xl font-extrabold text-white">{formatCurrency(totalMonthlyMortgagePayment)}</span>
                          <span className="text-slate-400 text-base mb-1">/mo</span>
                        </div>
                        <p className="text-slate-400 text-sm mt-0.5">
                          {mortgageTermYears}-Year Fixed &nbsp;·&nbsp; {mortgageRate.toFixed(3)}% APR
                        </p>
                      </div>
                      {/* Breakdown bar */}
                      {totalMonthlyMortgagePayment > 0 && (
                        <div className="space-y-2">
                          <div className="flex w-full h-3 rounded-full overflow-hidden">
                            <div style={{ width: `${(mortgageResult.monthlyPayment / totalMonthlyMortgagePayment) * 100}%`, background: "#ef4444" }} />
                            <div style={{ width: `${(propertyTaxMonthly / totalMonthlyMortgagePayment) * 100}%`, background: "#3b82f6" }} />
                            <div style={{ width: `${(insuranceMonthly / totalMonthlyMortgagePayment) * 100}%`, background: "#14b8a6" }} />
                            <div style={{ width: `${(hoaMonthly / totalMonthlyMortgagePayment) * 100}%`, background: "#22c55e" }} />
                            {miMonthly > 0 && <div style={{ width: `${(miMonthly / totalMonthlyMortgagePayment) * 100}%`, background: "#a855f7" }} />}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#ef4444" }} /><span className="text-slate-300">Principal &amp; Interest</span><span className="ml-auto font-semibold text-white">{formatCurrency(mortgageResult.monthlyPayment)}</span></div>
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#14b8a6" }} /><span className="text-slate-300">Home Insurance</span><span className="ml-auto font-semibold text-white">{formatCurrency(insuranceMonthly)}</span></div>
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#3b82f6" }} /><span className="text-slate-300">Property Tax</span><span className="ml-auto font-semibold text-white">{formatCurrency(propertyTaxMonthly)}</span></div>
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#22c55e" }} /><span className="text-slate-300">HOA Fees</span><span className="ml-auto font-semibold text-white">{formatCurrency(hoaMonthly)}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4 border-slate-200 bg-white space-y-3">
                    <h3 className="text-base font-semibold text-slate-900">1. Home / Loan Summary</h3>
                    <ResultMetrics metrics={homeLoanSummaryMetrics} />
                  </Card>

                  <Card className="p-4 border-slate-200 bg-white space-y-3">
                    <h3 className="text-base font-semibold text-slate-900">2. Monthly Payment Breakdown</h3>
                    <ResultMetrics metrics={monthlyPaymentBreakdownMetrics} />
                  </Card>

                  <Card className="p-4 border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-900">3. DTI &amp; Qualification Summary</h3>
                      <Badge className={`border ${getQualificationBadgeClasses(qualificationStatus)}`}>{qualificationStatus}</Badge>
                    </div>
                    <ResultMetrics metrics={dtiSummaryMetrics} />
                    <p className="text-sm text-slate-600">Front-end DTI = housing expense compared to income.</p>
                    <p className="text-sm text-slate-600">Back-end DTI = all monthly debt compared to income.</p>
                    {toNonNegativeNumber(monthlyIncome) <= 0 ? (
                      <p className="text-xs text-red-700">Enter monthly income greater than $0 to calculate DTI ratios.</p>
                    ) : null}
                    <p className="text-xs text-slate-600">This is an estimate only and not a loan approval.</p>
                  </Card>

                  <Card className="p-4 border-slate-200 bg-white space-y-3">
                    <h3 className="text-base font-semibold text-slate-900">4. Loan Program Guidance</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                      {mortgageGuidance.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>

                    <div className="pt-2">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Loan Type Comparison</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Loan Type</TableHead>
                            <TableHead>Preferred / Standard DTI</TableHead>
                            <TableHead>Maximum Typical</TableHead>
                            <TableHead>Minimum FICO</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {MORTGAGE_PROGRAM_COMPARISON.map((row) => (
                            <TableRow key={row.loanType}>
                              <TableCell>{row.loanType}</TableCell>
                              <TableCell>{row.preferred}</TableCell>
                              <TableCell>{row.maximum}</TableCell>
                              <TableCell>{row.minFico}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  <Card className="p-4 border-slate-200 bg-white space-y-3">
                    <h3 className="text-base font-semibold text-slate-900">Ready for real numbers from a licensed lender?</h3>
                    <p className="text-sm text-slate-600">Get a personalized quote from Champions Mortgage — no hard credit pull to start.</p>
                    <a
                      href="https://championsmortgage.pos.yoursonar.com/?originator=Minh@championsmortgageteam.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-xl text-base font-bold transition-all duration-200"
                      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f2044 100%)", color: "#ffffff", padding: "12px 24px", textDecoration: "none", boxShadow: "0 4px 16px rgba(10,22,40,0.3)" }}
                    >
                      Get a Custom Quote
                    </a>
                    <p className="text-xs text-slate-500">Champions Mortgage · NMLS # 2740375 · Licensed in TX, FL, GA &amp; NC. Not a commitment to lend.</p>
                  </Card>
                  <GlobalDisclaimers />
                </div>
              </div>

              <Card className="p-5 border-slate-200 bg-white space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Explanation</h3>
                <p className="text-sm text-slate-600">Your monthly P&amp;I payment covers principal (the amount you borrowed) and interest (the lender&apos;s charge for borrowing). Property tax, insurance, HOA, and MI / MIP are added separately to estimate total monthly housing cost.</p>
                <p className="text-sm text-slate-600">In early months, more of each payment goes to interest because the balance is highest then. As the balance drops, interest decreases and principal payoff accelerates.</p>
              </Card>

              <AmortizationTable rows={mortgageResult.amortization} defaultVisibleRows={60} metrics={mortgageAmortizationMetrics} calculatorTitle="Mortgage Calculator" />
            </TabsContent>
            <TabsContent value="refinance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5 border-slate-200 bg-white space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Refinance Inputs</h2>
                  <NumberField id="refi-current-balance" label="Current Balance" value={refiCurrentBalance} onChange={(value) => setRefiCurrentBalance(toNonNegativeNumber(value))} step={1000} />
                  <NumberField id="refi-current-rate" label="Current Rate" value={refiCurrentRate} onChange={(value) => setRefiCurrentRate(clampRate(value))} step={0.01} max={MAX_RATE} suffix="%" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <NumberField id="refi-current-term" label="Remaining Term" value={refiCurrentTermValue} onChange={(value) => setRefiCurrentTermValue(toPositiveInt(value, 1))} min={1} />
                    <div className="space-y-2">
                      <Label htmlFor="refi-current-unit">Unit</Label>
                      <Select value={refiCurrentTermUnit} onValueChange={(value) => setRefiCurrentTermUnit(value as TermUnit)}>
                        <SelectTrigger id="refi-current-unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="years">Years</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <NumberField id="refi-new-rate" label="New Rate" value={refiNewRate} onChange={(value) => setRefiNewRate(clampRate(value))} step={0.01} max={MAX_RATE} suffix="%" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <NumberField id="refi-new-term" label="New Term" value={refiNewTermValue} onChange={(value) => setRefiNewTermValue(toPositiveInt(value, 1))} min={1} />
                    <div className="space-y-2">
                      <Label htmlFor="refi-new-unit">Unit</Label>
                      <Select value={refiNewTermUnit} onValueChange={(value) => setRefiNewTermUnit(value as TermUnit)}>
                        <SelectTrigger id="refi-new-unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="years">Years</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <NumberField id="refi-closing" label="Closing Costs" value={refiClosingCosts} onChange={(value) => setRefiClosingCosts(toNonNegativeNumber(value))} step={100} />
                  <NumberField id="refi-cash-out" label="Cash-out Amount" value={refiCashOut} onChange={(value) => setRefiCashOut(toNonNegativeNumber(value))} step={100} />
                </Card>

                <div className="space-y-4">
                  <Card className="p-4 border-slate-200 bg-blue-50/50">
                    <p className="text-sm font-medium text-blue-900">Principal & Interest only: comparison excludes taxes, insurance, and non-financed fees unless you add them to inputs.</p>
                  </Card>
                  <ResultMetrics metrics={refinanceMetrics} />
                  <GlobalDisclaimers />
                </div>
              </div>

              <Card className="p-5 border-slate-200 bg-white space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Explanation</h3>
                <p className="text-sm text-slate-600">Refinancing replaces your current loan with a new one. If the new payment is lower, monthly cash flow improves, but closing costs can delay the payoff benefit.</p>
                <p className="text-sm text-slate-600">Break-even months tell you how long it takes for monthly savings to recover closing costs. Also compare total interest left on your current loan versus interest on the new loan.</p>
              </Card>

              <AmortizationTable rows={refinanceNewResult.amortization} defaultVisibleRows={60} title="New Loan Amortization (Monthly)" metrics={refinanceMetrics} calculatorTitle="Refinance Calculator" />
            </TabsContent>

            <TabsContent value="buydown" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5 border-slate-200 bg-white space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Buydown Mortgage Inputs</h2>
                  <NumberField id="buydown-amount" label="Loan Amount" value={buydownAmount} onChange={(value) => setBuydownAmount(toNonNegativeNumber(value))} step={1000} />
                  <NumberField id="buydown-note-rate" label="Note Rate" value={buydownNoteRate} onChange={(value) => setBuydownNoteRate(clampRate(value))} step={0.01} max={MAX_RATE} suffix="%" />
                  <NumberField id="buydown-term" label="Term (Years)" value={buydownTermYears} onChange={(value) => setBuydownTermYears(toPositiveInt(value, 1))} min={1} max={50} />
                  <NumberField id="buydown-monthly-mi" label="Monthly Mortgage Insurance (optional)" value={buydownMonthlyMI} onChange={(value) => setBuydownMonthlyMI(toNonNegativeNumber(value))} step={10} min={0} />
                  <NumberField id="buydown-monthly-tax" label="Monthly Property Tax (optional)" value={buydownMonthlyTax} onChange={(value) => setBuydownMonthlyTax(toNonNegativeNumber(value))} step={10} min={0} />

                  <div className="space-y-2">
                    <Label htmlFor="buydown-type">Buydown Type</Label>
                    <Select value={buydownType} onValueChange={(value) => setBuydownType(value as BuydownType)}>
                      <SelectTrigger id="buydown-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1</SelectItem>
                        <SelectItem value="1-1">1-1</SelectItem>
                        <SelectItem value="2-1">2-1</SelectItem>
                        <SelectItem value="3-2-1">3-2-1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Card className="p-3 border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-600">Guardrail: temporary rates are never allowed below 0.00% APR.</p>
                  </Card>
                </Card>

                <div className="space-y-4">
                  <Card className="p-4 border-slate-200 bg-blue-50/50">
                    <p className="text-sm font-medium text-blue-900">Principal & Interest only: temporary buydown affects early payment amounts, while note-rate payment applies later.</p>
                  </Card>
                  <ResultMetrics metrics={buydownMetrics} />
                  <div className="flex justify-end">
                    <ExportPdfButton
                      rows={buydownResult.amortization}
                      metrics={buydownMetrics}
                      title="Buydown Amortization (Monthly)"
                      calculatorTitle="Buydown Mortgage Calculator"
                    />
                  </div>
                  <Card className="p-4 border-slate-200 bg-white">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Monthly Savings vs Baseline</h3>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Year 1 Savings: {formatCurrency(buydownResult.savings.year1)}</p>
                      <p>Year 2 Savings: {formatCurrency(buydownResult.savings.year2)}</p>
                      <p>Year 3 Savings: {formatCurrency(buydownResult.savings.year3)}</p>
                    </div>
                  </Card>
                  <Card className="p-4 border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-600">Mortgage insurance and property tax are optional escrow items and will be included in total monthly payment when entered. If left blank, estimates are principal &amp; interest only.</p>
                  </Card>
                  <GlobalDisclaimers />
                </div>
              </div>

              <Card className="p-5 border-slate-200 bg-white">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Amortization by Year</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Payment (Monthly)</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      <TableHead className="text-right">Principal Paid</TableHead>
                      <TableHead className="text-right">Interest Paid</TableHead>
                      <TableHead className="text-right">Ending Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buydownResult.yearlySummary.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell>{row.year}</TableCell>
                        <TableCell className="text-right">{formatPercent(row.annualRateAPR, 3)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.monthlyPayment)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.totalPaid)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.principalPaid)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.interestPaid)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.endingBalance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              <AmortizationTable rows={buydownResult.amortization} defaultVisibleRows={48} title="Buydown Amortization (Monthly, First 48 Shown)" metrics={buydownMetrics} calculatorTitle="Buydown Mortgage Calculator" hideExportButton />

              <Card className="p-5 border-slate-200 bg-white space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Explanation</h3>
                <p className="text-sm text-slate-600">A temporary buydown means someone prepays part of the interest up front so your payment is lower in early years. The note rate is still your permanent contract rate once the buydown period ends.</p>
                <p className="text-sm text-slate-600">This calculator recalculates payment at each year boundary using the remaining balance and remaining term. That is why Year 1, Year 2, Year 3, and Year 4 can differ in a 3-2-1 buydown structure.</p>
                <p className="text-sm text-slate-600">Who typically pays the subsidy can vary: seller, builder, lender, or borrower, depending on negotiation and program rules.</p>
                <p className="text-sm text-red-700 font-medium">Warning: make sure you can afford the note-rate payment after the temporary buydown ends.</p>
              </Card>

              <Card className="p-5 border-slate-200 bg-white space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">LLPA vs Buydown vs “No LLPA” (What’s the Difference?)</h3>
                <p className="text-sm text-slate-600"><strong>LLPA (Loan-Level Price Adjustments):</strong> Risk-based pricing add-ons tied to factors such as credit score, LTV, occupancy, and property type. LLPAs usually appear as points/fees or in the interest rate itself. They are not a temporary payment reduction.</p>
                <p className="text-sm text-slate-600"><strong>Temporary Buydown:</strong> A pre-funded escrow or credit that covers the gap between note-rate payment and lower early-year payment. It is a separate structure and does not erase risk-based pricing by itself.</p>
                <p className="text-sm text-slate-600"><strong>“No LLPA” wording:</strong> Some programs or lender credits may reduce or offset LLPAs, but it depends on specific program guidelines and lender pricing. If LLPAs change, that affects rate/fees, while buydown changes early payment timing through a prepaid subsidy.</p>
                <p className="text-sm text-slate-700 font-medium">Exact pricing varies by lender and program. This calculator is educational and does not replace an official Loan Estimate.</p>
              </Card>
            </TabsContent>

            <TabsContent value="car" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5 border-slate-200 bg-white space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Car Loan Inputs</h2>
                  <NumberField id="car-price" label="Vehicle Price" value={carPrice} onChange={(value) => setCarPrice(toNonNegativeNumber(value))} step={500} />
                  <NumberField id="car-down" label="Down Payment" value={carDownPayment} onChange={(value) => setCarDownPayment(toNonNegativeNumber(value))} step={100} />
                  <NumberField id="car-trade" label="Trade-in (Optional)" value={carTradeIn} onChange={(value) => setCarTradeIn(toNonNegativeNumber(value))} step={100} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="car-fee-mode">Taxes/Fees Type</Label>
                      <Select value={carFeesMode} onValueChange={(value) => setCarFeesMode(value as FeesMode)}>
                        <SelectTrigger id="car-fee-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Percent of vehicle price</SelectItem>
                          <SelectItem value="flat">Flat dollar amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <NumberField
                      id="car-fees"
                      label={carFeesMode === "percent" ? "Taxes/Fees (%)" : "Taxes/Fees (Flat)"}
                      value={carFeesValue}
                      onChange={(value) => setCarFeesValue(toNonNegativeNumber(value))}
                      step={carFeesMode === "percent" ? 0.01 : 10}
                      suffix={carFeesMode === "percent" ? "%" : undefined}
                    />
                  </div>

                  <NumberField id="car-rate" label="APR" value={carRate} onChange={(value) => setCarRate(clampRate(value))} step={0.01} max={MAX_RATE} suffix="%" />

                  <div className="space-y-2">
                    <Label htmlFor="car-term">Term (Months)</Label>
                    <Select value={String(carTermMonths)} onValueChange={(value) => setCarTermMonths(toPositiveInt(Number(value), 1))}>
                      <SelectTrigger id="car-term">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="36">36</SelectItem>
                        <SelectItem value="48">48</SelectItem>
                        <SelectItem value="60">60</SelectItem>
                        <SelectItem value="72">72</SelectItem>
                        <SelectItem value="84">84</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                <div className="space-y-4">
                  <Card className="p-4 border-slate-200 bg-blue-50/50">
                    <p className="text-sm font-medium text-blue-900">Principal & Interest only: payment estimate excludes optional products and lender-specific fees unless entered.</p>
                  </Card>
                  <ResultMetrics metrics={carMetrics} />
                  <GlobalDisclaimers />
                </div>
              </div>

              <Card className="p-5 border-slate-200 bg-white space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Explanation</h3>
                <p className="text-sm text-slate-600">Longer auto terms usually reduce monthly payment but increase total interest because you pay interest for more months. Shorter terms often cost less overall if affordable.</p>
              </Card>

              <AmortizationTable rows={carResult.amortization} defaultVisibleRows={60} metrics={carMetrics} calculatorTitle="Car Loan Calculator" />
            </TabsContent>

            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5 border-slate-200 bg-white space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Personal Loan Inputs</h2>
                  <NumberField id="personal-amount" label="Loan Amount" value={personalAmount} onChange={(value) => setPersonalAmount(toNonNegativeNumber(value))} step={100} />
                  <NumberField id="personal-apr" label="APR" value={personalRate} onChange={(value) => setPersonalRate(clampRate(value))} step={0.01} max={MAX_RATE} suffix="%" />
                  <NumberField id="personal-term" label="Term (Months)" value={personalTermMonths} onChange={(value) => setPersonalTermMonths(toPositiveInt(value, 1))} min={1} step={1} />
                  <NumberField id="origination-fee" label="Origination Fee (%) (Optional)" value={personalOriginationFeePct} onChange={(value) => setPersonalOriginationFeePct(toNonNegativeNumber(value))} min={0} max={100} step={0.01} suffix="%" />
                </Card>

                <div className="space-y-4">
                  <Card className="p-4 border-slate-200 bg-blue-50/50">
                    <p className="text-sm font-medium text-blue-900">Principal & Interest only: APR and amortization drive monthly payment; origination fee affects net proceeds.</p>
                  </Card>
                  <ResultMetrics metrics={personalMetrics} />
                  <GlobalDisclaimers />
                </div>
              </div>

              <Card className="p-5 border-slate-200 bg-white space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Explanation</h3>
                <p className="text-sm text-slate-600">Origination fees are upfront lender charges often deducted from disbursed funds. APR reflects borrowing cost, while fee deductions can reduce how much cash you actually receive.</p>
              </Card>

              <AmortizationTable rows={personalResult.amortization} defaultVisibleRows={60} metrics={personalMetrics} calculatorTitle="Personal Loan Calculator" />
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5 border-slate-200 bg-white space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Business Loan Inputs</h2>
                  <div className="space-y-2">
                    <Label htmlFor="business-mode">Mode</Label>
                    <Select value={businessMode} onValueChange={(value) => setBusinessMode(value as BusinessMode)}>
                      <SelectTrigger id="business-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="term">Term Loan</SelectItem>
                        <SelectItem value="mca">MCA / Factor Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {businessMode === "term" ? (
                    <>
                      <NumberField id="business-amount" label="Business Term Loan Amount" value={businessAmount} onChange={(value) => setBusinessAmount(toNonNegativeNumber(value))} step={1000} />
                      <NumberField id="business-apr" label="APR" value={businessRate} onChange={(value) => setBusinessRate(clampRate(value))} step={0.01} max={MAX_RATE} suffix="%" />
                      <NumberField id="business-term" label="Term (Months)" value={businessTermMonths} onChange={(value) => setBusinessTermMonths(toPositiveInt(value, 1))} min={1} />
                    </>
                  ) : (
                    <Card className="p-4 border-slate-200 bg-slate-50">
                      <h3 className="text-base font-semibold text-slate-900">MCA / Factor Rate</h3>
                      <p className="text-sm text-slate-600 mt-1">Coming soon. Business cash-flow products often use factor rates and daily/weekly remittance structures that differ from traditional amortization.</p>
                    </Card>
                  )}
                </Card>

                <div className="space-y-4">
                  <Card className="p-4 border-slate-200 bg-blue-50/50">
                    <p className="text-sm font-medium text-blue-900">Principal & Interest only: this section models standard amortizing business term loans.</p>
                  </Card>
                  {businessMode === "term" ? <ResultMetrics metrics={businessMetrics} /> : null}
                  <GlobalDisclaimers />
                </div>
              </div>

              <Card className="p-5 border-slate-200 bg-white space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Explanation</h3>
                <p className="text-sm text-slate-600">Business lending products vary widely by lender. Real offers depend on underwriting, cash-flow profile, collateral, industry, and time in business.</p>
              </Card>

              {businessMode === "term" ? <AmortizationTable rows={businessResult.amortization} defaultVisibleRows={60} title="Business Term Loan Amortization (Monthly)" metrics={businessMetrics} calculatorTitle="Business Loan Calculator" /> : null}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

