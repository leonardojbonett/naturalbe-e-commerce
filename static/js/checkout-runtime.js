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

  function renderSummary() {
    var itemsEl = document.getElementById('checkoutItems');
    var subtotalEl = document.getElementById('checkoutSubtotal');
    var totalEl = document.getElementById('checkoutTotal');
    if (!itemsEl || !subtotalEl || !totalEl) return;

    if (!cart.length) {
      itemsEl.innerHTML = '<p class="checkout-empty">Tu carrito está vacío. Agrega productos para continuar.</p>';
      subtotalEl.textContent = '$0';
      totalEl.textContent = '$0';
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
    totalEl.textContent = subtotal >= 100000 ? formatCOP(subtotal) : formatCOP(subtotal + 15000);
    emitBeginCheckout();
  }

  function emitBeginCheckout() {
    if (beginCheckoutSent) return;
    if (!Array.isArray(cart) || !cart.length) return;
    if (typeof nbGa4EcomEvent !== 'function' || typeof window.buildCartEcomItems !== 'function') return;
    var total = window.getCartTotal();
    var items = window.buildCartEcomItems(cart);
    nbGa4EcomEvent('begin_checkout', items, total, { method: 'checkout_page' });
    beginCheckoutSent = true;
  }

  window.addEventListener('DOMContentLoaded', renderSummary);
})();
