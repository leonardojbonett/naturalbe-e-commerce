(function checkoutUxGuards() {
  var cartBody = document.getElementById('cartBody');
  var checkoutBtn = document.getElementById('wompiCheckoutBtn');
  var stepperItems = document.querySelectorAll('.checkout-stepper li');
  if (!cartBody) return;

  function setStep(stepIndex) {
    stepperItems.forEach(function (li, idx) {
      var active = idx === stepIndex;
      li.classList.toggle('is-active', active);
      if (active) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
  }

  function attachFallbackEvents() {
    var retryBtn = document.getElementById('checkoutRetryLoadBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        window.location.reload();
      });
    }
  }

  setStep(0);

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function () { setStep(1); });
  }

  window.addEventListener('wompi_ready', function () {
    clearTimeout(timer);
    setStep(1);
  });

  var timer = setTimeout(function () {
    if (cartBody.querySelector('form') || cartBody.querySelector('[data-wompi]')) return;
    cartBody.innerHTML = [
      '<div style="text-align:center;padding:1.5rem 1rem;">',
      '  <p style="font-size:1rem;color:#0f172a;font-weight:600;">No pudimos cargar el formulario de pago.</p>',
      '  <p style="color:#64748b;font-size:0.9rem;">Puedes finalizar tu compra directamente por WhatsApp.</p>',
      '  <a class="btn-primary" href="https://wa.me/573137212923?text=Quiero+finalizar+mi+compra+en+Natural+Be" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.5rem;margin-top:1rem;">Finalizar por WhatsApp</a>',
      '  <br><button id="checkoutRetryLoadBtn" class="btn-ghost" style="margin-top:0.75rem;width:auto;padding:0.5rem 1.2rem;">Reintentar carga</button>',
      '</div>'
    ].join('');
    attachFallbackEvents();
  }, 6000);

  var observer = new MutationObserver(function () {
    if (cartBody.querySelector('form') || cartBody.querySelector('[data-wompi]')) {
      clearTimeout(timer);
      observer.disconnect();
    }
  });
  observer.observe(cartBody, { childList: true, subtree: true });
})();
