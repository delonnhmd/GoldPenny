import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Download,
  FileCheck2,
  FileText,
  Home,
  Info,
  Landmark,
  Layers,
  ListChecks,
  Mail,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  calculateFixedAmortization,
  formatCurrency,
  formatPercent,
  toNonNegativeNumber,
  toPositiveInt,
} from "@/lib/finance";
import { setPageSeo } from "@/lib/seo";

type LoanProgram = "conventional" | "fha" | "va" | "jumbo";
type EmploymentType = "w2-employee" | "self-employed" | "1099-contractor" | "retired" | "commission-based" | "hourly";
type MilitaryStatus = "none" | "veteran" | "active-duty" | "surviving-spouse";
type LoanPurpose = "purchase" | "refinance" | "cash-out-refinance";
type PropertyType = "single-family" | "condo" | "townhome" | "2-unit" | "3-unit" | "4-unit";
type OccupancyType = "primary-residence" | "second-home" | "investment-property";
type CreditRange = "below-580" | "580-619" | "620-639" | "640-679" | "680-719" | "720-739" | "740-plus";
type YesNo = "yes" | "no";
type RequirementStatus = "Standard" | "Review Needed" | "Likely Required" | "Conditional";

interface DocumentItem {
  title: string;
  status: RequirementStatus;
  note?: string;
}

interface ConditionItem {
  title: string;
  reason: string;
  status: RequirementStatus;
}

interface DocumentCategory {
  key: string;
  title: string;
  icon: LucideIcon;
  items: DocumentItem[];
}

const WORKFLOW_STEPS = [
  "Step 1 Borrower Profile",
  "Step 2 Loan Scenario",
  "Step 3 Financial Profile",
  "Step 4 Underwriting Analysis",
  "Step 5 Document & Condition Checklist",
] as const;

const CREDIT_TO_FICO: Record<CreditRange, number> = {
  "below-580": 560,
  "580-619": 600,
  "620-639": 630,
  "640-679": 660,
  "680-719": 700,
  "720-739": 730,
  "740-plus": 760,
};

const PROGRAM_RULES: Record<LoanProgram, { minFico: number; maxDti: number; minDownPercent: number }> = {
  conventional: { minFico: 620, maxDti: 50, minDownPercent: 3 },
  fha: { minFico: 500, maxDti: 57, minDownPercent: 3.5 },
  va: { minFico: 580, maxDti: 60, minDownPercent: 0 },
  jumbo: { minFico: 680, maxDti: 43, minDownPercent: 10 },
};

const PROGRAM_LABELS: Record<LoanProgram, string> = {
  conventional: "Conventional",
  fha: "FHA",
  va: "VA",
  jumbo: "Jumbo",
};

const PAGE_TITLE = "Mortgage Pre Approval Houston TX & Home Loan Houston Texas | PennyFloat";
const PAGE_DESCRIPTION =
  "Estimate mortgage pre approval Houston TX scenarios for first time home buyer Houston, refinance mortgage Houston TX, FHA loan Houston requirements, and VA loan Houston eligibility. Review mortgage for self employed Houston options and down payment assistance Houston pathways.";
const PAGE_KEYWORDS =
  "best mortgage brokers Houston 2026, mortgage pre approval Houston TX, first time home buyer Houston, mortgage rates Houston today, FHA loan Houston requirements, VA loan Houston eligibility, mortgage for self employed Houston, refinance mortgage Houston TX, home loan Houston Texas, down payment assistance Houston";

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function round1(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

function statusBadgeClass(status: RequirementStatus): string {
  if (status === "Likely Required") return "border-blue-200 bg-blue-100 text-blue-800";
  if (status === "Review Needed") return "border-amber-200 bg-amber-100 text-amber-800";
  if (status === "Conditional") return "border-violet-200 bg-violet-100 text-violet-800";
  return "border-slate-200 bg-slate-100 text-slate-800";
}

function borrowerIncomeMonthly(params: {
  employmentType: EmploymentType;
  grossMonthly: number;
  netY1: number;
  netY2: number;
  depreciation: number;
  businessHome: number;
  depletion: number;
}): number {
  if (params.employmentType !== "self-employed" && params.employmentType !== "1099-contractor") {
    return toNonNegativeNumber(params.grossMonthly);
  }
  const avgNet = (toNonNegativeNumber(params.netY1) + toNonNegativeNumber(params.netY2)) / 2;
  const addbacks =
    toNonNegativeNumber(params.depreciation) +
    toNonNegativeNumber(params.businessHome) +
    toNonNegativeNumber(params.depletion);
  return (avgNet + addbacks) / 12;
}

function averageTwoYearMonthly(year1: number, year2: number): number {
  return (toNonNegativeNumber(year1) + toNonNegativeNumber(year2)) / 2 / 12;
}

function getHourlyIncomeAnalysis(params: {
  hourlyRate: number;
  averageHoursPerWeek: number;
  overtimeYear1: number;
  overtimeYear2: number;
  bonusYear1: number;
  bonusYear2: number;
  commissionYear1: number;
  commissionYear2: number;
  hoursVarySignificantly: boolean;
  yearsWithEmployer: number;
}): {
  baseMonthly: number;
  overtimeMonthly: number;
  bonusMonthly: number;
  commissionMonthly: number;
  totalMonthly: number;
  warnings: string[];
} {
  const baseMonthly =
    (toNonNegativeNumber(params.hourlyRate) * toNonNegativeNumber(params.averageHoursPerWeek) * 52) / 12;
  const overtimeMonthly = averageTwoYearMonthly(params.overtimeYear1, params.overtimeYear2);
  const bonusMonthly = averageTwoYearMonthly(params.bonusYear1, params.bonusYear2);
  const commissionMonthly = averageTwoYearMonthly(params.commissionYear1, params.commissionYear2);
  const warnings: string[] = [];

  if (toNonNegativeNumber(params.overtimeYear1) > 0 && toNonNegativeNumber(params.overtimeYear2) < toNonNegativeNumber(params.overtimeYear1) * 0.8) {
    warnings.push("Overtime income declining. Underwriter may reduce qualifying income.");
  }
  if (params.hoursVarySignificantly) {
    warnings.push("Variable work hours detected. Underwriter may average income using YTD earnings.");
  }
  if (toNonNegativeNumber(params.yearsWithEmployer) < 2) {
    warnings.push("Employment history less than 2 years. Additional documentation may be required.");
  }
  const bonusYearsPresent = Number(toNonNegativeNumber(params.bonusYear1) > 0) + Number(toNonNegativeNumber(params.bonusYear2) > 0);
  if (bonusYearsPresent === 1) {
    warnings.push("Bonus income history is less than 2 years and may be treated as unstable income.");
  }
  const commissionYearsPresent = Number(toNonNegativeNumber(params.commissionYear1) > 0) + Number(toNonNegativeNumber(params.commissionYear2) > 0);
  if (commissionYearsPresent === 1) {
    warnings.push("Commission income history is less than 2 years and may be treated as unstable income.");
  }

  return {
    baseMonthly,
    overtimeMonthly,
    bonusMonthly,
    commissionMonthly,
    totalMonthly: baseMonthly + overtimeMonthly + bonusMonthly + commissionMonthly,
    warnings,
  };
}

function getEmploymentDocs(type: EmploymentType): string[] {
  if (type === "w2-employee") return ["Most recent pay stubs", "Most recent 2 years W-2 forms"];
  if (type === "self-employed" || type === "1099-contractor") {
    return [
      "Most recent 2 years personal tax returns",
      "Business tax returns if applicable",
      "Year-to-date profit and loss statement",
    ];
  }
  if (type === "retired") return ["Retirement award or benefit letters"];
  return ["Most recent pay stubs", "Employment verification"];
}

function pickProgram(params: {
  fico: number;
  dti: number;
  downPercent: number;
  loanAmount: number;
  conformingLimit: number;
  isVaEligible: boolean;
}): LoanProgram {
  if (params.loanAmount > params.conformingLimit) return "jumbo";
  if (params.isVaEligible && params.fico >= 580 && params.dti <= 60) return "va";
  if (params.fico < 620 || params.downPercent < 5) return "fha";
  return "conventional";
}

export default function MortgageUnderwriting() {
  useEffect(() => {
    setPageSeo({
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      canonical: "https://www.pennyfloat.com/mortgage",
      keywords: PAGE_KEYWORDS,
      robots: "index, follow, max-image-preview:large",
    });
  }, []);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [coBorrower, setCoBorrower] = useState<YesNo>("no");
  const [militaryStatus, setMilitaryStatus] = useState<MilitaryStatus>("none");
  const [firstTimeHomebuyer, setFirstTimeHomebuyer] = useState<YesNo>("no");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("w2-employee");
  const [yearsWithEmployer, setYearsWithEmployer] = useState(2);
  const [yearsInIndustry, setYearsInIndustry] = useState(4);

  const [loanPurpose, setLoanPurpose] = useState<LoanPurpose>("purchase");
  const [propertyType, setPropertyType] = useState<PropertyType>("single-family");
  const [occupancyType, setOccupancyType] = useState<OccupancyType>("primary-residence");
  const [propertyValue, setPropertyValue] = useState(450000);
  const [desiredLoanAmount, setDesiredLoanAmount] = useState(405000);
  const [downPaymentAmount, setDownPaymentAmount] = useState(45000);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [interestRate, setInterestRate] = useState(6.5);
  const [annualPropertyTax, setAnnualPropertyTax] = useState(5400);
  const [annualHomeInsurance, setAnnualHomeInsurance] = useState(1800);
  const [monthlyHoa, setMonthlyHoa] = useState(0);
  const [conformingLoanLimit, setConformingLoanLimit] = useState(806500);
  const [currentMortgageBalance, setCurrentMortgageBalance] = useState(300000);
  const [currentInterestRate, setCurrentInterestRate] = useState(6.1);
  const [currentMonthlyMortgagePayment, setCurrentMonthlyMortgagePayment] = useState(2200);
  const [cashOutRequested, setCashOutRequested] = useState(0);

  const [creditRange, setCreditRange] = useState<CreditRange>("680-719");
  const [annualSalary, setAnnualSalary] = useState(96000);
  const [borrowerGrossMonthlyIncome, setBorrowerGrossMonthlyIncome] = useState(9500);
  const [coBorrowerGrossMonthlyIncome, setCoBorrowerGrossMonthlyIncome] = useState(0);
  const [annualTaxReturnAgi, setAnnualTaxReturnAgi] = useState(0);
  const [reportedAnnualRevenue, setReportedAnnualRevenue] = useState(0);
  const [netIncomeY1, setNetIncomeY1] = useState(0);
  const [netIncomeY2, setNetIncomeY2] = useState(0);
  const [addBackDepreciation, setAddBackDepreciation] = useState(0);
  const [addBackBusinessHome, setAddBackBusinessHome] = useState(0);
  const [addBackDepletion, setAddBackDepletion] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [averageHoursPerWeek, setAverageHoursPerWeek] = useState(40);
  const [overtimeYear1, setOvertimeYear1] = useState(0);
  const [overtimeYear2, setOvertimeYear2] = useState(0);
  const [bonusYear1, setBonusYear1] = useState(0);
  const [bonusYear2, setBonusYear2] = useState(0);
  const [commissionYear1, setCommissionYear1] = useState(0);
  const [commissionYear2, setCommissionYear2] = useState(0);
  const [hoursVarySignificantly, setHoursVarySignificantly] = useState<YesNo>("no");
  const [hourlyYtdEarnings, setHourlyYtdEarnings] = useState(0);
  const [hourlyYtdMonths, setHourlyYtdMonths] = useState(12);
  const [rentalIncomeSource, setRentalIncomeSource] = useState<"gross-rent" | "schedule-e-net">("gross-rent");
  const [scheduleENetMonthlyIncome, setScheduleENetMonthlyIncome] = useState(0);
  const [socialSecurityIncome, setSocialSecurityIncome] = useState(0);
  const [pensionIncome, setPensionIncome] = useState(0);
  const [disabilityIncome, setDisabilityIncome] = useState(0);
  const [alimonyChildSupportIncome, setAlimonyChildSupportIncome] = useState(0);
  const [otherIncomeContinuationYears, setOtherIncomeContinuationYears] = useState(5);
  const [carDebt, setCarDebt] = useState(350);
  const [studentDebt, setStudentDebt] = useState(150);
  const [creditCardDebt, setCreditCardDebt] = useState(200);
  const [personalDebt, setPersonalDebt] = useState(0);
  const [childSupportDebt, setChildSupportDebt] = useState(0);
  const [alimonyDebt, setAlimonyDebt] = useState(0);
  const [otherDebt, setOtherDebt] = useState(0);
  const [checking, setChecking] = useState(12000);
  const [savings, setSavings] = useState(28000);
  const [retirement, setRetirement] = useState(55000);
  const [investment, setInvestment] = useState(18000);
  const [cashForClosing, setCashForClosing] = useState(60000);
  const [reservesAfterClosing, setReservesAfterClosing] = useState(30000);
  const [expectedRent, setExpectedRent] = useState(0);

  const fico = CREDIT_TO_FICO[creditRange];
  const loanAmount = toNonNegativeNumber(desiredLoanAmount);
  const cleanPropertyValue = toNonNegativeNumber(propertyValue);
  const cleanDownPayment = Math.max(0, Math.min(toNonNegativeNumber(downPaymentAmount), cleanPropertyValue));
  const downPercent = cleanPropertyValue > 0 ? round1((cleanDownPayment / cleanPropertyValue) * 100) : 0;
  const ltv = cleanPropertyValue > 0 ? round1((loanAmount / cleanPropertyValue) * 100) : 0;
  const salariedBorrowerIncome = toNonNegativeNumber(annualSalary) / 12;
  const selfEmployedBorrowerIncome = borrowerIncomeMonthly({
    employmentType,
    grossMonthly: borrowerGrossMonthlyIncome,
    netY1: netIncomeY1,
    netY2: netIncomeY2,
    depreciation: addBackDepreciation,
    businessHome: addBackBusinessHome,
    depletion: addBackDepletion,
  });
  const hourlyIncomeAnalysis = getHourlyIncomeAnalysis({
    hourlyRate,
    averageHoursPerWeek,
    overtimeYear1,
    overtimeYear2,
    bonusYear1,
    bonusYear2,
    commissionYear1,
    commissionYear2,
    hoursVarySignificantly: hoursVarySignificantly === "yes",
    yearsWithEmployer,
  });
  const hourlyYtdMonthly = toNonNegativeNumber(hourlyYtdMonths) > 0
    ? toNonNegativeNumber(hourlyYtdEarnings) / toNonNegativeNumber(hourlyYtdMonths)
    : 0;
  const hourlyYtdMismatch =
    employmentType === "hourly" &&
    hourlyYtdMonthly > 0 &&
    hourlyIncomeAnalysis.baseMonthly > 0 &&
    Math.abs(hourlyYtdMonthly - hourlyIncomeAnalysis.baseMonthly) / hourlyIncomeAnalysis.baseMonthly > 0.15;

  const borrowerIncome =
    employmentType === "w2-employee"
      ? salariedBorrowerIncome
      : employmentType === "hourly"
        ? hourlyIncomeAnalysis.totalMonthly
        : selfEmployedBorrowerIncome;
  const rentalIncomeCredit =
    rentalIncomeSource === "schedule-e-net"
      ? (Number.isFinite(scheduleENetMonthlyIncome) ? scheduleENetMonthlyIncome : 0)
      : toNonNegativeNumber(expectedRent) * 0.75;
  const otherIncomeTotal =
    toNonNegativeNumber(socialSecurityIncome) +
    toNonNegativeNumber(pensionIncome) +
    toNonNegativeNumber(disabilityIncome) +
    toNonNegativeNumber(alimonyChildSupportIncome);
  const totalIncome =
    borrowerIncome +
    (coBorrower === "yes" ? toNonNegativeNumber(coBorrowerGrossMonthlyIncome) : 0) +
    rentalIncomeCredit +
    otherIncomeTotal;
  const totalDebt =
    toNonNegativeNumber(carDebt) +
    toNonNegativeNumber(studentDebt) +
    toNonNegativeNumber(creditCardDebt) +
    toNonNegativeNumber(personalDebt) +
    toNonNegativeNumber(childSupportDebt) +
    toNonNegativeNumber(alimonyDebt) +
    toNonNegativeNumber(otherDebt);
  const monthlyPrincipalInterest = calculateFixedAmortization({
    loanAmount,
    annualRateAPR: toNonNegativeNumber(interestRate),
    termMonths: toPositiveInt(loanTermYears, 1) * 12,
  }).monthlyPayment;
  const annualPropertyTaxForPayment =
    toNonNegativeNumber(annualPropertyTax) > 0
      ? toNonNegativeNumber(annualPropertyTax)
      : cleanPropertyValue * 0.0125;
  const annualInsuranceForPayment =
    toNonNegativeNumber(annualHomeInsurance) > 0
      ? toNonNegativeNumber(annualHomeInsurance)
      : cleanPropertyValue * 0.004;
  const monthlyHousing =
    monthlyPrincipalInterest +
    annualPropertyTaxForPayment / 12 +
    annualInsuranceForPayment / 12 +
    toNonNegativeNumber(monthlyHoa);
  const frontDti = totalIncome > 0 ? round1((monthlyHousing / totalIncome) * 100) : 0;
  const backDti = totalIncome > 0 ? round1(((monthlyHousing + totalDebt) / totalIncome) * 100) : 0;
  const reservesMonths = monthlyHousing > 0 ? round1(toNonNegativeNumber(reservesAfterClosing) / monthlyHousing) : 0;
  const selectedProgram = pickProgram({
    fico,
    dti: backDti,
    downPercent,
    loanAmount,
    conformingLimit: toNonNegativeNumber(conformingLoanLimit),
    isVaEligible: militaryStatus !== "none",
  });
  const isJumboScenario = loanAmount > toNonNegativeNumber(conformingLoanLimit) || selectedProgram === "jumbo";
  const isMultiUnitProperty = propertyType === "2-unit" || propertyType === "3-unit" || propertyType === "4-unit";
  const rentalIncomeUsed = Math.abs(rentalIncomeCredit) > 0;
  const variableIncomePresent =
    employmentType === "hourly"
      ? toNonNegativeNumber(overtimeYear1) > 0 ||
        toNonNegativeNumber(overtimeYear2) > 0 ||
        toNonNegativeNumber(bonusYear1) > 0 ||
        toNonNegativeNumber(bonusYear2) > 0 ||
        toNonNegativeNumber(commissionYear1) > 0 ||
        toNonNegativeNumber(commissionYear2) > 0 ||
        hoursVarySignificantly === "yes"
      : employmentType === "commission-based";
  const possibleLargeDeposit = toNonNegativeNumber(checking) > Math.max(25000, toNonNegativeNumber(totalIncome) * 3);

  const specialDocumentTriggers = useMemo(() => {
    const docs: string[] = [];
    if (loanPurpose !== "purchase") docs.push("Current mortgage statement required for refinance analysis.");
    if (propertyType === "condo") docs.push("HOA documentation required for condo review.");
    if (occupancyType === "investment-property") docs.push("Rental income documentation required for investment property.");
    if ((rentalIncomeSource === "gross-rent" && expectedRent > 0) || (rentalIncomeSource === "schedule-e-net" && scheduleENetMonthlyIncome !== 0)) {
      docs.push("Lease agreement and Schedule E tax return required when rental income is used.");
    }
    return unique(docs);
  }, [loanPurpose, propertyType, occupancyType, expectedRent, rentalIncomeSource, scheduleENetMonthlyIncome]);

  const documentChecklist = useMemo(
    () => unique(["Government-issued photo ID", ...getEmploymentDocs(employmentType), ...specialDocumentTriggers]),
    [employmentType, specialDocumentTriggers],
  );

  const underwritingConditions = useMemo(
    () =>
      unique([
        "Borrower may need to provide tax certification for property.",
        "Borrower may need to provide explanation for large bank deposits.",
        ...(specialDocumentTriggers.includes("Current mortgage statement required for refinance analysis.")
          ? ["Mortgage statement and payoff detail may be required for refinance validation."]
          : []),
        ...(specialDocumentTriggers.includes("HOA documentation required for condo review.")
          ? ["Condo HOA budget, master policy, and questionnaire may be required."]
          : []),
        ...(specialDocumentTriggers.includes("Rental income documentation required for investment property.")
          ? ["Rental income must be verified with lease agreement."]
          : []),
        ...(backDti > PROGRAM_RULES[selectedProgram].maxDti
          ? ["Compensating factors may be required due to elevated DTI."]
          : []),
        "Verification of employment and credit profile may be updated before a lending outcome is issued.",
      ]),
    [specialDocumentTriggers, backDti, selectedProgram],
  );

  const hasLowAgiVersusRevenue =
    (employmentType === "1099-contractor" || employmentType === "self-employed") &&
    toNonNegativeNumber(annualTaxReturnAgi) > 0 &&
    toNonNegativeNumber(reportedAnnualRevenue) > 0 &&
    toNonNegativeNumber(annualTaxReturnAgi) < toNonNegativeNumber(reportedAnnualRevenue) * 0.7;
  const hourlyIncomeWarnings = employmentType === "hourly" ? hourlyIncomeAnalysis.warnings : [];

  const conditionFlags = useMemo(
    () =>
      unique([
        ...(backDti > 45 ? ["Debt-to-income ratio is high."] : []),
        ...(fico < PROGRAM_RULES[selectedProgram].minFico ? ["Credit score is below common program minimum."] : []),
        ...(fico >= PROGRAM_RULES[selectedProgram].minFico && fico <= PROGRAM_RULES[selectedProgram].minFico + 20
          ? ["Credit score is near minimum program threshold."]
          : []),
        ...(downPercent < 5 ? ["Down payment is below typical guideline for many scenarios."] : []),
        ...(backDti > PROGRAM_RULES[selectedProgram].maxDti ? ["DTI exceeds typical program guideline."] : []),
        ...(loanAmount >= toNonNegativeNumber(conformingLoanLimit) * 0.95 && loanAmount <= toNonNegativeNumber(conformingLoanLimit)
          ? ["Loan amount is near jumbo threshold."]
          : []),
        ...(selectedProgram === "jumbo" && reservesMonths < 6 ? ["Reserves may be insufficient for jumbo review."] : []),
        ...(selectedProgram === "conventional" && fico < 620 ? ["Conventional financing is unlikely with current credit score."] : []),
        ...(selectedProgram === "conventional" && backDti > 50 ? ["Conventional scenario is high risk because DTI is above 50%."] : []),
        ...(selectedProgram === "fha" && (fico < 580 || downPercent < 3.5)
          ? ["FHA commonly requires at least 580 FICO with 3.5% down."]
          : []),
        ...(selectedProgram === "va" && militaryStatus === "none"
          ? ["VA program requires veteran/service eligibility."]
          : []),
        ...(selectedProgram === "va" && backDti > 41
          ? ["VA benchmark DTI is near 41%; residual income review may be required."]
          : []),
        ...(selectedProgram === "jumbo" && fico < 700
          ? ["Jumbo loans typically require around 700+ credit score."]
          : []),
        ...(selectedProgram === "jumbo" && downPercent < 10
          ? ["Jumbo loans typically require at least 10% down payment."]
          : []),
        ...(selectedProgram === "jumbo" && backDti > 43
          ? ["Jumbo loans typically require DTI at or below 43%."]
          : []),
        ...(reservesMonths < 2 ? ["Reserves may be limited after closing."] : []),
        ...(toNonNegativeNumber(annualPropertyTax) <= 0 ? ["Property taxes not confirmed. Estimated value used."] : []),
        ...(toNonNegativeNumber(annualHomeInsurance) <= 0 ? ["Homeowners insurance estimated."] : []),
        ...(loanPurpose === "cash-out-refinance" && cashOutRequested <= 0
          ? ["Cash out requested is missing for cash-out refinance scenario."]
          : []),
        ...(coBorrower === "yes" && coBorrowerGrossMonthlyIncome <= 0
          ? ["Co-borrower selected but co-borrower income is missing."]
          : []),
        ...(employmentType === "w2-employee" && yearsWithEmployer < 2
          ? ["Employment history less than two years may require additional review."]
          : []),
        ...(employmentType === "self-employed" || employmentType === "1099-contractor"
          ? (netIncomeY2 < netIncomeY1 ? ["Self-employment income trend declining."] : [])
          : []),
        ...(rentalIncomeSource === "schedule-e-net" && scheduleENetMonthlyIncome < 0
          ? ["Rental property shows negative income on tax returns."]
          : []),
        ...(otherIncomeTotal > 0 && otherIncomeContinuationYears < 3
          ? ["Income must continue for at least 3 years to be used for qualification."]
          : []),
        ...hourlyIncomeWarnings,
        ...(hourlyYtdMismatch
          ? ["Reported hourly wage may not match actual earnings received year-to-date."]
          : []),
        ...(hasLowAgiVersusRevenue ? ["Business deductions may reduce qualifying income."] : []),
      ]),
    [
      fico,
      selectedProgram,
      backDti,
      downPercent,
      loanAmount,
      conformingLoanLimit,
      reservesMonths,
      annualPropertyTax,
      annualHomeInsurance,
      loanPurpose,
      cashOutRequested,
      coBorrower,
      coBorrowerGrossMonthlyIncome,
      militaryStatus,
      employmentType,
      yearsWithEmployer,
      netIncomeY1,
      netIncomeY2,
      rentalIncomeSource,
      scheduleENetMonthlyIncome,
      otherIncomeTotal,
      otherIncomeContinuationYears,
      hourlyIncomeWarnings,
      hourlyYtdMismatch,
      hasLowAgiVersusRevenue,
    ],
  );

  const documentCategories = useMemo<DocumentCategory[]>(() => {
    const dedupeItems = (items: DocumentItem[]): DocumentItem[] => {
      const map = new Map<string, DocumentItem>();
      for (const item of items) {
        if (!map.has(item.title)) map.set(item.title, item);
      }
      return Array.from(map.values());
    };

    const categories: DocumentCategory[] = [];

    categories.push({
      key: "identity",
      title: "Identity / Basic File Documents",
      icon: ShieldCheck,
      items: dedupeItems([
        { title: "Government-issued photo ID", status: "Likely Required" },
        { title: "Current mailing address", status: "Likely Required" },
        { title: "Two-year residential history", status: "Conditional", note: "May be requested if history is incomplete." },
        { title: "Primary contact information", status: "Standard" },
        ...(coBorrower === "yes"
          ? [
              { title: "Co-borrower photo ID", status: "Likely Required" as RequirementStatus },
              { title: "Co-borrower contact information", status: "Likely Required" as RequirementStatus },
              { title: "Co-borrower income documents", status: "Conditional" as RequirementStatus, note: "Needed if co-borrower income is used." },
            ]
          : []),
      ]),
    });

    const incomeItems: DocumentItem[] = [];
    if (employmentType === "w2-employee") {
      incomeItems.push(
        { title: "Most recent 30 days of pay stubs", status: "Likely Required" },
        { title: "Last 2 years W-2 forms", status: "Likely Required" },
        { title: "Written verification of employment", status: "Conditional" },
        { title: "Year-to-date earnings summary", status: "Conditional", note: "Needed if YTD is not clear on paystubs." },
      );
    }
    if (employmentType === "hourly") {
      incomeItems.push(
        { title: "Most recent 30 days of pay stubs", status: "Likely Required" },
        { title: "Last 2 years W-2 forms", status: "Likely Required" },
        { title: "Year-to-date earnings summary", status: "Likely Required" },
        { title: "Written verification of employment", status: "Likely Required" },
        { title: "Employer confirmation of hourly rate", status: "Conditional" },
        { title: "Employer confirmation of average hours worked", status: "Conditional" },
      );
      if (variableIncomePresent) {
        incomeItems.push(
          { title: "Pay stubs showing overtime, bonus, or variable earnings", status: "Likely Required" },
          { title: "Verification variable income is likely to continue", status: "Review Needed" },
        );
      }
    }
    if (employmentType === "self-employed") {
      incomeItems.push(
        { title: "Last 2 years personal federal tax returns", status: "Likely Required" },
        { title: "Last 2 years business tax returns, if applicable", status: "Likely Required" },
        { title: "Year-to-date profit and loss statement", status: "Likely Required" },
        { title: "Year-to-date balance sheet", status: "Conditional" },
        { title: "Business license or registration", status: "Conditional" },
        { title: "CPA letter", status: "Conditional" },
        { title: "Business bank statements", status: "Conditional" },
        { title: "K-1 forms for business ownership", status: "Conditional" },
      );
    }
    if (employmentType === "1099-contractor") {
      incomeItems.push(
        { title: "Last 2 years personal tax returns", status: "Likely Required" },
        { title: "1099 forms", status: "Likely Required" },
        { title: "Year-to-date profit and loss statement", status: "Likely Required" },
        { title: "Business expense breakdown", status: "Conditional" },
        { title: "Bank statements supporting current income", status: "Conditional" },
      );
    }
    if (employmentType === "commission-based") {
      incomeItems.push(
        { title: "Last 2 years W-2 forms", status: "Likely Required" },
        { title: "Pay stubs showing commission or bonus income", status: "Likely Required" },
        { title: "Year-to-date earnings", status: "Likely Required" },
        { title: "Written verification of employment", status: "Conditional" },
      );
    }
    if (employmentType === "retired") {
      incomeItems.push(
        { title: "Social Security award letter", status: "Likely Required" },
        { title: "Pension award letter", status: "Likely Required" },
        { title: "Retirement distribution statements", status: "Likely Required" },
        { title: "1099 forms", status: "Conditional" },
        { title: "Bank statements showing retirement deposits", status: "Conditional" },
      );
    }
    if (otherIncomeTotal > 0) {
      incomeItems.push({
        title: "Documentation confirming non-employment income continuation",
        status: otherIncomeContinuationYears < 3 ? "Review Needed" : "Conditional",
      });
    }
    categories.push({
      key: "income",
      title: "Income Documents",
      icon: FileText,
      items: dedupeItems(incomeItems),
    });

    categories.push({
      key: "assets",
      title: "Asset Documents",
      icon: Landmark,
      items: dedupeItems([
        { title: "Last 2 months bank statements", status: "Likely Required" },
        { title: "Investment account statements", status: "Conditional" },
        { title: "Retirement account statements", status: "Conditional" },
        { title: "Gift fund letter, if gift funds are used", status: "Conditional" },
        { title: "Evidence of transfer of gift funds", status: "Conditional" },
        ...(isJumboScenario
          ? [
              { title: "Full statements for all liquid assets", status: "Likely Required" as RequirementStatus },
              { title: "Proof of reserves after closing", status: "Likely Required" as RequirementStatus },
              { title: "Vested retirement balance documentation", status: "Conditional" as RequirementStatus },
            ]
          : []),
        ...(possibleLargeDeposit
          ? [{ title: "Source documentation for large deposit(s)", status: "Review Needed" as RequirementStatus }]
          : []),
      ]),
    });

    categories.push({
      key: "property",
      title: "Property Documents",
      icon: Home,
      items: dedupeItems([
        ...(loanPurpose === "purchase"
          ? [
              { title: "Fully executed purchase agreement", status: "Likely Required" as RequirementStatus },
              { title: "Earnest money deposit verification", status: "Likely Required" as RequirementStatus },
              { title: "Homeowners insurance quote", status: "Likely Required" as RequirementStatus },
              { title: "Property address confirmation", status: "Standard" as RequirementStatus },
            ]
          : []),
        ...(toNonNegativeNumber(annualPropertyTax) <= 0
          ? [
              { title: "Property tax bill or tax certificate", status: "Review Needed" as RequirementStatus },
              { title: "County tax assessment record", status: "Conditional" as RequirementStatus },
            ]
          : []),
        ...(propertyType === "condo"
          ? [
              { title: "HOA dues information", status: "Likely Required" as RequirementStatus },
              { title: "HOA contact information", status: "Likely Required" as RequirementStatus },
              { title: "Condo questionnaire", status: "Conditional" as RequirementStatus },
              { title: "Master insurance information", status: "Conditional" as RequirementStatus },
            ]
          : []),
        ...(isMultiUnitProperty
          ? [
              { title: "Rental schedule for subject property", status: "Conditional" as RequirementStatus },
              { title: "Existing leases, if rental income is used", status: "Conditional" as RequirementStatus },
              { title: "Appraisal with market rent analysis", status: "Conditional" as RequirementStatus },
            ]
          : []),
      ]),
    });

    if (loanPurpose !== "purchase") {
      categories.push({
        key: "refinance",
        title: "Refinance Documents",
        icon: RefreshCw,
        items: dedupeItems([
          { title: "Current mortgage statement", status: "Likely Required" },
          { title: "Payoff statement", status: "Conditional" },
          { title: "Homeowners insurance declaration page", status: "Likely Required" },
          { title: "Most recent property tax bill", status: "Conditional" },
          { title: "HOA statement, if applicable", status: "Conditional" },
          ...(loanPurpose === "cash-out-refinance"
            ? [
                { title: "Explanation of cash-out purpose", status: "Conditional" as RequirementStatus },
                { title: "Existing lien information", status: "Likely Required" as RequirementStatus },
                { title: "Home equity loan statement, if applicable", status: "Conditional" as RequirementStatus },
              ]
            : []),
        ]),
      });
    }

    if (rentalIncomeUsed || occupancyType === "investment-property" || isMultiUnitProperty) {
      categories.push({
        key: "rental",
        title: "Rental Income Documents",
        icon: Building2,
        items: dedupeItems([
          { title: "Current lease agreement", status: "Likely Required" },
          { title: "Last 2 years tax returns with Schedule E", status: "Likely Required" },
          { title: "Property management agreement, if applicable", status: "Conditional" },
          { title: "Evidence of rental receipt, if requested", status: "Conditional" },
          { title: "Appraisal market rent schedule, if needed", status: "Conditional" },
          ...(isMultiUnitProperty && occupancyType === "primary-residence"
            ? [
                { title: "Leases for non-owner-occupied units", status: "Conditional" as RequirementStatus },
                { title: "Existing tenant documentation", status: "Conditional" as RequirementStatus },
              ]
            : []),
        ]),
      });
    }

    if (isJumboScenario) {
      categories.push({
        key: "jumbo",
        title: "Jumbo Loan Documents",
        icon: Layers,
        items: dedupeItems([
          { title: "Full income documentation package", status: "Likely Required" },
          { title: "Full asset documentation package", status: "Likely Required" },
          { title: "Reserve verification", status: "Likely Required" },
          { title: "Investment and retirement statements", status: "Likely Required" },
          { title: "Additional property review documents", status: "Conditional" },
          ...(employmentType === "self-employed" || employmentType === "1099-contractor"
            ? [{ title: "Expanded self-employed income and asset review package", status: "Review Needed" as RequirementStatus }]
            : []),
        ]),
      });
    }

    categories.push({
      key: "program",
      title: "Program-Specific Documents",
      icon: BadgeCheck,
      items: dedupeItems([
        ...(selectedProgram === "conventional"
          ? [
              { title: "Standard income and asset documentation set", status: "Likely Required" as RequirementStatus },
              { title: "Insurance quote", status: "Likely Required" as RequirementStatus },
            ]
          : []),
        ...(selectedProgram === "fha"
          ? [
              { title: "FHA occupancy review documentation", status: "Conditional" as RequirementStatus },
              { title: "Explanation for derogatory credit, if applicable", status: "Conditional" as RequirementStatus },
            ]
          : []),
        ...(selectedProgram === "va"
          ? [
              { title: "Certificate of Eligibility (COE)", status: "Likely Required" as RequirementStatus },
              { title: "DD-214 or Statement of Service", status: "Conditional" as RequirementStatus },
              { title: "VA disability award letter, if used for income", status: "Conditional" as RequirementStatus },
            ]
          : []),
      ]),
    });

    categories.push({
      key: "credit",
      title: "Credit / Explanation Documents",
      icon: AlertCircle,
      items: dedupeItems([
        ...(fico < 680
          ? [
              { title: "Letter of explanation for derogatory credit, if requested", status: "Conditional" as RequirementStatus },
              { title: "Recent credit inquiry explanations", status: "Conditional" as RequirementStatus },
            ]
          : []),
        ...(backDti > 45
          ? [
              { title: "Latest debt statements", status: "Likely Required" as RequirementStatus },
              { title: "Debt payoff documentation, if debts will be paid off", status: "Conditional" as RequirementStatus },
            ]
          : []),
        ...(toNonNegativeNumber(studentDebt) > 0
          ? [{ title: "Student loan payment documentation", status: "Likely Required" as RequirementStatus }]
          : []),
        ...(toNonNegativeNumber(alimonyDebt) > 0 || toNonNegativeNumber(childSupportDebt) > 0
          ? [{ title: "Alimony/child support obligation documentation", status: "Likely Required" as RequirementStatus }]
          : []),
      ]),
    });

    categories.push({
      key: "condition-based",
      title: "Condition-Based Additional Documents",
      icon: FileCheck2,
      items: dedupeItems([
        ...(backDti > PROGRAM_RULES[selectedProgram].maxDti
          ? [
              { title: "Debt payoff proof, if used to improve DTI", status: "Review Needed" as RequirementStatus },
              { title: "Updated income documentation", status: "Likely Required" as RequirementStatus },
              { title: "Compensating factor explanation", status: "Conditional" as RequirementStatus },
            ]
          : []),
        ...(totalIncome <= monthlyHousing + totalDebt
          ? [
              { title: "Additional allowable income documentation", status: "Review Needed" as RequirementStatus },
              { title: "Reserve documentation supporting affordability", status: "Conditional" as RequirementStatus },
            ]
          : []),
        ...(reservesMonths < 2
          ? [
              { title: "Updated asset statements for reserves", status: "Review Needed" as RequirementStatus },
              { title: "Retirement asset proof, if counted for reserves", status: "Conditional" as RequirementStatus },
            ]
          : []),
        ...(possibleLargeDeposit
          ? [
              { title: "Letter of explanation for large deposit", status: "Review Needed" as RequirementStatus },
              { title: "Deposit source and transfer history", status: "Review Needed" as RequirementStatus },
            ]
          : []),
        ...(yearsWithEmployer < 2
          ? [
              { title: "Offer letter and first pay stub", status: "Likely Required" as RequirementStatus },
              { title: "Employment transition explanation", status: "Conditional" as RequirementStatus },
            ]
          : []),
        ...(toNonNegativeNumber(annualPropertyTax) <= 0
          ? [{ title: "Tax certificate or county tax bill", status: "Review Needed" as RequirementStatus }]
          : []),
        ...(toNonNegativeNumber(annualHomeInsurance) <= 0
          ? [{ title: "Insurance quote or declaration page", status: "Review Needed" as RequirementStatus }]
          : []),
      ]),
    });

    return categories.filter((category) => category.items.length > 0);
  }, [
    coBorrower,
    employmentType,
    variableIncomePresent,
    otherIncomeTotal,
    otherIncomeContinuationYears,
    isJumboScenario,
    possibleLargeDeposit,
    loanPurpose,
    propertyType,
    occupancyType,
    isMultiUnitProperty,
    rentalIncomeUsed,
    selectedProgram,
    fico,
    backDti,
    studentDebt,
    alimonyDebt,
    childSupportDebt,
    totalIncome,
    monthlyHousing,
    totalDebt,
    reservesMonths,
    yearsWithEmployer,
    annualPropertyTax,
    annualHomeInsurance,
  ]);

  const possibleConditionItems = useMemo<ConditionItem[]>(() => {
    const items: ConditionItem[] = [];
    const push = (title: string, reason: string, status: RequirementStatus) => {
      items.push({ title, reason, status });
    };

    if (employmentType === "w2-employee" || employmentType === "hourly" || employmentType === "commission-based") {
      push("Verify current employment prior to closing", "Employment status and income are often reconfirmed near funding.", "Likely Required");
      push("Provide updated pay stub if timing extends", "Income documents may need to be current at review.", "Conditional");
    }
    if (employmentType === "hourly") {
      push("Verify average hours worked", "Hourly income may be averaged when schedules vary.", "Likely Required");
      push("Verify overtime income is likely to continue", "Variable income may require continuity evidence.", "Review Needed");
      if (toNonNegativeNumber(overtimeYear2) < toNonNegativeNumber(overtimeYear1) * 0.8 && toNonNegativeNumber(overtimeYear1) > 0) {
        push("Explain decline in overtime income", "Declining overtime may reduce qualifying income.", "Review Needed");
      }
    }
    if (employmentType === "self-employed" || employmentType === "1099-contractor") {
      push("Provide updated profit and loss statement", "Current business performance may be reviewed.", "Likely Required");
      push("Provide CPA letter or business activity verification", "Business stability may require additional confirmation.", "Conditional");
      if (netIncomeY2 < netIncomeY1) {
        push("Explain decline in self-employment income", "Declining trend can affect income qualification.", "Review Needed");
      }
    }
    if (possibleLargeDeposit) {
      push("Source large deposit in checking account", "Unseasoned deposits may need source verification.", "Review Needed");
    }
    if (loanPurpose !== "purchase") {
      push("Provide current mortgage statement", "Existing lien and payment information may be reviewed.", "Likely Required");
      push("Provide payoff statement for existing loan", "Payoff amount may be needed to structure the refinance.", "Conditional");
    }
    if (rentalIncomeUsed) {
      push("Provide lease agreement and Schedule E", "Rental income may need lease and tax return support.", "Likely Required");
    }
    if (isJumboScenario) {
      push("Provide proof of reserves for jumbo scenario", "Jumbo files often require stronger post-closing reserves.", "Likely Required");
      push("Provide full asset statements", "All reserve-eligible assets may be reviewed in detail.", "Likely Required");
    }
    if (propertyType === "condo") {
      push("Verify HOA dues and condo association information", "Association expenses and eligibility can affect qualification.", "Likely Required");
    }
    if (toNonNegativeNumber(annualPropertyTax) <= 0) {
      push("Provide tax certificate for subject property", "Tax amount could not be fully confirmed and may change housing ratio.", "Review Needed");
    }
    if (toNonNegativeNumber(annualHomeInsurance) <= 0) {
      push("Provide insurance quote or declaration page", "Insurance estimate may change total housing expense.", "Review Needed");
    }
    if (backDti > 45) {
      push("Provide debt payoff documentation if debts will be reduced", "High DTI scenarios may need documented payoff strategy.", "Conditional");
      push("Provide compensating factor explanation", "Elevated DTI may require stronger offsets.", "Conditional");
    }
    if (toNonNegativeNumber(childSupportDebt) > 0) {
      push("Verify child support obligation amount", "Liability amount must be confirmed for DTI accuracy.", "Likely Required");
    }
    if (toNonNegativeNumber(studentDebt) > 0) {
      push("Verify student loan monthly payment", "Student loan payment rules may affect qualifying DTI.", "Likely Required");
    }

    for (const legacyCondition of underwritingConditions) {
      push(
        legacyCondition.replace(/\.$/, ""),
        "Additional review may be required based on the scenario details.",
        "Conditional",
      );
    }

    const map = new Map<string, ConditionItem>();
    for (const item of items) {
      if (!map.has(item.title)) map.set(item.title, item);
    }
    return Array.from(map.values());
  }, [
    employmentType,
    overtimeYear1,
    overtimeYear2,
    netIncomeY1,
    netIncomeY2,
    possibleLargeDeposit,
    loanPurpose,
    rentalIncomeUsed,
    isJumboScenario,
    propertyType,
    annualPropertyTax,
    annualHomeInsurance,
    backDti,
    childSupportDebt,
    studentDebt,
    underwritingConditions,
  ]);

  const improvementSuggestions = useMemo(
    () =>
      unique([
        ...(backDti > 45 ? ["Reduce monthly debt to improve DTI"] : []),
        ...(downPercent < 10 ? ["Increase down payment"] : []),
        ...(reservesMonths < 3 ? ["Strengthen reserves after closing"] : []),
        ...(employmentType === "self-employed" || employmentType === "1099-contractor"
          ? ["Review tax-return income and allowable add-backs"]
          : []),
        ...(variableIncomePresent ? ["Clarify variable income documentation"] : []),
        ...(toNonNegativeNumber(annualPropertyTax) <= 0 || toNonNegativeNumber(annualHomeInsurance) <= 0
          ? ["Provide more accurate tax and insurance estimates"]
          : []),
      ]),
    [backDti, downPercent, reservesMonths, employmentType, variableIncomePresent, annualPropertyTax, annualHomeInsurance],
  );

  const recommendationText =
    selectedProgram === "jumbo"
      ? "Loan amount exceeds conforming loan limit. Jumbo loan guidelines may apply."
      : selectedProgram === "fha"
        ? "FHA recommended based on credit score and DTI profile."
        : selectedProgram === "va"
          ? "VA loan may offer better terms based on veteran eligibility."
          : backDti > 45
            ? "Conventional possible but DTI is near maximum guideline."
            : "Conventional recommended based on credit and income profile.";

  const scenarioStatus =
    fico >= 680 && backDti <= 36 && downPercent >= 10 && reservesMonths >= 3
      ? "Strong Scenario"
      : fico >= 580 && backDti <= 50
        ? "Eligible with Conditions"
        : "Needs Improvement";

  const decisionFactors = [
    `Income used for qualification: ${formatCurrency(totalIncome)} monthly.`,
    `Housing payment (PITIA): ${formatCurrency(monthlyHousing)} with principal/interest ${formatCurrency(monthlyPrincipalInterest)}.`,
    ...(toNonNegativeNumber(annualPropertyTax) <= 0 ? ["Property tax was estimated using 1.25% of property value."] : []),
    ...(toNonNegativeNumber(annualHomeInsurance) <= 0 ? ["Homeowners insurance was estimated using 0.4% of property value."] : []),
    `Estimated DTI: ${formatPercent(backDti, 1)} and LTV: ${formatPercent(ltv, 1)}.`,
    `Reserve estimate: ${reservesMonths.toFixed(1)} months of housing payment.`,
    "Program fit reviewed across Conventional, FHA, VA, and Jumbo guidelines.",
  ];

  const whyDocsNeeded = [
    "Mortgage lenders review income stability, assets, property expenses, and credit profile to estimate whether a scenario appears affordable and fully documented.",
    "If your income varies from month to month, earnings may be averaged instead of using a single pay period.",
    "If you are self-employed or receive 1099 income, tax returns are often reviewed to determine qualifying income after business deductions.",
    "If you are refinancing, your current mortgage, taxes, insurance, and lien details may need verification.",
    "If property taxes or insurance are uncertain, additional documents may be requested because those costs affect debt-to-income ratio.",
  ];

  const checklistText = useMemo(() => {
    const lines: string[] = [];
    lines.push("Mortgage Scenario Checker - Pre-Decision Underwriter");
    lines.push(`Scenario status: ${scenarioStatus}`);
    lines.push(`Recommended program: ${PROGRAM_LABELS[selectedProgram]}`);
    lines.push(`Recommendation: ${recommendationText}`);
    lines.push("");
    lines.push("Documents You Will Likely Need");
    for (const category of documentCategories) {
      lines.push(`- ${category.title}`);
      for (const item of category.items) {
        lines.push(`  • [${item.status}] ${item.title}${item.note ? ` - ${item.note}` : ""}`);
      }
    }
    lines.push("");
    lines.push("Possible Underwriting Conditions");
    for (const condition of possibleConditionItems) {
      lines.push(`- [${condition.status}] ${condition.title}`);
      lines.push(`  Reason: ${condition.reason}`);
    }
    lines.push("");
    lines.push("Decision Factors");
    for (const factor of decisionFactors) {
      lines.push(`- ${factor}`);
    }
    return lines.join("\n");
  }, [
    scenarioStatus,
    selectedProgram,
    recommendationText,
    documentCategories,
    possibleConditionItems,
    decisionFactors,
  ]);

  const handleDownloadChecklist = () => {
    if (typeof window === "undefined") return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const exportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Mortgage Scenario Checker", 14, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on ${exportDate}  |  PennyFloat.com`, 14, 25);
    doc.setTextColor(0, 0, 0);

    let currentY = 32;

    // Summary table
    autoTable(doc, {
      startY: currentY,
      head: [["Scenario Summary", ""]],
      body: [
        ["Status", scenarioStatus],
        ["Recommended Program", PROGRAM_LABELS[selectedProgram]],
        ["Recommendation", recommendationText],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 100, 180], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 }, 1: { cellWidth: "auto" } },
      margin: { left: 14, right: 14 },
    });
    currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // Documents section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Documents You Will Likely Need", 14, currentY);
    currentY += 4;

    for (const category of documentCategories) {
      const rows = category.items.map((item) => {
        const tag =
          item.status === "Likely Required"
            ? "LIKELY"
            : item.status === "Review Needed"
              ? "REVIEW"
              : item.status === "Standard"
                ? "STANDARD"
                : "IF APPLICABLE";
        return [tag, item.title + (item.note ? `  --  ${item.note}` : "")];
      });

      autoTable(doc, {
        startY: currentY,
        head: [[{ content: category.title, colSpan: 2 }]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [60, 80, 120], textColor: 255, fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: "bold" },
          1: { cellWidth: "auto" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 0) {
            const tag = data.cell.text[0];
            if (tag === "LIKELY") data.cell.styles.textColor = [30, 100, 30];
            else if (tag === "REVIEW" || tag === "IF APPLICABLE") data.cell.styles.textColor = [100, 80, 20];
            else data.cell.styles.textColor = [70, 70, 70];
          }
        },
        margin: { left: 14, right: 14 },
      });
      currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
    }

    currentY += 4;

    // Underwriting conditions
    if (currentY > 250) { doc.addPage(); currentY = 18; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Possible Underwriting Conditions", 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [["Condition", "Reason"]],
      body: possibleConditionItems.map((c) => [c.title, c.reason]),
      theme: "striped",
      headStyles: { fillColor: [30, 100, 180], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: "auto" } },
      margin: { left: 14, right: 14 },
    });
    currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // Decision factors
    if (currentY > 250) { doc.addPage(); currentY = 18; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Decision Factors", 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      body: decisionFactors.map((f) => [`-  ${f}`]),
      theme: "plain",
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    // Footer on every page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text(
        "For educational purposes only. Not a lending commitment. Subject to full underwriting. PennyFloat.com",
        14,
        doc.internal.pageSize.getHeight() - 8
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        doc.internal.pageSize.getWidth() - 28,
        doc.internal.pageSize.getHeight() - 8
      );
    }

    doc.save("mortgage-scenario-checklist.pdf");
  };

  const handleEmailChecklist = () => {
    if (typeof window === "undefined") return;
    const subject = encodeURIComponent("Mortgage Scenario Checker Checklist");
    const body = encodeURIComponent(checklistText.slice(0, 4000));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleSpeakWithLoanOfficer = () => {
    if (typeof window === "undefined") return;
    window.location.href = "/loan";
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <main className="py-10 md:py-14">
        <div className="container mx-auto max-w-7xl px-4 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">
              Mortgage Pre Approval Houston TX Scenario Checker
            </h1>
            <p className="text-sm text-slate-600">
              Built for home loan Houston Texas planning, including mortgage rates Houston today context, best mortgage brokers Houston 2026 comparison points, and refinance mortgage Houston TX preparation.
            </p>
            <Card className="p-4 border-amber-200 bg-amber-50">
              <p className="text-sm text-amber-900">
                This tool provides an estimate for educational and pre-qualification purposes only. Results are not a lending
                commitment and are subject to full underwriting, documentation verification, credit review, property review,
                and lender guidelines.
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="p-5 border-slate-200 bg-white space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Step 1 Borrower Profile</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state-code">State</Label>
                  <Input
                    id="state-code"
                    maxLength={2}
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip-code">ZIP code</Label>
                  <Input
                    id="zip-code"
                    maxLength={10}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/[^0-9-]/g, "").slice(0, 10))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Applying with co-borrower?</Label>
                  <Select value={coBorrower} onValueChange={(v) => setCoBorrower(v as YesNo)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Military status</Label>
                  <Select value={militaryStatus} onValueChange={(v) => setMilitaryStatus(v as MilitaryStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="veteran">Veteran</SelectItem>
                      <SelectItem value="active-duty">Active Duty</SelectItem>
                      <SelectItem value="surviving-spouse">Surviving Spouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>First time homebuyer?</Label>
                  <Select value={firstTimeHomebuyer} onValueChange={(v) => setFirstTimeHomebuyer(v as YesNo)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employment type</Label>
                  <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as EmploymentType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="w2-employee">W-2 employee</SelectItem>
                      <SelectItem value="self-employed">Self employed</SelectItem>
                      <SelectItem value="1099-contractor">1099 contractor</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="commission-based">Commission based</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                    </SelectContent>
                  </Select>
                  {employmentType === "hourly" ? (
                    <p className="text-xs text-slate-500">
                      Hourly wage details are completed in Step 3 Financial Profile.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Years with current employer</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={yearsWithEmployer}
                    onChange={(e) => setYearsWithEmployer(toNonNegativeNumber(Number(e.target.value)))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Years in same industry</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={yearsInIndustry}
                    onChange={(e) => setYearsInIndustry(toNonNegativeNumber(Number(e.target.value)))}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5 border-slate-200 bg-white space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Step 2 Property and Loan Scenario</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Loan purpose</Label>
                  <Select value={loanPurpose} onValueChange={(v) => setLoanPurpose(v as LoanPurpose)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="refinance">Refinance</SelectItem>
                      <SelectItem value="cash-out-refinance">Cash-out refinance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Property type</Label>
                  <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-family">Single family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhome">Townhome</SelectItem>
                      <SelectItem value="2-unit">2-unit</SelectItem>
                      <SelectItem value="3-unit">3-unit</SelectItem>
                      <SelectItem value="4-unit">4-unit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Occupancy</Label>
                  <Select value={occupancyType} onValueChange={(v) => setOccupancyType(v as OccupancyType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary-residence">Primary residence</SelectItem>
                      <SelectItem value="second-home">Second home</SelectItem>
                      <SelectItem value="investment-property">Investment property</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Purchase price or property value</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={propertyValue}
                    onChange={(e) => {
                      const value = toNonNegativeNumber(Number(e.target.value));
                      setPropertyValue(value);
                      setDownPaymentAmount(Math.max(0, value - desiredLoanAmount));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desired loan amount</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={desiredLoanAmount}
                    onChange={(e) => {
                      const value = toNonNegativeNumber(Number(e.target.value));
                      setDesiredLoanAmount(value);
                      setDownPaymentAmount(Math.max(0, propertyValue - value));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Down payment amount</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={downPaymentAmount}
                    onChange={(e) => {
                      const value = Math.min(toNonNegativeNumber(Number(e.target.value)), toNonNegativeNumber(propertyValue));
                      setDownPaymentAmount(value);
                      setDesiredLoanAmount(Math.max(0, propertyValue - value));
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Loan term</Label>
                  <Select value={String(loanTermYears)} onValueChange={(v) => setLoanTermYears(toPositiveInt(Number(v), 30))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 years</SelectItem>
                      <SelectItem value="20">20 years</SelectItem>
                      <SelectItem value="15">15 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated interest rate</Label>
                  <Input type="number" min={0} max={100} step={0.01} value={interestRate} onChange={(e) => setInterestRate(toNonNegativeNumber(Number(e.target.value)))} />
                </div>
                <div className="space-y-2">
                  <Label>Conforming loan limit</Label>
                  <Input type="number" min={0} step={1000} value={conformingLoanLimit} onChange={(e) => setConformingLoanLimit(toNonNegativeNumber(Number(e.target.value)))} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Annual property tax</Label>
                  <Input type="number" min={0} step={100} value={annualPropertyTax} onChange={(e) => setAnnualPropertyTax(toNonNegativeNumber(Number(e.target.value)))} />
                </div>
                <div className="space-y-2">
                  <Label>Annual homeowners insurance</Label>
                  <Input type="number" min={0} step={100} value={annualHomeInsurance} onChange={(e) => setAnnualHomeInsurance(toNonNegativeNumber(Number(e.target.value)))} />
                </div>
                <div className="space-y-2">
                  <Label>Monthly HOA</Label>
                  <Input type="number" min={0} step={25} value={monthlyHoa} onChange={(e) => setMonthlyHoa(toNonNegativeNumber(Number(e.target.value)))} />
                </div>
              </div>

              {loanPurpose !== "purchase" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Current mortgage balance</Label>
                    <Input type="number" min={0} step={1000} value={currentMortgageBalance} onChange={(e) => setCurrentMortgageBalance(toNonNegativeNumber(Number(e.target.value)))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Current interest rate</Label>
                    <Input type="number" min={0} max={100} step={0.01} value={currentInterestRate} onChange={(e) => setCurrentInterestRate(toNonNegativeNumber(Number(e.target.value)))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Current monthly mortgage payment</Label>
                    <Input type="number" min={0} step={25} value={currentMonthlyMortgagePayment} onChange={(e) => setCurrentMonthlyMortgagePayment(toNonNegativeNumber(Number(e.target.value)))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cash out requested</Label>
                    <Input type="number" min={0} step={1000} value={cashOutRequested} onChange={(e) => setCashOutRequested(toNonNegativeNumber(Number(e.target.value)))} />
                  </div>
                </div>
              ) : null}

              {specialDocumentTriggers.length > 0 ? (
                <Card className="p-3 border-teal-200 bg-teal-50">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                    Triggered document requirements
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-teal-900">
                    {specialDocumentTriggers.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </Card>
          </div>

          <Card className="p-5 border-slate-200 bg-white space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Step 3 Financial Profile</h2>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Card className="p-4 border-slate-200 bg-slate-50 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Credit & Income</h3>
                <div className="space-y-2">
                  <Label>Credit score range</Label>
                  <Select value={creditRange} onValueChange={(v) => setCreditRange(v as CreditRange)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="below-580">Below 580</SelectItem>
                      <SelectItem value="580-619">580-619</SelectItem>
                      <SelectItem value="620-639">620-639</SelectItem>
                      <SelectItem value="640-679">640-679</SelectItem>
                      <SelectItem value="680-719">680-719</SelectItem>
                      <SelectItem value="720-739">720-739</SelectItem>
                      <SelectItem value="740-plus">740+</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Estimated FICO used: {fico}</p>
                </div>

                {employmentType === "w2-employee" ? (
                  <div className="space-y-2">
                    <Label>Annual salary</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={annualSalary}
                      onChange={(e) => setAnnualSalary(toNonNegativeNumber(Number(e.target.value)))}
                    />
                    <p className="text-xs text-slate-500">
                      Salaried income is typically considered stable when employment history is consistent.
                    </p>
                  </div>
                ) : null}

                {employmentType !== "w2-employee" && employmentType !== "hourly" ? (
                  <div className="space-y-2">
                    <Label>Borrower gross monthly income</Label>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={borrowerGrossMonthlyIncome}
                      onChange={(e) => setBorrowerGrossMonthlyIncome(toNonNegativeNumber(Number(e.target.value)))}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Co borrower gross monthly income</Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={coBorrowerGrossMonthlyIncome}
                    disabled={coBorrower !== "yes"}
                    onChange={(e) => setCoBorrowerGrossMonthlyIncome(toNonNegativeNumber(Number(e.target.value)))}
                  />
                </div>

                {employmentType === "hourly" ? (
                  <div className="rounded-md border border-slate-200 bg-white p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Hourly wage analysis</p>
                    <div className="space-y-2">
                      <Label>Hourly wage rate</Label>
                      <Input type="number" min={0} step={0.01} value={hourlyRate} onChange={(e) => setHourlyRate(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Average hours worked per week</Label>
                      <Input type="number" min={0} step={0.1} value={averageHoursPerWeek} onChange={(e) => setAverageHoursPerWeek(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Overtime income (Year 1)</Label>
                      <Input type="number" min={0} step={100} value={overtimeYear1} onChange={(e) => setOvertimeYear1(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Overtime income (Year 2)</Label>
                      <Input type="number" min={0} step={100} value={overtimeYear2} onChange={(e) => setOvertimeYear2(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bonus income (Year 1)</Label>
                      <Input type="number" min={0} step={100} value={bonusYear1} onChange={(e) => setBonusYear1(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bonus income (Year 2)</Label>
                      <Input type="number" min={0} step={100} value={bonusYear2} onChange={(e) => setBonusYear2(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Commission income (Year 1)</Label>
                      <Input type="number" min={0} step={100} value={commissionYear1} onChange={(e) => setCommissionYear1(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Commission income (Year 2)</Label>
                      <Input type="number" min={0} step={100} value={commissionYear2} onChange={(e) => setCommissionYear2(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Hours vary significantly month to month?</Label>
                      <Select value={hoursVarySignificantly} onValueChange={(v) => setHoursVarySignificantly(v as YesNo)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>YTD earnings (optional)</Label>
                      <Input type="number" value={hourlyYtdEarnings} onChange={(e) => setHourlyYtdEarnings(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>YTD months covered</Label>
                      <Input type="number" min={1} step={1} value={hourlyYtdMonths} onChange={(e) => setHourlyYtdMonths(toPositiveInt(Number(e.target.value), 1))} />
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 space-y-1">
                      <p>Base hourly income: {formatCurrency(hourlyIncomeAnalysis.baseMonthly)}</p>
                      <p>Avg overtime income: {formatCurrency(hourlyIncomeAnalysis.overtimeMonthly)}</p>
                      <p>Avg bonus income: {formatCurrency(hourlyIncomeAnalysis.bonusMonthly)}</p>
                      <p>Avg commission income: {formatCurrency(hourlyIncomeAnalysis.commissionMonthly)}</p>
                      <p className="font-semibold">Final qualifying income: {formatCurrency(hourlyIncomeAnalysis.totalMonthly)}</p>
                    </div>
                  </div>
                ) : null}

                {employmentType === "self-employed" || employmentType === "1099-contractor" ? (
                  <div className="rounded-md border border-slate-200 bg-white p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Self-employed / 1099 inputs (annual)</p>
                    <div className="space-y-2">
                      <Label>Net income year 1</Label>
                      <Input type="number" min={0} step={1000} value={netIncomeY1} onChange={(e) => setNetIncomeY1(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Net income year 2</Label>
                      <Input type="number" min={0} step={1000} value={netIncomeY2} onChange={(e) => setNetIncomeY2(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Depreciation add-back</Label>
                      <Input type="number" min={0} step={100} value={addBackDepreciation} onChange={(e) => setAddBackDepreciation(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Business use of home add-back</Label>
                      <Input type="number" min={0} step={100} value={addBackBusinessHome} onChange={(e) => setAddBackBusinessHome(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Depletion add-back</Label>
                      <Input type="number" min={0} step={100} value={addBackDepletion} onChange={(e) => setAddBackDepletion(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Reported annual revenue</Label>
                      <Input type="number" min={0} step={1000} value={reportedAnnualRevenue} onChange={(e) => setReportedAnnualRevenue(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax return AGI (annual)</Label>
                      <Input type="number" min={0} step={1000} value={annualTaxReturnAgi} onChange={(e) => setAnnualTaxReturnAgi(toNonNegativeNumber(Number(e.target.value)))} />
                    </div>
                  </div>
                ) : null}

                {employmentType === "self-employed" || employmentType === "1099-contractor" ? (
                  <p className="text-xs text-slate-500">
                    Self-employed income rule: average last 2 years net income plus depreciation, business use of home, and depletion add-backs.
                  </p>
                ) : null}
                {employmentType === "hourly" ? (
                  <p className="text-xs text-slate-500">
                    Hourly qualifying income = (hourly rate x average hours x 52 / 12) + avg overtime + avg bonus + avg commission.
                  </p>
                ) : null}
                {hasLowAgiVersusRevenue ? (
                  <p className="text-xs text-amber-700">Business deductions may reduce qualifying income.</p>
                ) : null}
              </Card>

              <Card className="p-4 border-slate-200 bg-slate-50 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Debt Section</h3>
                <div className="space-y-2"><Label>Monthly car payments</Label><Input type="number" min={0} step={25} value={carDebt} onChange={(e) => setCarDebt(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Student loan payments</Label><Input type="number" min={0} step={25} value={studentDebt} onChange={(e) => setStudentDebt(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Credit card minimums</Label><Input type="number" min={0} step={25} value={creditCardDebt} onChange={(e) => setCreditCardDebt(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Personal loans</Label><Input type="number" min={0} step={25} value={personalDebt} onChange={(e) => setPersonalDebt(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Child support</Label><Input type="number" min={0} step={25} value={childSupportDebt} onChange={(e) => setChildSupportDebt(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Alimony</Label><Input type="number" min={0} step={25} value={alimonyDebt} onChange={(e) => setAlimonyDebt(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Other obligations</Label><Input type="number" min={0} step={25} value={otherDebt} onChange={(e) => setOtherDebt(toNonNegativeNumber(Number(e.target.value)))} /></div>
              </Card>

              <Card className="p-4 border-slate-200 bg-slate-50 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Assets & Rental Income</h3>
                <div className="space-y-2"><Label>Checking</Label><Input type="number" min={0} step={100} value={checking} onChange={(e) => setChecking(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Savings</Label><Input type="number" min={0} step={100} value={savings} onChange={(e) => setSavings(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Retirement accounts</Label><Input type="number" min={0} step={100} value={retirement} onChange={(e) => setRetirement(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Investment accounts</Label><Input type="number" min={0} step={100} value={investment} onChange={(e) => setInvestment(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Cash available for down payment and closing</Label><Input type="number" min={0} step={100} value={cashForClosing} onChange={(e) => setCashForClosing(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2"><Label>Estimated reserves after closing</Label><Input type="number" min={0} step={100} value={reservesAfterClosing} onChange={(e) => setReservesAfterClosing(toNonNegativeNumber(Number(e.target.value)))} /></div>
                <div className="space-y-2">
                  <Label>Rental income source</Label>
                  <Select value={rentalIncomeSource} onValueChange={(v) => setRentalIncomeSource(v as "gross-rent" | "schedule-e-net")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gross-rent">Gross rent (use 75%)</SelectItem>
                      <SelectItem value="schedule-e-net">Schedule E net income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {rentalIncomeSource === "gross-rent" ? (
                  <div className="space-y-2">
                    <Label>Expected monthly rent</Label>
                    <Input type="number" step={50} value={expectedRent} onChange={(e) => setExpectedRent(toNonNegativeNumber(Number(e.target.value)))} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Schedule E net monthly income</Label>
                    <Input type="number" step={50} value={scheduleENetMonthlyIncome} onChange={(e) => setScheduleENetMonthlyIncome(Number(e.target.value))} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Social Security income (monthly)</Label>
                  <Input type="number" min={0} step={50} value={socialSecurityIncome} onChange={(e) => setSocialSecurityIncome(toNonNegativeNumber(Number(e.target.value)))} />
                </div>
                <div className="space-y-2">
                  <Label>Pension income (monthly)</Label>
                  <Input type="number" min={0} step={50} value={pensionIncome} onChange={(e) => setPensionIncome(toNonNegativeNumber(Number(e.target.value)))} />
                </div>
                <div className="space-y-2">
                  <Label>Disability income (monthly)</Label>
                  <Input type="number" min={0} step={50} value={disabilityIncome} onChange={(e) => setDisabilityIncome(toNonNegativeNumber(Number(e.target.value)))} />
                </div>
                <div className="space-y-2">
                  <Label>Alimony/child support income included (monthly)</Label>
                  <Input type="number" min={0} step={50} value={alimonyChildSupportIncome} onChange={(e) => setAlimonyChildSupportIncome(toNonNegativeNumber(Number(e.target.value)))} />
                </div>
                <div className="space-y-2">
                  <Label>Years remaining for other income</Label>
                  <Input type="number" min={0} step={0.5} value={otherIncomeContinuationYears} onChange={(e) => setOtherIncomeContinuationYears(toNonNegativeNumber(Number(e.target.value)))} />
                </div>
                <p className="text-xs text-slate-500">
                  Rental income is reduced by 25% to account for vacancy and maintenance when gross rent is used.
                </p>
              </Card>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Step 4 Underwriting Analysis</p>
                <h2 className="text-xl font-semibold text-slate-900">Recommended Program: {PROGRAM_LABELS[selectedProgram]}</h2>
                <p className="text-sm text-slate-600 mt-1">{recommendationText}</p>
              </div>
              <Badge className={`border ${scenarioStatus === "Strong Scenario" ? "border-emerald-200 bg-emerald-100 text-emerald-800" : scenarioStatus === "Eligible with Conditions" ? "border-amber-200 bg-amber-100 text-amber-800" : "border-red-200 bg-red-100 text-red-800"}`}>
                {scenarioStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Card className="p-3 border-slate-200 bg-slate-50"><p className="text-xs text-slate-500">Estimated Monthly Income Used</p><p className="text-sm font-semibold text-slate-900">{formatCurrency(totalIncome)}</p></Card>
              <Card className="p-3 border-slate-200 bg-slate-50"><p className="text-xs text-slate-500">Estimated Housing Payment (PITIA)</p><p className="text-sm font-semibold text-slate-900">{formatCurrency(monthlyHousing)}</p></Card>
              <Card className="p-3 border-slate-200 bg-slate-50"><p className="text-xs text-slate-500">Estimated DTI</p><p className="text-sm font-semibold text-slate-900">{formatPercent(backDti, 1)}</p></Card>
              <Card className="p-3 border-slate-200 bg-slate-50"><p className="text-xs text-slate-500">Estimated LTV</p><p className="text-sm font-semibold text-slate-900">{formatPercent(ltv, 1)}</p></Card>
              <Card className="p-3 border-slate-200 bg-slate-50"><p className="text-xs text-slate-500">Reserve Estimate</p><p className="text-sm font-semibold text-slate-900">{reservesMonths.toFixed(1)} months</p></Card>
            </div>

            <p className="text-xs text-slate-500">
              Reserve guideline reference: Conventional often 2-6 months, FHA often minimal, VA scenario-dependent,
              Jumbo often 6-12 months.
            </p>

            <Card className="p-3 border-slate-200 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Decision Factors</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {decisionFactors.map((factor) => <li key={factor}>{factor}</li>)}
              </ul>
            </Card>

            {conditionFlags.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Risk Flags</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                  {conditionFlags.map((flag) => <li key={flag}>{flag}</li>)}
                </ul>
              </div>
            ) : null}
          </Card>

          <Card className="p-5 border-slate-200 bg-white space-y-4">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-teal-700" />
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Step 5 Document & Condition Generator</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card className="p-4 border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-slate-700" />
                  <h3 className="text-sm font-semibold text-slate-900">A. Documents You Will Likely Need</h3>
                </div>
                <Accordion type="multiple" className="w-full">
                  {documentCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <AccordionItem key={category.key} value={category.key}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2 text-left">
                            <Icon className="h-4 w-4 text-slate-600" />
                            <span>{category.title}</span>
                            <Badge className="ml-1 border border-slate-200 bg-slate-100 text-slate-700">{category.items.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {category.items.map((item) => (
                              <div key={`${category.key}-${item.title}`} className="rounded-md border border-slate-200 bg-white p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm text-slate-800">{item.title}</p>
                                  <Badge className={`border ${statusBadgeClass(item.status)}`}>{item.status}</Badge>
                                </div>
                                {item.note ? <p className="mt-1 text-xs text-slate-500">{item.note}</p> : null}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </Card>

              <Card className="p-4 border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-slate-700" />
                  <h3 className="text-sm font-semibold text-slate-900">B. Possible Underwriting Conditions</h3>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="possible-conditions">
                    <AccordionTrigger>View possible conditions and reasons</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {possibleConditionItems.map((item) => (
                          <div key={item.title} className="rounded-md border border-slate-200 bg-white p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900">{item.title}</p>
                              <Badge className={`border ${statusBadgeClass(item.status)}`}>{item.status}</Badge>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                {conditionFlags.length > 0 ? (
                  <Card className="p-3 border-amber-200 bg-amber-50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">File-Specific Warnings</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-amber-900">
                      {conditionFlags.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </Card>
                ) : null}
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card className="p-4 border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-700" />
                  <h3 className="text-sm font-semibold text-slate-900">C. Why These Documents May Be Needed</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                  {whyDocsNeeded.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500">
                  Base auto-checklist currently contains {documentChecklist.length} core items before category expansion.
                </p>
              </Card>

              <Card className="p-4 border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-slate-700" />
                  <h3 className="text-sm font-semibold text-slate-900">D. Recommended Next Steps</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={handleDownloadChecklist} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download My Checklist
                  </Button>
                  <Button onClick={handleEmailChecklist} variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Email My Checklist Draft
                  </Button>
                  <Button onClick={handleSpeakWithLoanOfficer} variant="outline" className="w-full">
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Compare Lenders Safely
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Secure loan application flow, soft credit inquiry only, and no impact to credit score for comparison steps. PennyFloat is not a lender just connection platform.
                </p>
                {improvementSuggestions.length > 0 ? (
                  <Card className="p-3 border-amber-200 bg-amber-50">
                    <h4 className="text-sm font-semibold text-amber-900">What may improve your scenario</h4>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-amber-900">
                      {improvementSuggestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </Card>
                ) : null}
              </Card>
            </div>
          </Card>

          <Card className="p-4 border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-600">
              Compliance note: This tool intentionally does not request Social Security Number or full Date of Birth.
              Lender outcomes require full application data, disclosures, and verified underwriting documentation.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
