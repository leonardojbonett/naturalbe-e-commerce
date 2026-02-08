// Catalogo dinamico Natural Be - fuente unica: /static/data/productos.json
(function () {
  const CATALOG_URLS = [
    '/static/data/productos.json',
    './static/data/productos.json'
  ];
  const DEFAULT_CATALOG_VERSION = '1';
  const FALLBACK_IMAGE = '/static/img/placeholder.webp';

  /*
    Esquema de producto normalizado:
    id, slug, nombre, marca, categoria, subcategoria, presentacion,
    precio, precio_oferta, moneda, es_pack, es_2x1, tags, beneficios_bullet,
    descripcion_corta, descripcion_larga, dosis_recomendada,
    imagen_principal, imagen_principal_webp, disponible, badge, badgeLabel,
    isPopular, isNew, isPack, stock_bajo, rating_value, rating_count, url
  */
  const FALLBACK_PRODUCTS = [
    { id: '1001', slug: 'colageno-hidrolizado-500mg', nombre: 'Colageno Hidrolizado 500mg', marca: 'Natural Be', categoria: 'colageno', precio: 25000, tags: ['piel', 'articulaciones'], descripcion_corta: 'Colageno para piel y articulaciones.' },
    { id: '1002', slug: 'omega-3-1000mg', nombre: 'Omega 3 1000mg', marca: 'Natural Be', categoria: 'omega', precio: 40000, tags: ['corazon', 'cerebro'], descripcion_corta: 'EPA/DHA para salud cardiovascular.' },
    { id: '1003', slug: 'biotina-5000mcg', nombre: 'Biotina 5000mcg', marca: 'Natural Be', categoria: 'vitaminas', precio: 28000, tags: ['cabello', 'unas'], descripcion_corta: 'Biotina para cabello y unas.' },
    { id: '1004', slug: 'magnesio-quelado', nombre: 'Magnesio Quelado', marca: 'Natural Be', categoria: 'minerales', precio: 32000, tags: ['estres', 'sueno'], descripcion_corta: 'Apoyo para relajacion y descanso.' },
    { id: '1005', slug: 'vitamina-c-zinc', nombre: 'Vitamina C + Zinc', marca: 'Natural Be', categoria: 'inmunidad', precio: 30000, tags: ['defensas'], descripcion_corta: 'Refuerzo diario para inmunidad.' },
    { id: '1006', slug: 'ginseng-energia', nombre: 'Ginseng Energia', marca: 'Natural Be', categoria: 'energia', precio: 35000, tags: ['energia', 'rendimiento'], descripcion_corta: 'Energia sostenida para el dia.' },
    { id: '1007', slug: 'multivitaminico-diario', nombre: 'Multivitaminico Diario', marca: 'Natural Be', categoria: 'vitaminas', precio: 45000, tags: ['energia'], descripcion_corta: 'Vitaminas esenciales para la rutina.' },
    { id: '1008', slug: 'omega-3-epa-dha', nombre: 'Omega 3 EPA DHA', marca: 'Natural Be', categoria: 'omega', precio: 42000, tags: ['corazon'], descripcion_corta: 'Soporte cardiovascular premium.' },
    { id: '1009', slug: 'colageno-mas-biotina', nombre: 'Colageno + Biotina', marca: 'Natural Be', categoria: 'colageno', precio: 38000, tags: ['piel', 'cabello'], descripcion_corta: 'Formula para piel y cabello.' },
    { id: '1010', slug: 'zinc-picolinato', nombre: 'Zinc Picolinato', marca: 'Natural Be', categoria: 'minerales', precio: 26000, tags: ['inmunidad'], descripcion_corta: 'Zinc de alta absorcion.' }
  ];

  let catalogPromise = null;

  function normalizeProduct(p) {
    if (!p) return null;
    const price = Number(p.precio || p.price || 0);
    const hasDiscount = p.precio_oferta != null && !isNaN(p.precio_oferta);
    const priceOffer = hasDiscount ? Number(p.precio_oferta) : null;
    const categoria = p.categoria || p.category || 'otros';
    const productId = p.product_id || p.productId || '';
    const slug = p.slug || '';
    const isFile = window.location && window.location.protocol === 'file:';
    const basePath = isFile
      ? './'
      : (window.NB_BASE_PATH || (window.location && window.location.pathname ? window.location.pathname.replace(/[^/]*$/, '/') : '/'));
    const localImage = isFile ? './static/img/placeholder.webp' : `${basePath.replace(/\/?$/, '/') }static/img/placeholder.webp`;
    const normalizeAsset = (src) => {
      if (!src) return '';
      if (/^https?:\/\//i.test(src)) return src;
      if (/^[a-zA-Z]:[\\/]/.test(src)) return src;
      if (isFile && src.startsWith('/')) return `.${src}`;
      if (src.startsWith('//')) return `/${src.replace(/^\/+/, '')}`;
      if (src.startsWith('/')) return src;
      const clean = String(src).replace(/^\.?\//, '');
      return `${basePath}${clean}`;
    };
    const imagenRaw = normalizeAsset(p.imagen_principal || p.image || localImage || '');
    const imagenWebpRaw = normalizeAsset(p.imagen_principal_webp || (/\.(webp)(\?.*)?$/i.test(imagenRaw) ? imagenRaw : '') || '');
    const imagenWebp = /\.webp(\?.*)?$/i.test(imagenWebpRaw) ? imagenWebpRaw : '';
    const imagen = imagenRaw || localImage || '';
    const badgeRaw = (p.badge || '').toString();
    const badgeLower = badgeRaw.toLowerCase();
    const isPopular = !!(p.isPopular || badgeLower.includes('vendido') || badgeLower.includes('popular'));
    const isNew = !!(p.isNew || badgeLower.includes('nuevo'));
    const isPack = !!p.es_pack;
    const packItems = Array.isArray(p.pack_items)
      ? p.pack_items.map(String)
      : (Array.isArray(p.packItems) ? p.packItems.map(String) : []);

    return {
      id: p.id != null ? String(p.id) : '',
      slug: slug,
      nombre: p.nombre || p.name || '',
      marca: p.marca || p.proveedor || 'Natural Be',
      categoria: categoria,
      subcategoria: p.subcategoria || null,
      presentacion: p.presentacion || '',
      precio: price,
      precio_oferta: priceOffer,
      moneda: p.moneda || 'COP',
      es_pack: isPack,
      es_2x1: !!p.es_2x1,
      pack_items: packItems,
      packItems: packItems,
      tags: p.tags || [],
      beneficios_bullet: p.beneficios_bullet || p.beneficios || [],
      descripcion_corta: p.descripcion_corta || p.description || '',
      descripcion_larga: p.descripcion_larga || '',
      dosis_recomendada: p.dosis_recomendada || p.modo_uso || '',
      imagen_principal: imagen,
      imagen_principal_webp: imagenWebp,
      disponible: p.disponible !== false,
      badge: badgeRaw || (isPopular ? 'mas vendido' : null),
      badgeLabel: badgeRaw || (isPopular ? 'Mas vendido' : null),
      isPopular,
      isNew,
      isPack,
      stock_bajo: !!p.stock_bajo,
      seo_title: p.seo_title || '',
      seo_description: p.seo_description || '',
      rating_value: Number(p.rating_value || 0),
      rating_count: Number(p.rating_count || 0),
      url: p.url || p.link || (slug ? `${basePath}product.html?slug=${encodeURIComponent(slug)}` : `${basePath}product.html`),
      product_id: productId,
      // Compatibilidad con codigo existente
      name: p.nombre || p.name || '',
      price: price,
      offerType: p.es_2x1 ? '2x1' : (isPack ? 'pack' : null),
      discountPercent: hasDiscount && price ? Math.max(0, Math.round((1 - priceOffer / price) * 100)) : 0,
      image: imagen,
      description: p.descripcion_corta || p.description || '',
      category: categoria,
      raw: p
    };
  }

  function buildFallbackCatalog() {
    return FALLBACK_PRODUCTS.map(normalizeProduct).filter(Boolean);
  }

  function getCatalogVersion() {
    return window.NB_DATA_VERSION || DEFAULT_CATALOG_VERSION;
  }

  function buildCatalogUrls() {
    const version = getCatalogVersion();
    return CATALOG_URLS.map((url) => `${url}?v=${version}`);
  }

  async function fetchCatalog(urls) {
    let lastError = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
        const payload = await res.json();
        if (!Array.isArray(payload)) throw new Error('Catalog payload is not an array');
        return payload;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Catalog fetch failed');
  }

  async function loadProductsData(options = {}) {
    if (catalogPromise && !options.force) return catalogPromise;
    if (options.force) catalogPromise = null;

    if (window.location && window.location.protocol === 'file:') {
      const fallback = buildFallbackCatalog();
      window.NB_CATALOG_ERROR = true;
      window.NB_CATALOG_SOURCE = 'fallback';
      window.NB_CATALOG_ERROR_MESSAGE = 'Catalogo no disponible en file://';
      window.ALL_PRODUCTS = fallback;
      window.PRODUCTS = fallback;
      window.PRODUCTS_BY_ID = {};
      window.PRODUCTS_BY_SLUG = {};
      fallback.forEach(p => {
        if (p.id) window.PRODUCTS_BY_ID[p.id] = p;
        if (p.slug) window.PRODUCTS_BY_SLUG[p.slug] = p;
      });
      return Promise.resolve(fallback);
    }

    const fetchUrls = buildCatalogUrls();
    catalogPromise = fetchCatalog(fetchUrls)
      .then(list => list.map(normalizeProduct).filter(Boolean))
      .then(normalized => {
        window.NB_CATALOG_ERROR = false;
        window.NB_CATALOG_SOURCE = 'remote';
        window.NB_CATALOG_ERROR_MESSAGE = '';
        window.ALL_PRODUCTS = normalized;
        window.PRODUCTS = normalized; // compat
        window.PRODUCTS_BY_ID = {};
        window.PRODUCTS_BY_SLUG = {};
        normalized.forEach(p => {
          if (p.id) window.PRODUCTS_BY_ID[p.id] = p;
          if (p.slug) window.PRODUCTS_BY_SLUG[p.slug] = p;
        });
        return normalized;
      })
      .catch(err => {
        console.error('Error cargando catalogo', err);
        const fallback = buildFallbackCatalog();
        window.NB_CATALOG_ERROR = true;
        window.NB_CATALOG_SOURCE = 'fallback';
        window.NB_CATALOG_ERROR_MESSAGE = 'No pudimos cargar el catalogo.';
        window.ALL_PRODUCTS = fallback;
        window.PRODUCTS = fallback;
        window.PRODUCTS_BY_ID = {};
        window.PRODUCTS_BY_SLUG = {};
        fallback.forEach(p => {
          if (p.id) window.PRODUCTS_BY_ID[p.id] = p;
          if (p.slug) window.PRODUCTS_BY_SLUG[p.slug] = p;
        });
        return fallback;
      });
    return catalogPromise;
  }

  window.loadProductsData = loadProductsData;
  window.retryCatalogLoad = function() {
    return loadProductsData({ force: true });
  };
  
  // Disparar evento cuando products-data está listo
  window.dispatchEvent(new CustomEvent('ProductsDataReady'));
})();
