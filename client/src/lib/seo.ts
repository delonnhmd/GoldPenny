type PageSeo = {
  title: string;
  description: string;
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

function upsertCanonical(url: string) {
  let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

export function setPageSeo({ title, description, canonical, robots = "index, follow" }: PageSeo) {
  document.title = title;
  upsertMetaTag("description", description);
  upsertMetaTag("robots", robots);

  if (canonical) {
    upsertCanonical(canonical);
  }
}
