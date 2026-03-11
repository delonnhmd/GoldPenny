import { adInventory } from "@/data/adInventory.js";

export type BannerCategory = "finance" | "business_software" | "lifestyle" | "trading";

export type BannerPageType =
  | "homepage"
  | "loan"
  | "business"
  | "mortgage"
  | "blog"
  | "market_blog";

export type BannerType = "html" | "cta";
export type BannerSlotType =
  | "leaderboard"
  | "content-top"
  | "content-mid"
  | "sidebar"
  | "inline-box";
export type BannerAdSize = "728x90" | "160x600" | "250x250";

export type BannerAdItem = {
  id: string;
  title: string;
  category: BannerCategory;
  type: BannerType;
  size: BannerAdSize;
  compatibleSlotTypes?: BannerSlotType[];
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

type RawAdInventoryItem = Omit<
  BannerAdItem,
  "clickCount" | "impressionCount" | "lastClickedAt" | "createdAt" | "updatedAt"
> &
  Partial<
    Pick<
      BannerAdItem,
      "clickCount" | "impressionCount" | "lastClickedAt" | "createdAt" | "updatedAt"
    >
  >;

const rawInventory = adInventory as RawAdInventoryItem[];

// Normalized manual catalog consumed by banner selection/tracking.
// Category and page rules are read directly from the ad inventory file.
export const bannerAds: BannerAdItem[] = rawInventory.map((ad) => {
  const nowIso = new Date().toISOString();
  return {
    ...ad,
    clickCount: ad.clickCount ?? 0,
    impressionCount: ad.impressionCount ?? 0,
    lastClickedAt: ad.lastClickedAt ?? null,
    createdAt: ad.createdAt ?? nowIso,
    updatedAt: ad.updatedAt ?? nowIso,
  };
});

// Future logic: A/B testing and campaign rotation can be layered on top of this
// static catalog (for example weighted experiments by page type and audience segment).
