import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const MAX_RATE = 100;

type FeesMode = "percent" | "flat";
type TermUnit = "years" | "months";
type BusinessMode = "term" | "mca";

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
  const [activeTab, setActiveTab] = useState("mortgage");

  const [mortgageAmount, setMortgageAmount] = useState(300000);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [mortgageTermChoice, setMortgageTermChoice] = useState("30");
  const [mortgageCustomYears, setMortgageCustomYears] = useState(25);
  const [propertyTaxMonthly, setPropertyTaxMonthly] = useState(0);
  const [insuranceMonthly, setInsuranceMonthly] = useState(0);
  const [hoaMonthly, setHoaMonthly] = useState(0);
  const [miMonthly, setMiMonthly] = useState(0);

  const mortgageTermYears = mortgageTermChoice === "custom" ? mortgageCustomYears : Number(mortgageTermChoice);
  const mortgageTermMonths = toPositiveInt(mortgageTermYears, 1) * 12;

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

  const mortgageMetrics: SummaryMetric[] = [
    { label: "Monthly Payment (P&I)", value: formatCurrency(mortgageResult.monthlyPayment) },
    { label: "Total Interest", value: formatCurrency(mortgageResult.totalInterest) },
    { label: "Total Paid", value: formatCurrency(mortgageResult.totalPaid) },
    {
      label: "Total Monthly with Optional Items",
      value: formatCurrency(mortgageResult.monthlyPayment + mortgageExtras),
      hint: "Adds property tax, insurance, HOA, and MI only when entered.",
    },
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

  const buydownMetrics: SummaryMetric[] = [
    { label: "Baseline Monthly at Note Rate", value: formatCurrency(buydownResult.baseline.monthlyPayment) },
    { label: "Year 1 Monthly Payment", value: buydownResult.paymentSnapshots.year1 ? formatCurrency(buydownResult.paymentSnapshots.year1) : "N/A" },
    { label: "Year 2 Monthly Payment", value: buydownResult.paymentSnapshots.year2 ? formatCurrency(buydownResult.paymentSnapshots.year2) : "N/A" },
    { label: "Year 3 Monthly Payment", value: buydownResult.paymentSnapshots.year3 ? formatCurrency(buydownResult.paymentSnapshots.year3) : "N/A" },
    { label: "Year 4 Actual Monthly Payment", value: buydownResult.paymentSnapshots.year4Actual ? formatCurrency(buydownResult.paymentSnapshots.year4Actual) : "N/A", hint: "This is the note-rate payment after the temporary buydown period." },
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
    <div className="min-h-screen bg-slate-50 font-sans">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5 border-slate-200 bg-white space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Mortgage Inputs</h2>
                  <NumberField id="mortgage-amount" label="Loan Amount" value={mortgageAmount} onChange={(value) => setMortgageAmount(toNonNegativeNumber(value))} step={1000} />
                  <NumberField id="mortgage-rate" label="Interest Rate" value={mortgageRate} onChange={(value) => setMortgageRate(clampRate(value))} step={0.01} max={MAX_RATE} suffix="%" />

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
                      <AccordionTrigger>Advanced (Optional Monthly Items)</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <NumberField id="property-tax" label="Property Tax (Monthly)" value={propertyTaxMonthly} onChange={(value) => setPropertyTaxMonthly(toNonNegativeNumber(value))} step={1} />
                          <NumberField id="home-insurance" label="Home Insurance (Monthly)" value={insuranceMonthly} onChange={(value) => setInsuranceMonthly(toNonNegativeNumber(value))} step={1} />
                          <NumberField id="hoa" label="HOA (Monthly)" value={hoaMonthly} onChange={(value) => setHoaMonthly(toNonNegativeNumber(value))} step={1} />
                          <NumberField id="mi" label="MI (Monthly)" value={miMonthly} onChange={(value) => setMiMonthly(toNonNegativeNumber(value))} step={1} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>

                <div className="space-y-4">
                  <Card className="p-4 border-slate-200 bg-blue-50/50">
                    <p className="text-sm font-medium text-blue-900">Principal & Interest only: base payment excludes taxes, insurance, HOA, and MI unless entered above.</p>
                  </Card>
                  <ResultMetrics metrics={mortgageMetrics} />
                  <GlobalDisclaimers />
                </div>
              </div>

              <Card className="p-5 border-slate-200 bg-white space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">Explanation</h3>
                <p className="text-sm text-slate-600">Your monthly P&I payment covers principal (the amount you borrowed) and interest (the lender’s charge for borrowing). The amortization schedule shows how each payment is split over time.</p>
                <p className="text-sm text-slate-600">In early months, more of each payment goes to interest because the balance is highest then. As the balance drops, interest decreases and principal payoff accelerates.</p>
              </Card>

              <AmortizationTable rows={mortgageResult.amortization} defaultVisibleRows={60} />
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

              <AmortizationTable rows={refinanceNewResult.amortization} defaultVisibleRows={60} title="New Loan Amortization (Monthly)" />
            </TabsContent>

            <TabsContent value="buydown" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5 border-slate-200 bg-white space-y-4">
                  <h2 className="text-xl font-semibold text-slate-900">Buydown Mortgage Inputs</h2>
                  <NumberField id="buydown-amount" label="Loan Amount" value={buydownAmount} onChange={(value) => setBuydownAmount(toNonNegativeNumber(value))} step={1000} />
                  <NumberField id="buydown-note-rate" label="Note Rate" value={buydownNoteRate} onChange={(value) => setBuydownNoteRate(clampRate(value))} step={0.01} max={MAX_RATE} suffix="%" />
                  <NumberField id="buydown-term" label="Term (Years)" value={buydownTermYears} onChange={(value) => setBuydownTermYears(toPositiveInt(value, 1))} min={1} max={50} />

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
                  <Card className="p-4 border-slate-200 bg-white">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Monthly Savings vs Baseline</h3>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Year 1 Savings: {formatCurrency(buydownResult.savings.year1)}</p>
                      <p>Year 2 Savings: {formatCurrency(buydownResult.savings.year2)}</p>
                      <p>Year 3 Savings: {formatCurrency(buydownResult.savings.year3)}</p>
                    </div>
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

              <AmortizationTable rows={buydownResult.amortization} defaultVisibleRows={48} title="Buydown Amortization (Monthly, First 48 Shown)" />

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

              <AmortizationTable rows={carResult.amortization} defaultVisibleRows={60} />
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

              <AmortizationTable rows={personalResult.amortization} defaultVisibleRows={60} />
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

              {businessMode === "term" ? <AmortizationTable rows={businessResult.amortization} defaultVisibleRows={60} title="Business Term Loan Amortization (Monthly)" /> : null}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
