(() => {
  function getCookieValue(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function isPauseModeOn() {
    return getCookieValue('nb_pause') === '1';
  }

  function injectPauseStyles() {
    if (document.getElementById('nb-pause-style')) return;
    const style = document.createElement('style');
    style.id = 'nb-pause-style';
    style.textContent = `
      .nb-pause-banner{
        position:sticky;top:0;z-index:99999;
        display:flex;gap:.5rem;align-items:center;justify-content:center;
        padding:.75rem 1rem;background:#fff3cd;color:#5c3d00;
        border-bottom:1px solid #f0d58c;font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      }
      .nb-pause-badge{
        display:inline-flex;align-items:center;justify-content:center;
        min-width:82px;padding:.15rem .5rem;border-radius:999px;
        background:#a54400;color:#fff;font-size:12px;font-weight:700;
      }
      .nb-pause-disabled{opacity:.6;cursor:not-allowed !important;}
    `;
    document.head.appendChild(style);
  }

  function injectPauseBanner() {
    if (document.getElementById('nbPauseBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'nbPauseBanner';
    banner.className = 'nb-pause-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
      <span class="nb-pause-badge" data-nosnippet>PAUSA</span>
      <span data-nosnippet>Tienda en pausa temporal. Compras y pagos estan deshabilitados por el momento.</span>
    `;
    const body = document.body;
    if (body && body.firstChild) body.insertBefore(banner, body.firstChild);
    else if (body) body.appendChild(banner);
  }

  function blockElement(el) {
    if (!el) return;
    el.classList.add('nb-pause-disabled');
    if ('disabled' in el) el.disabled = true;
    el.setAttribute('aria-disabled', 'true');
    el.setAttribute('title', 'Tienda en pausa temporal');
  }

  function blockKnownPurchaseControls() {
    const selectors = [
      '[data-add-to-cart]',
      '[data-cart-add]',
      '[data-checkout]',
      '.add-to-cart',
      '.btn-add-cart',
      '.btn-buy',
      'a[href*="checkout"]',
      'a[href*="add-to-cart"]',
      'button[onclick*="addToCart"]',
      'button[onclick*="checkout"]'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(blockElement);
  }

  function shouldBlockAction(target) {
    const actionEl = target && target.closest
        ? target.closest(
          '[data-add-to-cart],[data-cart-add],[data-checkout],.add-to-cart,.btn-add-cart,.btn-buy,a[href*="checkout"],a[href*="add-to-cart"],button[onclick*="addToCart"],button[onclick*="checkout"]'
        )
      : null;
    if (actionEl) return true;
    const href = (target && target.closest && target.closest('a') && target.closest('a').getAttribute('href')) || '';
    return /checkout|add-to-cart/i.test(String(href || ''));
  }

  function blockRuntimeActions() {
    document.addEventListener(
      'click',
      (event) => {
        if (!isPauseModeOn()) return;
        if (!shouldBlockAction(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        window.location.href = '/pausa-temporal.html';
      },
      true
    );

    if (typeof window.addToCart === 'function') {
      window.addToCart = function addToCartBlocked() {
        window.location.href = '/pausa-temporal.html';
      };
    }
    if (typeof window.checkoutWompi === 'function') {
      window.checkoutWompi = function checkoutBlocked() {
        window.location.href = '/pausa-temporal.html';
      };
    }
  }

  function initPauseMode() {
    if (!isPauseModeOn()) return;
    injectPauseStyles();
    injectPauseBanner();
    blockKnownPurchaseControls();
    blockRuntimeActions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPauseMode, { once: true });
  } else {
    initPauseMode();
  }
})();
