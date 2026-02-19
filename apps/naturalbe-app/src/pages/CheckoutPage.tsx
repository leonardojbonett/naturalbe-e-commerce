import { Link } from "react-router-dom";
import { appEnv } from "../core/config/env";
import { formatCop } from "../features/catalog/lib/formatCop";
import {
  type CartItem,
  selectCartSubtotal,
  useCartStore
} from "../features/cart/useCartStore";
import { useState } from "react";

type CheckoutForm = {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  deliveryNote: string;
  paymentMethod: "contraentrega" | "transferencia" | "tarjeta";
};

const initialForm: CheckoutForm = {
  fullName: "",
  phone: "",
  city: "",
  address: "",
  deliveryNote: "",
  paymentMethod: "contraentrega"
};

const standardShippingFee = 15000;
const freeShippingThreshold = 100000;

function resolveShipping(city: string, subtotal: number): number {
  void city;

  if (subtotal >= freeShippingThreshold) {
    return 0;
  }

  return standardShippingFee;
}

function buildCheckoutMessage(
  items: CartItem[],
  form: CheckoutForm,
  shipping: number,
  total: number
): string {
  const lines = items.map(
    (item) => `- ${item.name} x${item.quantity} (${formatCop(item.quantity * item.price)})`
  );

  const subtotal = selectCartSubtotal(items);

  return [
    "Hola, quiero finalizar este pedido:",
    ...lines,
    "",
    `Subtotal: ${formatCop(subtotal)}`,
    `Envio: ${shipping === 0 ? "Gratis" : formatCop(shipping)}`,
    `Total: ${formatCop(total)}`,
    "",
    "Datos del cliente:",
    `Nombre: ${form.fullName}`,
    `Telefono: ${form.phone}`,
    `Ciudad: ${form.city}`,
    `Direccion: ${form.address}`,
    `Metodo de pago: ${form.paymentMethod}`,
    `Notas: ${form.deliveryNote || "Sin notas"}`
  ].join("\n");
}

function isFormValid(form: CheckoutForm): boolean {
  return (
    form.fullName.trim().length >= 3 &&
    form.phone.trim().length >= 7 &&
    form.city.trim().length >= 2 &&
    form.address.trim().length >= 6
  );
}

export function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [form, setForm] = useState<CheckoutForm>(initialForm);

  if (items.length === 0) {
    return (
      <section className="stack">
        <header className="catalog-head">
          <h1 className="title">Checkout</h1>
          <p className="text">Tu carrito esta vacio.</p>
        </header>
        <article className="card stack">
          <p className="text">Agrega productos para continuar con el checkout.</p>
          <Link className="back-link" to="/">
            Ir al catalogo
          </Link>
        </article>
      </section>
    );
  }

  const subtotal = selectCartSubtotal(items);
  const shipping = resolveShipping(form.city, subtotal);
  const total = subtotal + shipping;
  const valid = isFormValid(form);
  const whatsappHref = `https://wa.me/${appEnv.waNumber}?text=${encodeURIComponent(
    buildCheckoutMessage(items, form, shipping, total)
  )}`;

  return (
    <section className="stack">
      <header className="catalog-head">
        <h1 className="title">Checkout</h1>
        <p className="text">Completa tus datos para cerrar la compra.</p>
      </header>

      <div className="checkout-layout">
        <form className="card checkout-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="full-name">
            Nombre completo
            <input
              id="full-name"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Ej. Laura Martinez"
            />
          </label>

          <label htmlFor="phone">
            Telefono
            <input
              id="phone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Ej. 3001234567"
            />
          </label>

          <label htmlFor="city">
            Ciudad
            <input
              id="city"
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Ej. Bogota"
            />
            <small className="text">
              Envio {formatCop(standardShippingFee)}. Gratis desde{" "}
              {formatCop(freeShippingThreshold)}.
            </small>
          </label>

          <label htmlFor="address">
            Direccion
            <input
              id="address"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="Ej. Cra 12 # 34-56"
            />
          </label>

          <label htmlFor="payment-method">
            Metodo de pago
            <select
              id="payment-method"
              value={form.paymentMethod}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  paymentMethod: event.target.value as CheckoutForm["paymentMethod"]
                }))
              }
            >
              <option value="contraentrega">Contraentrega</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </label>

          <label htmlFor="delivery-note">
            Nota de entrega (opcional)
            <textarea
              id="delivery-note"
              value={form.deliveryNote}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, deliveryNote: event.target.value }))
              }
              placeholder="Ej. Entregar en porteria"
              rows={3}
            />
          </label>
        </form>

        <aside className="card checkout-summary stack">
          <h2>Resumen pedido</h2>
          <ul className="checkout-lines">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.name} x{item.quantity}</span>
                <strong>{formatCop(item.quantity * item.price)}</strong>
              </li>
            ))}
          </ul>
          <p className="text">Subtotal: {formatCop(subtotal)}</p>
          <p className="text">Envio: {shipping === 0 ? "Gratis" : formatCop(shipping)}</p>
          <p className="checkout-total">Total: {formatCop(total)}</p>
          <a
            href={whatsappHref}
            className={valid ? "detail-cta" : "detail-cta detail-cta-disabled"}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!valid}
            onClick={(event) => {
              if (!valid) {
                event.preventDefault();
              }
            }}
          >
            Finalizar por WhatsApp
          </a>
          {!valid ? <p className="text">Completa nombre, telefono, ciudad y direccion.</p> : null}
          <button type="button" className="clear-cart-btn" onClick={clearCart}>
            Vaciar carrito
          </button>
          <Link className="back-link" to="/carrito">
            Volver al carrito
          </Link>
        </aside>
      </div>
    </section>
  );
}
