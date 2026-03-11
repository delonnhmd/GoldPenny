import { useEffect, useMemo } from "react";
import { BannerRenderer } from "@/components/BannerRenderer";
import { trackCategoryPageView } from "@/lib/banner-behavior";
import type { BannerCategory, BannerPageType } from "@/lib/banner-config";
import { selectBannersForPage } from "@/lib/banner-selection";

type BlogBannerSectionProps = {
  pageType: Extract<BannerPageType, "blog" | "market_blog">;
  currentPageCategory: BannerCategory;
  maxItems?: number;
  title?: string;
  description?: string;
};

export function BlogBannerSection({
  pageType,
  currentPageCategory,
  maxItems = 2,
  title = "Sponsored Recommendations",
  description = "Offers prioritized for this article topic and your on-site reading behavior.",
}: BlogBannerSectionProps) {
  useEffect(() => {
    trackCategoryPageView(currentPageCategory);
  }, [currentPageCategory]);

  const banners = useMemo(
    () =>
      selectBannersForPage({
        pageType,
        currentPageCategory,
        maxItems,
      }),
    [pageType, currentPageCategory, maxItems],
  );

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mx-auto max-w-3xl text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-slate-900">{title}</h2>
          <p className="mt-2 text-sm md:text-base text-slate-600">{description}</p>
        </div>

        <div className="space-y-5">
          {banners.map((banner) => (
            <BannerRenderer key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  );
}
