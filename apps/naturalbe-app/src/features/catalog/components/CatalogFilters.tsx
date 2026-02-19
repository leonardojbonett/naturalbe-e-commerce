import type { CatalogSort } from "../types";

type CatalogFiltersProps = {
  search: string;
  category: string;
  sort: CatalogSort;
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: CatalogSort) => void;
};

export function CatalogFilters({
  search,
  category,
  sort,
  categories,
  onSearchChange,
  onCategoryChange,
  onSortChange
}: CatalogFiltersProps) {
  return (
    <section className="catalog-filters" aria-label="Filtros de catalogo">
      <label className="search-wrap" htmlFor="catalog-search">
        Buscar producto
        <input
          id="catalog-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Ej. serum, protector, shampoo"
        />
      </label>

      <div className="chips" role="list" aria-label="Categorias">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={item === category ? "chip chip-active" : "chip"}
            onClick={() => onCategoryChange(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <label className="sort-wrap" htmlFor="catalog-sort">
        Ordenar
        <select
          id="catalog-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as CatalogSort)}
        >
          <option value="featured">Destacados</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
        </select>
      </label>
    </section>
  );
}
