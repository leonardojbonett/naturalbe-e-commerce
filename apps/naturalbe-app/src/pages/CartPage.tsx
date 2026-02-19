import { Link } from "react-router-dom";
import { formatCop } from "../features/catalog/lib/formatCop";
import {
  selectCartItemsCount,
  selectCartSubtotal,
  useCartStore
} from "../features/cart/useCartStore";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeProduct = useCartStore((state) => state.removeProduct);
  const clearCart = useCartStore((state) => state.clearCart);

  const totalItems = selectCartItemsCount(items);
  const subtotal = selectCartSubtotal(items);

  if (items.length === 0) {
    return (
      <section className="stack">
        <header className="catalog-head">
          <h1 className="title">Tu carrito</h1>
          <p className="text">Aun no agregaste productos.</p>
        </header>
        <article className="card stack">
          <p className="text">Explora el catalogo y agrega tus favoritos.</p>
          <Link className="back-link" to="/">
            Ir al catalogo
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="stack">
      <header className="catalog-head">
        <h1 className="title">Tu carrito</h1>
        <p className="text">{totalItems} producto(s) listo(s) para checkout.</p>
      </header>

      <div className="cart-layout">
        <div className="cart-list">
          {items.map((item) => (
            <article key={item.id} className="cart-item">
              <img className="cart-media" src={item.imageUrl} alt={item.name} loading="lazy" />
              <div className="cart-copy">
                <h2>{item.name}</h2>
                <p className="text">{formatCop(item.price)} c/u</p>
                <div className="cart-actions">
                  <div className="qty-control" aria-label={`Cantidad de ${item.name}`}>
                    <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeProduct(item.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <strong className="cart-line-total">{formatCop(item.quantity * item.price)}</strong>
            </article>
          ))}
        </div>

        <aside className="card cart-summary stack">
          <h2>Resumen</h2>
          <p className="text">Subtotal: {formatCop(subtotal)}</p>
          <Link className="detail-cta" to="/checkout">
            Ir a checkout
          </Link>
          <button type="button" className="clear-cart-btn" onClick={clearCart}>
            Vaciar carrito
          </button>
          <Link className="back-link" to="/">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </section>
  );
}
