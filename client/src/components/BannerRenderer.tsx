import { type MouseEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { trackBannerClick } from "@/lib/banner-behavior";
import { cn } from "@/lib/utils";
import type { BannerAdItem } from "@/lib/banner-config";
import { incrementAdClick, incrementAdImpression } from "@/utils/adTracking";

type BannerRendererProps = {
  banner: BannerAdItem;
  className?: string;
};

function getCtaDescription(banner: BannerAdItem) {
  if (banner.description?.trim()) return banner.description;
  return "Explore this sponsored partner offer.";
}

function getCtaLabel(banner: BannerAdItem) {
  if (banner.ctaLabel?.trim()) return banner.ctaLabel;
  return "View Offer";
}

export function BannerRenderer({ banner, className }: BannerRendererProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const hasTrackedImpression = useRef(false);

  useEffect(() => {
    hasTrackedImpression.current = false;
  }, [banner.id]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || hasTrackedImpression.current) return;

    const trackImpression = () => {
      if (hasTrackedImpression.current) return;
      hasTrackedImpression.current = true;
      incrementAdImpression(banner.id);
    };

    if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") {
      trackImpression();
      return;
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) {
          trackImpression();
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [banner.id]);

  if (!banner.enabled) {
    return null;
  }

  const onHtmlClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const link = target?.closest("a");
    if (link) {
      trackBannerClick(banner.category);
      incrementAdClick(banner.id);
    }
  };

  const onCtaClick = () => {
    trackBannerClick(banner.category);
    incrementAdClick(banner.id);
  };

  const renderAffiliateHtml = banner.type === "html" && Boolean(banner.htmlCode);

  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white px-4 py-5 md:px-6 md:py-6 shadow-sm",
        className,
      )}
    >
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
        Sponsored
      </span>

      <div className="mt-4">
        {renderAffiliateHtml ? (
          // Raw affiliate HTML is intentionally rendered as-is to preserve network tracking markup.
          <div
            className="affiliate-banner-html"
            onClickCapture={onHtmlClickCapture}
            dangerouslySetInnerHTML={{ __html: banner.htmlCode ?? "" }}
          />
        ) : (
          // Custom CTA fallback when affiliate HTML is unavailable for this banner item.
          <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <h3 className="text-xl font-semibold text-slate-900">{banner.title}</h3>
            <p className="mt-2 text-slate-600 leading-relaxed">{getCtaDescription(banner)}</p>
            {banner.imageUrl ? (
              <img
                src={banner.imageUrl}
                alt={banner.title}
                loading="lazy"
                className="mt-4 block h-auto max-w-full rounded-lg border border-slate-200"
              />
            ) : null}
            <div className="mt-5">
              <Button asChild className="font-semibold">
                <a
                  href={banner.trackingUrl}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  onClick={onCtaClick}
                >
                  {getCtaLabel(banner)}
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
