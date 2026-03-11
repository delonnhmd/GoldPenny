type BannerCategory = "finance" | "business_software" | "lifestyle" | "trading";
type BannerPageType =
  | "homepage"
  | "loan"
  | "business"
  | "mortgage"
  | "blog"
  | "market_blog";
type BannerType = "html" | "cta";
type BannerSlotType = "leaderboard" | "content-top" | "content-mid" | "sidebar" | "inline-box";
type BannerAdSize = "728x90" | "160x600" | "250x250";

export type AdInventoryItem = {
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

export const adInventory: AdInventoryItem[];
