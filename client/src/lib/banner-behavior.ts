import type { BannerCategory } from "@/lib/banner-config";

const STORAGE_KEY = "pennyfloat.banner.behavior.v1";
const CATEGORIES: BannerCategory[] = ["finance", "business_software", "lifestyle", "trading"];

type CategoryScoreMap = Record<BannerCategory, number>;

export type BannerBehaviorState = {
  viewedCategories: CategoryScoreMap;
  clickedBannerCategories: CategoryScoreMap;
  lastViewedCategory: BannerCategory | null;
  totalScoreByCategory: CategoryScoreMap;
};

function createZeroScoreMap(): CategoryScoreMap {
  return {
    finance: 0,
    business_software: 0,
    lifestyle: 0,
    trading: 0,
  };
}

function createDefaultState(): BannerBehaviorState {
  return {
    viewedCategories: createZeroScoreMap(),
    clickedBannerCategories: createZeroScoreMap(),
    lastViewedCategory: null,
    totalScoreByCategory: createZeroScoreMap(),
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function coerceScoreMap(value: unknown): CategoryScoreMap {
  const map = createZeroScoreMap();
  if (!value || typeof value !== "object") return map;

  const candidate = value as Record<string, unknown>;
  for (const category of CATEGORIES) {
    const raw = candidate[category];
    map[category] = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
  }
  return map;
}

function readBehaviorState(): BannerBehaviorState {
  if (!canUseStorage()) return createDefaultState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as Partial<BannerBehaviorState>;

    return {
      viewedCategories: coerceScoreMap(parsed.viewedCategories),
      clickedBannerCategories: coerceScoreMap(parsed.clickedBannerCategories),
      lastViewedCategory: CATEGORIES.includes(parsed.lastViewedCategory as BannerCategory)
        ? (parsed.lastViewedCategory as BannerCategory)
        : null,
      totalScoreByCategory: coerceScoreMap(parsed.totalScoreByCategory),
    };
  } catch {
    return createDefaultState();
  }
}

function writeBehaviorState(state: BannerBehaviorState) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function trackCategoryPageView(category: BannerCategory) {
  const state = readBehaviorState();
  state.viewedCategories[category] += 1;

  // Blog page view in this category.
  state.totalScoreByCategory[category] += 1;

  // Repeat visit bonus for the same category.
  if (state.lastViewedCategory === category) {
    state.totalScoreByCategory[category] += 1;
  }

  state.lastViewedCategory = category;
  writeBehaviorState(state);
}

export function trackBannerClick(category: BannerCategory) {
  const state = readBehaviorState();
  state.clickedBannerCategories[category] += 1;

  // Click intent boost.
  state.totalScoreByCategory[category] += 3;
  writeBehaviorState(state);
}

export function getBehaviorScores(): BannerBehaviorState {
  return readBehaviorState();
}

export function getTopCategory(): BannerCategory | null {
  const { totalScoreByCategory } = readBehaviorState();
  const sorted = [...CATEGORIES].sort(
    (a, b) => totalScoreByCategory[b] - totalScoreByCategory[a],
  );
  const top = sorted[0];
  return totalScoreByCategory[top] > 0 ? top : null;
}

export function getRecommendedBannerCategory(
  currentPageCategory: BannerCategory,
): BannerCategory {
  const scores = readBehaviorState().totalScoreByCategory;
  const maxScore = Math.max(...CATEGORIES.map((category) => scores[category]));
  if (maxScore <= 0) return currentPageCategory;

  // Relevance-first recommendation: page topic dominates, behavior can only nudge.
  let bestCategory: BannerCategory = currentPageCategory;
  let bestScore = -1;

  for (const category of CATEGORIES) {
    const relevance = category === currentPageCategory ? 1 : 0.35;
    const behavior = maxScore > 0 ? scores[category] / maxScore : 0;
    const weighted = relevance * 0.7 + behavior * 0.3;
    if (weighted > bestScore) {
      bestScore = weighted;
      bestCategory = category;
    }
  }

  return bestCategory;
}

export function clearBehaviorScores() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// Future logic: replace localStorage with a server-side event stream when ready,
// keeping these helper signatures stable so UI components do not need rewrites.
