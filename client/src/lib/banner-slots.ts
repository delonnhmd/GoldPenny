export type BannerCategory = "finance" | "business_software" | "lifestyle";

type BannerBase = {
  id: string;
  category: BannerCategory;
  sponsoredLabel?: string;
};

export type RawAffiliateHtmlBanner = BannerBase & {
  kind: "raw_affiliate_html";
  html: string;
};

export type CustomCtaBanner = BannerBase & {
  kind: "custom_cta_card";
  title: string;
  description: string;
  ctaLabel: string;
  trackingUrl: string;
  ctaTarget?: "_blank" | "_top" | "_self";
};

export type BannerDefinition = RawAffiliateHtmlBanner | CustomCtaBanner;

export type BannerCatalog = Record<BannerCategory, BannerDefinition[]>;

export const bannerCatalog: BannerCatalog = {
  finance: [
    {
      id: "it-media-1201x631-test",
      category: "finance",
      kind: "raw_affiliate_html",
      sponsoredLabel: "Sponsored",
      html: `<a rel="sponsored"
           href="https://it-media.pxf.io/c/7021230/1473136/17319" target="_top" id="1473136">
<img src="//a.impactradius-go.com/display-ad/17319-1473136" border="0" alt="" width="1201" height="631"/></a><img height="0" width="0" src="https://imp.pxf.io/i/7021230/1473136/17319" style="position:absolute;visibility:hidden;" border="0" />`,
    },
  ],
  business_software: [],
  lifestyle: [],
};

export function getHomepageFinanceBanners(): BannerDefinition[] {
  // Future logic: add homepage finance banner rotation here (weighting, A/B splits, scheduling).
  return bannerCatalog.finance;
}

export function getBlogBannerCandidates(category: BannerCategory): BannerDefinition[] {
  // Future logic: add blog behavior-based banner logic here (content category, engagement, geo/device).
  return bannerCatalog[category];
}
