(() => {
  const STYLE_ID = 'nb-play-ui';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .nb-play-overlay {
        position: fixed;
        inset: 0;
        background: rgba(8, 12, 24, 0.72);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        z-index: 9999;
      }
      .nb-play-modal {
        max-width: 520px;
        width: 100%;
        background: #ffffff;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.35);
        text-align: center;
        font-family: "Space Grotesk", "Segoe UI", sans-serif;
      }
      .nb-play-modal h3 {
        margin: 0 0 8px;
        font-size: 1.6rem;
        color: #0f172a;
      }
      .nb-play-modal .nb-score {
        font-size: 2.4rem;
        font-weight: 700;
        color: #2563eb;
        margin: 6px 0 10px;
      }
      .nb-play-modal .nb-meta {
        display: grid;
        gap: 8px;
        margin: 12px 0 16px;
        color: #475569;
        font-size: 0.95rem;
      }
      .nb-play-coupon {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        padding: 8px 14px;
        border-radius: 999px;
        background: #0f172a;
        color: #f8fafc;
        font-weight: 600;
        font-size: 0.9rem;
        margin-top: 6px;
      }
      .nb-play-actions {
        display: grid;
        gap: 10px;
        margin-top: 18px;
      }
      .nb-play-btn {
        border: none;
        border-radius: 14px;
        padding: 12px 16px;
        font-weight: 700;
        cursor: pointer;
        font-size: 1rem;
      }
      .nb-play-btn.primary {
        background: linear-gradient(135deg,#22c55e,#16a34a);
        color: #052e16;
      }
      .nb-play-btn.secondary {
        background: #e2e8f0;
        color: #0f172a;
      }
      .nb-play-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #0f172a;
        color: #f8fafc;
        padding: 12px 16px;
        border-radius: 12px;
        box-shadow: 0 12px 24px rgba(0,0,0,0.25);
        z-index: 10000;
        font-family: "Space Grotesk", "Segoe UI", sans-serif;
      }
    `;
    document.head.appendChild(style);
  }

  function showToast(message, duration = 2400) {
    ensureStyles();
    const toast = document.createElement('div');
    toast.className = 'nb-play-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  function showEndScreen(options = {}) {
    ensureStyles();
    const shareButton = options.onShare
      ? '<button class="nb-play-btn secondary" data-action="share">Compartir resultado</button>'
      : '';
    const overlay = document.createElement('div');
    overlay.className = 'nb-play-overlay';
    overlay.innerHTML = `
      <div class="nb-play-modal" role="dialog" aria-live="polite">
        <h3>${options.title || 'Juego completado'}</h3>
        <div class="nb-score">${options.scoreLabel || ''}</div>
        <div class="nb-meta">
          <div>${options.pointsLabel || ''}</div>
          <div class="nb-play-coupon">Codigo: ${options.coupon || ''}</div>
        </div>
        <div class="nb-play-actions">
          <button class="nb-play-btn primary" data-action="shop">Ir a la tienda NaturalBe</button>
          ${shareButton}
          <button class="nb-play-btn secondary" data-action="replay">Jugar de nuevo</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const shopBtn = overlay.querySelector('[data-action="shop"]');
    const replayBtn = overlay.querySelector('[data-action="replay"]');
    const shareBtn = overlay.querySelector('[data-action="share"]');

    shopBtn.addEventListener('click', () => {
      if (typeof options.onShop === 'function') options.onShop();
      if (options.shopUrl) window.location.href = options.shopUrl;
    });
    replayBtn.addEventListener('click', () => {
      overlay.remove();
      if (typeof options.onReplay === 'function') options.onReplay();
    });
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (typeof options.onShare === 'function') options.onShare();
      });
    }
  }

  function mountShopCta(container, options = {}) {
    if (!container) return;
    ensureStyles();
    container.innerHTML = `
      <div class="nb-play-modal" style="padding:16px;background:#f8fafc;border-radius:16px;">
        <div class="nb-meta">
          <div>${options.pointsLabel || ''}</div>
          <div class="nb-play-coupon">Codigo: ${options.coupon || ''}</div>
        </div>
        <div class="nb-play-actions">
          <button class="nb-play-btn primary" data-action="shop">Ir a la tienda NaturalBe</button>
        </div>
      </div>
    `;
    const shopBtn = container.querySelector('[data-action="shop"]');
    shopBtn.addEventListener('click', () => {
      if (typeof options.onShop === 'function') options.onShop();
      if (options.shopUrl) window.location.href = options.shopUrl;
    });
  }

  window.NBPlayUI = {
    showToast,
    showEndScreen,
    mountShopCta
  };
})();
