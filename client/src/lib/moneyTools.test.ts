import assert from "node:assert/strict";
import {
  calculateCashFlow,
  calculateCompoundGrowth,
  calculateNetWorth,
  calculateTaxEstimate,
  compareDebtStrategies,
} from "@/lib/moneyTools";
import {
  ADJUSTMENT_DEDUCTIONS,
  BUSINESS_DEDUCTIONS,
  ITEMIZED_DEDUCTIONS,
  defaultDeductionState,
  getTaxYearConfig,
} from "@/lib/taxRules";

/**
 * Sample formula checks for Money Tools calculators.
 * This file is intentionally lightweight and excluded from main TypeScript build.
 *
 * To keep yearly tax updates maintainable:
 * - update values in `client/src/lib/taxRules.ts`
 * - keep this test file aligned with expected ranges for new tax year assumptions
 */
function runMoneyToolsFormulaChecks() {
  const netWorth = calculateNetWorth(
    { checking: 10000, savings: 12000, "primary-home-value": 300000 },
    { "credit-card-balances": 5000, "primary-mortgage": 240000 },
  );
  assert.equal(netWorth.totalAssets, 322000);
  assert.equal(netWorth.totalLiabilities, 245000);
  assert.equal(netWorth.netWorth, 77000);

  const cashFlow = calculateCashFlow(
    { salary: 7000, freelance: 500 },
    { rent: 2200, utilities: 300 },
    { groceries: 700, travel: 200 },
    { retirement: 600 },
  );
  assert.equal(cashFlow.totalIncome, 7500);
  assert.equal(cashFlow.totalExpenses, 3400);
  assert.equal(cashFlow.totalSavings, 600);
  assert.equal(cashFlow.netCashFlow, 3500);

  const compound = calculateCompoundGrowth({
    principal: 10000,
    recurringContribution: 300,
    contributionFrequency: "monthly",
    annualReturnRate: 7,
    compoundingFrequency: "monthly",
    years: 20,
    annualContributionIncreaseRate: 0,
    inflationRate: 2,
    taxDragRate: 0,
    startDate: "2026-01-01",
  });
  assert.ok(compound.endingBalance > compound.totalContributions);

  const taxConfig = getTaxYearConfig(2026);
  const taxEstimate = calculateTaxEstimate(
    {
      taxYear: 2026,
      filingStatus: "single",
      age: 35,
      over65: false,
      blind: false,
      stateCode: "TX",
      dependents: 0,
      isSelfEmployedPath: false,
      isMilitaryMove: false,
      income: {
        w2Wages: 90000,
        selfEmploymentIncome: 0,
        businessIncome: 0,
        interestIncome: 200,
        qualifiedDividends: 150,
        ordinaryDividends: 50,
        capitalGains: 0,
        rentalIncome: 0,
        retirementIncome: 0,
        socialSecurityIncome: 0,
        unemploymentIncome: 0,
        otherTaxableIncome: 0,
      },
      deductionMode: "compare",
      adjustmentDeductions: defaultDeductionState(ADJUSTMENT_DEDUCTIONS),
      itemizedDeductions: defaultDeductionState(ITEMIZED_DEDUCTIONS),
      businessDeductions: defaultDeductionState(BUSINESS_DEDUCTIONS),
      credits: {
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
      },
      payments: {
        federalWithholding: 12000,
        stateWithholding: 0,
        additionalWithholding: 0,
        estimatedQuarterlyPayments: 0,
        priorYearOverpaymentApplied: 0,
      },
    },
    taxConfig,
    {
      adjustmentDefinitions: ADJUSTMENT_DEDUCTIONS,
      itemizedDefinitions: ITEMIZED_DEDUCTIONS,
      businessDefinitions: BUSINESS_DEDUCTIONS,
    },
  );
  assert.ok(taxEstimate.grossIncome > 0);
  assert.ok(taxEstimate.totalEstimatedTaxLiability >= 0);

  const debt = compareDebtStrategies(
    [
      { id: "1", name: "Card", balance: 8000, annualRate: 22, minimumPayment: 210, priority: 1 },
      { id: "2", name: "Auto", balance: 16000, annualRate: 7, minimumPayment: 360, priority: 2 },
    ],
    "avalanche",
    250,
    "2026-01-01",
  );
  assert.ok(debt.selected.monthsToDebtFree > 0);
  assert.ok(debt.selected.totalPaid >= debt.selected.totalInterestPaid);
}

runMoneyToolsFormulaChecks();

