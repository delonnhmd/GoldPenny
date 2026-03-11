import { getBehaviorScores } from "@/lib/banner-behavior";
import {
  bannerAds,
  type BannerAdItem,
  type BannerCategory,
  type BannerPageType,
} from "@/lib/banner-config";

type BlogPageType = Extract<BannerPageType, "blog" | "market_blog">;

type BannerSelectionInput = {
  pageType: BannerPageType;
  currentPageCategory?: BannerCategory;
  maxItems?: number;
};

const BLOG_MIN_BEHAVIOR_POINTS = 3;

const BLOG_RELEVANCE_MATRIX: Record<
  BannerCategory,
  Record<BannerCategory, number>
> = {
  finance: {
    finance: 1,
    business_software: 0.45,
    lifestyle: 0,
  },
  business_software: {
    finance: 0.55,
    business_software: 1,
    lifestyle: 0,
  },
  lifestyle: {
    finance: 0.4,
    business_software: 0,
    lifestyle: 1,
  },
};

function sortByPriorityDesc(a: BannerAdItem, b: BannerAdItem) {
  if (b.priority !== a.priority) return b.priority - a.priority;
  return a.id.localeCompare(b.id);
}

function getEnabledBanners() {
  return bannerAds.filter((banner) => banner.enabled);
}

function getAllowedCategoriesForPage(
  pageType: BannerPageType,
  currentPageCategory: BannerCategory,
): BannerCategory[] {
  if (pageType === "homepage") return ["finance"];
  if (pageType === "loan") return ["finance"];
  if (pageType === "mortgage") return ["finance"];
  if (pageType === "business") return ["finance", "business_software"];

  // Blog pages use relevance map to avoid unrelated categories.
  return (Object.keys(BLOG_RELEVANCE_MATRIX[currentPageCategory]) as BannerCategory[]).filter(
    (category) => BLOG_RELEVANCE_MATRIX[currentPageCategory][category] > 0,
  );
}

function filterCandidatesByPageRules(
  banners: BannerAdItem[],
  pageType: BannerPageType,
  currentPageCategory: BannerCategory,
) {
  const allowedCategories = getAllowedCategoriesForPage(pageType, currentPageCategory);

  return banners.filter(
    (banner) =>
      banner.allowedPages.includes(pageType) && allowedCategories.includes(banner.category),
  );
}

function hasEnoughBehaviorData() {
  const scores = getBehaviorScores().totalScoreByCategory;
  const totalBehaviorPoints = scores.finance + scores.business_software + scores.lifestyle;
  return totalBehaviorPoints >= BLOG_MIN_BEHAVIOR_POINTS;
}

function getCategoryBehaviorNormalized(category: BannerCategory, categories: BannerCategory[]) {
  const scores = getBehaviorScores().totalScoreByCategory;
  const maxInScope = Math.max(...categories.map((value) => scores[value]));
  if (maxInScope <= 0) return 0;
  return scores[category] / maxInScope;
}

function selectBlogBanners(
  candidates: BannerAdItem[],
  pageType: BlogPageType,
  currentPageCategory: BannerCategory,
  maxItems: number,
) {
  if (candidates.length === 0) {
    return [];
  }

  if (!hasEnoughBehaviorData()) {
    // Fallback: use current category only until behavior data is meaningful.
    const currentCategoryOnly = candidates.filter(
      (banner) => banner.category === currentPageCategory,
    );
    if (currentCategoryOnly.length > 0) {
      return currentCategoryOnly.sort(sortByPriorityDesc).slice(0, maxItems);
    }

    // If current category has no candidates, finance is the default fallback.
    const financeFallback = getEnabledBanners().filter(
      (banner) =>
        banner.category === "finance" &&
        banner.allowedPages.includes(pageType) &&
        banner.enabled,
    );
    return financeFallback.sort(sortByPriorityDesc).slice(0, maxItems);
  }

  const inScopeCategories = getAllowedCategoriesForPage(pageType, currentPageCategory);
  const scored = [...candidates].map((banner) => {
    const relevance = BLOG_RELEVANCE_MATRIX[currentPageCategory][banner.category] ?? 0;
    const behavior = getCategoryBehaviorNormalized(banner.category, inScopeCategories);
    const weightedCategoryScore = relevance * 0.7 + behavior * 0.3;

    return {
      banner,
      score: weightedCategoryScore * 100 + banner.priority,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const ranked = scored.map((entry) => entry.banner);
  const currentCategory = ranked.filter((banner) => banner.category === currentPageCategory);
  const nonCurrentCategory = ranked.filter((banner) => banner.category !== currentPageCategory);

  // Extra guardrail: page-topic banners stay first, behavior only reorders support categories.
  return [...currentCategory, ...nonCurrentCategory].slice(0, maxItems);
}

export function selectBannersForPage({
  pageType,
  currentPageCategory = "finance",
  maxItems = 2,
}: BannerSelectionInput): BannerAdItem[] {
  const enabled = getEnabledBanners();
  const candidates = filterCandidatesByPageRules(enabled, pageType, currentPageCategory);

  if (pageType === "blog" || pageType === "market_blog") {
    return selectBlogBanners(candidates, pageType, currentPageCategory, maxItems);
  }

  // Homepage and core money pages are deterministic: no behavior-based mixing.
  const sorted = candidates.sort(sortByPriorityDesc);
  if (sorted.length > 0) {
    return sorted.slice(0, maxItems);
  }

  // Global fallback to finance when nothing matches.
  return enabled
    .filter((banner) => banner.category === "finance" && banner.allowedPages.includes(pageType))
    .sort(sortByPriorityDesc)
    .slice(0, maxItems);
}

// Future logic: plug in campaign pacing, frequency caps, and runtime rotations here.
