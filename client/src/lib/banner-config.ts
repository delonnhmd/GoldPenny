export type BannerCategory = "finance" | "business_software" | "lifestyle";

export type BannerPageType =
  | "homepage"
  | "loan"
  | "business"
  | "mortgage"
  | "blog"
  | "market_blog";

export type BannerType = "html" | "cta";

export type BannerAdItem = {
  id: string;
  title: string;
  category: BannerCategory;
  type: BannerType;
  trackingUrl: string;
  htmlCode?: string;
  imageUrl?: string;
  description?: string;
  ctaLabel?: string;
  allowedPages: BannerPageType[];
  enabled: boolean;
  priority: number;
  clickCount: number;
  impressionCount: number;
  lastClickedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// Manual banner catalog. Category is always explicitly provided here.
// Do not auto-categorize banners from URL patterns.
const nowIso = new Date().toISOString();

export const bannerAds: BannerAdItem[] = [
  {
    id: "it-media-728x90-finance-1",
    title: "IT Media Finance Offer",
    category: "finance",
    type: "html",
    trackingUrl: "https://it-media.pxf.io/c/7021230/1478648/17319",
    htmlCode: `<a rel="sponsored"
           href="https://it-media.pxf.io/c/7021230/1478648/17319" target="_top" id="1478648">
<img src="https://a.impactradius-go.com/display-ad/17319-1478648" border="0" alt="" width="728" height="90"/></a><img height="0" width="0" src="https://imp.pxf.io/i/7021230/1478648/17319" style="position:absolute;visibility:hidden;" border="0" />`,
    allowedPages: ["homepage", "loan", "business", "mortgage", "blog", "market_blog"],
    enabled: true,
    priority: 10,
    clickCount: 0,
    impressionCount: 0,
    lastClickedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: "business-software-sample-1",
    title: "Business Software Tools",
    category: "business_software",
    type: "cta",
    trackingUrl: "https://example.com/business-software/track",
    description: "Compare software options that help with invoicing, payroll, and cash-flow planning.",
    ctaLabel: "Explore Tools",
    allowedPages: ["business", "blog", "market_blog"],
    enabled: true,
    priority: 7,
    clickCount: 0,
    impressionCount: 0,
    lastClickedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: "lifestyle-sample-1",
    title: "Lifestyle Savings Picks",
    category: "lifestyle",
    type: "cta",
    trackingUrl: "https://example.com/lifestyle/track",
    description: "Sponsored lifestyle picks focused on practical savings and daily value.",
    ctaLabel: "View Picks",
    allowedPages: ["blog", "market_blog"],
    enabled: true,
    priority: 5,
    clickCount: 0,
    impressionCount: 0,
    lastClickedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
];

// Future logic: A/B testing and campaign rotation can be layered on top of this
// static catalog (for example weighted experiments by page type and audience segment).
