(function initCheckoutPageWompi() {
  var btn = document.getElementById('wompiCheckoutBtn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    if (typeof window.checkoutWompi === 'function') {
      window.checkoutWompi();
      return;
    }
    window.addEventListener('wompi_ready', function () {
      if (typeof window.checkoutWompi === 'function') window.checkoutWompi();
    }, { once: true });
  });
})();
