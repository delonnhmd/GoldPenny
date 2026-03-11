import { useMemo } from "react";
import { BannerRenderer } from "@/components/BannerRenderer";
import { selectBannersForPage } from "@/lib/banner-selection";

export function HomepageFinanceBannerSection() {
  const financeBanners = useMemo(
    () =>
      selectBannersForPage({
        pageType: "homepage",
        currentPageCategory: "finance",
        slotType: "content-top",
        maxItems: 1,
      }),
    [],
  );

  if (financeBanners.length === 0) {
    return null;
  }

  return (
    <section id="homepage-finance-banners" className="py-12 bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mx-auto max-w-3xl text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-slate-900">
            Sponsored Finance Offers
          </h2>
          <p className="mt-2 text-sm md:text-base text-slate-600">
            Promotional placements from selected finance partners.
          </p>
        </div>

        <div className="space-y-6">
          {financeBanners.map((banner) => (
            <BannerRenderer key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  );
}
