// Natural Be core helpers (safe, minimal)
(function () {
  const NB = (window.NaturalBe = window.NaturalBe || {});
  NB.DEBUG = window.DEBUG === true;

  NB.log = function log(level, message, data) {
    if (!NB.DEBUG) return;
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn('[NaturalBe]', message, data || '');
  };

  NB.getQueryParams = function getQueryParams() {
    return new URLSearchParams(window.location.search || '');
  };

  NB.getParam = function getParam(key, fallback) {
    const params = NB.getQueryParams();
    return params.has(key) ? params.get(key) : fallback;
  };

  NB.setParam = function setParam(key, value, options = {}) {
    const params = NB.getQueryParams();
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    if (options.replace) {
      history.replaceState({}, '', nextUrl);
    } else {
      history.pushState({}, '', nextUrl);
    }
  };

  NB.fetchJson = async function fetchJson(url, options = {}) {
    const { fallback = null, onErrorMessage = '' } = options;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      NB.log('error', `fetchJson error: ${url}`, err);
      if (onErrorMessage) {
        const el = document.getElementById('catalogStatus') || document.getElementById('productStatus');
        if (el) {
          el.innerHTML = `<div class="catalog-alert"><span>${onErrorMessage}</span></div>`;
        }
      }
      return fallback;
    }
  };

  NB.buildProductURL = function buildProductURL(product) {
    if (!product) return './product.html';
    const slug = product.slug || product.product_slug || '';
    const id = product.id || product.product_id || '';
    if (slug) {
      return `./product.html?slug=${encodeURIComponent(slug)}`;
    }
    if (id) {
      return `./product.html?id=${encodeURIComponent(id)}`;
    }
    return './product.html';
  };
})();
