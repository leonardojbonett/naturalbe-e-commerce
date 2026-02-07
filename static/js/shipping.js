// Shipping widget (safe fallback)
(function () {
  const NB = (window.NaturalBe = window.NaturalBe || {});
  NB.shipping = NB.shipping || {};

  window.renderShippingWidget = function renderShippingWidget(container, state, options = {}) {
    if (!container) return;
    const isCompact = options.compact === true;
    const message = state && state.message ? state.message : 'Calcula el envío en el checkout.';
    container.innerHTML = `<div class="shipping-widget${isCompact ? ' is-compact' : ''}"><span>${message}</span></div>`;
  };
})();
