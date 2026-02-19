import { Link } from "react-router-dom";
import { appEnv } from "../../../core/config/env";
import { useCartStore } from "../../cart/useCartStore";
import type { CatalogProduct } from "../types";
import { formatCop } from "../lib/formatCop";

type ProductCardProps = {
  product: CatalogProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const addProduct = useCartStore((state) => state.addProduct);

  return (
    <article className="product-card">
      <Link to={`/producto/${product.slug}`} className="product-media-link">
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
          <Link to={`/producto/${product.slug}`}>{product.name}</Link>
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
            <button type="button" className="product-add-btn" onClick={() => addProduct(product)}>
              Agregar
            </button>
            <a
              href={`https://wa.me/${appEnv.waNumber}?text=${encodeURIComponent(`Hola, quiero comprar ${product.name}`)}`}
              className="product-cta"
              target="_blank"
              rel="noreferrer"
            >
              Comprar
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
