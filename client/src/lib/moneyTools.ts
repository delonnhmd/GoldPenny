import type { DeductionDefinition, FilingStatus, TaxBracket, TaxYearConfig } from "@/lib/taxRules";

export type NamedAmountMap = Record<string, number>;

export type ContributionFrequency = "weekly" | "biweekly" | "monthly" | "yearly";
export type CompoundingFrequency = "daily" | "monthly" | "quarterly" | "annually";
export type CashFlowHealth = "Deficit" | "Tight" | "Stable" | "Strong Surplus";
export type DeductionMode = "standard" | "itemized" | "compare";
export type RetirementStatus = "Off track" | "Needs attention" | "On track" | "Ahead";
export type DebtStrategy = "minimum" | "snowball" | "avalanche" | "custom";

export interface NetWorthResult {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  debtToAssetRatio: number;
  liquidAssets: number;
  interpretation: string;
}

export interface CashFlowResult {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  netCashFlow: number;
  savingsRate: number;
  expenseRatio: number;
  budgetHealth: CashFlowHealth;
  topExpenseCategories: Array<{ key: string; value: number }>;
  recommendations: string[];
}

export interface CompoundInput {
  principal: number;
  recurringContribution: number;
  contributionFrequency: ContributionFrequency;
  annualReturnRate: number;
  compoundingFrequency: CompoundingFrequency;
  years: number;
  annualContributionIncreaseRate: number;
  inflationRate: number;
  taxDragRate: number;
  startDate: string;
}

export interface CompoundYearRow {
  year: number;
  dateLabel: string;
  contributionsCumulative: number;
  growthCumulative: number;
  endingBalance: number;
}

export interface CompoundResult {
  endingBalance: number;
  totalContributions: number;
  totalGrowth: number;
  inflationAdjustedEndingBalance: number;
  effectiveAnnualGrowthRate: number;
  schedule: CompoundYearRow[];
  startNowVsLater: {
    nowEndingBalance: number;
    laterEndingBalance: number;
    delayYears: number;
    difference: number;
  };
  sensitivityTable: Array<{ monthlyContribution: number; endingBalance: number }>;
}

export interface TaxDeductionState {
  enabled: boolean;
  amount: number;
}

export interface TaxEstimatorInput {
  taxYear: number;
  filingStatus: FilingStatus;
  age: number;
  over65: boolean;
  blind: boolean;
  stateCode: string;
  dependents: number;
  isSelfEmployedPath: boolean;
  isMilitaryMove: boolean;
  income: {
    w2Wages: number;
    selfEmploymentIncome: number;
    businessIncome: number;
    interestIncome: number;
    qualifiedDividends: number;
    ordinaryDividends: number;
    capitalGains: number;
    rentalIncome: number;
    retirementIncome: number;
    socialSecurityIncome: number;
    unemploymentIncome: number;
    otherTaxableIncome: number;
  };
  deductionMode: DeductionMode;
  adjustmentDeductions: Record<string, TaxDeductionState>;
  itemizedDeductions: Record<string, TaxDeductionState>;
  businessDeductions: Record<string, TaxDeductionState>;
  credits: {
    childTaxCredit: number;
    childDependentCareCredit: number;
    educationCredits: number;
    evCredit: number;
    saversCredit: number;
    otherNonrefundableCredits: number;
    refundableCredits: number;
    earnedIncomeCredit: number;
    additionalChildTaxCredit: number;
    americanOpportunityCredit: number;
    lifetimeLearningCredit: number;
    premiumTaxCredit: number;
    otherRefundableCredits: number;
  };
  payments: {
    federalWithholding: number;
    stateWithholding: number;
    additionalWithholding: number;
    estimatedQuarterlyPayments: number;
    priorYearOverpaymentApplied: number;
  };
}

export interface TaxEstimatorResult {
  grossIncome: number;
  netBusinessIncome: number;
  totalBusinessDeductions: number;
  totalAdjustments: number;
  adjustedGrossIncome: number;
  standardDeduction: number;
  itemizedDeduction: number;
  deductionUsed: number;
  deductionMethodUsed: "Standard Deduction" | "Itemized Deduction";
  taxableIncome: number;
  federalIncomeTax: number;
  selfEmploymentTax: number;
  stateTaxEstimate: number;
  taxBeforeCredits: number;
  nonrefundableCreditsInput: number;
  nonrefundableCreditsApplied: number;
  refundableCreditsTotal: number;
  totalCreditsDisplayed: number;
  totalEstimatedTaxLiability: number;
  totalPayments: number;
  estimatedRefund: number;
  estimatedAmountOwed: number;
  marginalRate: number;
  effectiveRate: number;
  quarterlyEstimatedPaymentSuggestion: number;
  assumptions: string[];
  warnings: string[];
  deductionBreakdown: Array<{ label: string; value: number }>;
  incomeBreakdown: Array<{ label: string; value: number }>;
}

export interface RetirementInput {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentRetirementSavings: number;
  currentAnnualIncome: number;
  currentAnnualContribution: number;
  employerMatchPercent: number;
  expectedAnnualReturnPreRetirement: number;
  expectedAnnualReturnInRetirement: number;
  expectedSalaryGrowth: number;
  inflationRate: number;
  replacementRatio: number;
  expectedSocialSecurityAnnual: number;
  pensionAnnual: number;
  otherRetirementIncomeAnnual: number;
  withdrawalRate: number;
  oneTimeRetirementExpense: number;
  lifestyle: "basic" | "moderate" | "comfortable" | "high";
  scenario: "conservative" | "base" | "aggressive";
}

export interface RetirementYearRow {
  age: number;
  yearIndex: number;
  annualContribution: number;
  endingBalance: number;
}

export interface RetirementResult {
  yearsToRetirement: number;
  estimatedSavingsAtRetirement: number;
  annualIncomeTargetAtRetirement: number;
  guaranteedIncome: number;
  annualWithdrawalEstimate: number;
  annualIncomeGapOrSurplus: number;
  recommendedAdditionalMonthlyContribution: number;
  readinessScore: number;
  readinessStatus: RetirementStatus;
  sustainableMonthlyIncomeEstimate: number;
  confidenceProbability: number;
  accumulationSchedule: RetirementYearRow[];
}

export interface DebtInput {
  id: string;
  name: string;
  balance: number;
  annualRate: number;
  minimumPayment: number;
  priority: number;
  dueDate?: string;
}

export interface DebtMonthRow {
  monthIndex: number;
  totalBalance: number;
  totalInterestPaidToDate: number;
}

export interface DebtPayoffResult {
  strategy: DebtStrategy;
  monthsToDebtFree: number;
  totalInterestPaid: number;
  totalPaid: number;
  debtFreeDate: string;
  payoffOrder: string[];
  payoffMonthByDebt: Record<string, number>;
  negativeAmortizationDebts: string[];
  schedule: DebtMonthRow[];
}

export interface DebtComparisonResult {
  minimum: DebtPayoffResult;
  snowball: DebtPayoffResult;
  avalanche: DebtPayoffResult;
  selected: DebtPayoffResult;
  monthsSavedVsMinimum: number;
  interestSavedVsMinimum: number;
}

const EPSILON = 1e-8;

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function boundedPercent(value: number): number {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function sumNamedAmounts(values: NamedAmountMap): number {
  return Object.values(values).reduce((sum, current) => sum + nonNegative(current), 0);
}

export function calculateNetWorth(assets: NamedAmountMap, liabilities: NamedAmountMap): NetWorthResult {
  const totalAssets = sumNamedAmounts(assets);
  const totalLiabilities = sumNamedAmounts(liabilities);
  const netWorth = totalAssets - totalLiabilities;
  const debtToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
  const liquidAssets =
    nonNegative(assets["cash-on-hand"]) +
    nonNegative(assets["checking"]) +
    nonNegative(assets["savings"]) +
    nonNegative(assets["emergency-fund"]) +
    nonNegative(assets["brokerage-investments"]);

  let interpretation = "Growing net worth";
  if (netWorth < 0) {
    interpretation = "Negative net worth";
  } else if (netWorth < 25000) {
    interpretation = "Low positive net worth";
  } else if (liquidAssets >= totalLiabilities * 0.4) {
    interpretation = "Strong liquidity position";
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    debtToAssetRatio,
    liquidAssets,
    interpretation,
  };
}

export function calculateCashFlow(
  income: NamedAmountMap,
  fixedExpenses: NamedAmountMap,
  variableExpenses: NamedAmountMap,
  savings: NamedAmountMap,
): CashFlowResult {
  const totalIncome = sumNamedAmounts(income);
  const totalExpenses = sumNamedAmounts(fixedExpenses) + sumNamedAmounts(variableExpenses);
  const totalSavings = sumNamedAmounts(savings);
  const netCashFlow = totalIncome - totalExpenses - totalSavings;
  const savingsRate = totalIncome > 0 ? totalSavings / totalIncome : 0;
  const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 0;

  const expenseBuckets: Array<{ key: string; value: number }> = [
    ...Object.entries(fixedExpenses).map(([key, value]) => ({ key, value: nonNegative(value) })),
    ...Object.entries(variableExpenses).map(([key, value]) => ({ key, value: nonNegative(value) })),
  ];
  expenseBuckets.sort((a, b) => b.value - a.value);
  const topExpenseCategories = expenseBuckets.slice(0, 3);

  let budgetHealth: CashFlowHealth = "Stable";
  if (netCashFlow < 0) {
    budgetHealth = "Deficit";
  } else if (netCashFlow <= totalIncome * 0.05) {
    budgetHealth = "Tight";
  } else if (netCashFlow <= totalIncome * 0.2) {
    budgetHealth = "Stable";
  } else {
    budgetHealth = "Strong Surplus";
  }

  const recommendations: string[] = [];
  if (topExpenseCategories.length > 0) {
    recommendations.push(`Review top spending category: ${topExpenseCategories[0].key}.`);
  }
  if (savingsRate < 0.15 && totalIncome > 0) {
    recommendations.push("Increase savings rate toward at least 15% when possible.");
  }
  if (netCashFlow < 0) {
    recommendations.push("Current deficit appears unsustainable; reduce recurring expenses or increase income.");
  }
  if (nonNegative(fixedExpenses["subscriptions"]) > 0) {
    recommendations.push("Audit recurring subscriptions and cancel low-value services.");
  }

  return {
    totalIncome,
    totalExpenses,
    totalSavings,
    netCashFlow,
    savingsRate,
    expenseRatio,
    budgetHealth,
    topExpenseCategories,
    recommendations,
  };
}

function perYearFromContributionFrequency(frequency: ContributionFrequency): number {
  if (frequency === "weekly") return 52;
  if (frequency === "biweekly") return 26;
  if (frequency === "monthly") return 12;
  return 1;
}

function perYearFromCompoundingFrequency(frequency: CompoundingFrequency): number {
  if (frequency === "daily") return 365;
  if (frequency === "monthly") return 12;
  if (frequency === "quarterly") return 4;
  return 1;
}

function monthlyRateFromNominalAnnual(
  annualRatePercent: number,
  compoundingFrequency: CompoundingFrequency,
  taxDragPercent: number,
): number {
  const nominal = boundedPercent(annualRatePercent) / 100;
  const taxDrag = boundedPercent(taxDragPercent) / 100;
  const adjustedNominal = nominal * (1 - taxDrag);
  const periodsPerYear = perYearFromCompoundingFrequency(compoundingFrequency);
  const periodic = adjustedNominal / periodsPerYear;
  const annualEffective = Math.pow(1 + periodic, periodsPerYear) - 1;
  return Math.pow(1 + annualEffective, 1 / 12) - 1;
}

function dateLabelForYear(startDate: string, yearOffset: number): string {
  const safeDate = new Date(startDate || new Date().toISOString().slice(0, 10));
  if (Number.isNaN(safeDate.getTime())) {
    return `Year ${yearOffset + 1}`;
  }
  const yearDate = new Date(safeDate);
  yearDate.setFullYear(safeDate.getFullYear() + yearOffset);
  return yearDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function simulateCompound(
  input: CompoundInput,
  delayYears = 0,
  includeComparisons = true,
): CompoundResult {
  const years = Math.max(1, Math.round(nonNegative(input.years)));
  const months = years * 12;
  const monthlyRate = monthlyRateFromNominalAnnual(
    input.annualReturnRate,
    input.compoundingFrequency,
    input.taxDragRate,
  );
  const baseAnnualContribution =
    nonNegative(input.recurringContribution) * perYearFromContributionFrequency(input.contributionFrequency);

  let balance = nonNegative(input.principal);
  let contributions = nonNegative(input.principal);
  const schedule: CompoundYearRow[] = [];

  for (let month = 1; month <= months; month += 1) {
    const currentYearIndex = Math.ceil(month / 12);
    const increaseFactor = Math.pow(
      1 + boundedPercent(input.annualContributionIncreaseRate) / 100,
      Math.max(0, currentYearIndex - 1),
    );
    const annualContributionThisYear = baseAnnualContribution * increaseFactor;
    const monthlyContribution = currentYearIndex <= delayYears ? 0 : annualContributionThisYear / 12;

    balance += monthlyContribution;
    contributions += monthlyContribution;
    balance *= 1 + monthlyRate;

    if (month % 12 === 0) {
      const growth = balance - contributions;
      schedule.push({
        year: currentYearIndex,
        dateLabel: dateLabelForYear(input.startDate, currentYearIndex - 1),
        contributionsCumulative: contributions,
        growthCumulative: growth,
        endingBalance: balance,
      });
    }
  }

  const totalGrowth = balance - contributions;
  const inflationFactor = Math.pow(1 + boundedPercent(input.inflationRate) / 100, years);
  const inflationAdjustedEndingBalance = inflationFactor > 0 ? balance / inflationFactor : balance;
  const effectiveAnnualGrowthRate =
    contributions > 0
      ? Math.pow(Math.max(balance, EPSILON) / Math.max(contributions, EPSILON), 1 / years) - 1
      : boundedPercent(input.annualReturnRate) / 100;

  const delayed =
    includeComparisons && delayYears > 0
      ? simulateCompound({ ...input, principal: nonNegative(input.principal) }, 0, false)
      : null;
  const laterScenario =
    includeComparisons && delayYears > 0
      ? simulateCompound(input, delayYears, false)
      : null;

  const sensitivityIncrements = [0, 100, 250, 500];
  const sensitivityTable = includeComparisons
    ? sensitivityIncrements.map((increment) => {
        const monthlyContributionBase =
          input.contributionFrequency === "monthly"
            ? nonNegative(input.recurringContribution)
            : (nonNegative(input.recurringContribution) *
                perYearFromContributionFrequency(input.contributionFrequency)) /
              12;
        const adjusted = monthlyContributionBase + increment;
        const result = simulateCompound(
          {
            ...input,
            recurringContribution: adjusted,
            contributionFrequency: "monthly",
          },
          0,
          false,
        );
        return {
          monthlyContribution: adjusted,
          endingBalance: result.endingBalance,
        };
      })
    : [];

  return {
    endingBalance: balance,
    totalContributions: contributions,
    totalGrowth,
    inflationAdjustedEndingBalance,
    effectiveAnnualGrowthRate,
    schedule,
    startNowVsLater: {
      nowEndingBalance: delayed ? delayed.endingBalance : balance,
      laterEndingBalance: laterScenario ? laterScenario.endingBalance : balance,
      delayYears,
      difference: delayed && laterScenario ? delayed.endingBalance - laterScenario.endingBalance : 0,
    },
    sensitivityTable,
  };
}

export function calculateCompoundGrowth(input: CompoundInput): CompoundResult {
  return simulateCompound(input, 3);
}

export function calculateProgressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  const income = nonNegative(taxableIncome);
  let remaining = income;
  let previousCap = 0;
  let tax = 0;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const cap = bracket.upTo;
    const taxableAtRate = cap === null ? remaining : Math.min(remaining, Math.max(0, cap - previousCap));
    tax += taxableAtRate * bracket.rate;
    remaining -= taxableAtRate;
    if (cap !== null) {
      previousCap = cap;
    }
  }

  return tax;
}

function marginalRateForIncome(taxableIncome: number, brackets: TaxBracket[]): number {
  const income = nonNegative(taxableIncome);
  for (const bracket of brackets) {
    if (bracket.upTo === null || income <= bracket.upTo) {
      return bracket.rate;
    }
  }
  return brackets[brackets.length - 1]?.rate ?? 0;
}

function sumSelectedDeductionAmounts(state: Record<string, TaxDeductionState>): number {
  return Object.values(state).reduce((sum, current) => {
    if (!current?.enabled) return sum;
    return sum + nonNegative(current.amount);
  }, 0);
}

function getDeductionAmount(state: Record<string, TaxDeductionState>, id: string): number {
  const entry = state[id];
  if (!entry || !entry.enabled) return 0;
  return nonNegative(entry.amount);
}

function capDeductionByRule(
  deductionId: string,
  amount: number,
  input: TaxEstimatorInput,
  taxConfig: TaxYearConfig,
  selfEmploymentHalfDeduction: number,
): number {
  const value = nonNegative(amount);

  if (deductionId === "student-loan-interest") {
    return Math.min(value, taxConfig.limits.studentLoanInterestCap);
  }
  if (deductionId === "educator-expenses") {
    return Math.min(value, taxConfig.limits.educatorExpenseCap);
  }
  if (deductionId === "traditional-ira") {
    return Math.min(value, taxConfig.limits.iraContributionCap);
  }
  if (deductionId === "hsa-contributions") {
    const hsaCap =
      input.filingStatus === "married-filing-jointly"
        ? taxConfig.limits.hsaContributionCapFamily
        : taxConfig.limits.hsaContributionCapSingle;
    return Math.min(value, hsaCap);
  }
  if (deductionId === "moving-expenses" && taxConfig.limits.movingExpenseMilitaryOnly && !input.isMilitaryMove) {
    return 0;
  }
  if (deductionId === "half-se-tax") {
    return selfEmploymentHalfDeduction;
  }

  return value;
}

function classifyDeductionBuckets(
  itemized: Record<string, TaxDeductionState>,
  adjustedGrossIncome: number,
  saltCap: number,
): {
  totalItemizedDeduction: number;
  medicalDeductible: number;
  taxesDeductible: number;
  homeAndInterest: number;
  charity: number;
  other: number;
} {
  const medicalIds = [
    "medical-expenses-paid",
    "dental-expenses",
    "vision-expenses",
    "prescription-expenses",
    "medical-travel-mileage",
    "ltc-premiums",
    "other-qualified-medical",
  ];
  const taxIds = [
    "state-income-taxes-paid",
    "state-sales-tax-paid",
    "real-estate-property-tax",
    "personal-property-tax",
    "other-deductible-taxes",
  ];
  const homeIds = [
    "mortgage-interest",
    "mortgage-points",
    "mortgage-insurance-premiums",
    "investment-interest-expense",
  ];
  const charityIds = [
    "cash-donations",
    "non-cash-donations",
    "charitable-mileage",
    "charitable-carryover",
    "other-charitable-giving",
  ];

  const medicalTotal = medicalIds.reduce((sum, id) => sum + getDeductionAmount(itemized, id), 0);
  const medicalFloor = nonNegative(adjustedGrossIncome) * 0.075;
  const medicalDeductible = Math.max(0, medicalTotal - medicalFloor);

  const taxesRaw = taxIds.reduce((sum, id) => sum + getDeductionAmount(itemized, id), 0);
  const taxesDeductible = Math.min(taxesRaw, nonNegative(saltCap));

  const homeAndInterest = homeIds.reduce((sum, id) => sum + getDeductionAmount(itemized, id), 0);
  const charity = charityIds.reduce((sum, id) => sum + getDeductionAmount(itemized, id), 0);

  const otherIds = Object.keys(itemized).filter(
    (id) => !medicalIds.includes(id) && !taxIds.includes(id) && !homeIds.includes(id) && !charityIds.includes(id),
  );
  const other = otherIds.reduce((sum, id) => sum + getDeductionAmount(itemized, id), 0);

  return {
    totalItemizedDeduction: medicalDeductible + taxesDeductible + homeAndInterest + charity + other,
    medicalDeductible,
    taxesDeductible,
    homeAndInterest,
    charity,
    other,
  };
}

function getStateTaxRate(stateCode: string, config: TaxYearConfig): number {
  const normalized = stateCode.trim().toUpperCase();
  return config.simplifiedStateRates[normalized] ?? 0.04;
}

export function calculateTaxEstimate(
  input: TaxEstimatorInput,
  taxConfig: TaxYearConfig,
  definitions: {
    adjustmentDefinitions: DeductionDefinition[];
    itemizedDefinitions: DeductionDefinition[];
    businessDefinitions: DeductionDefinition[];
  },
): TaxEstimatorResult {
  const wageIncome = nonNegative(input.income.w2Wages);
  const grossSelfEmploymentIncome =
    nonNegative(input.income.selfEmploymentIncome) + nonNegative(input.income.businessIncome);
  const totalBusinessDeductions = sumSelectedDeductionAmounts(input.businessDeductions);
  const netBusinessIncome = Math.max(0, grossSelfEmploymentIncome - totalBusinessDeductions);

  const seTaxableEarnings = netBusinessIncome * taxConfig.selfEmployment.netEarningsFactor;
  const socialSecurityTaxable = Math.min(seTaxableEarnings, taxConfig.selfEmployment.socialSecurityWageBase);
  const selfEmploymentTax =
    input.isSelfEmployedPath || grossSelfEmploymentIncome > 0
      ? socialSecurityTaxable * taxConfig.selfEmployment.socialSecurityRate +
        seTaxableEarnings * taxConfig.selfEmployment.medicareRate
      : 0;
  const selfEmploymentHalfDeduction = selfEmploymentTax * taxConfig.selfEmployment.deductibleHalfRate;

  const taxableSocialSecurity = nonNegative(input.income.socialSecurityIncome) * 0.85;

  const grossIncome =
    wageIncome +
    netBusinessIncome +
    nonNegative(input.income.interestIncome) +
    nonNegative(input.income.qualifiedDividends) +
    nonNegative(input.income.ordinaryDividends) +
    nonNegative(input.income.capitalGains) +
    nonNegative(input.income.rentalIncome) +
    nonNegative(input.income.retirementIncome) +
    taxableSocialSecurity +
    nonNegative(input.income.unemploymentIncome) +
    nonNegative(input.income.otherTaxableIncome);

  const totalAdjustments = definitions.adjustmentDefinitions.reduce((sum, definition) => {
    const raw = getDeductionAmount(input.adjustmentDeductions, definition.id);
    const capped = capDeductionByRule(definition.id, raw, input, taxConfig, selfEmploymentHalfDeduction);
    return sum + capped;
  }, 0);

  const adjustedGrossIncome = Math.max(0, grossIncome - totalAdjustments);

  const itemizedBuckets = classifyDeductionBuckets(
    input.itemizedDeductions,
    adjustedGrossIncome,
    taxConfig.limits.saltCap,
  );
  const itemizedDeduction = itemizedBuckets.totalItemizedDeduction;

  const extraStandard =
    (input.over65 ? taxConfig.additionalStandardDeduction.age65OrBlind[input.filingStatus] : 0) +
    (input.blind ? taxConfig.additionalStandardDeduction.age65OrBlind[input.filingStatus] : 0);
  const standardDeduction = nonNegative(taxConfig.standardDeduction[input.filingStatus]) + extraStandard;

  const useItemized =
    input.deductionMode === "itemized" ||
    (input.deductionMode === "compare" && itemizedDeduction > standardDeduction);
  const deductionUsed = useItemized ? itemizedDeduction : standardDeduction;
  const deductionMethodUsed = useItemized ? "Itemized Deduction" : "Standard Deduction";

  const taxableIncome = Math.max(0, adjustedGrossIncome - deductionUsed);
  const brackets = taxConfig.brackets[input.filingStatus];
  const federalIncomeTax = calculateProgressiveTax(taxableIncome, brackets);
  const stateTaxRate = getStateTaxRate(input.stateCode, taxConfig);
  const stateTaxEstimate = taxableIncome * stateTaxRate;
  const taxBeforeCredits = federalIncomeTax + selfEmploymentTax + stateTaxEstimate;

  const nonrefundableCreditsInput =
    nonNegative(input.credits.childTaxCredit) +
    nonNegative(input.credits.childDependentCareCredit) +
    nonNegative(input.credits.educationCredits) +
    nonNegative(input.credits.evCredit) +
    nonNegative(input.credits.saversCredit) +
    nonNegative(input.credits.americanOpportunityCredit) +
    nonNegative(input.credits.lifetimeLearningCredit) +
    nonNegative(input.credits.otherNonrefundableCredits);
  const nonrefundableCreditsApplied = Math.min(nonrefundableCreditsInput, federalIncomeTax + stateTaxEstimate);

  const refundableCreditsTotal =
    nonNegative(input.credits.refundableCredits) +
    nonNegative(input.credits.earnedIncomeCredit) +
    nonNegative(input.credits.additionalChildTaxCredit) +
    nonNegative(input.credits.premiumTaxCredit) +
    nonNegative(input.credits.otherRefundableCredits);
  const totalCreditsDisplayed = nonrefundableCreditsApplied + refundableCreditsTotal;

  const totalEstimatedTaxLiability = Math.max(0, taxBeforeCredits - nonrefundableCreditsApplied);

  const totalPayments =
    nonNegative(input.payments.federalWithholding) +
    nonNegative(input.payments.stateWithholding) +
    nonNegative(input.payments.additionalWithholding) +
    nonNegative(input.payments.estimatedQuarterlyPayments) +
    nonNegative(input.payments.priorYearOverpaymentApplied);

  const netOutcome = totalPayments + refundableCreditsTotal - totalEstimatedTaxLiability;
  const estimatedRefund = Math.max(0, netOutcome);
  const estimatedAmountOwed = Math.max(0, -netOutcome);

  const marginalRate = marginalRateForIncome(taxableIncome, brackets);
  const effectiveRate = grossIncome > 0 ? totalEstimatedTaxLiability / grossIncome : 0;
  const quarterlyEstimatedPaymentSuggestion =
    input.isSelfEmployedPath || grossSelfEmploymentIncome > 0
      ? Math.max(0, totalEstimatedTaxLiability - nonNegative(input.payments.federalWithholding)) / 4
      : 0;

  const warnings: string[] = [];
  if (itemizedDeduction < standardDeduction && input.deductionMode !== "standard") {
    warnings.push("Itemized deductions are currently lower than the standard deduction.");
  }
  if (grossSelfEmploymentIncome > 0 && totalBusinessDeductions > grossSelfEmploymentIncome) {
    warnings.push("Business deductions exceed business income. Additional review may be required.");
  }
  if (nonNegative(input.income.selfEmploymentIncome) > 0 && input.payments.estimatedQuarterlyPayments <= 0) {
    warnings.push("Self-employed profiles often require estimated quarterly tax payments.");
  }
  if (stateTaxRate === 0.04) {
    warnings.push("State tax estimate is using a generic placeholder rate for planning purposes.");
  }

  const assumptions = [
    "Social Security income is simplified using a taxable estimate for planning.",
    "State tax logic is simplified and may differ from actual state filing rules.",
    "Credits, phaseouts, and eligibility are estimated and not full tax preparation logic.",
  ];

  const deductionBreakdown = [
    { label: "Standard deduction", value: standardDeduction },
    { label: "Itemized deduction", value: itemizedDeduction },
    { label: "Adjustments to income", value: totalAdjustments },
    { label: "Business deductions", value: totalBusinessDeductions },
  ];

  const investmentIncome =
    nonNegative(input.income.interestIncome) +
    nonNegative(input.income.qualifiedDividends) +
    nonNegative(input.income.ordinaryDividends) +
    nonNegative(input.income.capitalGains);

  const incomeBreakdown = [
    { label: "W-2 wages", value: wageIncome },
    { label: "Net business income", value: netBusinessIncome },
    { label: "Investment income", value: investmentIncome },
    { label: "Other income", value: grossIncome - wageIncome - netBusinessIncome - investmentIncome },
  ];

  return {
    grossIncome,
    netBusinessIncome,
    totalBusinessDeductions,
    totalAdjustments,
    adjustedGrossIncome,
    standardDeduction,
    itemizedDeduction,
    deductionUsed,
    deductionMethodUsed,
    taxableIncome,
    federalIncomeTax,
    selfEmploymentTax,
    stateTaxEstimate,
    taxBeforeCredits,
    nonrefundableCreditsInput,
    nonrefundableCreditsApplied,
    refundableCreditsTotal,
    totalCreditsDisplayed,
    totalEstimatedTaxLiability,
    totalPayments,
    estimatedRefund,
    estimatedAmountOwed,
    marginalRate,
    effectiveRate,
    quarterlyEstimatedPaymentSuggestion,
    assumptions,
    warnings,
    deductionBreakdown,
    incomeBreakdown,
  };
}

function scenarioMultiplier(scenario: RetirementInput["scenario"]): number {
  if (scenario === "conservative") return 0.85;
  if (scenario === "aggressive") return 1.15;
  return 1;
}

function lifestyleMultiplier(lifestyle: RetirementInput["lifestyle"]): number {
  if (lifestyle === "basic") return 0.8;
  if (lifestyle === "moderate") return 1;
  if (lifestyle === "comfortable") return 1.15;
  return 1.3;
}

function annuityFutureValueFactor(monthlyRate: number, months: number): number {
  if (Math.abs(monthlyRate) < EPSILON) {
    return months;
  }
  return (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
}

function randomNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function runMonteCarloRetirement(
  baseInput: RetirementInput,
  yearsToRetirement: number,
  requiredNestEgg: number,
  trials = 250,
): number {
  if (yearsToRetirement <= 0) {
    return baseInput.currentRetirementSavings >= requiredNestEgg ? 1 : 0;
  }

  const adjustedReturn =
    (boundedPercent(baseInput.expectedAnnualReturnPreRetirement) / 100) * scenarioMultiplier(baseInput.scenario);
  const annualContribution = nonNegative(baseInput.currentAnnualContribution);
  let successes = 0;

  for (let trial = 0; trial < trials; trial += 1) {
    let balance = nonNegative(baseInput.currentRetirementSavings);
    let salary = nonNegative(baseInput.currentAnnualIncome);
    for (let year = 0; year < yearsToRetirement; year += 1) {
      const simulatedReturn = adjustedReturn + randomNormal() * 0.1;
      const contribution =
        annualContribution * Math.pow(1 + boundedPercent(baseInput.expectedSalaryGrowth) / 100, year) +
        (salary * boundedPercent(baseInput.employerMatchPercent)) / 100;
      balance = (balance + contribution) * (1 + simulatedReturn);
      salary *= 1 + boundedPercent(baseInput.expectedSalaryGrowth) / 100;
    }
    if (balance >= requiredNestEgg) {
      successes += 1;
    }
  }

  return successes / trials;
}

export function calculateRetirementProjection(input: RetirementInput): RetirementResult {
  const yearsToRetirement = Math.max(0, Math.round(nonNegative(input.retirementAge - input.currentAge)));
  const adjustedReturnPre =
    (boundedPercent(input.expectedAnnualReturnPreRetirement) / 100) * scenarioMultiplier(input.scenario);
  const adjustedReturnRet =
    (boundedPercent(input.expectedAnnualReturnInRetirement) / 100) * scenarioMultiplier(input.scenario);
  const inflation = boundedPercent(input.inflationRate) / 100;
  const salaryGrowth = boundedPercent(input.expectedSalaryGrowth) / 100;
  const replacementRatio = boundedPercent(input.replacementRatio) / 100;
  const withdrawalRate = Math.max(0.02, boundedPercent(input.withdrawalRate) / 100);

  const accumulationSchedule: RetirementYearRow[] = [];
  let balance = nonNegative(input.currentRetirementSavings);
  let salary = nonNegative(input.currentAnnualIncome);

  for (let year = 1; year <= yearsToRetirement; year += 1) {
    const annualContribution =
      nonNegative(input.currentAnnualContribution) * Math.pow(1 + salaryGrowth, year - 1) +
      (salary * boundedPercent(input.employerMatchPercent)) / 100;
    balance = (balance + annualContribution) * (1 + adjustedReturnPre);
    salary *= 1 + salaryGrowth;

    accumulationSchedule.push({
      age: input.currentAge + year,
      yearIndex: year,
      annualContribution,
      endingBalance: balance,
    });
  }

  const inflationFactorToRetirement = Math.pow(1 + inflation, yearsToRetirement);
  const annualIncomeTargetAtRetirement =
    nonNegative(input.currentAnnualIncome) *
    replacementRatio *
    lifestyleMultiplier(input.lifestyle) *
    inflationFactorToRetirement;
  const guaranteedIncome =
    nonNegative(input.expectedSocialSecurityAnnual) +
    nonNegative(input.pensionAnnual) +
    nonNegative(input.otherRetirementIncomeAnnual);
  const annualWithdrawalEstimate = balance * withdrawalRate;
  const annualIncomeGapOrSurplus =
    guaranteedIncome +
    annualWithdrawalEstimate -
    annualIncomeTargetAtRetirement -
    nonNegative(input.oneTimeRetirementExpense) * 0.1;

  const requiredNestEgg =
    withdrawalRate > 0
      ? Math.max(
          0,
          (annualIncomeTargetAtRetirement - guaranteedIncome) / withdrawalRate +
            nonNegative(input.oneTimeRetirementExpense),
        )
      : 0;
  const shortfall = Math.max(0, requiredNestEgg - balance);

  const monthsToRetirement = Math.max(1, yearsToRetirement * 12);
  const monthlyRate = adjustedReturnPre / 12;
  const fvFactor = annuityFutureValueFactor(monthlyRate, monthsToRetirement);
  const recommendedAdditionalMonthlyContribution = fvFactor > 0 ? shortfall / fvFactor : 0;

  const fundingRatio = requiredNestEgg > 0 ? balance / requiredNestEgg : 1;
  const readinessScore = Math.max(0, Math.min(100, Math.round(fundingRatio * 100)));
  let readinessStatus: RetirementStatus = "On track";
  if (fundingRatio < 0.65) readinessStatus = "Off track";
  else if (fundingRatio < 0.9) readinessStatus = "Needs attention";
  else if (fundingRatio > 1.15) readinessStatus = "Ahead";

  const sustainableMonthlyIncomeEstimate = (balance * Math.max(0, adjustedReturnRet - inflation)) / 12 + guaranteedIncome / 12;
  const confidenceProbability = runMonteCarloRetirement(input, yearsToRetirement, requiredNestEgg, 200);

  return {
    yearsToRetirement,
    estimatedSavingsAtRetirement: balance,
    annualIncomeTargetAtRetirement,
    guaranteedIncome,
    annualWithdrawalEstimate,
    annualIncomeGapOrSurplus,
    recommendedAdditionalMonthlyContribution,
    readinessScore,
    readinessStatus,
    sustainableMonthlyIncomeEstimate,
    confidenceProbability,
    accumulationSchedule,
  };
}

function cloneDebts(debts: DebtInput[]): Array<DebtInput & { remainingBalance: number }> {
  return debts
    .filter((debt) => nonNegative(debt.balance) > 0)
    .map((debt) => ({
      ...debt,
      remainingBalance: nonNegative(debt.balance),
    }));
}

function orderDebtsForStrategy(debts: Array<DebtInput & { remainingBalance: number }>, strategy: DebtStrategy) {
  if (strategy === "snowball") {
    debts.sort((a, b) => a.remainingBalance - b.remainingBalance || b.annualRate - a.annualRate);
    return;
  }
  if (strategy === "avalanche") {
    debts.sort((a, b) => b.annualRate - a.annualRate || a.remainingBalance - b.remainingBalance);
    return;
  }
  if (strategy === "custom") {
    debts.sort((a, b) => a.priority - b.priority || b.annualRate - a.annualRate);
  }
}

function formatDebtFreeDate(startDate: string, months: number): string {
  const date = new Date(startDate || new Date().toISOString().slice(0, 10));
  if (Number.isNaN(date.getTime())) {
    return `${months} months`;
  }
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function calculateDebtPayoff(
  debts: DebtInput[],
  strategy: DebtStrategy,
  extraPayment: number,
  startDate: string,
): DebtPayoffResult {
  const debtPool = cloneDebts(debts);
  const extra = nonNegative(extraPayment);
  const schedule: DebtMonthRow[] = [];
  const negativeAmortizationDebts = new Set<string>();
  const payoffOrder: string[] = [];
  const payoffMonthByDebt: Record<string, number> = {};

  let month = 0;
  let totalInterestPaid = 0;
  let totalPaid = 0;

  while (debtPool.some((d) => d.remainingBalance > EPSILON) && month < 1200) {
    month += 1;

    for (const debt of debtPool) {
      if (debt.remainingBalance <= EPSILON) continue;
      const monthlyRate = boundedPercent(debt.annualRate) / 100 / 12;
      const interest = debt.remainingBalance * monthlyRate;
      debt.remainingBalance += interest;
      totalInterestPaid += interest;

      const minimumPayment = nonNegative(debt.minimumPayment);
      if (minimumPayment <= interest + 0.01) {
        negativeAmortizationDebts.add(debt.name);
      }

      const basePayment = Math.min(debt.remainingBalance, minimumPayment);
      debt.remainingBalance -= basePayment;
      totalPaid += basePayment;
    }

    if (strategy !== "minimum" && extra > 0) {
      let remainingExtra = extra;
      while (remainingExtra > EPSILON) {
        const openDebts = debtPool.filter((debt) => debt.remainingBalance > EPSILON);
        if (openDebts.length === 0) break;
        orderDebtsForStrategy(openDebts, strategy);
        const target = openDebts[0];
        const payment = Math.min(target.remainingBalance, remainingExtra);
        target.remainingBalance -= payment;
        totalPaid += payment;
        remainingExtra -= payment;
      }
    }

    for (const debt of debtPool) {
      if (debt.remainingBalance <= EPSILON && !payoffOrder.includes(debt.name)) {
        payoffOrder.push(debt.name);
        payoffMonthByDebt[debt.name] = month;
      }
      if (debt.remainingBalance < EPSILON) {
        debt.remainingBalance = 0;
      }
    }

    const totalBalance = debtPool.reduce((sum, debt) => sum + debt.remainingBalance, 0);
    schedule.push({
      monthIndex: month,
      totalBalance,
      totalInterestPaidToDate: totalInterestPaid,
    });
  }

  return {
    strategy,
    monthsToDebtFree: month,
    totalInterestPaid,
    totalPaid,
    debtFreeDate: formatDebtFreeDate(startDate, month),
    payoffOrder,
    payoffMonthByDebt,
    negativeAmortizationDebts: Array.from(negativeAmortizationDebts),
    schedule,
  };
}

export function compareDebtStrategies(
  debts: DebtInput[],
  selectedStrategy: DebtStrategy,
  extraPayment: number,
  startDate: string,
): DebtComparisonResult {
  const minimum = calculateDebtPayoff(debts, "minimum", 0, startDate);
  const snowball = calculateDebtPayoff(debts, "snowball", extraPayment, startDate);
  const avalanche = calculateDebtPayoff(debts, "avalanche", extraPayment, startDate);
  const selected =
    selectedStrategy === "minimum"
      ? minimum
      : selectedStrategy === "snowball"
        ? snowball
        : selectedStrategy === "avalanche"
          ? avalanche
          : calculateDebtPayoff(debts, "custom", extraPayment, startDate);

  return {
    minimum,
    snowball,
    avalanche,
    selected,
    monthsSavedVsMinimum: Math.max(0, minimum.monthsToDebtFree - selected.monthsToDebtFree),
    interestSavedVsMinimum: Math.max(0, minimum.totalInterestPaid - selected.totalInterestPaid),
  };
}
