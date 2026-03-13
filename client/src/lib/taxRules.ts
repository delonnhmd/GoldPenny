export type FilingStatus =
  | "single"
  | "married-filing-jointly"
  | "married-filing-separately"
  | "head-of-household";

/**
 * Yearly update note:
 * Update this file first when tax-year rules change.
 * Money Tools tax estimator logic reads bracket, deduction, and limit values from these configs.
 */

export type DeductionCategory = "adjustment" | "itemized" | "business";

export interface TaxBracket {
  upTo: number | null;
  rate: number;
}

export interface DeductionDefinition {
  id: string;
  label: string;
  category: DeductionCategory;
  inputType: "currency";
  appliesTo: Array<"all" | "self-employed" | "itemized" | "adjustment" | "business">;
  helpText?: string;
  eligibilityNote?: string;
  taxYearNote?: string;
  limitLogicKey?: string;
  isAdvanced?: boolean;
  defaultValue: number;
}

export interface TaxYearConfig {
  year: number;
  standardDeduction: Record<FilingStatus, number>;
  additionalStandardDeduction: {
    age65OrBlind: Record<FilingStatus, number>;
  };
  brackets: Record<FilingStatus, TaxBracket[]>;
  selfEmployment: {
    socialSecurityRate: number;
    medicareRate: number;
    socialSecurityWageBase: number;
    netEarningsFactor: number;
    deductibleHalfRate: number;
  };
  limits: {
    saltCap: number;
    studentLoanInterestCap: number;
    educatorExpenseCap: number;
    iraContributionCap: number;
    hsaContributionCapSingle: number;
    hsaContributionCapFamily: number;
    movingExpenseMilitaryOnly: boolean;
  };
  simplifiedStateRates: Record<string, number>;
}

const TAX_CONFIG_2026: TaxYearConfig = {
  year: 2026,
  standardDeduction: {
    single: 15500,
    "married-filing-jointly": 31000,
    "married-filing-separately": 15500,
    "head-of-household": 23300,
  },
  additionalStandardDeduction: {
    age65OrBlind: {
      single: 1950,
      "married-filing-jointly": 1550,
      "married-filing-separately": 1550,
      "head-of-household": 1950,
    },
  },
  brackets: {
    single: [
      { upTo: 11600, rate: 0.1 },
      { upTo: 47150, rate: 0.12 },
      { upTo: 100525, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243725, rate: 0.32 },
      { upTo: 609350, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ],
    "married-filing-jointly": [
      { upTo: 23200, rate: 0.1 },
      { upTo: 94300, rate: 0.12 },
      { upTo: 201050, rate: 0.22 },
      { upTo: 383900, rate: 0.24 },
      { upTo: 487450, rate: 0.32 },
      { upTo: 731200, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ],
    "married-filing-separately": [
      { upTo: 11600, rate: 0.1 },
      { upTo: 47150, rate: 0.12 },
      { upTo: 100525, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243725, rate: 0.32 },
      { upTo: 365600, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ],
    "head-of-household": [
      { upTo: 16550, rate: 0.1 },
      { upTo: 63100, rate: 0.12 },
      { upTo: 100500, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243700, rate: 0.32 },
      { upTo: 609350, rate: 0.35 },
      { upTo: null, rate: 0.37 },
    ],
  },
  selfEmployment: {
    socialSecurityRate: 0.124,
    medicareRate: 0.029,
    socialSecurityWageBase: 176100,
    netEarningsFactor: 0.9235,
    deductibleHalfRate: 0.5,
  },
  limits: {
    saltCap: 10000,
    studentLoanInterestCap: 2500,
    educatorExpenseCap: 300,
    iraContributionCap: 7000,
    hsaContributionCapSingle: 4300,
    hsaContributionCapFamily: 8550,
    movingExpenseMilitaryOnly: true,
  },
  simplifiedStateRates: {
    CA: 0.065,
    NY: 0.06,
    NJ: 0.057,
    IL: 0.0495,
    MA: 0.05,
    PA: 0.0307,
    TX: 0,
    FL: 0,
    WA: 0,
    NV: 0,
  },
};

const TAX_CONFIG_2025: TaxYearConfig = {
  ...TAX_CONFIG_2026,
  year: 2025,
};

export const TAX_CONFIG_BY_YEAR: Record<number, TaxYearConfig> = {
  2025: TAX_CONFIG_2025,
  2026: TAX_CONFIG_2026,
};

export function getTaxYearConfig(year: number): TaxYearConfig {
  return TAX_CONFIG_BY_YEAR[year] ?? TAX_CONFIG_2026;
}

export const ADJUSTMENT_DEDUCTIONS: DeductionDefinition[] = [
  {
    id: "traditional-ira",
    label: "Traditional IRA contributions",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["all", "adjustment"],
    helpText: "Subject to annual contribution limits and phaseout rules.",
    limitLogicKey: "ira-cap",
    defaultValue: 0,
  },
  {
    id: "hsa-contributions",
    label: "HSA contributions",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["all", "adjustment"],
    helpText: "Requires HSA-eligible high deductible health plan.",
    limitLogicKey: "hsa-cap",
    defaultValue: 0,
  },
  {
    id: "student-loan-interest",
    label: "Student loan interest",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["all", "adjustment"],
    helpText: "Income limits and annual cap may apply.",
    limitLogicKey: "student-loan-cap",
    defaultValue: 0,
  },
  {
    id: "educator-expenses",
    label: "Educator expenses",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["all", "adjustment"],
    helpText: "Qualified educator classroom expenses only.",
    limitLogicKey: "educator-cap",
    defaultValue: 0,
  },
  {
    id: "self-employed-health-insurance",
    label: "Self-employed health insurance",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["self-employed", "adjustment"],
    helpText: "Only for qualifying self-employed situations.",
    defaultValue: 0,
  },
  {
    id: "sep-ira",
    label: "SEP IRA contributions",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["self-employed", "adjustment"],
    defaultValue: 0,
  },
  {
    id: "simple-ira",
    label: "SIMPLE IRA contributions",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["self-employed", "adjustment"],
    defaultValue: 0,
  },
  {
    id: "solo-401k",
    label: "Solo 401(k) contributions",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["self-employed", "adjustment"],
    defaultValue: 0,
  },
  {
    id: "keogh-contributions",
    label: "Keogh contributions",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["self-employed", "adjustment"],
    defaultValue: 0,
  },
  {
    id: "alimony-paid",
    label: "Alimony paid",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["all", "adjustment"],
    taxYearNote: "Tax-year dependent legacy treatment may apply.",
    defaultValue: 0,
  },
  {
    id: "early-withdrawal-penalty",
    label: "Penalty on early withdrawal of savings",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["all", "adjustment"],
    defaultValue: 0,
  },
  {
    id: "jury-duty-pay",
    label: "Jury duty pay returned to employer",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["all", "adjustment"],
    defaultValue: 0,
  },
  {
    id: "moving-expenses",
    label: "Moving expenses",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["all", "adjustment"],
    taxYearNote: "Military-only in most recent tax years.",
    limitLogicKey: "moving-military-only",
    defaultValue: 0,
  },
  {
    id: "half-se-tax",
    label: "Self-employment half of SE tax deduction",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["self-employed", "adjustment"],
    helpText: "Calculated automatically from estimated self-employment tax.",
    limitLogicKey: "auto-half-se-tax",
    defaultValue: 0,
  },
  {
    id: "other-adjustments",
    label: "Other adjustments",
    category: "adjustment",
    inputType: "currency",
    appliesTo: ["all", "adjustment"],
    isAdvanced: true,
    defaultValue: 0,
  },
];

export const ITEMIZED_DEDUCTIONS: DeductionDefinition[] = [
  {
    id: "medical-expenses-paid",
    label: "Medical expenses paid",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    helpText: "Only qualified unreimbursed medical expenses apply.",
    defaultValue: 0,
  },
  {
    id: "dental-expenses",
    label: "Dental expenses",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "vision-expenses",
    label: "Vision expenses",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "prescription-expenses",
    label: "Prescription expenses",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "medical-travel-mileage",
    label: "Medical travel/mileage",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "ltc-premiums",
    label: "Long-term care premiums",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "other-qualified-medical",
    label: "Other qualified medical expenses",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "state-income-taxes-paid",
    label: "State income taxes paid",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    limitLogicKey: "salt-cap",
    defaultValue: 0,
  },
  {
    id: "state-sales-tax-paid",
    label: "State sales tax paid",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    limitLogicKey: "salt-cap",
    defaultValue: 0,
  },
  {
    id: "real-estate-property-tax",
    label: "Real estate/property tax",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    limitLogicKey: "salt-cap",
    defaultValue: 0,
  },
  {
    id: "personal-property-tax",
    label: "Personal property tax",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    limitLogicKey: "salt-cap",
    defaultValue: 0,
  },
  {
    id: "other-deductible-taxes",
    label: "Other deductible taxes",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    limitLogicKey: "salt-cap",
    defaultValue: 0,
  },
  {
    id: "mortgage-interest",
    label: "Mortgage interest",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    helpText: "Generally applies to qualifying home mortgage interest.",
    defaultValue: 0,
  },
  {
    id: "mortgage-points",
    label: "Mortgage points",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "mortgage-insurance-premiums",
    label: "Mortgage insurance premiums",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    taxYearNote: "Tax-year dependent treatment.",
    defaultValue: 0,
  },
  {
    id: "investment-interest-expense",
    label: "Investment interest expense",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "casualty-loss",
    label: "Casualty/theft losses in qualified disaster area",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "gambling-losses",
    label: "Gambling losses up to winnings",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "other-itemized-deductions",
    label: "Other itemized deductions",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    isAdvanced: true,
    defaultValue: 0,
  },
  {
    id: "cash-donations",
    label: "Cash donations",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "non-cash-donations",
    label: "Non-cash donations",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "charitable-mileage",
    label: "Mileage for charitable service",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "charitable-carryover",
    label: "Carryover charitable deductions",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    defaultValue: 0,
  },
  {
    id: "other-charitable-giving",
    label: "Other charitable giving",
    category: "itemized",
    inputType: "currency",
    appliesTo: ["all", "itemized"],
    isAdvanced: true,
    defaultValue: 0,
  },
];

export const BUSINESS_DEDUCTIONS: DeductionDefinition[] = [
  { id: "home-office-expense", label: "Home office expense", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], helpText: "Mixed personal/business use may require allocation.", defaultValue: 0 },
  { id: "office-supplies", label: "Office supplies", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "software-subscriptions", label: "Software and subscriptions", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "advertising-marketing", label: "Advertising and marketing", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "website-hosting-domain", label: "Website hosting/domain", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "professional-fees", label: "Professional fees", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "accounting-bookkeeping", label: "Accounting/bookkeeping fees", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "legal-fees", label: "Legal fees", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "business-insurance", label: "Insurance", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "business-phone", label: "Business phone", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "internet-for-business", label: "Internet for business", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], helpText: "Only business-use percentage is typically deductible.", defaultValue: 0 },
  { id: "equipment-purchases", label: "Equipment purchases", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "depreciation-179", label: "Depreciation / Section 179", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "vehicle-expenses", label: "Vehicle expenses", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], helpText: "Mixed-use vehicles typically require allocation.", defaultValue: 0 },
  { id: "mileage", label: "Mileage", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "travel", label: "Travel", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "lodging", label: "Lodging", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "business-meals", label: "Business meals", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], taxYearNote: "Deductibility percentage can vary by rule period.", defaultValue: 0 },
  { id: "contract-labor", label: "Contract labor", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "wages-paid", label: "Wages paid", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "rent-office-storage", label: "Rent for office/storage", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "utilities-office", label: "Utilities for office", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "business-loan-interest", label: "Business loan interest", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "bank-fees", label: "Bank fees", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "merchant-fees", label: "Merchant/payment processor fees", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "education-training", label: "Education and training", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "licenses-permits", label: "Licenses and permits", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "shipping-postage", label: "Shipping/postage", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "repairs-maintenance", label: "Repairs and maintenance", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], defaultValue: 0 },
  { id: "other-business-expenses", label: "Other business expenses", category: "business", inputType: "currency", appliesTo: ["self-employed", "business"], isAdvanced: true, defaultValue: 0 },
];

export function defaultDeductionState(definitions: DeductionDefinition[]): Record<string, { enabled: boolean; amount: number }> {
  return definitions.reduce<Record<string, { enabled: boolean; amount: number }>>((acc, definition) => {
    acc[definition.id] = {
      enabled: false,
      amount: definition.defaultValue,
    };
    return acc;
  }, {});
}
