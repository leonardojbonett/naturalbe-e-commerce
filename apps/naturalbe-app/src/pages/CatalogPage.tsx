import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { CatalogFilters } from "../features/catalog/components/CatalogFilters";
import { ProductCard } from "../features/catalog/components/ProductCard";
import { fetchCatalogProducts } from "../features/catalog/catalogApi";
import { useCatalogFiltersStore } from "../features/catalog/useCatalogFiltersStore";
import type { CatalogProduct, CatalogSort } from "../features/catalog/types";
import { InstagramFeed } from "../features/social/components/InstagramFeed";
import { reportMetric } from "../core/observability/metrics";
import { applySeoMeta } from "../core/seo/meta";

const PAGE_SIZE = 24;
const QUERY_KEY_SEARCH = "q";
const QUERY_KEY_CATEGORY = "category";
const QUERY_KEY_SORT = "sort";
const QUERY_KEY_PAGE = "page";
const MOBILE_BP = 700;
const DESKTOP_BP = 1040;
const CATALOG_SCROLL_PATH_KEY = "catalog:scroll:path";
const CATALOG_SCROLL_Y_KEY = "catalog:scroll:y";
const CATALOG_SCROLL_PENDING_KEY = "catalog:scroll:pending";
const CATALOG_SCROLL_AT_KEY = "catalog:scroll:at";
const CATALOG_SCROLL_TTL_MS = 1000 * 60 * 30;
const CATALOG_META_DESCRIPTION =
  "Catalogo Natural Be con filtros por categoria, orden y busqueda para comprar suplementos y vitaminas.";
const DEFAULT_OG_IMAGE = "https://naturalbe.com.co/static/img/og-naturalbe.jpg";
const PRIORITY_BRAND_KEYS = ["healthy-america", "millenium-natural-systems", "botanitas", "nutramerican"] as const;
const DAILY_RANDOM_TIMEZONE = "America/Bogota";

function normalizeBrand(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getDailyBrandSeed(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: DAILY_RANDOM_TIMEZONE }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function getStableRandomScore(product: CatalogProduct, seed: string): number {
  const source = `${seed}|${product.slug}|${product.name}|${product.brand}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getStableTextScore(value: string, seed: string): number {
  let hash = 2166136261;
  const source = `${seed}|${value}`;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getPriorityBrandKey(brand: string): (typeof PRIORITY_BRAND_KEYS)[number] | null {
  const normalized = normalizeBrand(brand);
  if (normalized.includes("healthy america")) return "healthy-america";
  if (normalized.includes("millenium natural systems") || normalized.includes("millennium natural systems")) {
    return "millenium-natural-systems";
  }
  if (normalized.includes("botanitas")) return "botanitas";
  if (normalized.includes("nutramerican")) return "nutramerican";
  return null;
}

function parseSort(value: string | null): CatalogSort {
  if (value === "price-asc" || value === "price-desc" || value === "featured") {
    return value;
  }

  return "featured";
}

export function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window === "undefined" ? DESKTOP_BP : window.innerWidth
  );
  const [gridOffsetTop, setGridOffsetTop] = useState(0);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const virtualGridRef = useRef<HTMLDivElement | null>(null);
  const startedAtRef = useRef(performance.now());
  const catalogMetricSentRef = useRef(false);
  const lastFilterKeyRef = useRef<string | null>(null);

  const search = useCatalogFiltersStore((state) => state.search);
  const category = useCatalogFiltersStore((state) => state.category);
  const sort = useCatalogFiltersStore((state) => state.sort);
  const setSearch = useCatalogFiltersStore((state) => state.setSearch);
  const setCategory = useCatalogFiltersStore((state) => state.setCategory);
  const setSort = useCatalogFiltersStore((state) => state.setSort);
  const deferredSearch = useDeferredValue(search);

  const querySearch = searchParams.get(QUERY_KEY_SEARCH) ?? "";
  const queryCategory = searchParams.get(QUERY_KEY_CATEGORY) ?? "Todos";
  const querySort = parseSort(searchParams.get(QUERY_KEY_SORT));

  const columns = useMemo(() => {
    if (viewportWidth >= DESKTOP_BP) {
      return 3;
    }

    if (viewportWidth >= MOBILE_BP) {
      return 2;
    }

    return 1;
  }, [viewportWidth]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setHasError(false);

    fetchCatalogProducts()
      .then((data) => {
        if (!active) {
          return;
        }

        setProducts(data);
        setHasError(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setHasError(true);
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
  }, [reloadNonce]);

  useEffect(() => {
    if (search !== querySearch) {
      setSearch(querySearch);
    }
    if (category !== queryCategory) {
      setCategory(queryCategory);
    }
    if (sort !== querySort) {
      setSort(querySort);
    }
  }, [category, queryCategory, querySearch, querySort, search, setCategory, setSearch, setSort, sort]);

  const categories = useMemo(() => {
    const dynamic = new Set(products.map((product) => product.category));
    return ["Todos", ...Array.from(dynamic)];
  }, [products]);

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();

    const base = products.filter((product) => {
      const byCategory = category === "Todos" || product.category === category;
      const bySearch =
        term.length === 0 ||
        product.name.toLowerCase().includes(term) ||
        product.shortDescription.toLowerCase().includes(term);

      return byCategory && bySearch;
    });

    if (sort === "price-asc") {
      return [...base].sort((a, b) => a.price - b.price);
    }

    if (sort === "price-desc") {
      return [...base].sort((a, b) => b.price - a.price);
    }

    const prioritizedBuckets = new Map<(typeof PRIORITY_BRAND_KEYS)[number], CatalogProduct[]>();
    for (const key of PRIORITY_BRAND_KEYS) {
      prioritizedBuckets.set(key, []);
    }
    const others: CatalogProduct[] = [];
    const dailySeed = getDailyBrandSeed();

    for (const product of base) {
      const priorityKey = getPriorityBrandKey(product.brand);
      if (priorityKey) {
        prioritizedBuckets.get(priorityKey)?.push(product);
      } else {
        others.push(product);
      }
    }

    for (const productsByBrand of prioritizedBuckets.values()) {
      productsByBrand.sort(
        (a, b) => getStableRandomScore(a, dailySeed) - getStableRandomScore(b, dailySeed)
      );
    }

    const priorityOrder = [...PRIORITY_BRAND_KEYS].sort(
      (a, b) => getStableTextScore(a, dailySeed) - getStableTextScore(b, dailySeed)
    );
    const prioritized: CatalogProduct[] = [];
    let hasPendingPriority = true;
    while (hasPendingPriority) {
      hasPendingPriority = false;
      for (const key of priorityOrder) {
        const bucket = prioritizedBuckets.get(key);
        if (!bucket || bucket.length === 0) {
          continue;
        }
        hasPendingPriority = true;
        const nextProduct = bucket.shift();
        if (nextProduct) {
          prioritized.push(nextProduct);
        }
      }
    }

    others.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

    return [...prioritized, ...others];
  }, [category, deferredSearch, products, sort]);

  const rawPage = Number(searchParams.get(QUERY_KEY_PAGE) ?? "1");
  const currentPage =
    Number.isInteger(rawPage) && Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const visibleCount = PAGE_SIZE * currentPage;

  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      const nextParams = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value.length === 0) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      }

      setSearchParams(nextParams, { replace });
    },
    [searchParams, setSearchParams]
  );

  const setPage = useCallback((page: number, replace = false) => {
    const nextPage = Math.max(1, Math.trunc(page));
    updateQueryParams({ [QUERY_KEY_PAGE]: nextPage === 1 ? null : String(nextPage) }, replace);
  }, [updateQueryParams]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      updateQueryParams({
        [QUERY_KEY_SEARCH]: value.trim().length > 0 ? value : null,
        [QUERY_KEY_PAGE]: null
      });
    },
    [setSearch, updateQueryParams]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      setCategory(value);
      updateQueryParams({
        [QUERY_KEY_CATEGORY]: value !== "Todos" ? value : null,
        [QUERY_KEY_PAGE]: null
      });
    },
    [setCategory, updateQueryParams]
  );

  const handleSortChange = useCallback(
    (value: CatalogSort) => {
      setSort(value);
      updateQueryParams({
        [QUERY_KEY_SORT]: value !== "featured" ? value : null,
        [QUERY_KEY_PAGE]: null
      });
    },
    [setSort, updateQueryParams]
  );

  const currentFilterKey = `${querySearch}::${queryCategory}::${querySort}`;
  useEffect(() => {
    if (lastFilterKeyRef.current === null) {
      lastFilterKeyRef.current = currentFilterKey;
      return;
    }

    if (lastFilterKeyRef.current !== currentFilterKey) {
      lastFilterKeyRef.current = currentFilterKey;
      if (currentPage !== 1) {
        setPage(1, true);
      }
    }
  }, [currentFilterKey, currentPage, setPage]);

  const visibleProducts = useMemo(
    () => filtered.slice(0, Math.min(visibleCount, filtered.length)),
    [filtered, visibleCount]
  );
  const hasMoreProducts = visibleCount < filtered.length;
  const rowCount = Math.ceil(visibleProducts.length / columns);

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    const node = virtualGridRef.current;
    if (!node) {
      return;
    }

    const updateOffset = () => {
      const rect = node.getBoundingClientRect();
      setGridOffsetTop(rect.top + window.scrollY);
    };

    updateOffset();
    window.addEventListener("resize", updateOffset);

    return () => {
      window.removeEventListener("resize", updateOffset);
    };
  }, [columns, rowCount]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => (columns === 1 ? 392 : 376),
    overscan: 3,
    scrollMargin: gridOffsetTop
  });

  useEffect(() => {
    if (catalogMetricSentRef.current || isLoading || hasError || visibleProducts.length === 0) {
      return;
    }

    const elapsed = performance.now() - startedAtRef.current;
    reportMetric("catalog_time_to_grid_ms", elapsed, {
      totalFiltered: filtered.length,
      visibleCount: visibleProducts.length,
      page: currentPage,
      category,
      sort,
      hasQuery: search.trim().length > 0
    });
    catalogMetricSentRef.current = true;
  }, [category, currentPage, filtered.length, hasError, isLoading, search, sort, visibleProducts.length]);

  useEffect(() => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${location.pathname}${location.search}`
        : "https://naturalbe.com.co/";

    applySeoMeta({
      title: "Catalogo | Natural Be",
      description: CATALOG_META_DESCRIPTION,
      url,
      image: DEFAULT_OG_IMAGE,
      type: "website"
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isLoading || hasError || typeof window === "undefined") {
      return;
    }

    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const savedPath = window.sessionStorage.getItem(CATALOG_SCROLL_PATH_KEY);
    const pending = window.sessionStorage.getItem(CATALOG_SCROLL_PENDING_KEY);
    const rawY = window.sessionStorage.getItem(CATALOG_SCROLL_Y_KEY);
    const rawAt = window.sessionStorage.getItem(CATALOG_SCROLL_AT_KEY);
    const savedY = Number(rawY);
    const savedAt = Number(rawAt);

    const isFresh =
      Number.isFinite(savedAt) && Date.now() - savedAt <= CATALOG_SCROLL_TTL_MS;
    if (
      pending !== "1" ||
      !isFresh ||
      savedPath !== currentPath ||
      !Number.isFinite(savedY) ||
      savedY < 0
    ) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: savedY, behavior: "auto" });
    });

    window.sessionStorage.removeItem(CATALOG_SCROLL_PENDING_KEY);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [hasError, isLoading, location.hash, location.pathname, location.search]);

  const handleRetryCatalog = useCallback(() => {
    startedAtRef.current = performance.now();
    catalogMetricSentRef.current = false;
    setReloadNonce((prev) => prev + 1);
  }, []);

  return (
    <section className="stack">
      <nav aria-label="Breadcrumb" className="breadcrumb-nav">
        <ol className="breadcrumb-list">
          <li aria-current="page">Catalogo</li>
        </ol>
      </nav>
      <header className="catalog-head">
        <h1 className="title">Catalogo Natural Be</h1>
        <p className="text">
          Suplementos y vitaminas con envio en Colombia y pago seguro.
        </p>
        {!isLoading ? (
          <p className="text" role="status" aria-live="polite">
            Mostrando {visibleProducts.length} de {filtered.length} productos.
          </p>
        ) : null}
      </header>

      <CatalogFilters
        search={search}
        category={category}
        sort={sort}
        categories={categories}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
      />

      {isLoading ? <p className="text" role="status" aria-live="polite">Cargando catalogo...</p> : null}
      {hasError ? (
        <article className="card stack" role="alert">
          <p className="text">No pudimos cargar el catalogo en este momento.</p>
          <button type="button" className="detail-add-btn" onClick={handleRetryCatalog}>
            Reintentar catalogo
          </button>
        </article>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <article className="empty-state card">
          <h2>Sin resultados</h2>
          <p className="text">Prueba otra busqueda o categoria.</p>
        </article>
      ) : null}

      {isLoading ? (
        <div className="product-grid">
          {Array.from({ length: 12 }).map((_, index) => (
            <article key={`skeleton-${index}`} className="product-card skeleton-card" aria-hidden>
              <div className="product-media skeleton-block" />
              <div className="product-body">
                <div className="skeleton-line skeleton-line-short" />
                <div className="skeleton-line" />
                <div className="skeleton-line skeleton-line-medium" />
                <div className="skeleton-line skeleton-line-short" />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div
          ref={virtualGridRef}
          className="product-grid-virtual"
          role="list"
          aria-label="Productos del catalogo"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowStart = virtualRow.index * columns;
            const rowProducts = visibleProducts.slice(rowStart, rowStart + columns);

            return (
              <div
                key={virtualRow.key}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                className="product-grid-row"
                style={{
                  transform: `translateY(${virtualRow.start - (rowVirtualizer.options.scrollMargin ?? 0)}px)`,
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
                }}
              >
                {rowProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            );
          })}
        </div>
      )}
      {hasMoreProducts ? (
        <button
          type="button"
          className="detail-cta"
          aria-label={`Cargar ${Math.min(PAGE_SIZE, filtered.length - visibleProducts.length)} productos mas`}
          onClick={() => setPage(currentPage + 1)}
        >
          Cargar mas productos
        </button>
      ) : null}

      <InstagramFeed />
    </section>
  );
}
