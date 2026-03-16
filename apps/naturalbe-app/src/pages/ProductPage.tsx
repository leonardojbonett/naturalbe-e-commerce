import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchCatalogProductBySlug } from "../features/catalog/catalogApi";
import type { CatalogProduct } from "../features/catalog/types";
import { formatCop } from "../features/catalog/lib/formatCop";
import { appEnv } from "../core/config/env";
import { useCartStore } from "../features/cart/useCartStore";
import {
  consumeProductNavigationStart,
  reportMetric
} from "../core/observability/metrics";
import { applySeoMeta } from "../core/seo/meta";

type ProductLocationState = {
  prefetchedProduct?: CatalogProduct;
  fromCatalog?: string;
};

function getCatalogReturnPath(rawPath: string | undefined): string {
  if (!rawPath || !rawPath.startsWith("/")) {
    return "/";
  }

  return rawPath;
}

const DEFAULT_OG_IMAGE = "https://naturalbe.com.co/static/img/og-naturalbe.jpg";

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const locationState = (location.state as ProductLocationState | null) ?? null;
  const prefetchedProduct = locationState?.prefetchedProduct ?? null;
  const catalogReturnPath = getCatalogReturnPath(locationState?.fromCatalog);
  const initialProduct =
    prefetchedProduct && prefetchedProduct.slug === slug ? prefetchedProduct : null;
  const [product, setProduct] = useState<CatalogProduct | null>(initialProduct);
  const [isLoading, setIsLoading] = useState(Boolean(slug) && !initialProduct);
  const [hasError, setHasError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const addProduct = useCartStore((state) => state.addProduct);
  const startedAtRef = useRef(performance.now());
  const metricSentRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    let active = true;
    const hasPrefetchedMatch = Boolean(prefetchedProduct && prefetchedProduct.slug === slug);
    setHasError(false);
    setIsLoading(Boolean(slug) && !hasPrefetchedMatch);
    startedAtRef.current = performance.now();
    metricSentRef.current = false;

    if (!slug) {
      setIsLoading(false);
      return;
    }

    if (prefetchedProduct && prefetchedProduct.slug === slug) {
      setProduct(prefetchedProduct);
      setIsLoading(false);
      return;
    }

    fetchCatalogProductBySlug(slug)
      .then((result) => {
        if (!active) {
          return;
        }

        setProduct(result);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setHasError(true);
        setProduct(null);
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [prefetchedProduct, reloadNonce, slug]);

  useEffect(() => {
    if (metricSentRef.current || isLoading || !product) {
      return;
    }

    const readyMs = performance.now() - startedAtRef.current;
    reportMetric("product_time_to_ready_ms", readyMs, {
      slug: product.slug,
      prefetched: Boolean(initialProduct)
    });

    const navDelta = consumeProductNavigationStart(product.slug);
    if (navDelta !== null) {
      reportMetric("product_navigation_to_ready_ms", navDelta, {
        slug: product.slug,
        prefetched: Boolean(initialProduct)
      });
    }

    metricSentRef.current = true;
  }, [initialProduct, isLoading, product]);

  useEffect(() => {
    if (!isLoading && product) {
      titleRef.current?.focus();
    }
  }, [isLoading, product]);

  useEffect(() => {
    const currentUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${location.pathname}${location.search}`
        : "https://naturalbe.com.co/";

    if (isLoading) {
      applySeoMeta({
        title: "Cargando producto | Natural Be",
        description: "Cargando informacion del producto en Natural Be.",
        url: currentUrl,
        image: DEFAULT_OG_IMAGE,
        type: "website"
      });
      return;
    }

    if (hasError) {
      applySeoMeta({
        title: "Error de producto | Natural Be",
        description: "No pudimos cargar el producto solicitado en este momento.",
        url: currentUrl,
        image: DEFAULT_OG_IMAGE,
        type: "website"
      });
      return;
    }

    if (!product) {
      applySeoMeta({
        title: "Producto no encontrado | Natural Be",
        description: "El producto solicitado no se encuentra disponible en el catalogo.",
        url: currentUrl,
        image: DEFAULT_OG_IMAGE,
        type: "website"
      });
      return;
    }

    applySeoMeta({
      title: `${product.name} | Natural Be`,
      description: product.shortDescription || product.description.slice(0, 155),
      url: currentUrl,
      image: product.imageUrl || DEFAULT_OG_IMAGE,
      type: "product"
    });
  }, [hasError, isLoading, location.pathname, location.search, product]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const linksToCleanup: HTMLLinkElement[] = [];

    try {
      const imageUrl = new URL(product.imageUrl, window.location.origin);
      const preconnectSelector = `link[rel="preconnect"][href="${imageUrl.origin}"][data-nb-dynamic="1"]`;
      const preloadSelector = `link[rel="preload"][as="image"][href="${imageUrl.href}"][data-nb-dynamic="1"]`;

      const hasPreconnect = document.head.querySelector(preconnectSelector);
      if (!hasPreconnect) {
        const preconnect = document.createElement("link");
        preconnect.setAttribute("rel", "preconnect");
        preconnect.setAttribute("href", imageUrl.origin);
        preconnect.setAttribute("crossorigin", "");
        preconnect.setAttribute("data-nb-dynamic", "1");
        document.head.appendChild(preconnect);
        linksToCleanup.push(preconnect);
      }

      const hasPreload = document.head.querySelector(preloadSelector);
      if (!hasPreload) {
        const preload = document.createElement("link");
        preload.setAttribute("rel", "preload");
        preload.setAttribute("as", "image");
        preload.setAttribute("href", imageUrl.href);
        preload.setAttribute("data-nb-dynamic", "1");
        document.head.appendChild(preload);
        linksToCleanup.push(preload);
      }
    } catch {
      return;
    }

    return () => {
      for (const link of linksToCleanup) {
        link.remove();
      }
    };
  }, [product]);

  const productJsonLd = useMemo(() => {
    if (!product) {
      return null;
    }

    const canonicalUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/producto/${product.slug}`
        : `/producto/${product.slug}`;

    return safeJsonLd({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: [product.imageUrl],
      description: product.description,
      brand: { "@type": "Brand", name: product.brand },
      category: product.category,
      offers: {
        "@type": "Offer",
        priceCurrency: "COP",
        price: Number(product.price.toFixed(2)),
        availability: product.isAvailable
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: canonicalUrl
      }
    });
  }, [product]);

  const breadcrumbJsonLd = useMemo(() => {
    if (!product) {
      return null;
    }

    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";
    return safeJsonLd({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Catalogo", item: `${siteOrigin}${catalogReturnPath}` },
        { "@type": "ListItem", position: 2, name: product.name, item: `${siteOrigin}/producto/${product.slug}` }
      ]
    });
  }, [catalogReturnPath, product]);

  if (isLoading) {
    return (
      <>
        <nav aria-label="Breadcrumb" className="breadcrumb-nav">
          <ol className="breadcrumb-list">
            <li><Link to={catalogReturnPath}>Catalogo</Link></li>
            <li aria-current="page">Cargando producto</li>
          </ol>
        </nav>
        <article className="product-detail product-detail-skeleton" aria-hidden>
          <div className="detail-media skeleton-block" />
          <div className="detail-copy stack">
            <div className="skeleton-line skeleton-line-short" />
            <div className="skeleton-line skeleton-line-medium" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line-medium" />
            <div className="skeleton-line skeleton-line-short" />
          </div>
        </article>
      </>
    );
  }

  if (hasError) {
    return (
      <>
        <nav aria-label="Breadcrumb" className="breadcrumb-nav">
          <ol className="breadcrumb-list">
            <li><Link to={catalogReturnPath}>Catalogo</Link></li>
            <li aria-current="page">Error de producto</li>
          </ol>
        </nav>
        <article className="card stack" role="alert">
          <h1 className="title">Error cargando producto</h1>
          <p className="text">No pudimos cargar la informacion en este momento.</p>
          <button type="button" className="detail-add-btn" onClick={() => setReloadNonce((prev) => prev + 1)}>
            Reintentar producto
          </button>
          <Link className="back-link" to={catalogReturnPath}>
            Volver al catalogo
          </Link>
        </article>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <nav aria-label="Breadcrumb" className="breadcrumb-nav">
          <ol className="breadcrumb-list">
            <li><Link to={catalogReturnPath}>Catalogo</Link></li>
            <li aria-current="page">Producto no encontrado</li>
          </ol>
        </nav>
        <article className="card stack">
          <h1 className="title">Producto no encontrado</h1>
          <p className="text">Es posible que haya sido removido del catalogo.</p>
          <Link to={catalogReturnPath}>Volver al catalogo</Link>
        </article>
      </>
    );
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumb-nav">
        <ol className="breadcrumb-list">
          <li><Link to={catalogReturnPath}>Catalogo</Link></li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>
      <article className="product-detail">
        <img className="detail-media" src={product.imageUrl} alt={product.name} />
        <div className="detail-copy stack">
          {product.badge ? <span className="product-badge">{product.badge}</span> : null}
          <span className="product-category">{product.category}</span>
          <h1 ref={titleRef} tabIndex={-1} className="title detail-title">{product.name}</h1>
          <p className="product-brand">{product.brand}</p>
          <p className="text">{product.description}</p>
          <div className="product-price-group">
            {product.offerPrice ? (
              <span className="product-old-price">{formatCop(product.offerPrice)}</span>
            ) : null}
            <strong className="detail-price">{formatCop(product.price)}</strong>
          </div>
          <button type="button" className="detail-add-btn" onClick={() => addProduct(product)}>
            Agregar al carrito
          </button>
          <a
            href={`https://wa.me/${appEnv.waNumber}?text=${encodeURIComponent(`Hola, quiero comprar ${product.name}`)}`}
            className="detail-cta detail-cta-outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Comprar por WhatsApp
          </a>
          <Link className="back-link" to={catalogReturnPath}>
            Volver al catalogo
          </Link>
          <Link className="back-link" to="/carrito">
            Ir al carrito
          </Link>
        </div>
      </article>
      {productJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd }} />
      ) : null}
      {breadcrumbJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      ) : null}
    </>
  );
}
