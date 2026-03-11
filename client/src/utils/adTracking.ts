import {
  bannerAds,
  type BannerAdItem,
  type BannerCategory,
  type BannerPageType,
} from "@/lib/banner-config";

const AD_PERFORMANCE_STORAGE_KEY = "pennyfloat.ad.performance.v1";

type AdPerformanceEntry = Pick<
  BannerAdItem,
  "id" | "clickCount" | "impressionCount" | "lastClickedAt" | "createdAt" | "updatedAt"
>;

type AdPerformanceMap = Record<string, AdPerformanceEntry>;

type AdTrackingStorageAdapter = {
  read: () => AdPerformanceMap;
  write: (value: AdPerformanceMap) => void;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function buildConfigPerformanceMap(): AdPerformanceMap {
  return Object.fromEntries(
    bannerAds.map((ad) => [
      ad.id,
      {
        id: ad.id,
        clickCount: ad.clickCount,
        impressionCount: ad.impressionCount,
        lastClickedAt: ad.lastClickedAt,
        createdAt: ad.createdAt,
        updatedAt: ad.updatedAt,
      },
    ]),
  );
}

function coercePerformanceMap(value: unknown): AdPerformanceMap {
  const fallback = buildConfigPerformanceMap();
  if (!value || typeof value !== "object") return fallback;

  const source = value as Record<string, Partial<AdPerformanceEntry>>;
  const merged: AdPerformanceMap = {};

  for (const ad of bannerAds) {
    const existing = source[ad.id];
    merged[ad.id] = {
      id: ad.id,
      clickCount:
        typeof existing?.clickCount === "number" && Number.isFinite(existing.clickCount)
          ? existing.clickCount
          : ad.clickCount,
      impressionCount:
        typeof existing?.impressionCount === "number" &&
        Number.isFinite(existing.impressionCount)
          ? existing.impressionCount
          : ad.impressionCount,
      lastClickedAt:
        typeof existing?.lastClickedAt === "string" || existing?.lastClickedAt === null
          ? existing.lastClickedAt
          : ad.lastClickedAt,
      createdAt:
        typeof existing?.createdAt === "string" && existing.createdAt.length > 0
          ? existing.createdAt
          : ad.createdAt,
      updatedAt:
        typeof existing?.updatedAt === "string" && existing.updatedAt.length > 0
          ? existing.updatedAt
          : ad.updatedAt,
    };
  }

  return merged;
}

const localStorageAdapter: AdTrackingStorageAdapter = {
  read: () => {
    if (!canUseStorage()) return buildConfigPerformanceMap();

    try {
      const raw = window.localStorage.getItem(AD_PERFORMANCE_STORAGE_KEY);
      if (!raw) return buildConfigPerformanceMap();
      const parsed = JSON.parse(raw) as unknown;
      return coercePerformanceMap(parsed);
    } catch {
      return buildConfigPerformanceMap();
    }
  },
  write: (value) => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(AD_PERFORMANCE_STORAGE_KEY, JSON.stringify(value));
  },
};

let trackingStorageAdapter: AdTrackingStorageAdapter = localStorageAdapter;

export function setAdTrackingStorageAdapter(adapter: AdTrackingStorageAdapter) {
  trackingStorageAdapter = adapter;
}

function readPerformanceMap() {
  return trackingStorageAdapter.read();
}

function writePerformanceMap(map: AdPerformanceMap) {
  trackingStorageAdapter.write(map);
}

function updateAdPerformance(adId: string, updater: (entry: AdPerformanceEntry) => void) {
  const map = readPerformanceMap();
  const defaultEntry: AdPerformanceEntry = {
    id: adId,
    clickCount: 0,
    impressionCount: 0,
    lastClickedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const current = map[adId] ?? defaultEntry;

  updater(current);
  current.updatedAt = new Date().toISOString();
  map[adId] = current;
  writePerformanceMap(map);
}

export function incrementAdClick(adId: string) {
  updateAdPerformance(adId, (entry) => {
    entry.clickCount += 1;
    entry.lastClickedAt = new Date().toISOString();
  });
}

export function incrementAdImpression(adId: string) {
  updateAdPerformance(adId, (entry) => {
    entry.impressionCount += 1;
  });
}

export function getAdPerformanceReport(): BannerAdItem[] {
  const performanceMap = readPerformanceMap();
  return bannerAds.map((ad) => {
    const performance = performanceMap[ad.id];
    return {
      ...ad,
      clickCount: performance?.clickCount ?? ad.clickCount,
      impressionCount: performance?.impressionCount ?? ad.impressionCount,
      lastClickedAt: performance?.lastClickedAt ?? ad.lastClickedAt,
      createdAt: performance?.createdAt ?? ad.createdAt,
      updatedAt: performance?.updatedAt ?? ad.updatedAt,
    };
  });
}

export function getAdPerformanceByCategory(category: BannerCategory): BannerAdItem[] {
  return getAdPerformanceReport().filter((ad) => ad.category === category);
}

export function getAdPerformanceByPage(pageType: BannerPageType): BannerAdItem[] {
  return getAdPerformanceReport().filter((ad) => ad.allowedPages.includes(pageType));
}

// Future admin/reporting expansion points:
// - Admin report page can read from getAdPerformanceReport()
// - Date range filters can be applied on createdAt/updatedAt/lastClickedAt
// - Click report by category/page/banner can reuse getAdPerformanceByCategory/getAdPerformanceByPage
// - Impression report and top-performing ads can derive from clickCount/impressionCount/CTR
// - Storage adapter can be swapped to server/database tracking without changing callers
