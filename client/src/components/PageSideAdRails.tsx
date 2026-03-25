import { useMemo } from "react";
import { useLocation } from "wouter";
import { BannerRenderer } from "@/components/BannerRenderer";
import type { BannerCategory, BannerPageType } from "@/lib/banner-config";
import { selectBannersForPage } from "@/lib/banner-selection";

type PageBannerContext = {
  pageType: BannerPageType;
  currentPageCategory: BannerCategory;
};

function getPageBannerContext(pathname: string): PageBannerContext | null {
  if (pathname.startsWith("/admin")) return null;

  if (pathname === "/") {
    return { pageType: "homepage", currentPageCategory: "finance" };
  }

  if (pathname.startsWith("/loan-calculators")) {
    return { pageType: "mortgage", currentPageCategory: "finance" };
  }

  if (pathname === "/loan" || pathname.startsWith("/loan?") || pathname.startsWith("/offers")) {
    return { pageType: "loan", currentPageCategory: "finance" };
  }

  if (pathname.startsWith("/mortgage") || pathname.startsWith("/mortgage-underwriting")) {
    return { pageType: "mortgage", currentPageCategory: "finance" };
  }

  if (pathname.startsWith("/business")) {
    return { pageType: "business", currentPageCategory: "finance" };
  }

  if (pathname.startsWith("/crypto")) {
    return { pageType: "blog", currentPageCategory: "trading" };
  }

  if (pathname.startsWith("/money-tools")) {
    return { pageType: "blog", currentPageCategory: "finance" };
  }

  if (pathname.startsWith("/smart-penny")) {
    return { pageType: "blog", currentPageCategory: "business_software" };
  }

  if (pathname.startsWith("/rates")) {
    return { pageType: "market_blog", currentPageCategory: "business_software" };
  }

  if (pathname.startsWith("/texas-cash-advance-apps-2026")) {
    return { pageType: "blog", currentPageCategory: "finance" };
  }

  if (pathname.startsWith("/affiliate-disclosure")) {
    return { pageType: "blog", currentPageCategory: "finance" };
  }

  if (pathname.startsWith("/shopping-guide")) {
    return { pageType: "blog", currentPageCategory: "finance" };
  }

  return { pageType: "blog", currentPageCategory: "finance" };
}

export function PageSideAdRails() {
  const [location] = useLocation();

  const context = getPageBannerContext(location);
  const [leftBanner, rightBanner] = useMemo(() => {
    if (!context) return [null, null] as const;
    const selected = selectBannersForPage({
      pageType: context.pageType,
      currentPageCategory: context.currentPageCategory,
      slotType: "sidebar",
      maxItems: 2,
    });

    const first = selected[0] ?? null;
    const second = selected[1] ?? first;
    return [first, second] as const;
  }, [context, location]);

  if (!leftBanner || !rightBanner) {
    return null;
  }

  return (
    <>
      <aside
        className="side-ad-rail fixed z-40"
        style={{
          top: "96px",
          left: "max(8px, calc((100vw - 1280px) / 2 - 148px))",
          width: "140px",
        }}
        aria-label="Left sponsored sidebar ads"
      >
        <BannerRenderer
          banner={leftBanner}
          className="px-3 py-3 md:px-3 md:py-3 shadow-md"
        />
      </aside>

      <aside
        className="side-ad-rail fixed z-40"
        style={{
          top: "96px",
          right: "max(8px, calc((100vw - 1280px) / 2 - 148px))",
          width: "140px",
        }}
        aria-label="Right sponsored sidebar ads"
      >
        <BannerRenderer
          banner={rightBanner}
          className="px-3 py-3 md:px-3 md:py-3 shadow-md"
        />
      </aside>
    </>
  );
}
