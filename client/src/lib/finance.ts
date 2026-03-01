export interface LoanInput {
  loanAmount: number;
  annualRateAPR: number;
  termMonths: number;
}

export interface AmortizationRow {
  monthIndex: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface LoanCalculationResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  amortization: AmortizationRow[];
}

export type BuydownType = "0-1" | "1-1" | "2-1" | "3-2-1";

export interface BuydownYearSummary {
  year: number;
  monthlyPayment: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  annualRateAPR: number;
}

export interface BuydownCalculationResult {
  baseline: LoanCalculationResult;
  yearlySummary: BuydownYearSummary[];
  amortization: AmortizationRow[];
  paymentSnapshots: {
    year1: number | null;
    year2: number | null;
    year3: number | null;
    year4Actual: number | null;
  };
  savings: {
    year1: number;
    year2: number;
    year3: number;
    estimatedBuydownCost: number;
  };
}

const EPSILON = 1e-8;

export function toNonNegativeNumber(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, value);
}

export function toPositiveInt(value: number, fallback = 1): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.max(1, Math.round(value));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number, fractionDigits = 2): string {
  return `${(Number.isFinite(value) ? value : 0).toFixed(fractionDigits)}%`;
}

export function annualRateToMonthlyRate(apr: number): number {
  return toNonNegativeNumber(apr) / 100 / 12;
}

export function calculateMonthlyPayment(loanAmount: number, annualRateAPR: number, termMonths: number): number {
  const principal = toNonNegativeNumber(loanAmount);
  const months = toPositiveInt(termMonths);

  if (principal <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = annualRateToMonthlyRate(annualRateAPR);

  if (Math.abs(monthlyRate) < EPSILON) {
    return principal / months;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function calculateFixedAmortization(input: LoanInput): LoanCalculationResult {
  const principal = toNonNegativeNumber(input.loanAmount);
  const months = toPositiveInt(input.termMonths);
  const monthlyRate = annualRateToMonthlyRate(input.annualRateAPR);
  const monthlyPayment = calculateMonthlyPayment(principal, input.annualRateAPR, months);

  if (principal <= 0 || months <= 0) {
    return {
      monthlyPayment: 0,
      totalInterest: 0,
      totalPaid: 0,
      amortization: [],
    };
  }

  let balance = principal;
  let totalInterest = 0;
  let totalPaid = 0;
  const amortization: AmortizationRow[] = [];

  for (let month = 1; month <= months; month += 1) {
    const interest = balance * monthlyRate;
    let principalPaid = monthlyPayment - interest;

    if (principalPaid > balance) {
      principalPaid = balance;
    }

    if (principalPaid < 0) {
      principalPaid = 0;
    }

    const payment = interest + principalPaid;
    balance = Math.max(0, balance - principalPaid);

    totalInterest += interest;
    totalPaid += payment;

    amortization.push({
      monthIndex: month,
      payment,
      interest,
      principal: principalPaid,
      balance,
    });

    if (balance <= EPSILON) {
      break;
    }
  }

  return {
    monthlyPayment,
    totalInterest,
    totalPaid,
    amortization,
  };
}

function buydownAdjustmentForYear(type: BuydownType, year: number): number {
  if (year <= 0) {
    return 0;
  }

  switch (type) {
    case "0-1":
      return year === 1 ? -1 : 0;
    case "1-1":
      return year <= 2 ? -1 : 0;
    case "2-1":
      if (year === 1) return -2;
      if (year === 2) return -1;
      return 0;
    case "3-2-1":
      if (year === 1) return -3;
      if (year === 2) return -2;
      if (year === 3) return -1;
      return 0;
    default:
      return 0;
  }
}

function paymentForYear(yearlySummary: BuydownYearSummary[], year: number): number | null {
  const found = yearlySummary.find((entry) => entry.year === year);
  return found ? found.monthlyPayment : null;
}

function monthsInBuydownYear(termMonths: number, year: number): number {
  const startMonth = (year - 1) * 12;
  if (startMonth >= termMonths) {
    return 0;
  }
  return Math.min(12, termMonths - startMonth);
}

export function calculateBuydownAmortization(input: {
  loanAmount: number;
  noteRateAPR: number;
  termMonths: number;
  buydownType: BuydownType;
}): BuydownCalculationResult {
  const principal = toNonNegativeNumber(input.loanAmount);
  const termMonths = toPositiveInt(input.termMonths);
  const noteRateAPR = toNonNegativeNumber(input.noteRateAPR);

  const baseline = calculateFixedAmortization({
    loanAmount: principal,
    annualRateAPR: noteRateAPR,
    termMonths,
  });

  if (principal <= 0 || termMonths <= 0) {
    return {
      baseline,
      yearlySummary: [],
      amortization: [],
      paymentSnapshots: {
        year1: null,
        year2: null,
        year3: null,
        year4Actual: null,
      },
      savings: {
        year1: 0,
        year2: 0,
        year3: 0,
        estimatedBuydownCost: 0,
      },
    };
  }

  let remainingBalance = principal;
  let remainingMonths = termMonths;
  let year = 1;
  let monthIndex = 1;

  const amortization: AmortizationRow[] = [];
  const yearlySummary: BuydownYearSummary[] = [];

  while (remainingMonths > 0 && remainingBalance > EPSILON) {
    const monthsThisYear = Math.min(12, remainingMonths);
    const adjustment = buydownAdjustmentForYear(input.buydownType, year);
    const annualRateAPR = Math.max(0, noteRateAPR + adjustment);
    const monthlyRate = annualRateToMonthlyRate(annualRateAPR);

    const monthlyPayment = calculateMonthlyPayment(remainingBalance, annualRateAPR, remainingMonths);

    let yearTotalPaid = 0;
    let yearInterestPaid = 0;
    let yearPrincipalPaid = 0;

    for (let i = 0; i < monthsThisYear; i += 1) {
      const interest = remainingBalance * monthlyRate;
      let principalPaid = monthlyPayment - interest;

      if (principalPaid > remainingBalance) {
        principalPaid = remainingBalance;
      }

      if (principalPaid < 0) {
        principalPaid = 0;
      }

      const payment = interest + principalPaid;
      remainingBalance = Math.max(0, remainingBalance - principalPaid);

      yearTotalPaid += payment;
      yearInterestPaid += interest;
      yearPrincipalPaid += principalPaid;

      amortization.push({
        monthIndex,
        payment,
        interest,
        principal: principalPaid,
        balance: remainingBalance,
      });

      monthIndex += 1;
      remainingMonths -= 1;

      if (remainingBalance <= EPSILON || remainingMonths <= 0) {
        break;
      }
    }

    yearlySummary.push({
      year,
      monthlyPayment,
      totalPaid: yearTotalPaid,
      principalPaid: yearPrincipalPaid,
      interestPaid: yearInterestPaid,
      endingBalance: remainingBalance,
      annualRateAPR,
    });

    year += 1;
  }

  const baselinePayment = baseline.monthlyPayment;

  const year1DisplayPayment = calculateMonthlyPayment(
    principal,
    Math.max(0, noteRateAPR + buydownAdjustmentForYear(input.buydownType, 1)),
    termMonths,
  );
  const year2DisplayPayment = calculateMonthlyPayment(
    principal,
    Math.max(0, noteRateAPR + buydownAdjustmentForYear(input.buydownType, 2)),
    termMonths,
  );
  const year3DisplayPayment = calculateMonthlyPayment(
    principal,
    Math.max(0, noteRateAPR + buydownAdjustmentForYear(input.buydownType, 3)),
    termMonths,
  );
  const year4ActualPayment = baselinePayment;

  const year1Savings = Math.max(0, baselinePayment - year1DisplayPayment);
  const year2Savings = Math.max(0, baselinePayment - year2DisplayPayment);
  const year3Savings = Math.max(0, baselinePayment - year3DisplayPayment);

  const estimatedBuydownCost =
    year1Savings * monthsInBuydownYear(termMonths, 1) +
    year2Savings * monthsInBuydownYear(termMonths, 2) +
    year3Savings * monthsInBuydownYear(termMonths, 3);

  return {
    baseline,
    yearlySummary,
    amortization,
    paymentSnapshots: {
      year1: year1DisplayPayment,
      year2: year2DisplayPayment,
      year3: year3DisplayPayment,
      year4Actual: year4ActualPayment,
    },
    savings: {
      year1: year1Savings,
      year2: year2Savings,
      year3: year3Savings,
      estimatedBuydownCost,
    },
  };
}
