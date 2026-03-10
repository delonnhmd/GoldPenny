import { Button } from "@/components/ui/button";
import {
  type BannerDefinition,
  type CustomCtaBanner,
  type RawAffiliateHtmlBanner,
  getHomepageFinanceBanners,
} from "@/lib/banner-slots";

function isRawAffiliateHtmlBanner(banner: BannerDefinition): banner is RawAffiliateHtmlBanner {
  return banner.kind === "raw_affiliate_html";
}

function renderCustomCtaBanner(banner: CustomCtaBanner) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-5 md:p-6">
      <h3 className="text-xl font-semibold text-slate-900">{banner.title}</h3>
      <p className="mt-2 text-slate-600 leading-relaxed">{banner.description}</p>
      <div className="mt-5">
        <Button asChild className="font-semibold">
          <a
            href={banner.trackingUrl}
            target={banner.ctaTarget ?? "_blank"}
            rel="sponsored noopener noreferrer"
          >
            {banner.ctaLabel}
          </a>
        </Button>
      </div>
    </div>
  );
}

export function HomepageFinanceBannerSection() {
  const financeBanners = getHomepageFinanceBanners();

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
            <div key={banner.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-5 md:px-6 md:py-6 shadow-sm">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                {banner.sponsoredLabel ?? "Sponsored"}
              </span>

              <div className="mt-4">
                {isRawAffiliateHtmlBanner(banner) ? (
                  // Future logic: if affiliate HTML is unavailable, swap to a custom CTA fallback card.
                  <div
                    className="finance-affiliate-html"
                    dangerouslySetInnerHTML={{ __html: banner.html }}
                  />
                ) : (
                  renderCustomCtaBanner(banner)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
