type PageSeo = {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
};

function upsertMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function removeMetaTag(name: string) {
  const tag = document.querySelector(`meta[name="${name}"]`);
  if (tag) {
    tag.remove();
  }
}

function upsertCanonical(url: string) {
  let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function removeCanonical() {
  const link = document.querySelector("link[rel='canonical']");
  if (link) {
    link.remove();
  }
}

export function setPageSeo({ title, description, keywords, canonical, robots = "index, follow" }: PageSeo) {
  document.title = title;
  upsertMetaTag("description", description);
  if (keywords && keywords.trim().length > 0) {
    upsertMetaTag("keywords", keywords);
  } else {
    removeMetaTag("keywords");
  }
  upsertMetaTag("robots", robots);

  if (canonical) {
    upsertCanonical(canonical);
  } else {
    removeCanonical();
  }
}
