import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Link } from "wouter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Download,
  HelpCircle,
  Mail,
  Moon,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Scale,
  Sun,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DeductionRow } from "@/components/calculators/DeductionRow";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatPercent, toNonNegativeNumber } from "@/lib/finance";
import {
  calculateCashFlow,
  calculateCompoundGrowth,
  calculateNetWorth,
  calculateRetirementProjection,
  calculateTaxEstimate,
  compareDebtStrategies,
  type CompoundInput,
  type DebtInput,
  type DeductionMode,
  type NamedAmountMap,
  type TaxDeductionState,
  type TaxEstimatorInput,
} from "@/lib/moneyTools";
import { setPageSeo } from "@/lib/seo";
import {
  ADJUSTMENT_DEDUCTIONS,
  BUSINESS_DEDUCTIONS,
  ITEMIZED_DEDUCTIONS,
  defaultDeductionState,
  getTaxYearConfig,
  type FilingStatus,
} from "@/lib/taxRules";

const PAGE_TITLE = "Money Tools Calculators | Net Worth, Cash Flow, Tax, Retirement & Debt";
const PAGE_DESCRIPTION =
  "Use free money tools to calculate net worth, cash flow, compound interest, taxes, retirement readiness, and debt payoff with scenario comparison and downloadable summaries.";
const PAGE_KEYWORDS =
  "money tools calculators, net worth calculator, cash flow calculator, compound interest calculator, tax estimator calculator, retirement calculator, debt payoff calculator, financial planning calculator, tax refund estimator, self employed tax calculator, debt snowball calculator, debt avalanche calculator, retirement readiness calculator, savings growth calculator";
const PAGE_CANONICAL = "https://www.pennyfloat.com/money-tools";

const SCENARIO_STORAGE_KEY = "moneyToolsSavedScenariosV1";
const DARK_MODE_STORAGE_KEY = "moneyToolsDarkModeV1";

const SECTION_LINKS = [
  { id: "net-worth", label: "Net Worth" },
  { id: "cash-flow", label: "Cash Flow" },
  { id: "compound-interest", label: "Compound Interest" },
  { id: "tax-estimator", label: "Tax Estimator" },
  { id: "retirement", label: "Retirement" },
  { id: "debt-payoff", label: "Debt Payoff" },
] as const;

const FAQ_ITEMS = [
  {
    q: "Are these calculators official financial or tax advice?",
    a: "No. These tools are educational estimates only and should be validated with a qualified financial or tax professional.",
  },
  {
    q: "How should I use the tax estimator results?",
    a: "Use the estimate for planning and scenario analysis. Credits, phaseouts, and state-specific rules can change the final filed return.",
  },
  {
    q: "What is the best debt payoff strategy?",
    a: "Avalanche often minimizes interest cost, while snowball can improve behavior momentum by eliminating small balances faster.",
  },
  {
    q: "Why does retirement readiness change by scenario?",
    a: "Return assumptions, inflation, contribution growth, and income targets materially change long-term outcomes.",
  },
  {
    q: "Can I save and compare multiple what-if cases?",
    a: "Yes. Use Save Scenario in each calculator and compare snapshots in the Compare Scenarios modal.",
  },
] as const;

const DEFAULT_ASSET_FIELDS: Record<string, string> = {
  "cash-on-hand": "Cash on hand",
  checking: "Checking accounts",
  savings: "Savings accounts",
  "emergency-fund": "Emergency fund",
  "brokerage-investments": "Brokerage/investment accounts",
  "retirement-accounts": "Retirement accounts (401k, IRA, etc.)",
  "primary-home-value": "Real estate primary home value",
  "other-real-estate": "Other real estate value",
  "vehicles-value": "Vehicles value",
  "business-ownership-value": "Business ownership value",
  "jewelry-collectibles": "Jewelry/collectibles",
  "other-assets": "Other assets",
};

const DEFAULT_LIABILITY_FIELDS: Record<string, string> = {
  "credit-card-balances": "Credit card balances",
  "personal-loans": "Personal loans",
  "student-loans": "Student loans",
  "auto-loans": "Auto loans",
  "primary-mortgage": "Mortgage on primary home",
  "other-mortgages": "Mortgage on other properties",
  "business-loans": "Business loans",
  "medical-debt": "Medical debt",
  "tax-debt": "Tax debt",
  "other-liabilities": "Other liabilities",
};

const DEFAULT_CASH_FLOW_INCOME: NamedAmountMap = {
  "salary-income": 6000,
  "freelance-income": 500,
  "business-income": 0,
  "rental-income": 0,
  "investment-income": 100,
  "government-benefits": 0,
  "support-received": 0,
  "other-income": 0,
};

const DEFAULT_CASH_FLOW_FIXED: NamedAmountMap = {
  "rent-mortgage": 2200,
  utilities: 280,
  insurance: 240,
  phone: 90,
  internet: 70,
  childcare: 0,
  "loan-payments": 420,
  subscriptions: 85,
  tuition: 0,
  "other-fixed": 0,
};

const DEFAULT_CASH_FLOW_VARIABLE: NamedAmountMap = {
  groceries: 700,
  "dining-out": 250,
  "gas-transportation": 280,
  "medical-health": 150,
  entertainment: 150,
  shopping: 180,
  travel: 120,
  "home-maintenance": 150,
  "pet-expenses": 80,
  miscellaneous: 120,
};

const DEFAULT_CASH_FLOW_SAVINGS: NamedAmountMap = {
  "emergency-savings": 300,
  "retirement-contribution": 400,
  "brokerage-investing": 200,
  "college-savings": 0,
  "other-savings": 0,
};

const DEFAULT_COMPOUND_INPUT: CompoundInput = {
  principal: 20000,
  recurringContribution: 500,
  contributionFrequency: "monthly",
  annualReturnRate: 7,
  compoundingFrequency: "monthly",
  years: 25,
  annualContributionIncreaseRate: 2,
  inflationRate: 2.5,
  taxDragRate: 0,
  startDate: new Date().toISOString().slice(0, 10),
};

const DEFAULT_TAX_INCOME: TaxEstimatorInput["income"] = {
  w2Wages: 85000,
  selfEmploymentIncome: 0,
  businessIncome: 0,
  interestIncome: 250,
  qualifiedDividends: 350,
  ordinaryDividends: 100,
  capitalGains: 0,
  rentalIncome: 0,
  retirementIncome: 0,
  socialSecurityIncome: 0,
  unemploymentIncome: 0,
  otherTaxableIncome: 0,
};

const DEFAULT_TAX_CREDITS: TaxEstimatorInput["credits"] = {
  childTaxCredit: 0,
  childDependentCareCredit: 0,
  educationCredits: 0,
  evCredit: 0,
  saversCredit: 0,
  otherNonrefundableCredits: 0,
  refundableCredits: 0,
  earnedIncomeCredit: 0,
  additionalChildTaxCredit: 0,
  americanOpportunityCredit: 0,
  lifetimeLearningCredit: 0,
  premiumTaxCredit: 0,
  otherRefundableCredits: 0,
};

const DEFAULT_TAX_PAYMENTS: TaxEstimatorInput["payments"] = {
  federalWithholding: 8500,
  stateWithholding: 3000,
  additionalWithholding: 0,
  estimatedQuarterlyPayments: 0,
  priorYearOverpaymentApplied: 0,
};

const DEFAULT_RETIREMENT_INPUT = {
  currentAge: 35,
  retirementAge: 67,
  lifeExpectancy: 90,
  currentRetirementSavings: 85000,
  currentAnnualIncome: 95000,
  currentAnnualContribution: 12000,
  employerMatchPercent: 4,
  expectedAnnualReturnPreRetirement: 7,
  expectedAnnualReturnInRetirement: 5,
  expectedSalaryGrowth: 3,
  inflationRate: 2.5,
  replacementRatio: 75,
  expectedSocialSecurityAnnual: 28000,
  pensionAnnual: 0,
  otherRetirementIncomeAnnual: 0,
  withdrawalRate: 4,
  oneTimeRetirementExpense: 30000,
  lifestyle: "moderate" as const,
  scenario: "base" as const,
};

const DEFAULT_DEBTS: DebtInput[] = [
  { id: "debt-1", name: "Credit Card A", balance: 7800, annualRate: 21.9, minimumPayment: 210, priority: 1 },
  { id: "debt-2", name: "Auto Loan", balance: 16500, annualRate: 6.5, minimumPayment: 375, priority: 2 },
  { id: "debt-3", name: "Student Loan", balance: 24500, annualRate: 5.2, minimumPayment: 260, priority: 3 },
];

const CHART_COLORS = ["#0f766e", "#0ea5e9", "#2563eb", "#16a34a", "#f59e0b", "#e11d48", "#8b5cf6"];

interface SavedScenario {
  id: string;
  calculator: string;
  label: string;
  createdAt: string;
  metrics: Record<string, number | string>;
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeFieldKey(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function mapToChartData(values: NamedAmountMap, labels: Record<string, string>) {
  return Object.entries(values)
    .filter(([, amount]) => nonNegative(amount) > 0)
    .map(([key, amount]) => ({
      name: labels[key] ?? key,
      value: nonNegative(amount),
    }));
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(filename: string, header: string[], rows: Array<Array<string | number>>) {
  const csv = [header.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadSummaryPdf(title: string, metrics: Array<{ label: string; value: string }>) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleString("en-US")} · PennyFloat.com`, 14, 24);
  autoTable(doc, {
    startY: 30,
    head: [["Metric", "Value"]],
    body: metrics.map((metric) => [metric.label, metric.value]),
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 118, 110] },
  });
  doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
}

function HelpTip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-slate-500 hover:text-slate-700" aria-label="More info">
          <HelpCircle className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{content}</TooltipContent>
    </Tooltip>
  );
}

function MetricCard({
  label,
  value,
  hint,
  darkMode,
}: {
  label: string;
  value: string;
  hint?: string;
  darkMode: boolean;
}) {
  return (
    <Card className={`p-4 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
      <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      <p className={`text-lg font-semibold mt-1 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{value}</p>
      {hint ? <p className={`text-xs mt-2 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{hint}</p> : null}
    </Card>
  );
}

export default function MoneyTools() {
  const [darkMode, setDarkMode] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [scenarioNames, setScenarioNames] = useState<Record<string, string>>({
    "net-worth": "Net Worth Scenario",
    "cash-flow": "Cash Flow Scenario",
    "compound-interest": "Compound Scenario",
    "tax-estimator": "Tax Scenario",
    retirement: "Retirement Scenario",
    "debt-payoff": "Debt Scenario",
  });

  const [assetLabels, setAssetLabels] = useState<Record<string, string>>(DEFAULT_ASSET_FIELDS);
  const [liabilityLabels, setLiabilityLabels] = useState<Record<string, string>>(DEFAULT_LIABILITY_FIELDS);
  const [assets, setAssets] = useState<NamedAmountMap>(
    Object.fromEntries(Object.keys(DEFAULT_ASSET_FIELDS).map((key) => [key, 0])),
  );
  const [liabilities, setLiabilities] = useState<NamedAmountMap>(
    Object.fromEntries(Object.keys(DEFAULT_LIABILITY_FIELDS).map((key) => [key, 0])),
  );
  const [newAssetLabel, setNewAssetLabel] = useState("");
  const [newLiabilityLabel, setNewLiabilityLabel] = useState("");
  const [netWorthTrackingPeriod, setNetWorthTrackingPeriod] = useState<"monthly" | "yearly">("monthly");

  const [cashFlowIncome, setCashFlowIncome] = useState<NamedAmountMap>(DEFAULT_CASH_FLOW_INCOME);
  const [cashFlowFixed, setCashFlowFixed] = useState<NamedAmountMap>(DEFAULT_CASH_FLOW_FIXED);
  const [cashFlowVariable, setCashFlowVariable] = useState<NamedAmountMap>(DEFAULT_CASH_FLOW_VARIABLE);
  const [cashFlowSavings, setCashFlowSavings] = useState<NamedAmountMap>(DEFAULT_CASH_FLOW_SAVINGS);
  const [cashFlowView, setCashFlowView] = useState<"monthly" | "annual">("monthly");

  const [compoundInputA, setCompoundInputA] = useState<CompoundInput>(DEFAULT_COMPOUND_INPUT);
  const [compoundInputB, setCompoundInputB] = useState<CompoundInput>({
    ...DEFAULT_COMPOUND_INPUT,
    annualReturnRate: 8,
    recurringContribution: 650,
  });
  const [showCompoundCompare, setShowCompoundCompare] = useState(false);

  const [taxYear, setTaxYear] = useState(2026);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [age, setAge] = useState(35);
  const [over65, setOver65] = useState(false);
  const [blind, setBlind] = useState(false);
  const [dependents, setDependents] = useState(0);
  const [stateCode, setStateCode] = useState("TX");
  const [isSelfEmployedPath, setIsSelfEmployedPath] = useState(false);
  const [isMilitaryMove, setIsMilitaryMove] = useState(false);
  const [taxIncome, setTaxIncome] = useState(DEFAULT_TAX_INCOME);
  const [deductionMode, setDeductionMode] = useState<DeductionMode>("compare");
  const [adjustmentStates, setAdjustmentStates] = useState<Record<string, TaxDeductionState>>(
    defaultDeductionState(ADJUSTMENT_DEDUCTIONS),
  );
  const [itemizedStates, setItemizedStates] = useState<Record<string, TaxDeductionState>>(
    defaultDeductionState(ITEMIZED_DEDUCTIONS),
  );
  const [businessStates, setBusinessStates] = useState<Record<string, TaxDeductionState>>(
    defaultDeductionState(BUSINESS_DEDUCTIONS),
  );
  const [deductionSearch, setDeductionSearch] = useState("");
  const [deductionFilter, setDeductionFilter] = useState<"all" | "personal" | "self-employed" | "itemized" | "adjustment" | "business">("all");
  const [taxCredits, setTaxCredits] = useState(DEFAULT_TAX_CREDITS);
  const [taxPayments, setTaxPayments] = useState(DEFAULT_TAX_PAYMENTS);
  const [taxActiveStep, setTaxActiveStep] = useState<"profile" | "income" | "deductions" | "credits" | "results">("profile");

  const [retirementInput, setRetirementInput] = useState(DEFAULT_RETIREMENT_INPUT);

  const [debts, setDebts] = useState<DebtInput[]>(DEFAULT_DEBTS);
  const [extraDebtPayment, setExtraDebtPayment] = useState(350);
  const [debtStrategy, setDebtStrategy] = useState<"minimum" | "snowball" | "avalanche" | "custom">("avalanche");
  const [debtStartDate, setDebtStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeMoneyToolTab, setActiveMoneyToolTab] = useState("net-worth");

  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      keywords: PAGE_KEYWORDS,
      canonical: PAGE_CANONICAL,
      robots: "index, follow, max-image-preview:large",
    });

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "money-tools-faq-schema";
    script.text = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    setDarkMode(readLocalStorage<boolean>(DARK_MODE_STORAGE_KEY, false));
    setSavedScenarios(readLocalStorage<SavedScenario[]>(SCENARIO_STORAGE_KEY, []));

    const hash = window.location.hash.replace("#", "");
    if (SECTION_LINKS.some((item) => item.id === hash)) {
      setActiveMoneyToolTab(hash);
      requestAnimationFrame(() => {
        const section = document.getElementById(hash);
        if (section) {
          section.scrollIntoView({ behavior: "auto", block: "start" });
        }
      });
    }

    return () => {
      const existing = document.getElementById("money-tools-faq-schema");
      if (existing) existing.remove();
    };
  }, []);

  useEffect(() => {
    writeLocalStorage(DARK_MODE_STORAGE_KEY, darkMode);
  }, [darkMode]);

  useEffect(() => {
    writeLocalStorage(SCENARIO_STORAGE_KEY, savedScenarios);
  }, [savedScenarios]);

  const handleMoneyToolTabChange = (value: string) => {
    setActiveMoneyToolTab(value);
    if (typeof window === "undefined") return;
    const section = document.getElementById(value);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${value}`);
    }
  };

  const taxConfig = useMemo(() => getTaxYearConfig(taxYear), [taxYear]);

  const netWorthResult = useMemo(() => calculateNetWorth(assets, liabilities), [assets, liabilities]);
  const netWorthAssetsChart = useMemo(() => mapToChartData(assets, assetLabels), [assets, assetLabels]);
  const netWorthLiabilitiesChart = useMemo(() => mapToChartData(liabilities, liabilityLabels), [liabilities, liabilityLabels]);

  const netWorthTrendData = useMemo(
    () =>
      savedScenarios
        .filter((item) => item.calculator === "net-worth")
        .map((item) => ({
          label: new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          netWorth: Number(item.metrics["Net Worth"] ?? 0),
        })),
    [savedScenarios],
  );

  const cashFlowResult = useMemo(
    () => calculateCashFlow(cashFlowIncome, cashFlowFixed, cashFlowVariable, cashFlowSavings),
    [cashFlowIncome, cashFlowFixed, cashFlowVariable, cashFlowSavings],
  );

  const cashFlowScale = cashFlowView === "annual" ? 12 : 1;
  const cashFlowChartData = useMemo(
    () =>
      [...Object.entries(cashFlowFixed), ...Object.entries(cashFlowVariable)]
        .map(([key, value]) => ({ category: key, value: nonNegative(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [cashFlowFixed, cashFlowVariable],
  );

  const compoundResultA = useMemo(() => calculateCompoundGrowth(compoundInputA), [compoundInputA]);
  const compoundResultB = useMemo(() => calculateCompoundGrowth(compoundInputB), [compoundInputB]);

  const taxEstimatorInput: TaxEstimatorInput = useMemo(
    () => ({
      taxYear,
      filingStatus,
      age,
      over65,
      blind,
      stateCode,
      dependents,
      isSelfEmployedPath,
      isMilitaryMove,
      income: taxIncome,
      deductionMode,
      adjustmentDeductions: adjustmentStates,
      itemizedDeductions: itemizedStates,
      businessDeductions: businessStates,
      credits: taxCredits,
      payments: taxPayments,
    }),
    [
      taxYear,
      filingStatus,
      age,
      over65,
      blind,
      stateCode,
      dependents,
      isSelfEmployedPath,
      isMilitaryMove,
      taxIncome,
      deductionMode,
      adjustmentStates,
      itemizedStates,
      businessStates,
      taxCredits,
      taxPayments,
    ],
  );

  const taxResult = useMemo(
    () =>
      calculateTaxEstimate(taxEstimatorInput, taxConfig, {
        adjustmentDefinitions: ADJUSTMENT_DEDUCTIONS,
        itemizedDefinitions: ITEMIZED_DEDUCTIONS,
        businessDefinitions: BUSINESS_DEDUCTIONS,
      }),
    [taxEstimatorInput, taxConfig],
  );

  const retirementResult = useMemo(() => calculateRetirementProjection(retirementInput), [retirementInput]);
  const debtResult = useMemo(
    () => compareDebtStrategies(debts, debtStrategy, extraDebtPayment, debtStartDate),
    [debts, debtStrategy, extraDebtPayment, debtStartDate],
  );

  const visibleAdjustmentDefs = useMemo(() => {
    const search = deductionSearch.trim().toLowerCase();
    return ADJUSTMENT_DEDUCTIONS.filter((definition) => {
      if (search && !definition.label.toLowerCase().includes(search)) return false;
      if (deductionFilter === "all") return true;
      if (deductionFilter === "adjustment") return true;
      if (deductionFilter === "personal") return definition.appliesTo.includes("all");
      if (deductionFilter === "self-employed") return definition.appliesTo.includes("self-employed");
      return false;
    });
  }, [deductionSearch, deductionFilter]);

  const visibleItemizedDefs = useMemo(() => {
    const search = deductionSearch.trim().toLowerCase();
    return ITEMIZED_DEDUCTIONS.filter((definition) => {
      if (search && !definition.label.toLowerCase().includes(search)) return false;
      if (deductionFilter === "all" || deductionFilter === "itemized" || deductionFilter === "personal") return true;
      return false;
    });
  }, [deductionSearch, deductionFilter]);

  const visibleBusinessDefs = useMemo(() => {
    const search = deductionSearch.trim().toLowerCase();
    return BUSINESS_DEDUCTIONS.filter((definition) => {
      if (search && !definition.label.toLowerCase().includes(search)) return false;
      if (deductionFilter === "all" || deductionFilter === "business" || deductionFilter === "self-employed") return true;
      return false;
    });
  }, [deductionSearch, deductionFilter]);

  const scenarioComparison = useMemo(() => {
    const selected = savedScenarios.filter((scenario) => selectedScenarioIds.includes(scenario.id));
    const metricKeys = Array.from(
      new Set(selected.flatMap((scenario) => Object.keys(scenario.metrics))),
    );
    return { selected, metricKeys };
  }, [savedScenarios, selectedScenarioIds]);

  const taxValidationWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (age < 18) warnings.push("Age appears low for typical tax filing assumptions.");
    if (Object.values(taxCredits).some((value) => value > 50000)) {
      warnings.push("One or more credits appear unusually high; confirm eligibility and limits.");
    }
    if (Object.values(taxIncome).some((value) => value > 5_000_000)) {
      warnings.push("High-income assumptions can trigger phaseouts not fully modeled in this estimate.");
    }
    return warnings;
  }, [age, taxCredits, taxIncome]);

  const baseSurfaceClass = darkMode ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900";
  const cardClass = darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white";
  const mutedTextClass = darkMode ? "text-slate-300" : "text-slate-600";
  const sectionTitleClass = darkMode ? "text-slate-100" : "text-slate-900";

  const handleScenarioSave = (
    calculator: string,
    defaultLabel: string,
    metrics: Record<string, number | string>,
  ) => {
    const scenario: SavedScenario = {
      id: `${calculator}-${Date.now()}`,
      calculator,
      label: scenarioNames[calculator] || defaultLabel,
      createdAt: new Date().toISOString(),
      metrics,
    };
    setSavedScenarios((current) => [scenario, ...current].slice(0, 60));
  };

  const updateScenarioName = (calculator: string, value: string) => {
    setScenarioNames((current) => ({ ...current, [calculator]: value }));
  };

  const updateNamedAmount = (
    setter: Dispatch<SetStateAction<NamedAmountMap>>,
    key: string,
    nextValue: number,
  ) => {
    setter((current) => ({
      ...current,
      [key]: nonNegative(nextValue),
    }));
  };

  const addCustomCategory = (
    value: string,
    labelSetter: Dispatch<SetStateAction<Record<string, string>>>,
    amountSetter: Dispatch<SetStateAction<NamedAmountMap>>,
    clear: () => void,
  ) => {
    const normalized = normalizeFieldKey(value);
    if (!normalized) return;
    const key = `custom-${normalized}-${Date.now()}`;
    labelSetter((current) => ({
      ...current,
      [key]: value.trim(),
    }));
    amountSetter((current) => ({
      ...current,
      [key]: 0,
    }));
    clear();
  };

  const removeCustomCategory = (
    key: string,
    labelSetter: Dispatch<SetStateAction<Record<string, string>>>,
    amountSetter: Dispatch<SetStateAction<NamedAmountMap>>,
  ) => {
    labelSetter((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    amountSetter((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateDeductionState = (
    setter: Dispatch<SetStateAction<Record<string, TaxDeductionState>>>,
    id: string,
    patch: Partial<TaxDeductionState>,
  ) => {
    setter((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...patch,
      },
    }));
  };

  const resetTaxEstimator = () => {
    setTaxYear(2026);
    setFilingStatus("single");
    setAge(35);
    setOver65(false);
    setBlind(false);
    setDependents(0);
    setStateCode("TX");
    setIsSelfEmployedPath(false);
    setIsMilitaryMove(false);
    setTaxIncome(DEFAULT_TAX_INCOME);
    setDeductionMode("compare");
    setAdjustmentStates(defaultDeductionState(ADJUSTMENT_DEDUCTIONS));
    setItemizedStates(defaultDeductionState(ITEMIZED_DEDUCTIONS));
    setBusinessStates(defaultDeductionState(BUSINESS_DEDUCTIONS));
    setTaxCredits(DEFAULT_TAX_CREDITS);
    setTaxPayments(DEFAULT_TAX_PAYMENTS);
  };

  return (
    <div className={`min-h-screen font-sans ${baseSurfaceClass}`}>
      <Header />
      <main className="py-10 md:py-14">
        <div className="container mx-auto max-w-7xl px-4 space-y-6">
          <Card className={`p-4 ${cardClass}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                  <p className={`text-xs uppercase tracking-wide ${darkMode ? "text-teal-300" : "text-teal-700"}`}>
                    Calculators &gt; Money Tools
                  </p>
                <h1 className={`text-3xl md:text-4xl font-bold font-display mt-2 ${sectionTitleClass}`}>
                  Money Tools
                </h1>
                <p className={`mt-3 max-w-4xl text-sm md:text-base ${mutedTextClass}`}>
                  Plan smarter with calculators for net worth, cash flow, investing, taxes, retirement, and debt payoff.
                  These tools help consumers, freelancers, self-employed users, families, and small business owners
                  understand current finances and model better decisions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Label className={darkMode ? "text-slate-200" : "text-slate-700"}>Dark mode</Label>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {SECTION_LINKS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-100 hover:border-teal-400"
                      : "border-slate-200 bg-white text-slate-800 hover:border-teal-500"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </Card>

          <Card className={`p-4 ${cardClass}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link
                href="/loan-calculators"
                className={`rounded-lg border p-3 block ${darkMode ? "border-slate-700 bg-slate-900/60 hover:border-teal-400" : "border-slate-200 bg-white hover:border-teal-500"}`}
              >
                <p className="font-semibold">Loan Calculators</p>
              </Link>
              <Link
                href="/mortgage-underwriting"
                className={`rounded-lg border p-3 block ${darkMode ? "border-slate-700 bg-slate-900/60 hover:border-teal-400" : "border-slate-200 bg-white hover:border-teal-500"}`}
              >
                <p className="font-semibold">Mortgage Underwriting</p>
              </Link>
              <div className={`rounded-lg border p-3 ${darkMode ? "border-teal-500 bg-slate-900/80" : "border-teal-500 bg-teal-50"}`}>
                <p className="font-semibold">Money Tools (Current)</p>
              </div>
            </div>
          </Card>

          <Card className={`sticky top-16 z-20 p-3 ${cardClass}`}>
            <Tabs value={activeMoneyToolTab} onValueChange={handleMoneyToolTabChange}>
              <TabsList className="w-full h-auto p-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
                {SECTION_LINKS.map((item) => (
                  <TabsTrigger key={item.id} value={item.id}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </Card>

          <Card className={`p-4 ${darkMode ? "border-amber-400 bg-amber-100/10" : "border-amber-200 bg-amber-50"}`}>
            <p className={`text-sm ${darkMode ? "text-amber-200" : "text-amber-900"}`}>
              These tools are for educational purposes only and do not constitute financial, tax, or investment advice.
            </p>
          </Card>

          <section id="net-worth" className="space-y-4 scroll-mt-28">
            <Card className={`p-5 ${cardClass}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className={`text-2xl font-semibold ${sectionTitleClass}`}>1. Net Worth Calculator</h2>
                  <p className={`mt-2 text-sm ${mutedTextClass}`}>
                    Calculate total assets, total liabilities, net worth, debt-to-asset ratio, and liquidity trends.
                    Save monthly or yearly snapshots to track progress over time.
                  </p>
                  <p className={`mt-2 text-xs ${mutedTextClass}`}>Formula: Net Worth = Total Assets - Total Liabilities</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className={mutedTextClass}>Tracking</Label>
                  <Select value={netWorthTrackingPeriod} onValueChange={(value) => setNetWorthTrackingPeriod(value as "monthly" | "yearly")}>
                    <SelectTrigger className={darkMode ? "w-36 border-slate-700 bg-slate-950" : "w-36"}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className={`p-4 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                  <h3 className="font-semibold">Assets</h3>
                  <div className="mt-3 space-y-3">
                    {Object.entries(assetLabels).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="w-2/3 text-sm">{label}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={assets[key] ?? 0}
                          onChange={(event) => updateNamedAmount(setAssets, key, Number(event.target.value))}
                          className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                        />
                        {key.startsWith("custom-") ? (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeCustomCategory(key, setAssetLabels, setAssets)}
                            className={darkMode ? "border-slate-700 bg-slate-950" : undefined}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Add custom asset category"
                      value={newAssetLabel}
                      onChange={(event) => setNewAssetLabel(event.target.value)}
                      className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        addCustomCategory(newAssetLabel, setAssetLabels, setAssets, () => setNewAssetLabel(""))
                      }
                      className={darkMode ? "border-slate-700 bg-slate-950" : undefined}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </Card>

                <Card className={`p-4 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                  <h3 className="font-semibold">Liabilities</h3>
                  <div className="mt-3 space-y-3">
                    {Object.entries(liabilityLabels).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="w-2/3 text-sm">{label}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={liabilities[key] ?? 0}
                          onChange={(event) => updateNamedAmount(setLiabilities, key, Number(event.target.value))}
                          className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                        />
                        {key.startsWith("custom-") ? (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeCustomCategory(key, setLiabilityLabels, setLiabilities)}
                            className={darkMode ? "border-slate-700 bg-slate-950" : undefined}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Add custom liability category"
                      value={newLiabilityLabel}
                      onChange={(event) => setNewLiabilityLabel(event.target.value)}
                      className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        addCustomCategory(newLiabilityLabel, setLiabilityLabels, setLiabilities, () => setNewLiabilityLabel(""))
                      }
                      className={darkMode ? "border-slate-700 bg-slate-950" : undefined}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <MetricCard label="Total Assets" value={formatCurrency(netWorthResult.totalAssets)} darkMode={darkMode} />
                <MetricCard label="Total Liabilities" value={formatCurrency(netWorthResult.totalLiabilities)} darkMode={darkMode} />
                <MetricCard
                  label="Net Worth"
                  value={formatCurrency(netWorthResult.netWorth)}
                  hint={netWorthResult.netWorth >= 0 ? "Positive net worth" : "Negative net worth"}
                  darkMode={darkMode}
                />
                <MetricCard
                  label="Debt-to-Asset Ratio"
                  value={formatPercent(netWorthResult.debtToAssetRatio * 100, 1)}
                  hint={netWorthResult.interpretation}
                  darkMode={darkMode}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className={`p-4 ${cardClass}`}>
                  <h3 className="font-semibold mb-3">Asset Allocation Breakdown</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={netWorthAssetsChart} dataKey="value" nameKey="name" outerRadius={105} label>
                          {netWorthAssetsChart.map((item, index) => (
                            <Cell key={`${item.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className={`p-4 ${cardClass}`}>
                  <h3 className="font-semibold mb-3">Liabilities Breakdown</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={netWorthLiabilitiesChart} dataKey="value" nameKey="name" outerRadius={105} label>
                          {netWorthLiabilitiesChart.map((item, index) => (
                            <Cell key={`${item.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {netWorthTrendData.length > 1 ? (
                <Card className={`mt-4 p-4 ${cardClass}`}>
                  <h3 className="font-semibold mb-3">Net Worth Trend ({netWorthTrackingPeriod})</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={netWorthTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                        <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                        <Line type="monotone" dataKey="netWorth" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Input
                  className={`max-w-xs ${darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : ""}`}
                  value={scenarioNames["net-worth"] ?? ""}
                  onChange={(event) => updateScenarioName("net-worth", event.target.value)}
                  placeholder="Scenario name"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    handleScenarioSave("net-worth", "Net Worth Snapshot", {
                      Period: netWorthTrackingPeriod,
                      "Total Assets": netWorthResult.totalAssets,
                      "Total Liabilities": netWorthResult.totalLiabilities,
                      "Net Worth": netWorthResult.netWorth,
                      "Debt-to-Asset Ratio": netWorthResult.debtToAssetRatio,
                    })
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadSummaryPdf("Net Worth Calculator Summary", [
                      { label: "Total Assets", value: formatCurrency(netWorthResult.totalAssets) },
                      { label: "Total Liabilities", value: formatCurrency(netWorthResult.totalLiabilities) },
                      { label: "Net Worth", value: formatCurrency(netWorthResult.netWorth) },
                      { label: "Debt-to-Asset Ratio", value: formatPercent(netWorthResult.debtToAssetRatio * 100, 1) },
                    ])
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Results
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssetLabels(DEFAULT_ASSET_FIELDS);
                    setLiabilityLabels(DEFAULT_LIABILITY_FIELDS);
                    setAssets(Object.fromEntries(Object.keys(DEFAULT_ASSET_FIELDS).map((key) => [key, 0])));
                    setLiabilities(Object.fromEntries(Object.keys(DEFAULT_LIABILITY_FIELDS).map((key) => [key, 0])));
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </Card>
          </section>

          <section id="cash-flow" className="space-y-4 scroll-mt-28">
            <Card className={`p-5 ${cardClass}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className={`text-2xl font-semibold ${sectionTitleClass}`}>2. Cash Flow Calculator</h2>
                  <p className={`mt-2 text-sm ${mutedTextClass}`}>
                    Measure monthly or annual inflow, outflow, savings contributions, and surplus/deficit to improve
                    budget health and long-term planning.
                  </p>
                  <p className={`mt-2 text-xs ${mutedTextClass}`}>
                    Net Cash Flow = Total Income - Total Expenses - Savings Contributions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className={mutedTextClass}>View</Label>
                  <Select value={cashFlowView} onValueChange={(value) => setCashFlowView(value as "monthly" | "annual")}>
                    <SelectTrigger className={darkMode ? "w-28 border-slate-700 bg-slate-950" : "w-28"}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className={`p-4 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                  <h3 className="font-semibold mb-2">Income</h3>
                  <div className="space-y-2">
                    {Object.entries(cashFlowIncome).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="w-1/2 text-sm">{key.replace(/-/g, " ")}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={value}
                          onChange={(event) => updateNamedAmount(setCashFlowIncome, key, Number(event.target.value))}
                          className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className={`p-4 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                  <h3 className="font-semibold mb-2">Savings & Investing</h3>
                  <div className="space-y-2">
                    {Object.entries(cashFlowSavings).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="w-1/2 text-sm">{key.replace(/-/g, " ")}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={value}
                          onChange={(event) => updateNamedAmount(setCashFlowSavings, key, Number(event.target.value))}
                          className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className={`p-4 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                  <h3 className="font-semibold mb-2">Fixed Expenses</h3>
                  <div className="space-y-2">
                    {Object.entries(cashFlowFixed).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="w-1/2 text-sm">{key.replace(/-/g, " ")}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={value}
                          onChange={(event) => updateNamedAmount(setCashFlowFixed, key, Number(event.target.value))}
                          className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className={`p-4 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                  <h3 className="font-semibold mb-2">Variable Expenses</h3>
                  <div className="space-y-2">
                    {Object.entries(cashFlowVariable).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="w-1/2 text-sm">{key.replace(/-/g, " ")}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={value}
                          onChange={(event) => updateNamedAmount(setCashFlowVariable, key, Number(event.target.value))}
                          className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <MetricCard label="Total Income" value={formatCurrency(cashFlowResult.totalIncome * cashFlowScale)} darkMode={darkMode} />
                <MetricCard label="Total Expenses" value={formatCurrency(cashFlowResult.totalExpenses * cashFlowScale)} darkMode={darkMode} />
                <MetricCard label="Savings / Investing" value={formatCurrency(cashFlowResult.totalSavings * cashFlowScale)} darkMode={darkMode} />
                <MetricCard label="Net Cash Flow" value={formatCurrency(cashFlowResult.netCashFlow * cashFlowScale)} darkMode={darkMode} />
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <MetricCard label="Savings Rate" value={formatPercent(cashFlowResult.savingsRate * 100, 1)} darkMode={darkMode} />
                <MetricCard label="Expense Ratio" value={formatPercent(cashFlowResult.expenseRatio * 100, 1)} darkMode={darkMode} />
                <MetricCard label="Budget Health" value={cashFlowResult.budgetHealth} darkMode={darkMode} />
              </div>

              {cashFlowResult.netCashFlow < 0 ? (
                <Card className={`mt-4 p-3 ${darkMode ? "border-red-500/50 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-800"}`}>
                  <p className="text-sm font-medium">Warning: expenses and savings contributions exceed income.</p>
                </Card>
              ) : null}

              <Card className={`mt-4 p-4 ${cardClass}`}>
                <h3 className="font-semibold mb-3">Spending by Category</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" hide />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className={`mt-4 p-4 ${cardClass}`}>
                <h3 className="font-semibold">Recommendations</h3>
                <ul className={`mt-2 list-disc pl-5 space-y-1 text-sm ${mutedTextClass}`}>
                  {cashFlowResult.recommendations.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </Card>

              <div className="mt-4 flex flex-wrap gap-2">
                <Input
                  className={`max-w-xs ${darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : ""}`}
                  value={scenarioNames["cash-flow"] ?? ""}
                  onChange={(event) => updateScenarioName("cash-flow", event.target.value)}
                  placeholder="Scenario name"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    handleScenarioSave("cash-flow", "Cash Flow Snapshot", {
                      View: cashFlowView,
                      "Total Income": cashFlowResult.totalIncome * cashFlowScale,
                      "Total Expenses": cashFlowResult.totalExpenses * cashFlowScale,
                      "Total Savings": cashFlowResult.totalSavings * cashFlowScale,
                      "Net Cash Flow": cashFlowResult.netCashFlow * cashFlowScale,
                      "Savings Rate": cashFlowResult.savingsRate,
                    })
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadSummaryPdf("Cash Flow Calculator Summary", [
                      { label: "Total Income", value: formatCurrency(cashFlowResult.totalIncome * cashFlowScale) },
                      { label: "Total Expenses", value: formatCurrency(cashFlowResult.totalExpenses * cashFlowScale) },
                      { label: "Total Savings", value: formatCurrency(cashFlowResult.totalSavings * cashFlowScale) },
                      { label: "Net Cash Flow", value: formatCurrency(cashFlowResult.netCashFlow * cashFlowScale) },
                      { label: "Savings Rate", value: formatPercent(cashFlowResult.savingsRate * 100, 1) },
                    ])
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Results
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCashFlowIncome(DEFAULT_CASH_FLOW_INCOME);
                    setCashFlowFixed(DEFAULT_CASH_FLOW_FIXED);
                    setCashFlowVariable(DEFAULT_CASH_FLOW_VARIABLE);
                    setCashFlowSavings(DEFAULT_CASH_FLOW_SAVINGS);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </Card>
          </section>

          <section id="compound-interest" className="space-y-4 scroll-mt-28">
            <Card className={`p-5 ${cardClass}`}>
              <h2 className={`text-2xl font-semibold ${sectionTitleClass}`}>3. Compound Interest Calculator</h2>
              <p className={`mt-2 text-sm ${mutedTextClass}`}>
                Estimate future value using contributions, compounding, inflation, and tax drag. Compare scenarios and
                see how start timing changes long-term outcomes.
              </p>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className={`p-4 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                  <h3 className="font-semibold">Scenario A</h3>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Initial principal</Label>
                      <Input type="number" min={0} value={compoundInputA.principal} onChange={(event) => setCompoundInputA((current) => ({ ...current, principal: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                    </div>
                    <div className="space-y-1">
                      <Label>Recurring contribution</Label>
                      <Input type="number" min={0} value={compoundInputA.recurringContribution} onChange={(event) => setCompoundInputA((current) => ({ ...current, recurringContribution: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                    </div>
                    <div className="space-y-1">
                      <Label>Contribution frequency</Label>
                      <Select value={compoundInputA.contributionFrequency} onValueChange={(value) => setCompoundInputA((current) => ({ ...current, contributionFrequency: value as CompoundInput["contributionFrequency"] }))}>
                        <SelectTrigger className={darkMode ? "border-slate-700 bg-slate-950" : undefined}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Biweekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Annual return rate (%)</Label>
                      <Input type="number" min={0} max={20} step={0.1} value={compoundInputA.annualReturnRate} onChange={(event) => setCompoundInputA((current) => ({ ...current, annualReturnRate: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                    </div>
                    <div className="space-y-1">
                      <Label>Compounding frequency</Label>
                      <Select value={compoundInputA.compoundingFrequency} onValueChange={(value) => setCompoundInputA((current) => ({ ...current, compoundingFrequency: value as CompoundInput["compoundingFrequency"] }))}>
                        <SelectTrigger className={darkMode ? "border-slate-700 bg-slate-950" : undefined}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Years</Label>
                      <Input type="number" min={1} max={60} value={compoundInputA.years} onChange={(event) => setCompoundInputA((current) => ({ ...current, years: Math.max(1, Math.round(Number(event.target.value))) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                    </div>
                    <div className="space-y-1">
                      <Label>Annual contribution increase (%)</Label>
                      <Input type="number" min={0} max={25} step={0.1} value={compoundInputA.annualContributionIncreaseRate} onChange={(event) => setCompoundInputA((current) => ({ ...current, annualContributionIncreaseRate: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                    </div>
                    <div className="space-y-1">
                      <Label>Inflation rate (%)</Label>
                      <Input type="number" min={0} max={10} step={0.1} value={compoundInputA.inflationRate} onChange={(event) => setCompoundInputA((current) => ({ ...current, inflationRate: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                    </div>
                    <div className="space-y-1">
                      <Label>Tax drag (%)</Label>
                      <Input type="number" min={0} max={40} step={0.1} value={compoundInputA.taxDragRate} onChange={(event) => setCompoundInputA((current) => ({ ...current, taxDragRate: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                    </div>
                    <div className="space-y-1">
                      <Label>Start date</Label>
                      <Input type="date" value={compoundInputA.startDate} onChange={(event) => setCompoundInputA((current) => ({ ...current, startDate: event.target.value }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                    </div>
                  </div>
                </Card>

                <Card className={`p-4 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Scenario B (Comparison)</h3>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Enable</Label>
                      <Switch checked={showCompoundCompare} onCheckedChange={setShowCompoundCompare} />
                    </div>
                  </div>
                  {showCompoundCompare ? (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Initial principal</Label>
                        <Input type="number" min={0} value={compoundInputB.principal} onChange={(event) => setCompoundInputB((current) => ({ ...current, principal: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      </div>
                      <div className="space-y-1">
                        <Label>Recurring contribution</Label>
                        <Input type="number" min={0} value={compoundInputB.recurringContribution} onChange={(event) => setCompoundInputB((current) => ({ ...current, recurringContribution: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      </div>
                      <div className="space-y-1">
                        <Label>Annual return rate (%)</Label>
                        <Input type="number" min={0} max={20} step={0.1} value={compoundInputB.annualReturnRate} onChange={(event) => setCompoundInputB((current) => ({ ...current, annualReturnRate: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      </div>
                      <div className="space-y-1">
                        <Label>Years</Label>
                        <Input type="number" min={1} max={60} value={compoundInputB.years} onChange={(event) => setCompoundInputB((current) => ({ ...current, years: Math.max(1, Math.round(Number(event.target.value))) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      </div>
                      <div className="space-y-1">
                        <Label>Inflation rate (%)</Label>
                        <Input type="number" min={0} max={10} step={0.1} value={compoundInputB.inflationRate} onChange={(event) => setCompoundInputB((current) => ({ ...current, inflationRate: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      </div>
                      <div className="space-y-1">
                        <Label>Tax drag (%)</Label>
                        <Input type="number" min={0} max={40} step={0.1} value={compoundInputB.taxDragRate} onChange={(event) => setCompoundInputB((current) => ({ ...current, taxDragRate: nonNegative(Number(event.target.value)) }))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      </div>
                    </div>
                  ) : (
                    <p className={`mt-3 text-sm ${mutedTextClass}`}>
                      Enable Scenario B to compare 2 assumptions side by side.
                    </p>
                  )}
                </Card>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <MetricCard label="Ending Balance" value={formatCurrency(compoundResultA.endingBalance)} darkMode={darkMode} />
                <MetricCard label="Total Contributions" value={formatCurrency(compoundResultA.totalContributions)} darkMode={darkMode} />
                <MetricCard label="Investment Growth" value={formatCurrency(compoundResultA.totalGrowth)} darkMode={darkMode} />
                <MetricCard
                  label="Inflation-Adjusted Value"
                  value={formatCurrency(compoundResultA.inflationAdjustedEndingBalance)}
                  darkMode={darkMode}
                />
              </div>

              <Card className={`mt-4 p-4 ${cardClass}`}>
                <h3 className="font-semibold mb-3">Year-by-Year Growth</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={compoundResultA.schedule}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="endingBalance" stroke="#0f766e" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className={`p-4 ${cardClass}`}>
                  <h3 className="font-semibold">Start Now vs Start Later</h3>
                  <p className={`mt-2 text-sm ${mutedTextClass}`}>
                    Delay used: {compoundResultA.startNowVsLater.delayYears} years
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>Start now ending balance: <strong>{formatCurrency(compoundResultA.startNowVsLater.nowEndingBalance)}</strong></p>
                    <p>Start later ending balance: <strong>{formatCurrency(compoundResultA.startNowVsLater.laterEndingBalance)}</strong></p>
                    <p>Difference: <strong>{formatCurrency(compoundResultA.startNowVsLater.difference)}</strong></p>
                  </div>
                </Card>

                <Card className={`p-4 ${cardClass}`}>
                  <h3 className="font-semibold">Increase Monthly Contribution Sensitivity</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className={darkMode ? "text-slate-300" : "text-slate-600"}>
                          <th className="text-left py-2">Monthly Contribution</th>
                          <th className="text-right py-2">Ending Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compoundResultA.sensitivityTable.map((row) => (
                          <tr key={row.monthlyContribution}>
                            <td className="py-1">{formatCurrency(row.monthlyContribution)}</td>
                            <td className="py-1 text-right">{formatCurrency(row.endingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {showCompoundCompare ? (
                <Card className={`mt-4 p-4 ${cardClass}`}>
                  <h3 className="font-semibold">Scenario Comparison</h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <MetricCard label="Scenario A Ending Balance" value={formatCurrency(compoundResultA.endingBalance)} darkMode={darkMode} />
                    <MetricCard label="Scenario B Ending Balance" value={formatCurrency(compoundResultB.endingBalance)} darkMode={darkMode} />
                  </div>
                </Card>
              ) : null}

              <Card className={`mt-4 p-4 ${cardClass}`}>
                <h3 className="font-semibold">How to interpret this estimate</h3>
                <ul className={`mt-2 list-disc pl-5 space-y-1 text-sm ${mutedTextClass}`}>
                  <li>Time in market has a large impact on ending balance.</li>
                  <li>Higher expected return assumptions increase volatility and uncertainty.</li>
                  <li>Consistent contribution growth can materially improve outcomes.</li>
                  <li>Inflation can significantly reduce future purchasing power.</li>
                </ul>
              </Card>

              <div className="mt-4 flex flex-wrap gap-2">
                <Input
                  className={`max-w-xs ${darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : ""}`}
                  value={scenarioNames["compound-interest"] ?? ""}
                  onChange={(event) => updateScenarioName("compound-interest", event.target.value)}
                  placeholder="Scenario name"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    handleScenarioSave("compound-interest", "Compound Snapshot", {
                      "Ending Balance": compoundResultA.endingBalance,
                      "Total Contributions": compoundResultA.totalContributions,
                      "Total Growth": compoundResultA.totalGrowth,
                      "Inflation Adjusted": compoundResultA.inflationAdjustedEndingBalance,
                    })
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      "compound-interest-growth-table.csv",
                      ["Year", "Date", "Contributions", "Growth", "Ending Balance"],
                      compoundResultA.schedule.map((row) => [
                        row.year,
                        row.dateLabel,
                        row.contributionsCumulative,
                        row.growthCumulative,
                        row.endingBalance,
                      ]),
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Results
                </Button>
                <Button variant="outline" onClick={() => setCompoundInputA(DEFAULT_COMPOUND_INPUT)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </Card>
          </section>

          <section id="tax-estimator" className="space-y-4 scroll-mt-28">
            <Card className={`p-5 ${cardClass}`}>
              <h2 className={`text-2xl font-semibold ${sectionTitleClass}`}>4. Tax Estimator</h2>
              <p className={`mt-2 text-sm ${mutedTextClass}`}>
                Estimate federal tax liability, self-employment tax, deduction strategy, and potential refund or balance
                due with item-level deduction inputs and configurable tax year assumptions.
              </p>
              <Card className={`mt-3 p-3 ${darkMode ? "border-amber-400/60 bg-amber-900/20 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                <p className="text-sm">
                  This tax estimator is for educational purposes only. Tax outcomes vary based on jurisdiction, tax year,
                  eligibility rules, income type, filing status, and personal circumstances. Please verify results with a
                  qualified tax professional.
                </p>
              </Card>
              <Card className={`mt-2 p-3 ${darkMode ? "border-red-500/60 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-800"}`}>
                <p className="text-sm">
                  This estimator is not a filed tax return and does not replace professional tax preparation.
                </p>
              </Card>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { id: "profile", label: "1. Profile" },
                  { id: "income", label: "2. Income" },
                  { id: "deductions", label: "3. Deductions" },
                  { id: "credits", label: "4. Credits & Payments" },
                  { id: "results", label: "5. Results" },
                ].map((step) => (
                  <Button
                    key={step.id}
                    size="sm"
                    variant={taxActiveStep === step.id ? "default" : "outline"}
                    onClick={() => setTaxActiveStep(step.id as "profile" | "income" | "deductions" | "credits" | "results")}
                  >
                    {step.label}
                  </Button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_320px] gap-4">
                <div className="space-y-4">
                  <Card className={`p-4 ${cardClass}`}>
                    <h3 className="font-semibold flex items-center gap-2">
                      Profile
                      <HelpTip content="Tax profile assumptions drive bracket, deduction, and estimate logic." />
                    </h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Tax year</Label>
                        <Select value={String(taxYear)} onValueChange={(value) => setTaxYear(Number(value))}>
                          <SelectTrigger className={darkMode ? "border-slate-700 bg-slate-950" : undefined}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Filing status</Label>
                        <Select value={filingStatus} onValueChange={(value) => setFilingStatus(value as FilingStatus)}>
                          <SelectTrigger className={darkMode ? "border-slate-700 bg-slate-950" : undefined}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married-filing-jointly">Married filing jointly</SelectItem>
                            <SelectItem value="married-filing-separately">Married filing separately</SelectItem>
                            <SelectItem value="head-of-household">Head of household</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>State of residence</Label>
                        <Input value={stateCode} maxLength={2} onChange={(event) => setStateCode(event.target.value.toUpperCase().slice(0, 2))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      </div>
                      <div className="space-y-1">
                        <Label>Age</Label>
                        <Input type="number" min={0} value={age} onChange={(event) => setAge(Math.max(0, Math.round(Number(event.target.value))))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      </div>
                      <div className="space-y-1">
                        <Label>Dependents</Label>
                        <Input type="number" min={0} value={dependents} onChange={(event) => setDependents(Math.max(0, Math.round(Number(event.target.value))))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      </div>
                      <div className="space-y-1">
                        <Label>Mode</Label>
                        <Select value={deductionMode} onValueChange={(value) => setDeductionMode(value as DeductionMode)}>
                          <SelectTrigger className={darkMode ? "border-slate-700 bg-slate-950" : undefined}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard Deduction</SelectItem>
                            <SelectItem value="itemized">Itemized Deduction</SelectItem>
                            <SelectItem value="compare">Compare Both Automatically</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={over65} onCheckedChange={(checked) => setOver65(checked === true)} />
                        Over age 65
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={blind} onCheckedChange={(checked) => setBlind(checked === true)} />
                        Blindness indicator
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={isSelfEmployedPath} onCheckedChange={(checked) => setIsSelfEmployedPath(checked === true)} />
                        Use self-employed / contractor path
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={isMilitaryMove} onCheckedChange={(checked) => setIsMilitaryMove(checked === true)} />
                        Military move applies
                      </label>
                    </div>
                  </Card>

                  <Card className={`p-4 ${cardClass}`}>
                    <h3 className="font-semibold">Income</h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(taxIncome).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <Label>{key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</Label>
                          <Input
                            type="number"
                            min={0}
                            value={value}
                            onChange={(event) =>
                              setTaxIncome((current) => ({
                                ...current,
                                [key]: toNonNegativeNumber(Number(event.target.value)),
                              }))
                            }
                            className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className={`p-4 ${cardClass}`}>
                    <h3 className="font-semibold">Possible Deductions and Adjustments</h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        placeholder="Search deduction name"
                        value={deductionSearch}
                        onChange={(event) => setDeductionSearch(event.target.value)}
                        className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                      />
                      <Select value={deductionFilter} onValueChange={(value) => setDeductionFilter(value as typeof deductionFilter)}>
                        <SelectTrigger className={darkMode ? "border-slate-700 bg-slate-950" : undefined}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All deduction types</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="self-employed">Self-employed</SelectItem>
                          <SelectItem value="adjustment">Adjustments</SelectItem>
                          <SelectItem value="itemized">Itemized</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() =>
                          downloadCSV(
                            "tax-deduction-entries.csv",
                            ["Section", "Item", "Enabled", "Amount"],
                            [
                              ...ADJUSTMENT_DEDUCTIONS.map((item) => [
                                "Adjustment",
                                item.label,
                                adjustmentStates[item.id]?.enabled ? "Yes" : "No",
                                adjustmentStates[item.id]?.amount ?? 0,
                              ]),
                              ...ITEMIZED_DEDUCTIONS.map((item) => [
                                "Itemized",
                                item.label,
                                itemizedStates[item.id]?.enabled ? "Yes" : "No",
                                itemizedStates[item.id]?.amount ?? 0,
                              ]),
                              ...BUSINESS_DEDUCTIONS.map((item) => [
                                "Business",
                                item.label,
                                businessStates[item.id]?.enabled ? "Yes" : "No",
                                businessStates[item.id]?.amount ?? 0,
                              ]),
                            ],
                          )
                        }
                      >
                        Export CSV
                      </Button>
                    </div>

                    <Accordion type="multiple" className="mt-4">
                      <AccordionItem value="adjustments">
                        <AccordionTrigger>Above-the-line deductions / adjustments</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {visibleAdjustmentDefs.map((definition) => (
                              <DeductionRow
                                key={definition.id}
                                definition={definition}
                                enabled={adjustmentStates[definition.id]?.enabled ?? false}
                                amount={adjustmentStates[definition.id]?.amount ?? 0}
                                onToggle={(enabled) => updateDeductionState(setAdjustmentStates, definition.id, { enabled })}
                                onAmountChange={(amount) => updateDeductionState(setAdjustmentStates, definition.id, { amount })}
                                darkMode={darkMode}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="itemized">
                        <AccordionTrigger>Itemized deductions</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {visibleItemizedDefs.map((definition) => (
                              <DeductionRow
                                key={definition.id}
                                definition={definition}
                                enabled={itemizedStates[definition.id]?.enabled ?? false}
                                amount={itemizedStates[definition.id]?.amount ?? 0}
                                onToggle={(enabled) => updateDeductionState(setItemizedStates, definition.id, { enabled })}
                                onAmountChange={(amount) => updateDeductionState(setItemizedStates, definition.id, { amount })}
                                darkMode={darkMode}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {(isSelfEmployedPath || taxIncome.selfEmploymentIncome > 0 || taxIncome.businessIncome > 0) ? (
                        <AccordionItem value="business">
                          <AccordionTrigger>Self-Employed / Business Expense Estimates</AccordionTrigger>
                          <AccordionContent>
                            <p className={`text-xs mb-2 ${mutedTextClass}`}>
                              Mixed personal/business use items may require allocation. Deductions are educational estimates only.
                            </p>
                            <div className="space-y-2">
                              {visibleBusinessDefs.map((definition) => (
                                <DeductionRow
                                  key={definition.id}
                                  definition={definition}
                                  enabled={businessStates[definition.id]?.enabled ?? false}
                                  amount={businessStates[definition.id]?.amount ?? 0}
                                  onToggle={(enabled) => updateDeductionState(setBusinessStates, definition.id, { enabled })}
                                  onAmountChange={(amount) => updateDeductionState(setBusinessStates, definition.id, { amount })}
                                  darkMode={darkMode}
                                />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ) : null}
                    </Accordion>
                  </Card>

                  <Card className={`p-4 ${cardClass}`}>
                    <h3 className="font-semibold">Payments and Credits Already Applied</h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(taxCredits).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <Label>{key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</Label>
                          <Input
                            type="number"
                            min={0}
                            value={value}
                            onChange={(event) =>
                              setTaxCredits((current) => ({
                                ...current,
                                [key]: nonNegative(Number(event.target.value)),
                              }))
                            }
                            className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(taxPayments).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <Label>{key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</Label>
                          <Input
                            type="number"
                            min={0}
                            value={value}
                            onChange={(event) =>
                              setTaxPayments((current) => ({
                                ...current,
                                [key]: nonNegative(Number(event.target.value)),
                              }))
                            }
                            className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className={`p-4 ${cardClass}`}>
                    <h3 className="font-semibold">Tax Results</h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                      <MetricCard label="Estimated Federal Tax" value={formatCurrency(taxResult.federalIncomeTax)} darkMode={darkMode} />
                      <MetricCard label="Estimated SE Tax" value={formatCurrency(taxResult.selfEmploymentTax)} darkMode={darkMode} />
                      <MetricCard label="Total Credits" value={formatCurrency(taxResult.totalCreditsDisplayed)} darkMode={darkMode} />
                      <MetricCard label="Total Payments" value={formatCurrency(taxResult.totalPayments)} darkMode={darkMode} />
                      <MetricCard
                        label={taxResult.estimatedRefund > 0 ? "Estimated Refund" : "Estimated Balance Due"}
                        value={formatCurrency(Math.max(taxResult.estimatedRefund, taxResult.estimatedAmountOwed))}
                        darkMode={darkMode}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Card className={`p-3 ${darkMode ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-slate-50"}`}>
                        <h4 className="text-sm font-semibold">Detailed Tax Summary</h4>
                        <ul className={`mt-2 text-sm space-y-1 ${mutedTextClass}`}>
                          <li>Gross income: {formatCurrency(taxResult.grossIncome)}</li>
                          <li>Adjustments: {formatCurrency(taxResult.totalAdjustments)}</li>
                          <li>AGI: {formatCurrency(taxResult.adjustedGrossIncome)}</li>
                          <li>Deduction used: {formatCurrency(taxResult.deductionUsed)} ({taxResult.deductionMethodUsed})</li>
                          <li>Taxable income: {formatCurrency(taxResult.taxableIncome)}</li>
                          <li>Tax before credits: {formatCurrency(taxResult.taxBeforeCredits)}</li>
                          <li>Total estimated tax: {formatCurrency(taxResult.totalEstimatedTaxLiability)}</li>
                          <li>Marginal rate: {formatPercent(taxResult.marginalRate * 100, 1)}</li>
                          <li>Effective rate: {formatPercent(taxResult.effectiveRate * 100, 1)}</li>
                        </ul>
                      </Card>
                      <Card className={`p-3 ${taxResult.estimatedRefund > 0 ? (darkMode ? "border-emerald-500/50 bg-emerald-900/20 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-800") : (darkMode ? "border-red-500/50 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-800")}`}>
                        <h4 className="text-sm font-semibold">
                          {taxResult.estimatedRefund > 0 ? "Estimated Refund" : "Estimated Amount Owed"}
                        </h4>
                        <p className="mt-1 text-xl font-bold">
                          {formatCurrency(Math.max(taxResult.estimatedRefund, taxResult.estimatedAmountOwed))}
                        </p>
                        {taxResult.quarterlyEstimatedPaymentSuggestion > 0 ? (
                          <p className="mt-2 text-xs">
                            Estimated quarterly payment suggestion: {formatCurrency(taxResult.quarterlyEstimatedPaymentSuggestion)}
                          </p>
                        ) : null}
                      </Card>
                    </div>

                    <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
                      <Card className={`p-3 ${cardClass}`}>
                        <h4 className="text-sm font-semibold mb-2">Income Breakdown</h4>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taxResult.incomeBreakdown}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" hide />
                              <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                              <Bar dataKey="value" fill="#0ea5e9" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                      <Card className={`p-3 ${cardClass}`}>
                        <h4 className="text-sm font-semibold mb-2">Deduction Breakdown</h4>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={taxResult.deductionBreakdown} dataKey="value" nameKey="label" outerRadius={80}>
                                {taxResult.deductionBreakdown.map((item, index) => (
                                  <Cell key={item.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Legend />
                              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                      <Card className={`p-3 ${cardClass}`}>
                        <h4 className="text-sm font-semibold mb-2">Tax vs Payments</h4>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { label: "Total Estimated Tax", value: taxResult.totalEstimatedTaxLiability },
                              { label: "Payments + Refundable Credits", value: taxResult.totalPayments + taxResult.refundableCreditsTotal },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" hide />
                              <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                              <Bar dataKey="value" fill="#2563eb" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </div>

                    {(taxResult.warnings.length > 0 || taxValidationWarnings.length > 0) ? (
                      <Card className={`mt-4 p-3 ${darkMode ? "border-amber-500/60 bg-amber-900/20 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                        <h4 className="text-sm font-semibold">Validation / Guardrails</h4>
                        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                          {[...taxResult.warnings, ...taxValidationWarnings].map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      </Card>
                    ) : null}

                    <Card className={`mt-4 p-4 ${cardClass}`}>
                      <h4 className="font-semibold">How this estimate was calculated</h4>
                      <ul className={`mt-2 list-disc pl-5 space-y-1 text-sm ${mutedTextClass}`}>
                        {taxResult.assumptions.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                        <li>A refund estimate depends on withholding, estimated tax payments, and credits, not just deductions.</li>
                      </ul>
                    </Card>

                    <Card className={`mt-4 p-4 ${cardClass}`}>
                      <h4 className="font-semibold">Tax education notes</h4>
                      <p className={`mt-2 text-sm ${mutedTextClass}`}>
                        Deductions lower taxable income, while credits directly reduce tax due. A larger refund does not
                        always mean lower tax overall; it may indicate more withholding during the year.
                      </p>
                    </Card>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Input
                        className={`max-w-xs ${darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : ""}`}
                        value={scenarioNames["tax-estimator"] ?? ""}
                        onChange={(event) => updateScenarioName("tax-estimator", event.target.value)}
                        placeholder="Scenario name"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleScenarioSave("tax-estimator", "Tax Snapshot", {
                            Year: taxYear,
                            "Gross Income": taxResult.grossIncome,
                            AGI: taxResult.adjustedGrossIncome,
                            "Taxable Income": taxResult.taxableIncome,
                            "Total Estimated Tax": taxResult.totalEstimatedTaxLiability,
                            Refund: taxResult.estimatedRefund,
                            "Amount Owed": taxResult.estimatedAmountOwed,
                          })
                        }
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Scenario
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          downloadSummaryPdf("Tax Estimator Summary", [
                            { label: "Gross Income", value: formatCurrency(taxResult.grossIncome) },
                            { label: "AGI", value: formatCurrency(taxResult.adjustedGrossIncome) },
                            { label: "Deduction Used", value: `${formatCurrency(taxResult.deductionUsed)} (${taxResult.deductionMethodUsed})` },
                            { label: "Taxable Income", value: formatCurrency(taxResult.taxableIncome) },
                            { label: "Federal Tax", value: formatCurrency(taxResult.federalIncomeTax) },
                            { label: "Self-Employment Tax", value: formatCurrency(taxResult.selfEmploymentTax) },
                            { label: "Total Estimated Tax", value: formatCurrency(taxResult.totalEstimatedTaxLiability) },
                            { label: "Estimated Refund", value: formatCurrency(taxResult.estimatedRefund) },
                            { label: "Estimated Amount Owed", value: formatCurrency(taxResult.estimatedAmountOwed) },
                          ])
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Results
                      </Button>
                      <Button variant="outline" onClick={resetTaxEstimator}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Calculator
                      </Button>
                      <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </Card>
                </div>

                <aside className="space-y-3">
                  <Card className={`p-4 xl:sticky xl:top-24 ${cardClass}`}>
                    <h3 className="font-semibold mb-3">Live Tax Summary</h3>
                    <div className="space-y-2 text-sm">
                      <p>Gross Income: <strong>{formatCurrency(taxResult.grossIncome)}</strong></p>
                      <p>AGI: <strong>{formatCurrency(taxResult.adjustedGrossIncome)}</strong></p>
                      <p>Deduction Used: <strong>{formatCurrency(taxResult.deductionUsed)}</strong></p>
                      <p>Taxable Income: <strong>{formatCurrency(taxResult.taxableIncome)}</strong></p>
                      <p>Tax Before Credits: <strong>{formatCurrency(taxResult.taxBeforeCredits)}</strong></p>
                      <p>Credits Applied: <strong>{formatCurrency(taxResult.totalCreditsDisplayed)}</strong></p>
                      <p>Payments: <strong>{formatCurrency(taxResult.totalPayments)}</strong></p>
                      <p>
                        Estimated {taxResult.estimatedRefund > 0 ? "Refund" : "Owed"}:{" "}
                        <strong>{formatCurrency(Math.max(taxResult.estimatedRefund, taxResult.estimatedAmountOwed))}</strong>
                      </p>
                    </div>
                  </Card>
                </aside>
              </div>
            </Card>
          </section>

          <section id="retirement" className="space-y-4 scroll-mt-28">
            <Card className={`p-5 ${cardClass}`}>
              <h2 className={`text-2xl font-semibold ${sectionTitleClass}`}>5. Retirement Calculator</h2>
              <p className={`mt-2 text-sm ${mutedTextClass}`}>
                Project retirement savings, income targets, withdrawal sustainability, and confidence under
                conservative/base/aggressive assumptions.
              </p>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className={`p-4 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                  <h3 className="font-semibold">Inputs</h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(retirementInput).map(([key, value]) => {
                      if (typeof value === "string") return null;
                      return (
                        <div key={key} className="space-y-1">
                          <Label>{key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</Label>
                          <Input
                            type="number"
                            min={0}
                            value={value}
                            onChange={(event) =>
                              setRetirementInput((current) => ({
                                ...current,
                                [key]: nonNegative(Number(event.target.value)),
                              }))
                            }
                            className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined}
                          />
                        </div>
                      );
                    })}
                    <div className="space-y-1">
                      <Label>Lifestyle</Label>
                      <Select value={retirementInput.lifestyle} onValueChange={(value) => setRetirementInput((current) => ({ ...current, lifestyle: value as typeof retirementInput.lifestyle }))}>
                        <SelectTrigger className={darkMode ? "border-slate-700 bg-slate-950" : undefined}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="comfortable">Comfortable</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Scenario</Label>
                      <Select value={retirementInput.scenario} onValueChange={(value) => setRetirementInput((current) => ({ ...current, scenario: value as typeof retirementInput.scenario }))}>
                        <SelectTrigger className={darkMode ? "border-slate-700 bg-slate-950" : undefined}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conservative">Conservative</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
                          <SelectItem value="aggressive">Aggressive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                <Card className={`p-4 ${cardClass}`}>
                  <h3 className="font-semibold mb-3">Retirement Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <MetricCard label="Savings at Retirement" value={formatCurrency(retirementResult.estimatedSavingsAtRetirement)} darkMode={darkMode} />
                    <MetricCard label="Income Target at Retirement" value={formatCurrency(retirementResult.annualIncomeTargetAtRetirement)} darkMode={darkMode} />
                    <MetricCard label="Estimated Withdrawal Income" value={formatCurrency(retirementResult.annualWithdrawalEstimate)} darkMode={darkMode} />
                    <MetricCard label="Income Gap / Surplus" value={formatCurrency(retirementResult.annualIncomeGapOrSurplus)} darkMode={darkMode} />
                    <MetricCard label="Readiness Score" value={`${retirementResult.readinessScore}/100`} darkMode={darkMode} />
                    <MetricCard label="Confidence (Monte Carlo style)" value={formatPercent(retirementResult.confidenceProbability * 100, 1)} darkMode={darkMode} />
                  </div>
                  <div className="mt-3">
                    <Badge variant="outline" className={retirementResult.readinessStatus === "Ahead" || retirementResult.readinessStatus === "On track" ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}>
                      {retirementResult.readinessStatus}
                    </Badge>
                  </div>
                </Card>
              </div>

              <Card className={`mt-4 p-4 ${cardClass}`}>
                <h3 className="font-semibold mb-3">Year-by-Year Accumulation</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={retirementResult.accumulationSchedule}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" />
                      <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line dataKey="endingBalance" type="monotone" stroke="#16a34a" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="mt-4 flex flex-wrap gap-2">
                <Input
                  className={`max-w-xs ${darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : ""}`}
                  value={scenarioNames["retirement"] ?? ""}
                  onChange={(event) => updateScenarioName("retirement", event.target.value)}
                  placeholder="Scenario name"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    handleScenarioSave("retirement", "Retirement Snapshot", {
                      "Savings at Retirement": retirementResult.estimatedSavingsAtRetirement,
                      "Income Target": retirementResult.annualIncomeTargetAtRetirement,
                      "Readiness Score": retirementResult.readinessScore,
                      "Confidence Probability": retirementResult.confidenceProbability,
                      "Recommended Monthly Increase": retirementResult.recommendedAdditionalMonthlyContribution,
                    })
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadSummaryPdf("Retirement Calculator Summary", [
                      { label: "Savings at Retirement", value: formatCurrency(retirementResult.estimatedSavingsAtRetirement) },
                      { label: "Income Target", value: formatCurrency(retirementResult.annualIncomeTargetAtRetirement) },
                      { label: "Annual Gap / Surplus", value: formatCurrency(retirementResult.annualIncomeGapOrSurplus) },
                      { label: "Readiness Status", value: retirementResult.readinessStatus },
                      { label: "Confidence", value: formatPercent(retirementResult.confidenceProbability * 100, 1) },
                    ])
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Results
                </Button>
                <Button variant="outline" onClick={() => setRetirementInput(DEFAULT_RETIREMENT_INPUT)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </Card>
          </section>

          <section id="debt-payoff" className="space-y-4 scroll-mt-28">
            <Card className={`p-5 ${cardClass}`}>
              <h2 className={`text-2xl font-semibold ${sectionTitleClass}`}>6. Debt Payoff Calculator</h2>
              <p className={`mt-2 text-sm ${mutedTextClass}`}>
                Build debt payoff plans using minimum payments, snowball, avalanche, or custom priority strategies.
                Compare debt-free timelines and total interest.
              </p>

              <div className="mt-4 space-y-3">
                {debts.map((debt, index) => (
                  <Card key={debt.id} className={`p-3 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      <Input value={debt.name} onChange={(event) => setDebts((current) => current.map((item) => item.id === debt.id ? { ...item, name: event.target.value } : item))} placeholder="Debt name" className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      <Input type="number" min={0} value={debt.balance} onChange={(event) => setDebts((current) => current.map((item) => item.id === debt.id ? { ...item, balance: nonNegative(Number(event.target.value)) } : item))} placeholder="Balance" className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      <Input type="number" min={0} value={debt.annualRate} onChange={(event) => setDebts((current) => current.map((item) => item.id === debt.id ? { ...item, annualRate: nonNegative(Number(event.target.value)) } : item))} placeholder="APR %" className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      <Input type="number" min={0} value={debt.minimumPayment} onChange={(event) => setDebts((current) => current.map((item) => item.id === debt.id ? { ...item, minimumPayment: nonNegative(Number(event.target.value)) } : item))} placeholder="Min payment" className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                      <div className="flex items-center gap-2">
                        <Input type="number" min={1} value={debt.priority} onChange={(event) => setDebts((current) => current.map((item) => item.id === debt.id ? { ...item, priority: Math.max(1, Math.round(Number(event.target.value))) } : item))} placeholder="Priority" className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                        <Button variant="outline" size="icon" onClick={() => setDebts((current) => current.filter((item) => item.id !== debt.id))}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className={`text-xs ${mutedTextClass}`}>
                        Estimated payoff month ({debtResult.selected.strategy}):{" "}
                        {debtResult.selected.payoffMonthByDebt[debt.name]
                          ? `${debtResult.selected.payoffMonthByDebt[debt.name]}`
                          : "Pending"}
                      </p>
                    </div>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    setDebts((current) => [
                      ...current,
                      {
                        id: `debt-${Date.now()}`,
                        name: `Debt ${current.length + 1}`,
                        balance: 0,
                        annualRate: 12,
                        minimumPayment: 50,
                        priority: current.length + 1,
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Debt
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Extra monthly payment</Label>
                  <Input type="number" min={0} value={extraDebtPayment} onChange={(event) => setExtraDebtPayment(nonNegative(Number(event.target.value)))} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                </div>
                <div className="space-y-1">
                  <Label>Strategy</Label>
                  <Select value={debtStrategy} onValueChange={(value) => setDebtStrategy(value as typeof debtStrategy)}>
                    <SelectTrigger className={darkMode ? "border-slate-700 bg-slate-950" : undefined}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimum">Minimum payments only</SelectItem>
                      <SelectItem value="snowball">Snowball</SelectItem>
                      <SelectItem value="avalanche">Avalanche</SelectItem>
                      <SelectItem value="custom">Custom priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Start date</Label>
                  <Input type="date" value={debtStartDate} onChange={(event) => setDebtStartDate(event.target.value)} className={darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : undefined} />
                </div>
              </div>

              {debtResult.selected.negativeAmortizationDebts.length > 0 ? (
                <Card className={`mt-4 p-3 ${darkMode ? "border-red-500/60 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-800"}`}>
                  <h3 className="font-semibold text-sm">Negative amortization risk</h3>
                  <p className="text-sm mt-1">
                    Minimum payment may be too low to cover interest for:{" "}
                    {debtResult.selected.negativeAmortizationDebts.join(", ")}.
                  </p>
                </Card>
              ) : null}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                <MetricCard label="Payoff Date" value={debtResult.selected.debtFreeDate} darkMode={darkMode} />
                <MetricCard label="Months to Debt-Free" value={String(debtResult.selected.monthsToDebtFree)} darkMode={darkMode} />
                <MetricCard label="Total Interest" value={formatCurrency(debtResult.selected.totalInterestPaid)} darkMode={darkMode} />
                <MetricCard label="Total Paid" value={formatCurrency(debtResult.selected.totalPaid)} darkMode={darkMode} />
                <MetricCard label="Interest Saved vs Minimum" value={formatCurrency(debtResult.interestSavedVsMinimum)} darkMode={darkMode} />
              </div>

              <Card className={`mt-4 p-4 ${cardClass}`}>
                <h3 className="font-semibold mb-3">Debt Balance Timeline</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={debtResult.selected.schedule}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthIndex" />
                      <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="totalBalance" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className={`mt-4 p-4 ${cardClass}`}>
                <h3 className="font-semibold mb-2">Strategy Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className={mutedTextClass}>
                        <th className="text-left py-2">Strategy</th>
                        <th className="text-right py-2">Months</th>
                        <th className="text-right py-2">Total Interest</th>
                        <th className="text-right py-2">Debt-Free Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Minimum", data: debtResult.minimum },
                        { name: "Snowball", data: debtResult.snowball },
                        { name: "Avalanche", data: debtResult.avalanche },
                      ].map((row) => (
                        <tr key={row.name}>
                          <td className="py-1">{row.name}</td>
                          <td className="py-1 text-right">{row.data.monthsToDebtFree}</td>
                          <td className="py-1 text-right">{formatCurrency(row.data.totalInterestPaid)}</td>
                          <td className="py-1 text-right">{row.data.debtFreeDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="mt-4 flex flex-wrap gap-2">
                <Input
                  className={`max-w-xs ${darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : ""}`}
                  value={scenarioNames["debt-payoff"] ?? ""}
                  onChange={(event) => updateScenarioName("debt-payoff", event.target.value)}
                  placeholder="Scenario name"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    handleScenarioSave("debt-payoff", "Debt Snapshot", {
                      Strategy: debtResult.selected.strategy,
                      "Months to Debt-Free": debtResult.selected.monthsToDebtFree,
                      "Total Interest": debtResult.selected.totalInterestPaid,
                      "Interest Saved vs Minimum": debtResult.interestSavedVsMinimum,
                      "Debt-Free Date": debtResult.selected.debtFreeDate,
                    })
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadCSV(
                      "debt-payoff-schedule.csv",
                      ["Month", "Total Balance", "Interest Paid To Date"],
                      debtResult.selected.schedule.map((row) => [row.monthIndex, row.totalBalance, row.totalInterestPaidToDate]),
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Results
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDebts(DEFAULT_DEBTS);
                    setExtraDebtPayment(350);
                    setDebtStrategy("avalanche");
                    setDebtStartDate(new Date().toISOString().slice(0, 10));
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </Card>
          </section>

          <Card className={`p-5 ${cardClass}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className={`text-xl font-semibold ${sectionTitleClass}`}>Compare Scenarios</h2>
                <p className={`text-sm ${mutedTextClass}`}>Save what-if snapshots and compare metrics side by side.</p>
              </div>
              <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Scale className="h-4 w-4 mr-2" />
                    Compare Scenarios
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Scenario Comparison</DialogTitle>
                    <DialogDescription>Select up to two scenarios to compare.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
                      {savedScenarios.map((scenario) => {
                        const checked = selectedScenarioIds.includes(scenario.id);
                        return (
                          <label key={scenario.id} className="flex items-start gap-2 rounded-md border border-slate-200 p-3 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                setSelectedScenarioIds((current) => {
                                  const next = value === true ? [...current, scenario.id] : current.filter((id) => id !== scenario.id);
                                  return Array.from(new Set(next)).slice(0, 2);
                                });
                              }}
                            />
                            <span>
                              <strong>{scenario.label}</strong>
                              <br />
                              <span className="text-xs text-slate-500">{scenario.calculator} · {new Date(scenario.createdAt).toLocaleString("en-US")}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="overflow-auto max-h-[420px] border border-slate-200 rounded-md p-3">
                      {scenarioComparison.selected.length === 0 ? (
                        <p className="text-sm text-slate-500">Select scenarios to compare.</p>
                      ) : (
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr>
                              <th className="text-left py-2">Metric</th>
                              {scenarioComparison.selected.map((scenario) => (
                                <th key={scenario.id} className="text-right py-2">{scenario.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {scenarioComparison.metricKeys.map((metricKey) => (
                              <tr key={metricKey}>
                                <td className="py-1">{metricKey}</td>
                                {scenarioComparison.selected.map((scenario) => (
                                  <td key={`${scenario.id}-${metricKey}`} className="py-1 text-right">
                                    {typeof scenario.metrics[metricKey] === "number"
                                      ? formatCurrency(Number(scenario.metrics[metricKey]))
                                      : String(scenario.metrics[metricKey] ?? "-")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          <section className="space-y-4">
            <Card className={`p-5 ${cardClass}`}>
              <h2 className={`text-xl font-semibold ${sectionTitleClass}`}>FAQ</h2>
              <Accordion type="single" collapsible className="mt-3">
                {FAQ_ITEMS.map((item) => (
                  <AccordionItem key={item.q} value={item.q}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            <Card className={`p-5 ${cardClass}`}>
              <h2 className={`text-xl font-semibold ${sectionTitleClass}`}>Recommended Next Steps</h2>
              <p className={`mt-2 text-sm ${mutedTextClass}`}>
                Want lender-specific loan estimates after planning scenarios? Move from education to real offers.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => (window.location.href = "/loan-calculators")}>
                  Explore Loan Calculators
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = "/mortgage-underwriting")}>
                  Try Mortgage Underwriting
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = "/loan")}>
                  Speak With a Loan Officer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const subject = encodeURIComponent("Money Tools Scenario Summary");
                    const body = encodeURIComponent(
                      savedScenarios
                        .slice(0, 3)
                        .map((scenario) => `${scenario.label} (${scenario.calculator})`)
                        .join("\n"),
                    );
                    window.location.href = `mailto:?subject=${subject}&body=${body}`;
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Results Summary
                </Button>
              </div>
              <Card className={`mt-4 p-3 ${darkMode ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-slate-50"}`}>
                <p className={`text-sm ${mutedTextClass}`}>
                  Account sync hook placeholder: connect scenario storage to authenticated user profiles for long-term
                  history. Assumption editing for admins is managed in `client/src/lib/taxRules.ts`.
                </p>
              </Card>
            </Card>

            <Card className={`p-4 ${darkMode ? "border-amber-400/60 bg-amber-900/20 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
              <p className="text-sm">
                These calculators are educational models. Results are estimates only and may differ from lender,
                tax authority, brokerage, or retirement plan outcomes.
              </p>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
