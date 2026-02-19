import { useEffect, useMemo, useState } from "react";
import { CatalogFilters } from "../features/catalog/components/CatalogFilters";
import { ProductCard } from "../features/catalog/components/ProductCard";
import { fetchCatalogProducts } from "../features/catalog/catalogApi";
import { useCatalogFiltersStore } from "../features/catalog/useCatalogFiltersStore";
import type { CatalogProduct } from "../features/catalog/types";

export function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const search = useCatalogFiltersStore((state) => state.search);
  const category = useCatalogFiltersStore((state) => state.category);
  const sort = useCatalogFiltersStore((state) => state.sort);
  const setSearch = useCatalogFiltersStore((state) => state.setSearch);
  const setCategory = useCatalogFiltersStore((state) => state.setCategory);
  const setSort = useCatalogFiltersStore((state) => state.setSort);

  useEffect(() => {
    let active = true;

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
  }, []);

  const categories = useMemo(() => {
    const dynamic = new Set(products.map((product) => product.category));
    return ["Todos", ...Array.from(dynamic)];
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

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

    return [...base].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [category, products, search, sort]);

  return (
    <section className="stack">
      <header className="catalog-head">
        <h1 className="title">Catalogo Natural Be</h1>
        <p className="text">
          Misma linea visual y precios del catalogo oficial, optimizado para compra mobile.
        </p>
        {!isLoading ? <p className="text">Mostrando {filtered.length} productos.</p> : null}
      </header>

      <CatalogFilters
        search={search}
        category={category}
        sort={sort}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onSortChange={setSort}
      />

      {isLoading ? <p className="text">Cargando catalogo...</p> : null}
      {hasError ? (
        <p className="text">No pudimos cargar el catalogo en este momento.</p>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <article className="empty-state card">
          <h2>Sin resultados</h2>
          <p className="text">Prueba otra busqueda o categoria.</p>
        </article>
      ) : null}

      <div className="product-grid">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
