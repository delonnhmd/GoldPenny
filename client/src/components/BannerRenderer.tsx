import { type MouseEvent, useEffect, useRef, useState } from "react";
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
  const htmlContainerRef = useRef<HTMLDivElement | null>(null);
  const hasTrackedImpression = useRef(false);
  const [showHtmlFallback, setShowHtmlFallback] = useState(false);

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

  useEffect(() => {
    if (!renderAffiliateHtml) {
      setShowHtmlFallback(false);
      return;
    }

    const root = htmlContainerRef.current;
    if (!root || typeof window === "undefined") return;

    setShowHtmlFallback(false);
    let hasRenderableMedia = false;

    const media = Array.from(root.querySelectorAll("a img, video, iframe"));
    if (media.length === 0) {
      setShowHtmlFallback(true);
      return;
    }

    const markRenderable = () => {
      hasRenderableMedia = true;
      setShowHtmlFallback(false);
    };

    const cleanupHandlers: Array<() => void> = [];

    for (const node of media) {
      if (node instanceof HTMLImageElement) {
        if (node.complete && node.naturalWidth > 0) {
          markRenderable();
        }

        const onLoad = () => {
          if (node.naturalWidth > 0) {
            markRenderable();
          }
        };
        node.addEventListener("load", onLoad);
        cleanupHandlers.push(() => node.removeEventListener("load", onLoad));
        continue;
      }

      if (node instanceof HTMLVideoElement) {
        if (node.readyState > 0 || Boolean(node.poster)) {
          markRenderable();
        }

        const onLoadedData = () => markRenderable();
        node.addEventListener("loadeddata", onLoadedData);
        cleanupHandlers.push(() => node.removeEventListener("loadeddata", onLoadedData));
        continue;
      }

      if (node instanceof HTMLIFrameElement) {
        markRenderable();
      }
    }

    const timeoutId = window.setTimeout(() => {
      if (hasRenderableMedia) return;

      const hasVisibleMedia = media.some((node) => {
        if (!(node instanceof HTMLElement)) return false;
        const style = window.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return false;

        if (node instanceof HTMLImageElement) {
          return node.naturalWidth > 0;
        }
        if (node instanceof HTMLVideoElement) {
          return node.readyState > 0 || Boolean(node.poster);
        }
        return node.clientWidth > 0 && node.clientHeight > 0;
      });

      setShowHtmlFallback(!hasVisibleMedia);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
      cleanupHandlers.forEach((remove) => remove());
    };
  }, [banner.id, renderAffiliateHtml]);

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
          <div onClickCapture={onHtmlClickCapture}>
            <div
              ref={htmlContainerRef}
              className="affiliate-banner-html"
              dangerouslySetInnerHTML={{ __html: banner.htmlCode ?? "" }}
            />
            {showHtmlFallback ? (
              <div className="mx-auto mt-4 w-full max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Banner blocked or unavailable. Open this offer directly.</p>
                <div className="mt-3">
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
            ) : null}
          </div>
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
