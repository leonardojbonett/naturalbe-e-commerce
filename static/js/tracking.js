// Natural Be tracking (safe fallbacks)
(function () {
  const NB = (window.NaturalBe = window.NaturalBe || {});
  NB.tracking = NB.tracking || {};
  const META_PIXEL_ID = (document.querySelector('meta[name="meta-pixel-id"]') || {}).content || '';
  const DEFAULT_CURRENCY = 'COP';

  function ensureDataLayer() {
    if (!Array.isArray(window.dataLayer)) {
      window.dataLayer = [];
    }
    return window.dataLayer;
  }

  function isDebugMode() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      if (params.has('gtm_debug') || params.has('nb_debug') || params.has('ga_debug')) return true;
      if (window.localStorage && window.localStorage.getItem('nb_debug_mode') === '1') return true;
    } catch (_) {
      // noop
    }
    return false;
  }

  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function normalizeItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      item_id: String(item && (item.item_id || item.id || item.product_id) ? (item.item_id || item.id || item.product_id) : ''),
      item_name: (item && (item.item_name || item.name || item.nombre)) || '',
      item_brand: (item && (item.item_brand || item.brand || item.marca)) || 'Natural Be',
      item_category: (item && (item.item_category || item.category || item.categoria)) || '',
      price: toNumber(item && (item.price || item.precio)),
      quantity: Math.max(1, toNumber(item && (item.quantity || item.qty)) || 1)
    })).filter((item) => item.item_id || item.item_name);
  }

  function mapItemsToMetaContents(items) {
    return items.map((item) => ({
      id: item.item_id || item.item_name || '',
      quantity: item.quantity || 1,
      item_price: toNumber(item.price)
    }));
  }

  function mapGa4EventToMetaEvent(name) {
    const map = {
      add_to_cart: 'AddToCart',
      view_item: 'ViewContent',
      begin_checkout: 'InitiateCheckout',
      purchase: 'Purchase'
    };
    return map[name] || null;
  }

  function buildMetaPayload(name, items, value, extra) {
    const contents = mapItemsToMetaContents(items);
    const ids = contents.map((content) => String(content.id)).filter(Boolean);
    const first = items[0] || {};
    const payload = {
      content_type: items.length > 1 ? 'product_group' : 'product',
      content_ids: ids,
      contents: contents,
      value: toNumber(value),
      currency: (extra && extra.currency) || DEFAULT_CURRENCY
    };

    if (name === 'view_item') {
      payload.content_name = first.item_name || '';
    }
    if (name === 'purchase' && extra && extra.transaction_id) {
      payload.order_id = String(extra.transaction_id);
      payload.num_items = contents.reduce((sum, c) => sum + (c.quantity || 0), 0);
    }
    return payload;
  }

  function ensureMetaPixel() {
    if (typeof window.fbq === 'function') return true;
    if (!META_PIXEL_ID) return false;
    if (window.NB_META_PIXEL_DIRECT === false) return false;
    if (document.getElementById('nb-meta-pixel')) return false;

    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.id = 'nb-meta-pixel';
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    try {
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'PageView');
      return true;
    } catch (e) {
      return false;
    }
  }

  NB.logEvent = function logEvent(name, data) {
    const debugMode = isDebugMode();
    if (Array.isArray(window.dataLayer) || window.dataLayer === undefined) {
      ensureDataLayer().push({ event: name, ...(data || {}), ...(debugMode ? { debug_mode: true } : {}) });
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
      price: toNumber(product.price || product.precio || 0),
      quantity: Math.max(1, toNumber(quantity || 1) || 1)
    };
  };

  NB.nbGa4EcomEvent = function nbGa4EcomEvent(name, items, value, extra = {}) {
    const debugMode = isDebugMode();
    const normalizedItems = normalizeItems(items);
    const numericValue = toNumber(value);
    const currency = extra.currency || DEFAULT_CURRENCY;

    ensureDataLayer().push({
      event: name,
      ecommerce: {
        currency,
        value: numericValue,
        items: normalizedItems
      },
      ...(debugMode ? { debug_mode: true } : {}),
      ...extra
    });

    if (typeof window.gtag === 'function') {
      window.gtag('event', name, {
        currency,
        value: numericValue,
        items: normalizedItems,
        ...(debugMode ? { debug_mode: true } : {}),
        ...extra
      });
    }

    const metaEvent = mapGa4EventToMetaEvent(name);
    if (metaEvent && (ensureMetaPixel() || typeof window.fbq === 'function')) {
      try {
        window.fbq('track', metaEvent, buildMetaPayload(name, normalizedItems, numericValue, extra));
      } catch (e) {
        if (NB.DEBUG) {
          console.warn('[NB tracking] Meta Pixel track failed', metaEvent, e);
        }
      }
    }
  };

  function getNodeDescriptor(node) {
    if (!node || node.nodeType !== 1) return '';
    try {
      const tag = String(node.tagName || '').toLowerCase();
      const id = node.id ? `#${node.id}` : '';
      let classes = '';
      if (node.classList && node.classList.length) {
        classes = `.${Array.from(node.classList).slice(0, 2).join('.')}`;
      }
      return `${tag}${id}${classes}`;
    } catch (_) {
      return '';
    }
  }

  function setupCLSAttribution() {
    if (typeof window.PerformanceObserver !== 'function') return;
    if (!('PerformanceObserver' in window)) return;
    if (NB.tracking && NB.tracking.clsObserverBound) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionStart = 0;
    let sessionLast = 0;
    let maxEntry = null;
    let maxImpact = 0;
    let sent = false;

    const sendCLS = () => {
      if (sent || sessionValue <= 0) return;
      sent = true;

      const sourceNode = maxEntry && Array.isArray(maxEntry.sources) && maxEntry.sources[0]
        ? maxEntry.sources[0].node
        : null;

      const payload = {
        metric_name: 'CLS',
        metric_value: Number(sessionValue.toFixed(4)),
        metric_delta: Number((maxImpact || 0).toFixed(4)),
        worst_shift_value: Number((maxImpact || 0).toFixed(4)),
        worst_shift_target: getNodeDescriptor(sourceNode),
        page_path: window.location.pathname || '/',
        page_url: window.location.href || '',
        ...(isDebugMode() ? { debug_mode: true } : {})
      };

      NB.logEvent('web_vital_cls', payload);
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'web_vital_cls', payload);
      }
    };

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.hadRecentInput) return;

          const value = Number(entry.value || 0);
          const ts = Number(entry.startTime || 0);
          const startsNewSession = !sessionStart || (ts - sessionLast > 1000) || (ts - sessionStart > 5000);

          if (startsNewSession) {
            sessionStart = ts;
            sessionValue = value;
          } else {
            sessionValue += value;
          }
          sessionLast = ts;

          if (sessionValue > clsValue) clsValue = sessionValue;

          if (value >= maxImpact) {
            maxImpact = value;
            maxEntry = entry;
          }
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      NB.tracking.clsObserverBound = true;

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') sendCLS();
      }, { once: true });
      window.addEventListener('pagehide', sendCLS, { once: true });
    } catch (_) {
      // Noop: attribution not supported
    }
  }

  ensureMetaPixel();
  setupCLSAttribution();

  // Compat globals (legacy)
  if (typeof window.logEvent !== 'function') window.logEvent = NB.logEvent;
  if (typeof window.nbMapProductToGa4Item !== 'function') window.nbMapProductToGa4Item = NB.nbMapProductToGa4Item;
  if (typeof window.nbGa4EcomEvent !== 'function') window.nbGa4EcomEvent = NB.nbGa4EcomEvent;
})();
