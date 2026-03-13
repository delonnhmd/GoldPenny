import { Fragment, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { calculateFixedAmortization, formatCurrency, formatPercent, toNonNegativeNumber, toPositiveInt } from "@/lib/finance";
import { setPageSeo } from "@/lib/seo";

const PAGE_TITLE = "Mortgage Scenario Checker - Pre-Decision Underwriter | PennyFloat";
const PAGE_DESCRIPTION =
  "Run a borrower-facing mortgage scenario checker to estimate program fit, underwriting flags, documentation checklist, and pre-decision risk signals for conventional, FHA, VA, and jumbo loans.";
const PAGE_KEYWORDS =
  "mortgage scenario checker, mortgage eligibility tool, mortgage prequalification tool, mortgage underwriting checklist, dti underwriting calculator, fha va conventional jumbo comparison";
const PAGE_CANONICAL = "https://www.pennyfloat.com/mortgage-underwriting";

type LoanProgram = "conventional" | "fha" | "va" | "jumbo";
type EmploymentType = "w2" | "self-employed" | "retired";
type RiskLevel = "green" | "yellow" | "red";

interface ProgramRules {
  minFico: number;
  maxDti: number;
  minDownPercent: number;
  jumboOnly?: boolean;
  veteranOnly?: boolean;
  minReserveMonths?: number;
}

interface ProgramEvaluation {
  program: LoanProgram;
  eligible: boolean;
  score: number;
  hardStops: string[];
  softFlags: string[];
}

interface AnalysisSummary {
  recommendationTitle: string;
  recommendationReason: string;
  recommendedProgram: LoanProgram;
  riskLevel: RiskLevel;
  monthlyHousingPayment: number;
  monthlyPrincipalInterest: number;
  frontEndDti: number;
  backEndDti: number;
  loanAmount: number;
  downPaymentPercent: number;
  reservesMonths: number;
  conditionFlags: string[];
  documentChecklist: string[];
  underwritingConditions: string[];
  programEvaluations: ProgramEvaluation[];
}

const WORKFLOW_STEPS = [
  "Step 1 Borrower Profile",
  "Step 2 Loan Scenario",
  "Step 3 Financial Profile",
  "Step 4 Underwriting Analysis",
  "Step 5 Document & Condition Checklist",
] as const;

const PROGRAM_RULES: Record<LoanProgram, ProgramRules> = {
  conventional: {
    minFico: 620,
    maxDti: 50,
    minDownPercent: 3,
  },
  fha: {
    minFico: 500,
    maxDti: 57,
    minDownPercent: 3.5,
  },
  va: {
    minFico: 580,
    maxDti: 60,
    minDownPercent: 0,
    veteranOnly: true,
  },
  jumbo: {
    minFico: 680,
    maxDti: 43,
    minDownPercent: 10,
    jumboOnly: true,
    minReserveMonths: 6,
  },
};

const PROGRAM_LABELS: Record<LoanProgram, string> = {
  conventional: "Conventional",
  fha: "FHA",
  va: "VA",
  jumbo: "Jumbo",
};

function roundOneDecimal(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function evaluateProgram(params: {
  program: LoanProgram;
  ficoScore: number;
  backEndDti: number;
  downPaymentPercent: number;
  jumboRequired: boolean;
  reservesMonths: number;
  isVeteranEligible: boolean;
}): ProgramEvaluation {
  const rules = PROGRAM_RULES[params.program];
  const hardStops: string[] = [];
  const softFlags: string[] = [];

  if (rules.jumboOnly && !params.jumboRequired) {
    softFlags.push("Jumbo not required at current loan amount.");
  }
  if (!rules.jumboOnly && params.jumboRequired) {
    hardStops.push("Requested loan amount exceeds conforming limit; jumbo underwriting required.");
  }
  if (rules.veteranOnly && !params.isVeteranEligible) {
    hardStops.push("VA program requires eligible military service.");
  }
  if (params.ficoScore < rules.minFico) {
    hardStops.push(`Credit score is below ${PROGRAM_LABELS[params.program]} minimum guideline.`);
  }

  const requiredDownPercent =
    params.program === "fha" && params.ficoScore < 580
      ? 10
      : rules.minDownPercent;

  if (params.downPaymentPercent < requiredDownPercent) {
    hardStops.push(`Down payment is below ${PROGRAM_LABELS[params.program]} minimum requirement.`);
  }
  if (params.backEndDti > rules.maxDti) {
    hardStops.push(`DTI exceeds ${PROGRAM_LABELS[params.program]} guideline (${rules.maxDti}%).`);
  } else if (params.backEndDti > Math.max(rules.maxDti - 7, 36)) {
    softFlags.push("DTI is near the upper guideline range.");
  }
  if (rules.minReserveMonths && params.reservesMonths < rules.minReserveMonths) {
    hardStops.push(`Reserves below ${rules.minReserveMonths} months required for jumbo scenario.`);
  }

  const eligible = hardStops.length === 0;
  const score = Math.max(0, 100 - hardStops.length * 25 - softFlags.length * 8);

  return {
    program: params.program,
    eligible,
    score,
    hardStops,
    softFlags,
  };
}

function getRiskLevel(evaluation: ProgramEvaluation, hasIncome: boolean): RiskLevel {
  if (!hasIncome || evaluation.hardStops.length >= 3) return "red";
  if (evaluation.hardStops.length >= 1 || evaluation.softFlags.length >= 3) return "yellow";
  return "green";
}

function getRiskBadgeClasses(level: RiskLevel): string {
  if (level === "green") return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (level === "yellow") return "border-amber-200 bg-amber-100 text-amber-800";
  return "border-red-200 bg-red-100 text-red-800";
}

function getRecommendationReason(params: {
  program: LoanProgram;
  jumboRequired: boolean;
  ficoScore: number;
  downPaymentPercent: number;
  isVeteranEligible: boolean;
}): string {
  if (params.jumboRequired) {
    return "Jumbo recommended because requested loan amount exceeds conforming limit.";
  }
  if (params.program === "fha") {
    return "FHA recommended based on credit score and down payment profile.";
  }
  if (params.program === "va") {
    return params.isVeteranEligible
      ? "VA recommended based on veteran eligibility and borrower profile."
      : "VA scenario reviewed, but service eligibility must be verified.";
  }
  if (params.ficoScore >= 700 && params.downPaymentPercent >= 10) {
    return "Conventional recommended based on stronger credit and down payment.";
  }
  return "Conventional recommended based on standard credit and DTI fit.";
}

export default function MortgageUnderwriting() {
  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      keywords: PAGE_KEYWORDS,
      canonical: PAGE_CANONICAL,
      robots: "index, follow, max-image-preview:large",
    });
  }, []);

  const [ficoScore, setFicoScore] = useState(680);
  const [employmentType, setEmploymentType] = useState<EmploymentType>("w2");
  const [isVeteranEligible, setIsVeteranEligible] = useState("no");
  const [monthlyRentalIncome, setMonthlyRentalIncome] = useState(0);

  const [propertyValue, setPropertyValue] = useState(450000);
  const [downPaymentAmount, setDownPaymentAmount] = useState(45000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [conformingLoanLimit, setConformingLoanLimit] = useState(806500);
  const [annualPropertyTax, setAnnualPropertyTax] = useState(5400);
  const [annualHomeInsurance, setAnnualHomeInsurance] = useState(1800);
  const [monthlyHoa, setMonthlyHoa] = useState(0);
  const [monthlyMi, setMonthlyMi] = useState(0);

  const [monthlyIncome, setMonthlyIncome] = useState(9500);
  const [monthlyDebt, setMonthlyDebt] = useState(750);
  const [liquidReserves, setLiquidReserves] = useState(30000);

  const cleanPropertyValue = toNonNegativeNumber(propertyValue);
  const cleanDownPayment = clampNumber(toNonNegativeNumber(downPaymentAmount), 0, cleanPropertyValue);
  const loanAmount = Math.max(0, cleanPropertyValue - cleanDownPayment);
  const downPaymentPercent = cleanPropertyValue > 0 ? roundOneDecimal((cleanDownPayment / cleanPropertyValue) * 100) : 0;
  const ficoWhole = clampNumber(Math.round(toNonNegativeNumber(ficoScore)), 300, 850);
  const rentalIncomeCredit = toNonNegativeNumber(monthlyRentalIncome) * 0.75;
  const qualifyingIncome = toNonNegativeNumber(monthlyIncome) + rentalIncomeCredit;
  const jumboRequired = loanAmount > toNonNegativeNumber(conformingLoanLimit);

  const monthlyPrincipalInterest = useMemo(
    () =>
      calculateFixedAmortization({
        loanAmount,
        annualRateAPR: clampNumber(toNonNegativeNumber(interestRate), 0, 100),
        termMonths: toPositiveInt(loanTermYears, 1) * 12,
      }).monthlyPayment,
    [interestRate, loanAmount, loanTermYears],
  );

  const monthlyHousingPayment =
    monthlyPrincipalInterest +
    toNonNegativeNumber(annualPropertyTax) / 12 +
    toNonNegativeNumber(annualHomeInsurance) / 12 +
    toNonNegativeNumber(monthlyHoa) +
    toNonNegativeNumber(monthlyMi);

  const frontEndDti = qualifyingIncome > 0 ? roundOneDecimal((monthlyHousingPayment / qualifyingIncome) * 100) : 0;
  const backEndDti = qualifyingIncome > 0
    ? roundOneDecimal(((monthlyHousingPayment + toNonNegativeNumber(monthlyDebt)) / qualifyingIncome) * 100)
    : 0;
  const reservesMonths = monthlyHousingPayment > 0 ? roundOneDecimal(toNonNegativeNumber(liquidReserves) / monthlyHousingPayment) : 0;

  const analysis = useMemo<AnalysisSummary>(() => {
    const programEvaluations: ProgramEvaluation[] = (Object.keys(PROGRAM_RULES) as LoanProgram[]).map((program) =>
      evaluateProgram({
        program,
        ficoScore: ficoWhole,
        backEndDti,
        downPaymentPercent,
        jumboRequired,
        reservesMonths,
        isVeteranEligible: isVeteranEligible === "yes",
      }),
    );

    let recommendedProgram: LoanProgram;
    if (jumboRequired) {
      recommendedProgram = "jumbo";
    } else {
      const ranked = programEvaluations
        .filter((evaluation) => evaluation.program !== "jumbo")
        .sort((a, b) => {
          if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
          return b.score - a.score;
        });
      recommendedProgram = ranked[0]?.program ?? "conventional";
    }

    const recommendedEvaluation = programEvaluations.find((evaluation) => evaluation.program === recommendedProgram)
      ?? programEvaluations[0];

    const recommendationTitle = `${PROGRAM_LABELS[recommendedProgram]} recommended`;
    const recommendationReason = getRecommendationReason({
      program: recommendedProgram,
      jumboRequired,
      ficoScore: ficoWhole,
      downPaymentPercent,
      isVeteranEligible: isVeteranEligible === "yes",
    });

    const conditionFlags = uniqueStrings([
      ...recommendedEvaluation.hardStops,
      ...recommendedEvaluation.softFlags,
      ...(qualifyingIncome <= 0 ? ["Income is insufficient or missing for DTI qualification."] : []),
      ...(qualifyingIncome > 0 && backEndDti > PROGRAM_RULES[recommendedProgram].maxDti
        ? ["Income may be insufficient for the requested housing and debt load."]
        : []),
      ...(loanAmount <= 0 ? ["Loan amount is zero. Increase property value or reduce down payment entry."] : []),
      ...(jumboRequired && reservesMonths < 6 ? ["Reserves may be insufficient for jumbo underwriting."] : []),
    ]);

    const documentChecklist = uniqueStrings([
      "Government-issued photo ID",
      "Most recent 30 days of pay stubs or income proof",
      "Most recent 2 years of W-2s / income statements",
      "Most recent 2 months of asset/bank statements",
      "Authorization for full credit review and underwriting disclosures",
      ...(employmentType === "self-employed" ? ["Most recent 2 years of personal and business tax returns"] : []),
      ...(monthlyRentalIncome > 0 ? ["Lease agreement and rental income history documentation"] : []),
      ...(jumboRequired ? ["Reserve asset statements covering jumbo reserve requirement"] : []),
    ]);

    const underwritingConditions = uniqueStrings([
      "Borrower may need to provide tax certification for property.",
      "Borrower may need to provide explanation for large bank deposits.",
      ...(monthlyRentalIncome > 0 ? ["Rental income must be verified with lease agreement."] : []),
      ...(backEndDti > PROGRAM_RULES[recommendedProgram].maxDti ? ["Compensating factors may be required due to elevated DTI."] : []),
      ...(jumboRequired ? ["Additional reserve verification may be required for jumbo review."] : []),
      "Final verification of employment and credit profile will be completed before final underwriting decision.",
    ]);

    return {
      recommendationTitle,
      recommendationReason,
      recommendedProgram,
      riskLevel: getRiskLevel(recommendedEvaluation, qualifyingIncome > 0),
      monthlyHousingPayment,
      monthlyPrincipalInterest,
      frontEndDti,
      backEndDti,
      loanAmount,
      downPaymentPercent,
      reservesMonths,
      conditionFlags,
      documentChecklist,
      underwritingConditions,
      programEvaluations,
    };
  }, [
    backEndDti,
    downPaymentPercent,
    employmentType,
    ficoWhole,
    frontEndDti,
    isVeteranEligible,
    jumboRequired,
    loanAmount,
    monthlyHousingPayment,
    monthlyPrincipalInterest,
    monthlyRentalIncome,
    qualifyingIncome,
    reservesMonths,
  ]);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <main className="py-10 md:py-14">
        <div className="container mx-auto max-w-7xl px-4 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">
              MORTGAGE SCENARIO CHECKER - PRE-DECISION UNDERWRITER
            </h1>
            <p className="text-slate-600">
              Simplified borrower-facing underwriting analysis for Conventional, FHA, VA, and Jumbo scenarios.
            </p>
            <Card className="p-4 border-amber-200 bg-amber-50">
              <p className="text-sm text-amber-900">
                This tool provides an estimate for educational and pre-qualification purposes only. Results are not a loan approval and are subject to full underwriting, documentation verification, credit review, property review, and lender guidelines.
              </p>
            </Card>
          </div>

          <Card className="p-4 border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {WORKFLOW_STEPS.map((step, index) => (
                <Fragment key={step}>
                  <div className="min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{`Step ${index + 1}`}</p>
                    <p className="text-sm text-slate-800 mt-1">{step.replace(`Step ${index + 1} `, "")}</p>
                  </div>
                  {index < WORKFLOW_STEPS.length - 1 ? <div className="h-px min-w-8 flex-1 bg-slate-300" /> : null}
                </Fragment>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-5 border-slate-200 bg-white space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Step 1 Borrower Profile</h2>
              <div className="space-y-2">
                <Label htmlFor="fico-score">Credit Score (FICO)</Label>
                <Input
                  id="fico-score"
                  type="number"
                  value={ficoScore}
                  min={300}
                  max={850}
                  step={1}
                  onChange={(event) => setFicoScore(toNonNegativeNumber(Number(event.target.value)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment-type">Employment Type</Label>
                <Select value={employmentType} onValueChange={(value) => setEmploymentType(value as EmploymentType)}>
                  <SelectTrigger id="employment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="w2">W-2 / Salaried</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="retired">Retired / Fixed Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="va-eligible">VA Eligibility</Label>
                <Select value={isVeteranEligible} onValueChange={setIsVeteranEligible}>
                  <SelectTrigger id="va-eligible">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Eligible</SelectItem>
                    <SelectItem value="no">Not Eligible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental-income">Monthly Rental Income (Optional)</Label>
                <Input
                  id="rental-income"
                  type="number"
                  value={monthlyRentalIncome}
                  min={0}
                  step={50}
                  onChange={(event) => setMonthlyRentalIncome(toNonNegativeNumber(Number(event.target.value)))}
                />
                <p className="text-xs text-slate-500">Underwriting estimate uses 75% of entered rental income.</p>
              </div>
            </Card>

            <Card className="p-5 border-slate-200 bg-white space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Step 2 Loan Scenario</h2>
              <div className="space-y-2">
                <Label htmlFor="property-value">Property Value</Label>
                <Input
                  id="property-value"
                  type="number"
                  value={propertyValue}
                  min={0}
                  step={1000}
                  onChange={(event) => setPropertyValue(toNonNegativeNumber(Number(event.target.value)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="down-payment">Down Payment</Label>
                <Input
                  id="down-payment"
                  type="number"
                  value={downPaymentAmount}
                  min={0}
                  step={1000}
                  onChange={(event) => setDownPaymentAmount(toNonNegativeNumber(Number(event.target.value)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan-amount-readonly">Estimated Loan Amount</Label>
                <Input id="loan-amount-readonly" readOnly value={formatCurrency(analysis.loanAmount)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                  <Input id="interest-rate" type="number" value={interestRate} min={0} max={100} step={0.01} onChange={(event) => setInterestRate(toNonNegativeNumber(Number(event.target.value)))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan-term-years">Loan Term (Years)</Label>
                  <Input id="loan-term-years" type="number" value={loanTermYears} min={1} max={50} step={1} onChange={(event) => setLoanTermYears(toPositiveInt(Number(event.target.value), 1))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conforming-limit">Conforming Loan Limit</Label>
                <Input id="conforming-limit" type="number" value={conformingLoanLimit} min={0} step={1000} onChange={(event) => setConformingLoanLimit(toNonNegativeNumber(Number(event.target.value)))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="annual-property-tax">Annual Property Tax</Label>
                  <Input id="annual-property-tax" type="number" value={annualPropertyTax} min={0} step={100} onChange={(event) => setAnnualPropertyTax(toNonNegativeNumber(Number(event.target.value)))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual-insurance">Annual Home Insurance</Label>
                  <Input id="annual-insurance" type="number" value={annualHomeInsurance} min={0} step={100} onChange={(event) => setAnnualHomeInsurance(toNonNegativeNumber(Number(event.target.value)))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="hoa-monthly">HOA (Monthly)</Label>
                  <Input id="hoa-monthly" type="number" value={monthlyHoa} min={0} step={25} onChange={(event) => setMonthlyHoa(toNonNegativeNumber(Number(event.target.value)))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mi-monthly">MI / MIP (Monthly)</Label>
                  <Input id="mi-monthly" type="number" value={monthlyMi} min={0} step={25} onChange={(event) => setMonthlyMi(toNonNegativeNumber(Number(event.target.value)))} />
                </div>
              </div>
            </Card>

            <Card className="p-5 border-slate-200 bg-white space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Step 3 Financial Profile</h2>
              <div className="space-y-2">
                <Label htmlFor="monthly-income">Gross Monthly Income</Label>
                <Input
                  id="monthly-income"
                  type="number"
                  value={monthlyIncome}
                  min={0}
                  step={100}
                  onChange={(event) => setMonthlyIncome(toNonNegativeNumber(Number(event.target.value)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly-debt">Existing Monthly Debts (excluding new mortgage)</Label>
                <Input
                  id="monthly-debt"
                  type="number"
                  value={monthlyDebt}
                  min={0}
                  step={50}
                  onChange={(event) => setMonthlyDebt(toNonNegativeNumber(Number(event.target.value)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reserves">Liquid Reserves Available</Label>
                <Input
                  id="reserves"
                  type="number"
                  value={liquidReserves}
                  min={0}
                  step={500}
                  onChange={(event) => setLiquidReserves(toNonNegativeNumber(Number(event.target.value)))}
                />
              </div>

              <Card className="p-4 border-slate-200 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Quick Financial Snapshot</h3>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Monthly Housing Payment: {formatCurrency(analysis.monthlyHousingPayment)}</p>
                  <p>Front-end DTI: {formatPercent(analysis.frontEndDti, 1)}</p>
                  <p>Back-end DTI: {formatPercent(analysis.backEndDti, 1)}</p>
                  <p>Reserves: {analysis.reservesMonths.toFixed(1)} months</p>
                </div>
              </Card>
            </Card>
          </div>

          <Card className="p-5 border-slate-200 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Step 4 Underwriting Analysis</p>
                <h2 className="text-xl font-semibold text-slate-900 mt-1">{analysis.recommendationTitle}</h2>
                <p className="text-sm text-slate-600 mt-1">{analysis.recommendationReason}</p>
              </div>
              <Badge className={`border ${getRiskBadgeClasses(analysis.riskLevel)}`}>
                {analysis.riskLevel === "green" ? "Green - Preliminary Fit" : analysis.riskLevel === "yellow" ? "Yellow - Needs Review" : "Red - High Risk"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="p-3 border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500">Recommended Program</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{PROGRAM_LABELS[analysis.recommendedProgram]}</p>
              </Card>
              <Card className="p-3 border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500">Loan Amount</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{formatCurrency(analysis.loanAmount)}</p>
              </Card>
              <Card className="p-3 border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500">Down Payment</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{formatPercent(analysis.downPaymentPercent, 1)}</p>
              </Card>
              <Card className="p-3 border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500">DTI (Back-end)</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{formatPercent(analysis.backEndDti, 1)}</p>
              </Card>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Condition Flags</h3>
              {analysis.conditionFlags.length === 0 ? (
                <p className="text-sm text-emerald-700">No major guideline flags detected in this estimate.</p>
              ) : (
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                  {analysis.conditionFlags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              )}
            </div>

            <Card className="p-4 border-slate-200 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Program Fit Snapshot</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {analysis.programEvaluations.map((evaluation) => (
                  <div key={evaluation.program} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="font-semibold text-slate-900">{PROGRAM_LABELS[evaluation.program]}</p>
                    <p className="text-slate-600 mt-1">{evaluation.eligible ? "Estimated fit available" : "Guideline conflict detected"}</p>
                  </div>
                ))}
              </div>
            </Card>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5 border-slate-200 bg-white space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Step 5 Document Checklist</p>
              <h2 className="text-lg font-semibold text-slate-900">Required Documentation (Estimate)</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {analysis.documentChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 border-slate-200 bg-white space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Possible Underwriting Conditions</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {analysis.underwritingConditions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-4 border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-600">
              Compliance note: This tool intentionally does not request Social Security Number or full Date of Birth.
              Final lender decisions require full application data, disclosures, and verified underwriting documentation.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
