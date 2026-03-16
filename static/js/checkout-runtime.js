// Runtime de carrito minimo para checkout dedicado (sin modal).
(function initCheckoutRuntime() {
  var STORAGE_KEY = 'naturalbe_cart';

  function safeParseCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY) || '[]';
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveCart(nextCart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));
    } catch (_) {
      // noop
    }
  }

  function formatCOP(value) {
    return '$' + Number(value || 0).toLocaleString('es-CO');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var cart = safeParseCart();
  try {
    if (Array.isArray(cart) && cart.length) {
      localStorage.setItem('naturalbe_cart_backup', JSON.stringify(cart));
    }
  } catch (_) {
    // noop
  }
  var beginCheckoutSent = false;
  window.cart = cart;
  window.getCartTotal = function getCartTotal() {
    return cart.reduce(function (sum, item) {
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  };
  window.clearCartForce = function clearCartForce() {
    cart = [];
    window.cart = cart;
    saveCart(cart);
  };
  window.clearCart = window.clearCartForce;
  window.buildCartEcomItems = function buildCartEcomItems(items) {
    return (Array.isArray(items) ? items : []).map(function (item) {
      return {
        item_id: item.id,
        item_name: item.name,
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        item_category: item.category || null
      };
    });
  };
  function safeGa4(eventName, items, value, extra) {
    if (typeof nbGa4EcomEvent === 'function') {
      nbGa4EcomEvent(eventName, items, value, extra);
      return;
    }
    window.__NB_GA4_QUEUE = window.__NB_GA4_QUEUE || [];
    window.__NB_GA4_QUEUE.push({
      event: eventName,
      items: items,
      value: value,
      extra: extra || {}
    });
  }

  function renderSummary() {
    var itemsEl = document.getElementById('checkoutItems');
    var subtotalEl = document.getElementById('checkoutSubtotal');
    var totalEl = document.getElementById('checkoutTotal');
    var shippingEl = document.getElementById('checkoutShipping');
    if (!itemsEl || !subtotalEl || !totalEl) return;

    if (!cart.length) {
      itemsEl.innerHTML = '<p class="checkout-empty">Tu carrito está vacío. Agrega productos para continuar.</p>';
      subtotalEl.textContent = '$0';
      totalEl.textContent = '$0';
      if (shippingEl) shippingEl.textContent = '$15.000 o gratis desde $100.000';
      var checkoutBtn = document.getElementById('wompiCheckoutBtn');
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    itemsEl.innerHTML = cart.map(function (item) {
      var name = escapeHtml(String(item.name || 'Producto'));
      var qty = Number(item.quantity || 1);
      var subtotal = Number(item.price || 0) * qty;
      return (
        '<div class="checkout-item">' +
          '<span>' + name + ' x' + qty + '</span>' +
          '<strong>' + formatCOP(subtotal) + '</strong>' +
        '</div>'
      );
    }).join('');

    var subtotal = window.getCartTotal();
    subtotalEl.textContent = formatCOP(subtotal);
    if (subtotal >= 100000) {
      if (shippingEl) shippingEl.textContent = 'Gratis';
      totalEl.textContent = formatCOP(subtotal);
    } else {
      if (shippingEl) shippingEl.textContent = '$15.000';
      totalEl.textContent = formatCOP(subtotal + 15000);
    }
    emitBeginCheckout();
  }

  function emitBeginCheckout() {
    if (beginCheckoutSent) return;
    if (!Array.isArray(cart) || !cart.length) return;
    if (typeof window.buildCartEcomItems !== 'function') return;
    var total = window.getCartTotal();
    var items = window.buildCartEcomItems(cart);
    safeGa4('begin_checkout', items, total, { method: 'checkout_page' });
    beginCheckoutSent = true;
  }

  window.addEventListener('DOMContentLoaded', renderSummary);
})();
