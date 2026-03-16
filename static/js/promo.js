// Promo bar helpers
(function () {
  const NB = (window.NaturalBe = window.NaturalBe || {});
  const STORAGE_KEY = 'nb_promo_closed';
  const PROMO_OFFSET_PX = 34;

  function hidePromo() {
    const bar = document.getElementById('promoBar');
    if (bar) bar.style.display = 'none';
    setPromoOffset(0);
  }

  function setPromoOffset(value) {
    const px = Number(value) > 0 ? `${Number(value)}px` : '0px';
    document.documentElement.style.setProperty('--promo-offset', px);
  }

  function syncPromoOffset() {
    const bar = document.getElementById('promoBar');
    if (!bar || bar.style.display === 'none') {
      setPromoOffset(0);
      return;
    }
    // Fixed promo bar height avoids layout reads and forced reflow.
    setPromoOffset(PROMO_OFFSET_PX);
  }

  function initPromoRotation() {
    const messageEl = document.getElementById('promoMessage');
    if (!messageEl || messageEl.getAttribute('data-rotate') !== '1') return;
    const messages = [
      'Envío 24-48h a toda Colombia',
      'Pago contraentrega disponible en gran parte del país',
      'Pagos seguros con Wompi y PSE',
      'Asesoría por WhatsApp: +57 313 721 2923'
    ];
    if (!messages.length) return;
    let index = 0;
    messageEl.textContent = messages[index];
    if (messages.length === 1) return;
    window.setInterval(() => {
      index = (index + 1) % messages.length;
      messageEl.textContent = messages[index];
    }, 3800);
  }

  window.closePromoBar = function closePromoBar() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (e) {}
    hidePromo();
  };

  document.addEventListener('DOMContentLoaded', () => {
    try {
      const closed = localStorage.getItem(STORAGE_KEY);
      if (closed) {
        hidePromo();
      } else {
        syncPromoOffset();
        initPromoRotation();
      }
    } catch (e) {}
  });

  window.addEventListener('resize', syncPromoOffset, { passive: true });
})();
