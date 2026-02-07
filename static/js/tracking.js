// Natural Be tracking (safe fallbacks)
(function () {
  const NB = (window.NaturalBe = window.NaturalBe || {});
  NB.tracking = NB.tracking || {};

  NB.logEvent = function logEvent(name, data) {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: name, ...(data || {}) });
    }
    if (NB.DEBUG) {
      console.log('[NB event]', name, data || {});
    }
  };

  NB.nbMapProductToGa4Item = function nbMapProductToGa4Item(product, quantity) {
    if (!product) return {};
    return {
      item_id: String(product.id || product.product_id || ''),
      item_name: product.nombre || product.name || '',
      item_brand: product.marca || product.brand || 'Natural Be',
      item_category: product.categoria || product.category || '',
      price: Number(product.price || product.precio || 0),
      quantity: Number(quantity || 1)
    };
  };

  NB.nbGa4EcomEvent = function nbGa4EcomEvent(name, items, value, extra = {}) {
    if (!Array.isArray(window.dataLayer)) return;
    window.dataLayer.push({
      event: name,
      ecommerce: {
        currency: 'COP',
        value: Number(value || 0),
        items: items || []
      },
      ...extra
    });
  };

  // Compat globals (legacy)
  if (typeof window.logEvent !== 'function') window.logEvent = NB.logEvent;
  if (typeof window.nbMapProductToGa4Item !== 'function') window.nbMapProductToGa4Item = NB.nbMapProductToGa4Item;
  if (typeof window.nbGa4EcomEvent !== 'function') window.nbGa4EcomEvent = NB.nbGa4EcomEvent;
})();
