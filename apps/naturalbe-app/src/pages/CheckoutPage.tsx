import { Link } from "react-router-dom";
import { appEnv } from "../core/config/env";
import { formatCop } from "../features/catalog/lib/formatCop";
import {
  selectCartSubtotal,
  useCartStore
} from "../features/cart/useCartStore";
import { useState } from "react";
import {
  type CheckoutFormData,
  type CheckoutFormInput,
  validateCheckoutForm
} from "./checkoutValidation";
import { createOrder } from "../features/checkout/ordersApi";

const initialForm: CheckoutFormInput = {
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

export function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [form, setForm] = useState<CheckoutFormInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
  const parsedForm = validateCheckoutForm(form);
  const valid = parsedForm.success;
  const fieldErrors = parsedForm.success ? {} : parsedForm.error.flatten().fieldErrors;

  async function handleSubmitOrder() {
    if (!parsedForm.success || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const order = await createOrder({
        customer: parsedForm.data as CheckoutFormData,
        items: items.map((item) => ({ id: item.id, quantity: item.quantity }))
      });

      const whatsappHref = `https://wa.me/${appEnv.waNumber}?text=${encodeURIComponent(order.whatsappMessage)}`;
      window.location.assign(whatsappHref);
    } catch {
      setSubmitError("No pudimos confirmar el pedido. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
              maxLength={80}
            />
            {fieldErrors.fullName?.[0] ? <small className="text">{fieldErrors.fullName[0]}</small> : null}
          </label>

          <label htmlFor="phone">
            Telefono
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Ej. 3001234567"
              maxLength={16}
              inputMode="numeric"
            />
            {fieldErrors.phone?.[0] ? <small className="text">{fieldErrors.phone[0]}</small> : null}
          </label>

          <label htmlFor="city">
            Ciudad
            <input
              id="city"
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Ej. Bogota"
              maxLength={60}
            />
            {fieldErrors.city?.[0] ? <small className="text">{fieldErrors.city[0]}</small> : null}
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
              maxLength={140}
            />
            {fieldErrors.address?.[0] ? <small className="text">{fieldErrors.address[0]}</small> : null}
          </label>

          <label htmlFor="payment-method">
            Preferencia de pago
            <select
              id="payment-method"
              value={form.paymentMethod}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  paymentMethod: event.target.value as CheckoutFormInput["paymentMethod"]
                }))
              }
            >
              <option value="contraentrega">Contraentrega</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <small className="text">
              La confirmacion y el pago final se coordinan por WhatsApp con un asesor.
            </small>
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
              maxLength={240}
            />
            {fieldErrors.deliveryNote?.[0] ? (
              <small className="text">{fieldErrors.deliveryNote[0]}</small>
            ) : null}
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
          <button
            type="button"
            className={valid ? "detail-cta" : "detail-cta detail-cta-disabled"}
            aria-disabled={!valid}
            disabled={!valid || isSubmitting}
            onClick={handleSubmitOrder}
          >
            {isSubmitting ? "Confirmando pedido..." : "Confirmar y enviar por WhatsApp"}
          </button>
          {!valid ? <p className="text">Completa nombre, telefono, ciudad y direccion.</p> : null}
          {submitError ? <p className="text">{submitError}</p> : null}
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
