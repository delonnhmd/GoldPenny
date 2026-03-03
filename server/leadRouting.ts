export type LeadRoutePartner = "AFN" | "ROK";

export type LeadRouteReason =
  | "canada_business"
  | "high_risk_industry"
  | "startup_no_gross_650_plus"
  | "other_industry_low_credit"
  | "other_industry_high_credit"
  | "amount_below_75000"
  | "amount_75000_or_more";

export interface LeadRoutingInput {
  businessLocation?: string;
  industry?: string;
  loanAmount?: number | string;
  creditScore?: string;
  annualSales?: string;
  timeInBusiness?: string;
  subId1?: string;
  subId2?: string;
}

export interface LeadRoutingDecision {
  partner: LeadRoutePartner;
  reason: LeadRouteReason;
  targetUrl: string;
}

const LOAN_AMOUNT_THRESHOLD = 75000;

const AFN_FALLBACK_URL = "https://app.advancefundsnetwork.com/affiliate-landing/mB2gI81rXVVusbUAEdHGhbymydf2";
const ROK_FALLBACK_URL = "https://go.mypartner.io/business-financing/?ref=001Qk00000i34ljIAA";

const HIGH_RISK_KEYWORDS = ["adult", "cannabis", "firearm", "fire arms", "ammunition", "casino", "gambling"];

function normalizeText(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isCanadaBusiness(location: string | undefined) {
  const normalized = normalizeText(location);
  if (!normalized) {
    return false;
  }

  return normalized === "canada" || normalized === "ca" || normalized.includes("canada");
}

function isHighRiskIndustry(industry: string | undefined) {
  const normalized = normalizeText(industry);
  if (!normalized) {
    return false;
  }

  return HIGH_RISK_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function parseLoanAmount(value: number | string | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function isLowCredit(creditScore: string | undefined) {
  const normalized = normalizeText(creditScore);
  if (!normalized) {
    return false;
  }

  if (normalized.includes("below 580") || normalized.includes("580-649") || normalized.includes("under 650")) {
    return true;
  }

  const numeric = Number(normalized.replace(/[^\d]/g, ""));
  if (!Number.isFinite(numeric)) {
    return false;
  }

  return numeric < 650;
}

function isHighCredit650Plus(creditScore: string | undefined) {
  const normalized = normalizeText(creditScore);
  if (!normalized) {
    return false;
  }

  if (normalized.includes("650-719") || normalized.includes("720+") || normalized.includes("650+") || normalized.includes("above 650")) {
    return true;
  }

  const numeric = Number(normalized.replace(/[^\d]/g, ""));
  if (!Number.isFinite(numeric)) {
    return false;
  }

  return numeric >= 650;
}

function isOtherIndustry(industry: string | undefined) {
  const normalized = normalizeText(industry);
  if (!normalized) {
    return true;
  }

  return normalized === "other";
}

function isNoGrossSales(annualSales: string | undefined) {
  const normalized = normalizeText(annualSales);
  if (!normalized) {
    return false;
  }

  return (
    normalized === "0" ||
    normalized === "$0" ||
    normalized === "no gross sales" ||
    normalized === "no sales" ||
    normalized === "none"
  );
}

function isStartup(timeInBusiness: string | undefined) {
  const normalized = normalizeText(timeInBusiness);
  if (!normalized) {
    return false;
  }

  return (
    normalized.includes("start") ||
    normalized.includes("new business") ||
    normalized.includes("less than 6 months") ||
    normalized.includes("under 6 months")
  );
}

function appendTrackingParams(baseUrl: string, subId1?: string, subId2?: string) {
  const nextUrl = new URL(baseUrl);

  if (subId1?.trim()) {
    nextUrl.searchParams.set("sub_id_1", subId1.trim());
  }

  if (subId2?.trim()) {
    nextUrl.searchParams.set("sub_id_2", subId2.trim());
  }

  return nextUrl.toString();
}

function getAfnUrl() {
  return process.env.AFN_LANDING_URL || process.env.AFN_LEAD_ENDPOINT_URL || AFN_FALLBACK_URL;
}

function getRokUrl() {
  return process.env.ROK_BUSINESS_FINANCING_URL || ROK_FALLBACK_URL;
}

function makeDecision(partner: LeadRoutePartner, reason: LeadRouteReason, subId1?: string, subId2?: string): LeadRoutingDecision {
  const baseUrl = partner === "AFN" ? getAfnUrl() : getRokUrl();
  const targetUrl = appendTrackingParams(baseUrl, subId1, subId2);

  return {
    partner,
    reason,
    targetUrl,
  };
}

export function decideLeadRoute(input: LeadRoutingInput): LeadRoutingDecision {
  if (isCanadaBusiness(input.businessLocation)) {
    return makeDecision("AFN", "canada_business", input.subId1, input.subId2);
  }

  if (isHighRiskIndustry(input.industry)) {
    return makeDecision("ROK", "high_risk_industry", input.subId1, input.subId2);
  }

  if (isStartup(input.timeInBusiness) && isNoGrossSales(input.annualSales) && isHighCredit650Plus(input.creditScore)) {
    return makeDecision("ROK", "startup_no_gross_650_plus", input.subId1, input.subId2);
  }

  if (isOtherIndustry(input.industry)) {
    if (isLowCredit(input.creditScore)) {
      return makeDecision("AFN", "other_industry_low_credit", input.subId1, input.subId2);
    }

    return makeDecision("ROK", "other_industry_high_credit", input.subId1, input.subId2);
  }

  const loanAmount = parseLoanAmount(input.loanAmount);
  if (loanAmount !== null && loanAmount < LOAN_AMOUNT_THRESHOLD) {
    return makeDecision("AFN", "amount_below_75000", input.subId1, input.subId2);
  }

  return makeDecision("ROK", "amount_75000_or_more", input.subId1, input.subId2);
}
