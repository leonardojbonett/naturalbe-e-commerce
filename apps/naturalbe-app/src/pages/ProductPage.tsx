import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchCatalogProductBySlug } from "../features/catalog/catalogApi";
import type { CatalogProduct } from "../features/catalog/types";
import { formatCop } from "../features/catalog/lib/formatCop";
import { appEnv } from "../core/config/env";
import { useCartStore } from "../features/cart/useCartStore";

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const addProduct = useCartStore((state) => state.addProduct);

  useEffect(() => {
    let active = true;

    if (!slug) {
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
      .finally(() => {
        if (!active) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return <p className="text">Cargando producto...</p>;
  }

  if (!product) {
    return (
      <article className="card stack">
        <h1 className="title">Producto no encontrado</h1>
        <p className="text">Es posible que haya sido removido del catalogo.</p>
        <Link to="/">Volver al catalogo</Link>
      </article>
    );
  }

  return (
    <article className="product-detail">
      <img className="detail-media" src={product.imageUrl} alt={product.name} />
      <div className="detail-copy stack">
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        <span className="product-category">{product.category}</span>
        <h1 className="title detail-title">{product.name}</h1>
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
          className="detail-cta"
          target="_blank"
          rel="noreferrer"
        >
          Comprar por WhatsApp
        </a>
        <Link className="back-link" to="/">
          Volver al catalogo
        </Link>
        <Link className="back-link" to="/carrito">
          Ir al carrito
        </Link>
      </div>
    </article>
  );
}
