import { Link, useLocation } from "react-router-dom";
import { appEnv } from "../../../core/config/env";
import { useCartStore } from "../../cart/useCartStore";
import type { CatalogProduct } from "../types";
import { formatCop } from "../lib/formatCop";
import { prefetchCatalogProductBySlug } from "../catalogApi";
import { markProductNavigationStart } from "../../../core/observability/metrics";

type ProductCardProps = {
  product: CatalogProduct;
};

const CATALOG_SCROLL_PATH_KEY = "catalog:scroll:path";
const CATALOG_SCROLL_Y_KEY = "catalog:scroll:y";
const CATALOG_SCROLL_PENDING_KEY = "catalog:scroll:pending";
const CATALOG_SCROLL_AT_KEY = "catalog:scroll:at";

export function ProductCard({ product }: ProductCardProps) {
  const location = useLocation();
  const addProduct = useCartStore((state) => state.addProduct);
  const catalogPath = `${location.pathname}${location.search}${location.hash}`;
  const linkState = { prefetchedProduct: product, fromCatalog: catalogPath };
  const handlePrefetch = () => prefetchCatalogProductBySlug(product.slug);
  const handleNavigate = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(CATALOG_SCROLL_PATH_KEY, catalogPath);
      window.sessionStorage.setItem(CATALOG_SCROLL_Y_KEY, String(window.scrollY));
      window.sessionStorage.setItem(CATALOG_SCROLL_PENDING_KEY, "1");
      window.sessionStorage.setItem(CATALOG_SCROLL_AT_KEY, String(Date.now()));
    }

    markProductNavigationStart(product.slug);
  };

  return (
    <article className="product-card" role="listitem">
      <Link
        to={`/producto/${product.slug}`}
        state={linkState}
        className="product-media-link"
        aria-label={`Ver detalle de ${product.name}`}
        title={`Ver detalle de ${product.name}`}
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        onTouchStart={handlePrefetch}
        onClick={handleNavigate}
      >
        <img
          className="product-media"
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
        />
      </Link>
      <div className="product-body">
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        <span className="product-category">{product.category}</span>
        <h2 className="product-name">
          <Link
            to={`/producto/${product.slug}`}
            state={linkState}
            aria-label={`Ver detalle de ${product.name}`}
            title={`Ver detalle de ${product.name}`}
            onMouseEnter={handlePrefetch}
            onFocus={handlePrefetch}
            onTouchStart={handlePrefetch}
            onClick={handleNavigate}
          >
            {product.name}
          </Link>
        </h2>
        <p className="product-brand">{product.brand}</p>
        <p className="product-copy">{product.shortDescription}</p>
        <div className="product-row">
          <div className="product-price-group">
            {product.offerPrice ? (
              <span className="product-old-price">{formatCop(product.offerPrice)}</span>
            ) : null}
            <strong className="product-price">{formatCop(product.price)}</strong>
          </div>
          <div className="product-row-actions">
            <button
              type="button"
              className="product-add-btn"
              aria-label={`Agregar ${product.name} al carrito`}
              onClick={() => addProduct(product)}
            >
              Agregar
            </button>
            <a
              href={`https://wa.me/${appEnv.waNumber}?text=${encodeURIComponent(`Hola, quiero comprar ${product.name}`)}`}
              className="product-cta product-cta-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Comprar
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
