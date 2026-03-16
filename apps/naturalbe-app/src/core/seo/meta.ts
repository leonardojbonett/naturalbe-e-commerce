import { appEnv } from "../config/env";

type SeoPayload = {
  title: string;
  description: string;
  url: string;
  image: string;
  type?: "website" | "product";
  indexable?: boolean;
};

const INDEX_ROBOTS =
  "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex,nofollow,noarchive";

function ensureMetaByName(name: string): HTMLMetaElement {
  const existing = document.querySelector(`meta[name="${name}"]`);
  if (existing instanceof HTMLMetaElement) {
    return existing;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("name", name);
  document.head.appendChild(meta);
  return meta;
}

function ensureMetaByProperty(property: string): HTMLMetaElement {
  const existing = document.querySelector(`meta[property="${property}"]`);
  if (existing instanceof HTMLMetaElement) {
    return existing;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("property", property);
  document.head.appendChild(meta);
  return meta;
}

function ensureCanonicalLink(): HTMLLinkElement {
  const existing = document.querySelector('link[rel="canonical"]');
  if (existing instanceof HTMLLinkElement) {
    return existing;
  }

  const link = document.createElement("link");
  link.setAttribute("rel", "canonical");
  document.head.appendChild(link);
  return link;
}

function ensureAlternateLink(hreflang: string): HTMLLinkElement {
  const selector = `link[rel="alternate"][hreflang="${hreflang}"][data-nb-seo="1"]`;
  const existing = document.head.querySelector(selector);
  if (existing instanceof HTMLLinkElement) {
    return existing;
  }

  const link = document.createElement("link");
  link.setAttribute("rel", "alternate");
  link.setAttribute("hreflang", hreflang);
  link.setAttribute("data-nb-seo", "1");
  document.head.appendChild(link);
  return link;
}

function toAbsoluteUrl(input: string): string {
  try {
    return new URL(input, appEnv.siteOrigin).toString();
  } catch {
    return appEnv.siteOrigin;
  }
}

export function applySeoMeta(payload: SeoPayload) {
  const absoluteUrl = toAbsoluteUrl(payload.url);
  const absoluteImage = toAbsoluteUrl(payload.image);
  const isIndexable = payload.indexable ?? appEnv.appEnv === "production";

  document.title = payload.title;

  const descriptionTag = ensureMetaByName("description");
  descriptionTag.setAttribute("content", payload.description);
  const robotsTag = ensureMetaByName("robots");
  robotsTag.setAttribute("content", isIndexable ? INDEX_ROBOTS : NOINDEX_ROBOTS);

  const canonicalLink = ensureCanonicalLink();
  canonicalLink.setAttribute("href", absoluteUrl);
  ensureAlternateLink("es-CO").setAttribute("href", absoluteUrl);
  ensureAlternateLink("es").setAttribute("href", absoluteUrl);
  ensureAlternateLink("x-default").setAttribute("href", absoluteUrl);

  const ogType = ensureMetaByProperty("og:type");
  const ogUrl = ensureMetaByProperty("og:url");
  const ogTitle = ensureMetaByProperty("og:title");
  const ogDescription = ensureMetaByProperty("og:description");
  const ogImage = ensureMetaByProperty("og:image");
  const ogLocale = ensureMetaByProperty("og:locale");
  ogType.setAttribute("content", payload.type ?? "website");
  ogUrl.setAttribute("content", absoluteUrl);
  ogTitle.setAttribute("content", payload.title);
  ogDescription.setAttribute("content", payload.description);
  ogImage.setAttribute("content", absoluteImage);
  ogLocale.setAttribute("content", "es_CO");

  const twitterCard = ensureMetaByName("twitter:card");
  const twitterTitle = ensureMetaByName("twitter:title");
  const twitterDescription = ensureMetaByName("twitter:description");
  const twitterImage = ensureMetaByName("twitter:image");
  twitterCard.setAttribute("content", "summary_large_image");
  twitterTitle.setAttribute("content", payload.title);
  twitterDescription.setAttribute("content", payload.description);
  twitterImage.setAttribute("content", absoluteImage);
}
