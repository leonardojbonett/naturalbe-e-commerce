// Promo bar helpers
(function () {
  const NB = (window.NaturalBe = window.NaturalBe || {});
  const STORAGE_KEY = 'nb_promo_closed';

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
    const height = bar.getBoundingClientRect().height || 0;
    setPromoOffset(height);
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
      }
    } catch (e) {}
  });

  window.addEventListener('resize', () => {
    syncPromoOffset();
  });
})();
