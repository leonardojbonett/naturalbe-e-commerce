(() => {
  const CATALOG_URLS = ['/static/data/productos.json', './static/data/productos.json'];
  const PLACEHOLDER_IMAGE = '/static/img/placeholder.webp';
  const FEATURED_LIMIT = 8;
  const BEST_SELLERS_LIMIT = 6;
  const BEST_SELLERS_MIN_SIGNALS = 4;

  const TARGET_BRANDS = [
    { name: 'Healthy America', aliases: ['healthy america'] },
    { name: 'Millennium Natural Systems', aliases: ['millennium natural systems', 'millenium natural systems'] },
    { name: 'Botanitas', aliases: ['botanitas'] },
    { name: 'Funat', aliases: ['funat'] },
    { name: 'Nutramerican Pharma', aliases: ['nutramerican pharma', 'nutramerican'] }
  ];

  const SEO_TERMS = [
    'omega', 'omega 3', 'omega-3', 'colageno', 'colageno hidrolizado', 'colageno hidrolizado',
    'colageno', 'colageno', 'biotina', 'magnesio', 'vitamina', 'vitaminas', 'probiotico',
    'probio', 'colageno+biotina', 'zinc', 'vitamina d', 'vitamina c', 'd3', 'magnesium'
  ];

  const normalizeKey = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const targetBrandSet = new Set(
    TARGET_BRANDS.flatMap((b) => b.aliases.map((a) => normalizeKey(a)))
  );

  const targetBrandKey = (brand) => {
    const normalized = normalizeKey(brand);
    if (!normalized) return '';
    for (const item of TARGET_BRANDS) {
      if (item.aliases.some((alias) => normalizeKey(alias) === normalized)) {
        return item.name;
      }
    }
    return '';
  };

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ''));

  const resolveAsset = (src) => {
    const raw = String(src || '');
    if (!raw) return PLACEHOLDER_IMAGE;
    if (isAbsoluteUrl(raw)) return raw;
    if (raw.startsWith('//')) return `/${raw.replace(/^\/+/, '')}`;
    if (window.location && window.location.protocol === 'file:') {
      if (/^[a-zA-Z]:[\\/]/.test(raw)) return raw;
      if (raw.startsWith('/')) return `.${raw}`;
      return raw;
    }
    if (raw.startsWith('/')) return raw;
    return `/${raw.replace(/^\.?\//, '')}`;
  };

  const buildProductUrl = (product) => {
    const link = product && (product.link || product.url || '');
    if (link) {
      if (isAbsoluteUrl(link)) return link;
      if (String(link).startsWith('/')) return link;
    }
    const slug = product && product.slug;
    if (slug) return `/producto/${encodeURIComponent(slug)}.html`;
    return '/category.html';
  };

  const formatCOP = (value) => {
    if (window.nbMarketplace && typeof window.nbMarketplace.formatCOP === 'function') {
      return window.nbMarketplace.formatCOP(value);
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  };

  const hasRealImage = (product) => {
    const img = String(product?.imagen_principal || product?.imagen_principal_webp || product?.image || '');
    if (!img) return false;
    return !img.toLowerCase().includes('placeholder');
  };

  const getHomePriority = (product) => {
    const direct = product?.home_priority;
    if (typeof direct === 'number') return direct;
    if (direct === true) return 1;
    const raw = product?.raw?.home_priority;
    if (typeof raw === 'number') return raw;
    if (raw === true) return 1;
    return 0;
  };

  const isTargetBrand = (brand) => targetBrandSet.has(normalizeKey(brand));

  const badgeText = (product) => {
    const badge = product?.badgeLabel || product?.badge || '';
    return normalizeKey(badge);
  };

  const hasBestSellerSignal = (product) => {
    const badge = badgeText(product);
    return product?.isPopular === true ||
      badge.includes('mas vendido') ||
      badge.includes('más vendido') ||
      badge.includes('top ventas') ||
      badge.includes('best seller');
  };

  const hasSecondarySignal = (product) => {
    const badge = badgeText(product);
    return product?.isNew === true ||
      badge.includes('popular') ||
      badge.includes('nuevo') ||
      badge.includes('lanzamiento');
  };

  const hasSeoIntent = (product) => {
    const tags = Array.isArray(product?.tags) ? product.tags : [];
    const source = `${tags.join(' ')} ${product?.nombre || product?.name || ''}`.toLowerCase();
    return SEO_TERMS.some((term) => source.includes(term));
  };

  const computePriceStats = (products) => {
    const prices = products
      .map((p) => Number(p?.precio || p?.price || 0))
      .filter((p) => Number.isFinite(p) && p > 0)
      .sort((a, b) => a - b);
    if (!prices.length) {
      return { median: 0, p25: 0, p75: 0, iqr: 0 };
    }
    const percentile = (pct) => {
      const idx = Math.floor((prices.length - 1) * pct);
      return prices[idx];
    };
    const p25 = percentile(0.25);
    const p75 = percentile(0.75);
    const median = percentile(0.5);
    return { median, p25, p75, iqr: Math.max(1, p75 - p25) };
  };

  const scoreProduct = (product, stats) => {
    if (!product || product.disponible === false) {
      return { score: -Infinity, reasons: ['no disponible'] };
    }

    let score = 0;
    const reasons = [];

    const brand = product?.marca || '';
    if (isTargetBrand(brand)) {
      score += 40;
      reasons.push('marca objetivo');
    }

    const homePriority = getHomePriority(product);
    if (homePriority) {
      score += 60 + Math.min(20, homePriority * 5);
      reasons.push('home_priority');
    }

    if (hasBestSellerSignal(product)) {
      score += 35;
      reasons.push('badge mas vendido/popular');
    } else if (hasSecondarySignal(product)) {
      score += 18;
      reasons.push('badge nuevo/popular');
    }

    if (hasRealImage(product)) {
      score += 12;
      reasons.push('imagen real');
    } else {
      score -= 8;
      reasons.push('imagen placeholder');
    }

    if (hasSeoIntent(product)) {
      score += 15;
      reasons.push('intencion de busqueda');
    }

    const price = Number(product?.precio || product?.price || 0);
    if (Number.isFinite(price) && price > 0 && stats.median > 0) {
      const distance = Math.abs(price - stats.median);
      const normalized = Math.min(1, distance / (stats.iqr || stats.median));
      const priceScore = 12 * (1 - normalized);
      score += priceScore;
      if (price < stats.p25 * 0.6 || price > stats.p75 * 2) {
        score -= 6;
        reasons.push('precio extremo');
      } else {
        reasons.push('precio medio');
      }
    }

    return { score, reasons };
  };

  const pickWithLimits = (items, limit, maxPerBrand, maxPerCategory, seed = []) => {
    const selected = [...seed];
    const brandCounts = new Map();
    const categoryCounts = new Map();

    selected.forEach(({ product }) => {
      const brand = normalizeKey(product?.marca || 'sin marca');
      const category = normalizeKey(product?.subcategoria || product?.categoria || 'otros');
      brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    for (const entry of items) {
      if (selected.length >= limit) break;
      if (selected.includes(entry)) continue;
      const brand = normalizeKey(entry.product?.marca || 'sin marca');
      const category = normalizeKey(entry.product?.subcategoria || entry.product?.categoria || 'otros');
      const brandCount = brandCounts.get(brand) || 0;
      const categoryCount = categoryCounts.get(category) || 0;
      if (brandCount >= maxPerBrand || categoryCount >= maxPerCategory) continue;
      selected.push(entry);
      brandCounts.set(brand, brandCount + 1);
      categoryCounts.set(category, categoryCount + 1);
    }
    return selected;
  };

  const buildCardHtml = (product) => {
    const name = product?.nombre || product?.name || '';
    const brand = product?.marca || '';
    const price = Number(product?.precio_oferta || product?.precio || product?.price || 0);
    const img = resolveAsset(product?.imagen_principal || product?.imagen_principal_webp || product?.image || '');
    const url = buildProductUrl(product);
    const safeName = escapeHtml(name);
    const safeBrand = escapeHtml(brand);
    const safePrice = escapeHtml(formatCOP(price));
    const safeUrl = escapeHtml(url);
    const safeImg = escapeHtml(img);

    return `
      <article class="product-card">
        <a class="product-card__media" href="${safeUrl}">
          <img src="${safeImg}" alt="${safeBrand} ${safeName}" loading="lazy" decoding="async" width="320" height="240" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';">
        </a>
        <div class="product-card__body">
          <h3 class="product-card__title">
            <a href="${safeUrl}">${safeName}</a>
          </h3>
          <div class="product-card__rating">${safeBrand}</div>
          <div class="product-card__price">
            <span>${safePrice}</span>
          </div>
          <div class="product-card__actions">
            <a class="btn-primary" href="${safeUrl}">Ver producto</a>
          </div>
        </div>
      </article>
    `;
  };

  const renderList = (list, container) => {
    if (!container) return;
    if (!Array.isArray(list) || !list.length) {
      container.innerHTML = '';
      return;
    }
    container.innerHTML = list.map((entry) => buildCardHtml(entry.product)).join('');
  };

  const setSectionVisibility = (sectionId, isVisible) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.style.display = isVisible ? '' : 'none';
  };

  const showStatus = (statusId, message) => {
    const statusEl = document.getElementById(statusId);
    if (!statusEl) return;
    statusEl.innerHTML = `
      <div class="catalog-alert">
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  };

  const loadCatalog = async () => {
    if (typeof window.loadProductsData === 'function') {
      return window.loadProductsData();
    }
    let lastError = null;
    for (const url of CATALOG_URLS) {
      try {
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`);
        const payload = await res.json();
        if (!Array.isArray(payload)) throw new Error('catalog payload is not an array');
        return payload;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('catalog fetch failed');
  };

  const buildSelections = (products) => {
    const stats = computePriceStats(products);
    const scored = products
      .map((product) => ({ product, ...scoreProduct(product, stats) }))
      .filter((entry) => Number.isFinite(entry.score) && entry.score > -Infinity)
      .sort((a, b) => b.score - a.score);

    const targetScored = scored.filter((entry) => isTargetBrand(entry.product?.marca || ''));
    const otherScored = scored.filter((entry) => !isTargetBrand(entry.product?.marca || ''));

    const byBrand = new Map();
    targetScored.forEach((entry) => {
      const key = targetBrandKey(entry.product?.marca || '');
      if (!key) return;
      if (!byBrand.has(key)) byBrand.set(key, []);
      byBrand.get(key).push(entry);
    });
    for (const list of byBrand.values()) {
      list.sort((a, b) => b.score - a.score);
    }

    const featuredSeed = [];
    const seedCategoryCounts = new Map();
    TARGET_BRANDS.forEach((brand) => {
      const list = byBrand.get(brand.name) || [];
      for (const entry of list) {
        const category = normalizeKey(entry.product?.subcategoria || entry.product?.categoria || 'otros');
        const count = seedCategoryCounts.get(category) || 0;
        if (count >= 2) continue;
        featuredSeed.push(entry);
        seedCategoryCounts.set(category, count + 1);
        break;
      }
    });

    let featured = pickWithLimits([...targetScored, ...otherScored], FEATURED_LIMIT, 2, 2, featuredSeed);
    if (featured.length < FEATURED_LIMIT) {
      featured = pickWithLimits([...targetScored, ...otherScored], FEATURED_LIMIT, 3, 3, featured);
    }
    if (featured.length < FEATURED_LIMIT) {
      featured = pickWithLimits([...targetScored, ...otherScored], FEATURED_LIMIT, 99, 99, featured);
    }

    const bestCandidates = scored.filter((entry) => hasBestSellerSignal(entry.product));
    let bestSellers = [];
    if (bestCandidates.length >= BEST_SELLERS_MIN_SIGNALS) {
      bestSellers = pickWithLimits(bestCandidates, BEST_SELLERS_LIMIT, 2, 2);
      if (bestSellers.length < BEST_SELLERS_LIMIT) {
        bestSellers = pickWithLimits(bestCandidates, BEST_SELLERS_LIMIT, 3, 3, bestSellers);
      }
      if (bestSellers.length < BEST_SELLERS_LIMIT) {
        bestSellers = pickWithLimits(bestCandidates, BEST_SELLERS_LIMIT, 99, 99, bestSellers);
      }
    }

    return { featured, bestSellers, bestSignalsCount: bestCandidates.length };
  };

  const render = (products) => {
    const featuredContainer = document.getElementById('nb-featured-brands');
    const bestContainer = document.getElementById('nb-best-sellers');
    const { featured, bestSellers, bestSignalsCount } = buildSelections(products);

    if (featuredContainer) {
      renderList(featured, featuredContainer);
      window.NB_FEATURED_PRODUCTS = featured.map((entry) => entry.product);
      if (typeof window.injectProductSchema === 'function' && window.NB_FEATURED_PRODUCTS.length) {
        window.injectProductSchema(window.NB_FEATURED_PRODUCTS);
      }
    }

    if (bestContainer) {
      const showBest = bestSignalsCount >= BEST_SELLERS_MIN_SIGNALS;
      setSectionVisibility('mas-vendidos', showBest);
      if (showBest) {
        renderList(bestSellers, bestContainer);
      } else {
        bestContainer.innerHTML = '';
      }
    }
  };

  const init = () => {
    loadCatalog()
      .then((products) => {
        if (!Array.isArray(products) || !products.length) {
          showStatus('nbFeaturedStatus', 'No pudimos cargar los destacados en este momento.');
          setSectionVisibility('mas-vendidos', false);
          return;
        }
        render(products);
      })
      .catch(() => {
        showStatus('nbFeaturedStatus', 'No pudimos cargar los destacados en este momento.');
        setSectionVisibility('mas-vendidos', false);
      });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
